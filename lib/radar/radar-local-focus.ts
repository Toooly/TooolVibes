/**
 * RADAR LOCAL CLUSTER MODE — PASS 1B: deterministic local focus layout with
 * ALL-PAIR clearance guarantees.
 *
 * A focused cluster is laid out on a LOCAL arc, not as a uniform clock face.
 * The engine is pure and deterministic: same input -> same plan, always.
 *
 *   RADIAL TRUTH IS PRESERVED: `focusDisplayRadius === semanticRadius` for
 *   every node. The semantic time radius is never redistributed; only the
 *   DISPLAY ANGLE moves (angular placement only).
 *
 *   TOP CORRIDOR: a RADAR_LOCAL_TOP_CORRIDOR_DEG corridor around the top
 *   time-label axis (0 deg) is reserved for labels. The usable arc therefore
 *   runs from `RADAR_LOCAL_ARC_START_DEG` (35) to `RADAR_LOCAL_ARC_END_DEG`
 *   (325), i.e. RADAR_LOCAL_USABLE_SPAN_DEG (290) degrees.
 *
 *   STABLE ORDERING: signals are ordered by `semanticAngle` ascending, then
 *   `id` ascending. Display placement preserves that order monotonically.
 *
 *   MARKER-AWARE SPACING: for EVERY ordered pair (not only adjacent ones) the
 *   engine finds the MINIMUM angular separation whose physical edge-to-edge
 *   gap reaches the target, measured with the frozen `radarScreenEdgeGapPx`
 *   against the physical reference instrument (390px viewport, 358px Radar).
 *   The search is a fixed-iteration binary search over the candidate angular
 *   delta.
 *
 *   ALL-PAIR CONSTRAINTS: the minimal legal monotonic angular run is built
 *   from those requirements with a difference-constraint sweep:
 *   position[0] = 0 and position[j] = max over every i < j of
 *   position[i] + requiredSeparationDeg(i, j). Every pairwise clearance
 *   constraint is therefore satisfied by construction, including
 *   non-adjacent pairs (e.g. two inner nodes flanking an outer node).
 *
 *   NEGATIVE SPACE: a bounded comfort expansion widens each internal gap up to
 *   RADAR_LOCAL_COMFORT_EXPANSION_DEG (capped by the remaining slack). Uniform
 *   per-gap expansion only INCREASES every pairwise separation, so it never
 *   relaxes an all-pair constraint: sparse clusters stay centred and do NOT
 *   stretch to the arc extremes while dense clusters naturally use more of
 *   the circumference. Identical same-radius dense sets may end up evenly
 *   distributed; that is acceptable.
 *
 *   RESIDUAL COLLISION: the target gap is tried first (18 CSS px). When it
 *   cannot fit, the engine retries toward the hard floor (14 CSS px). When not
 *   even the floor fits inside the usable arc, every node is kept inside the
 *   legal arc and the plan reports `layoutStatus = "residual-collision"`.
 *   Spiderfy belongs to a higher layer and never happens here.
 */

import {
  radarScreenEdgeGapPx,
  type RadarPoint2,
  type RadarRect,
} from "@/lib/radar/radar-projection";

/** Angular corridor reserved around the top time-label axis (0 deg). */
export const RADAR_LOCAL_TOP_CORRIDOR_DEG = 70;
/** Local arc available to nodes: 360 - RADAR_LOCAL_TOP_CORRIDOR_DEG. */
export const RADAR_LOCAL_USABLE_SPAN_DEG = 290;
/** Physical reference: phone viewport width, CSS px. */
export const RADAR_LOCAL_REFERENCE_VIEWPORT_PX = 390;
/** Physical reference: Radar instrument edge, CSS px. */
export const RADAR_LOCAL_REFERENCE_RADAR_PX = 358;
/** Target edge-to-edge marker gap, CSS px. */
export const RADAR_LOCAL_TARGET_GAP_PX = 18;
/** Hard floor edge-to-edge marker gap, CSS px. */
export const RADAR_LOCAL_MIN_GAP_PX = 14;
/** Bounded comfort expansion added to each internal gap, degrees. */
export const RADAR_LOCAL_COMFORT_EXPANSION_DEG = 22;
/** Fixed iterations for the per-pair angular separation search. */
export const RADAR_LOCAL_PAIR_SEARCH_ITERATIONS = 24;
/** Fixed iterations for the fallback target-gap search. */
export const RADAR_LOCAL_GAP_SEARCH_ITERATIONS = 20;
/** Default instrument radius in viewBox units (matches the frozen lens). */
export const RADAR_LOCAL_DEFAULT_OUTER_RADIUS = 42;
/** Default instrument centre in viewBox units. */
export const RADAR_LOCAL_DEFAULT_CENTER: RadarPoint2 = { x: 50, y: 50 };

