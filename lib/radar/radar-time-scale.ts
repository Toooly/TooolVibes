/**
 * RADAR RANGE-AWARE TEMPORAL SCALE — canonical pure temporal projection.
 *
 * Long ranges (7G, 30G) use a MONOTONIC POWER projection so recent signals
 * occupy meaningful radial depth instead of collapsing around the core.
 * 24H remains LINEAR (gamma = 1.0) because its distribution is already
 * perceptually successful.
 *
 * This is NON-LINEAR visualization, NOT fake time:
 *   if ageA < ageB then radiusA < radiusB  (strict monotonic)
 *   0h maps to 0, range boundary maps to 1
 *
 * Every temporal ring is positioned by the SAME projection as signals.
 * One canonical source of truth — exponents are never scattered.
 */

import type { ProductHuntRange } from "@/lib/radar/product-hunt-contract";

/** Perceptual gamma per range. 1.0 = linear; <1 = recent-time expansion. */
export const RADAR_TIME_SCALE_GAMMAS: Record<ProductHuntRange, number> = {
  day: 1.0,
  week: 0.65,
  month: 0.55,
};

/** Range length in hours. Canonical — same values as radar-geometry. */
export const RADAR_TIME_SCALE_RANGE_HOURS: Record<ProductHuntRange, number> = {
  day: 24,
  week: 168,
  month: 720,
};

/**
 * Raw perceptual temporal projection: ageHours → 0..1.
 * `pow(normalizedAge, gamma)` clamped to [0, 1].
 *
 * - ageHours = 0            → 0
 * - ageHours = rangeHours   → 1
 * - Strictly monotonic for all finite non-negative inputs.
 */
export function radarAgeToRadiusRatio(
  ageHours: number,
  range: ProductHuntRange,
): number {
  const rangeHours = RADAR_TIME_SCALE_RANGE_HOURS[range] ?? 24;
  const gamma = RADAR_TIME_SCALE_GAMMAS[range] ?? 1;
  const normalized = Math.min(1, Math.max(0, ageHours / Math.max(rangeHours, 1)));
  return Math.pow(normalized, gamma);
}

/**
 * Inverse: raw radius ratio 0..1 → ageHours.
 * Round-trip: `radarRadiusRatioToAge(radarAgeToRadiusRatio(h, r), r) ≈ h`.
 */
export function radarRadiusRatioToAge(
  radiusRatio: number,
  range: ProductHuntRange,
): number {
  const rangeHours = RADAR_TIME_SCALE_RANGE_HOURS[range] ?? 24;
  const gamma = RADAR_TIME_SCALE_GAMMAS[range] ?? 1;
  const clamped = Math.min(1, Math.max(0, radiusRatio));
  return Math.pow(clamped, 1 / gamma) * rangeHours;
}

/**
 * Ring radius for an age checkpoint — the SAME mapping signals use.
 * Includes the inner-radius floor so rings align with signal centres.
 */
export function radarTimeRingRadius(
  ageCheckpointHours: number,
  range: ProductHuntRange,
  innerRadiusRatio = 0.12,
): number {
  return (
    innerRadiusRatio +
    (1 - innerRadiusRatio) * radarAgeToRadiusRatio(ageCheckpointHours, range)
  );
}

/**
 * Derives the ProductHuntRange from a rangeHours value.
 * Fallback: "day" for unknown values.
 */
export function radarRangeFromHours(rangeHours: number): ProductHuntRange {
  if (rangeHours >= 720) return "month";
  if (rangeHours >= 168) return "week";
  return "day";
}
