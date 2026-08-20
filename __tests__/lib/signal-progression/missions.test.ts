import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { describe, expect, it } from "vitest";

import {
  missionsCompletedByEvent,
  publicMissionCatalog,
  SIGNAL_ONBOARDING_MISSIONS,
} from "@/lib/signal-progression/missions";

describe("signal mission catalog", () => {
  it("exposes ordered onboarding missions", () => {
    const catalog = publicMissionCatalog();
    expect(catalog).toHaveLength(SIGNAL_ONBOARDING_MISSIONS.length);
    expect(catalog[0]?.id).toBe("save_first_tool");
    expect(catalog.every((m) => m.rewardSp > 0)).toBe(true);
  });

  it("maps engagement events to mission completions", () => {
    expect(missionsCompletedByEvent("tool_saved_first_time").map((m) => m.id)).toEqual([
      "save_first_tool",
    ]);
    expect(missionsCompletedByEvent("comparison_completed").map((m) => m.id)).toEqual([
      "complete_first_comparison",
    ]);
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
    expect(missionsCompletedByEvent("collection_progressed")).toEqual([]);
    expect(missionsCompletedByEvent("radar_returned")).toEqual([]);
    expect(missionsCompletedByEvent("profile_completed")).toEqual([]);
  });
});