/** Usable arc start, degrees (clockwise from 12 o'clock). */
export const RADAR_LOCAL_ARC_START_DEG = RADAR_LOCAL_TOP_CORRIDOR_DEG / 2;
/** Usable arc end, degrees. */
export const RADAR_LOCAL_ARC_END_DEG =
  RADAR_LOCAL_ARC_START_DEG + RADAR_LOCAL_USABLE_SPAN_DEG;
/** Centre of the usable arc, degrees. */
export const RADAR_LOCAL_ARC_MID_DEG =
  RADAR_LOCAL_ARC_START_DEG + RADAR_LOCAL_USABLE_SPAN_DEG / 2;
/** Largest angular separation a pair can be given, degrees. */
export const RADAR_LOCAL_MAX_PAIR_SEPARATION_DEG = 180;

export type RadarLocalFocusSignal = {
  id: string;
  /** Immutable semantic angle, degrees, 0 = up, clockwise. */
  semanticAngle: number;
  /** Immutable semantic age radius ratio 0..1. */
  radiusRatio: number;
  /** Visual marker radius in viewBox units (attention semantics). */
  radius: number;
};

export type RadarLocalFocusNode = {
  id: string;
  semanticAngle: number;
  /** Semantic time radius in viewBox units (outerRadius * radiusRatio). */
  semanticRadius: number;
  focusDisplayAngle: number;
  /** MUST equal `semanticRadius`: no radial redistribution, ever. */
  focusDisplayRadius: number;
  displayX: number;
  displayY: number;
};

export type RadarLocalFocusLayoutStatus = "ok" | "reduced-gap" | "residual-collision";

export type RadarLocalFocusPlan = {
  nodes: readonly RadarLocalFocusNode[];
  layoutStatus: RadarLocalFocusLayoutStatus;
  usableAngularSpan: number;
  /** Smallest edge-to-edge gap over every marker pair, CSS px. */
  minimumEdgeGapPx: number;
  /** Marker pairs whose edge gap is negative. */
  visualOverlapCount: number;
  /**
   * Edge-gap floor the placement was built at (18 CSS px, or the largest
   * feasible target found toward the 14 CSS px floor). On every non-residual
   * plan ALL pairs reach this floor.
   */
  gapTargetPx: number;
  /** Comfort expansion applied to each internal gap, degrees. */
  comfortExpansionDeg: number;
  /** Angular span occupied by the run, degrees. */
  occupiedAngularSpanDeg: number;
  /**
   * Smallest required pairwise separation at `gapTargetPx` across ALL ordered
   * pairs, degrees. Infinity when some pair can never reach the target.
   */
  minimumRequiredSeparationDeg: number;
  arcStartDeg: number;
  arcEndDeg: number;
  topCorridorDeg: number;
  algorithm: string;
};

export type RadarLocalFocusOptions = {
  rect?: RadarRect;
  outerRadius?: number;
  center?: RadarPoint2;
  targetGapPx?: number;
  minGapPx?: number;
  comfortExpansionDeg?: number;
};

export const RADAR_LOCAL_ALGORITHM = [
  "Radar Local Cluster Mode (deterministic angular layout, PASS 1B).",
  "1. Signals are ordered by semanticAngle ascending, then id ascending; the",
  "   display placement preserves that order monotonically.",
  "2. Semantic time radius is preserved exactly: focusDisplayRadius ===",
  "   semanticRadius === outerRadius * radiusRatio. Only angles move.",
  "3. The top corridor (70 deg about 12 o'clock) is reserved for time labels;",
  "   nodes live in the usable 35..325 deg arc (290 deg).",
  "4. EVERY ordered pair (not only adjacent ones) gets the MINIMUM angular",
  "   separation whose physical edge-to-edge gap reaches the target, via a",
  "   fixed-iteration binary search with radarScreenEdgeGapPx on the 358px",
  "   reference instrument. The minimal monotonic run position[j] = max over",
  "   i < j of position[i] + required(i, j) satisfies ALL pairwise clearance",
  "   constraints by construction.",
  "5. A bounded comfort expansion widens internal gaps up to 22 deg (capped by",
  "   the remaining slack) and only increases pairwise separations, so sparse",
  "   clusters keep negative space and stay centred while dense clusters use",
  "   more of the circumference.",
  "6. The 18 CSS px target is tried first; if it cannot fit, the engine retries",
  "   toward the 14 CSS px floor. If the floor cannot fit either, every node",
  "   stays inside the legal arc and the plan reports residual-collision.",
  "   Spiderfy belongs to a higher layer and never happens here.",
].join("\n");

