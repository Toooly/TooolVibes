/**
 * Deterministic radial layout for the Radar map.
 *
 * SEMANTICS (never decorative — see `RADAR_VISUAL_SEMANTICS`):
 *   angle  → RadarTopicCluster sector on ONE FIXED GLOBAL COMPASS. Every
 *            cluster owns a permanent angular sector, computed the same way for
 *            every dataset, filter and time range. Filtering or searching NEVER
 *            recomputes geometry, so a point's x/y is identical before and
 *            after any filter. Within a sector tools are spread by a
 *            deterministic index offset so they do not stack.
 *   radius → AGE WITHIN THE SELECTED RANGE. Center = now / newest, outer edge
 *            = oldest edge of the range. Items with no `createdAt` are placed
 *            on an explicit unknown-age band at the outer edge — we never
 *            invent an age.
 *   size   → relative attention (votes + comments) with PERCEPTUAL sqrt
 *            scaling, so area grows with attention instead of radius.
 *   colour → RadarTopicCluster (consumed by the map, not by this module).
 *   halo   → none. There is no history yet.
 *
 * DETERMINISM: same input → same output. The only non-semantic term is the
 * collision resolution, which moves points TANGENTIALLY only (radius is
 * preserved exactly) and never exceeds `maxTangentialDeg`. Documented as
 * non-semantic.
 *
 * All coordinates live in a normalized viewBox space `0..100` with the
 * instrument center at (50, 50). Nothing is ever placed outside the
 * instrument radius.
 */

import type { ProductHuntRange } from "@/lib/radar/product-hunt-contract";
import {
  radarAgeToRadiusRatio,
  radarRangeFromHours,
  radarTimeRingRadius,
} from "@/lib/radar/radar-time-scale";
import {
  radarTopicClusterOrder,
  radarTopicClusterSectorIndex,
} from "@/lib/radar/radar-topic-clusters";

export type RadarPoint = {
  id: string;
  /** Degrees, 0 = up (12 o'clock), clockwise. Post-collision. */
  angleDeg: number;
  /** 0 = center (newest), 1 = outer edge (oldest). Never changed by collision. */
  radiusRatio: number;
  /** viewBox X in 0..100. */
  x: number;
  /** viewBox Y in 0..100. */
  y: number;
  /** Blip radius in viewBox units (semantic: relative attention). */
  size: number;
  /** RadarTopicCluster id. */
  category: string | null;
  clusterId: string;
  rank: number;
  /** False when the source gave no `createdAt` — rendered on the unknown band. */
  ageKnown: boolean;
  /** Hours old, when known. */
  ageHours: number | null;
  /** Pre-collision theoretical angle (evidence for `SEMANTICS.json`). */
  semanticAngleDeg: number;
  /** Deterministic tangential displacement applied by collision resolution. */
  collisionOffsetDeg: number;
};

export type RadarLayoutItem = {
  id: string;
  /** Preferred: explicit RadarTopicCluster id. */
  clusterId?: string | null;
  /** Accepted: the normalized Radar tool carries the cluster here. */
  topicCluster?: { id: string } | null;
  /** Accepted for legacy shapes. */
  category?: { id: string } | null;
  /** Real attention: votes + comments. */
  attention: number;
  /** Hours since launch; `null` when the source omits `createdAt`. */
  ageHours: number | null;
  rank: number;
};

/** Resolves the cluster id from any accepted shape. Never invents one. */
export function radarLayoutClusterId(item: RadarLayoutItem): string {
  return (
    item.clusterId ??
    item.topicCluster?.id ??
    item.category?.id ??
    "other"
  );
}

export type RadarLayoutOptions = {
  /** Outer radius in viewBox units. Default 42 (leaves label margin inside 0..100). */
  outerRadius?: number;
  /** Inner radius ratio floor so the core is never covered. Default 0.12. */
  innerRadiusRatio?: number;
  /** Range length in hours, used to map age → radius. Default 24. */
  rangeHours?: number;
  /** Strict maximum tangential collision displacement, degrees. Default 14. */
  maxTangentialDeg?: number;
  /** Disable collision resolution entirely (tests). */
  resolveCollisions?: boolean;
};

export type RadarLayoutResult = {
  points: readonly RadarPoint[];
  /** Radius always encodes age within the selected range. */
  radiusBasis: "age";
  /** True when at least one signal has no `createdAt`. */
  hasUnknownAge: boolean;
  /** Active cluster ids in declared sector order. */
  clusterOrder: readonly string[];
  sectorCount: number;
};

