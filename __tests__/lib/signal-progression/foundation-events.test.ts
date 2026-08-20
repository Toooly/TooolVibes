import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { missionsCompletedByEvent } from "@/lib/signal-progression/missions";
import {
  SIGNAL_EVENT_TYPES,
  SIGNAL_REWARD_RULES,
} from "@/lib/signal-progression/rules";
import { validateSignalEventPayload } from "@/lib/signal-progression/validate-event";

const USER = "11111111-1111-1111-1111-111111111111";

describe("foundation signal events", () => {
  it("keeps existing collection and radar event types", () => {
    expect(SIGNAL_EVENT_TYPES).toEqual(
      expect.arrayContaining([
        "tool_saved_first_time",
        "tool_saved",
        "comparison_completed",
        "analysis_read",
        "collection_opened",
        "collection_progressed",
        "radar_returned",
        "profile_completed",
        "decision_recorded",
        "defer_with_revisit",
        "decision_revisited",
        "usage_confirmed",
        "tool_replaced",
        "useful_stack",
      ]),
    );
  });

  it("defines onceOnly keys for foundation events", () => {
    expect(SIGNAL_REWARD_RULES.decision_recorded.spDelta).toBe(0);
    expect(SIGNAL_REWARD_RULES.decision_recorded.onceOnly).toBe(true);
    expect(
      SIGNAL_REWARD_RULES.decision_recorded.buildDedupeKey(USER, { slug: "cursor" }),
    ).toBe(`decision_first:${USER}`);
    expect(
      SIGNAL_REWARD_RULES.decision_recorded.buildDedupeKey(USER, { slug: "linear" }),
    ).toBe(`decision_first:${USER}`);

    expect(SIGNAL_REWARD_RULES.defer_with_revisit.spDelta).toBe(8);
    expect(SIGNAL_REWARD_RULES.defer_with_revisit.onceOnly).toBe(true);
    expect(SIGNAL_REWARD_RULES.defer_with_revisit.dailyEventCap).toBe(3);
    expect(
      SIGNAL_REWARD_RULES.defer_with_revisit.buildDedupeKey(USER, { slug: "cursor" }),
    ).toBe(`defer:${USER}:cursor`);

    expect(SIGNAL_REWARD_RULES.decision_revisited.spDelta).toBe(10);
    expect(SIGNAL_REWARD_RULES.decision_revisited.onceOnly).toBe(true);
    expect(
      SIGNAL_REWARD_RULES.decision_revisited.buildDedupeKey(USER, { slug: "cursor" }),
    ).toBe(`revisit:${USER}:cursor`);

    expect(SIGNAL_REWARD_RULES.usage_confirmed.spDelta).toBe(10);
    expect(SIGNAL_REWARD_RULES.usage_confirmed.onceOnly).toBe(true);
    expect(SIGNAL_REWARD_RULES.usage_confirmed.dailyEventCap).toBe(3);
    expect(
      SIGNAL_REWARD_RULES.usage_confirmed.buildDedupeKey(USER, { slug: "cursor" }),
    ).toBe(`use:${USER}:cursor`);

    expect(SIGNAL_REWARD_RULES.tool_replaced.spDelta).toBe(15);
    expect(SIGNAL_REWARD_RULES.tool_replaced.onceOnly).toBe(true);
    expect(
      SIGNAL_REWARD_RULES.tool_replaced.buildDedupeKey(USER, { slug: "cursor" }),
    ).toBe(`replace:${USER}:cursor`);

    expect(SIGNAL_REWARD_RULES.useful_stack.spDelta).toBe(20);
    expect(SIGNAL_REWARD_RULES.useful_stack.onceOnly).toBe(true);
    expect(SIGNAL_REWARD_RULES.useful_stack.buildDedupeKey(USER, {})).toBe(
      `stack3:${USER}`,
    );
  });

  it("maps foundation events to catalog missions", () => {
    expect(missionsCompletedByEvent("decision_recorded").map((m) => m.id)).toEqual([
      "record_first_decision",
    ]);
    expect(missionsCompletedByEvent("useful_stack").map((m) => m.id)).toEqual([
      "create_useful_stack",
    ]);
    expect(missionsCompletedByEvent("defer_with_revisit").map((m) => m.id)).toEqual([
      "defer_with_date",
    ]);
    expect(missionsCompletedByEvent("decision_revisited").map((m) => m.id)).toEqual([
      "revisit_due_decision",
    ]);
    expect(missionsCompletedByEvent("usage_confirmed")).toEqual([]);
    expect(missionsCompletedByEvent("tool_replaced")).toEqual([]);
  });

  it("accepts optional slug on decision_recorded and requires slug elsewhere", () => {
    expect(
      validateSignalEventPayload({ eventType: "decision_recorded", context: {} }, USER)
        .ok,
    ).toBe(true);
    expect(
      validateSignalEventPayload(
        { eventType: "decision_recorded", context: { slug: "cursor" } },
        USER,
      ).ok,
    ).toBe(true);
    expect(
      validateSignalEventPayload({ eventType: "useful_stack", context: {} }, USER).ok,
    ).toBe(true);
    expect(
      validateSignalEventPayload(
        { eventType: "defer_with_revisit", context: {} },
        USER,
      ).ok,
    ).toBe(false);
    expect(
      validateSignalEventPayload(
        { eventType: "decision_revisited", context: { slug: "cursor" } },
        USER,
      ).ok,
    ).toBe(true);
  });

  it("exposes client helpers without embedding reward amounts", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib/signal-progression/client.ts"),
      "utf8",
    );
    expect(source).toContain("export function emitDecisionRecorded");
    expect(source).toContain("export function emitDeferWithRevisit");
    expect(source).toContain("export function emitDecisionRevisited");
    expect(source).toContain("export function emitUsageConfirmed");
    expect(source).toContain("export function emitToolReplaced");
    expect(source).toContain("export function emitUsefulStack");
    expect(source).not.toContain("spDelta");
  });
});
