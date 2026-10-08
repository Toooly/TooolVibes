/**
 * RADAR LOCAL CLUSTER MODE — PASS 1: deterministic local focus layout.
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
 *   MARKER-AWARE SPACING: for each adjacent ordered pair the engine finds the
 *   MINIMUM angular separation whose physical edge-to-edge gap reaches the
 *   target, measured with the frozen `radarScreenEdgeGapPx` against the
 *   physical reference instrument (390px viewport, 358px Radar). The search
 *   is a fixed-iteration binary search over the candidate angular delta.
 *
 *   NEGATIVE SPACE: a bounded comfort expansion widens each internal gap up to
 *   RADAR_LOCAL_COMFORT_EXPANSION_DEG (capped by the remaining slack), so
 *   sparse clusters stay centred and do NOT stretch to the arc extremes while
 *   dense clusters naturally use more of the circumference. Identical
 *   same-radius dense sets may end up evenly distributed; that is acceptable.
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
  /** Edge-gap target the layout was actually placed at (18 or the 14 floor). */
  gapTargetPx: number;
  /** Comfort expansion applied to each internal gap, degrees. */
  comfortExpansionDeg: number;
  /** Angular span occupied by the run, degrees. */
  occupiedAngularSpanDeg: number;
  /** Smallest required adjacent separation at `gapTargetPx`, degrees. */
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
  "Radar Local Cluster Mode (deterministic angular layout, PASS 1).",
  "1. Signals are ordered by semanticAngle ascending, then id ascending; the",
  "   display placement preserves that order monotonically.",
  "2. Semantic time radius is preserved exactly: focusDisplayRadius ===",
  "   semanticRadius === outerRadius * radiusRatio. Only angles move.",
  "3. The top corridor (70 deg about 12 o'clock) is reserved for time labels;",
  "   nodes live in the usable 35..325 deg arc (290 deg).",
  "4. Each adjacent pair gets the MINIMUM angular separation whose physical",
  "   edge-to-edge gap reaches the target, via a fixed-iteration binary search",
  "   measured with radarScreenEdgeGapPx on the 358px reference instrument.",
  "5. A bounded comfort expansion widens internal gaps up to 22 deg (capped by",
  "   the remaining slack): sparse clusters keep negative space and stay",
  "   centred; dense clusters use more of the circumference.",
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

function requiredSeparations(
  ordered: readonly OrderedSignal[],
  targetGapPx: number,
  geometry: LayoutGeometry,
): number[] {
  const separations: number[] = [];
  for (let index = 0; index + 1 < ordered.length; index += 1) {
    separations.push(
      requiredSeparationDeg(ordered[index], ordered[index + 1], targetGapPx, geometry),
    );
  }
  return separations;
}

function totalRequiredSpan(separations: readonly number[]): number {
  let total = 0;
  for (const separation of separations) total += separation;
  return total;
}

function fitsInUsableArc(separations: readonly number[]): boolean {
  return totalRequiredSpan(separations) <= RADAR_LOCAL_USABLE_SPAN_DEG + 1e-9;
}

function cappedSpan(separations: readonly number[]): number {
  return totalRequiredSpan(
    separations.map((separation) =>
      Math.min(
        separation === Number.POSITIVE_INFINITY
          ? RADAR_LOCAL_MAX_PAIR_SEPARATION_DEG
          : separation,
        RADAR_LOCAL_MAX_PAIR_SEPARATION_DEG,
      ),
    ),
  );
}

/**
 * Places the ordered run along the usable arc, centred at the arc midpoint.
 * Comfort expansion widens each internal gap up to `comfortExpansionDeg` but
 * never beyond the remaining slack; when the raw separations alone exceed the
 * arc (residual-collision) they are scaled down proportionally so every node
 * stays inside the legal arc, in order.
 */
