/**
 * Radar SPIDERFY — residual collision presentation (spec §9, closure §1-§4).
 *
 * When several signals remain visually inseparable even at the maximum camera
 * zoom, they are NOT sent to the ambiguity chooser. Only that collision group
 * fans out around its own SEMANTIC ANCHOR, joined by thin restrained connector
 * lines.
 *
 * PRESENTATIONAL ONLY (closure §2):
 *   - every spiderfied signal RETAINS its semanticX / semanticY (spatial memory
 *     is never broken — `semanticCoordinateDelta = 0` by construction),
 *   - displayX / displayY are DERIVED separately for painting,
 *   - the connector runs semantic anchor -> display point,
 *   - no unrelated signal ever moves.
 *
 * PLACEMENT (closure §1): the fan ring starts at the smallest radius that
 * separates the group's own members and is then expanded per-leg until that leg
 * clears BOTH the other legs AND every non-member visible node. This is what
 * removes the residual overlaps a members-only ring leaves behind.
 *
 * THRESHOLD (closure §4): a collision group of at most RADAR_SPIDER_MAX_GROUP
 * members fans out; a larger group is routed to the fallback bottom sheet via
 * `chooserGroups`. No fixture id is ever hardcoded.
 *
 * Tap a leg -> select that signal and collapse. Tap elsewhere -> collapse.
 * Under `prefers-reduced-motion` the fan-out is instant (the caller swaps the
 * CSS transition; the geometry is identical either way).
 *
 * DETERMINISM: same input -> same fan-out. The angular start is derived from
 * `stableHash` over the sorted member ids, members are ordered by id, and the
 * expansion pass runs in that same order.
 */

import { stableHash } from "@/lib/radar/radar-geometry";

/** Minimum radius of the fan-out ring in global viewBox units. */
export const RADAR_SPIDER_RADIUS = 6.5;
/**
 * Target edge-to-edge gap between a fanned leg and ANY other visible marker,
 * in viewBox units. Because the camera scales uniformly, a gap held in global
 * units is a gap on screen — so `visualMarkerOverlapCount = 0` in global space
 * is `visualMarkerOverlapCount = 0` at every zoom (closure §8).
 */
export const RADAR_SPIDER_LEG_GAP = 1;
/** Below this edge-to-edge gap (viewBox units) two nodes form a collision. */
export const RADAR_SPIDER_JOIN_GAP = 0.6;
/** Stroke width for the restrained connector lines, viewBox units. */
export const RADAR_SPIDER_CONNECTOR_WIDTH = 0.22;
/** A collision group larger than this falls back to the bottom sheet (§4). */
export const RADAR_SPIDER_MAX_GROUP = 6;
/** Per-leg outward step while clearing neighbours, viewBox units. */
export const RADAR_SPIDER_EXPAND_STEP = 0.4;
/** Hard cap on how far a single leg may travel from its anchor. */
export const RADAR_SPIDER_MAX_EXPAND = 26;

export type RadarSpiderNode = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

export type RadarSpiderLeg = {
  id: string;
  /** Immutable semantic position — never moved (closure §2). */
  semanticX: number;
  semanticY: number;
  /** Presentational fan-out position used for painting only. */
  displayX: number;
  displayY: number;
  /** Radial distance of the display point from the group anchor. */
  distanceFromAnchor: number;
};

export type RadarSpiderConnector = {
  /** Semantic anchor of the collision group (closure §2). */
  from: { x: number; y: number };
  /** Display point of the spiderfied signal. */
  to: { x: number; y: number };
};

export type RadarSpiderGroup = {
  /** Deterministic group key (sorted member ids joined). */
  key: string;
  /** The semantic anchor — the mean of the members' semantic positions. */
  anchor: { x: number; y: number };
  memberIds: readonly string[];
  legs: readonly RadarSpiderLeg[];
  connectors: readonly RadarSpiderConnector[];
  /** Presentational only: at least one leg grew to clear a neighbour. */
  expanded: boolean;
  /** Group exceeds RADAR_SPIDER_MAX_GROUP -> the caller shows the sheet (§4). */
  needsChooser: boolean;
};

