import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..", "..");
const migrationsDirectory = resolve(repositoryRoot, "supabase", "migrations");
const migrationHistoryPath = resolve(
  migrationsDirectory,
  "migration-history.json",
);

const configPath = resolve(repositoryRoot, "supabase", "config.toml");
const fixturePath = resolve(
  repositoryRoot,
  "supabase",
  "fixtures",
  "staging_seed.sql",
);
const reportOnly = process.argv.includes("--report");

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function describeFile(path, name) {
  const [content, metadata] = await Promise.all([readFile(path), stat(path)]);
  const normalizedContent = content.toString("utf8").replace(/\r\n/g, "\n");

  return {
    file: name,
    bytes: metadata.size,
    sha256: sha256(content),
    sha256_lf: sha256(normalizedContent),
  };
}

function isSha256(value) {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function validateMigrationHistory(history, migrations, migrationNames, issues) {
  if (!history || typeof history !== "object" || Array.isArray(history)) {
    issues.push({ code: "invalid-migration-history" });
    return;
  }

  const migrationByFile = new Map(
    migrations.map((migration) => [migration.file, migration]),
  );
  const requiredFiles = [
    history.canonical_file,
    history.renamed_file,
    history.reconciliation_file,
  ];

  if (history.format_version !== 1 || history.repair_id !== "SEC-102-0023") {
    issues.push({ code: "unsupported-migration-history-format" });
  }

  if (history.legacy_version !== "0023") {
    issues.push({ code: "invalid-legacy-migration-version" });
  }

  for (const file of requiredFiles) {
    if (typeof file !== "string" || !migrationByFile.has(file)) {
      issues.push({
        code: "migration-history-file-missing",
        files: typeof file === "string" ? [file] : [],
      });
    }
  }

  const canonical = migrationByFile.get(history.canonical_file);
  const renamed = migrationByFile.get(history.renamed_file);
  const reconciliation = migrationByFile.get(history.reconciliation_file);

  if (canonical && canonical.version !== history.legacy_version) {
    issues.push({
      code: "canonical-migration-version-mismatch",
      files: [canonical.file],
    });
  }

  if (
    canonical &&
    renamed &&
    reconciliation &&
    !(canonical.version < renamed.version && renamed.version < reconciliation.version)
  ) {
    issues.push({ code: "migration-repair-order-invalid", files: requiredFiles });
  }

  if (!Array.isArray(history.legacy_candidates) || history.legacy_candidates.length !== 2) {
    issues.push({ code: "legacy-migration-candidates-invalid" });
  } else {
    for (const candidate of history.legacy_candidates) {
      const current = migrationByFile.get(candidate.current_file);

      if (!current || !isSha256(candidate.sha256_lf)) {
        issues.push({
          code: "legacy-migration-candidate-invalid",
          files: typeof candidate.current_file === "string" ? [candidate.current_file] : [],
        });
        continue;
      }

      if (current.sha256_lf !== candidate.sha256_lf) {
        issues.push({
          code: "legacy-migration-checksum-mismatch",
          files: [current.file],
        });
      }

      if (
        candidate.legacy_file !== candidate.current_file &&
        migrationNames.includes(candidate.legacy_file)
      ) {
        issues.push({
          code: "retired-legacy-migration-present",
          files: [candidate.legacy_file],
        });
      }
    }
  }

  if (
    reconciliation &&
    (!isSha256(history.reconciliation_sha256_lf) ||
      reconciliation.sha256_lf !== history.reconciliation_sha256_lf)
  ) {
    issues.push({
      code: "reconciliation-migration-checksum-mismatch",
      files: reconciliation ? [reconciliation.file] : [],
    });
  }
}

async function main() {
  const names = (await readdir(migrationsDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right, "en"));
  const issues = [];
  const versions = new Map();
  const migrations = [];
  let migrationHistory = null;
  let migrationHistoryFile;

  for (const name of names) {
    const match = /^(\d+)_([a-z0-9][a-z0-9_]*)\.sql$/i.exec(name);

    if (!match) {
      issues.push({
        code: "invalid-migration-name",
        files: [name],
      });
      continue;
    }

    const version = match[1];
    const versionFiles = versions.get(version) ?? [];
    versionFiles.push(name);
    versions.set(version, versionFiles);

    migrations.push({
      version,
      ...(await describeFile(resolve(migrationsDirectory, name), name)),
    });
  }

  for (const [version, files] of versions) {
    if (files.length > 1) {
      issues.push({
        code: "duplicate-migration-version",
        version,
        files,
      });
    }
  }

  try {
    const [historyContent, historyDescription] = await Promise.all([
      readFile(migrationHistoryPath, "utf8"),
      describeFile(
        migrationHistoryPath,
        "supabase/migrations/migration-history.json",
      ),
    ]);
    migrationHistory = JSON.parse(historyContent);
    migrationHistoryFile = historyDescription;
    validateMigrationHistory(migrationHistory, migrations, names, issues);
  } catch (error) {
    issues.push({
      code: "migration-history-unreadable",
      message: error instanceof Error ? error.message : "unknown error",
    });
  }

  const [config, fixture] = await Promise.all([
    describeFile(configPath, "supabase/config.toml"),
    describeFile(fixturePath, "supabase/fixtures/staging_seed.sql"),
  ]);

  const manifest = {
    format_version: 1,
    status: issues.length === 0 ? "ok" : "blocked",
    migration_count: migrations.length,
    migrations,
    local_config: config,
    staging_fixture: fixture,
    migration_history: migrationHistory
      ? {
          file: migrationHistoryFile,
          repair_id: migrationHistory.repair_id,
          legacy_version: migrationHistory.legacy_version,
          canonical_file: migrationHistory.canonical_file,
          renamed_file: migrationHistory.renamed_file,
          reconciliation_file: migrationHistory.reconciliation_file,
          accepted_remote_states: migrationHistory.accepted_remote_states,
          policy: migrationHistory.policy,
        }
      : null,
    issues,
  };

  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);

  if (issues.length > 0 && !reportOnly) {
    process.stderr.write(
      "Manifest bloccato: correggere le anomalie migration prima di un reset o restore.\n",
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(
    `Manifest non generato: ${error instanceof Error ? error.message : "errore sconosciuto"}\n`,
  );
  process.exitCode = 1;
});
