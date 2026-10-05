import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { createEmptyWorkspaceState } from "@/lib/discovery/workspace-contract";

function latestWorkspaceStateV1MigrationPath() {
  const dir = resolve(process.cwd(), "supabase/migrations");
  const files = readdirSync(dir)
    .filter(
      (name) => name.includes("workspace_state_v1") && name.endsWith(".sql"),
    )
    .sort();
  const latest = files.at(-1);
  if (!latest) {
    throw new Error("No workspace_state_v1 migrations found.");
  }
  return resolve(dir, latest);
}

function parseRootAllowList(sql: string): string[] {
  const keyCountIdx = sql.indexOf(
    "select count(*) into key_count from jsonb_object_keys(input)",
  );
  if (keyCountIdx < 0) {
    throw new Error("Could not find workspace_state_v1 root key_count check.");
  }
  const notInIdx = sql.indexOf("not in (", keyCountIdx);
  const openIdx = sql.indexOf("(", notInIdx);
  const closeIdx = sql.indexOf(")", openIdx);
  if (notInIdx < 0 || openIdx < 0 || closeIdx < 0) {
    throw new Error("Could not find workspace_state_v1 root allow-list.");
  }
  return [...sql.slice(openIdx, closeIdx + 1).matchAll(/'([^']+)'/g)].map(
    (match) => match[1],
  );
}

describe("workspace_state_v1 empty payload contract", () => {
  it("keeps createEmptyWorkspaceState keys inside the latest SQL allow-list", () => {
    const sql = readFileSync(latestWorkspaceStateV1MigrationPath(), "utf8");
    const allowList = parseRootAllowList(sql);
    const empty = createEmptyWorkspaceState();
    const keys = Object.keys(empty);

    expect(keys).toContain("events");
    expect(empty.events).toEqual([]);
    expect(keys).toContain("radarWatch");
    expect(empty.radarWatch).toEqual({ slugs: [], categories: [], updatedAt: null });
    expect(allowList).toEqual(
      expect.arrayContaining([
        "schemaVersion",
        "clearedAt",
        "saved",
        "compare",
        "stack",
        "toolStates",
        "personalStacks",
        "events",
        "radarWatch",
      ]),
    );
    expect(keys.every((key) => allowList.includes(key))).toBe(true);
    expect(keys).toHaveLength(9);
    expect(sql.toLowerCase()).toContain("or key_count > 9");
    expect(sql.toLowerCase()).not.toContain("or key_count > 8");
  });
});
