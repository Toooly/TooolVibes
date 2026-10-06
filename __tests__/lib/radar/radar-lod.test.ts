/**
 * Radar Level of Detail tests (spec §3-§10, §21, §22).
 *
 * The physical recording showed 7G/30G saturating the instrument. LOD is a
 * VISUAL budget only: no signal may ever leave the dataset, the list, search
 * or the semantic model. These tests pin that contract.
 */

import { describe, expect, it } from "vitest";

import {
  planRadarLod,
  radarAggregateLabel,
  radarClusterFocusMembers,
  radarLodPerClusterCap,
  RADAR_LOD_ALGORITHM,
  RADAR_LOD_BUDGET_DESKTOP,
  RADAR_LOD_BUDGET_MOBILE,
  type RadarLodInput,
} from "@/lib/radar/radar-lod";
import { layoutRadarPoints } from "@/lib/radar/radar-geometry";

const CLUSTERS = [
  "video-image",
  "design-creative",
  "no-code-automation",
  "marketing-growth",
  "productivity",
  "developer-coding",
  "ai-agents",
] as const;

/** layoutRadarPoints wants a rank; LOD inputs do not carry one. */
function asLayout(items: readonly RadarLodInput[]) {
  return items.map((item, index) => ({ ...item, rank: index + 1 }));
}

function makeItems(count = 24): RadarLodInput[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `t${String(index).padStart(2, "0")}`,
    clusterId: CLUSTERS[index % CLUSTERS.length],
    attention: 50 + ((index * 97) % 900),
    ageHours: (index * 7) % 240,
    catalogStatus: index < 3 ? "linked" : "external",
    semanticAngleDeg: (index * 15) % 360,
    radiusRatio: 0.15 + ((index % 10) * 0.08),
  }));
}

