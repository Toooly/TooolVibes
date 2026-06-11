import { describe, expect, it } from "vitest";
import { evaluateBadges, INITIAL_BADGES } from "@/lib/gamification/badge-rules";
import type { BadgeContext } from "@/lib/gamification/badge-rules";

describe("badge-rules", () => {
  it("awards first_scan when missions completed >= 1", () => {
    const context: BadgeContext = {
      missions_completed: 1,
      battles_won: 0,
      predictions_correct: 0,
      tools_collected: 0,
      streak_days: 0,
      shortlist_size: 0,
    };
    const awarded = evaluateBadges(context, [], INITIAL_BADGES);
    expect(awarded.map((b) => b.code)).toContain("first_scan");
  });

  it("does not award arena_veteran with only 5 wins", () => {
    const context: BadgeContext = {
      missions_completed: 0,
      battles_won: 5,
      predictions_correct: 0,
      tools_collected: 0,
      streak_days: 0,
      shortlist_size: 0,
    };
    const awarded = evaluateBadges(context, [], INITIAL_BADGES);
    expect(awarded.map((b) => b.code)).not.toContain("arena_veteran");
  });
});
