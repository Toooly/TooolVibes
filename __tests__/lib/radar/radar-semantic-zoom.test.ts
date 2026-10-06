/**
 * RADAR SEMANTIC ZOOM — Level-0 density, Level-1 camera, residual spiderfy.
 *
 * Spec §3 (cluster-first Overview), §5-§8 (camera, never geometry), §9
 * (spiderfy), §20-§22 (realistic dense-cluster and collision cases).
 */

import { describe, expect, it } from "vitest";

import {
  computeRadarCamera,
  RADAR_ZOOM_ALGORITHM,
  RADAR_ZOOM_BASE,
  RADAR_ZOOM_LADDER,
  RADAR_ZOOM_MAX,
  RADAR_ZOOM_TARGET_GAP_PX,
  type RadarCameraNode,
} from "@/lib/radar/radar-camera";
import {
  planRadarOverview,
  radarOverviewHiddenLabel,
  RADAR_OVERVIEW_ALGORITHM,
  type RadarLodInput,
} from "@/lib/radar/radar-lod";
import {
  planRadarSpiderfy,
  radarSpiderNeedsChooser,
  RADAR_SPIDER_RADIUS,
} from "@/lib/radar/radar-spiderfy";

function input(overrides: Partial<RadarLodInput> & { id: string }): RadarLodInput {
  return {
    clusterId: "developer-coding",
    attention: 100,
    ageHours: 10,
    catalogStatus: "external",
    semanticAngleDeg: 20,
    radiusRatio: 0.5,
    ...overrides,
  };
}

function node(overrides: Partial<RadarCameraNode> & { id: string }): RadarCameraNode {
  return { x: 50, y: 50, radius: 2, ...overrides };
}

/** Eight active clusters, 24 signals — the realistic QA shape. */
function realisticSet(): RadarLodInput[] {
  const clusters = [
    "developer-coding",
    "marketing-growth",
    "productivity",
    "design-creative",
    "no-code-automation",
    "video-image",
    "ai-agents",
    "other",
  ];
  const rows: RadarLodInput[] = [];
  let index = 0;
  for (const clusterId of clusters) {
    const count = clusterId === "developer-coding" ? 7 : clusterId === "other" ? 1 : 3;
    for (let k = 0; k < count; k += 1) {
      rows.push(
        input({
          id: `s${index}`,
          clusterId,
          attention: 2000 - index * 61,
          ageHours: index,
          catalogStatus: index < 3 ? "linked" : "external",
          semanticAngleDeg: (index * 17) % 360,
          radiusRatio: 0.15 + (index % 7) * 0.1,
        }),
      );
      index += 1;
    }
  }
  return rows;
}

describe("RADAR-ZOOM-OVERVIEW cluster-first Level 0 (§3)", () => {
  it("RADAR-ZOOM-OVER-01 lands in the 6-9 node band on a normal mobile set", () => {
    const plan = planRadarOverview(realisticSet(), { budget: 9 });
    expect(plan.representativeIds.size).toBeGreaterThanOrEqual(6);
    expect(plan.representativeIds.size).toBeLessThanOrEqual(9);
  });

  it("RADAR-ZOOM-OVER-02 keeps exactly one lead per active cluster", () => {
    const items = realisticSet();
    const plan = planRadarOverview(items, { budget: 9 });
    const active = new Set(items.map((item) => item.clusterId));
    for (const clusterId of active) {
      expect(plan.nodesPerCluster.get(clusterId) ?? 0).toBeGreaterThanOrEqual(1);
    }
    // The lead is the highest-attention member of that cluster.
    const lead = items
      .filter((item) => item.clusterId === "developer-coding")
      .sort((a, b) => b.attention - a.attention)[0];
    expect(plan.representativeIds.has(lead.id)).toBe(true);
  });

  it("RADAR-ZOOM-OVER-03 catalog-linked exceptions respect the budget and cap", () => {
    const items = realisticSet();
    const plan = planRadarOverview(items, { budget: 9 });
    expect(plan.representativeIds.size).toBeLessThanOrEqual(9);
    expect(plan.maxNodesPerCluster).toBeLessThanOrEqual(3);
  });

  it("RADAR-ZOOM-OVER-04 nothing is removed from the dataset", () => {
    const items = realisticSet();
    const plan = planRadarOverview(items, { budget: 9 });
    let hiddenTotal = 0;
    for (const [clusterId, bucket] of items.reduce((map, item) => {
      const list = map.get(item.clusterId) ?? [];
      list.push(item);
      map.set(item.clusterId, list);
      return map;
    }, new Map<string, RadarLodInput[]>())) {
      const shown = bucket.filter((item) => plan.representativeIds.has(item.id)).length;
      expect(plan.hiddenCounts.get(clusterId)).toBe(bucket.length - shown);
      hiddenTotal += bucket.length - shown;
    }
    expect(hiddenTotal).toBe(plan.totalHidden);
    expect(plan.representativeIds.size + plan.totalHidden).toBe(items.length);
  });

  it("RADAR-ZOOM-OVER-05 no duplicate representation (§2 invariant)", () => {
    const items = realisticSet();
    const plan = planRadarOverview(items, { budget: 9 });
    // §2 — a signal is NEVER both a spatial node and part of a hidden count.
    const hiddenMembers = items.filter((item) => !plan.representativeIds.has(item.id));
    const overlap = hiddenMembers.filter((item) => plan.representativeIds.has(item.id));
    expect(overlap).toHaveLength(0);
    for (const item of items) {
      const shown = plan.representativeIds.has(item.id);
      expect(shown).not.toBe(hiddenMembers.includes(item));
    }
    // The partition is exact.
    expect(hiddenMembers.length).toBe(plan.totalHidden);
    expect(plan.representativeIds.size + hiddenMembers.length).toBe(items.length);
  });

  it("RADAR-ZOOM-OVER-06 is deterministic and order-independent", () => {
    const items = realisticSet();
    const a = planRadarOverview(items, { budget: 9 });
    const b = planRadarOverview([...items].reverse(), { budget: 9 });
    expect([...a.representativeIds].sort()).toEqual([...b.representativeIds].sort());
    expect(a.totalHidden).toBe(b.totalHidden);
  });

  it("RADAR-ZOOM-OVER-07 the algorithm is documented and the badge is honest", () => {
    expect(RADAR_OVERVIEW_ALGORITHM).toContain("lead real signal per active cluster");
    expect(radarOverviewHiddenLabel(0)).toBe("");
    expect(radarOverviewHiddenLabel(5)).toBe("+5");
  });
});

