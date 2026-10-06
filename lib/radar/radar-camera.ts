/**
 * Radar semantic camera — Level 1 sector zoom (spec §4-§8).
 *
 * Zoom is a CAMERA transformation only. Semantic Tool coordinates are never
 * recomputed: the global coordinate system stays the single source of truth,
 * so spatial memory remains true (§5).
 *
 * ALGORITHM (§6 — documented, deterministic, no hardcoded single factor):
 *   1. Frame the focus set: centre = bounding-box centre of the visible focus
 *      nodes (including their visual radii) plus a small margin.
 *   2. Walk a progressive zoom ladder 1.0 -> [1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6].
 *   3. A zoom is VALID when (a) every focus node fits inside the viewport
 *      window and (b) every pair of focus nodes has an edge-to-edge gap of at
 *      least `targetGapPx` CSS pixels on the physical screen.
 *   4. Choose the SMALLEST valid zoom.
 *   5. If no zoom is valid (the cluster is too spread out to frame, or some
 *      pair overlaps in global space so no zoom can ever separate it), choose
 *      the largest still-framing zoom and report the remaining pairs as
 *      RESIDUAL COLLISION GROUPS — which the caller resolves with SPIDERFY
 *      (§9), never with the ambiguity chooser.
 *
 * GAP MATHS: at zoom z a global distance d renders as `d * z * mapPx / 100`
 * screen pixels (the viewBox is 100 units wide and the map is `mapPx` CSS px).
 * Visual radii scale identically, so the edge-to-edge gap is
 * `(d - r1 - r2) * z * mapPx / 100`. If `d - r1 <= r2` the shapes overlap in
 * global space and NO zoom can separate them.
 */

export const RADAR_ZOOM_LADDER: readonly number[] = [1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6];
export const RADAR_ZOOM_BASE = 1.0;
export const RADAR_ZOOM_MAX = 2.6;
/** Target edge-to-edge gap between visual markers, in CSS px (§6: 8-10). */
export const RADAR_ZOOM_TARGET_GAP_PX = 9;
/** Default measured map size at the 390px primary viewport. */
export const RADAR_ZOOM_DEFAULT_MAP_PX = 358;
/** Breathing room around the focus bounding box, in viewBox units. */
export const RADAR_ZOOM_FRAME_MARGIN = 5;

export const RADAR_ZOOM_ALGORITHM = [
  "Radar semantic camera zoom (Level 1 sector focus).",
  "Never recomputes semantic coordinates — a pure viewport transform.",
  "1. Centre = bounding-box centre of the visible focus nodes (+ margin).",
  "2. Walk the progressive ladder 1.0, 1.4, 1.6, 1.8, 2.0, 2.2, 2.4, 2.6.",
  "3. A zoom is valid when every focus node fits the window AND every pair",
  "   keeps >= RADAR_ZOOM_TARGET_GAP_PX (9) CSS px of edge-to-edge gap.",
  "4. Pick the smallest valid zoom.",
  "5. Otherwise pick the largest framing zoom and report residual collision",
  "   groups, which the caller spiderfies instead of opening the chooser.",
  "Gap at zoom z = (d - r1 - r2) * z * mapPx / 100 CSS px.",
].join("\n");

export type RadarCameraNode = {
  id: string;
  /** Global viewBox X (0..100). */
  x: number;
  /** Global viewBox Y (0..100). */
  y: number;
  /** Visual radius in global viewBox units. */
  radius: number;
};

export type RadarCameraFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Forward/inverse of the camera transform.
 *
 * The camera paints a GLOBAL point `p` at the viewBox coordinate
 * `zoom * (p - center) + RADAR_CENTER`. Hit-testing must therefore invert that
 * mapping: a pointer at viewBox coordinate `v` corresponds to the global point
 * `(v - RADAR_CENTER) / zoom + center`.
 *
 * Without this inversion a tap lands nowhere near the signal the user sees as
 * soon as `zoom !== 1` — the dots become unclickable exactly when the camera
 * zooms in. These two helpers are the single place that mapping lives.
 */
export function radarCameraToView(
  globalX: number,
  globalY: number,
  camera: RadarCameraPlan | null | undefined,
): { x: number; y: number } {
  const zoom = camera && Number.isFinite(camera.zoom) && camera.zoom > 0 ? camera.zoom : 1;
  const centerX = camera?.center?.x ?? 50;
  const centerY = camera?.center?.y ?? 50;
  return {
    x: zoom * (globalX - centerX) + 50,
    y: zoom * (globalY - centerY) + 50,
  };
}

export function radarCameraToGlobal(
  viewX: number,
  viewY: number,
  camera: RadarCameraPlan | null | undefined,
): { x: number; y: number } {
  const zoom = camera && Number.isFinite(camera.zoom) && camera.zoom > 0 ? camera.zoom : 1;
  const centerX = camera?.center?.x ?? 50;
  const centerY = camera?.center?.y ?? 50;
  return {
    x: (viewX - 50) / zoom + centerX,
    y: (viewY - 50) / zoom + centerY,
  };
}

/** Current camera zoom, safe for `null`/malformed plans. */
export function radarCameraZoom(camera: RadarCameraPlan | null | undefined): number {
  return camera && Number.isFinite(camera.zoom) && camera.zoom > 0 ? camera.zoom : 1;
}

export type RadarCameraPlan = {
  zoom: number;
  /** The equivalent viewBox window over the GLOBAL coordinate space. */
  frame: RadarCameraFrame;
  /** SVG `transform` for the instrument viewport group. */
  transform: string;
  center: { x: number; y: number };
  targetGapPx: number;
  /** Achieved minimum edge-to-edge gap at the chosen zoom, in CSS px. */
  minimumEdgeGapPx: number;
  /** Pairs that remain too close even at the chosen zoom (spiderfy input). */
  residualCollisionIds: readonly (readonly string[])[];
  spiderfyRequired: boolean;
  algorithm: string;
};

