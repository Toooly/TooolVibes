import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migrationPath = resolve(
  process.cwd(),
  "supabase/migrations/20260716000003_harden_public_submissions_and_game_rpc.sql",
);
const sql = readFileSync(migrationPath, "utf8")
  .replace(/\s+/g, " ")
  .toLowerCase();

describe("SEC-105 public submission and gamification migration", () => {
  it("denies anon/auth direct inserts and exposes service-only submission RPCs", () => {
    expect(sql).toContain(
      "revoke all privileges on table public.tool_requests from public, anon, authenticated",
    );
    expect(sql).toContain(
      "revoke all privileges on table public.affiliate_requests from public, anon, authenticated",
    );
    expect(sql).toContain(
      'drop policy if exists "anyone can submit tool requests"',
    );
    expect(sql).toContain(
      'drop policy if exists "anyone can submit affiliate requests"',
    );
    expect(sql).toContain("function public.submit_tool_request(");
    expect(sql).toContain("function public.submit_affiliate_request(");
    expect(sql).toContain("to service_role");
    expect(sql).toContain("from public, anon, authenticated");
    expect(sql).toContain(
      "revoke insert on table public.tool_requests from service_role",
    );
    expect(sql).toContain(
      "revoke insert on table public.affiliate_requests from service_role",
    );
  });

  it("keeps request status/admin fields server-controlled", () => {
    const toolFunction = sql.slice(
      sql.indexOf("function public.submit_tool_request("),
      sql.indexOf("alter table public.affiliate_requests"),
    );
    const affiliateFunction = sql.slice(
      sql.indexOf("function public.submit_affiliate_request("),
      sql.indexOf("drop policy if exists \"users can update own profile\""),
    );

    expect(toolFunction).not.toContain("p_status");
    expect(toolFunction).not.toContain("p_admin_notes");

    expect(affiliateFunction).not.toContain("p_status");
    expect(affiliateFunction).not.toContain("p_admin_notes");
  });

  it("rejects null required values inside the security-definer boundary", () => {
    expect(sql).toContain("if p_tool_name is null or char_length(btrim(p_tool_name)) not between 2 and 120");
    expect(sql).toContain("if p_tool_url is null or char_length(btrim(p_tool_url)) > 2048");
    expect(sql).toContain("if p_category is null or char_length(btrim(p_category)) not between 2 and 80");
    expect(sql).toContain("if p_first_name is null or p_last_name is null");
    expect(sql).toContain("if normalized_email is null or char_length(normalized_email) > 254");
    expect(sql).toContain(
      "or p_message is null or char_length(btrim(p_message)) not between 12 and 4000",
    );
  });

  it("removes arbitrary profile writes and creates profiles from auth.uid()", () => {
    expect(sql).toContain(
      "revoke insert, update, delete on table public.game_profiles from public, anon, authenticated",
    );
    expect(sql).toContain("function public.get_or_create_game_profile()");
    expect(sql).toContain("authenticated_user_id uuid := auth.uid()");
    expect(sql).toContain(
      "insert into public.game_profiles (user_id) values (authenticated_user_id)",
    );
    expect(sql).toContain(
      "grant execute on function public.get_or_create_game_profile() to authenticated",
    );
  });

  it("rejects forged user IDs in authenticated claim RPCs", () => {
    expect(sql.match(/if p_user_id is distinct from authenticated_user_id/g)).toHaveLength(2);
    expect(sql).toContain("function public.claim_mission(");
    expect(sql).toContain("function public.claim_hidden_signal(");
    expect(sql).toContain(
      "revoke all on function public.claim_mission(uuid, uuid) from public, anon, service_role",
    );
    expect(sql).toContain(
      "revoke all on function public.claim_hidden_signal(uuid, date, text, text) from public, anon, service_role",
    );
  });

  it("preserves reward values while generic reward RPCs stay service-only", () => {
    expect(sql).toContain("mission.xp_reward");
    expect(sql).toContain(
      "public.record_game_interaction(authenticated_user_id, 25)",
    );
    expect(sql).toContain(
      "revoke all on function public.record_game_interaction(uuid, integer) from public, anon, authenticated",
    );
    expect(sql).toContain(
      "revoke all on function public.award_badges(uuid, uuid[]) from public, anon, authenticated",
    );
  });
});
