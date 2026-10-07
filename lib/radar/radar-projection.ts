/**
 * Canonical Radar projection (spec §1-§2).
 *
 * ONE source of truth for the Radar's coordinate spaces. Nothing outside this
 * module may re-derive transform maths.
 *
 *   WORLD    semanticX / semanticY  — the frozen semantic truth (age radius,
 *            RadarTopicCluster sector). Never mutated.
 *   DISPLAY  the position a marker is PAINTED at inside the instrument group,
 *            after the Sector Lens and any spiderfy/relaxation offset.
 *   VIEWBOX  the 0..100 SVG viewBox AFTER the camera transform.
 *   SCREEN   actual rendered CSS pixels on the device.
 *
 * The pointer resolver MUST resolve against DISPLAY (what the user sees), never
 * against WORLD. `screenToDisplay` is the only sanctioned entry point for a
 * pointer.
 */

export type RadarPoint2 = { x: number; y: number };

export type RadarRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** The camera is a pure zoom about a global-space centre. */
export type RadarCameraSpace = {
  zoom: number;
  center: RadarPoint2;
} | null | undefined;

/** A semantic world position plus the polar fields the lens works from. */
export type RadarWorldPolar = {
  /** Semantic angle in degrees, 0 = up (12 o'clock), clockwise. */
  semanticAngleDeg: number;
  /** 0 = centre (newest) .. 1 = outer edge (oldest). Unchanged by any lens. */
  radiusRatio: number;
};

/** The Sector Lens transform: pure angular magnification about a sector centre. */
export type RadarLensTransform = {
  /** Centre of the cluster's permanent semantic sector, degrees. */
  sectorCentreDeg: number;
  /** Where that centre is drawn, degrees. Equal to `sectorCentreDeg` unless a
   *  future lens rotates; kept explicit so the formula stays readable. */
  lensCentreDeg: number;
  /** displayAngle = lensCentre + (semanticAngle - sectorCentre) * magnification */
  magnification: number;
  /** Instrument radius in viewBox units (the world radius scale). */
  outerRadius: number;
  /** Instrument centre in viewBox units. */
  center: RadarPoint2;
};