describe("RADAR-LOD overview display budget", () => {
  it("RADAR-LOD-01 the overview never exceeds its budget", () => {
    const items = makeItems(24);
    const plan = planRadarLod(items, { budget: RADAR_LOD_BUDGET_MOBILE });
    expect(plan.individualIds.size).toBeLessThanOrEqual(RADAR_LOD_BUDGET_MOBILE);
    expect(plan.individualIds.size).toBeGreaterThan(0);
    expect(plan.budget).toBe(RADAR_LOD_BUDGET_MOBILE);
  });

  it("RADAR-LOD-02 no signal is removed from the dataset", () => {
    const items = makeItems(24);
    const plan = planRadarLod(items, { budget: 11 });
    const represented = new Set(plan.individualIds);
    for (const aggregate of plan.aggregates) {
      for (const id of aggregate.memberIds) represented.add(id);
    }
    expect(represented.size).toBe(items.length);
    for (const item of items) expect(represented.has(item.id)).toBe(true);
  });

  it("RADAR-LOD-03 the selected signal is always individual", () => {
    const items = makeItems(24);
    // Pick a low-attention signal that would otherwise be aggregated.
    const weak = [...items].sort((a, b) => a.attention - b.attention)[0];
    const plan = planRadarLod(items, { budget: 8, selectedId: weak.id });
    expect(plan.individualIds.has(weak.id)).toBe(true);
  });

  it("RADAR-LOD-04 catalog-linked signals are preferred (phase B)", () => {
    const items = makeItems(24);
    const plan = planRadarLod(items, { budget: 11 });
    for (const item of items.filter((entry) => entry.catalogStatus === "linked")) {
      expect(plan.individualIds.has(item.id)).toBe(true);
    }
  });

  it("RADAR-LOD-05 every active cluster keeps a representative", () => {
    const items = makeItems(24);
    const plan = planRadarLod(items, { budget: 11 });
    const representedClusters = new Set(
      items
        .filter((item) => plan.individualIds.has(item.id))
        .map((item) => item.clusterId),
    );
    for (const clusterId of new Set(items.map((item) => item.clusterId))) {
      expect(representedClusters.has(clusterId)).toBe(true);
    }
  });

  it("RADAR-LOD-06 a per-cluster cap stops one cluster consuming the overview", () => {
    // 20 of 24 signals in one cluster — a pathological case.
    const items: RadarLodInput[] = [
      ...Array.from({ length: 20 }, (_, index) => ({
        id: `big${index}`,
        clusterId: "developer-coding",
        attention: 1000 - index,
        ageHours: index,
        catalogStatus: "external" as const,
        semanticAngleDeg: index * 2,
        radiusRatio: 0.2 + index * 0.03,
      })),
      ...Array.from({ length: 4 }, (_, index) => ({
        id: `small${index}`,
        clusterId: "video-image",
        attention: 50 + index,
        ageHours: index,
        catalogStatus: "external" as const,
        semanticAngleDeg: 200 + index * 2,
        radiusRatio: 0.3 + index * 0.05,
      })),
    ];
    const plan = planRadarLod(items, { budget: 11 });
    const bigCount = items.filter(
      (item) => item.clusterId === "developer-coding" && plan.individualIds.has(item.id),
    ).length;
    const smallCount = items.filter(
      (item) => item.clusterId === "video-image" && plan.individualIds.has(item.id),
    ).length;
    expect(smallCount).toBeGreaterThan(0);
    expect(bigCount).toBeLessThanOrEqual(plan.perClusterCap + 1);
  });

  it("RADAR-LOD-07 the plan is fully deterministic", () => {
    const items = makeItems(24);
    const a = planRadarLod(items, { budget: 11, selectedId: "t05" });
    const b = planRadarLod([...items].reverse(), { budget: 11, selectedId: "t05" });
    expect([...a.individualIds].sort()).toEqual([...b.individualIds].sort());
    expect(JSON.stringify(a.aggregates)).toBe(JSON.stringify(b.aggregates));
  });

  it("RADAR-LOD-08 the algorithm is documented and inspectable", () => {
    expect(RADAR_LOD_ALGORITHM).toContain("selected");
    expect(RADAR_LOD_ALGORITHM).toContain("catalog-linked");
    expect(RADAR_LOD_ALGORITHM).toContain("attention");
    expect(RADAR_LOD_ALGORITHM).toContain("cap");
    const plan = planRadarLod(makeItems(24), { budget: 11 });
    expect(plan.algorithm).toBe(RADAR_LOD_ALGORITHM);
  });
});

describe("RADAR-LOD aggregate nodes", () => {
  it("RADAR-LOD-09 aggregates cover exactly the leftover signals", () => {
    const items = makeItems(24);
    const plan = planRadarLod(items, { budget: 11 });
    const aggregated = plan.aggregates.flatMap((aggregate) => aggregate.memberIds);
    expect(new Set(aggregated).size).toBe(aggregated.length);
    for (const id of aggregated) expect(plan.individualIds.has(id)).toBe(false);
    for (const item of items) {
      const inPlan = plan.individualIds.has(item.id);
      const inAgg = aggregated.includes(item.id);
      expect(inPlan !== inAgg).toBe(true);
    }
  });

  it("RADAR-LOD-10 an aggregate is never a Tool", () => {
    const items = makeItems(24);
    const plan = planRadarLod(items, { budget: 8 });
    for (const aggregate of plan.aggregates) {
      expect(aggregate.id.startsWith("agg:")).toBe(true);
      expect(items.some((item) => item.id === aggregate.id)).toBe(false);
      expect(aggregate.count).toBe(aggregate.memberIds.length);
      expect(aggregate.count).toBeGreaterThan(0);
    }
    expect(radarAggregateLabel(5, "Sviluppo & Coding")).toBe(
      "5 altri segnali in Sviluppo & Coding",
    );
  });

  it("RADAR-LOD-11 aggregate position is deterministic and inside its sector", () => {
    const items = makeItems(24);
    const plan = planRadarLod(items, { budget: 8 });
    const again = planRadarLod(items, { budget: 8 });
    expect(JSON.stringify(plan.aggregates)).toBe(JSON.stringify(again.aggregates));
    for (const aggregate of plan.aggregates) {
      // Median semantic radius of the members — never random.
      const members = items.filter((item) => aggregate.memberIds.includes(item.id));
      const radii = members.map((member) => member.radiusRatio).sort((a, b) => a - b);
      const mid = Math.floor(radii.length / 2);
      const expected =
        radii.length % 2 === 0 ? (radii[mid - 1] + radii[mid]) / 2 : radii[mid];
      expect(aggregate.radiusRatio).toBeCloseTo(expected, 10);
    }
  });

  it("RADAR-LOD-12 aggregation never changes a signal's semantic coordinates", () => {
    const items = makeItems(24);
    const before = layoutRadarPoints(asLayout(items), { rangeHours: 24 }).points;
    planRadarLod(items, { budget: 8 });
    const after = layoutRadarPoints(asLayout(items), { rangeHours: 24 }).points;
    for (let index = 0; index < before.length; index += 1) {
      expect(after[index].x).toBeCloseTo(before[index].x, 10);
      expect(after[index].y).toBeCloseTo(before[index].y, 10);
      expect(after[index].radiusRatio).toBeCloseTo(before[index].radiusRatio, 10);
    }
  });

  it("RADAR-LOD-13 a full dataset produces no aggregates at all", () => {
    const items = makeItems(3);
    const plan = planRadarLod(items, { budget: 11 });
    expect(plan.aggregates).toHaveLength(0);
    expect(plan.individualIds.size).toBe(3);
  });

  it("RADAR-LOD-14 an empty dataset is safe", () => {
    const plan = planRadarLod([], { budget: 11 });
    expect(plan.individualIds.size).toBe(0);
    expect(plan.aggregates).toHaveLength(0);
  });
});

