import { describe, expect, it } from "vitest";
import { evaluateBadges, INITIAL_BADGES } from "@/lib/gamification/badge-rules";
import type { GameProfile } from "@/lib/gamification/types";

describe("badge-rules", () => {
  it("awards first_scan when missions completed >= 1", () => {
    const awarded = evaluateBadges({ missions_completed: 1 } as unknown as GameProfile, [], INITIAL_BADGES);
    expect(awarded.map((b) => b.code)).toContain("first_scan");
  });

  it("does not award arena_veteran with only 5 wins", () => {
    const awarded = evaluateBadges({ battles_won: 5 } as unknown as GameProfile, [], INITIAL_BADGES);
    expect(awarded.map((b) => b.code)).not.toContain("arena_veteran");
  });
});
