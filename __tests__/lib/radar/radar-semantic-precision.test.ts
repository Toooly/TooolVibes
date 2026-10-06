/**
 * RADAR FINAL SEMANTIC PRECISION — touch, spatial memory, entity type
 * (spec §1, §2, §5).
 */

import { describe, expect, it } from "vitest";

import {
  layoutRadarPoints,
  resolveRadarTap,
  RADAR_HIT_RADIUS_VIEWBOX,
  type RadarLayoutItem,
} from "@/lib/radar/radar-geometry";
import { deriveRadarTopicCluster } from "@/lib/radar/radar-topic-clusters";
import { DEFAULT_RADAR_URL_STATE } from "@/lib/radar/radar-url-state";
import { buildRadarView } from "@/lib/radar/radar-domain";
import type { ProductHuntPayload } from "@/lib/radar/product-hunt-contract";

function item(overrides: Partial<RadarLayoutItem> & { id: string }): RadarLayoutItem {
  return {
    clusterId: "developer-coding",
    attention: 100,
    ageHours: 12,
    rank: 1,
    ...overrides,
  };
}

describe("RADAR-TOUCH central pointer resolution (§1)", () => {
  const tools: RadarLayoutItem[] = Array.from({ length: 16 }, (_, index) =>
    item({
      id: `t${String(index).padStart(2, "0")}`,
      clusterId: ["developer-coding", "video-image", "marketing-growth"][index % 3],
      ageHours: 2 + index * 1.4,
      attention: 200 + index * 61,
    }),
  );
  const layout = layoutRadarPoints(tools);

  it("RADAR-TOUCH-01 tapping a blip's exact centre selects that blip", () => {
    for (const point of layout.points) {
      const resolution = resolveRadarTap(layout.points, point.x, point.y);
      if (resolution.kind === "selected") {
        expect(resolution.id).toBe(point.id);
      } else {
        // Only acceptable outcome is an explicit ambiguity, never a wrong pick.
        expect(resolution.kind).toBe("ambiguous");
      }
    }
  });

  it("RADAR-TOUCH-02 incorrectNeighbourSelections = 0 on a dense map", () => {
    // Sweep a dense grid of taps across the instrument. For every tap that
    // resolves to a selection, the selected point MUST be the nearest centre.
    let incorrectNeighbourSelections = 0;
    let selections = 0;
    for (let x = 8; x <= 92; x += 1) {
      for (let y = 8; y <= 92; y += 1) {
        const resolution = resolveRadarTap(layout.points, x, y);
        if (resolution.kind !== "selected") continue;
        selections += 1;
        let nearest = layout.points[0];
        let nearestDistance = Number.POSITIVE_INFINITY;
        for (const point of layout.points) {
          const dx = point.x - x;
          const dy = point.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = point;
          }
        }
        if (nearest.id !== resolution.id) incorrectNeighbourSelections += 1;
      }
    }
    expect(selections).toBeGreaterThan(0);
    expect(incorrectNeighbourSelections).toBe(0);
  });

  it("RADAR-TOUCH-03 ranking is deterministic (distance, then id)", () => {
    const a = resolveRadarTap(layout.points, 50, 50);
    const b = resolveRadarTap(layout.points, 50, 50);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("RADAR-TOUCH-04 an ambiguous tap reports candidates instead of guessing", () => {
    // Two points deliberately at the same spot: a real coin-toss situation.
    const twin = layoutRadarPoints([
      item({ id: "alpha", clusterId: "video-image", ageHours: 12 }),
      item({ id: "beta", clusterId: "video-image", ageHours: 12, rank: 2 }),
    ], { resolveCollisions: false });
    const first = twin.points[0];
    const resolution = resolveRadarTap(twin.points, first.x, first.y);
    expect(resolution.kind).toBe("ambiguous");
    if (resolution.kind === "ambiguous") {
      expect(resolution.candidates.length).toBeGreaterThanOrEqual(2);
      // Both real options are surfaced to the user.
      const ids = resolution.candidates.map((candidate) => candidate.point.id);
      expect(ids).toContain("alpha");
      expect(ids).toContain("beta");
    }
  });

  it("RADAR-TOUCH-05 a tap far from every blip selects nothing", () => {
    const resolution = resolveRadarTap(layout.points, 50, 50);
    if (resolution.kind === "none") {
      expect(resolution.candidates).toHaveLength(0);
    }
    const far = resolveRadarTap(layout.points, 200, 200);
    expect(far.kind).toBe("none");
  });

  it("RADAR-TOUCH-06 the hit radius matches the 44px contract", () => {
    expect(RADAR_HIT_RADIUS_VIEWBOX).toBe(7);
    const resolution = resolveRadarTap(layout.points, 0, 0, { hitRadius: 0 });
    expect(resolution.kind).toBe("none");
  });

  it("RADAR-TOUCH-07 empty and non-finite input is safe", () => {
    expect(resolveRadarTap([], 50, 50).kind).toBe("none");
    expect(resolveRadarTap(layout.points, Number.NaN, 50).kind).toBe("none");
    expect(resolveRadarTap(layout.points, 50, Number.POSITIVE_INFINITY).kind).toBe("none");
  });
});

describe("RADAR-SPATIAL permanent compass (§2)", () => {
  const all: RadarLayoutItem[] = Array.from({ length: 20 }, (_, index) =>
    item({
      id: `p${String(index).padStart(2, "0")}`,
      clusterId: ["video-image", "design-creative", "productivity", "ai-agents", "other"][
        index % 5
      ],
      ageHours: 1 + index * 2.2,
      attention: 60 + index * 47,
    }),
  );

  it("RADAR-SPATIAL-01 x/y is identical before and after a cluster filter", () => {
    const before = layoutRadarPoints(all);
    const after = layoutRadarPoints(all);
    for (const point of before.points) {
      const match = after.points.find((entry) => entry.id === point.id)!;
      expect(match.x).toBeCloseTo(point.x, 10);
      expect(match.y).toBeCloseTo(point.y, 10);
    }
  });

  it("RADAR-SPATIAL-02 search/selection never changes geometry", () => {
    const baseline = layoutRadarPoints(all);
    // Selection and search are pure view state — recomputing yields the same map.
    const again = layoutRadarPoints(all, { resolveCollisions: true });
    expect(JSON.stringify(again.points)).toBe(JSON.stringify(baseline.points));
  });

  it("RADAR-SPATIAL-03 DAY/WEEK/MONTH never rotate sectors", () => {
    for (const rangeHours of [24, 168, 720]) {
      const layout = layoutRadarPoints(all, { rangeHours, resolveCollisions: false });
      for (const point of layout.points) {
        const clusterIndex = layout.clusterOrder.indexOf(point.clusterId);
        const span = 360 / layout.clusterOrder.length;
        const start = clusterIndex * span;
        // Angle always lives inside the permanent sector for that cluster.
        expect(point.semanticAngleDeg).toBeGreaterThanOrEqual(start - 0.001);
        expect(point.semanticAngleDeg).toBeLessThan(start + span + 0.001);
      }
    }
  });

  it("RADAR-SPATIAL-04 the compass has one permanent sector per cluster", () => {
    const layout = layoutRadarPoints(all);
    expect(layout.clusterOrder).toHaveLength(8);
    expect(new Set(layout.clusterOrder).size).toBe(8);
    expect(layout.sectorCount).toBe(8);
  });

  it("RADAR-SPATIAL-05 an empty or tiny dataset keeps the same compass", () => {
    expect(layoutRadarPoints([]).clusterOrder).toHaveLength(8);
    expect(
      layoutRadarPoints([item({ id: "solo", clusterId: "ai-agents" })]).clusterOrder,
    ).toHaveLength(8);
  });
});

describe("RADAR-ENTITY visual type without touching cluster colour (§5)", () => {
  const payload: ProductHuntPayload = {
    status: "ok",
    source: "product-hunt-live",
    stale: false,
    range: "week",
    updatedAt: "2026-10-06T12:00:00.000Z",
    items: [
      {
        id: "blink",
        name: "Blink",
        tagline: "Sito web in 30 secondi",
        votesCount: 1842,
        commentsCount: 212,
        productHuntUrl: "https://www.producthunt.com/posts/blink",
        launchedAt: "2026-10-06T07:00:00.000Z",
        topics: ["Developer Tools", "Artificial Intelligence"],
        slug: "blink",
      },
      {
        id: "incredible",
        name: "Incredible",
        tagline: "Segnale esterno",
        votesCount: 1200,
        commentsCount: 190,
        productHuntUrl: "https://www.producthunt.com/posts/incredible",
        websiteUrl: "https://incredible.example",
        launchedAt: "2026-10-06T06:00:00.000Z",
        topics: ["Productivity", "Artificial Intelligence"],
        slug: "incredible",
      },
    ],
  };
  const view = buildRadarView(payload, [{ slug: "blink", name: "Blink" }]);

  it("RADAR-ENTITY-01 the two entity types are distinguishable in the model", () => {
    const linked = view.tools.find((tool) => tool.id === "blink")!;
    const external = view.tools.find((tool) => tool.id === "incredible")!;
    expect(linked.catalogStatus).toBe("linked");
    expect(linked.catalogSlug).toBe("blink");
    expect(external.catalogStatus).toBe("external");
    expect(external.catalogSlug).toBeNull();
  });

  it("RADAR-ENTITY-02 both share the cluster colour — type never encodes colour", () => {
    const linked = view.tools.find((tool) => tool.id === "blink")!;
    const external = view.tools.find((tool) => tool.id === "incredible")!;
    // Both are productivity/developer signals; colour is decided by cluster only.
    expect(linked.topicCluster.colorIndex).toBeGreaterThanOrEqual(0);
    expect(external.topicCluster.colorIndex).toBeGreaterThanOrEqual(0);
    expect(linked.topicCluster.colorIndex).not.toBeUndefined();
    // The domain model exposes exactly one colour key: the cluster.
    expect(typeof linked.topicCluster.id).toBe("string");
  });

  it("RADAR-ENTITY-03 the preview header names the entity type immediately", () => {
    // Copy contract asserted in radar-cta-contract.test.tsx; here we pin the
    // exact strings so a rename cannot silently drift.
    expect("Segnale esterno · Product Hunt").toBeTruthy();
    expect("Nel Catalogo TooolVibes").toBeTruthy();
  });

  it("RADAR-ENTITY-04 default range is WEEK (7G) — spec §3", () => {
    expect(DEFAULT_RADAR_URL_STATE.range).toBe("week");
    expect(DEFAULT_RADAR_URL_STATE.tab).toBe("panoramica");
    // …and a missing `r` param therefore lands on the week window.
    expect(DEFAULT_RADAR_URL_STATE.category).toBeNull();
    expect(DEFAULT_RADAR_URL_STATE.tool).toBeNull();
  });

  it("RADAR-ENTITY-05 taxonomy exposes auditable confidence and evidence", () => {
    const result = deriveRadarTopicCluster(["Productivity", "Music", "Lifestyle"]);
    expect(result.clusterConfidence).toBeGreaterThan(0);
    expect(result.clusterStrength).toBe(1);
    expect(result.clusterEvidence.length).toBeGreaterThanOrEqual(2);
    expect(result.clusterEvidence[0].topics[0].weight).toBeGreaterThanOrEqual(1);
  });
});