export type RadarCameraOptions = {
  mapPx?: number;
  targetGapPx?: number;
  zoomLadder?: readonly number[];
  margin?: number;
};

function distance(a: RadarCameraNode, b: RadarCameraNode): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Edge-to-edge gap in global viewBox units. Negative = shapes overlap. */
function globalGap(a: RadarCameraNode, b: RadarCameraNode): number {
  return distance(a, b) - a.radius - b.radius;
}

function computeCenter(
  nodes: readonly RadarCameraNode[],
  margin: number,
): { x: number; y: number; span: number } {
  if (nodes.length === 0) return { x: 50, y: 50, span: 100 };
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (const node of nodes) {
    minX = Math.min(minX, node.x - node.radius - margin);
    minY = Math.min(minY, node.y - node.radius - margin);
    maxX = Math.max(maxX, node.x + node.radius + margin);
    maxY = Math.max(maxY, node.y + node.radius + margin);
  }
  return {
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    span: Math.max(maxX - minX, maxY - minY),
  };
}

function framesInView(
  nodes: readonly RadarCameraNode[],
  zoom: number,
  center: { x: number; y: number },
): boolean {
  const half = 50 / zoom;
  return nodes.every(
    (node) =>
      Math.abs(node.x - center.x) + node.radius <= half + 1e-9 &&
      Math.abs(node.y - center.y) + node.radius <= half + 1e-9,
  );
}

function minimumEdgeGapPx(
  nodes: readonly RadarCameraNode[],
  zoom: number,
  mapPx: number,
): number {
  let minimum = Number.POSITIVE_INFINITY;
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const gapUnits = globalGap(nodes[i], nodes[j]);
      const gapPx = gapUnits * zoom * (mapPx / 100);
      if (gapPx < minimum) minimum = gapPx;
    }
  }
  return Number.isFinite(minimum) ? minimum : Number.POSITIVE_INFINITY;
}

function residualGroups(
  nodes: readonly RadarCameraNode[],
  zoom: number,
  mapPx: number,
  targetGapPx: number,
): (readonly string[])[] {
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
      const gapUnits = globalGap(nodes[i], nodes[j]);
      const gapPx = gapUnits * zoom * (mapPx / 100);
      if (gapPx < targetGapPx) union(nodes[i].id, nodes[j].id);
    }
  }

  const buckets = new Map<string, string[]>();
  for (const node of nodes) {
    const root = find(node.id);
    const bucket = buckets.get(root);
    if (bucket) {
      bucket.push(node.id);
    } else {
      buckets.set(root, [node.id]);
    }
  }
  return [...buckets.values()]
    .filter((bucket) => bucket.length >= 2)
    .map((bucket) => [...bucket].sort())
    .sort((a, b) => a[0].localeCompare(b[0]));
}

/**
 * Deterministic Level-1 camera for a focus set. Same input → same plan.
 * With no nodes the plan is a neutral full view.
 */
export function computeRadarCamera(
  nodes: readonly RadarCameraNode[],
  options: RadarCameraOptions = {},
): RadarCameraPlan {
  const mapPx = options.mapPx ?? RADAR_ZOOM_DEFAULT_MAP_PX;
  const targetGapPx = options.targetGapPx ?? RADAR_ZOOM_TARGET_GAP_PX;
  const ladder = options.zoomLadder ?? RADAR_ZOOM_LADDER;
  const margin = options.margin ?? RADAR_ZOOM_FRAME_MARGIN;

  const center = computeCenter(nodes, margin);
  const candidates = [RADAR_ZOOM_BASE, ...ladder].filter(
    (zoom) => zoom >= RADAR_ZOOM_BASE && zoom <= RADAR_ZOOM_MAX,
  );

  const gapAt = (zoom: number) => minimumEdgeGapPx(nodes, zoom, mapPx);
  const gapsOk = (zoom: number) => {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const gapUnits = globalGap(nodes[i], nodes[j]);
        if (gapUnits * zoom * (mapPx / 100) < targetGapPx) return false;
      }
    }
    return true;
  };

  // §6 — smallest valid zoom.
  let chosen: number | null = null;
  for (const zoom of candidates) {
    if (framesInView(nodes, zoom, center) && gapsOk(zoom)) {
      chosen = zoom;
      break;
    }
  }

  // §8/§9 — otherwise the largest still-framing zoom; leftovers go to spiderfy.
  if (chosen === null) {
    for (let index = candidates.length - 1; index >= 0; index -= 1) {
      const zoom = candidates[index];
      if (framesInView(nodes, zoom, center)) {
        chosen = zoom;
        break;
      }
    }
  }
  const zoom = chosen ?? RADAR_ZOOM_BASE;

  const half = 50 / zoom;
  const frame: RadarCameraFrame = {
    x: center.x - half,
    y: center.y - half,
    width: half * 2,
    height: half * 2,
  };
  // translate(50 - z*cx, 50 - z*cy) scale(z) maps (cx,cy) -> (50,50).
  const transform = [
    `translate(${(50 - zoom * center.x).toFixed(4)} ${(50 - zoom * center.y).toFixed(4)})`,
    `scale(${zoom.toFixed(4)})`,
  ].join(" ");

  const residuals = residualGroups(nodes, zoom, mapPx, targetGapPx);

  return {
    zoom,
    frame,
    transform,
    center: { x: center.x, y: center.y },
    targetGapPx,
    minimumEdgeGapPx: gapAt(zoom),
    residualCollisionIds: residuals,
    spiderfyRequired: residuals.length > 0,
    algorithm: RADAR_ZOOM_ALGORITHM,
  };
}
