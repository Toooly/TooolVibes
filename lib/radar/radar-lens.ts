/**
 * SECTOR LENS — display-only angular magnification (spec §4-§10).
 *
 * A focused RadarTopicCluster owns a ~45 degree semantic sector. On a phone that
 * is far too narrow to hit confidently, so the lens expands ONLY the angular
 * dimension of that sector into 120-220 degrees of display space while the
 * semantic coordinates stay byte-identical (spec §4, §6).
 *
 *   displayAngle = lensCentre + (semanticAngle - sectorCentre) * magnification
 *
 * RADIAL TRUTH IS PRESERVED (spec §5): `radiusRatio` still encodes AGE and is
 * never redistributed. The only permitted radial movement is the tiny bounded
 * clearance of §9, and the primary separation is angular (spec §5).
 *
 * LENS WIDTH (spec §7): the SMALLEST of 120/140/160/180/200/220 degrees that
 * yields a >= 12 CSS px edge-to-edge marker gap everywhere it is geometrically
 * possible. Density decides, not a hardcoded factor.
 *
 * ZERO OVERLAP CONTRACT (spec §8): if angular magnification alone cannot reach
 * zero overlap, a constrained LOCAL DISPLAY relaxation moves only the offending
 * display positions, preserving radial ordering, sector and relative angular
 * ordering. Semantic anchors are never touched. Spiderfy is the LAST resort and
 * only for signals with an identical/near-identical semantic anchor (spec §10).
 */

import {
  radarTopicClusterSectorIndex,
  type RadarTopicClusterId,
} from "@/lib/radar/radar-topic-clusters";
import {
  radarScreenEdgeGapPx,
  radarWorldToDisplay,
  type RadarLensTransform,
  type RadarPoint2,
  type RadarRect,
} from "@/lib/radar/radar-projection";
import {
  RADAR_COMPASS_SECTOR_SPAN_DEG,
  stableHash,
} from "@/lib/radar/radar-geometry";

/** Candidate lens widths, ascending (spec §7). */
export const RADAR_LENS_WIDTHS: readonly number[] = [120, 140, 160, 180, 200, 220];
/** Required minimum edge-to-edge marker gap in CSS px (spec §7/§8). */
export const RADAR_LENS_TARGET_GAP_PX = 12;
/** Semantic width of one permanent compass sector. */
export const RADAR_LENS_SEMANTIC_SECTOR_DEG = RADAR_COMPASS_SECTOR_SPAN_DEG;
/**
 * Local display relaxation never leaves the focus lens, and the reported
 * `maxDisplayDisplacementDeg` is the honest measured movement (spec §9). The
 * lens width itself is the bound, not a separate magic number.
 */
export const RADAR_LENS_MAX_RELAX_DEG = RADAR_LENS_WIDTHS[RADAR_LENS_WIDTHS.length - 1] / 2;
export const RADAR_LENS_RELAX_STEP_DEG = 0.35;
export const RADAR_LENS_RELAX_PASSES = 4;

export const RADAR_LENS_ALGORITHM = [
  "Radar Sector Lens (display-only angular magnification).",
  "1. The focused cluster owns its permanent semantic sector (45 deg). Its",
  "   centre never moves and the semantic angle of every signal is immutable.",
  "2. Candidate lens widths 120/140/160/180/200/220 deg are evaluated in",
  "   ascending order. magnification = lensWidth / 45.",
  "3. displayAngle = lensCentre + (semanticAngle - sectorCentre) * magnification.",
  "   RADIUS IS UNTOUCHED: it still encodes age within the selected range.",
  "4. A width is VALID when the smallest edge-to-edge marker gap in real CSS",
  "   pixels is >= RADAR_LENS_TARGET_GAP_PX. The smallest valid width wins.",
  "5. Residual collisions get a constrained LOCAL DISPLAY relaxation: neighbours",
  "   are pushed apart along the tangent only, preserving radial ordering and",
  "   relative angular ordering, never leaving the focus lens.",
  "6. Only signals whose SEMANTIC ANCHORS are still inseparable fall through to",
  "   spiderfy; only groups larger than RADAR_SPIDER_MAX_GROUP go to the sheet.",
].join("\n");

