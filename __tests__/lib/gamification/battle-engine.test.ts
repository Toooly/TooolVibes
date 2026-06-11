import { describe, expect, it } from "vitest";
import {
  simulateBattle,
  type BattleInput,
} from "@/lib/gamification/battle-engine";
import type { ArenaBattleMode } from "@/lib/gamification/types";

describe("battle-engine", () => {
  const buildInput = (
    mode: ArenaBattleMode,
    toolSlugs: string[],
    scoreSnapshot: Record<string, number>,
  ): BattleInput => ({ mode, toolSlugs, scoreSnapshot });

  it("returns a deterministic result for identical inputs", () => {
    const input = buildInput(
      "1v1",
      ["tool-a", "tool-b"],
      { "tool-a": 80, "tool-b": 60 },
    );
    const first = simulateBattle(input);
    const second = simulateBattle(input);

    expect(first.winner_slug).toBe(second.winner_slug);
    expect(first.battle_log).toEqual(second.battle_log);
  });

  it("declares the higher-scored tool winner in a 1v1 battle", () => {
    const result = simulateBattle(
      buildInput("1v1", ["tool-a", "tool-b"], { "tool-a": 80, "tool-b": 60 }),
    );

    expect(result.winner_slug).toBe("tool-a");
    expect(result.battle_log.length).toBeGreaterThan(0);
    expect(result.battle_log[0]).toMatchObject({
      turn: 1,
      attacker: expect.any(String),
      defender: expect.any(String),
      damage: expect.any(Number),
      reason: expect.any(String),
    });
  });

  it("produces a valid royale winner from multiple tools", () => {
    const result = simulateBattle(
      buildInput(
        "royale",
        ["alpha", "beta", "gamma", "delta"],
        { alpha: 70, beta: 50, gamma: 90, delta: 40 },
      ),
    );

    expect(["alpha", "beta", "gamma", "delta"]).toContain(result.winner_slug);
    expect(
      result.battle_log.every(
        (turn) =>
          typeof turn.turn === "number" &&
          typeof turn.attacker === "string" &&
          typeof turn.defender === "string" &&
          typeof turn.damage === "number" &&
          turn.damage >= 0 &&
          ["votes", "trend", "comments", "completeness", "surprise"].includes(
            turn.reason,
          ),
      ),
    ).toBe(true);
  });

  it("runs a bracket battle and returns one of the entrants as winner", () => {
    const result = simulateBattle(
      buildInput(
        "bracket",
        ["a", "b", "c", "d"],
        { a: 100, b: 60, c: 80, d: 40 },
      ),
    );

    expect(["a", "b", "c", "d"]).toContain(result.winner_slug);
    expect(result.battle_log.length).toBeGreaterThan(0);
  });

  it("throws when no tools are provided", () => {
    expect(() => simulateBattle(buildInput("1v1", [], {}))).toThrow();
  });

  it("throws for single-tool battles outside 1v1 mode", () => {
    expect(() =>
      simulateBattle(buildInput("royale", ["lonely"], { lonely: 50 })),
    ).toThrow();
  });
});
