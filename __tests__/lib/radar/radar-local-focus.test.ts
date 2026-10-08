/**
 * Radar Local Cluster Mode — PASS 1 layout engine tests.
 *
 * The engine is a pure deterministic planner: it must preserve semantic time
 * radius exactly, place nodes angularly inside the usable arc (top corridor
 * reserved for time labels), and report honest collision diagnostics. These
 * tests pin the contract so no caller can drift it.
 */

import { describe, expect, it } from "vitest";

import {
  planRadarLocalFocus,
  RADAR_LOCAL_ARC_END_DEG,
  RADAR_LOCAL_ARC_MID_DEG,
  RADAR_LOCAL_ARC_START_DEG,
  RADAR_LOCAL_DEFAULT_OUTER_RADIUS,
  RADAR_LOCAL_MIN_GAP_PX,
  RADAR_LOCAL_TARGET_GAP_PX,
  RADAR_LOCAL_TOP_CORRIDOR_DEG,
  RADAR_LOCAL_USABLE_SPAN_DEG,
  type RadarLocalFocusPlan,
  type RadarLocalFocusSignal,
} from "@/lib/radar/radar-local-focus";

const SINGLE: RadarLocalFocusSignal[] = [
  { id: "solo", semanticAngle: 200, radiusRatio: 0.62, radius: 2.4 },
];

const PAIR: RadarLocalFocusSignal[] = [
  { id: "pair-b", semanticAngle: 210, radiusRatio: 0.7, radius: 2.6 },
  { id: "pair-a", semanticAngle: 150, radiusRatio: 0.55, radius: 2.2 },
];

const SIX: RadarLocalFocusSignal[] = [
  { id: "f6", semanticAngle: 310, radiusRatio: 0.58, radius: 2.1 },
  { id: "f1", semanticAngle: 60, radiusRatio: 0.5, radius: 2.0 },
  { id: "f4", semanticAngle: 210, radiusRatio: 0.86, radius: 2.6 },
  { id: "f2", semanticAngle: 110, radiusRatio: 0.62, radius: 2.2 },
  { id: "f5", semanticAngle: 260, radiusRatio: 0.95, radius: 2.4 },
  { id: "f3", semanticAngle: 160, radiusRatio: 0.74, radius: 2.5 },
];

const SEVEN: RadarLocalFocusSignal[] = [
  { id: "g3", semanticAngle: 140, radiusRatio: 0.66, radius: 2.3 },
  { id: "g7", semanticAngle: 320, radiusRatio: 0.92, radius: 2.7 },
  { id: "g1", semanticAngle: 40, radiusRatio: 0.48, radius: 2.0 },
  { id: "g5", semanticAngle: 230, radiusRatio: 0.8, radius: 2.5 },
  { id: "g2", semanticAngle: 90, radiusRatio: 0.57, radius: 2.1 },
  { id: "g6", semanticAngle: 275, radiusRatio: 0.86, radius: 2.4 },
  { id: "g4", semanticAngle: 185, radiusRatio: 0.73, radius: 2.2 },
];

const EIGHT_SAME_RADIUS: RadarLocalFocusSignal[] = [
  { id: "e1", semanticAngle: 10, radiusRatio: 0.55, radius: 2.2 },
  { id: "e2", semanticAngle: 55, radiusRatio: 0.55, radius: 2.2 },
  { id: "e3", semanticAngle: 90, radiusRatio: 0.55, radius: 2.2 },
  { id: "e4", semanticAngle: 140, radiusRatio: 0.55, radius: 2.2 },
  { id: "e5", semanticAngle: 180, radiusRatio: 0.55, radius: 2.2 },
  { id: "e6", semanticAngle: 220, radiusRatio: 0.55, radius: 2.2 },
  { id: "e7", semanticAngle: 265, radiusRatio: 0.55, radius: 2.2 },
  { id: "e8", semanticAngle: 310, radiusRatio: 0.55, radius: 2.2 },
];