export type RadarSpiderPlan = {
  /** Groups that fan out in place (size 2..RADAR_SPIDER_MAX_GROUP). */
  groups: readonly RadarSpiderGroup[];
  /** Groups too large to fan out safely -> fallback bottom sheet (§4). */
  chooserGroups: readonly RadarSpiderGroup[];
  /** Ids that have been fanned out (their draw position differs from global). */
  spideredIds: ReadonlySet<string>;
  algorithm: string;
};

export const RADAR_SPIDER_ALGORITHM = [
  "Radar spiderfy (residual collisions only; presentational, never semantic).",
  "1. Collision groups = connected components where the edge-to-edge gap is",
  "   below RADAR_SPIDER_JOIN_GAP in GLOBAL space (no zoom can separate them).",
  "2. Groups of one member are ignored and act purely as obstacles.",
  "3. Groups larger than RADAR_SPIDER_MAX_GROUP route to the fallback sheet.",
  "4. Each remaining group fans out on a ring around its own semantic anchor",
  "   (the mean of member semantic positions). The anchor never moves and every",
  "   member keeps its semanticX/semanticY; only displayX/displayY are derived.",
  "5. Legs are ordered by id; the start angle is stableHash of the sorted ids.",
  "6. Each leg is then pushed outward along its own angle until it clears BOTH",
  "   the other legs and every non-member visible node by RADAR_SPIDER_LEG_GAP.",
  "7. Thin connectors run semantic anchor -> display point. Unrelated signals",
  "   are untouched.",
].join("\n");