export const RADAR_VIEWBOX_SIZE = 100;
export const RADAR_CENTER = 50;
/**
 * The permanent compass: 8 sectors (one per RadarTopicCluster) shared by every
 * dataset. Sector angles never depend on which clusters happen to be present.
 */
export const RADAR_COMPASS_SECTOR_COUNT = 8;
export const RADAR_COMPASS_SECTOR_SPAN_DEG = 360 / RADAR_COMPASS_SECTOR_COUNT;
const DEFAULT_OUTER_RADIUS = 42;
const DEFAULT_INNER_RADIUS_RATIO = 0.12;
const DEFAULT_RANGE_HOURS = 24;
const DEFAULT_MAX_TANGENTIAL_DEG = 14;
const COLLISION_ITERATIONS = 4;

/**
 * Perceptual attention scaling (documented formula, spec §12):
 *
 *     t        = sqrt(attention) / sqrt(maxAttentionInDataset)
 *     visualR  = MIN + t * (MAX - MIN)
 *
 * Taking the square root makes the blip AREA (not its radius) grow roughly in
 * proportion to attention, which is how humans compare magnitudes. Linear
 * radius scaling makes a 1800-vote tool look only ~2x a 450-vote one; sqrt
 * scaling makes the difference legible without letting one item dominate.
 * Displayed vote/comment numbers always remain the real values.
 */
export const MIN_BLIP_RADIUS = 1.9;
export const MAX_BLIP_RADIUS = 5.6;

/**
 * Spec §16 — Level-0 Overview compresses the VISUAL radius range by ~20% so a
 * high-attention marker stops dominating the quiet overview. The underlying
 * attention value and its sqrt ordering are untouched; only the rendering scale
 * differs between Overview and Sector Lens.
 */
export const RADAR_OVERVIEW_RADIUS_COMPRESSION = 0.8;

export function compressVisualRadiusForOverview(radius: number): number {
  const mid = (MIN_BLIP_RADIUS + MAX_BLIP_RADIUS) / 2;
  return mid + (radius - mid) * RADAR_OVERVIEW_RADIUS_COMPRESSION;
}

export function visualRadiusFromAttention(
  attention: number,
  maxAttention: number,
): number {
  const safeMax = Math.max(maxAttention, 1);
  const ratio =
    Math.sqrt(Math.max(0, attention)) / Math.sqrt(safeMax);
  return MIN_BLIP_RADIUS + ratio * (MAX_BLIP_RADIUS - MIN_BLIP_RADIUS);
}

/**
 * Real time boundaries for the ring progression, expressed as a fraction of
 * the selected range. Labels are the real elapsed time at that ring.
 * Center ≈ now, outer ring = the oldest edge of the range (spec §10).
 */
const TEMPORAL_RING_CHECKPOINTS: Record<
  ProductHuntRange,
  readonly { ageHours: number; label: string }[]
> = {
  day: [
    { ageHours: 6, label: "6h" },
    { ageHours: 12, label: "12h" },
    { ageHours: 18, label: "18h" },
    { ageHours: 24, label: "24h" },
  ],
  week: [
    { ageHours: 48, label: "2g" },
    { ageHours: 96, label: "4g" },
    { ageHours: 144, label: "6g" },
    { ageHours: 168, label: "7g" },
  ],
  month: [
    { ageHours: 168, label: "7g" },
    { ageHours: 336, label: "14g" },
    { ageHours: 504, label: "21g" },
    { ageHours: 720, label: "30g" },
  ],
};

/**
 * Temporal ring radii computed by the SAME perceptual projection as signals
 * (radar-time-scale). Ring ratios include the inner-radius floor so ring
 * positions align exactly with signal centres at the checkpoint age.
 */
export const RADAR_TIME_RINGS: Record<
  ProductHuntRange,
  readonly { ratio: number; label: string }[]
> = {
  day: TEMPORAL_RING_CHECKPOINTS.day.map(({ ageHours, label }) => ({
    ratio: radarTimeRingRadius(ageHours, "day"),
    label,
  })),
  week: TEMPORAL_RING_CHECKPOINTS.week.map(({ ageHours, label }) => ({
    ratio: radarTimeRingRadius(ageHours, "week"),
    label,
  })),
  month: TEMPORAL_RING_CHECKPOINTS.month.map(({ ageHours, label }) => ({
    ratio: radarTimeRingRadius(ageHours, "month"),
    label,
  })),
};

