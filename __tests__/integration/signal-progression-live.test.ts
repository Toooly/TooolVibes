/**
 * Live Supabase integration tests for Signal Progression.
 *
 * Requires:
 *   TOOOLVIBES_RUN_SIGNAL_INTEGRATION_TESTS=1
 *   TOOOLVIBES_SIGNAL_TEST_DB_URL=http://127.0.0.1:54321
 *
 * Guards: refuses any host that is not explicitly local (127.0.0.1 or ::1).
 * Fails rather than silently skipping when the env var is set.
 */

// @vitest-environment node

import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.TOOOLVIBES_SIGNAL_TEST_DB_URL;
const CAN_RUN = process.env.TOOOLVIBES_RUN_SIGNAL_INTEGRATION_TESTS === "1";

const isLocal = (url: string | undefined) =>
  url != null && (url.includes("127.0.0.1") || url.includes("::1") || url.includes("localhost"));

function assertNonProd() {
  if (URL && !isLocal(URL)) {
    throw new Error(
      `REFUSING to run integration tests against non-local host: ${URL}. ` +
      `Set TOOOLVIBES_SIGNAL_TEST_DB_URL to a local Supabase instance.`,
    );
  }
}

describe.runIf(CAN_RUN && isLocal(URL))("SIG-001 live Signal Progression backbone", () => {
  const ANON_KEY = process.env.TOOOLVIBES_SIGNAL_TEST_ANON_KEY ?? "";
  const SRV_KEY  = process.env.TOOOLVIBES_SIGNAL_TEST_SERVICE_KEY ?? "";

  let anon: SupabaseClient;
  let service: SupabaseClient;
  let userA: SupabaseClient;
  let userB: SupabaseClient;
  let idA = "";
  let idB = "";
  let grantIdA = "";

  beforeAll(async () => {
    assertNonProd();

    anon = createClient(URL!, ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    service = createClient(URL!, SRV_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

    const emailA = `sig-test-a-${Math.random().toString(36).slice(2,8)}@local.test`;
    const emailB = `sig-test-b-${Math.random().toString(36).slice(2,8)}@local.test`;
    const pass = "Pass1234!!";

    await service.auth.admin.createUser({ email: emailA, password: pass, email_confirm: true });
    await service.auth.admin.createUser({ email: emailB, password: pass, email_confirm: true });

    const { data: users } = await service.auth.admin.listUsers();
    idA = users.users.find((u) => u.email === emailA)?.id ?? "";
    idB = users.users.find((u) => u.email === emailB)?.id ?? "";

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
  });

  afterAll(async () => {
    if (idA) await service.auth.admin.deleteUser(idA);
    if (idB) await service.auth.admin.deleteUser(idB);
  });

  describe("RLS — anonymous", () => {
    it("returns 0 rows for SELECT (default-deny, not error)", async () => {
      const { data, error } = await anon.from("signal_engagement_events").select("*").limit(1);
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
    it("blocks INSERT", async () => {
      const { error } = await anon.from("signal_engagement_events").insert({
        user_id: idA, event_type: "tool_saved", dedupe_key: "test", context: {}, rules_version: "v1",
      });
      expect(error).toBeTruthy();
    });
  });

  describe("RLS — user isolation", () => {
    it("user A reads own events", async () => {
      const { error } = await userA.from("signal_engagement_events").select("*").limit(1);
      expect(error).toBeNull();
    });
    it("user A cannot read user B grants", async () => {
      const { data } = await userA.from("signal_reward_grants").select("*").eq("user_id", idB).limit(1);
      expect(data).toHaveLength(0);
    });
    it("user A cannot call service-role RPCs", async () => {
      const r1 = await userA.rpc("accept_signal_engagement", {
        p_user_id: idA, p_event_type: "tool_saved", p_dedupe_key: "t", p_context: { slug: "x" },
        p_sp_delta: 5, p_reward_tier: "micro", p_reason_code: "x", p_title: "T", p_description: "D",
        p_announcement: "A", p_priority: 0, p_rules_version: "v1",
      });
      expect(r1.error).toBeTruthy();
      const r2 = await userA.rpc("list_pending_signal_rewards", { p_user_id: idA });
      expect(r2.error).toBeTruthy();
    });
  });

  describe("accept_signal_engagement (service role)", () => {
    it("creates event + grant + delivery atomically", async () => {
      const { data, error } = await service.rpc("accept_signal_engagement", {
        p_user_id: idA, p_event_type: "tool_saved", p_dedupe_key: `save:${idA}:blink`,
        p_context: { slug: "blink" }, p_sp_delta: 5, p_reward_tier: "micro",
        p_reason_code: "tool_saved", p_title: "Tool salvato", p_description: "Desc",
        p_announcement: "A", p_priority: 10, p_rules_version: "signal-progression-v1",
      });
      expect(error).toBeNull();
      expect(data.status).toBe("accepted");
      expect(data.granted).toBe(true);
      expect(data.spAwarded).toBe(5);
      grantIdA = data.envelope.grantId;
      expect(grantIdA).toBeTruthy();
    });
    it("rejects negative SP delta", async () => {
      const { error } = await service.rpc("accept_signal_engagement", {
        p_user_id: idA, p_event_type: "tool_saved", p_dedupe_key: `save:neg:${idA}`,
        p_context: { slug: "x" }, p_sp_delta: -1, p_reward_tier: "micro", p_reason_code: "x",
        p_title: "T", p_description: "D", p_announcement: "A", p_priority: 0, p_rules_version: "v1",
      });
      expect(error).toBeTruthy();
      expect(error?.message ?? "").toMatch(/invalid sp delta/i);
    });
    it("tool_unsaved = 0 SP", async () => {
      const now = new Date().toISOString().slice(0, 10);
      const { data } = await service.rpc("accept_signal_engagement", {
        p_user_id: idA, p_event_type: "tool_unsaved", p_dedupe_key: `unsave:${idA}:x:${now}`,
        p_context: { slug: "x" }, p_sp_delta: 0, p_reward_tier: "interaction",
        p_reason_code: "tool_unsaved", p_title: "R", p_description: "D",
        p_announcement: "A", p_priority: 0, p_rules_version: "v1",
      });
      expect(data.granted).toBe(false);
      expect(data.spAwarded).toBe(0);
    });
  });

  describe("acknowledge_signal_reward", () => {
    it("user A acknowledges own reward", async () => {
      const { data, error } = await userA.rpc("acknowledge_signal_reward", {
        p_grant_id: grantIdA, p_status: "acknowledged",
      });
      expect(error).toBeNull();
      expect(data.status).toBe("acknowledged");
    });
    it("user B cannot acknowledge user A reward", async () => {
      const { error } = await userB.rpc("acknowledge_signal_reward", {
        p_grant_id: grantIdA, p_status: "acknowledged",
      });
      expect(error).toBeTruthy();
    });
    it("rejects invalid status", async () => {
      const { error } = await userA.rpc("acknowledge_signal_reward", {
        p_grant_id: grantIdA, p_status: "hacked",
      });
      expect(error).toBeTruthy();
    });
  });

  describe("concurrency", () => {
    it("10 concurrent identical events → 1 DB row", async () => {
      const dk = `save:conc:${idB}`;
      const promises = Array.from({ length: 10 }, () =>
        service.rpc("accept_signal_engagement", {
          p_user_id: idB, p_event_type: "tool_saved", p_dedupe_key: dk,
          p_context: { slug: "blink" }, p_sp_delta: 5, p_reward_tier: "micro",
          p_reason_code: "tool_saved", p_title: "T", p_description: "D",
          p_announcement: "A", p_priority: 10, p_rules_version: "signal-progression-v1",
        }),
      );
      await Promise.all(promises);

      const { count: evt } = await service
        .from("signal_engagement_events")
        .select("*", { count: "exact", head: true })
        .eq("user_id", idB).eq("dedupe_key", dk);
      expect(evt).toBe(1);
    });
  });
});
