import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve(
    process.cwd(),
    "supabase/migrations/20260828000000_workspace_state_v1_events.sql",
  ),
  "utf8",
)
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("workspace_state_v1 events validator", () => {
  it("loosens the live validator without rewriting rows", () => {
    expect(sql).toContain(
      "create or replace function public.workspace_state_v1_is_valid(input jsonb)",
    );
    expect(sql).toContain("'events'");
    expect(sql).toContain("'id', 'type', 'slug', 'at', 'outcome', 'reason', 'usecase', 'alternatives', 'replacementslug', 'revisitat'");
    expect(sql).toContain("started_using");
    expect(sql).toContain("stopped_using");
    expect(sql).toContain("revisit_set");
    expect(sql).toContain("revisited");
    expect(sql).toContain("replacementslug");
    expect(sql).toContain("jsonb_array_length(input->'events') > 200");
    expect(sql).toContain("or key_count > 8");
    expect(sql).not.toContain("or key_count > 7");
    expect(sql).not.toContain("key_count = 7 and not (input ? 'personalstacks')");
    expect(sql).toContain("usage");
    expect(sql).toContain("replacedby");
    expect(sql).toContain("compareobjective");
    expect(sql).not.toContain("drop table");
    expect(sql).not.toContain("delete from viewer_workspaces");
  });
});