export const RADAR_RANGE_HOURS: Record<ProductHuntRange, number> = {
  day: 24,
  week: 168,
  month: 720,
};

/** Label for the instrument center ("now"). */
export const RADAR_RING_CENTER_LABEL = "ORA";

export function radarRingLabels(
  range: ProductHuntRange,
): readonly { ratio: number; label: string }[] {
  return RADAR_TIME_RINGS[range] ?? RADAR_TIME_RINGS.day;
}

/**
 * Stable 32-bit hash (FNV-1a). Deterministic across runs and platforms —
 * used only for the direction of non-semantic collision nudges, never for
 * meaning.
 */
export function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Age → radius ratio. Center = newest, outer edge = oldest.
 * Unknown age maps to the outer band and is reported separately.
 */
export function resolveAgeRadiusRatio(
  ageHours: number | null,
  rangeHours: number,
  innerRadiusRatio: number,
): number {
  if (ageHours === null || !Number.isFinite(ageHours)) return 1;
  const range = radarRangeFromHours(rangeHours);
  const perceptual = radarAgeToRadiusRatio(ageHours, range);
  return innerRadiusRatio + (1 - innerRadiusRatio) * perceptual;
}

/** Back-compatible helper used by older call sites/tests. */
export function resolveRadiusRatio(
  ageHours: number | null,
  rank: number,
  itemCount: number,
  options: { rangeHours?: number; innerRadiusRatio?: number } = {},
): number {
  const rangeHours = options.rangeHours ?? DEFAULT_RANGE_HOURS;
  const innerRadiusRatio = options.innerRadiusRatio ?? DEFAULT_INNER_RADIUS_RATIO;
  if (ageHours !== null && Number.isFinite(ageHours)) {
    return resolveAgeRadiusRatio(ageHours, rangeHours, innerRadiusRatio);
  }
  // Unknown age: explicit outer band, ordered by rank so it is stable.
  const safeCount = Math.max(itemCount, 1);
  const t = Math.min(1, Math.max(0, (rank - 1) / safeCount));
  return 0.96 + 0.04 * t;
}

function normalizeAngle(degrees: number): number {
  const wrapped = degrees % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function shortestAngleDelta(from: number, to: number): number {
  let delta = normalizeAngle(to) - normalizeAngle(from);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

/**
 * Deterministic bounded collision resolution.
 *
 * Points may only move TANGENTIALLY (rotation about the center), which
 * preserves `radiusRatio` exactly — the age meaning is never destroyed.
 * Total displacement per point is capped at `maxTangentialDeg`.
 */
function resolveCollisions(
  points: RadarPoint[],
  outerRadius: number,
  maxTangentialDeg: number,
): void {
  const offsets = new Map<string, number>(points.map((point) => [point.id, 0]));

  const positionOf = (point: RadarPoint, offsetDeg: number) => {
    const angle = ((point.semanticAngleDeg + offsetDeg - 90) * Math.PI) / 180;
    const distance = outerRadius * point.radiusRatio;
    return {
      x: RADAR_CENTER + distance * Math.cos(angle),
      y: RADAR_CENTER + distance * Math.sin(angle),
    };
  };

  for (let iteration = 0; iteration < COLLISION_ITERATIONS; iteration += 1) {
    let moved = false;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const offsetA = offsets.get(a.id) ?? 0;
        const offsetB = offsets.get(b.id) ?? 0;
        const pa = positionOf(a, offsetA);
        const pb = positionOf(b, offsetB);
        const dx = pa.x - pb.x;
        const dy = pa.y - pb.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minSeparation = a.size + b.size + 1.1;
        if (distance >= minSeparation) continue;

        // Nudge both apart along the tangent. Direction is derived from the
        // stable id hash so the same dataset always settles the same way.
        const signA = stableHash(a.id) % 2 === 0 ? 1 : -1;
        const step = Math.min(3, (minSeparation - distance) * 0.9);

        const nextA = offsetA + signA * step;
        const nextB = offsetB - signA * step;
        if (Math.abs(nextA) <= maxTangentialDeg) {
          offsets.set(a.id, nextA);
          moved = true;
        }
        if (Math.abs(nextB) <= maxTangentialDeg) {
          offsets.set(b.id, nextB);
          moved = true;
        }
      }
    }
    if (!moved) break;
  }

  for (const point of points) {
    const offset = offsets.get(point.id) ?? 0;
    point.collisionOffsetDeg = offset;
    point.angleDeg = normalizeAngle(point.semanticAngleDeg + offset);
    const position = positionOf(point, offset);
    point.x = position.x;
    point.y = position.y;
  }
}

