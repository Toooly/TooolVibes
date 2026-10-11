import { planRadarLocalFocus, RADAR_LOCAL_MIN_GAP_PX, RADAR_LOCAL_TARGET_GAP_PX, type RadarLocalFocusOptions, type RadarLocalFocusPlan, type RadarLocalFocusSignal } from "@/lib/radar/radar-local-focus";
import { radarScreenEdgeGapPx } from "@/lib/radar/radar-projection";

// Deliberately irregular, alternating anchors. Selection is never an input.
const anchors = [138, 227, 72, 313, 184, 108, 39, 249, 161, 293, 58, 205, 123, 321];
const legal = (angle: number) => angle >= 35 && angle <= 325 && (angle < 258 || angle > 282);
const angularDistance = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));
const grid = Array.from({ length: 97 }, (_, i) => 35 + i * 3).filter(legal);

/** Display-only angles; temporal radius, attention size and projection stay canonical. */
export function planRadarAtlasConstellation(signals: readonly RadarLocalFocusSignal[], options: RadarLocalFocusOptions = {}): RadarLocalFocusPlan {
  const center = options.center ?? { x: 50, y: 50 };
  const outerRadius = options.outerRadius ?? 42;
  // Conservative reference fits the smallest supported phone instrument.
  const rect = options.rect ?? { left: 0, top: 0, width: 256, height: 256 };
  const ranked = [...signals].sort((a, b) => b.radius - a.radius || b.radiusRatio - a.radiusRatio || a.id.localeCompare(b.id));
  const point = (signal: RadarLocalFocusSignal, angle: number) => {
    const radius = outerRadius * signal.radiusRatio;
    const radians = (angle - 90) * Math.PI / 180;
    return { x: center.x + radius * Math.cos(radians), y: center.y + radius * Math.sin(radians), radius: signal.radius };
  };
  // The existing all-pair solver supplies a feasible angular seed, with the
  // new rank/anchor order. Bounded coordinate descent can only improve its
  // composition while retaining the hard physical clearance constraint.
  const seed = planRadarLocalFocus(ranked.map((signal, i) => ({ ...signal, semanticAngle: anchors[i % anchors.length] })), { ...options, rect, outerRadius, center });
  const seedById = new Map(seed.nodes.map(n => [n.id, n]));
  const placed = ranked.map(signal => { const angle = seedById.get(signal.id)!.focusDisplayAngle; return { angle, point: point(signal, angle) }; });
  const floor = options.minGapPx ?? RADAR_LOCAL_MIN_GAP_PX;
  const candidates = [...new Set([...anchors, ...grid])];
  if (seed.layoutStatus !== "residual-collision") for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (let index = 0; index < ranked.length; index++) {
      const signal = ranked[index], preferred = anchors[index % anchors.length];
      const weight = signal.radius ** 2;
      const others = placed.filter((_, i) => i !== index);
      const mass = others.reduce((sum, p) => sum + p.point.radius ** 2, weight);
      const scores = [...new Set([placed[index].angle, ...candidates])].map(angle => {
        const p = point(signal, angle);
        const gaps = others.map(other => radarScreenEdgeGapPx(p, other.point, rect));
        const gap = gaps.length ? Math.min(...gaps) : Infinity;
        const moment = others.reduce((sum, other) => ({ x: sum.x + (other.point.x - center.x) * other.point.radius ** 2, y: sum.y + (other.point.y - center.y) * other.point.radius ** 2 }), { x: (p.x - center.x) * weight, y: (p.y - center.y) * weight });
        const score = angularDistance(angle, preferred) / 180 + Math.hypot(moment.x, moment.y) / (mass * outerRadius) * .3 - Math.min(gap, 40) / 300 + (legal(angle) ? 0 : .5);
        return { angle, point: p, gap, score };
      }).filter(p => p.gap >= floor).sort((a, b) => a.score - b.score || a.angle - b.angle);
      if (scores[0] && scores[0].angle !== placed[index].angle) { placed[index] = scores[0]; changed = true; }
    }
    if (!changed) break;
  }
  let minimumEdgeGapPx = Infinity, visualOverlapCount = 0;
  for (let i = 0; i < placed.length; i++) for (let j = i + 1; j < placed.length; j++) {
    const gap = radarScreenEdgeGapPx(placed[i].point, placed[j].point, rect);
    minimumEdgeGapPx = Math.min(minimumEdgeGapPx, gap);
    if (gap < 0) visualOverlapCount++;
  }
  const status = seed.layoutStatus === "residual-collision" ? seed.layoutStatus : minimumEdgeGapPx < RADAR_LOCAL_TARGET_GAP_PX ? "reduced-gap" : "ok";
  const nodes = ranked.map((signal, i) => {
    const semanticRadius = outerRadius * signal.radiusRatio;
    return { id: signal.id, semanticAngle: signal.semanticAngle, semanticRadius, focusDisplayAngle: placed[i].angle, focusDisplayRadius: semanticRadius, displayX: placed[i].point.x, displayY: placed[i].point.y };
  });
  const angles = nodes.map(n => n.focusDisplayAngle);
  return { nodes, layoutStatus: status, minimumEdgeGapPx, visualOverlapCount, gapTargetPx: floor, usableAngularSpan: 290, comfortExpansionDeg: 0, occupiedAngularSpanDeg: angles.length > 1 ? Math.max(...angles) - Math.min(...angles) : 0, minimumRequiredSeparationDeg: 0, arcStartDeg: 35, arcEndDeg: 325, topCorridorDeg: 70, algorithm: "Atlas constellation: attention-ranked irregular alternating anchors; feasible all-pair seed and bounded deterministic angular optimization; immutable temporal radii." };
}
