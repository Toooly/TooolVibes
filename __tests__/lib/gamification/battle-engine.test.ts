import { describe, expect, it } from "vitest";
import { simulateBattle } from "@/lib/gamification/battle-engine";

const baseTools = [
  { slug: "alpha", votes: 100, trend7d: 10, comments: 20, completeness: 0.9 },
  { slug: "beta", votes: 80, trend7d: 15, comments: 10, completeness: 0.7 },
];

describe("battle-engine", () => {
  it("returns deterministic winner for same inputs", () => {
    const a = simulateBattle(baseTools, "1v1", "user-1");
    const b = simulateBattle(baseTools, "1v1", "user-1");
    expect(a.winnerSlug).toBe(b.winnerSlug);
  });

  it("produces a battle log", () => {
    const result = simulateBattle(baseTools, "1v1", "user-1");
    expect(result.battleLog.length).toBe(5);
    expect(result.scoreSnapshot.alpha).toBeGreaterThan(0);
  });

  it("runs a 1v1 battle", () => {
    const result = simulateBattle(baseTools, "1v1", "user-1");
    expect(result.mode).toBe("1v1");
    expect(result.toolSlugs).toHaveLength(2);
    expect(result.toolSlugs).toContain(result.winnerSlug);
  });

  it("runs a royale battle with 3 tools", () => {
    const tools = [
      ...baseTools,
      { slug: "gamma", votes: 60, trend7d: 5, comments: 30, completeness: 0.8 },
    ];
    const result = simulateBattle(tools, "royale", "user-1");
    expect(result.mode).toBe("royale");
    expect(result.toolSlugs).toHaveLength(3);
    expect(result.toolSlugs).toContain(result.winnerSlug);
  });

  it("runs a bracket battle with 4 tools", () => {
    const tools = [
      ...baseTools,
      { slug: "gamma", votes: 60, trend7d: 5, comments: 30, completeness: 0.8 },
      { slug: "delta", votes: 40, trend7d: -5, comments: 5, completeness: 0.6 },
    ];
    const result = simulateBattle(tools, "bracket", "user-1");
    expect(result.mode).toBe("bracket");
    expect(result.toolSlugs).toHaveLength(4);
    expect(result.toolSlugs).toContain(result.winnerSlug);
  });

  it("throws for invalid mode", () => {
    expect(() =>
      // @ts-expect-error invalid mode for runtime validation test
      simulateBattle(baseTools, "invalid", "user-1"),
    ).toThrow();
  });

  it("throws when tool count does not match 1v1 mode", () => {
    expect(() => simulateBattle([baseTools[0]], "1v1", "user-1")).toThrow();
    expect(() =>
      simulateBattle(
        [...baseTools, { slug: "gamma", votes: 60, trend7d: 5, comments: 30, completeness: 0.8 }],
        "1v1",
        "user-1",
      ),
    ).toThrow();
  });

  it("throws when tool count does not match royale mode", () => {
    expect(() => simulateBattle([baseTools[0]], "royale", "user-1")).toThrow();
    expect(() =>
      simulateBattle(
        [
          ...baseTools,
          { slug: "gamma", votes: 60, trend7d: 5, comments: 30, completeness: 0.8 },
          { slug: "delta", votes: 40, trend7d: -5, comments: 5, completeness: 0.6 },
          { slug: "epsilon", votes: 20, trend7d: 0, comments: 1, completeness: 0.5 },
        ],
        "royale",
        "user-1",
      ),
    ).toThrow();
  });

  it("throws when tool count does not match bracket mode", () => {
    expect(() => simulateBattle(baseTools, "bracket", "user-1")).toThrow();
    expect(() =>
      simulateBattle(
        [
          ...baseTools,
          { slug: "gamma", votes: 60, trend7d: 5, comments: 30, completeness: 0.8 },
          { slug: "delta", votes: 40, trend7d: -5, comments: 5, completeness: 0.6 },
          { slug: "epsilon", votes: 20, trend7d: 0, comments: 1, completeness: 0.5 },
        ],
        "bracket",
        "user-1",
      ),
    ).toThrow();
  });

  it("produces possibly different winners for different user ids", () => {
    const tools = [
      { slug: "alpha", votes: 100, trend7d: 10, comments: 20, completeness: 0.8 },
      { slug: "beta", votes: 100, trend7d: 10, comments: 20, completeness: 0.8 },
    ];
    const winners = new Set<string>();
    for (let index = 0; index < 50; index += 1) {
      const result = simulateBattle(tools, "1v1", `user-${index}`);
      winners.add(result.winnerSlug);
    }
    expect(winners.size).toBeGreaterThan(1);
  });

  it("handles all-zero normalization without crashing", () => {
    const tools = [
      { slug: "alpha", votes: 0, trend7d: 0, comments: 0, completeness: 0.5 },
      { slug: "beta", votes: 0, trend7d: 0, comments: 0, completeness: 0.5 },
    ];
    const result = simulateBattle(tools, "1v1", "user-1");
    expect(Number.isFinite(result.scoreSnapshot.alpha)).toBe(true);
    expect(Number.isFinite(result.scoreSnapshot.beta)).toBe(true);
    expect(result.toolSlugs).toContain(result.winnerSlug);
  });

  it("awards the highest scoring tool", () => {
    const tools = [
      { slug: "weak", votes: 1, trend7d: -10, comments: 0, completeness: 0.1 },
      { slug: "strong", votes: 1000, trend7d: 100, comments: 200, completeness: 1.0 },
    ];
    const result = simulateBattle(tools, "1v1", "user-1");
    expect(result.winnerSlug).toBe("strong");
    expect(result.scoreSnapshot.strong).toBeGreaterThan(result.scoreSnapshot.weak);
  });
});