const TWELVE_MIXED: RadarLocalFocusSignal[] = [
  { id: "m01", semanticAngle: 15, radiusRatio: 0.45, radius: 1.6 },
  { id: "m02", semanticAngle: 45, radiusRatio: 0.5, radius: 2.8 },
  { id: "m03", semanticAngle: 78, radiusRatio: 0.55, radius: 1.8 },
  { id: "m04", semanticAngle: 112, radiusRatio: 0.6, radius: 2.4 },
  { id: "m05", semanticAngle: 148, radiusRatio: 0.65, radius: 1.7 },
  { id: "m06", semanticAngle: 182, radiusRatio: 0.7, radius: 2.6 },
  { id: "m07", semanticAngle: 215, radiusRatio: 0.75, radius: 1.9 },
  { id: "m08", semanticAngle: 248, radiusRatio: 0.8, radius: 2.2 },
  { id: "m09", semanticAngle: 278, radiusRatio: 0.85, radius: 1.6 },
  { id: "m10", semanticAngle: 305, radiusRatio: 0.9, radius: 2.5 },
  { id: "m11", semanticAngle: 330, radiusRatio: 0.93, radius: 2.0 },
  { id: "m12", semanticAngle: 352, radiusRatio: 0.95, radius: 1.8 },
];

const IDENTICAL_ANGLES: RadarLocalFocusSignal[] = [
  { id: "tie-e", semanticAngle: 120, radiusRatio: 0.6, radius: 2.2 },
  { id: "tie-c", semanticAngle: 120, radiusRatio: 0.75, radius: 2.4 },
  { id: "tie-a", semanticAngle: 120, radiusRatio: 0.5, radius: 2.0 },
  { id: "tie-d", semanticAngle: 120, radiusRatio: 0.85, radius: 2.6 },
  { id: "tie-b", semanticAngle: 120, radiusRatio: 0.68, radius: 2.1 },
];

const MIXED_MARKERS: RadarLocalFocusSignal[] = [
  { id: "x1", semanticAngle: 30, radiusRatio: 0.5, radius: 1.5 },
  { id: "x2", semanticAngle: 80, radiusRatio: 0.62, radius: 6.5 },
  { id: "x3", semanticAngle: 130, radiusRatio: 0.72, radius: 1.5 },
  { id: "x4", semanticAngle: 180, radiusRatio: 0.8, radius: 6.5 },
  { id: "x5", semanticAngle: 230, radiusRatio: 0.88, radius: 1.5 },
  { id: "x6", semanticAngle: 280, radiusRatio: 0.94, radius: 6.5 },
  { id: "x7", semanticAngle: 320, radiusRatio: 0.58, radius: 1.5 },
];

const INSEPARABLE_PAIR: RadarLocalFocusSignal[] = [
  { id: "core-a", semanticAngle: 90, radiusRatio: 0, radius: 6 },
  { id: "core-b", semanticAngle: 270, radiusRatio: 0, radius: 6 },
];

const OVER_DENSE: RadarLocalFocusSignal[] = Array.from({ length: 16 }, (_, index) => ({
  id: `dense-${String(index + 1).padStart(2, "0")}`,
  semanticAngle: (index * 360) / 16,
  radiusRatio: 0.9,
  radius: 7.5,
}));

const REDUCED_GAP: RadarLocalFocusSignal[] = Array.from({ length: 10 }, (_, index) => ({
  id: `tight-${String(index + 1).padStart(2, "0")}`,
  semanticAngle: 20 + index * 32,
  radiusRatio: 0.85,
  radius: 7.5,
}));

function semanticRadiusOf(signal: RadarLocalFocusSignal): number {
  return RADAR_LOCAL_DEFAULT_OUTER_RADIUS * signal.radiusRatio;
}