describe("RADAR-LOD cluster focus (§8/§9/§22)", () => {
  it("RADAR-LOD-15 cluster focus shows every member of the focused cluster", () => {
    const items = makeItems(24);
    for (const clusterId of CLUSTERS) {
      const members = radarClusterFocusMembers(items, clusterId);
      const expected = items.filter((item) => item.clusterId === clusterId);
      expect(members.size).toBe(expected.length);
      for (const item of expected) expect(members.has(item.id)).toBe(true);
    }
  });

  it("RADAR-LOD-16 focus displays all members — no nested aggregation", () => {
    const items = makeItems(24);
    const plan = planRadarLod(items, { budget: 8 });
    // The focused cluster's aggregate is dropped; members are all shown.
    const focused = "developer-coding";
    const members = radarClusterFocusMembers(items, focused);
    expect(members.size).toBeGreaterThan(plan.perClusterCap);
    for (const id of members) expect(items.some((item) => item.id === id)).toBe(true);
    // Nothing deeper than one aggregate level exists in the model.
    for (const aggregate of plan.aggregates) {
      expect(aggregate.memberIds.every((id) => !id.startsWith("agg:"))).toBe(true);
    }
  });

  it("RADAR-LOD-17 desktop budget is larger than mobile but still bounded", () => {
    const items = makeItems(24);
    const mobile = planRadarLod(items, { budget: RADAR_LOD_BUDGET_MOBILE });
    const desktop = planRadarLod(items, { budget: RADAR_LOD_BUDGET_DESKTOP });
    expect(RADAR_LOD_BUDGET_DESKTOP).toBeGreaterThan(RADAR_LOD_BUDGET_MOBILE);
    expect(desktop.individualIds.size).toBeGreaterThan(mobile.individualIds.size);
    expect(desktop.individualIds.size).toBeLessThanOrEqual(RADAR_LOD_BUDGET_DESKTOP);
    // Desktop must NOT fall back to "show everything".
    expect(desktop.individualIds.size).toBeLessThan(items.length);
  });

  it("RADAR-LOD-18 the per-cluster cap is sensible and documented", () => {
    expect(radarLodPerClusterCap(11, 8)).toBe(2);
    expect(radarLodPerClusterCap(17, 8)).toBe(3);
    expect(radarLodPerClusterCap(11, 1)).toBe(11);
    expect(radarLodPerClusterCap(4, 20)).toBe(2);
  });
});
