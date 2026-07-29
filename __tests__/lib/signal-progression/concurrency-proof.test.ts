import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  FORBIDDEN_CLIENT_REWARD_FIELDS,
  assertNoClientRewardFields,
  signalEventIngestSchema,
} from "@/lib/signal-progression/contracts";
import { SIGNAL_REWARD_RULES } from "@/lib/signal-progression/rules";
import { validateSignalEventPayload } from "@/lib/signal-progression/validate-event";

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

describe("concurrency and idempotency model", () => {
  // -------------------------------------------------------------------------
  // Single-event dedupe
  // -------------------------------------------------------------------------
  it("one event produces exactly one dedupe key per user + context", () => {
    const userId = "A".repeat(36);
    const result = validateSignalEventPayload(
      { eventType: "tool_saved_first_time", context: { slug: "blink" } },
      userId,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.dedupeKey).toBe(`save_first:${userId}`);

    const result2 = validateSignalEventPayload(
      { eventType: "tool_saved_first_time", context: { slug: "vibecode" } },
      userId,
    );
    expect(result2.ok).toBe(true);
    if (!result2.ok) return;
    expect(result2.value.dedupeKey).toBe(`save_first:${userId}`);
    // Both produce the SAME dedupe key (once-only, not slug-scoped)
    expect(result.value.dedupeKey).toBe(result2.value.dedupeKey);
  });

  it("tool_saved dedupe keys are per-slug (different slugs = different keys)", () => {
    const userId = "A".repeat(36);
    const a = validateSignalEventPayload(
      { eventType: "tool_saved", context: { slug: "blink" } },
      userId,
    );
    const b = validateSignalEventPayload(
      { eventType: "tool_saved", context: { slug: "vibecode" } },
      userId,
    );
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    expect(a.value.dedupeKey).not.toBe(b.value.dedupeKey);
  });

  it("tool_unsaved dedupe keys are per-day (same event on different days allowed)", () => {
    const userId = "A".repeat(36);
    const today = new Date().toISOString().slice(0, 10);
    const rule = SIGNAL_REWARD_RULES.tool_unsaved;
    const key = rule.buildDedupeKey(userId, { slug: "blink" });
    expect(key).toContain(`unsave:${userId}:blink:${today}`);
  });

  // -------------------------------------------------------------------------
  // DB-level dedupe
  // -------------------------------------------------------------------------
  it("DB enforces UNIQUE on (user_id, dedupe_key) — no race condition", () => {
    // The unique constraint is the final backstop; concurrent identical
    // INSERTs cause one to succeed and the other to get a duplicate key error.
    // accept_signal_engagement handles this by checking first with SELECT
    // (idempotent replay) and relying on the UNIQUE constraint as safety net.
    expect(sql).toMatch(/unique\s*\(user_id\s*,\s*dedupe_key\)/);
  });

  it("DB enforces exactly one grant per event", () => {
    // Grant uniqueness on engagement_event_id means even if the event
    // is duplicated somehow, at most one grant row exists.
    expect(sql).toContain("unique (engagement_event_id)");
  });

  it("uses FOR UPDATE lock to serialize per-user profile access", () => {
    // SELECT ... FOR UPDATE on game_profiles row prevents concurrent
    // balance updates from interleaving. Two concurrent SP grants for
    // the same user will serialize.
    expect(sql).toContain("select * into profile");
    expect(sql).toContain("for update");
  });

  // -------------------------------------------------------------------------
  // Rule cap proofs
  // -------------------------------------------------------------------------
  it("tool_saved_first_time is once-only and uses global dedupe", () => {
    expect(SIGNAL_REWARD_RULES.tool_saved_first_time.onceOnly).toBe(true);
    expect(SIGNAL_REWARD_RULES.tool_saved_first_time.dailyEventCap).toBe(1);
    // dedupe key does not scope to slug — once ever
    const key = SIGNAL_REWARD_RULES.tool_saved_first_time.buildDedupeKey(
      "uuid",
      { slug: "any" },
    );
    expect(key).toBe("save_first:uuid");
  });

  it("tool_saved per-slot dedupe + daily cap 3", () => {
    expect(SIGNAL_REWARD_RULES.tool_saved.dailyEventCap).toBe(3);
    expect(SIGNAL_REWARD_RULES.tool_saved.onceOnly).toBe(true);
    // onceOnly + slug-scoped = max 1 SP per tool ever
  });

  it("tool_unsaved awards zero SP — cannot farm SP via toggle spam", () => {
    expect(SIGNAL_REWARD_RULES.tool_unsaved.spDelta).toBe(0);
    expect(SIGNAL_REWARD_RULES.tool_unsaved.tier).toBe("interaction");
  });

  it("global daily cap is 120 SP", () => {
    expect(sql).toContain("p_daily_sp_cap integer default 120");
  });

  // -------------------------------------------------------------------------
  // Client cannot inject reward fields
  // -------------------------------------------------------------------------
  it("rejects all forbidden client reward fields", () => {
    for (const key of FORBIDDEN_CLIENT_REWARD_FIELDS) {
      expect(assertNoClientRewardFields({ [key]: 1000 })).toContain(key);
    }
  });

  it("ingest schema is strict — unknown fields rejected", () => {
    const result = signalEventIngestSchema.safeParse({
      eventType: "tool_saved",
      context: { slug: "blink" },
      injectedPoints: 999,
    });
    expect(result.success).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Once-only per-collection-slug dedupe
  // -------------------------------------------------------------------------
  it("collection events are per-slug deduped", () => {
    const rule = SIGNAL_REWARD_RULES.collection_opened;
    expect(rule.onceOnly).toBe(true);
    expect(rule.buildDedupeKey("userId", { slug: "ai-stack" })).toBe(
      "col_open:userId:ai-stack",
    );
  });
});