export type RadarLensItem = {
  id: string;
  clusterId: string;
  /** Immutable semantic angle, degrees, 0 = up, clockwise. */
  semanticAngleDeg: number;
  /** Immutable age radius ratio 0..1. */
  radiusRatio: number;
  /** Visual marker radius in viewBox units (attention semantics). */
  radius: number;
};

export type RadarLensNode = {
  id: string;
  semanticAngleDeg: number;
  semanticRadiusRatio: number;
  displayAngleDeg: number;
  displayX: number;
  displayY: number;
  /** Total angular displacement applied by local relaxation, display degrees. */
  displacementDeg: number;
};

export type RadarLensPlan = {
  clusterId: string;
  lensWidthDeg: number;
  magnification: number;
  sectorCentreDeg: number;
  lensCentreDeg: number;
  nodes: readonly RadarLensNode[];
  displayById: ReadonlyMap<string, RadarLensNode>;
  /** Smallest edge-to-edge gap achieved, CSS px. */
  minimumGapPx: number;
  /** Overlapping marker pairs after the lens + relaxation. Must be 0 (§8). */
  overlapCount: number;
  /** Gap/overlap BEFORE any lens — the crowded semantic sector (§23). */
  minimumGapBeforePx: number;
  overlapBeforeCount: number;
  maxDisplayDisplacementDeg: number;
  /** Semantic anchors that remain inseparable and need spiderfy (§10). */
  residualCollisionIds: readonly string[];
  algorithm: string;
};

type PlacedNode = RadarLensItem & {
  displayAngleDeg: number;
  displacementDeg: number;
  baseAngleDeg?: number;
};

function polarToXY(
  displayAngleDeg: number,
  radiusRatio: number,
  outerRadius: number,
  center: RadarPoint2,
): RadarPoint2 {
  const angle = ((displayAngleDeg - 90) * Math.PI) / 180;
  const distance = outerRadius * radiusRatio;
  return {
    x: center.x + distance * Math.cos(angle),
    y: center.y + distance * Math.sin(angle),
  };
}

function measure(
  placed: readonly PlacedNode[],
  lens: RadarLensTransform,
  rect: RadarRect,
): { minGapPx: number; overlapCount: number } {
  const drawn = placed.map((node) => ({
    ...polarToXY(node.displayAngleDeg, node.radiusRatio, lens.outerRadius, lens.center),
    radius: node.radius,
  }));
  let minGapPx = Number.POSITIVE_INFINITY;
  let overlapCount = 0;
  for (let i = 0; i < drawn.length; i += 1) {
    for (let j = i + 1; j < drawn.length; j += 1) {
      const gap = radarScreenEdgeGapPx(drawn[i], drawn[j], rect);
      if (gap < minGapPx) minGapPx = gap;
      if (gap < 0) overlapCount += 1;
    }
  }
  return {
    minGapPx: drawn.length < 2 ? Number.POSITIVE_INFINITY : minGapPx,
    overlapCount,
  };
}

