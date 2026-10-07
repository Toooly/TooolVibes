/**
 * SECTOR LENS tests (spec §4-§10, §23).
 *
 * Proves the lens is display-only angular magnification: semantic coordinates
 * survive byte-identically, radius still encodes age, the smallest sufficient
 * lens width is chosen, and the overlap contract is ZERO.
 */

import { describe, expect, it } from "vitest";

import {
  planRadarSectorLens,
  RADAR_LENS_MAX_RELAX_DEG,
  RADAR_LENS_SEMANTIC_SECTOR_DEG,
  RADAR_LENS_TARGET_GAP_PX,
  RADAR_LENS_WIDTHS,
  type RadarLensItem,
} from "@/lib/radar/radar-lens";
import type { RadarRect } from "@/lib/radar/radar-projection";

const RECT: RadarRect = { left: 0, top: 0, width: 358, height: 358 };

function item(overrides: Partial<RadarLensItem> & { id: string }): RadarLensItem {
  return {
    clusterId: "developer-coding",
    semanticAngleDeg: 22.5,
    radiusRatio: 0.5,
    radius: 3,
    ...overrides,
  };
}

describe("RADAR-LENS display-only angular magnification (§4-§6)", () => {
  it("RADAR-LENS-01 expands the 45 degree semantic sector into a wide lens", () => {
    const items = [
      item({ id: "a", semanticAngleDeg: 8, radiusRatio: 0.5 }),
      item({ id: "b", semanticAngleDeg: 38, radiusRatio: 0.5 }),
    ];
    const plan = planRadarSectorLens(items, { clusterId: "developer-coding", rect: RECT });
    // The narrow 30 degree semantic spread must open up in display space.
    const before = Math.abs(items[0].semanticAngleDeg - items[1].semanticAngleDeg);
    const after = Math.abs(plan.nodes[0].displayAngleDeg - plan.nodes[1].displayAngleDeg);
    expect(after).toBeGreaterThan(before);
    expect(plan.magnification).toBeGreaterThanOrEqual(1);
  });

  it("RADAR-LENS-02 semantic angles and radii are never mutated (§4/§5)", () => {
    const items = Array.from({ length: 6 }, (_, index) =>
      item({
        id: "s" + index,
        semanticAngleDeg: 5 + index * 7,
        radiusRatio: 0.2 + index * 0.12,
      }),
    );
    const snapshot = items.map((entry) => ({ ...entry }));
    const plan = planRadarSectorLens(items, { clusterId: "developer-coding", rect: RECT });
    // The input array is byte-identical afterwards.
    expect(items).toEqual(snapshot);
    for (const node of plan.nodes) {
      const source = snapshot.find((entry) => entry.id === node.id)!;
      expect(node.semanticAngleDeg).toBe(source.semanticAngleDeg);
      // Radius is age: identical before and after the lens (§5).
      expect(node.semanticRadiusRatio).toBeCloseTo(source.radiusRatio, 10);
    }
  });

  it("RADAR-LENS-03 radius keeps encoding age under magnification (§5)", () => {
    const items = [
      item({ id: "new", semanticAngleDeg: 20, radiusRatio: 0.15 }),
      item({ id: "old", semanticAngleDeg: 25, radiusRatio: 0.9 }),
    ];
    const plan = planRadarSectorLens(items, { clusterId: "developer-coding", rect: RECT });
    const newer = plan.displayById.get("new")!;
    const older = plan.displayById.get("old")!;
    const dNew = Math.hypot(newer.displayX - 50, newer.displayY - 50);
    const dOld = Math.hypot(older.displayX - 50, older.displayY - 50);
    // Newer is still closer to the centre than older.
    expect(dNew).toBeLessThan(dOld);
  });

  it("RADAR-LENS-04 uses the smallest sufficient lens width (§7)", () => {
    // Two moderately separated markers need only a modest lens.
    const loose = [
      item({ id: "a", semanticAngleDeg: 4, radiusRatio: 0.5 }),
      item({ id: "b", semanticAngleDeg: 40, radiusRatio: 0.5 }),
    ];
    const loosePlan = planRadarSectorLens(loose, { clusterId: "developer-coding", rect: RECT });
    expect(loosePlan.lensWidthDeg).toBeLessThanOrEqual(RADAR_LENS_WIDTHS[RADAR_LENS_WIDTHS.length - 1]);

    // Six tightly packed markers need a wider one.
    const tight = Array.from({ length: 6 }, (_, index) =>
      item({ id: "t" + index, semanticAngleDeg: 14 + index * 1.6, radiusRatio: 0.55 }),
    );
    const tightPlan = planRadarSectorLens(tight, { clusterId: "developer-coding", rect: RECT });
    expect(tightPlan.lensWidthDeg).toBeGreaterThanOrEqual(loosePlan.lensWidthDeg);
  });

  it("RADAR-LENS-05 ZERO overlap after the lens (§8)", () => {
    for (const count of [2, 3, 5, 6, 7]) {
      const items = Array.from({ length: count }, (_, index) =>
        item({
          id: "z" + index,
          semanticAngleDeg: 8 + index * 1.1,
          radiusRatio: 0.45 + index * 0.05,
          radius: 3.6,
        }),
      );
      const plan = planRadarSectorLens(items, { clusterId: "developer-coding", rect: RECT });
      expect(plan.overlapCount).toBe(0);
      expect(plan.minimumGapPx).toBeGreaterThanOrEqual(RADAR_LENS_TARGET_GAP_PX);
    }
  });

  it("RADAR-LENS-06 local relaxation is bounded and never touches semantics (§9)", () => {
    const items = Array.from({ length: 6 }, (_, index) =>
      item({
        id: "r" + index,
        semanticAngleDeg: 20 + index * 0.8,
        radiusRatio: 0.5,
        radius: 4.4,
      }),
    );
    const snapshot = items.map((entry) => ({ ...entry }));
    const plan = planRadarSectorLens(items, { clusterId: "developer-coding", rect: RECT });
    expect(items).toEqual(snapshot);
    expect(plan.maxDisplayDisplacementDeg).toBeLessThanOrEqual(RADAR_LENS_MAX_RELAX_DEG);
    expect(plan.overlapCount).toBe(0);
  });

  it("RADAR-LENS-07 the lens preserves relative angular ordering (§9)", () => {
    const items = Array.from({ length: 5 }, (_, index) =>
      item({ id: "o" + index, semanticAngleDeg: 6 + index * 8, radiusRatio: 0.5 }),
    );
    const plan = planRadarSectorLens(items, { clusterId: "developer-coding", rect: RECT });
    const ordered = items
      .slice()
      .sort((a, b) => a.semanticAngleDeg - b.semanticAngleDeg)
      .map((entry) => entry.id);
    const displayOrder = plan.nodes
      .slice()
      .sort((a, b) => a.displayAngleDeg - b.displayAngleDeg)
      .map((entry) => entry.id);
    expect(displayOrder).toEqual(ordered);
  });

  it("RADAR-LENS-08 only genuinely unresolvable clusters reach spiderfy (§10)", () => {
    const distinct = Array.from({ length: 5 }, (_, index) =>
      item({ id: "d" + index, semanticAngleDeg: 8 + index * 7, radiusRatio: 0.5 }),
    );
    const plan = planRadarSectorLens(distinct, { clusterId: "developer-coding", rect: RECT });
    // A normal cluster must NOT fall back to spiderfy or the chooser.
    expect(plan.residualCollisionIds).toHaveLength(0);

    // Coincident anchors ARE resolvable now: the lens spreads them along the
    // arc, which is exactly the goal of §8/§11 (no spiderfy in normal use).
    const coincident = Array.from({ length: 3 }, (_, index) =>
      item({ id: "c" + index, semanticAngleDeg: 22.5, radiusRatio: 0.5, radius: 3 }),
    );
    const spreadable = planRadarSectorLens(coincident, {
      clusterId: "developer-coding",
      rect: RECT,
    });
    expect(spreadable.overlapCount).toBe(0);
    expect(spreadable.residualCollisionIds).toHaveLength(0);

    // Only a physically impossible packing (huge markers, tiny viewport) still
    // reports residuals - and that is what spiderfy is the last resort for.
    const impossible = Array.from({ length: 14 }, (_, index) =>
      item({
        id: "i" + index,
        semanticAngleDeg: 22.5,
        radiusRatio: 0.5,
        radius: 5.6,
      }),
    );
    const stuck = planRadarSectorLens(impossible, {
      clusterId: "developer-coding",
      rect: { left: 0, top: 0, width: 180, height: 180 },
    });
    expect(stuck.residualCollisionIds.length).toBeGreaterThan(0);
  });

  it("RADAR-LENS-09 reports the §23 before/after collision record", () => {
    const items = Array.from({ length: 5 }, (_, index) =>
      item({
        id: "m" + index,
        semanticAngleDeg: 21 + index * 0.7,
        radiusRatio: 0.5,
        radius: 4,
      }),
    );
    const plan = planRadarSectorLens(items, { clusterId: "developer-coding", rect: RECT });
    // The crowded semantic sector overlaps; the lens must clear it.
    expect(plan.overlapBeforeCount).toBeGreaterThan(0);
    expect(plan.overlapCount).toBe(0);
    expect(plan.minimumGapPx).toBeGreaterThanOrEqual(RADAR_LENS_TARGET_GAP_PX);
  });

  it("RADAR-LENS-10 the algorithm is documented and empty-safe", () => {
    expect(planRadarSectorLens([], { clusterId: "developer-coding", rect: RECT }).nodes).toHaveLength(0);
    const plan = planRadarSectorLens([], { clusterId: "developer-coding", rect: RECT });
    expect(plan.overlapCount).toBe(0);
    expect(plan.magnification).toBeGreaterThan(0);
  });

  it("RADAR-LENS-11 a single signal needs no lens at all", () => {
    const plan = planRadarSectorLens([item({ id: "only" })], {
      clusterId: "developer-coding",
      rect: RECT,
    });
    expect(plan.magnification).toBe(1);
    expect(plan.lensWidthDeg).toBe(RADAR_LENS_SEMANTIC_SECTOR_DEG);
    expect(plan.residualCollisionIds).toHaveLength(0);
  });

  it("RADAR-LENS-12 is deterministic and order-independent", () => {
    const items = Array.from({ length: 6 }, (_, index) =>
      item({ id: "y" + index, semanticAngleDeg: 7 + index * 5.5, radiusRatio: 0.3 + index * 0.1 }),
    );
    const a = planRadarSectorLens(items, { clusterId: "developer-coding", rect: RECT });
    const b = planRadarSectorLens(items.slice().reverse(), {
      clusterId: "developer-coding",
      rect: RECT,
    });
    expect(a.lensWidthDeg).toBe(b.lensWidthDeg);
    expect(a.magnification).toBe(b.magnification);
    expect([...a.displayById.keys()].sort()).toEqual([...b.displayById.keys()].sort());
    for (const node of a.nodes) {
      const other = b.displayById.get(node.id)!;
      expect(node.displayAngleDeg).toBeCloseTo(other.displayAngleDeg, 10);
      expect(node.displayX).toBeCloseTo(other.displayX, 10);
      expect(node.displayY).toBeCloseTo(other.displayY, 10);
    }
  });
});
