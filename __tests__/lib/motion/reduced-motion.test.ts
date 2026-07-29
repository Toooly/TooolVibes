import { describe, expect, it } from "vitest";

import {
  getPrefersReducedMotion,
  mapDurationForMotion,
  mapRevealForMotion,
  mapStaggerForMotion,
  shouldDisableOptionalMotion,
  shouldEnableComplexScrollMotion,
  shouldEnableRevealObserver,
  shouldShowRouteTransitionPresentation,
} from "@/lib/motion/reduced-motion";

describe("reduced-motion helpers", () => {
  it("treats reduced preference as disable-optional", () => {
    expect(shouldDisableOptionalMotion(true)).toBe(true);
    expect(shouldDisableOptionalMotion(false)).toBe(false);
  });

  it("maps durations and stagger under reduced motion", () => {
    expect(mapDurationForMotion(0.28, false)).toBe(0.28);
    expect(mapDurationForMotion(0.28, true)).toBe(0);
    expect(mapDurationForMotion(280, true, { reducedValue: 0 })).toBe(0);
    expect(mapStaggerForMotion(0.04, false)).toBe(0.04);
    expect(mapStaggerForMotion(0.04, true)).toBe(0);
  });

  it("collapses transform reveals under reduced motion", () => {
    expect(mapRevealForMotion({ opacity: 0, y: 12, scale: 0.96 }, false)).toEqual({
      opacity: 0,
      y: 12,
      scale: 0.96,
    });
    expect(mapRevealForMotion({ opacity: 0, y: 12, scale: 0.96 }, true)).toEqual({
      opacity: 0,
    });
  });

  it("gates complex scroll, route presentation and reveal observer", () => {
    expect(shouldEnableComplexScrollMotion(true)).toBe(false);
    expect(shouldEnableComplexScrollMotion(false)).toBe(true);
    expect(shouldShowRouteTransitionPresentation(true)).toBe(false);
    expect(shouldEnableRevealObserver(true)).toBe(false);
  });

  it("is SSR-safe for getPrefersReducedMotion without window APIs throwing", () => {
    expect(() => getPrefersReducedMotion()).not.toThrow();
    expect(typeof getPrefersReducedMotion()).toBe("boolean");
  });
});
