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
    expect(missionsCompletedByEvent("collection_progressed").map((m) => m.id)).toEqual([
      "explore_first_collection",
    ]);
  });
});
