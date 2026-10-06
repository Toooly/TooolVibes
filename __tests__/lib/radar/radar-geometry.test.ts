/**
 * Radar geometry truth tests (spec §27).
 *
 * Proves the semantic contract of the instrument:
 *   same cluster → same angular sector
 *   newer        → closer to center
 *   older        → farther outward
 *   attention    → larger visual blip
 *   same input   → same geometry (determinism)
 *   collision    → bounded and tangential (radius meaning preserved)
 *   unknown age  → explicit treatment, never invented
 */

import { describe, expect, it } from "vitest";

import {
  assertRadarPointsInBounds,
  layoutRadarPoints,
  MAX_BLIP_RADIUS,
  MIN_BLIP_RADIUS,
  radarRingLabels,
  resolveAgeRadiusRatio,
  stableHash,
  visualRadiusFromAttention,
  type RadarLayoutItem,
} from "@/lib/radar/radar-geometry";

function item(overrides: Partial<RadarLayoutItem> & { id: string }): RadarLayoutItem {
  return {
    clusterId: "developer-coding",
    attention: 100,
    ageHours: 12,
    rank: 1,
    ...overrides,
  };
}

function idsAtSector(items: RadarLayoutItem[], clusterId: string): string[] {
  return layoutRadarPoints(items, { resolveCollisions: false })
    .points.filter((point) => point.clusterId === clusterId)
    .map((point) => point.id)
    .sort();
}