export function layoutRadarPoints(
  tools: readonly RadarLayoutItem[],
  options: RadarLayoutOptions = {},
): RadarLayoutResult {
  const outerRadius = options.outerRadius ?? DEFAULT_OUTER_RADIUS;
  const innerRadiusRatio = options.innerRadiusRatio ?? DEFAULT_INNER_RADIUS_RATIO;
  const rangeHours = options.rangeHours ?? DEFAULT_RANGE_HOURS;
  const maxTangentialDeg = options.maxTangentialDeg ?? DEFAULT_MAX_TANGENTIAL_DEG;
  const shouldResolve = options.resolveCollisions !== false;

  // ONE FIXED GLOBAL COMPASS. The sector order is declared, not derived from
  // the dataset, so filtering/searching can never move an existing point.
  const clusterOrder = radarTopicClusterOrder();
  const sectorCount = RADAR_COMPASS_SECTOR_COUNT;
  const sectorSpanDeg = RADAR_COMPASS_SECTOR_SPAN_DEG;

  // Deterministic intra-sector distribution: order by age (newest first),
  // then by rank, then by id. Not semantic — purely to avoid stacking inside
  // a sector while staying reproducible.
  const itemsByCluster = new Map<string, RadarLayoutItem[]>();
  for (const tool of tools) {
    const clusterId = radarLayoutClusterId(tool);
    const bucket = itemsByCluster.get(clusterId);
    if (bucket) {
      bucket.push(tool);
    } else {
      itemsByCluster.set(clusterId, [tool]);
    }
  }
  for (const bucket of itemsByCluster.values()) {
    bucket.sort((a, b) => {
      const ageA = a.ageHours ?? Number.POSITIVE_INFINITY;
      const ageB = b.ageHours ?? Number.POSITIVE_INFINITY;
      if (ageA !== ageB) return ageA - ageB;
      if (a.rank !== b.rank) return a.rank - b.rank;
      return a.id.localeCompare(b.id);
    });
  }

  const maxAttention = tools.reduce(
    (max, tool) => Math.max(max, tool.attention),
    0,
  );

  const points: RadarPoint[] = [];
  for (const clusterId of clusterOrder) {
    const bucket = itemsByCluster.get(clusterId) ?? [];
    const sectorIndex = radarTopicClusterSectorIndex(clusterId);
    // Sector is centered on its own arc, starting at 12 o'clock.
    const sectorStartDeg = sectorIndex * sectorSpanDeg;

    bucket.forEach((tool, index) => {
      // Spread within the sector. First item sits at the sector start plus a
      // half-step so points are never on the sector boundary.
      const step = bucket.length > 1 ? sectorSpanDeg / (bucket.length + 1) : 0;
      const intraOffset = bucket.length > 1 ? step * (index + 1) : sectorSpanDeg / 2;
      const semanticAngleDeg = normalizeAngle(sectorStartDeg + intraOffset);
      const ageKnown = tool.ageHours !== null && Number.isFinite(tool.ageHours);
      const radiusRatio = resolveAgeRadiusRatio(
        tool.ageHours,
        rangeHours,
        innerRadiusRatio,
      );
      const size = visualRadiusFromAttention(tool.attention, maxAttention);
      const angle = ((semanticAngleDeg - 90) * Math.PI) / 180;
      const distance = outerRadius * radiusRatio;

      points.push({
        id: tool.id,
        angleDeg: semanticAngleDeg,
        radiusRatio,
        x: RADAR_CENTER + distance * Math.cos(angle),
        y: RADAR_CENTER + distance * Math.sin(angle),
        size,
        category: clusterId,
        clusterId,
        rank: tool.rank,
        ageKnown,
        ageHours: tool.ageHours,
        semanticAngleDeg,
        collisionOffsetDeg: 0,
      });
    });
  }

  if (shouldResolve && points.length > 1) {
    resolveCollisions(points, outerRadius, maxTangentialDeg);
  }

  return {
    points,
    radiusBasis: "age",
    hasUnknownAge: points.some((point) => !point.ageKnown),
    clusterOrder,
    sectorCount,
  };
}

