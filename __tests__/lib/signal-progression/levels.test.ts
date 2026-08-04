import { describe, expect, it } from "vitest";

import { calculateSignalLevel } from "@/lib/signal-progression/levels";

describe("signal level V1", () => {
  it("maps thresholds Esploratore→Cartografo", () => {
    expect(calculateSignalLevel(0).title).toBe("Esploratore");
    expect(calculateSignalLevel(149).level).toBe(1);
    expect(calculateSignalLevel(150).title).toBe("Selezionatore");
    expect(calculateSignalLevel(400).title).toBe("Builder");
    expect(calculateSignalLevel(900).title).toBe("Stratega");
    expect(calculateSignalLevel(1800).title).toBe("Cartografo");
    expect(calculateSignalLevel(1800).nextThreshold).toBeNull();
  });

  it("computes progress within a band", () => {
    const mid = calculateSignalLevel(275);
    expect(mid.level).toBe(2);
    expect(mid.progressInLevel).toBeCloseTo(0.5, 5);
  });
});
