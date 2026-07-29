import { describe, expect, it } from "vitest";

import {
  MOTION_FORBIDDEN_LAYOUT_PROPERTIES,
  drawerPreset,
  fadeInPreset,
  listItemPreset,
  pressPreset,
  revealPreset,
  rewardSettlePreset,
  routeTransitionPreset,
  selectPreset,
  staggerChildrenDelay,
} from "@/lib/motion/presets";
import { MOTION_DURATION_S } from "@/lib/motion/tokens";

function collectKeys(value: unknown, keys = new Set<string>()): Set<string> {
  if (!value || typeof value !== "object") return keys;
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    keys.add(k);
    collectKeys(v, keys);
  }
  return keys;
}

describe("motion presets", () => {
  it("does not animate layout box properties", () => {
    const payloads = [
      fadeInPreset(),
      revealPreset(),
      selectPreset(),
      listItemPreset(),
      drawerPreset(),
      rewardSettlePreset(),
      routeTransitionPreset(),
      pressPreset(),
    ];
    const keys = payloads.reduce((set, payload) => collectKeys(payload, set), new Set<string>());
    for (const forbidden of MOTION_FORBIDDEN_LAYOUT_PROPERTIES) {
      expect(keys.has(forbidden)).toBe(false);
    }
  });

  it("preserves route duration when motion is allowed", () => {
    const full = routeTransitionPreset({ preferReducedMotion: false });
    expect(full.transition.duration).toBe(MOTION_DURATION_S.route);
    expect(full.initial).toBe(false);
  });

  it("zeros route duration under reduced motion", () => {
    const reduced = routeTransitionPreset({ preferReducedMotion: true });
    expect(reduced.transition.duration).toBe(0);
  });

  it("disables stagger under reduced motion", () => {
    expect(staggerChildrenDelay(false)).toBe(MOTION_DURATION_S.staggerStep);
    expect(staggerChildrenDelay(true)).toBe(0);
  });

  it("keeps press scale neutral under reduced motion", () => {
    expect(pressPreset({ preferReducedMotion: true }).whileTap.scale).toBe(1);
    expect(pressPreset({ preferReducedMotion: false }).whileTap.scale).toBe(0.98);
  });
});
