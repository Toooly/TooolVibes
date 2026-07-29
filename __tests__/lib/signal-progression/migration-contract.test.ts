import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sql = fs
  .readFileSync(
    path.join(
      process.cwd(),
      "supabase/migrations/20260730000001_signal_progression_backbone.sql",
    ),
    "utf8",
  )
  .replace(/\s+/g, " ")
  .toLowerCase();

function between(subject: string, start: string, end: string) {
  const i = subject.indexOf(start.toLowerCase());
  if (i < 0) return "";
  const j = subject.indexOf(end.toLowerCase(), i + start.length);
  return j < 0 ? subject.slice(i) : subject.slice(i, j + end.length);
}

describe("signal progression migration contract", () => {
  // -------------------------------------------------------------------------
  // Tables
  // -------------------------------------------------------------------------
  it("creates four additive signal tables with proper constraints", () => {
    expect(sql).toContain("create table if not exists");
    expect(sql).toMatch(/signal_engagement_events_type_check/);
    expect(sql).toMatch(/signal_engagement_events_dedupe_check/);
    expect(sql).toMatch(/signal_engagement_events_source_check/);
    expect(sql).toMatch(/signal_engagement_events_context_object/);
    expect(sql).toMatch(/signal_engagement_events_user_dedupe_unique/);
    expect(sql).toMatch(/signal_reward_grants_sp_delta_check/);
    expect(sql).toMatch(/signal_reward_grants_balance_check/);
    expect(sql).toMatch(/signal_reward_grants_tier_check/);
    expect(sql).toMatch(/signal_reward_grants_event_unique/);
    expect(sql).toMatch(/signal_reward_deliveries_status_check/);
  });

  it("enforces dedupe UNIQUE constraint on events", () => {
    expect(sql).toMatch(
      /unique\s*\(user_id\s*,\s*dedupe_key\)/,
    );
  });

  it("enforces grant-event relationship with foreign keys and unique constraint", () => {
    expect(sql).toMatch(/references\s+public\.signal_engagement_events/);
    expect(sql).toMatch(/references\s+public\.signal_reward_grants/);
    expect(sql).toContain("unique (engagement_event_id)");
  });

  it("references existing tables without breaking them", () => {
    expect(sql).toContain("references auth.users(id) on delete cascade");
    expect(sql).toContain("game_profiles");
    expect(sql).toContain("public.calculate_level");
  });

  // -------------------------------------------------------------------------
  // RLS
  // -------------------------------------------------------------------------
  it("enables RLS on all four signal tables", () => {
    for (const table of [
      "signal_engagement_events",
      "signal_reward_grants",
      "signal_reward_deliveries",
      "signal_reward_preferences",
    ]) {
      expect(sql).toContain(
        `alter table public.${table} enable row level security`,
      );
      expect(sql).toContain(
        `alter table public.${table} force row level security`,
      );
    }
  });

  it("allows authenticated read-only self access", () => {
    for (const table of [
      "signal_engagement_events",
      "signal_reward_grants",
      "signal_reward_deliveries",
      "signal_reward_preferences",
    ]) {
      expect(sql).toContain(`using (auth.uid() = user_id)`);
      expect(sql).toContain(
        `grant select on table public.${table} to authenticated`,
      );
    }
  });

  it("revokes direct write access from every non-service role", () => {
    for (const table of [
      "signal_engagement_events",
      "signal_reward_grants",
      "signal_reward_deliveries",
      "signal_reward_preferences",
    ]) {
      expect(sql).toContain(
        `revoke all on table public.${table} from public, anon, authenticated`,
      );
    }
  });

  it("grants full write to service_role only", () => {
    for (const table of [
      "signal_engagement_events",
      "signal_reward_grants",
      "signal_reward_deliveries",
      "signal_reward_preferences",
    ]) {
      expect(sql).toContain(
        `grant all on table public.${table} to service_role`,
      );
    }
  });

  // -------------------------------------------------------------------------
  // RPC: accept_signal_engagement
  // -------------------------------------------------------------------------
  it("defines accept_signal_engagement as SECURITY DEFINER with safe search_path", () => {
    const fn = between(sql, "accept_signal_engagement", "comment on function");
    expect(fn).toContain("security definer");
    expect(fn).toContain("set search_path = ''");
  });

  it("revokes accept_signal_engagement from non-service roles", () => {
    const revokeSection = between(sql, "revoke all on function public.accept_signal_engagement", "comment on");
    expect(revokeSection).toContain("from public, anon, authenticated");
    expect(sql).toMatch(
      /grant execute on function public\.accept_signal_engagement\([\s\S]*?\) to service_role;/,
    );
  });

  it("validates all input params in accept_signal_engagement", () => {
    const fn = between(sql, "accept_signal_engagement", "comment on function");
    expect(fn).toContain("invalid event type");
    expect(fn).toContain("invalid dedupe key");
    expect(fn).toContain("invalid context");
    expect(fn).toContain("invalid sp delta");
    expect(fn).toContain("invalid reward tier");
    expect(fn).toContain("invalid rules version");
    expect(fn).toContain("invalid daily cap");
  });

  it("uses atomic FOR UPDATE and dedupe-first pattern", () => {
    const fn = between(sql, "accept_signal_engagement", "comment on function");
    expect(fn).toContain("select * into existing_event");
    expect(fn).toContain("where user_id = p_user_id");
    expect(fn).toContain("for update");
    expect(fn).toContain("on conflict (user_id) do nothing");
  });

  it("computes daily cap before granting", () => {
    const fn = between(sql, "accept_signal_engagement", "comment on function");
    expect(fn).toContain("date_trunc");
    expect(fn).toContain("greatest(p_daily_sp_cap - day_total");
    expect(fn).toContain("awarded := least(p_sp_delta, remaining)");
  });

  it("does not update game_profiles when no SP awarded", () => {
    const fn = between(sql, "accept_signal_engagement", "comment on function");
    // When awarded <= 0 or tier is interaction, returns early without update
    expect(fn).toContain("awarded <= 0 or p_reward_tier = 'interaction'");
    // The update game_profiles block should be AFTER this check
    const earlyReturn = fn.indexOf("awarded <= 0");
    const gameUpdate = fn.indexOf("update public.game_profiles");
    expect(gameUpdate).toBeGreaterThan(earlyReturn);
  });

  it("creates delivery only when grant exists with SP > 0", () => {
    const fn = between(sql, "accept_signal_engagement", "comment on function");
    const grantInsert = fn.indexOf("insert into public.signal_reward_grants");
    const deliveryInsert = fn.indexOf("insert into public.signal_reward_deliveries");
    expect(deliveryInsert).toBeGreaterThan(grantInsert);
    // delivery only appears once, right after grant insert
    const deliveryCount = fn.match(/into public\.signal_reward_deliveries/g);
    expect(deliveryCount).not.toBeNull();
    expect(deliveryCount!.length).toBe(1);
  });

  // -------------------------------------------------------------------------
  // RPC: acknowledge_signal_reward
  // -------------------------------------------------------------------------
  it("defines acknowledge_signal_reward as SECURITY DEFINER with auth.uid() check", () => {
    const fn = between(sql, "acknowledge_signal_reward", "comment on function");
    expect(fn).toContain("security definer");
    expect(fn).toContain("set search_path = ''");
    expect(fn).toContain("auth.uid()");
  });

  it("revokes acknowledge from public, anon, and service_role", () => {
    expect(sql).toMatch(
      /revoke all on function public\.acknowledge_signal_reward[\s\S]*?from public, anon, service_role/,
    );
    expect(
      sql,
    ).toMatch(
      /grant execute on function public\.acknowledge_signal_reward[\s\S]*?to authenticated/,
    );
  });

  it("only allows acknowledged or dismissed status transitions", () => {
    const fn = between(sql, "acknowledge_signal_reward", "comment on function");
    expect(fn).toContain("p_status not in ('acknowledged', 'dismissed')");
    expect(fn).toContain("invalid status");
  });

  it("scopes delivery update to authenticated_user_id", () => {
    const fn = between(sql, "acknowledge_signal_reward", "comment on function");
    expect(fn).toContain("user_id = authenticated_user_id");
  });

  // -------------------------------------------------------------------------
  // RPC: list_pending_signal_rewards
  // -------------------------------------------------------------------------
  it("defines list_pending as SECURITY DEFINER, service_role only", () => {
    const fn = between(sql, "list_pending_signal_rewards", "comment on function");
    expect(fn).toContain("security definer");
    expect(fn).toContain("set search_path = ''");
    expect(sql).toMatch(
      /revoke all on function public\.list_pending_signal_rewards[\s\S]*?from public, anon, authenticated/,
    );
    expect(sql).toMatch(
      /grant execute on function public\.list_pending_signal_rewards[\s\S]*?to service_role/,
    );
  });

  it("filters pending deliveries by user_id", () => {
    const fn = between(sql, "list_pending_signal_rewards", "comment on function");
    expect(fn).toContain("d.user_id = p_user_id");
    expect(fn).toContain("d.status = 'pending'");
  });

  // -------------------------------------------------------------------------
  // Immutability
  // -------------------------------------------------------------------------
  it("prevents authenticated insert on grant ledger", () => {
    // Only select granted to authenticated; insert revoked
    expect(sql).toContain(
      "revoke all on table public.signal_reward_grants from public, anon, authenticated",
    );
    // No policy for insert, update, or delete — only for select
    expect(sql).not.toMatch(
      /create policy[^;]*signal_reward_grants[^;]*for\s+insert/i,
    );
    expect(sql).not.toMatch(
      /create policy[^;]*signal_reward_grants[^;]*for\s+update/i,
    );
    expect(sql).not.toMatch(
      /create policy[^;]*signal_reward_grants[^;]*for\s+delete/i,
    );
  });

  it("prevents authenticated write on events", () => {
    expect(sql).not.toMatch(
      /create policy[^;]*signal_engagement_events[^;]*for\s+insert/i,
    );
    expect(sql).not.toMatch(
      /create policy[^;]*signal_engagement_events[^;]*for\s+update/i,
    );
  });
});
