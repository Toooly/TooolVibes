/**
 * Deterministic radial layout for the Radar map.
 *
 * SEMANTICS (never decorative — see `RADAR_VISUAL_SEMANTICS`):
 *   angle  → category sector (equal sectors over sorted category ids;
 *            uncategorized tools share the "Altri segnali" sector)
 *   radius → recency when `launchedAt` is known (newest → center),
 *            otherwise rank (best rank → center)
 *   size   → attention (votes + comments), clamped
 *
 * DETERMINISM: same input → same output. The only non-semantic term is
 * `collisionJitter`, a deterministic function of (id, index) with fixed
 * amplitude, used solely to reduce overlap. It is documented as
 * non-semantic and disabled entirely when `jitter: false`.
 *
 * All coordinates live in a normalized viewBox space `0..100` with the
 * instrument center at (50, 50). Nothing is ever placed outside the
 * instrument radius.
 */

import type { RadarTool } from "@/lib/radar/radar-domain";

export type RadarPoint = {
  id: string;
  /** Degrees, 0 = up (12 o'clock), clockwise. */
  angleDeg: number;
  /** 0 = center, 1 = outer ring. */
  radiusRatio: number;
  /** viewBox X in 0..100. */
  x: number;
  /** viewBox Y in 0..100. */
  y: number;
  /** Blip radius in viewBox units (semantic: attention). */
  size: number;
  category: string | null;
  rank: number;
};

export type RadarLayoutOptions = {
  /** Outer radius in viewBox units. Default 42 (leaves label margin inside 0..100). */
  outerRadius?: number;
  /** Inner radius ratio floor so the core logo is never covered. Default 0.22. */
  innerRadiusRatio?: number;
  /** Enable deterministic non-semantic collision jitter. Default true. */
  jitter?: boolean;
};

export const RADAR_VIEWBOX_SIZE = 100;
export const RADAR_CENTER = 50;
const DEFAULT_OUTER_RADIUS = 42;
const DEFAULT_INNER_RADIUS_RATIO = 0.22;
const MIN_BLIP_RADIUS = 1.6;
const MAX_BLIP_RADIUS = 4.8;
/** Non-semantic collision jitter amplitude in viewBox units. */
const JITTER_AMPLITUDE = 1.1;

/**
 * Stable 32-bit hash (FNV-1a). Deterministic across runs and platforms —
 * used only for non-semantic jitter, never for meaning.
 */
export function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Radius ratio: 1 = newest/highest-rank (center) … 0 = oldest/lowest-rank.
 * Documented as semantic. When `launchedAt` is missing for every tool the
 * layout falls back to rank and reports it via `radiusBasis`.
 */
export function resolveRadiusRatio(
  tool: RadarTool,
  basis: "recency" | "rank",
  span: { min: number; max: number },
): number {
  const value =
    basis === "recency" ? (tool.ageHours ?? Number.POSITIVE_INFINITY) : tool.rank;
  if (!Number.isFinite(value)) return 0;
  if (span.max <= span.min) return 1;
  // Lower value (newer / better rank) → higher ratio (closer to center).
  const normalized = (span.max - value) / (span.max - span.min);
  return clamp(normalized, 0, 1);
}

function blipRadius(attention: number, maxAttention: number): number {
  if (maxAttention <= 0) return MIN_BLIP_RADIUS;
  const ratio = clamp(attention / maxAttention, 0, 1);
  return MIN_BLIP_RADIUS + ratio * (MAX_BLIP_RADIUS - MIN_BLIP_RADIUS);
}

/**
 * Lays out Radar points. Pure: identical inputs produce identical output.
 */
