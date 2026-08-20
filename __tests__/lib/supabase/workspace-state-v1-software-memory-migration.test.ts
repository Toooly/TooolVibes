import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260820000000_workspace_state_v1_software_memory.sql",
  ),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("workspace_state_v1 software memory validator", () => {
  it("loosens the live validator without rewriting rows", () => {
    expect(sql).toContain(
      "create or replace function public.workspace_state_v1_is_valid(input jsonb)",
    );
    expect(sql).toContain("usage");
    expect(sql).toContain("replacedby");
    expect(sql).toContain("compareobjective");
    expect(sql).not.toContain("drop table");
    expect(sql).not.toContain("delete from viewer_workspaces");
  });
});