type LayoutGeometry = {
  outerRadius: number;
  center: RadarPoint2;
  rect: RadarRect;
};

type OrderedSignal = RadarLocalFocusSignal & {
  semanticRadius: number;
  orderIndex: number;
};

function polarToXY(angleDeg: number, radius: number, center: RadarPoint2): RadarPoint2 {
  const angle = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: center.x + radius * Math.cos(angle),
    y: center.y + radius * Math.sin(angle),
  };
}

function compareSignals(a: OrderedSignal, b: OrderedSignal): number {
  if (a.semanticAngle !== b.semanticAngle) return a.semanticAngle - b.semanticAngle;
  if (a.id !== b.id) return a.id < b.id ? -1 : 1;
  return a.orderIndex - b.orderIndex;
}

function drawnPoint(signal: OrderedSignal, angleDeg: number, geometry: LayoutGeometry) {
  return {
    ...polarToXY(angleDeg, signal.semanticRadius, geometry.center),
    radius: signal.radius,
  };
}

/**
 * Physical edge gap (CSS px) between two signals at a candidate angular
 * separation. Both display points are computed, then measured with the frozen
 * `radarScreenEdgeGapPx`. Rotation-invariant on the square instrument.
 */
function pairGapPx(
  a: OrderedSignal,
  b: OrderedSignal,
  deltaDeg: number,
  geometry: LayoutGeometry,
): number {
  const pointA = drawnPoint(a, RADAR_LOCAL_ARC_MID_DEG, geometry);
  const pointB = drawnPoint(b, RADAR_LOCAL_ARC_MID_DEG + deltaDeg, geometry);
  return radarScreenEdgeGapPx(pointA, pointB, geometry.rect);
}

/**
 * Minimum angular separation (degrees) at which the pair's physical edge gap
 * reaches `targetGapPx`. Returns 0 when the pair already clears the target at
 * any angle, and Infinity when no angular separation can ever reach it.
 */
function requiredSeparationDeg(
  a: OrderedSignal,
  b: OrderedSignal,
  targetGapPx: number,
  geometry: LayoutGeometry,
): number {
  if (pairGapPx(a, b, 0, geometry) >= targetGapPx) return 0;
  if (pairGapPx(a, b, RADAR_LOCAL_MAX_PAIR_SEPARATION_DEG, geometry) < targetGapPx) {
    return Number.POSITIVE_INFINITY;
  }
  let lo = 0;
  let hi = RADAR_LOCAL_MAX_PAIR_SEPARATION_DEG;
  for (let iteration = 0; iteration < RADAR_LOCAL_PAIR_SEARCH_ITERATIONS; iteration += 1) {
    const mid = (lo + hi) / 2;
    if (pairGapPx(a, b, mid, geometry) >= targetGapPx) hi = mid;
    else lo = mid;
  }
  return hi;
}

/**
 * Upper-triangular requirement matrix: `matrix[i][j]` (i < j) is the minimum
 * angular separation the ordered pair (i, j) needs to reach `targetGapPx`.
 */
function requiredMatrix(
  ordered: readonly OrderedSignal[],
  targetGapPx: number,
  geometry: LayoutGeometry,
): number[][] {
  const count = ordered.length;
  const matrix: number[][] = Array.from({ length: count }, () =>
    new Array<number>(count).fill(0),
  );
  for (let i = 0; i < count; i += 1) {
    for (let j = i + 1; j < count; j += 1) {
      matrix[i][j] = requiredSeparationDeg(ordered[i], ordered[j], targetGapPx, geometry);
    }
  }
  return matrix;
}

/**
 * Minimal legal monotonic angular run for the all-pair difference constraints:
 * position[0] = 0, position[j] = max over every i < j of
 * position[i] + matrix[i][j]. The run is the tightest left-anchored layout
 * that satisfies EVERY pairwise separation requirement.
 */
function minimalRunPositions(matrix: readonly number[][]): number[] {
  const count = matrix.length;
  const positions = new Array<number>(count).fill(0);
  for (let j = 1; j < count; j += 1) {
    let farthest = 0;
    for (let i = 0; i < j; i += 1) {
      const candidate = positions[i] + matrix[i][j];
      if (candidate > farthest) farthest = candidate;
    }
    positions[j] = farthest;
  }
  return positions;
}