export function assertRadarPointsInBounds(
  points: readonly RadarPoint[],
): boolean {
  return points.every((point) => {
    const dx = point.x - RADAR_CENTER;
    const dy = point.y - RADAR_CENTER;
    return Math.sqrt(dx * dx + dy * dy) <= DEFAULT_OUTER_RADIUS + 0.01;
  });
}

/* ---------------------------------------------------------------------------
 * Central pointer resolution (spec §1).
 *
 * WHY: the blip hit targets are 44px discs on a dense map, so they physically
 * overlap. Letting the browser dispatch a click to whatever element happens to
 * be on top makes a tap on tool A sometimes select its neighbour B.
 *
 * `resolveRadarTap` is the ONE place a physical tap becomes a selection. It
 * compares the pointer against EVERY point's true centre, ranks candidates
 * deterministically (distance, then id) and only reports `ambiguous` when the
 * two best candidates are genuinely indistinguishable at that pixel.
 * ------------------------------------------------------------------------- */

export type RadarTapCandidate = {
  point: RadarPoint;
  /** Distance from the pointer to the point's true centre, viewBox units. */
  distance: number;
};

export type RadarTapResolution =
  | { kind: "none"; candidates: readonly RadarTapCandidate[] }
  | { kind: "selected"; id: string; candidates: readonly RadarTapCandidate[] }
  | { kind: "ambiguous"; candidates: readonly RadarTapCandidate[] };

export type RadarTapOptions = {
  /** Hit radius in viewBox units. Default `HIT_RADIUS_VIEWBOX` (44px). */
  hitRadius?: number;
  /**
   * Two candidates closer than this (in distance-to-pointer) are treated as
   * indistinguishable and the chooser is offered. Default 1.6 viewBox units.
   */
  ambiguityEpsilon?: number;
  /** Max candidates reported. Default 4. */
  maxCandidates?: number;
};

/** Default hit radius in viewBox units (≈44px at a 320px render). */
export const RADAR_HIT_RADIUS_VIEWBOX = 7;
/**
 * Below this edge gap (in the same units as `hitRadius`) two candidates are
 * treated as indistinguishable and the tap is reported `ambiguous` instead of
 * guessing. Scales with the camera zoom alongside `hitRadius`.
 */
export const RADAR_TAP_AMBIGUITY_EPSILON = 0.75;

/**
 * Deterministic nearest-candidate tap resolution.
 *
 * Ranking: ascending distance to the pointer, then ascending point id.
 * Same pointer + same points → same result, always.
 */
export function resolveRadarTap(
  points: readonly RadarPoint[],
  pointerX: number,
  pointerY: number,
  options: RadarTapOptions = {},
): RadarTapResolution {
  const hitRadius = options.hitRadius ?? RADAR_HIT_RADIUS_VIEWBOX;
  // Ambiguity epsilon is expressed in viewBox units and deliberately kept BELOW
  // the smallest visual blip radius (1.5). Tapping a signal's own centre must
  // always be decisive; only genuinely indistinguishable neighbours (a tie, or
  // two overlapping centres) raise the chooser.
  const epsilon = options.ambiguityEpsilon ?? RADAR_TAP_AMBIGUITY_EPSILON;
  const maxCandidates = options.maxCandidates ?? 4;

  if (
    !Number.isFinite(pointerX) ||
    !Number.isFinite(pointerY) ||
    points.length === 0
  ) {
    return { kind: "none", candidates: [] };
  }

  const scored: RadarTapCandidate[] = [];
  for (const point of points) {
    const dx = point.x - pointerX;
    const dy = point.y - pointerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= hitRadius) {
      scored.push({ point, distance });
    }
  }

  scored.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    return a.point.id.localeCompare(b.point.id);
  });

  const candidates = scored.slice(0, maxCandidates);

  if (candidates.length === 0) {
    return { kind: "none", candidates: [] };
  }
  if (candidates.length === 1) {
    return { kind: "selected", id: candidates[0].point.id, candidates };
  }

  const best = candidates[0];
  const runnerUp = candidates[1];
  if (best.distance - runnerUp.distance >= epsilon) {
    // The nearest centre is clearly nearer — never a coin toss.
    return { kind: "selected", id: best.point.id, candidates };
  }

  return { kind: "ambiguous", candidates };
}

/** Angle delta helper kept for tests of collision semantics. */
export function radarAngleDelta(from: number, to: number): number {
  return shortestAngleDelta(from, to);
}
