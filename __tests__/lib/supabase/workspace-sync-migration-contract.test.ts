import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260717000000_harden_workspace_state_v1_sync.sql",
);
const sql = readFileSync(migrationPath, "utf8")
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("DATA-206 workspace sync forward-fix migration", () => {
  it("backfills untouched compare-only legacy workspaces without replacing canonical writes", () => {
    const validatorIndex = sql.indexOf(
      "create or replace function public.workspace_state_v1_is_valid(input jsonb)",
    );
    const backfill = sql.slice(
      sql.indexOf("update public.viewer_workspaces as workspace", validatorIndex),
      sql.indexOf("alter table public.viewer_workspaces", validatorIndex),
    );

    expect(backfill).toContain(
      "where coalesce(array_length(workspace.compare_slugs, 1), 0) > 0",
    );
    expect(backfill).toContain("workspace.revision = 0");
    expect(backfill).toContain("workspace.last_operation_id is null");
    expect(backfill).not.toContain("to_jsonb(workspace.compare_slugs)");
    expect(backfill).toContain("from unnest(workspace.compare_slugs)");
    expect(backfill).toContain(
      "and btrim(item.slug) ~ '^[a-z0-9]+(-[a-z0-9]+)*$'",
    );
    expect(backfill).toContain("'updatedat', workspace.compare_updated_at");
    expect(backfill).toContain("revision = greatest(workspace.revision, 1)");
    expect(backfill).toContain("and not exists (");
    expect(backfill).toContain("from public.viewer_tool_states as tool_state");
    expect(backfill).toContain(
      "where tool_state.viewer_id = workspace.viewer_id",
    );
    expect(backfill).toContain(
      "workspace.workspace_state = '{\"schemaversion\":1,\"clearedat\":null",
    );
  });

  it("normalizes invalid legacy compare values before replacing the live validator", () => {
    const validatorIndex = sql.indexOf(
      "create or replace function public.workspace_state_v1_is_valid(input jsonb)",
    );
    const cleanup = sql.slice(0, validatorIndex);

    expect(cleanup).toContain("with normalized_compare as (");
    expect(cleanup).toContain("jsonb_array_elements(");
    expect(cleanup).toContain("group by btrim(item.value #>> '{}')");
    expect(cleanup).toContain("limit 5");
    expect(cleanup).toContain(
      "btrim(item.value #>> '{}') ~ '^[a-z0-9]+(-[a-z0-9]+)*$'",
    );
    expect(cleanup).toContain("is distinct from normalized_compare.slugs");
  });

  it("makes the validator fail closed and requires the complete strict root and list shape", () => {
    const validatorStart = sql.indexOf(
      "create or replace function public.workspace_state_v1_is_valid(input jsonb)",
    );
    const validator = sql.slice(
      validatorStart,
      sql.indexOf("update public.viewer_workspaces as workspace", validatorStart),
    );

    expect(validator).toContain("language plpgsql");
    expect(validator).toContain(
      "(select count(*) from jsonb_object_keys(input)) <> 6",
    );
    expect(validator).toContain(
      "input ?& array[ 'schemaversion', 'clearedat', 'saved', 'compare', 'stack', 'toolstates' ]",
    );
    expect(validator).toContain("input->'schemaversion' <> '1'::jsonb");
    expect(validator).toContain(
      "foreach list_name in array array['saved', 'compare', 'stack']",
    );
    expect(validator).toContain(
      "(select count(*) from jsonb_object_keys(list_value)) <> 2",
    );
    expect(validator).toContain(
      "list_value ?& array['slugs', 'updatedat']",
    );
    expect(validator).toContain(
      "jsonb_array_length(list_value->'slugs') > 5",
    );
    expect(validator).toContain(
      "list_name <> 'compare' and jsonb_array_length(list_value->'slugs') > 500",
    );
    expect(validator).toContain(
      "(select count(*) from jsonb_object_keys(input->'toolstates')) > 500",
    );
    expect(validator).toContain(
      "if list_count <> distinct_list_count then return false",
    );
    expect(validator).toContain("exception when others then return false");
  });

  it("requires complete tool-state and decision objects instead of accepting partial payloads", () => {
    expect(sql).toContain(
      "(select count(*) from jsonb_object_keys(tool_state)) <> 6",
    );
    expect(sql).toContain(
      "tool_state ?& array[ 'stage', 'note', 'savereason', 'pinned', 'decision', 'updatedat' ]",
    );
    expect(sql).toContain(
      "(tool_state->>'stage') not in ('saved', 'review', 'top')",
    );
    expect(sql).toContain(
      "char_length(btrim(tool_state->>'note')) not between 1 and 2000",
    );
    expect(sql).toContain(
      "(select count(*) from jsonb_object_keys(decision_state)) <> 2",
    );
    expect(sql).not.toContain("jsonb_object_length");
    expect(sql).toContain(
      "decision_state ?& array['outcome', 'updatedat']",
    );
    expect(sql).toContain(
      "(decision_state->>'outcome') not in ( 'selected', 'rejected', 'deferred' )",
    );
    expect(sql).toContain(
      "check (public.workspace_state_v1_is_valid(workspace_state) is true) not valid",
    );
    expect(sql).toContain(
      "validate constraint viewer_workspaces_workspace_state_v1_check",
    );
  });

  it("normalizes whitespace-only legacy notes before validating the strict constraint", () => {
    const cleanupIndex = sql.indexOf(
      "update public.viewer_workspaces as workspace set workspace_state = jsonb_set",
      sql.indexOf("contained legacy compare data"),
    );
    const validateIndex = sql.indexOf(
      "validate constraint viewer_workspaces_workspace_state_v1_check",
    );

    expect(cleanupIndex).toBeGreaterThan(-1);
    expect(cleanupIndex).toBeLessThan(validateIndex);
    expect(sql.slice(cleanupIndex, validateIndex)).toContain(
      "and btrim(item.value->>'note') = '' then jsonb_set(item.value, '{note}', 'null'::jsonb, true)",
    );
  });

  it("keeps the sync RPC service-role only", () => {
    expect(sql).not.toContain(
      "create or replace function public.sync_viewer_workspace_v1",
    );
    expect(sql).toContain(
      "revoke all on function public.sync_viewer_workspace_v1(uuid, jsonb, bigint, uuid) from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.sync_viewer_workspace_v1(uuid, jsonb, bigint, uuid) to service_role",
    );
    expect(sql).toContain(
      "revoke all on function public.workspace_state_v1_is_valid(jsonb) from public, anon, authenticated",
    );
    expect(sql).toContain(
      "grant execute on function public.workspace_state_v1_is_valid(jsonb) to service_role",
    );
  });

  it("prevents authenticated clients from bypassing the canonical API boundary", () => {
    expect(sql).toContain(
      "drop policy if exists \"authenticated users can manage own viewer workspace\" on public.viewer_workspaces",
    );
    expect(sql).toContain(
      "drop policy if exists \"authenticated users can manage own viewer tool states\" on public.viewer_tool_states",
    );
    expect(sql).toContain(
      "revoke all privileges on table public.viewer_workspaces from anon, authenticated",
    );
    expect(sql).toContain(
      "revoke all privileges on table public.viewer_tool_states from anon, authenticated",
    );
  });
});
