import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260816220000_workspace_state_v1_personal_stacks.sql",
  ),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("workspace_state_v1 personal stacks validator", () => {
  it("loosens the live validator without rewriting rows", () => {
    expect(sql).toContain(
      "create or replace function public.workspace_state_v1_is_valid(input jsonb)",
    );
    expect(sql).toContain("personalstacks");
    expect(sql).toContain("usecase");
    expect(sql).toContain("alternatives");
    expect(sql).toContain("revisitat");
    expect(sql).not.toContain("drop table");
    expect(sql).not.toContain("delete from public.viewer_workspaces");
  });
});
