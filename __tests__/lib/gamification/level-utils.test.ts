import { describe, expect, it } from "vitest";
import { calculateLevel, xpForNextLevel, xpToReachLevel } from "@/lib/gamification/level-utils";

describe("level-utils", () => {
  it("calculates level 1 at 0 xp", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("calculates level 2 at 100 xp", () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it("calculates level 3 at 315 xp", () => {
    expect(calculateLevel(315)).toBe(3);
  });

  it("returns xp needed for next level", () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(2)).toBe(215);
  });

  it("returns total xp to reach a level", () => {
    expect(xpToReachLevel(3)).toBe(315);
  });
});
