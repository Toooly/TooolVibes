/**
 * Live Supabase integration tests for Phase 6 Signal achievements.
 *
 * Requires:
 *   TOOOLVIBES_RUN_SIGNAL_INTEGRATION_TESTS=1
 *   TOOOLVIBES_SIGNAL_TEST_DB_URL=http://127.0.0.1:54321
 *
 * Guards: refuses any host that is not explicitly local (127.0.0.1 or ::1).
 */

// @vitest-environment node

import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.TOOOLVIBES_SIGNAL_TEST_DB_URL;
const CAN_RUN = process.env.TOOOLVIBES_RUN_SIGNAL_INTEGRATION_TESTS === "1";

const isLocal = (url: string | undefined) =>
  url != null &&
  (url.includes("127.0.0.1") || url.includes("::1") || url.includes("localhost"));

function assertNonProd() {
  if (URL && !isLocal(URL)) {
    throw new Error(
      `REFUSING to run integration tests against non-local host: ${URL}.`,
    );
  }
}

const RULES = "signal-progression-v1";

function eventArgs(
  userId: string,
  eventType: string,
  dedupeKey: string,
  context: Record<string, string>,
  spDelta: number,
  tier: string,
) {
  return {
    p_user_id: userId,
    p_event_type: eventType,
    p_dedupe_key: dedupeKey,
    p_context: context,
    p_sp_delta: spDelta,
    p_reward_tier: tier,
    p_reason_code: eventType,
    p_title: `test ${eventType}`,
    p_description: "live test event",
    p_announcement: "test",
    p_priority: 10,
    p_rules_version: RULES,
    p_client_idempotency_key: dedupeKey,
    p_occurred_at: null,
    p_daily_sp_cap: 120,
  };
}