function semanticRadiusMaxDelta(
  signals: readonly RadarLocalFocusSignal[],
  plan: RadarLocalFocusPlan,
): number {
  const expected = new Map(signals.map((signal) => [signal.id, semanticRadiusOf(signal)]));
  return Math.max(
    0,
    ...plan.nodes.map((node) => Math.abs(node.semanticRadius - expected.get(node.id)!)),
  );
}

function displayRadiusMaxDelta(plan: RadarLocalFocusPlan): number {
  return Math.max(
    0,
    ...plan.nodes.map((node) => Math.abs(node.focusDisplayRadius - node.semanticRadius)),
  );
}

function expectRadiiPreserved(
  signals: readonly RadarLocalFocusSignal[],
  plan: RadarLocalFocusPlan,
): void {
  for (const node of plan.nodes) {
    expect(node.focusDisplayRadius).toBe(node.semanticRadius);
  }
  expect(semanticRadiusMaxDelta(signals, plan)).toBe(0);
  expect(displayRadiusMaxDelta(plan)).toBe(0);
}

function expectInsideLegalArc(plan: RadarLocalFocusPlan): void {
  for (const node of plan.nodes) {
    expect(node.focusDisplayAngle).toBeGreaterThanOrEqual(RADAR_LOCAL_ARC_START_DEG);
    expect(node.focusDisplayAngle).toBeLessThanOrEqual(RADAR_LOCAL_ARC_END_DEG);
  }
}

function expectStableOrder(
  signals: readonly RadarLocalFocusSignal[],
  plan: RadarLocalFocusPlan,
): void {
  const expectedIds = [...signals]
    .sort((a, b) =>
      a.semanticAngle !== b.semanticAngle
        ? a.semanticAngle - b.semanticAngle
        : a.id < b.id
          ? -1
          : a.id > b.id
            ? 1
            : 0,
    )
    .map((signal) => signal.id);
  expect(plan.nodes.map((node) => node.id)).toEqual(expectedIds);
  for (let index = 1; index < plan.nodes.length; index += 1) {
    expect(plan.nodes[index].focusDisplayAngle).toBeGreaterThanOrEqual(
      plan.nodes[index - 1].focusDisplayAngle,
    );
  }
}

function expectExactDisplayGeometry(plan: RadarLocalFocusPlan): void {
  for (const node of plan.nodes) {
    const angleRad = ((node.focusDisplayAngle - 90) * Math.PI) / 180;
    expect(node.displayX).toBeCloseTo(50 + node.focusDisplayRadius * Math.cos(angleRad), 10);
    expect(node.displayY).toBeCloseTo(50 + node.focusDisplayRadius * Math.sin(angleRad), 10);
    expect(Math.hypot(node.displayX - 50, node.displayY - 50)).toBeCloseTo(
      node.focusDisplayRadius,
      10,
    );
  }
}

