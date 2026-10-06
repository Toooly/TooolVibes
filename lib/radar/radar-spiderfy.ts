/**
 * Radar SPIDERFY — residual collision presentation (spec §9).
 *
 * When several signals remain visually inseparable even at the maximum camera
 * zoom, they are NOT sent to the ambiguity chooser. Only that collision group
 * fans out around its own SEMANTIC ANCHOR, joined by thin restrained connector
 * lines. Unrelated signals never re-layout and the anchor never moves.
 *
 * Tap a leg -> select that signal. Tap elsewhere -> collapse. Under
 * `prefers-reduced-motion` the fan-out is instant (the caller swaps the CSS
 * transition; the geometry is identical either way).
 *
 * DETERMINISM: same input → same fan-out. The angular start is derived from
 * `stableHash` over the sorted member ids, so groups never jitter between
 * renders, and members are ordered by id.
 */

import { stableHash } from "@/lib/radar/radar-geometry";

/** Minimum radius of the fan-out ring in global viewBox units. */
export const RADAR_SPIDER_RADIUS = 6.5;
/**
 * Target edge-to-edge gap between two fanned legs, in viewBox units. The ring
 * is widened when the members' visual radii demand it, so a spiderfied group
 * always presents with `visualMarkerOverlapCount = 0` (spec §8).
 */
export const RADAR_SPIDER_LEG_GAP = 1;
/** Below this edge-to-edge gap (viewBox units) two nodes form a collision. */
export const RADAR_SPIDER_JOIN_GAP = 0.6;
/** Stroke width for the restrained connector lines, viewBox units. */
export const RADAR_SPIDER_CONNECTOR_WIDTH = 0.22;

export type RadarSpiderNode = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

export type RadarSpiderLeg = {
  id: string;
  /** Fan-out position — presentation only. */
  x: number;
  y: number;
};

export type RadarSpiderConnector = {
  from: { x: number; y: number };
  to: { x: number; y: number };
};

export type RadarSpiderGroup = {
  /** Deterministic group key (sorted member ids joined). */
  key: string;
  /** The semantic anchor — the mean of the members' global positions. */
  anchor: { x: number; y: number };
  memberIds: readonly string[];
  legs: readonly RadarSpiderLeg[];
  connectors: readonly RadarSpiderConnector[];
};

export type RadarSpiderPlan = {
  groups: readonly RadarSpiderGroup[];
  /** Ids that have been fanned out (their drawn position differs from global). */
  spideredIds: ReadonlySet<string>;
  algorithm: string;
};

export const RADAR_SPIDER_ALGORITHM = [
  "Radar spiderfy (residual collisions only).",
  "1. Build collision groups: connected components where the edge-to-edge gap",
  "   is below RADAR_SPIDER_JOIN_GAP in GLOBAL space (no zoom can separate them).",
  "2. Groups of one member are ignored — nothing to fan out.",
  "3. Each group fans out on a ring of RADAR_SPIDER_RADIUS around its own",
  "   semantic anchor (the mean of member positions). The anchor never moves.",
  "4. Legs are ordered by id; the start angle is stableHash of the sorted ids.",
  "5. Thin connectors run anchor -> leg. Unrelated signals are untouched.",
].join("\n");

function euclidean(a: RadarSpiderNode, b: RadarSpiderNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Deterministic fan-out for the groups that camera zoom cannot separate.
 * Nodes that are NOT part of a collision group are returned unmodified (they
 * are simply absent from `spideredIds`).
 */
export function planRadarSpiderfy(
  nodes: readonly RadarSpiderNode[],
  options: { joinGap?: number; fanRadius?: number } = {},
): RadarSpiderPlan {
  const joinGap = options.joinGap ?? RADAR_SPIDER_JOIN_GAP;
  const minFanRadius = options.fanRadius ?? RADAR_SPIDER_RADIUS;

  const parent = new Map<string, string>();
  for (const node of nodes) parent.set(node.id, node.id);
  const find = (id: string): string => {
    let cursor = id;
    while (parent.get(cursor) !== cursor) {
      cursor = parent.get(cursor) as string;
    }
    return cursor;
  };
  const union = (a: string, b: string) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootB, rootA);
  };

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const gap = euclidean(nodes[i], nodes[j]) - nodes[i].radius - nodes[j].radius;
      if (gap < joinGap) union(nodes[i].id, nodes[j].id);
    }
  }

  const buckets = new Map<string, RadarSpiderNode[]>();
  for (const node of nodes) {
    const root = find(node.id);
    const bucket = buckets.get(root);
    if (bucket) {
      bucket.push(node);
    } else {
      buckets.set(root, [node]);
    }
  }

  const groups: RadarSpiderGroup[] = [];
  const spideredIds = new Set<string>();

  for (const bucket of buckets.values()) {
    if (bucket.length < 2) continue;
    const ordered = [...bucket].sort((a, b) => a.id.localeCompare(b.id));
    const anchor = {
      x: ordered.reduce((sum, node) => sum + node.x, 0) / ordered.length,
      y: ordered.reduce((sum, node) => sum + node.y, 0) / ordered.length,
    };
    const startAngle =
      ((stableHash(ordered.map((node) => node.id).join("|")) % 360) * Math.PI) / 180;
    const step = (Math.PI * 2) / ordered.length;

    // §8 — widen the ring until the fanned legs cannot touch. Adjacent legs on
    // a ring of radius R are 2R·sin(π/n) apart, so we need
    // R >= (2·rMax + gap) / (2·sin(π/n)).
    const maxRadius = Math.max(...ordered.map((node) => node.radius));
    const required =
      (2 * maxRadius + RADAR_SPIDER_LEG_GAP) /
      (2 * Math.sin(Math.PI / ordered.length));
    const fanRadius = Math.max(minFanRadius, Math.ceil(required * 10) / 10);

    const legs: RadarSpiderLeg[] = [];
    const connectors: RadarSpiderConnector[] = [];
    ordered.forEach((node, index) => {
      const angle = startAngle + step * index;
      const x = anchor.x + fanRadius * Math.cos(angle);
      const y = anchor.y + fanRadius * Math.sin(angle);
      legs.push({ id: node.id, x, y });
      connectors.push({ from: { ...anchor }, to: { x, y } });
      spideredIds.add(node.id);
    });

    groups.push({
      key: ordered.map((node) => node.id).join("|"),
      anchor,
      memberIds: ordered.map((node) => node.id),
      legs,
      connectors,
    });
  }

  groups.sort((a, b) => a.key.localeCompare(b.key));

  return {
    groups,
    spideredIds,
    algorithm: RADAR_SPIDER_ALGORITHM,
  };
}

/** A group too large for a safe fan-out should fall back to the chooser (§10). */
export const RADAR_SPIDER_MAX_GROUP = 6;

export function radarSpiderNeedsChooser(group: RadarSpiderGroup): boolean {
  return group.memberIds.length > RADAR_SPIDER_MAX_GROUP;
}