export function layoutRadarPoints(
  tools: readonly RadarTool[],
  options: RadarLayoutOptions = {},
): { points: RadarPoint[]; radiusBasis: "recency" | "rank"; sectorCount: number } {
  const outerRadius = options.outerRadius ?? DEFAULT_OUTER_RADIUS;
  const innerRadiusRatio = options.innerRadiusRatio ?? DEFAULT_INNER_RADIUS_RATIO;
  const jitterEnabled = options.jitter !== false;

  if (tools.length === 0) {
    return { points: [], radiusBasis: "rank", sectorCount: 0 };
  }

  // --- sector assignment: equal sectors over sorted category ids -----------
  const sectorIds = Array.from(
    new Set(tools.map((tool) => tool.category?.id ?? "altri-segnali")),
  ).sort((a, b) => a.localeCompare(b));
  const sectorIndexById = new Map(sectorIds.map((id, index) => [id, index]));
  const sectorCount = sectorIds.length;
  const sectorSpanDeg = 360 / sectorCount;

  // --- radius basis: recency only when EVERY tool has a real launch date ---
  const allHaveLaunchDate = tools.every((tool) => tool.launchedAt !== null);
  const radiusBasis: "recency" | "rank" = allHaveLaunchDate ? "recency" : "rank";

  const radiusValues = tools.map((tool) =>
    radiusBasis === "recency" ? (tool.ageHours ?? 0) : tool.rank,
  );
  const span = { min: Math.min(...radiusValues), max: Math.max(...radiusValues) };

  const maxAttention = Math.max(...tools.map((tool) => tool.attention), 0);

  // Within a sector, order by rank so neighbouring blips are stable.
  const bySector = new Map<string, RadarTool[]>();
  for (const tool of tools) {
    const key = tool.category?.id ?? "altri-segnali";
    const list = bySector.get(key) ?? [];
    list.push(tool);
    bySector.set(key, list);
  }
  for (const list of bySector.values()) {
    list.sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
  }

  const points: RadarPoint[] = [];

  for (const [sectorId, list] of [...bySector.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const sectorIndex = sectorIndexById.get(sectorId) ?? 0;
    const sectorStart = sectorIndex * sectorSpanDeg;
    // Keep blips inside the sector: map the sector to 70% of its span.
    const usableSpan = sectorSpanDeg * 0.7;
    const sectorPadding = (sectorSpanDeg - usableSpan) / 2;

    list.forEach((tool, index) => {
      const fraction = list.length === 1 ? 0.5 : index / (list.length - 1);
      const angleDeg = sectorStart + sectorPadding + fraction * usableSpan;

      const ratio = resolveRadiusRatio(tool, radiusBasis, span);
      const radialDistance =
        outerRadius * (innerRadiusRatio + (1 - innerRadiusRatio) * ratio);

      const radians = ((angleDeg - 90) * Math.PI) / 180;
      let x = RADAR_CENTER + radialDistance * Math.cos(radians);
      let y = RADAR_CENTER + radialDistance * Math.sin(radians);

      if (jitterEnabled) {
        // Deterministic, NON-semantic collision relief. Documented as such.
        const hash = stableHash(`${tool.id}:${index}`);
        const dx = ((hash & 0xff) / 255 - 0.5) * 2 * JITTER_AMPLITUDE;
        const dy = (((hash >> 8) & 0xff) / 255 - 0.5) * 2 * JITTER_AMPLITUDE;
        x = clamp(x + dx, RADAR_CENTER - outerRadius, RADAR_CENTER + outerRadius);
        y = clamp(y + dy, RADAR_CENTER - outerRadius, RADAR_CENTER + outerRadius);
      }

      points.push({
        id: tool.id,
        angleDeg,
        radiusRatio: ratio,
        x,
        y,
        size: blipRadius(tool.attention, maxAttention),
        category: tool.category?.id ?? null,
        rank: tool.rank,
      });
    });
  }

  return { points, radiusBasis, sectorCount };
}

/**
 * Data-truth guard used by tests and by the UI in development:
 * every point must be finite and inside the instrument bounds.
 */
export function assertRadarPointsInBounds(
  points: readonly RadarPoint[],
  outerRadius = DEFAULT_OUTER_RADIUS,
): boolean {
  const limit = outerRadius + JITTER_AMPLITUDE + 0.001;
  return points.every((point) => {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return false;
    if (!Number.isFinite(point.size) || point.size <= 0) return false;
    const dx = point.x - RADAR_CENTER;
    const dy = point.y - RADAR_CENTER;
    return Math.sqrt(dx * dx + dy * dy) <= limit;
  });
}