describe("RADAR-GEO-V2 semantic layout", () => {
  it("RADAR-GEO-V2-01 same cluster shares one angular sector", () => {
    const items = [
      item({ id: "a", clusterId: "developer-coding", ageHours: 2 }),
      item({ id: "b", clusterId: "developer-coding", ageHours: 20 }),
      item({ id: "c", clusterId: "video-image", ageHours: 4 }),
      item({ id: "d", clusterId: "video-image", ageHours: 22 }),
    ];
    const layout = layoutRadarPoints(items, { resolveCollisions: false });
    const sectorSpan = 360 / layout.sectorCount;

    for (const clusterId of ["developer-coding", "video-image"]) {
      const angles = layout.points
        .filter((point) => point.clusterId === clusterId)
        .map((point) => point.angleDeg);
      const center = angles.reduce((sum, value) => sum + value, 0) / angles.length;
      for (const angle of angles) {
        // Every member sits within one sector arc of the cluster's own sector.
        const delta = Math.abs(((angle - center + 540) % 360) - 180);
        expect(delta).toBeLessThanOrEqual(sectorSpan);
      }
    }
    expect(idsAtSector(items, "developer-coding")).toEqual(["a", "b"]);
  });

  it("RADAR-GEO-V2-02 newer signals sit closer to the center than older ones", () => {
    const layout = layoutRadarPoints(
      [
        item({ id: "new", ageHours: 1 }),
        item({ id: "mid", ageHours: 12 }),
        item({ id: "old", ageHours: 23 }),
      ],
      { resolveCollisions: false },
    );
    const byId = new Map(layout.points.map((point) => [point.id, point.radiusRatio]));
    expect(byId.get("new")).toBeLessThan(byId.get("mid")!);
    expect(byId.get("mid")).toBeLessThan(byId.get("old")!);
  });

  it("RADAR-GEO-V2-03 radius encodes age within the selected range", () => {
    // A 12h-old signal in a 24h window sits at the midpoint of the usable band.
    const ratio = resolveAgeRadiusRatio(12, 24, 0.12);
    expect(ratio).toBeCloseTo(0.12 + 0.88 * 0.5, 5);
    // Beyond the window clamps to the outer edge; never negative.
    expect(resolveAgeRadiusRatio(500, 24, 0.12)).toBe(1);
    expect(resolveAgeRadiusRatio(0, 24, 0.12)).toBeCloseTo(0.12, 5);
  });

  it("RADAR-GEO-V2-04 larger attention produces a larger blip", () => {
    const layout = layoutRadarPoints(
      [
        item({ id: "small", attention: 10 }),
        item({ id: "huge", attention: 1000 }),
      ],
      { resolveCollisions: false },
    );
    const small = layout.points.find((point) => point.id === "small")!;
    const huge = layout.points.find((point) => point.id === "huge")!;
    expect(huge.size).toBeGreaterThan(small.size);
  });

  it("RADAR-GEO-V2-05 attention scaling is perceptual (sqrt) and bounded", () => {
    // sqrt scaling: area ≈ attention, so radius ratio is the sqrt of the share.
    const half = visualRadiusFromAttention(50, 200);
    const full = visualRadiusFromAttention(200, 200);
    expect(full).toBeCloseTo(MAX_BLIP_RADIUS, 5);
    expect(visualRadiusFromAttention(0, 200)).toBeCloseTo(MIN_BLIP_RADIUS, 5);
    // 4x the attention is only 2x the radius — the documented formula.
    expect((half - MIN_BLIP_RADIUS) / (MAX_BLIP_RADIUS - MIN_BLIP_RADIUS)).toBeCloseTo(0.5, 5);
  });

  it("RADAR-GEO-V2-06 same input always produces the same geometry", () => {
    const items = Array.from({ length: 12 }, (_, index) =>
      item({
        id: `t${index}`,
        clusterId: index % 2 === 0 ? "video-image" : "marketing-growth",
        ageHours: index * 1.7,
        attention: 50 + index * 37,
      }),
    );
    const first = layoutRadarPoints(items);
    const second = layoutRadarPoints(items);
    expect(JSON.stringify(first.points)).toBe(JSON.stringify(second.points));
  });

  it("RADAR-GEO-V2-07 collision displacement is bounded", () => {
    const items = Array.from({ length: 14 }, (_, index) =>
      item({ id: `c${index}`, clusterId: "developer-coding", ageHours: 12, attention: 900 }),
    );
    const layout = layoutRadarPoints(items, { maxTangentialDeg: 14 });
    for (const point of layout.points) {
      expect(Math.abs(point.collisionOffsetDeg)).toBeLessThanOrEqual(14);
    }
  });

  it("RADAR-GEO-V2-08 collision is tangential: radial meaning is preserved", () => {
    const items = Array.from({ length: 14 }, (_, index) =>
      item({ id: `r${index}`, clusterId: "video-image", ageHours: 12, attention: 900 }),
    );
    const withCollisions = layoutRadarPoints(items, { resolveCollisions: true });
    const without = layoutRadarPoints(items, { resolveCollisions: false });
    for (const point of withCollisions.points) {
      const original = without.points.find((entry) => entry.id === point.id)!;
      // Radius (age) must be untouched by collision resolution.
      expect(point.radiusRatio).toBeCloseTo(original.radiusRatio, 10);
    }
  });

  it("RADAR-GEO-V2-09 unknown age is explicit, never invented", () => {
    const layout = layoutRadarPoints(
      [item({ id: "known", ageHours: 3 }), item({ id: "unknown", ageHours: null })],
      { resolveCollisions: false },
    );
    const known = layout.points.find((point) => point.id === "known")!;
    const unknown = layout.points.find((point) => point.id === "unknown")!;
    expect(known.ageKnown).toBe(true);
    expect(unknown.ageKnown).toBe(false);
    expect(unknown.radiusRatio).toBe(1);
    expect(unknown.radiusRatio).toBeGreaterThan(known.radiusRatio);
    expect(layout.hasUnknownAge).toBe(true);
    expect(layout.radiusBasis).toBe("age");
  });

  it("RADAR-GEO-V2-10 no NaN, nothing outside the instrument, empty-safe", () => {
    const empty = layoutRadarPoints([]);
    expect(empty.points).toHaveLength(0);
    expect(empty.sectorCount).toBe(1);
    expect(assertRadarPointsInBounds(empty.points)).toBe(true);

    const items = Array.from({ length: 20 }, (_, index) =>
      item({
        id: `b${index}`,
        clusterId: ["video-image", "ai-agents", "other"][index % 3],
        ageHours: index % 5 === 0 ? null : index,
        attention: index === 0 ? 0 : index * 41,
      }),
    );
    const layout = layoutRadarPoints(items);
    for (const point of layout.points) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
      expect(Number.isFinite(point.angleDeg)).toBe(true);
      expect(Number.isFinite(point.size)).toBe(true);
    }
    expect(assertRadarPointsInBounds(layout.points)).toBe(true);
  });

  it("RADAR-GEO-V2-11 ring labels follow real time boundaries per range", () => {
    expect(radarRingLabels("day").map((ring) => ring.label)).toEqual([
      "6h",
      "12h",
      "18h",
      "24h",
    ]);
    expect(radarRingLabels("week").map((ring) => ring.label)).toEqual([
      "2g",
      "4g",
      "6g",
      "7g",
    ]);
    expect(radarRingLabels("month").map((ring) => ring.label)).toEqual([
      "7g",
      "14g",
      "21g",
      "30g",
    ]);
    for (const range of ["day", "week", "month"] as const) {
      const ratios = radarRingLabels(range).map((ring) => ring.ratio);
      expect(ratios[ratios.length - 1]).toBe(1);
      expect([...ratios].sort((a, b) => a - b)).toEqual(ratios);
    }
  });

  it("RADAR-GEO-V2-12 stableHash is deterministic and platform-independent", () => {
    expect(stableHash("radar")).toBe(stableHash("radar"));
    expect(stableHash("radar")).not.toBe(stableHash("radars"));
    expect(stableHash("")).toBe(0x811c9dc5);
  });

  it("RADAR-GEO-V2-13 one cluster produces one sector, not many fake ones", () => {
    const layout = layoutRadarPoints([
      item({ id: "x", clusterId: "ai-agents", ageHours: 1 }),
      item({ id: "y", clusterId: "ai-agents", ageHours: 2 }),
      item({ id: "z", clusterId: "ai-agents", ageHours: 3 }),
    ], { resolveCollisions: false });
    expect(layout.sectorCount).toBe(1);
    expect(layout.clusterOrder).toEqual(["ai-agents"]);
  });
});