/** Angular span of the minimal run, degrees (0 for fewer than two nodes). */
function runSpanDeg(matrix: readonly number[][]): number {
  if (matrix.length < 2) return 0;
  const positions = minimalRunPositions(matrix);
  return positions[positions.length - 1];
}

function cappedRequired(value: number): number {
  return value === Number.POSITIVE_INFINITY
    ? RADAR_LOCAL_MAX_PAIR_SEPARATION_DEG
    : Math.min(value, RADAR_LOCAL_MAX_PAIR_SEPARATION_DEG);
}

/**
 * Places the minimal run along the usable arc, centred at the arc midpoint.
 * Comfort expansion widens each internal gap up to `comfortExpansionDeg` but
 * never beyond the remaining slack; uniform per-gap expansion only increases
 * every pairwise separation, so all-pair constraints survive it. When the
 * capped requirements alone exceed the arc (residual-collision) the gaps are
 * scaled down proportionally so every node stays inside the legal arc, in
 * order.
 */
function placeAlongArc(
  matrix: readonly number[][],
  comfortExpansionDeg: number,
): { angles: number[]; expansionDeg: number } {
  const count = matrix.length;
  if (count === 0) return { angles: [], expansionDeg: 0 };
  if (count === 1) return { angles: [RADAR_LOCAL_ARC_MID_DEG], expansionDeg: 0 };

  const capped = matrix.map((row) => row.map(cappedRequired));
  const positions = minimalRunPositions(capped);
  const span = positions[count - 1] - positions[0];

  const gaps: number[] = [];
  let expansionDeg = 0;
  if (span > RADAR_LOCAL_USABLE_SPAN_DEG + 1e-9) {
    const scale = RADAR_LOCAL_USABLE_SPAN_DEG / span;
    for (let index = 0; index + 1 < count; index += 1) {
      gaps.push((positions[index + 1] - positions[index]) * scale);
    }
  } else {
    expansionDeg = Math.max(
      0,
      Math.min(comfortExpansionDeg, (RADAR_LOCAL_USABLE_SPAN_DEG - span) / (count - 1)),
    );
    for (let index = 0; index + 1 < count; index += 1) {
      gaps.push(positions[index + 1] - positions[index] + expansionDeg);
    }
  }

  let placedSpan = 0;
  for (const gap of gaps) placedSpan += gap;
  let current = RADAR_LOCAL_ARC_MID_DEG - placedSpan / 2;
  const angles: number[] = [];
  for (let index = 0; index < count; index += 1) {
    angles.push(Math.min(Math.max(current, RADAR_LOCAL_ARC_START_DEG), RADAR_LOCAL_ARC_END_DEG));
    current += gaps[index];
  }
  return { angles, expansionDeg };
}

function measure(
  nodes: readonly RadarLocalFocusNode[],
  ordered: readonly OrderedSignal[],
  geometry: LayoutGeometry,
): { minimumEdgeGapPx: number; visualOverlapCount: number } {
  let minimumEdgeGapPx = Number.POSITIVE_INFINITY;
  let visualOverlapCount = 0;
  for (let i = 0; i < nodes.length; i += 1) {
    const pointA = drawnPoint(ordered[i], nodes[i].focusDisplayAngle, geometry);
    for (let j = i + 1; j < nodes.length; j += 1) {
      const pointB = drawnPoint(ordered[j], nodes[j].focusDisplayAngle, geometry);
      const gap = radarScreenEdgeGapPx(pointA, pointB, geometry.rect);
      if (gap < minimumEdgeGapPx) minimumEdgeGapPx = gap;
      if (gap < 0) visualOverlapCount += 1;
    }
  }
  return { minimumEdgeGapPx, visualOverlapCount };
}

function minimumRequiredSeparation(
  matrix: readonly number[][],
): number {
  if (matrix.length < 2) return 0;
  let minimum = Number.POSITIVE_INFINITY;
  for (let i = 0; i < matrix.length; i += 1) {
    for (let j = i + 1; j < matrix.length; j += 1) {
      const required = matrix[i][j];
      if (required < minimum) minimum = required;
    }
  }
  return minimum;
}

/**
 * Deterministic local focus layout for one focused cluster.
 *
 * Every node keeps its semantic time radius EXACTLY (`focusDisplayRadius ===
 * semanticRadius`); only the display angle is planned. Same input -> same plan.
 * The placement satisfies the physical edge-gap target for EVERY marker pair,
 * adjacent or not, whenever that is physically possible inside the usable arc.
 */