describe("RADAR-LOCAL focused-cluster layout engine", () => {
  it("RADAR-LOCAL-01 places a single signal at the arc centre with exact semantic radius", () => {
    const plan = planRadarLocalFocus(SINGLE);
    expect(plan.nodes).toHaveLength(1);
    expect(plan.layoutStatus).toBe("ok");
    expect(plan.usableAngularSpan).toBe(RADAR_LOCAL_USABLE_SPAN_DEG);
    expect(plan.minimumEdgeGapPx).toBe(Number.POSITIVE_INFINITY);
    expect(plan.visualOverlapCount).toBe(0);
    const node = plan.nodes[0];
    expect(node.id).toBe("solo");
    expect(node.semanticAngle).toBe(200);
    expect(node.semanticRadius).toBeCloseTo(42 * 0.62, 12);
    expect(node.focusDisplayRadius).toBe(node.semanticRadius);
    expect(node.focusDisplayAngle).toBe(RADAR_LOCAL_ARC_MID_DEG);
    expectRadiiPreserved(SINGLE, plan);
    expectInsideLegalArc(plan);
    expectExactDisplayGeometry(plan);
  });

  it("RADAR-LOCAL-02 keeps two signals clear without stretching to the arc extremes", () => {
    const plan = planRadarLocalFocus(PAIR);
    expect(plan.layoutStatus).toBe("ok");
    expect(plan.visualOverlapCount).toBe(0);
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_LOCAL_TARGET_GAP_PX);
    expect(plan.nodes).toHaveLength(2);
    const [a, b] = plan.nodes;
    expect(a.id).toBe("pair-a");
    expect(b.id).toBe("pair-b");
    expect(a.focusDisplayAngle).toBeLessThan(b.focusDisplayAngle);
    const span = b.focusDisplayAngle - a.focusDisplayAngle;
    expect(span).toBeLessThan(120);
    expect(span).toBeGreaterThan(0);
    for (const node of plan.nodes) {
      expect(node.focusDisplayAngle).toBeGreaterThan(RADAR_LOCAL_ARC_MID_DEG - 90);
      expect(node.focusDisplayAngle).toBeLessThan(RADAR_LOCAL_ARC_MID_DEG + 90);
    }
    expect((a.focusDisplayAngle + b.focusDisplayAngle) / 2).toBeCloseTo(
      RADAR_LOCAL_ARC_MID_DEG,
      6,
    );
    expectRadiiPreserved(PAIR, plan);
    expectStableOrder(PAIR, plan);
    expectInsideLegalArc(plan);
    expectExactDisplayGeometry(plan);
  });

  it("RADAR-LOCAL-03 places six signals with marker clearance, centred in the usable arc", () => {
    const plan = planRadarLocalFocus(SIX);
    expect(plan.layoutStatus).toBe("ok");
    expect(plan.visualOverlapCount).toBe(0);
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_LOCAL_TARGET_GAP_PX);
    expect(plan.nodes).toHaveLength(6);
    expect(
      (plan.nodes[0].focusDisplayAngle + plan.nodes[5].focusDisplayAngle) / 2,
    ).toBeCloseTo(RADAR_LOCAL_ARC_MID_DEG, 6);
    expectRadiiPreserved(SIX, plan);
    expectStableOrder(SIX, plan);
    expectInsideLegalArc(plan);
    expectExactDisplayGeometry(plan);
  });

  it("RADAR-LOCAL-04 places seven signals with marker clearance and stable order", () => {
    const plan = planRadarLocalFocus(SEVEN);
    expect(plan.layoutStatus).toBe("ok");
    expect(plan.visualOverlapCount).toBe(0);
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_LOCAL_TARGET_GAP_PX);
    expect(plan.nodes).toHaveLength(7);
    expectRadiiPreserved(SEVEN, plan);
    expectStableOrder(SEVEN, plan);
    expectInsideLegalArc(plan);
    expectExactDisplayGeometry(plan);
  });

  it("RADAR-LOCAL-05 eight same-radius signals keep zero radius delta, zero overlap, >=14px gap and determinism", () => {
    const plan = planRadarLocalFocus(EIGHT_SAME_RADIUS);
    const radii = plan.nodes.map((node) => node.semanticRadius);
    expect(Math.max(...radii) - Math.min(...radii)).toBe(0);
    expect(semanticRadiusMaxDelta(EIGHT_SAME_RADIUS, plan)).toBe(0);
    expect(displayRadiusMaxDelta(plan)).toBe(0);
    expect(plan.visualOverlapCount).toBe(0);
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_LOCAL_MIN_GAP_PX);
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_LOCAL_TARGET_GAP_PX);
    expect(plan.layoutStatus).toBe("ok");
    expectStableOrder(EIGHT_SAME_RADIUS, plan);
    expectInsideLegalArc(plan);
    expect(planRadarLocalFocus(EIGHT_SAME_RADIUS)).toEqual(plan);
  });

  it("RADAR-LOCAL-06 twelve mixed-radius signals preserve every semantic time radius exactly", () => {
    const plan = planRadarLocalFocus(TWELVE_MIXED);
    expect(plan.layoutStatus).toBe("ok");
    expect(plan.nodes).toHaveLength(12);
    expect(plan.visualOverlapCount).toBe(0);
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_LOCAL_MIN_GAP_PX);
    expectRadiiPreserved(TWELVE_MIXED, plan);
    expectStableOrder(TWELVE_MIXED, plan);
    expectInsideLegalArc(plan);
    expectExactDisplayGeometry(plan);
    for (const node of plan.nodes) {
      const source = TWELVE_MIXED.find((signal) => signal.id === node.id)!;
      expect(node.semanticAngle).toBe(source.semanticAngle);
      expect(node.semanticRadius).toBeCloseTo(42 * source.radiusRatio, 12);
    }
  });

  it("RADAR-LOCAL-07 identical semantic angles resolve stably by id and stay in order", () => {
    const plan = planRadarLocalFocus(IDENTICAL_ANGLES);
    expect(plan.layoutStatus).toBe("ok");
    expect(plan.visualOverlapCount).toBe(0);
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_LOCAL_TARGET_GAP_PX);
    expect(plan.nodes.map((node) => node.id)).toEqual([
      "tie-a",
      "tie-b",
      "tie-c",
      "tie-d",
      "tie-e",
    ]);
    expectStableOrder(IDENTICAL_ANGLES, plan);
    expectRadiiPreserved(IDENTICAL_ANGLES, plan);
    expectInsideLegalArc(plan);
  });

  it("RADAR-LOCAL-08 mixed large/small marker radii drive marker-aware angular spacing", () => {
    const plan = planRadarLocalFocus(MIXED_MARKERS);
    expect(plan.layoutStatus).toBe("ok");
    expect(plan.visualOverlapCount).toBe(0);
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_LOCAL_TARGET_GAP_PX);
    expectStableOrder(MIXED_MARKERS, plan);
    expectRadiiPreserved(MIXED_MARKERS, plan);
    expectInsideLegalArc(plan);
    const gaps: number[] = [];
    for (let index = 1; index < plan.nodes.length; index += 1) {
      gaps.push(
        plan.nodes[index].focusDisplayAngle - plan.nodes[index - 1].focusDisplayAngle,
      );
    }
    expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(0);
  });

  it("RADAR-LOCAL-09 never mutates its input signals", () => {
    const frozen = TWELVE_MIXED.map((signal) => Object.freeze({ ...signal }));
    const frozenList = Object.freeze([...frozen]) as readonly RadarLocalFocusSignal[];
    const before = JSON.stringify(frozenList);
    planRadarLocalFocus(frozenList);
    expect(JSON.stringify(frozenList)).toBe(before);
    expect(Object.isFrozen(frozenList)).toBe(true);
    for (const signal of frozen) expect(Object.isFrozen(signal)).toBe(true);
  });

  it("RADAR-LOCAL-10 is deterministic: two executions are deep-equal", () => {
    for (const signals of [SINGLE, PAIR, SIX, SEVEN, EIGHT_SAME_RADIUS, TWELVE_MIXED, MIXED_MARKERS]) {
      const first = planRadarLocalFocus(signals.map((signal) => ({ ...signal })));
      const second = planRadarLocalFocus(signals.map((signal) => ({ ...signal })));
      expect(second).toEqual(first);
      expect(second).toStrictEqual(first);
    }
  });

  it("RADAR-LOCAL-11 preserves stable ordering regardless of input order", () => {
    const shuffled = [...TWELVE_MIXED].reverse();
    const plan = planRadarLocalFocus(shuffled);
    const reference = planRadarLocalFocus(TWELVE_MIXED);
    expect(plan).toEqual(reference);
    expectStableOrder(TWELVE_MIXED, plan);
  });

  it("RADAR-LOCAL-12 respects the top corridor around the time-label axis", () => {
    for (const signals of [SINGLE, PAIR, SIX, SEVEN, EIGHT_SAME_RADIUS, TWELVE_MIXED, MIXED_MARKERS]) {
      const plan = planRadarLocalFocus(signals);
      expectInsideLegalArc(plan);
      expect(plan.topCorridorDeg).toBe(RADAR_LOCAL_TOP_CORRIDOR_DEG);
      expect(plan.usableAngularSpan).toBe(RADAR_LOCAL_USABLE_SPAN_DEG);
      for (const node of plan.nodes) {
        const wrapped = ((node.focusDisplayAngle % 360) + 360) % 360;
        const insideCorridor =
          wrapped > 360 - RADAR_LOCAL_TOP_CORRIDOR_DEG / 2 ||
          wrapped < RADAR_LOCAL_TOP_CORRIDOR_DEG / 2;
        expect(insideCorridor).toBe(false);
      }
    }
  });

  it("RADAR-LOCAL-13 reports residual-collision for a physically inseparable pair and keeps it legal", () => {
    const plan = planRadarLocalFocus(INSEPARABLE_PAIR);
    expect(plan.layoutStatus).toBe("residual-collision");
    expect(plan.visualOverlapCount).toBeGreaterThan(0);
    expect(plan.minimumEdgeGapPx).toBeLessThan(RADAR_LOCAL_MIN_GAP_PX);
    expectInsideLegalArc(plan);
    expect(plan.nodes).toHaveLength(2);
    expectStableOrder(INSEPARABLE_PAIR, plan);
    expectRadiiPreserved(INSEPARABLE_PAIR, plan);
  });

  it("RADAR-LOCAL-14 reports residual-collision for impossible dense packing and keeps every node in the arc", () => {
    const plan = planRadarLocalFocus(OVER_DENSE);
    expect(plan.layoutStatus).toBe("residual-collision");
    expect(plan.nodes).toHaveLength(16);
    expect(plan.minimumEdgeGapPx).toBeLessThan(RADAR_LOCAL_MIN_GAP_PX);
    expectInsideLegalArc(plan);
    expectStableOrder(OVER_DENSE, plan);
    expectRadiiPreserved(OVER_DENSE, plan);
  });

  it("RADAR-LOCAL-15 retries toward the 14px floor when the 18px target cannot fit", () => {
    const plan = planRadarLocalFocus(REDUCED_GAP);
    expect(plan.layoutStatus).toBe("reduced-gap");
    expect(plan.gapTargetPx).toBeGreaterThanOrEqual(RADAR_LOCAL_MIN_GAP_PX);
    expect(plan.gapTargetPx).toBeLessThan(RADAR_LOCAL_TARGET_GAP_PX);
    expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(RADAR_LOCAL_MIN_GAP_PX);
    expect(plan.minimumEdgeGapPx).toBeLessThan(RADAR_LOCAL_TARGET_GAP_PX);
    expect(plan.visualOverlapCount).toBe(0);
    expectInsideLegalArc(plan);
    expectStableOrder(REDUCED_GAP, plan);
    expectRadiiPreserved(REDUCED_GAP, plan);
  });

  it("RADAR-LOCAL-16 keeps negative space for sparse clusters and grows coverage with density", () => {
    const pair = planRadarLocalFocus(PAIR);
    const six = planRadarLocalFocus(SIX);
    const twelve = planRadarLocalFocus(TWELVE_MIXED);
    expect(pair.occupiedAngularSpanDeg).toBeLessThan(six.occupiedAngularSpanDeg);
    expect(six.occupiedAngularSpanDeg).toBeLessThan(twelve.occupiedAngularSpanDeg);
    expect(pair.occupiedAngularSpanDeg).toBeLessThan(RADAR_LOCAL_USABLE_SPAN_DEG);
    expect(pair.comfortExpansionDeg).toBeGreaterThan(0);
    expect(pair.comfortExpansionDeg).toBeLessThanOrEqual(22);
    expect(planRadarLocalFocus(SINGLE).occupiedAngularSpanDeg).toBe(0);
  });
});