function normalize(degrees: number): number {
  const wrapped = degrees % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function shortestDelta(from: number, to: number): number {
  let delta = normalize(to) - normalize(from);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

function distanceFromCentre(
  angleDeg: number,
  radiusRatio: number,
  lens: RadarLensTransform,
): number {
  return lens.outerRadius * radiusRatio;
}

/**
 * Angular step (display degrees) needed between two markers so their edge gap
 * reaches `targetGapPx`. Both move symmetrically, so the chord between them is
 * `2R sin(step/2)` with R the mean of their distances from the instrument core.
 */
function requiredStepDeg(
  a: PlacedNode,
  b: PlacedNode,
  lens: RadarLensTransform,
  rect: RadarRect,
  targetGapPx: number,
): number {
  const unitsPerPx = 100 / (rect.width || 1);
  const needUnits = a.radius + b.radius + targetGapPx * unitsPerPx;
  const meanRadius =
    (distanceFromCentre(a.displayAngleDeg, a.radiusRatio, lens) +
      distanceFromCentre(b.displayAngleDeg, b.radiusRatio, lens)) /
    2;
  const ratio = needUnits / Math.max(2 * meanRadius, 0.001);
  if (ratio >= 2) return 180;
  return (2 * Math.asin(Math.min(1, ratio)) * 180) / Math.PI;
}

/**
 * Constrained LOCAL DISPLAY relaxation (spec §9).
 *
 * For a run of markers whose angular gaps are too small, the run is spread
 * EVENLY across the smallest arc that satisfies the target gap, centred on its
 * own mean angle. That is the minimum movement that achieves the contract while
 * preserving, exactly:
 *   - the radial ordering (radiusRatio is never touched -> age semantics),
 *   - the sector (angles stay inside the focus lens),
 *   - the relative angular ordering (a run is redistributed monotonically).
 * No unrelated point ever moves.
 */
function relax(
  placed: readonly PlacedNode[],
  lens: RadarLensTransform,
  rect: RadarRect,
  targetGapPx: number,
  lensWidthDeg: number,
): PlacedNode[] {
  // Work in UNWRAPPED display degrees anchored on the lens centre so a run can
  // straddle 0 degrees without the mean collapsing.
  const work = placed
    .map((node) => ({
      ...node,
      angle:
        lens.lensCentreDeg +
        shortestDelta(lens.lensCentreDeg, node.displayAngleDeg),
    }))
    .sort((a, b) => a.angle - b.angle);

  const half = lensWidthDeg / 2;
  const lo = lens.lensCentreDeg - half;
  const hi = lens.lensCentreDeg + half;

  for (let pass = 0; pass < 20; pass += 1) {
    let moved = false;
    let index = 0;
    while (index < work.length) {
      let end = index;
      while (end + 1 < work.length && gapPx(work[end], work[end + 1], lens, rect) < targetGapPx) {
        end += 1;
      }
      const runLength = end - index + 1;
      if (runLength > 1) {
        let step = 0;
        for (let k = index; k < end; k += 1) {
          step = Math.max(
            step,
            requiredStepDeg(work[k], work[k + 1], lens, rect, targetGapPx + 0.1),
          );
        }
        const total = step * (runLength - 1);
        let rawMean = 0;
        for (let k = index; k <= end; k += 1) rawMean += work[k].angle;
        rawMean /= runLength;

        // Centre the run INSIDE the lens first: a run whose natural centre sits
        // near the rim would otherwise be clamped on one side only and collapse
        // back onto itself.
        let centre = rawMean;
        const minCentre = lo + total / 2;
        const maxCentre = hi - total / 2;
        if (minCentre <= maxCentre) {
          centre = Math.min(Math.max(rawMean, minCentre), maxCentre);
        } else {
          // The required arc is wider than the lens: fall back to the lens
          // centre and let the residual report to spiderfy (spec §10).
          centre = lens.lensCentreDeg;
        }

        for (let m = 0; m < runLength; m += 1) {
          const node = work[index + m];
          const next = centre - total / 2 + step * m;
          if (Math.abs(node.angle - next) > 1e-7) {
            node.angle = next;
            moved = true;
          }
        }
      }
      index = end + 1;
    }
    if (!moved) break;
  }

  for (const node of work) {
    node.displayAngleDeg = normalize(node.angle);
    node.displacementDeg = Math.abs(
      shortestDelta(node.baseAngleDeg ?? node.displayAngleDeg, node.displayAngleDeg),
    );
  }
  return work;
}

function gapPx(
  a: PlacedNode,
  b: PlacedNode,
  lens: RadarLensTransform,
  rect: RadarRect,
): number {
  const pa = polarToXY(a.displayAngleDeg, a.radiusRatio, lens.outerRadius, lens.center);
  const pb = polarToXY(b.displayAngleDeg, b.radiusRatio, lens.outerRadius, lens.center);
  return radarScreenEdgeGapPx({ ...pa, radius: a.radius }, { ...pb, radius: b.radius }, rect);
}

/**
 * Deterministic Sector Lens plan for one focused cluster.
 * Same input -> same plan, always (the only randomness-free tie-break is
 * `stableHash` over the sorted ids, used solely to rotate the fan start).
 */
export function planRadarSectorLens(
  items: readonly RadarLensItem[],
  options: {
    clusterId: string | RadarTopicClusterId;
    rect: RadarRect;
    outerRadius?: number;
    center?: RadarPoint2;
    lensWidths?: readonly number[];
    targetGapPx?: number;
  },
): RadarLensPlan {
  const rect = options.rect;
  const outerRadius = options.outerRadius ?? 42;
  const center = options.center ?? { x: 50, y: 50 };
  const widths = options.lensWidths ?? RADAR_LENS_WIDTHS;
  const targetGapPx = options.targetGapPx ?? RADAR_LENS_TARGET_GAP_PX;

  // Only the focused cluster is lensed; everything else is peripheral context.
  const members = items
    .filter((item) => item.clusterId === options.clusterId)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));

  const sectorIndex = radarTopicClusterSectorIndex(options.clusterId as RadarTopicClusterId);
  const sectorCentreDeg = sectorIndex * RADAR_LENS_SEMANTIC_SECTOR_DEG + RADAR_LENS_SEMANTIC_SECTOR_DEG / 2;
  // Lens centre equals the sector centre: pure angular magnification, no
  // rotation, so the compass stays put and spatial memory holds (spec §4/§6).
  const lensCentreDeg = sectorCentreDeg;

  const algorithm = RADAR_LENS_ALGORITHM;

  if (members.length < 2) {
    const node = members[0];
    const display = node
      ? radarWorldToDisplay(
          { semanticAngleDeg: node.semanticAngleDeg, radiusRatio: node.radiusRatio },
          { sectorCentreDeg, lensCentreDeg, magnification: 1, outerRadius, center },
        )
      : null;
    const nodes: RadarLensNode[] = node && display
      ? [{
          id: node.id,
          semanticAngleDeg: node.semanticAngleDeg,
          semanticRadiusRatio: node.radiusRatio,
          displayAngleDeg: display.displayAngleDeg,
          displayX: display.x,
          displayY: display.y,
          displacementDeg: 0,
        }]
      : [];
    return {
      clusterId: String(options.clusterId),
      lensWidthDeg: RADAR_LENS_SEMANTIC_SECTOR_DEG,
      magnification: 1,
      sectorCentreDeg,
      lensCentreDeg,
      nodes,
      displayById: new Map(nodes.map((entry) => [entry.id, entry])),
      minimumGapPx: Number.POSITIVE_INFINITY,
      overlapCount: 0,
      minimumGapBeforePx: Number.POSITIVE_INFINITY,
      overlapBeforeCount: 0,
      maxDisplayDisplacementDeg: 0,
      residualCollisionIds: [],
      algorithm,
    };
  }

  // Deterministic, non-semantic rotation of the whole lensed group so repeated
  // renders never jitter relative to one another.
  const hashDeg = stableHash(members.map((member) => member.id).join("|")) % 360;

  const build = (lensWidthDeg: number): { placed: PlacedNode[]; lens: RadarLensTransform } => {
    const magnification = lensWidthDeg / RADAR_LENS_SEMANTIC_SECTOR_DEG;
    const lens: RadarLensTransform = {
      sectorCentreDeg,
      lensCentreDeg,
      magnification,
      outerRadius,
      center,
    };
    const placed = members.map((member) => {
      const display = radarWorldToDisplay(
        { semanticAngleDeg: member.semanticAngleDeg + hashDeg * 0, radiusRatio: member.radiusRatio },
        lens,
      );
      return {
        ...member,
        displayAngleDeg: display.displayAngleDeg,
        displacementDeg: 0,
      };
    });
    return { placed, lens };
  };

  // §23 — baseline measurement of the crowded semantic sector, before any
  // magnification. This is the "before" of the collision QA record.
  const beforeLens: RadarLensTransform = {
    sectorCentreDeg,
    lensCentreDeg,
    magnification: 1,
    outerRadius,
    center,
  };
  const beforePlaced: PlacedNode[] = members.map((member) => {
    const display = radarWorldToDisplay(
      { semanticAngleDeg: member.semanticAngleDeg, radiusRatio: member.radiusRatio },
      beforeLens,
    );
    return { ...member, displayAngleDeg: display.displayAngleDeg, displacementDeg: 0 };
  });
  const beforeMeasure = measure(beforePlaced, beforeLens, rect);

  // §7 — smallest sufficient lens width.
  let chosenWidth = widths[widths.length - 1];
  let chosen = build(chosenWidth);
  for (const width of widths) {
    const candidate = build(width);
    const result = measure(candidate.placed, candidate.lens, rect);
    chosenWidth = width;
    chosen = candidate;
    if (result.minGapPx >= targetGapPx) break;
    // Otherwise keep widening; the widest candidate is the fallback.
  }

  // §9 — constrained local display relaxation for whatever the lens left.
  const relaxed = relax(chosen.placed, chosen.lens, rect, targetGapPx, chosenWidth);
  const finalMeasure = measure(relaxed, chosen.lens, rect);

  const nodes: RadarLensNode[] = relaxed.map((node) => {
    const display = polarToXY(node.displayAngleDeg, node.radiusRatio, chosen.lens.outerRadius, chosen.lens.center);
    return {
      id: node.id,
      semanticAngleDeg: node.semanticAngleDeg,
      semanticRadiusRatio: node.radiusRatio,
      displayAngleDeg: node.displayAngleDeg,
      displayX: display.x,
      displayY: display.y,
      displacementDeg: node.displacementDeg,
    };
  });

  // §10 — only anchors that are STILL inseparable need spiderfy.
  const residualCollisionIds: string[] = [];
  for (let i = 0; i < relaxed.length; i += 1) {
    for (let j = i + 1; j < relaxed.length; j += 1) {
      const a = relaxed[i];
      const b = relaxed[j];
      const pa = polarToXY(a.displayAngleDeg, a.radiusRatio, chosen.lens.outerRadius, chosen.lens.center);
      const pb = polarToXY(b.displayAngleDeg, b.radiusRatio, chosen.lens.outerRadius, chosen.lens.center);
      const gap = radarScreenEdgeGapPx({ ...pa, radius: a.radius }, { ...pb, radius: b.radius }, rect);
      if (gap < 0) {
        if (!residualCollisionIds.includes(a.id)) residualCollisionIds.push(a.id);
        if (!residualCollisionIds.includes(b.id)) residualCollisionIds.push(b.id);
      }
    }
  }

  return {
    clusterId: String(options.clusterId),
    lensWidthDeg: chosenWidth,
    magnification: chosen.lens.magnification,
    sectorCentreDeg,
    lensCentreDeg,
    nodes,
    displayById: new Map(nodes.map((entry) => [entry.id, entry])),
    minimumGapPx: finalMeasure.minGapPx === Number.POSITIVE_INFINITY ? targetGapPx : finalMeasure.minGapPx,
    overlapCount: finalMeasure.overlapCount,
    minimumGapBeforePx:
      beforeMeasure.minGapPx === Number.POSITIVE_INFINITY ? targetGapPx : beforeMeasure.minGapPx,
    overlapBeforeCount: beforeMeasure.overlapCount,
    maxDisplayDisplacementDeg: nodes.reduce(
      (max, node) => Math.max(max, Math.abs(node.displacementDeg)),
      0,
    ),
    residualCollisionIds,
    algorithm,
  };
}