export function planRadarLocalFocus(
  signals: readonly RadarLocalFocusSignal[],
  options?: RadarLocalFocusOptions,
): RadarLocalFocusPlan {
  const geometry: LayoutGeometry = {
    outerRadius: options?.outerRadius ?? RADAR_LOCAL_DEFAULT_OUTER_RADIUS,
    center: options?.center ?? RADAR_LOCAL_DEFAULT_CENTER,
    rect: options?.rect ?? {
      left: 0,
      top: 0,
      width: RADAR_LOCAL_REFERENCE_RADAR_PX,
      height: RADAR_LOCAL_REFERENCE_RADAR_PX,
    },
  };
  const targetGapPx = options?.targetGapPx ?? RADAR_LOCAL_TARGET_GAP_PX;
  const minGapPx = options?.minGapPx ?? RADAR_LOCAL_MIN_GAP_PX;
  const comfortExpansionDeg =
    options?.comfortExpansionDeg ?? RADAR_LOCAL_COMFORT_EXPANSION_DEG;

  const ordered: OrderedSignal[] = signals
    .map((signal, orderIndex) => ({
      ...signal,
      semanticRadius: geometry.outerRadius * signal.radiusRatio,
      orderIndex,
    }))
    .sort(compareSignals);

  const matrixAtTarget = requiredMatrix(ordered, targetGapPx, geometry);
  let gapTargetPx = targetGapPx;
  let matrix = matrixAtTarget;
  let layoutStatus: RadarLocalFocusLayoutStatus = "ok";

  if (runSpanDeg(matrixAtTarget) > RADAR_LOCAL_USABLE_SPAN_DEG + 1e-9) {
    const floorMatrix = requiredMatrix(ordered, minGapPx, geometry);
    if (runSpanDeg(floorMatrix) <= RADAR_LOCAL_USABLE_SPAN_DEG + 1e-9) {
      layoutStatus = "reduced-gap";
      let lo = minGapPx;
      let hi = targetGapPx;
      for (let iteration = 0; iteration < RADAR_LOCAL_GAP_SEARCH_ITERATIONS; iteration += 1) {
        const mid = (lo + hi) / 2;
        const midMatrix = requiredMatrix(ordered, mid, geometry);
        if (runSpanDeg(midMatrix) <= RADAR_LOCAL_USABLE_SPAN_DEG + 1e-9) lo = mid;
        else hi = mid;
      }
      gapTargetPx = lo;
      matrix = requiredMatrix(ordered, lo, geometry);
    } else {
      layoutStatus = "residual-collision";
      gapTargetPx = minGapPx;
      matrix = floorMatrix;
    }
  }

  const { angles: focusDisplayAngles, expansionDeg: appliedComfortExpansionDeg } =
    placeAlongArc(matrix, comfortExpansionDeg);
  const nodes: RadarLocalFocusNode[] = ordered.map((signal, index) => {
    const focusDisplayRadius = signal.semanticRadius;
    const focusDisplayAngle = focusDisplayAngles[index];
    const point = polarToXY(focusDisplayAngle, focusDisplayRadius, geometry.center);
    return {
      id: signal.id,
      semanticAngle: signal.semanticAngle,
      semanticRadius: signal.semanticRadius,
      focusDisplayAngle,
      focusDisplayRadius,
      displayX: point.x,
      displayY: point.y,
    };
  });

  const { minimumEdgeGapPx, visualOverlapCount } = measure(nodes, ordered, geometry);
  const occupiedAngularSpanDeg =
    ordered.length < 2
      ? 0
      : focusDisplayAngles[focusDisplayAngles.length - 1] - focusDisplayAngles[0];

  return {
    nodes,
    layoutStatus,
    usableAngularSpan: RADAR_LOCAL_USABLE_SPAN_DEG,
    minimumEdgeGapPx,
    visualOverlapCount,
    gapTargetPx,
    comfortExpansionDeg: appliedComfortExpansionDeg,
    occupiedAngularSpanDeg,
    minimumRequiredSeparationDeg: minimumRequiredSeparation(matrix),
    arcStartDeg: RADAR_LOCAL_ARC_START_DEG,
    arcEndDeg: RADAR_LOCAL_ARC_END_DEG,
    topCorridorDeg: RADAR_LOCAL_TOP_CORRIDOR_DEG,
    algorithm: RADAR_LOCAL_ALGORITHM,
  };
}
