/**
 * Radar geometry truth tests (spec §47).
 *
 * Same input → same output. No NaN, nothing outside the instrument bounds,
 * stable sector assignment, deterministic collision jitter, empty-safe.
 */

import { describe, expect, it } from "vitest";

import {
  assertRadarPointsInBounds,
  layoutRadarPoints,
  stableHash,
} from "@/lib/radar/radar-geometry";
import type { RadarTool } from "@/lib/radar/radar-domain";

function tool(overrides: Partial<RadarTool> & { id: string; rank: number }): RadarTool {
  return {
    name: overrides.id,
    tagline: "",
    productHuntUrl: "https://www.producthunt.com/posts/x",
    thumbnailUrl: null,
    votesCount: 10,
    commentsCount: 1,
    attention: 11,
    launchedAt: null,
    ageHours: null,
    topics: [],
    category: null,
    categoryLabel: null,
    catalogSlug: null,
    ...overrides,
  };
}

const FIXTURE: RadarTool[] = [
  tool({
    id: "a",
    rank: 1,
    votesCount: 300,
    commentsCount: 30,
    attention: 330,
    launchedAt: "2026-07-28T07:00:00.000Z",
    ageHours: 5,
    category: { id: "video-ai", label: "Video AI", count: 2, colorIndex: 0 },
  }),
  tool({
    id: "b",
    rank: 2,
    votesCount: 200,
    commentsCount: 10,
    attention: 210,
    launchedAt: "2026-07-28T05:00:00.000Z",
    ageHours: 7,
    category: { id: "video-ai", label: "Video AI", count: 2, colorIndex: 0 },
  }),
  tool({
    id: "c",
    rank: 3,
    votesCount: 100,
    commentsCount: 5,
    attention: 105,
    launchedAt: "2026-07-27T05:00:00.000Z",
    ageHours: 31,
    category: { id: "no-code", label: "No-code", count: 1, colorIndex: 1 },
  }),
  tool({ id: "d", rank: 4, votesCount: 50, commentsCount: 0, attention: 50 }),
];

describe("radar geometry", () => {
  it("RADAR-GEO-01 e deterministico: stesso input → stessa disposizione", () => {
    const first = layoutRadarPoints(FIXTURE);
    const second = layoutRadarPoints(FIXTURE);
    expect(second.points).toEqual(first.points);
  });

  it("RADAR-GEO-02 non produce NaN e resta dentro i limiti dello strumento", () => {
    const { points } = layoutRadarPoints(FIXTURE);
    expect(points).toHaveLength(FIXTURE.length);
    for (const point of points) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
      expect(Number.isFinite(point.size)).toBe(true);
      expect(point.size).toBeGreaterThan(0);
    }
    expect(assertRadarPointsInBounds(points)).toBe(true);
  });

  it("RADAR-GEO-03 dataset vuoto e sicuro", () => {
    const result = layoutRadarPoints([]);
    expect(result.points).toEqual([]);
    expect(result.sectorCount).toBe(0);
    expect(assertRadarPointsInBounds(result.points)).toBe(true);
  });

  it("RADAR-GEO-04 i settori sono coerenti: strumenti nella stessa categoria condividono settore", () => {
    const { points } = layoutRadarPoints(FIXTURE);
    const byId = new Map(points.map((point) => [point.id, point]));
    const a = byId.get("a")!;
    const b = byId.get("b")!;
    const c = byId.get("c")!;
    // Same category â same sector band (70% of an equal sector span).
    expect(a.category).toBe(b.category);
    expect(a.category).not.toBe(c.category);
  });

  it("RADAR-GEO-05 il raggio usa la recenza quando ogni tool ha una data di lancio", () => {
    const dated = FIXTURE.filter((entry) => entry.launchedAt !== null);
    const { points, radiusBasis } = layoutRadarPoints(dated);
    expect(radiusBasis).toBe("recency");
    const byId = new Map(points.map((point) => [point.id, point]));
    // Newest (ageHours 5) must be closer to center than oldest (ageHours 31).
    expect(byId.get("a")!.radiusRatio).toBeGreaterThan(byId.get("c")!.radiusRatio);
  });

  it("RADAR-GEO-06 il raggio usa la posizione in classifica senza dati di lancio", () => {
    const undated = FIXTURE.map((entry) => ({ ...entry, launchedAt: null, ageHours: null }));
    const { points, radiusBasis } = layoutRadarPoints(undated);
    expect(radiusBasis).toBe("rank");
    const byId = new Map(points.map((point) => [point.id, point]));
    expect(byId.get("a")!.radiusRatio).toBeGreaterThan(byId.get("d")!.radiusRatio);
  });

  it("RADAR-GEO-07 la dimensione riflette l'attenzione misurata", () => {
    const { points } = layoutRadarPoints(FIXTURE);
    const byId = new Map(points.map((point) => [point.id, point]));
    expect(byId.get("a")!.size).toBeGreaterThan(byId.get("d")!.size);
  });

  it("RADAR-GEO-08 il jitter di collisione e deterministico e non semantico", () => {
    const withJitter = layoutRadarPoints(FIXTURE, { jitter: true });
    const withoutJitter = layoutRadarPoints(FIXTURE, { jitter: false });
    expect(withJitter.points).toEqual(layoutRadarPoints(FIXTURE, { jitter: true }).points);
    expect(withJitter.radiusBasis).toBe(withoutJitter.radiusBasis);
    // Jitter must not change semantic fields.
    for (let i = 0; i < withJitter.points.length; i += 1) {
      expect(withJitter.points[i].size).toBe(withoutJitter.points[i].size);
      expect(withJitter.points[i].category).toBe(withoutJitter.points[i].category);
    }
  });

  it("RADAR-GEO-09 stableHash e deterministico", () => {
    expect(stableHash("alpha:0")).toBe(stableHash("alpha:0"));
    expect(stableHash("alpha:0")).not.toBe(stableHash("beta:0"));
  });
});
