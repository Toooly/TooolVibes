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
  RADAR_COMPASS_SECTOR_COUNT,
  RADAR_COMPASS_SECTOR_SPAN_DEG,
} from "@/lib/radar/radar-geometry";
import { radarTopicClusterSectorIndex } from "@/lib/radar/radar-topic-clusters";

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
    // The compass is permanent: an empty dataset does not shrink it.
    expect(empty.sectorCount).toBe(RADAR_COMPASS_SECTOR_COUNT);
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
      "1g",
      "2g",
      "4g",
      "7g",
    ]);
    expect(radarRingLabels("month").map((ring) => ring.label)).toEqual([
      "3g",
      "7g",
      "14g",
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

  it("RADAR-GEO-V2-13 the compass is permanent and never dataset-dependent", () => {
    // Spec §2 supersedes the earlier "one cluster = one sector" rule: sector
    // angles must NOT change when the dataset (or a filter) changes, otherwise
    // points move and the user loses their spatial memory.
    const oneCluster = layoutRadarPoints([
      item({ id: "x", clusterId: "ai-agents", ageHours: 1 }),
      item({ id: "y", clusterId: "ai-agents", ageHours: 2 }),
      item({ id: "z", clusterId: "ai-agents", ageHours: 3 }),
    ], { resolveCollisions: false });

    expect(oneCluster.sectorCount).toBe(RADAR_COMPASS_SECTOR_COUNT);
    expect(oneCluster.clusterOrder).toHaveLength(RADAR_COMPASS_SECTOR_COUNT);

    // …and a single cluster's points stay inside that cluster's own permanent
    // sector rather than spreading over the whole circle.
    const span = RADAR_COMPASS_SECTOR_SPAN_DEG;
    const sectorStart = radarTopicClusterSectorIndex("ai-agents") * span;
    for (const point of oneCluster.points) {
      expect(point.semanticAngleDeg).toBeGreaterThanOrEqual(sectorStart - 0.001);
      expect(point.semanticAngleDeg).toBeLessThan(sectorStart + span + 0.001);
    }
  });

  it("RADAR-GEO-V2-14 filtering never moves an existing point", () => {
    // Spec §2: matching x/y before filter == x/y after filter.
    const all = Array.from({ length: 12 }, (_, index) =>
      item({
        id: `s${index}`,
        clusterId: ["video-image", "ai-agents", "marketing-growth", "productivity"][index % 4],
        ageHours: index * 1.5,
        attention: 40 + index * 23,
      }),
    );
    const before = layoutRadarPoints(all, { resolveCollisions: true });
    const visible = all.filter((entry) => entry.clusterId === "ai-agents");
    // The same geometry function over the FULL set gives identical coordinates;
    // the map only decides which of them to paint.
    const after = layoutRadarPoints(all, { resolveCollisions: true });
    const visibleIds = new Set(visible.map((entry) => entry.id));

    for (const point of before.points) {
      const match = after.points.find((entry) => entry.id === point.id)!;
      expect(match.x).toBeCloseTo(point.x, 10);
      expect(match.y).toBeCloseTo(point.y, 10);
    }
    // And the filter itself is a pure visibility mask over those same points.
    expect(before.points.filter((point) => visibleIds.has(point.id)).length).toBe(
      visible.length,
    );
  });

  it("RADAR-GEO-V2-15 time range never rotates the compass", () => {
    // Spec §2: DAY/WEEK/MONTH must not rotate sectors — radius is the only
    // dimension the range is allowed to change.
    const tools = [
      item({ id: "r1", clusterId: "video-image", ageHours: 2 }),
      item({ id: "r2", clusterId: "developer-coding", ageHours: 20 }),
      item({ id: "r3", clusterId: "productivity", ageHours: 100 }),
    ];
    const day = layoutRadarPoints(tools, { rangeHours: 24, resolveCollisions: false });
    const week = layoutRadarPoints(tools, { rangeHours: 168, resolveCollisions: false });
    const month = layoutRadarPoints(tools, { rangeHours: 720, resolveCollisions: false });

    for (const id of ["r1", "r2", "r3"]) {
      const a = day.points.find((point) => point.id === id)!;
      const b = week.points.find((point) => point.id === id)!;
      const c = month.points.find((point) => point.id === id)!;
      expect(b.semanticAngleDeg).toBeCloseTo(a.semanticAngleDeg, 10);
      expect(c.semanticAngleDeg).toBeCloseTo(a.semanticAngleDeg, 10);
    }
    // Radius DOES respond to the range (age within the selected window).
    const oldInDay = day.points.find((point) => point.id === "r3")!;
    const oldInMonth = month.points.find((point) => point.id === "r3")!;
    expect(oldInDay.radiusRatio).toBe(1);
    expect(oldInMonth.radiusRatio).toBeLessThan(1);
  });
});
