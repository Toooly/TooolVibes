import { describe, expect, it } from "vitest";
import {
  missionsCompletedByEvent,
  projectSignalMissions,
  SIGNAL_ONBOARDING_MISSIONS,
} from "@/lib/signal-progression/missions";

describe("signal mission projection", () => {
  it("defines five onboarding missions", () => {
    expect(SIGNAL_ONBOARDING_MISSIONS).toHaveLength(5);
    expect(SIGNAL_ONBOARDING_MISSIONS.map((m) => m.id)).toEqual([
      "save_first_tool",
      "complete_first_comparison",
      "explore_first_collection",
      "return_to_radar",
      "complete_profile_context",
    ]);
  });

  it("projects completed/active/locked from events", () => {
    const views = projectSignalMissions([
      { event_type: "tool_saved_first_time" },
    ]);
    expect(views[0].status).toBe("completed");
    expect(views[1].status).toBe("active");
    expect(views[2].status).toBe("locked");
  });

  it("maps completing events", () => {
    expect(missionsCompletedByEvent("comparison_completed")[0]?.id).toBe(
      "complete_first_comparison",
    );
  });
});