function placeAlongArc(
  ordered: readonly OrderedSignal[],
  separations: readonly number[],
  comfortExpansionDeg: number,
): number[] {
  const count = ordered.length;
  if (count === 0) return [];
  if (count === 1) return [RADAR_LOCAL_ARC_MID_DEG];

  const placed = separations.map((separation) =>
    Math.min(
      separation === Number.POSITIVE_INFINITY
        ? RADAR_LOCAL_MAX_PAIR_SEPARATION_DEG
        : separation,
      RADAR_LOCAL_MAX_PAIR_SEPARATION_DEG,
    ),
  );
  const total = totalRequiredSpan(placed);
  const expansion =
    count > 1 ? Math.min(comfortExpansionDeg, (RADAR_LOCAL_USABLE_SPAN_DEG - total) / (count - 1)) : 0;
  const gaps = placed.map((separation) =>
    total > RADAR_LOCAL_USABLE_SPAN_DEG + 1e-9
      ? (separation * RADAR_LOCAL_USABLE_SPAN_DEG) / total
      : separation + expansion,
  );

  let span = 0;
  for (const gap of gaps) span += gap;
  let current = RADAR_LOCAL_ARC_MID_DEG - span / 2;
  const angles: number[] = [];
  for (let index = 0; index < count; index += 1) {
    angles.push(Math.min(Math.max(current, RADAR_LOCAL_ARC_START_DEG), RADAR_LOCAL_ARC_END_DEG));
    current += gaps[index];
  }
  return angles;
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

/**
 * Deterministic local focus layout for one focused cluster.
 *
 * Every node keeps its semantic time radius EXACTLY (`focusDisplayRadius ===
 * semanticRadius`); only the display angle is planned. Same input -> same plan.
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

  const separationsAtTarget = requiredSeparations(ordered, targetGapPx, geometry);
  let gapTargetPx = targetGapPx;
  let separations = separationsAtTarget;
  let layoutStatus: RadarLocalFocusLayoutStatus = "ok";

  if (!fitsInUsableArc(separationsAtTarget)) {
    const floorSeparations = requiredSeparations(ordered, minGapPx, geometry);
    if (fitsInUsableArc(floorSeparations)) {
      layoutStatus = "reduced-gap";
      let lo = minGapPx;
      let hi = targetGapPx;
      for (let iteration = 0; iteration < RADAR_LOCAL_GAP_SEARCH_ITERATIONS; iteration += 1) {
        const mid = (lo + hi) / 2;
        if (fitsInUsableArc(requiredSeparations(ordered, mid, geometry))) lo = mid;
        else hi = mid;
      }
      gapTargetPx = lo;
      separations = requiredSeparations(ordered, lo, geometry);
    } else {
      layoutStatus = "residual-collision";
      gapTargetPx = minGapPx;
      separations = floorSeparations;
    }
  }

  const focusDisplayAngles = placeAlongArc(ordered, separations, comfortExpansionDeg);
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
  const span = cappedSpan(separations);
  const minimumRequiredSeparationDeg =
    ordered.length < 2
      ? 0
      : separations.includes(Number.POSITIVE_INFINITY)
        ? Number.POSITIVE_INFINITY
        : Math.min(...separations);
  const occupiedAngularSpanDeg =
    ordered.length < 2
      ? 0
      : focusDisplayAngles[focusDisplayAngles.length - 1] - focusDisplayAngles[0];
  const appliedComfortExpansionDeg =
    ordered.length < 2 ||
    layoutStatus === "residual-collision" ||
    span > RADAR_LOCAL_USABLE_SPAN_DEG + 1e-9
      ? 0
      : Math.min(
          comfortExpansionDeg,
          (RADAR_LOCAL_USABLE_SPAN_DEG - span) / (ordered.length - 1),
        );

  return {
    nodes,
    layoutStatus,
    usableAngularSpan: RADAR_LOCAL_USABLE_SPAN_DEG,
    minimumEdgeGapPx,
    visualOverlapCount,
    gapTargetPx,
    comfortExpansionDeg: appliedComfortExpansionDeg,
    occupiedAngularSpanDeg,
    minimumRequiredSeparationDeg,
    arcStartDeg: RADAR_LOCAL_ARC_START_DEG,
    arcEndDeg: RADAR_LOCAL_ARC_END_DEG,
    topCorridorDeg: RADAR_LOCAL_TOP_CORRIDOR_DEG,
    algorithm: RADAR_LOCAL_ALGORITHM,
  };
}
