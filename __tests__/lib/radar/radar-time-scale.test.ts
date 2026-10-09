/**
 * Range-aware temporal scale tests (VISUAL CONVERGENCE PASS).
 *
 * Proves the perceptual power projection is monotonic, boundary-correct,
 * and shared by both signals and temporal rings.
 */

import { describe, expect, it } from "vitest";

import {
  RADAR_TIME_SCALE_GAMMAS,
  RADAR_TIME_SCALE_RANGE_HOURS,
  radarAgeToRadiusRatio,
  radarRangeFromHours,
  radarRadiusRatioToAge,
  radarTimeRingRadius,
} from "@/lib/radar/radar-time-scale";
import {
  RADAR_TIME_RINGS,
  resolveAgeRadiusRatio,
  RADAR_RANGE_HOURS,
} from "@/lib/radar/radar-geometry";

const RANGES = ["day", "week", "month"] as const;

describe("RADAR-TIME-SCALE perceptual projection", () => {
  it("RADAR-TIME-SCALE-01 24H gamma is exactly 1 (linear)", () => {
    expect(RADAR_TIME_SCALE_GAMMAS.day).toBe(1);
    // Linear: midpoint maps to midpoint
    expect(radarAgeToRadiusRatio(12, "day")).toBeCloseTo(0.5, 10);
    expect(radarAgeToRadiusRatio(6, "day")).toBeCloseTo(0.25, 10);
    expect(radarAgeToRadiusRatio(18, "day")).toBeCloseTo(0.75, 10);
  });

  it("RADAR-TIME-SCALE-02 7G gamma is 0.65 (recent expansion)", () => {
    expect(RADAR_TIME_SCALE_GAMMAS.week).toBeCloseTo(0.65, 10);
    // pow(0.5, 0.65) ≈ 0.637 — midpoint expands outward
    const mid = radarAgeToRadiusRatio(84, "week");
    expect(mid).toBeGreaterThan(0.5);
    expect(mid).toBeLessThan(1);
  });

  it("RADAR-TIME-SCALE-03 30G gamma is 0.55 (stronger expansion)", () => {
    expect(RADAR_TIME_SCALE_GAMMAS.month).toBeCloseTo(0.55, 10);
    // pow(0.5, 0.55) ≈ 0.683 — more expansion than 7G
    const mid = radarAgeToRadiusRatio(360, "month");
    expect(mid).toBeGreaterThan(radarAgeToRadiusRatio(84, "week"));
    expect(mid).toBeLessThan(1);
  });

  it("RADAR-TIME-SCALE-04 age 0 maps to 0 for every range", () => {
    for (const range of RANGES) {
      expect(radarAgeToRadiusRatio(0, range)).toBe(0);
    }
  });

  it("RADAR-TIME-SCALE-05 range boundary maps to 1 for every range", () => {
    for (const range of RANGES) {
      const maxAge = RADAR_TIME_SCALE_RANGE_HOURS[range];
      expect(radarAgeToRadiusRatio(maxAge, range)).toBeCloseTo(1, 10);
    }
  });

  it("RADAR-TIME-SCALE-06 strict monotonicity: ageA < ageB → radiusA < radiusB", () => {
    for (const range of RANGES) {
      const rangeH = RADAR_TIME_SCALE_RANGE_HOURS[range];
      let prev = -1;
      for (let h = 0; h <= rangeH; h += rangeH / 100) {
        const r = radarAgeToRadiusRatio(h, range);
        expect(r).toBeGreaterThanOrEqual(prev);
        if (h > 0) expect(r).toBeGreaterThan(prev); // strictly increasing for h>0
        prev = r;
      }
    }
  });

  it("RADAR-TIME-SCALE-07 no age ordering inversion across all ranges", () => {
    for (const range of RANGES) {
      const rangeH = RADAR_TIME_SCALE_RANGE_HOURS[range];
      const ages = Array.from({ length: 50 }, (_, i) => (i / 49) * rangeH);
      const radii = ages.map((a) => radarAgeToRadiusRatio(a, range));
      for (let i = 1; i < radii.length; i++) {
        if (ages[i] > ages[i - 1]) {
          expect(radii[i]).toBeGreaterThan(radii[i - 1]);
        }
      }
    }
  });

  it("RADAR-TIME-SCALE-08 inverse roundtrip within tolerance", () => {
    for (const range of RANGES) {
      const rangeH = RADAR_TIME_SCALE_RANGE_HOURS[range];
      for (let h = 0; h <= rangeH; h += rangeH / 20) {
        const r = radarAgeToRadiusRatio(h, range);
        const recovered = radarRadiusRatioToAge(r, range);
        expect(recovered).toBeCloseTo(h, 4);
      }
    }
  });

  it("RADAR-TIME-SCALE-09 ring radius uses the exact same mapping as signals", () => {
    for (const range of RANGES) {
      const rangeH = RADAR_RANGE_HOURS[range];
      const rings = RADAR_TIME_RINGS[range];
      const checkpoints = {
        day: [6, 12, 18, 24],
        week: [48, 96, 144, 168],
        month: [168, 336, 504, 720],
      }[range];

      for (let i = 0; i < rings.length; i++) {
        const ring = rings[i];
        const expectedFromRingFn = radarTimeRingRadius(checkpoints[i], range);
        // Ring ratio must equal the signal radiusRatio at the same age
        const signalRatio = resolveAgeRadiusRatio(
          checkpoints[i],
          rangeH,
          0.12,
        );
        expect(ring.ratio).toBeCloseTo(signalRatio, 10);
        expect(ring.ratio).toBeCloseTo(expectedFromRingFn, 10);
      }
    }
  });

  it("RADAR-TIME-SCALE-10 ring radii are strictly increasing per range", () => {
    for (const range of RANGES) {
      const rings = RADAR_TIME_RINGS[range];
      for (let i = 1; i < rings.length; i++) {
        expect(rings[i].ratio).toBeGreaterThan(rings[i - 1].ratio);
      }
      // Outermost ring is exactly at ratio 1
      expect(rings[rings.length - 1].ratio).toBeCloseTo(1, 10);
    }
  });

  it("RADAR-TIME-SCALE-11 radarRangeFromHours derives correct range", () => {
    expect(radarRangeFromHours(24)).toBe("day");
    expect(radarRangeFromHours(168)).toBe("week");
    expect(radarRangeFromHours(720)).toBe("month");
    expect(radarRangeFromHours(0)).toBe("day"); // fallback
    expect(radarRangeFromHours(12)).toBe("day");
  });

  it("RADAR-TIME-SCALE-12 gammas reduce central compression vs linear", () => {
    // At 12h into 30G, perceptual scale should exceed linear
    const linear30 = 12 / 720; // ≈ 0.0167
    const perceptual30 = radarAgeToRadiusRatio(12, "month");
    expect(perceptual30).toBeGreaterThan(linear30 * 3); // material expansion

    // At 12h into 7G, same
    const linear7 = 12 / 168; // ≈ 0.0714
    const perceptual7 = radarAgeToRadiusRatio(12, "week");
    expect(perceptual7).toBeGreaterThan(linear7 * 1.5);
  });
});
