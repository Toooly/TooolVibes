import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, "..", "..");
const fixturePath = resolve(
  repositoryRoot,
  "supabase",
  "fixtures",
  "staging_seed.sql",
);

const requiredTables = new Set([
  "affiliate_links",
  "affiliate_requests",
  "collection_safe_align_events",
  "collection_tool_slots",
  "collection_transition_reviews",
  "collections",
  "editorial_articles",
  "tool_requests",
  "tools",
  "waitlist",
  "viewer_profiles",
  "viewer_tool_states",
  "viewer_workspaces",
]);

function addIssue(issues, code, detail) {
  issues.push(detail ? `${code}:${detail}` : code);
}

async function main() {
  const sql = await readFile(fixturePath, "utf8");
  const issues = [];
  const insertTargets = Array.from(
    sql.matchAll(/\binsert\s+into\s+(?:public\.)?([a-z_][a-z0-9_]*)/gi),
    (match) => match[1].toLowerCase(),
  );
  const uniqueTargets = new Set(insertTargets);

  if (!/^\s*--[\s\S]*?\bbegin\s*;/i.test(sql)) {
    addIssue(issues, "missing-transaction-begin");
  }

  if (!/\bcommit\s*;\s*$/i.test(sql)) {
    addIssue(issues, "missing-transaction-commit");
  }

  for (const target of uniqueTargets) {
    if (!requiredTables.has(target)) {
      addIssue(issues, "unapproved-insert-target", target);
    }
  }

  for (const requiredTable of requiredTables) {
    if (!uniqueTargets.has(requiredTable)) {
      addIssue(issues, "missing-required-table", requiredTable);
    }
  }

  const forbiddenStatement =
    /^\s*(?:alter|create|delete|drop|grant|revoke|truncate|update)\b/gim;
  const forbiddenMetaCommand = /^\s*\\(?:!|connect|copy|include|ir)\b/gim;
  const forbiddenNamespace = /\b(?:auth|storage)\s*\./i;
  const forbiddenCredential =
    /\b(?:SUPABASE_[A-Z0-9_]+|SERVICE_ROLE|PASSWORD|API[_-]?KEY|BEARER\s+[A-Z0-9._-]+|postgres(?:ql)?:\/\/)\b/i;
  const nonDeterministicValue =
    /\b(?:current_date|current_timestamp|gen_random_uuid|now)\s*(?:\(\s*\))?/i;

  if (forbiddenStatement.test(sql)) {
    addIssue(issues, "forbidden-top-level-statement");
  }

  if (forbiddenMetaCommand.test(sql)) {
    addIssue(issues, "forbidden-psql-meta-command");
  }

  if (forbiddenNamespace.test(sql)) {
    addIssue(issues, "forbidden-managed-namespace");
  }

  if (forbiddenCredential.test(sql)) {
    addIssue(issues, "credential-or-connection-pattern");
  }

  if (nonDeterministicValue.test(sql)) {
    addIssue(issues, "non-deterministic-value");
  }

  const emails = Array.from(
    sql.matchAll(/[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9.-]+\.[a-z]{2,}/gi),
    (match) => match[0].toLowerCase(),
  );

  for (const email of emails) {
    if (!email.endsWith("@example.invalid")) {
      addIssue(issues, "non-fixture-email");
    }
  }

  const urls = Array.from(
    sql.matchAll(/https?:\/\/[^\s'")]+/gi),
    (match) => match[0],
  );

  for (const value of urls) {
    let hostname;

    try {
      hostname = new URL(value).hostname.toLowerCase();
    } catch {
      addIssue(issues, "invalid-url");
      continue;
    }

    if (hostname !== "example.invalid" && !hostname.endsWith(".example.invalid")) {
      addIssue(issues, "non-fixture-url");
    }
  }

  if (!sql.includes("'fixture-local-viewer-token'")) {
    addIssue(issues, "missing-known-fake-viewer-token");
  }

  if (issues.length > 0) {
    process.stderr.write(
      `Fixture non sicura: ${Array.from(new Set(issues)).sort().join(", ")}\n`,
    );
    process.exitCode = 1;
    return;
  }

  process.stdout.write(
    `Fixture valida: ${uniqueTargets.size} tabelle, ${insertTargets.length} insert, ${emails.length} email .invalid, ${urls.length} URL .invalid.\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `Fixture non verificata: ${error instanceof Error ? error.message : "errore sconosciuto"}\n`,
  );
  process.exitCode = 1;
});
