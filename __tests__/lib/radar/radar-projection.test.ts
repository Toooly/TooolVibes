/**
 * Canonical Radar projection tests (spec §1-§3).
 *
 * The pointer resolver must resolve against the ACTUAL rendered positions of
 * visible nodes. These tests pin the projection maths so no component can
 * re-derive it and drift.
 */

import { describe, expect, it } from "vitest";

import {
  radarDisplayAngleToSemantic,
  radarDisplayToScreen,
  radarDisplayToViewBox,
  radarDisplayToWorldPolar,
  radarScreenEdgeGapPx,
  radarScreenToDisplay,
  radarScreenToViewBox,
  radarScreenToWorldPolar,
  radarViewBoxToDisplay,
  radarViewBoxToScreen,
  radarWorldToDisplay,
  type RadarLensTransform,
  type RadarRect,
} from "@/lib/radar/radar-projection";

const RECT: RadarRect = { left: 0, top: 0, width: 358, height: 358 };

const LENS: RadarLensTransform = {
  sectorCentreDeg: 22.5,
  lensCentreDeg: 22.5,
  magnification: 4,
  outerRadius: 42,
  center: { x: 50, y: 50 },
};

const CAMERAS = [null, { zoom: 1, center: { x: 50, y: 50 } }, { zoom: 2.6, center: { x: 50, y: 40 } }];

describe("RADAR-PROJ coordinate spaces (§1)", () => {
  it("RADAR-PROJ-01 worldToDisplay magnifies the angle and never the radius", () => {
    const world = { semanticAngleDeg: 30, radiusRatio: 0.5 };
    const display = radarWorldToDisplay(world, LENS);
    // Angle is magnified about the sector centre: 22.5 + (30-22.5)*4 = 52.5
    expect(display.displayAngleDeg).toBeCloseTo(52.5, 6);
    // Radius is untouched: distance == outerRadius * radiusRatio
    const distance = Math.hypot(display.x - 50, display.y - 50);
    expect(distance).toBeCloseTo(42 * 0.5, 6);
  });

  it("RADAR-PROJ-02 the semantic angle round-trips through the lens", () => {
    for (const semanticAngleDeg of [0, 15, 22.5, 30, 44.9]) {
      const display = radarWorldToDisplay({ semanticAngleDeg, radiusRatio: 0.6 }, LENS);
      const back = radarDisplayAngleToSemantic(display.displayAngleDeg, LENS);
      expect(back).toBeCloseTo(semanticAngleDeg, 6);
    }
  });

  it("RADAR-PROJ-03 world <-> display round-trips including radius", () => {
    const world = { semanticAngleDeg: 12, radiusRatio: 0.75 };
    const display = radarWorldToDisplay(world, LENS);
    const back = radarDisplayToWorldPolar(display, LENS);
    expect(back.semanticAngleDeg).toBeCloseTo(world.semanticAngleDeg, 6);
    expect(back.radiusRatio).toBeCloseTo(world.radiusRatio, 6);
  });

  it("RADAR-PROJ-04 displayToViewBox and viewBoxToDisplay are exact inverses", () => {
    const display = { x: 63.2, y: 41.7 };
    for (const camera of CAMERAS) {
      const view = radarDisplayToViewBox(display, camera);
      const back = radarViewBoxToDisplay(view, camera);
      expect(back.x).toBeCloseTo(display.x, 10);
      expect(back.y).toBeCloseTo(display.y, 10);
    }
  });

  it("RADAR-PROJ-05 displayToScreen and screenToDisplay are exact inverses", () => {
    const display = { x: 70, y: 30 };
    for (const camera of CAMERAS) {
      const screen = radarDisplayToScreen(display, camera, RECT);
      const back = radarScreenToDisplay(screen, camera, RECT);
      expect(back.x).toBeCloseTo(display.x, 10);
      expect(back.y).toBeCloseTo(display.y, 10);
    }
  });

  it("RADAR-PROJ-06 screenToWorldPolar recovers the semantic truth", () => {
    const world = { semanticAngleDeg: 8, radiusRatio: 0.33 };
    const display = radarWorldToDisplay(world, LENS);
    for (const camera of CAMERAS) {
      const screen = radarDisplayToScreen(display, camera, RECT);
      const back = radarScreenToWorldPolar(screen, camera, RECT, LENS);
      expect(back.semanticAngleDeg).toBeCloseTo(world.semanticAngleDeg, 6);
      expect(back.radiusRatio).toBeCloseTo(world.radiusRatio, 6);
    }
  });

  it("RADAR-PROJ-07 viewBox <-> screen round-trips on a non-square rect", () => {
    const rect: RadarRect = { left: 12, top: 40, width: 300, height: 520 };
    const view = { x: 25, y: 80 };
    const screen = radarViewBoxToScreen(view, rect);
    const back = radarScreenToViewBox(screen, rect);
    expect(back.x).toBeCloseTo(view.x, 10);
    expect(back.y).toBeCloseTo(view.y, 10);
  });

  it("RADAR-PROJ-08 a malformed camera degrades to identity instead of NaN", () => {
    const display = { x: 33, y: 44 };
    const bad = { zoom: 0, center: { x: 0, y: 0 } } as never;
    const view = radarDisplayToViewBox(display, bad);
    expect(Number.isFinite(view.x)).toBe(true);
    expect(Number.isFinite(view.y)).toBe(true);
    const back = radarViewBoxToDisplay(view, bad);
    expect(back.x).toBeCloseTo(display.x, 10);
    expect(back.y).toBeCloseTo(display.y, 10);
  });

  it("RADAR-PROJ-09 a tap on a marker's SCREEN centre selects it at every zoom", () => {
    // Spec §3 — hit testing must use the DISPLAY position the user sees.
    const marker = { x: 58.4, y: 37.1 };
    for (const camera of CAMERAS) {
      const screen = radarDisplayToScreen(marker, camera, RECT);
      const hit = radarScreenToDisplay(screen, camera, RECT);
      const distance = Math.hypot(hit.x - marker.x, hit.y - marker.y);
      expect(distance).toBeLessThan(1e-9);
    }
  });

  it("RADAR-PROJ-10 edge gap is measured in real CSS pixels", () => {
    const a = { x: 50, y: 50, radius: 2 };
    const b = { x: 60, y: 50, radius: 2 };
    const gap = radarScreenEdgeGapPx(a, b, RECT);
    // 10 viewBox units at 358px / 100 units = 35.8px centre distance,
    // minus two 2-unit radii (7.16px each).
    expect(gap).toBeCloseTo(35.8 - 2 * 7.16, 2);
  });

  it("RADAR-PROJ-11 the projection is deterministic", () => {
    const world = { semanticAngleDeg: 19, radiusRatio: 0.42 };
    const a = radarWorldToDisplay(world, LENS);
    const b = radarWorldToDisplay({ ...world }, { ...LENS });
    expect(a).toEqual(b);
    expect(radarDisplayToScreen(a, CAMERAS[2], RECT)).toEqual(
      radarDisplayToScreen(b, CAMERAS[2], RECT),
    );
  });
});
