import { vi } from "vitest";
vi.mock("server-only", () => ({}));

import { describe, expect, it } from "vitest";
import {
  missionsCompletedByEvent,
  projectSignalMissions,
  SIGNAL_ONBOARDING_MISSIONS,
} from "@/lib/signal-progression/missions";

describe("signal mission projection", () => {
  it("defines six foundation missions", () => {
    expect(SIGNAL_ONBOARDING_MISSIONS).toHaveLength(6);
    expect(SIGNAL_ONBOARDING_MISSIONS.map((m) => m.id)).toEqual([
      "save_first_tool",
      "complete_first_comparison",
      "record_first_decision",
      "create_useful_stack",
      "defer_with_date",
      "revisit_due_decision",
    ]);
  });

  it("projects completed/active/locked from events", () => {
    const rows = [
      { event_type: "tool_saved_first_time", context: { slug: "a" } },
    ];
    const projected = projectSignalMissions(rows);
    expect(projected[0]?.status).toBe("completed");
    expect(projected[1]?.status).toBe("active");
    expect(projected.slice(2).every((m) => m.status === "locked")).toBe(true);
  });

  it("maps engagement events to missions", () => {
    expect(missionsCompletedByEvent("decision_recorded")[0]?.id).toBe(
      "record_first_decision",
    );
    expect(missionsCompletedByEvent("useful_stack")[0]?.id).toBe("create_useful_stack");
  });
});
