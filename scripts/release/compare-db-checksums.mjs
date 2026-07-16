import { readFile, stat } from "node:fs/promises";

const MAX_CHECKSUM_FILE_BYTES = 2 * 1024 * 1024;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const signatureKeys = [
  "schema_sha256",
  "constraints_sha256",
  "indexes_sha256",
  "policies_sha256",
  "functions_sha256",
  "triggers_sha256",
  "rls_sha256",
  "storage_sha256",
];
const expectedTables = [
  "affiliate_links",
  "affiliate_requests",
  "arena_battles",
  "badges",
  "collection_safe_align_events",
  "collection_tool_slots",
  "collection_transition_reviews",
  "collections",
  "editorial_articles",
  "game_mission_claims",
  "game_missions",
  "game_profiles",
  "hidden_signal_claims",
  "leaderboard_snapshots",
  "radar_predictions",
  "tool_collections",
  "tool_requests",
  "tools",
  "user_badges",
  "viewer_profiles",
  "viewer_tool_states",
  "viewer_workspaces",
];
const rootKeys = new Set(["format_version", ...signatureKeys, "tables"]);

function validateChecksum(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label}: root non valido`);
  }

  const keys = Object.keys(value);
  const unexpectedKeys = keys.filter((key) => !rootKeys.has(key));
  const missingKeys = Array.from(rootKeys).filter((key) => !(key in value));

  if (unexpectedKeys.length || missingKeys.length) {
    throw new Error(`${label}: contratto root non valido`);
  }

  if (value.format_version !== 1) {
    throw new Error(`${label}: format_version non supportato`);
  }

  for (const key of signatureKeys) {
    if (typeof value[key] !== "string" || !SHA256_PATTERN.test(value[key])) {
      throw new Error(`${label}: firma ${key} non valida`);
    }
  }

  if (!Array.isArray(value.tables)) {
    throw new Error(`${label}: elenco tabelle non valido`);
  }

  const normalizedTables = value.tables.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      throw new Error(`${label}: entry tabella non valida`);
    }

    const entryKeys = Object.keys(entry).sort();

    if (entryKeys.join(",") !== "row_count,row_sha256,table") {
      throw new Error(`${label}: contratto entry tabella non valido`);
    }

    if (typeof entry.table !== "string") {
      throw new Error(`${label}: nome tabella non valido`);
    }

    if (
      typeof entry.row_count !== "number" ||
      !Number.isSafeInteger(entry.row_count) ||
      entry.row_count < 0
    ) {
      throw new Error(`${label}: row_count non valido`);
    }

    if (
      typeof entry.row_sha256 !== "string" ||
      !SHA256_PATTERN.test(entry.row_sha256)
    ) {
      throw new Error(`${label}: digest riga non valido`);
    }

    return {
      table: entry.table,
      row_count: entry.row_count,
      row_sha256: entry.row_sha256,
    };
  });

  normalizedTables.sort((left, right) => left.table.localeCompare(right.table, "en"));
  const names = normalizedTables.map((entry) => entry.table);

  if (new Set(names).size !== names.length) {
    throw new Error(`${label}: tabella duplicata`);
  }

  if (names.join(",") !== [...expectedTables].sort().join(",")) {
    throw new Error(`${label}: inventario tabelle incompleto o inatteso`);
  }

  return {
    format_version: 1,
    ...Object.fromEntries(signatureKeys.map((key) => [key, value[key]])),
    tables: normalizedTables,
  };
}

function differencePaths(left, right) {
  const differences = [];

  for (const key of signatureKeys) {
    if (left[key] !== right[key]) {
      differences.push(key);
    }
  }

  for (let index = 0; index < left.tables.length; index += 1) {
    const leftTable = left.tables[index];
    const rightTable = right.tables[index];

    if (leftTable.table !== rightTable.table) {
      differences.push("tables.inventory");
      continue;
    }

    if (leftTable.row_count !== rightTable.row_count) {
      differences.push(`tables.${leftTable.table}.row_count`);
    }

    if (leftTable.row_sha256 !== rightTable.row_sha256) {
      differences.push(`tables.${leftTable.table}.row_sha256`);
    }
  }

  return differences;
}

async function readChecksum(path, label) {
  const metadata = await stat(path);

  if (!metadata.isFile() || metadata.size > MAX_CHECKSUM_FILE_BYTES) {
    throw new Error(`${label}: file assente, non regolare o troppo grande`);
  }

  const content = (await readFile(path, "utf8")).trim();
  let parsed;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`${label}: JSON non valido`);
  }

  return validateChecksum(parsed, label);
}

function buildSelfTestChecksum() {
  const digest = "a".repeat(64);

  return {
    format_version: 1,
    ...Object.fromEntries(signatureKeys.map((key) => [key, digest])),
    tables: expectedTables.map((table) => ({
      table,
      row_count: 0,
      row_sha256: digest,
    })),
  };
}

function runSelfTest() {
  const source = validateChecksum(buildSelfTestChecksum(), "self-test-source");
  const identical = validateChecksum(
    structuredClone(buildSelfTestChecksum()),
    "self-test-target",
  );

  if (differencePaths(source, identical).length !== 0) {
    throw new Error("self-test: falso mismatch");
  }

  const changedValue = structuredClone(buildSelfTestChecksum());
  changedValue.tables[0].row_count = 1;
  const changed = validateChecksum(changedValue, "self-test-changed");

  if (differencePaths(source, changed).length === 0) {
    throw new Error("self-test: mismatch non rilevato");
  }

  process.stdout.write("Comparatore checksum: self-test superato.\n");
}

async function main() {
  if (process.argv.includes("--self-test")) {
    runSelfTest();
    return;
  }

  const paths = process.argv.slice(2);

  if (paths.length !== 2) {
    throw new Error(
      "uso: node scripts/release/compare-db-checksums.mjs <source.json> <restored.json>",
    );
  }

  const [source, restored] = await Promise.all([
    readChecksum(paths[0], "source"),
    readChecksum(paths[1], "restored"),
  ]);
  const differences = differencePaths(source, restored);

  if (differences.length > 0) {
    process.stderr.write(
      `Checksum incompatibili (${differences.length}): ${differences
        .slice(0, 20)
        .join(", ")}\n`,
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Checksum compatibili: ${source.tables.length} tabelle e ${signatureKeys.length} firme strutturali.\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `Confronto checksum fallito: ${error instanceof Error ? error.message : "errore sconosciuto"}\n`,
  );
  process.exitCode = 1;
});
