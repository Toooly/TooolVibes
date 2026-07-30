import { describe, expect, it } from "vitest";
import {
  calculateSignalLevel,
  computeSignalLevelV1,
  SIGNAL_LEVEL_THRESHOLDS,
} from "@/lib/signal-progression/levels";

describe("signal levels v1", () => {
  it("uses approved thresholds and titles", () => {
    expect(SIGNAL_LEVEL_THRESHOLDS.map((t) => t.minSp)).toEqual([
      0, 150, 400, 900, 1800,
    ]);
    expect(SIGNAL_LEVEL_THRESHOLDS.map((t) => t.title)).toEqual([
      "Esploratore",
      "Selezionatore",
      "Curatore",
      "Stratega",
      "Cartografo",
    ]);
  });

  it("maps SP to levels deterministically", () => {
    expect(calculateSignalLevel(0).level).toBe(1);
    expect(calculateSignalLevel(149).level).toBe(1);
    expect(calculateSignalLevel(150).title).toBe("Selezionatore");
    expect(calculateSignalLevel(400).title).toBe("Curatore");
    expect(calculateSignalLevel(900).title).toBe("Stratega");
    expect(calculateSignalLevel(1800).title).toBe("Cartografo");
    expect(calculateSignalLevel(1800).nextThreshold).toBeNull();
  });

  it("computes progress percent for hub", () => {
    const mid = computeSignalLevelV1(75);
    expect(mid.level).toBe(1);
    expect(mid.progressPercent).toBe(50);
    expect(mid.spForNext).toBe(150);
  });
});
