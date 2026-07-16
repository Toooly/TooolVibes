import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..", "..");
const migrationsDirectory = resolve(repositoryRoot, "supabase", "migrations");
const historyPath = resolve(migrationsDirectory, "migration-history.json");

function sha256Lf(content) {
  return createHash("sha256")
    .update(content.replace(/\r\n/g, "\n"))
    .digest("hex");
}

function migrationVersion(file) {
  const match = /^(\d+)_/.exec(file);
  assert.ok(match, `Invalid migration file name: ${file}`);
  return match[1];
}

async function readMigration(file) {
  return readFile(resolve(migrationsDirectory, file), "utf8");
}

async function main() {
  const history = JSON.parse(await readFile(historyPath, "utf8"));
  const files = [
    history.canonical_file,
    history.renamed_file,
    history.reconciliation_file,
  ];
  const versions = files.map(migrationVersion);

  assert.equal(history.format_version, 1);
  assert.equal(history.repair_id, "SEC-102-0023");
  assert.deepEqual(
    [...new Set(versions)],
    versions,
    "Repair migration versions must be unique",
  );
  assert.ok(
    versions[0] < versions[1] && versions[1] < versions[2],
    "Repair migrations must be ordered canonical -> renamed -> reconciliation",
  );

  for (const candidate of history.legacy_candidates) {
    const content = await readMigration(candidate.current_file);
    assert.equal(
      sha256Lf(content),
      candidate.sha256_lf,
      `${candidate.current_file} no longer matches its immutable legacy effect`,
    );
  }

  const reconciliation = await readMigration(history.reconciliation_file);
  assert.equal(
    sha256Lf(reconciliation),
    history.reconciliation_sha256_lf,
    "Reconciliation migration changed without updating the reviewed history map",
  );

  const requiredRepairStatements = [
    "create table if not exists public.editorial_articles",
    "add column if not exists submitter_type",
    "on conflict (id) do update",
    "missing_editorial_columns",
    "missing_request_columns",
    "editorial-media bucket missing",
  ];

  for (const statement of requiredRepairStatements) {
    assert.ok(
      reconciliation.includes(statement),
      `Reconciliation migration is missing: ${statement}`,
    );
  }

  const acceptedStates = new Set(
    history.accepted_remote_states.map(({ state }) => state),
  );
  assert.deepEqual(
    acceptedStates,
    new Set(["0023-editorial", "0023-founder-flow", "0023-unapplied"]),
    "Every known legacy 0023 state must have an explicit upgrade path",
  );

  const legacyRecorded = new Set([history.legacy_version]);
  const pendingAfterAmbiguous0023 = versions.filter(
    (version) => !legacyRecorded.has(version),
  );
  assert.deepEqual(
    pendingAfterAmbiguous0023,
    [migrationVersion(history.renamed_file), migrationVersion(history.reconciliation_file)],
    "Either legacy 0023 effect must converge through renamed + reconciliation",
  );

  process.stdout.write(
    "Migration history checks passed: 0023 has a unique forward-only repair path.\n",
  );
  process.stdout.write(
    "Database execution is still required for fresh, snapshot-upgrade, and schema-diff evidence.\n",
  );
}

main().catch((error) => {
  process.stderr.write(
    `Migration history check failed: ${error instanceof Error ? error.message : "unknown error"}\n`,
  );
  process.exitCode = 1;
});