describe("RADAR-ZOOM-CAMERA semantic zoom (§5-§8)", () => {
  it("RADAR-ZOOM-CAM-01 chooses the smallest valid zoom from the ladder", () => {
    // 4 units apart with radius 1.5 each => a 1-unit gap, far below the 9px
    // target at zoom 1, so the camera MUST zoom in.
    const tight = [
      node({ id: "a", x: 47, y: 50, radius: 1.5 }),
      node({ id: "b", x: 51, y: 50, radius: 1.5 }),
    ];
    const plan = computeRadarCamera(tight, { mapPx: 358 });
    expect([RADAR_ZOOM_BASE, ...RADAR_ZOOM_LADDER]).toContain(plan.zoom);
    expect(plan.zoom).toBeGreaterThan(RADAR_ZOOM_BASE);
    expect(plan.zoom).toBeLessThanOrEqual(RADAR_ZOOM_MAX);
    // A looser pair is already clear at zoom 1, so it never zooms harder.
    const loose = [
      node({ id: "a", x: 30, y: 50, radius: 1.5 }),
      node({ id: "b", x: 70, y: 50, radius: 1.5 }),
    ];
    expect(computeRadarCamera(loose, { mapPx: 358 }).zoom).toBeLessThanOrEqual(plan.zoom);
  });

  it("RADAR-ZOOM-CAM-02 is a viewport transform only — coordinates never change", () => {
    const nodes = [
      node({ id: "a", x: 44, y: 48, radius: 2 }),
      node({ id: "b", x: 52, y: 55, radius: 2 }),
    ];
    const before = JSON.stringify(nodes);
    const plan = computeRadarCamera(nodes, { mapPx: 358 });
    expect(JSON.stringify(nodes)).toBe(before);
    expect(plan.transform).toMatch(/^translate\(/);
    expect(plan.transform).toContain("scale(");
  });

  it("RADAR-ZOOM-CAM-03 reaches the 8-10px gap target whenever geometry allows", () => {
    // A 2-unit edge gap: too tight at zoom 1, comfortably clear once zoomed.
    const nodes = [
      node({ id: "a", x: 48, y: 50, radius: 1.5 }),
      node({ id: "b", x: 53, y: 50, radius: 1.5 }),
    ];
    const plan = computeRadarCamera(nodes, { mapPx: 358 });
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_ZOOM_TARGET_GAP_PX);
    expect(RADAR_ZOOM_TARGET_GAP_PX).toBeGreaterThanOrEqual(8);
    expect(RADAR_ZOOM_TARGET_GAP_PX).toBeLessThanOrEqual(10);
  });

  it("RADAR-ZOOM-CAM-04 zoom stays inside the documented bounds", () => {
    for (const spread of [0.5, 2, 8, 30]) {
      const nodes = [
        node({ id: "a", x: 50 - spread, y: 50, radius: 1.5 }),
        node({ id: "b", x: 50 + spread, y: 50, radius: 1.5 }),
      ];
      const plan = computeRadarCamera(nodes, { mapPx: 358 });
      expect(plan.zoom).toBeGreaterThanOrEqual(RADAR_ZOOM_BASE);
      expect(plan.zoom).toBeLessThanOrEqual(RADAR_ZOOM_MAX);
    }
  });

  it("RADAR-ZOOM-CAM-05 globally overlapping nodes report residuals for spiderfy", () => {
    const twins = [
      node({ id: "a", x: 50, y: 50, radius: 2 }),
      node({ id: "b", x: 50.2, y: 50, radius: 2 }),
    ];
    const plan = computeRadarCamera(twins, { mapPx: 358 });
    expect(plan.spiderfyRequired).toBe(true);
    expect(plan.residualCollisionIds).toHaveLength(1);
    expect(plan.residualCollisionIds[0]).toEqual(["a", "b"]);
  });

  it("RADAR-ZOOM-CAM-06 is deterministic", () => {
    const nodes = [
      node({ id: "a", x: 41, y: 44, radius: 1.7 }),
      node({ id: "b", x: 47, y: 52, radius: 2.4 }),
      node({ id: "c", x: 55, y: 47, radius: 1.2 }),
    ];
    const a = computeRadarCamera(nodes, { mapPx: 358 });
    const b = computeRadarCamera(nodes.map((n) => ({ ...n })), { mapPx: 358 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("RADAR-ZOOM-CAM-07 documents its algorithm and is empty-safe", () => {
    expect(RADAR_ZOOM_ALGORITHM).toContain("smallest valid zoom");
    const plan = computeRadarCamera([], { mapPx: 358 });
    expect(plan.zoom).toBe(RADAR_ZOOM_BASE);
    expect(plan.spiderfyRequired).toBe(false);
  });

  it("RADAR-ZOOM-CAM-08 realistic dense cluster separates cleanly", () => {
    // Sviluppo & Coding dense: the physical "string of beads" — 7 signals
    // strung along similar radii with a 1.3-unit edge gap.
    const beads = Array.from({ length: 7 }, (_, index) =>
      node({
        id: `b${index}`,
        x: 36 + index * 4.5,
        y: 50,
        radius: 1.6,
      }),
    );
    const plan = computeRadarCamera(beads, { mapPx: 358 });
    expect(plan.zoom).toBeGreaterThan(RADAR_ZOOM_BASE);
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_ZOOM_TARGET_GAP_PX);
    expect(plan.spiderfyRequired).toBe(false);
  });
});

describe("RADAR-ZOOM-SPIDERFY residual collisions (§9)", () => {
  it("RADAR-ZOOM-SPIDER-01 fans out ONLY the colliding group", () => {
    const plan = planRadarSpiderfy([
      node({ id: "a", x: 50, y: 50, radius: 2 }),
      node({ id: "b", x: 50.1, y: 50, radius: 2 }),
      node({ id: "far", x: 80, y: 80, radius: 2 }),
    ]);
    expect(plan.groups).toHaveLength(1);
    expect([...plan.spideredIds].sort()).toEqual(["a", "b"]);
    expect(plan.spideredIds.has("far")).toBe(false);
  });

  it("RADAR-ZOOM-SPIDER-02 the semantic anchor is the mean and never moves", () => {
    const plan = planRadarSpiderfy([
      node({ id: "a", x: 49, y: 51, radius: 1.5 }),
      node({ id: "b", x: 51, y: 49, radius: 1.5 }),
    ]);
    const group = plan.groups[0];
    expect(group.anchor.x).toBeCloseTo(50, 10);
    expect(group.anchor.y).toBeCloseTo(50, 10);
    // Every leg sits exactly on the fan ring around that anchor.
    for (const leg of group.legs) {
      const d = Math.sqrt((leg.x - group.anchor.x) ** 2 + (leg.y - group.anchor.y) ** 2);
      expect(d).toBeCloseTo(RADAR_SPIDER_RADIUS, 10);
    }
    expect(group.connectors).toHaveLength(group.legs.length);
  });

  it("RADAR-ZOOM-SPIDER-03 unrelated signals are never re-laid out", () => {
    const plan = planRadarSpiderfy([
      node({ id: "a", x: 50, y: 50, radius: 2 }),
      node({ id: "b", x: 50.1, y: 50, radius: 2 }),
      node({ id: "far", x: 80, y: 80, radius: 2 }),
    ]);
    expect(plan.groups.some((g) => g.memberIds.includes("far"))).toBe(false);
  });

  it("RADAR-ZOOM-SPIDER-04 is deterministic", () => {
    const nodes = [
      node({ id: "a", x: 50, y: 50, radius: 2 }),
      node({ id: "b", x: 50.1, y: 50, radius: 2 }),
      node({ id: "c", x: 50.2, y: 50.1, radius: 2 }),
    ];
    const a = planRadarSpiderfy(nodes);
    const b = planRadarSpiderfy(nodes.map((n) => ({ ...n })));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it("RADAR-ZOOM-SPIDER-05 huge coincident groups fall back to the chooser (§10)", () => {
    const plan = planRadarSpiderfy(
      Array.from({ length: 8 }, (_, index) =>
        node({ id: `x${index}`, x: 50, y: 50, radius: 1 }),
      ),
    );
    expect(plan.groups).toHaveLength(1);
    expect(radarSpiderNeedsChooser(plan.groups[0])).toBe(true);
  });

  it("RADAR-ZOOM-SPIDER-06 empty and single-node sets are safe", () => {
    expect(planRadarSpiderfy([]).groups).toHaveLength(0);
    expect(planRadarSpiderfy([node({ id: "only" })]).groups).toHaveLength(0);
  });
});