describe.runIf(CAN_RUN && isLocal(URL))("SIG-ACH live Phase 6 achievements", () => {
  const ANON_KEY = process.env.TOOOLVIBES_SIGNAL_TEST_ANON_KEY ?? "";
  const SRV_KEY = process.env.TOOOLVIBES_SIGNAL_TEST_SERVICE_KEY ?? "";

  let anon: SupabaseClient;
  let service: SupabaseClient;
  let userA: SupabaseClient;
  let userB: SupabaseClient;
  let idA = "";
  let idB = "";
  let idC = "";
  const colSlug = `live-journey-${Math.random().toString(36).slice(2, 8)}`;
  const toolA = `live-tool-a-${Math.random().toString(36).slice(2, 8)}`;
  const toolB = `live-tool-b-${Math.random().toString(36).slice(2, 8)}`;

  async function evaluate(userId: string) {
    const { data, error } = await service.rpc("evaluate_signal_achievements", {
      p_user_id: userId,
      p_daily_sp_cap: 120,
      p_rules_version: "signal-achievements-v1",
    });
    expect(error).toBeNull();
    return data as { awarded: string[]; envelopes: unknown[] };
  }

  async function ownedCodes(userId: string): Promise<string[]> {
    const { data, error } = await service
      .from("user_badges")
      .select("badge_id, badges!inner(code, family)")
      .eq("user_id", userId)
      .eq("badges.family", "signal_v1");
    expect(error).toBeNull();
    return (data ?? []).map((r) => (r.badges as unknown as { code: string }).code);
  }

  beforeAll(async () => {
    assertNonProd();
    anon = createClient(URL!, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    service = createClient(URL!, SRV_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const pass = "Pass1234!!";
    const mk = (prefix: string) =>
      `${prefix}-${Math.random().toString(36).slice(2, 8)}@local.test`;
    const emailA = mk("ach-a");
    const emailB = mk("ach-b");
    const emailC = mk("ach-c");
    for (const email of [emailA, emailB, emailC]) {
      await service.auth.admin.createUser({ email, password: pass, email_confirm: true });
    }
    const { data: users } = await service.auth.admin.listUsers();
    idA = users.users.find((u) => u.email === emailA)?.id ?? "";
    idB = users.users.find((u) => u.email === emailB)?.id ?? "";
    idC = users.users.find((u) => u.email === emailC)?.id ?? "";
    expect(idA).toBeTruthy();
    expect(idB).toBeTruthy();
    expect(idC).toBeTruthy();

    const sa = await anon.auth.signInWithPassword({ email: emailA, password: pass });
    const sb = await anon.auth.signInWithPassword({ email: emailB, password: pass });
    userA = createClient(URL!, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${sa.data.session!.access_token}` } },
    });
    userB = createClient(URL!, ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${sb.data.session!.access_token}` } },
    });

    // Collection fixtures for the curator journey (real slot count = 2).
    const toolsIns = await service.from("tools").insert([
      {
        name: "Live Tool A",
        slug: toolA,
        category: "Developer",
        short_description_it: "Tool di test live A per la suite live.",
        description_it: "Descrizione sufficientemente lunga del tool di test live A per rispettare i vincoli editoriali.",
        website_url: "https://a.example.invalid",
        tooolvibes_post_url: "https://app.example.invalid/toools/" + toolA,
        cover_image_url: "https://images.example.invalid/a.png",
        source: "live-test",
        date_discovered: "2026-07-30",
      },
      {
        name: "Live Tool B",
        slug: toolB,
        category: "Developer",
        short_description_it: "Tool di test live B per la suite live.",
        description_it: "Descrizione sufficientemente lunga del tool di test live B per rispettare i vincoli editoriali.",
        website_url: "https://b.example.invalid",
        tooolvibes_post_url: "https://app.example.invalid/toools/" + toolB,
        cover_image_url: "https://images.example.invalid/b.png",
        source: "live-test",
        date_discovered: "2026-07-30",
      },
    ]);
    expect(toolsIns.error).toBeNull();
    const { data: col, error: colErr } = await service
      .from("collections")
      .insert({
        slug: colSlug,
        title: "Live journey",
        description: "Collezione di test per il percorso curato live.",
        cover_image_url: "https://example.test/c.png",
        cover_kicker: "Kicker",
        rationale: "Rationale di test sufficientemente lungo per il vincolo di integrita.",
        theme: "founder-stack",
        audience: "Solo founders",
        difficulty: "starter",
        tone: "starter-stack",
        access: "open",
        editorial_state: "published",
      })
      .select("id")
      .single();
    expect(colErr).toBeNull();
    const slotsIns = await service.from("collection_tool_slots").insert([
      { collection_id: col!.id, tool_slug: toolA, role: "Primo passaggio", position: 1 },
      { collection_id: col!.id, tool_slug: toolB, role: "Secondo passaggio", position: 2 },
    ]);
    expect(slotsIns.error).toBeNull();
  });

  afterAll(async () => {
    if (idA) await service.auth.admin.deleteUser(idA);
    if (idB) await service.auth.admin.deleteUser(idB);
    if (idC) await service.auth.admin.deleteUser(idC);
  });

  it("first_signal: ownership persisted, merged presentation, no duplicate SP grant", async () => {
    const { error } = await service.rpc(
      "accept_signal_engagement",
      eventArgs(idA, "tool_saved_first_time", `save_first:${idA}`, { slug: toolA }, 40, "micro"),
    );
    expect(error).toBeNull();

    const res = await evaluate(idA);
    expect(res.awarded).toContain("first_signal");
    expect(await ownedCodes(idA)).toContain("first_signal");

    // Merged: no dedicated grant row for the achievement code.
    const { data: grants } = await service
      .from("signal_reward_grants")
      .select("reason_code")
      .eq("user_id", idA)
      .eq("reason_code", "first_signal");
    expect(grants).toEqual([]);

    // Idempotent ownership.
    const again = await evaluate(idA);
    expect(again.awarded).not.toContain("first_signal");
  });

  it("first_verdict: unlocks once, never repeated for the same comparison set", async () => {
    await service.rpc(
      "accept_signal_engagement",
      eventArgs(idA, "comparison_completed", `cmp_done:aaaa1111:${idA}`, { setHash: "aaaa1111" }, 15, "micro"),
    );
    const res = await evaluate(idA);
    expect(res.awarded).toContain("first_verdict");

    const dup = await service.rpc(
      "accept_signal_engagement",
      eventArgs(idA, "comparison_completed", `cmp_done:aaaa1111:${idA}`, { setHash: "aaaa1111" }, 15, "micro"),
    );
    expect((dup.data as { status?: string })?.status).toBe("duplicate");

    const again = await evaluate(idA);
    expect(again.awarded).not.toContain("first_verdict");
    expect(await ownedCodes(idA)).toContain("first_verdict");
  });

  it("stack_builder: authoritative workspace count, not client interactions", async () => {
    // Workspace with only 3 distinct tools: five saves must NOT unlock it.
    const { data: vp } = await service
      .from("viewer_profiles")
      .insert({ access_token: `live-vp-${idA}`, kind: "account", auth_user_id: idA })
      .select("id")
      .single();
    const ws = (slugs: string[]) => ({
      schemaVersion: 1,
      clearedAt: null,
      saved: { slugs, updatedAt: "2026-07-30T00:00:00.000Z" },
      compare: { slugs: [], updatedAt: "2026-07-30T00:00:00.000Z" },
      stack: { slugs: [], updatedAt: "2026-07-30T00:00:00.000Z" },
      toolStates: {},
    });
    await service.from("viewer_workspaces").insert({
      viewer_id: vp!.id,
      workspace_state: ws([toolA, toolB, "fixture-tool"]),
    });

    let res = await evaluate(idA);
    expect(res.awarded).not.toContain("stack_builder");

    // Authoritative state reaches five distinct tools.
    await service
      .from("viewer_workspaces")
      .update({ workspace_state: ws([toolA, toolB, "fixture-tool", "fixture-tool-x", "fixture-tool-y"]) })
      .eq("viewer_id", vp!.id);

    res = await evaluate(idA);
    expect(res.awarded).toContain("stack_builder");
    expect(await ownedCodes(idA)).toContain("stack_builder");

    // Dedicated envelope exists for this achievement.
    const { data: grants } = await service
      .from("signal_reward_grants")
      .select("reason_code, reward_tier")
      .eq("user_id", idA)
      .eq("reason_code", "stack_builder");
    expect(grants?.length).toBe(1);
    expect(grants?.[0].reward_tier).toBe("achievement");
  });

  it("pathfinder + curator_mark: real journey completion from collection slots", async () => {
    await service.rpc(
      "accept_signal_engagement",
      eventArgs(idA, "collection_progressed", `col_prog:${idA}:${colSlug}:1`, { slug: colSlug, step: "1" }, 25, "micro"),
    );
    let res = await evaluate(idA);
    expect(res.awarded).toContain("pathfinder");
    expect(res.awarded).not.toContain("curator_mark");

    await service.rpc(
      "accept_signal_engagement",
      eventArgs(idA, "collection_progressed", `col_prog:${idA}:${colSlug}:2`, { slug: colSlug, step: "2" }, 25, "micro"),
    );
    res = await evaluate(idA);
    expect(res.awarded).toContain("curator_mark");
  });

  it("radar_return: three distinct valid days, no streak requirement", async () => {
    for (const date of ["2026-07-25", "2026-07-27"]) {
      await service.rpc(
        "accept_signal_engagement",
        eventArgs(idA, "radar_returned", `radar:${idA}:${date}`, { date }, 8, "micro"),
      );
    }
    let res = await evaluate(idA);
    expect(res.awarded).not.toContain("radar_return");

    // Same-day replay is deduped and does not add a day.
    await service.rpc(
      "accept_signal_engagement",
      eventArgs(idA, "radar_returned", `radar:${idA}:2026-07-27`, { date: "2026-07-27" }, 8, "micro"),
    );
    res = await evaluate(idA);
    expect(res.awarded).not.toContain("radar_return");

    // Third DISTINCT day (non-consecutive: no streak semantics).
    await service.rpc(
      "accept_signal_engagement",
      eventArgs(idA, "radar_returned", `radar:${idA}:2026-07-30`, { date: "2026-07-30" }, 8, "micro"),
    );
    res = await evaluate(idA);
    expect(res.awarded).toContain("radar_return");
  });

  it("profile_set: only after server-verified context completion", async () => {
    const resBefore = await evaluate(idC);
    expect(resBefore.awarded).not.toContain("profile_set");

    await service.rpc("upsert_signal_user_context", {
      p_user_id: idC,
      p_focus_area: "product",
      p_primary_goal: "compare",
    });
    const res = await evaluate(idC);
    expect(res.awarded).toContain("profile_set");
  });

  it("level advancement: once-only per level, zero SP, milestone from Stratega", async () => {
    await service.from("game_profiles").upsert({ user_id: idC, xp: 150 });
    let res = await evaluate(idC);
    let levels = (res.envelopes as Array<{ code: string; tier: string; levelLabel?: string; displayDelta?: number }>)
      .filter((e) => e.code === "level_advanced");
    expect(levels).toHaveLength(1);
    expect(levels[0].levelLabel).toBe("Selezionatore");
    expect(levels[0].tier).toBe("achievement");
    expect(levels[0].displayDelta).toBe(0);

    // No replay on re-evaluation.
    res = await evaluate(idC);
    expect(
      (res.envelopes as Array<{ code: string }>).filter((e) => e.code === "level_advanced"),
    ).toHaveLength(0);

    // Crossing two thresholds at once emits each level exactly once.
    await service.from("game_profiles").update({ xp: 900 }).eq("user_id", idC);
    res = await evaluate(idC);
    levels = (res.envelopes as Array<{ code: string; tier: string; levelLabel?: string }>)
      .filter((e) => e.code === "level_advanced");
    expect(levels.map((l) => l.levelLabel)).toEqual(["Curatore", "Stratega"]);
    expect(levels.find((l) => l.levelLabel === "Stratega")?.tier).toBe("milestone");

    // Cartografo: level 5 emits the milestone envelope and the badge.
    await service.from("game_profiles").update({ xp: 1800 }).eq("user_id", idC);
    res = await evaluate(idC);
    expect(res.awarded).toContain("cartographer");
    const l5 = (res.envelopes as Array<{ code: string; levelLabel?: string; tier: string }>)
      .find((e) => e.code === "level_advanced" && e.levelLabel === "Cartografo");
    expect(l5?.tier).toBe("milestone");
  });

  it("cross-user isolation: B cannot read, evaluate or ack as A", async () => {
    // RLS: user B sees zero of A's badge rows.
    const { data: visible } = await userB
      .from("user_badges")
      .select("id")
      .eq("user_id", idA);
    expect(visible).toEqual([]);

    // user B sees own badges only (empty for B).
    const { data: own } = await userB.from("user_badges").select("id");
    expect(own).toEqual([]);

    // Evaluation is service_role only: authenticated calls are rejected.
    const asB = await userB.rpc("evaluate_signal_achievements", {
      p_user_id: idA,
      p_daily_sp_cap: 120,
      p_rules_version: "signal-achievements-v1",
    });
    expect(asB.error).not.toBeNull();

    // B cannot acknowledge A's achievement grant.
    const { data: grantsA } = await service
      .from("signal_reward_grants")
      .select("id")
      .eq("user_id", idA)
      .eq("reason_code", "stack_builder")
      .limit(1);
    expect(grantsA?.length).toBe(1);
    const ackAsB = await userB.rpc("acknowledge_signal_reward", {
      p_grant_id: grantsA![0].id,
      p_status: "acknowledged",
    });
    expect(ackAsB.error).not.toBeNull();

    // B cannot insert badge ownership directly.
    const { data: badgeRow } = await service
      .from("badges")
      .select("id")
      .eq("code", "first_signal")
      .single();
    const ins = await userB
      .from("user_badges")
      .insert({ user_id: idB, badge_id: badgeRow!.id });
    expect(ins.error).not.toBeNull();
  });

  it("hub exposes badge objects and truthful progress counters", async () => {
    const { data, error } = await service.rpc("get_signal_progress_hub", {
      p_user_id: idA,
    });
    expect(error).toBeNull();
    const hub = data as {
      badges: Array<{ code: string; title: string; rarity: string; earnedAt: string }>;
      achievementProgress: {
        savedCount: number;
        comparisonCount: number;
        radarDays: number;
        collectionJourneysCompleted: number;
      };
      preferences: { suppressMajorCelebrations?: boolean } | null;
    };
    const codes = hub.badges.map((b) => b.code);
    for (const expected of ["first_signal", "first_verdict", "stack_builder", "curator_mark", "radar_return"]) {
      expect(codes).toContain(expected);
    }
    expect(hub.badges.find((b) => b.code === "curator_mark")?.rarity).toBe("rare");
    expect(hub.achievementProgress.savedCount).toBe(5);
    expect(hub.achievementProgress.comparisonCount).toBe(1);
    expect(hub.achievementProgress.radarDays).toBe(3);
    expect(hub.achievementProgress.collectionJourneysCompleted).toBe(1);
  });

  it("preferences round-trip includes suppress_major_celebrations", async () => {
    const { error } = await userA.rpc("upsert_signal_reward_preferences", {
      p_reduce_reward_animations: false,
      p_mute_reward_sounds: true,
      p_quiet_mode: false,
      p_suppress_automatic_achievements: false,
      p_suppress_major_celebrations: true,
    });
    expect(error).toBeNull();
    const { data } = await service
      .from("signal_reward_preferences")
      .select("suppress_major_celebrations, mute_reward_sounds")
      .eq("user_id", idA)
      .single();
    expect(data?.suppress_major_celebrations).toBe(true);
    expect(data?.mute_reward_sounds).toBe(true);
  });
});