export const RADAR_VIEW_SIZE = 100;
export const RADAR_VIEW_CENTER = 50;

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function normalizeAngle(degrees: number): number {
  const wrapped = degrees % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/** Signed shortest angular delta a -> b, in (-180, 180]. */
function shortestAngleDelta(from: number, to: number): number {
  let delta = normalizeAngle(to) - normalizeAngle(from);
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta;
}

/* ------------------------------------------------------------------ WORLD */

/** Semantic angle of a DISPLAY angle — the inverse lens (spec §6). */
export function radarDisplayAngleToSemantic(
  displayAngleDeg: number,
  lens: RadarLensTransform,
): number {
  const magnification = lens.magnification || 1;
  // The delta MUST be the signed shortest one: the forward transform happily
  // produces a wrapped angle (e.g. -19.5 -> 340.5) and a naive subtraction
  // turns a 4x magnification into a 90 degree error.
  const delta = shortestAngleDelta(lens.lensCentreDeg, displayAngleDeg);
  return normalizeAngle(lens.sectorCentreDeg + delta / magnification);
}

/**
 * WORLD -> DISPLAY (spec §6).
 *
 * Radius is untouched (age semantics, spec §5); only the ANGLE is magnified.
 * The stored semantic angle is never mutated — this is a pure projection.
 */
export function radarWorldToDisplay(
  world: RadarWorldPolar,
  lens: RadarLensTransform,
): RadarPoint2 & { displayAngleDeg: number } {
  const displayAngleDeg = normalizeAngle(
    lens.lensCentreDeg +
      (world.semanticAngleDeg - lens.sectorCentreDeg) * lens.magnification,
  );
  const angle = degToRad(displayAngleDeg - 90);
  const distance = lens.outerRadius * world.radiusRatio;
  return {
    x: lens.center.x + distance * Math.cos(angle),
    y: lens.center.y + distance * Math.sin(angle),
    displayAngleDeg,
  };
}

/** DISPLAY -> WORLD polar (spec §1 `screenToWorld` support). */
export function radarDisplayToWorldPolar(
  display: RadarPoint2,
  lens: RadarLensTransform,
): RadarWorldPolar {
  const dx = display.x - lens.center.x;
  const dy = display.y - lens.center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const displayAngleDeg = normalizeAngle((Math.atan2(dy, dx) * 180) / Math.PI + 90);
  const outerRadius = lens.outerRadius || 1;
  return {
    semanticAngleDeg: radarDisplayAngleToSemantic(displayAngleDeg, lens),
    radiusRatio: Math.min(1, Math.max(0, distance / outerRadius)),
  };
}

/* ----------------------------------------------------------------- CAMERA */

/** DISPLAY -> VIEWBOX: apply the camera zoom about its global-space centre. */
export function radarDisplayToViewBox(
  display: RadarPoint2,
  camera: RadarCameraSpace,
): RadarPoint2 {
  const zoom = radarCameraScale(camera);
  const center = camera?.center ?? { x: RADAR_VIEW_CENTER, y: RADAR_VIEW_CENTER };
  return {
    x: zoom * (display.x - center.x) + RADAR_VIEW_CENTER,
    y: zoom * (display.y - center.y) + RADAR_VIEW_CENTER,
  };
}

/** VIEWBOX -> DISPLAY: the exact inverse of `radarDisplayToViewBox`. */
export function radarViewBoxToDisplay(
  view: RadarPoint2,
  camera: RadarCameraSpace,
): RadarPoint2 {
  const zoom = radarCameraScale(camera);
  const center = camera?.center ?? { x: RADAR_VIEW_CENTER, y: RADAR_VIEW_CENTER };
  return {
    x: (view.x - RADAR_VIEW_CENTER) / zoom + center.x,
    y: (view.y - RADAR_VIEW_CENTER) / zoom + center.y,
  };
}

function radarCameraScale(camera: RadarCameraSpace): number {
  const zoom = camera?.zoom;
  return typeof zoom === "number" && Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
}

/* ----------------------------------------------------------------- SCREEN */

/** VIEWBOX (0..100) -> SCREEN css pixels. */
export function radarViewBoxToScreen(
  view: RadarPoint2,
  rect: RadarRect,
): RadarPoint2 {
  const width = rect.width || 1;
  const height = rect.height || 1;
  return {
    x: rect.left + (view.x / RADAR_VIEW_SIZE) * width,
    y: rect.top + (view.y / RADAR_VIEW_SIZE) * height,
  };
}

/** SCREEN css pixels -> VIEWBOX (0..100). */
export function radarScreenToViewBox(
  screen: RadarPoint2,
  rect: RadarRect,
): RadarPoint2 {
  const width = rect.width || 1;
  const height = rect.height || 1;
  return {
    x: ((screen.x - rect.left) / width) * RADAR_VIEW_SIZE,
    y: ((screen.y - rect.top) / height) * RADAR_VIEW_SIZE,
  };
}

/* -------------------------------------------------------------- COMPOSED */

/** DISPLAY -> SCREEN (spec §1). */
export function radarDisplayToScreen(
  display: RadarPoint2,
  camera: RadarCameraSpace,
  rect: RadarRect,
): RadarPoint2 {
  return radarViewBoxToScreen(radarDisplayToViewBox(display, camera), rect);
}

/**
 * SCREEN -> DISPLAY (spec §1). THE sanctioned pointer entry point: compare the
 * result against the markers' DISPLAY positions, never their semantic ones.
 */
export function radarScreenToDisplay(
  screen: RadarPoint2,
  camera: RadarCameraSpace,
  rect: RadarRect,
): RadarPoint2 {
  return radarViewBoxToDisplay(radarScreenToViewBox(screen, rect), camera);
}

/** SCREEN -> WORLD (spec §1). */
export function radarScreenToWorldPolar(
  screen: RadarPoint2,
  camera: RadarCameraSpace,
  rect: RadarRect,
  lens: RadarLensTransform,
): RadarWorldPolar {
  return radarDisplayToWorldPolar(radarScreenToDisplay(screen, camera, rect), lens);
}

/**
 * Screen-space edge-to-edge gap between two circular markers, in CSS pixels.
 * Used by the Sector Lens width search (spec §7) and the zero-overlap contract
 * (spec §8).
 */
export function radarScreenEdgeGapPx(
  a: RadarPoint2 & { radius: number },
  b: RadarPoint2 & { radius: number },
  rect: RadarRect,
): number {
  const width = rect.width || 1;
  const height = rect.height || 1;
  // viewBox units -> css px. The instrument is square so either axis is fine,
  // but we use the true distance in screen space to stay exact on odd rects.
  const sa = radarViewBoxToScreen(a, rect);
  const sb = radarViewBoxToScreen(b, rect);
  const distance = Math.sqrt((sa.x - sb.x) ** 2 + (sa.y - sb.y) ** 2);
  const radiusA = a.radius * (width / RADAR_VIEW_SIZE);
  const radiusB = b.radius * (height / RADAR_VIEW_SIZE);
  return distance - radiusA - radiusB;
}
