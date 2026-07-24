import { describe, expect, it } from "vitest";

import {
  computeEditorialScore,
  EDITORIAL_SCORE_MAX,
  EDITORIAL_SCORE_MIN,
  EDITORIAL_SCORE_TOOL_OF_WEEK_BONUS,
} from "@/lib/data/editorial-score";

/**
 * Canonical editorial score contract:
 *   - Range [6.8, 9.5]
 *   - Tool of week gets +0.6
 *   - Deterministic from name length
 *   - Capped at 9.5
 *
 * This number MUST be the same in Archive cards and Tool Detail.
 */

describe("computeEditorialScore", () => {
  it("returns 8.4 for Blink (5 chars, toolOfWeek=true)", () => {
    const s = computeEditorialScore({ name: "Blink", toolOfWeek: true });
    // base = 6.8 + (5%3)*0.5 = 6.8 + 1.0 = 7.8
    // boosted = min(7.8 + 0.6, 9.5) = 8.4
    expect(s.value).toBe(8.4);
    expect(s.label).toBe("Solido");
  });

  it("returns 7.8 for Blink (5 chars, toolOfWeek=false)", () => {
    const s = computeEditorialScore({ name: "Blink", toolOfWeek: false });
    expect(s.value).toBe(7.8);
    expect(s.label).toBe("Buono");
  });

  it("is deterministic — same input → same output", () => {
    const a = computeEditorialScore({ name: "Meku", toolOfWeek: false });
    const b = computeEditorialScore({ name: "Meku", toolOfWeek: false });
    expect(a.value).toBe(b.value);
  });

  it("never exceeds 9.5 even with bonus", () => {
    const s = computeEditorialScore({ name: "AAA", toolOfWeek: true });
    expect(s.value).toBeLessThanOrEqual(EDITORIAL_SCORE_MAX);
  });

  it("never drops below 6.8", () => {
    const s = computeEditorialScore({ name: "X", toolOfWeek: false });
    expect(s.value).toBeGreaterThanOrEqual(EDITORIAL_SCORE_MIN);
  });

  it("toolOfWeek bonus is exactly +0.6", () => {
    const baseNoBonus = computeEditorialScore({ name: "Meku", toolOfWeek: false });
    const baseWithBonus = computeEditorialScore({ name: "Meku", toolOfWeek: true });
    const delta = Math.round((baseWithBonus.value - baseNoBonus.value) * 10) / 10;
    expect(delta).toBe(EDITORIAL_SCORE_TOOL_OF_WEEK_BONUS);
  });

  it("rounds to 1 decimal place", () => {
    const s = computeEditorialScore({ name: "VibeCode", toolOfWeek: false });
    expect(s.value).toBe(Math.round(s.value * 10) / 10);
  });

  it("label matches value band", () => {
    const names = ["Blink", "Meku", "VibeCode", "WeWeb", "Alpha", "Beta", "Gamma"];
    for (const name of names) {
      for (const toolOfWeek of [true, false]) {
        const s = computeEditorialScore({ name, toolOfWeek });
        if (s.value >= 9.0) expect(s.label).toBe("Ottimo");
        else if (s.value >= 8.0) expect(s.label).toBe("Solido");
        else if (s.value >= 7.0) expect(s.label).toBe("Buono");
        else expect(s.label).toBe("Base");
      }
    }
  });
});
