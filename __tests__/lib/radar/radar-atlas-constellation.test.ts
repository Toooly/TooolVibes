import { expect, it } from "vitest";
import { planRadarAtlasConstellation } from "@/lib/radar/radar-atlas-constellation";
import type { RadarLocalFocusSignal } from "@/lib/radar/radar-local-focus";

const signals: RadarLocalFocusSignal[] = [.7, .64, .57, .84, .45, .91, .78, .66].map((radiusRatio, i) => ({
  id: `signal-${i}`, semanticAngle: 229 + i * 4, radiusRatio, radius: 4.5 - i * .35,
}));

it("keeps every temporal radius exact and all pairwise gaps above the approved floor", () => {
  const plan = planRadarAtlasConstellation(signals);
  expect(plan.layoutStatus).not.toBe("residual-collision");
  expect(plan.visualOverlapCount).toBe(0);
  expect(plan.minimumEdgeGapPx).toBeGreaterThanOrEqual(14);
  for (const node of plan.nodes) {
    const source = signals.find(s => s.id === node.id)!;
    expect(node.semanticRadius).toBe(42 * source.radiusRatio);
    expect(node.focusDisplayRadius).toBe(node.semanticRadius);
    expect(node.semanticAngle).toBe(source.semanticAngle);
    expect(Math.hypot(node.displayX - 50, node.displayY - 50)).toBeCloseTo(node.semanticRadius, 12);
  }
});

it("is deterministic independently of input order and leaves its source unchanged", () => {
  const before = structuredClone(signals);
  const plan = planRadarAtlasConstellation(signals);
  expect(planRadarAtlasConstellation(signals)).toEqual(plan);
  expect(planRadarAtlasConstellation([...signals].reverse())).toEqual(plan);
  expect(signals).toEqual(before);
});

it("composes an irregular constellation with balanced mass instead of an eight-hour clock", () => {
  const plan = planRadarAtlasConstellation(signals);
  const angles = plan.nodes.map(n => n.focusDisplayAngle).sort((a, b) => a - b);
  const gaps = angles.map((a, i) => i ? a - angles[i - 1] : a + 360 - angles.at(-1)!);
  expect(Math.max(...gaps) - Math.min(...gaps)).toBeGreaterThan(12);
  expect(plan.nodes.some(n => n.displayX < 50)).toBe(true);
  expect(plan.nodes.some(n => n.displayX > 50)).toBe(true);
  expect(plan.nodes.some(n => n.displayY < 50)).toBe(true);
  expect(plan.nodes.some(n => n.displayY > 50)).toBe(true);
  expect(angles.every(a => a < 258 || a > 282)).toBe(true);
});

it("recomputes range geometry deterministically without redistributing time radii", () => {
  const next = signals.map(s => ({ ...s, radiusRatio: s.radiusRatio * .86 }));
  const plan = planRadarAtlasConstellation(next);
  expect(plan).toEqual(planRadarAtlasConstellation(next));
  expect(plan.visualOverlapCount).toBe(0);
  expect(plan.nodes.map(n => n.focusDisplayRadius)).toEqual(plan.nodes.map(n => n.semanticRadius));
  expect(plan).not.toEqual(planRadarAtlasConstellation(signals));
});

it("reports physically impossible packing honestly while preserving every radius", () => {
  const plan = planRadarAtlasConstellation(signals.map(s => ({ ...s, radiusRatio: 0 })));
  expect(plan.layoutStatus).toBe("residual-collision");
  expect(plan.nodes.every(n => n.semanticRadius === 0 && n.focusDisplayRadius === 0)).toBe(true);
});
