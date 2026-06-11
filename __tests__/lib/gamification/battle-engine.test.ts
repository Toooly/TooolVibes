import { describe, expect, it } from "vitest";
import { simulateBattle } from "@/lib/gamification/battle-engine";

describe("battle-engine", () => {
  const tools = [
    { slug: "alpha", votes: 100, trend7d: 10, comments: 20, completeness: 0.9 },
    { slug: "beta", votes: 80, trend7d: 15, comments: 10, completeness: 0.7 },
  ];

  it("returns deterministic winner for same inputs", () => {
    const a = simulateBattle(tools, "1v1", "user-1");
    const b = simulateBattle(tools, "1v1", "user-1");
    expect(a.winnerSlug).toBe(b.winnerSlug);
  });

  it("produces a battle log", () => {
    const result = simulateBattle(tools, "1v1", "user-1");
    expect(result.battleLog.length).toBe(5);
    expect(result.scoreSnapshot.alpha).toBeGreaterThan(0);
  });
});