function euclidean(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function toXY(
  anchor: { x: number; y: number },
  radius: number,
  angle: number,
): { x: number; y: number } {
  return {
    x: anchor.x + radius * Math.cos(angle),
    y: anchor.y + radius * Math.sin(angle),
  };
}

function collides(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
  gap: number,
): boolean {
  return euclidean(ax, ay, bx, by) - ar - br < gap;
}

/**
 * Deterministic fan-out for the groups that camera zoom cannot separate.
 * Nodes that are NOT part of a fanned collision group keep their global
 * position (they are simply absent from `spideredIds`).
 */
export function planRadarSpiderfy(
  nodes: readonly RadarSpiderNode[],
  options: { joinGap?: number; fanRadius?: number; legGap?: number } = {},
): RadarSpiderPlan {
  const joinGap = options.joinGap ?? RADAR_SPIDER_JOIN_GAP;
  const minFanRadius = options.fanRadius ?? RADAR_SPIDER_RADIUS;
  const legGap = options.legGap ?? RADAR_SPIDER_LEG_GAP;

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
      const gap =
        euclidean(nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y) -
        nodes[i].radius -
        nodes[j].radius;
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

  // Deterministic group order so expansion sees the same obstacles each run.
  const orderedBuckets = [...buckets.values()]
    .map((bucket) => [...bucket].sort((a, b) => a.id.localeCompare(b.id)))
    .sort((a, b) => a[0].id.localeCompare(b[0].id));

  const groups: RadarSpiderGroup[] = [];
  const chooserGroups: RadarSpiderGroup[] = [];
  const spideredIds = new Set<string>();
  /** Legs already placed — later groups must clear these too. */
  const placedLegs: RadarSpiderNode[] = [];

  for (const bucket of orderedBuckets) {
    if (bucket.length < 2) continue;

    const key = bucket.map((node) => node.id).join("|");
    const anchor = {
      x: bucket.reduce((sum, node) => sum + node.x, 0) / bucket.length,
      y: bucket.reduce((sum, node) => sum + node.y, 0) / bucket.length,
    };
    const memberIds = bucket.map((node) => node.id);
    const needsChooser = bucket.length > RADAR_SPIDER_MAX_GROUP;

    // §4 — a group too large for a safe fan-out goes to the bottom sheet. Its
    // members keep their semantic positions and are NOT spidered.
    if (needsChooser) {
      chooserGroups.push({
        key,
        anchor,
        memberIds,
        legs: [],
        connectors: [],
        expanded: false,
        needsChooser: true,
      });
      continue;
    }

    const memberIdsSet = new Set(memberIds);
    const obstacles: RadarSpiderNode[] = [
      ...nodes.filter((node) => !memberIdsSet.has(node.id)),
      ...placedLegs,
    ];

    const startAngle =
      ((stableHash(memberIds.join("|")) % 360) * Math.PI) / 180;
    const step = (Math.PI * 2) / bucket.length;

    // §8 — the base ring separates the group's OWN members: legs on a ring of
    // radius R are 2R·sin(π/n) apart, so R >= (2·rMax + gap) / (2·sin(π/n)).
    const maxRadius = Math.max(...bucket.map((node) => node.radius));
    const required =
      (2 * maxRadius + legGap) / (2 * Math.sin(Math.PI / bucket.length));
    const baseRadius = Math.max(minFanRadius, Math.ceil(required * 10) / 10);

    const radii = bucket.map(() => baseRadius);
    const angles = bucket.map((_, index) => startAngle + step * index);

    // §1 — expand each leg along its own angle until it clears the other legs
    // AND every non-member node. This is what removes the residual overlaps a
    // members-only ring leaves behind.
    let expanded = false;
    for (let pass = 0; pass < 3; pass += 1) {
      let moved = false;
      for (let i = 0; i < bucket.length; i += 1) {
        for (let guard = 0; guard < 90; guard += 1) {
          const self = bucket[i];
          const pos = toXY(anchor, radii[i], angles[i]);

          let blocked = false;
          for (let j = 0; j < bucket.length && !blocked; j += 1) {
            if (j === i) continue;
            const other = bucket[j];
            const otherPos = toXY(anchor, radii[j], angles[j]);
            if (
              collides(
                pos.x,
                pos.y,
                self.radius,
                otherPos.x,
                otherPos.y,
                other.radius,
                legGap,
              )
            ) {
              blocked = true;
            }
          }
          for (let k = 0; k < obstacles.length && !blocked; k += 1) {
            const obstacle = obstacles[k];
            if (
              collides(
                pos.x,
                pos.y,
                self.radius,
                obstacle.x,
                obstacle.y,
                obstacle.radius,
                legGap,
              )
            ) {
              blocked = true;
            }
          }

          if (!blocked) break;
          if (radii[i] - baseRadius >= RADAR_SPIDER_MAX_EXPAND) break;
          radii[i] += RADAR_SPIDER_EXPAND_STEP;
          expanded = true;
          moved = true;
        }
      }
      if (!moved) break;
    }

    const legs: RadarSpiderLeg[] = [];
    const connectors: RadarSpiderConnector[] = [];
    bucket.forEach((node, index) => {
      const pos = toXY(anchor, radii[index], angles[index]);
      legs.push({
        id: node.id,
        semanticX: node.x,
        semanticY: node.y,
        displayX: pos.x,
        displayY: pos.y,
        distanceFromAnchor: radii[index],
      });
      connectors.push({ from: { ...anchor }, to: { ...pos } });
      spideredIds.add(node.id);
      placedLegs.push({
        id: node.id,
        x: pos.x,
        y: pos.y,
        radius: node.radius,
      });
    });

    groups.push({
      key,
      anchor,
      memberIds,
      legs,
      connectors,
      expanded,
      needsChooser: false,
    });
  }

  return {
    groups,
    chooserGroups,
    spideredIds,
    algorithm: RADAR_SPIDER_ALGORITHM,
  };
}

/** A group too large for a safe fan-out should fall back to the chooser (§4). */
export function radarSpiderNeedsChooser(group: RadarSpiderGroup): boolean {
  return group.memberIds.length > RADAR_SPIDER_MAX_GROUP;
}

/**
 * Whether a fanned group still contains any residual visual overlap. Used by
 * the acceptance tests (closure §8) rather than a coarse DOM proxy.
 */
export function radarSpiderResidualOverlaps(
  group: RadarSpiderGroup,
  others: readonly RadarSpiderNode[],
  gap = RADAR_SPIDER_LEG_GAP,
): number {
  const byId = new Map(group.legs.map((leg) => [leg.id, leg]));
  let count = 0;
  const legs = group.legs;
  for (let i = 0; i < legs.length; i += 1) {
    for (let j = i + 1; j < legs.length; j += 1) {
      const a = byId.get(legs[i].id);
      const b = byId.get(legs[j].id);
      if (!a || !b) continue;
      const ra = others.find((node) => node.id === legs[i].id)?.radius ?? 1;
      const rb = others.find((node) => node.id === legs[j].id)?.radius ?? 1;
      if (
        collides(a.displayX, a.displayY, ra, b.displayX, b.displayY, rb, gap)
      ) {
        count += 1;
      }
    }
  }
  return count;
}
