import { describe, expect, it } from "vitest";

import {
  layoutMarkerTransition,
  levelATransition,
  levelCTransition,
  microPopTransition,
} from "@/lib/motion/transitions";
import { MOTION_DURATION_S } from "@/lib/motion/tokens";

describe("motion transitions", () => {
  it("collapses springs under reduced motion", () => {
    expect(layoutMarkerTransition({ preferReducedMotion: true })).toEqual({ duration: 0 });
    expect(microPopTransition({ preferReducedMotion: true })).toEqual({ duration: 0 });
  });

  it("keeps level durations for full motion", () => {
    expect(levelATransition({ preferReducedMotion: false }).duration).toBe(
      MOTION_DURATION_S.fast,
    );
    expect(levelCTransition({ preferReducedMotion: false }).duration).toBe(
      MOTION_DURATION_S.deliberate,
    );
  });

  it("zeros level durations under reduced motion", () => {
    expect(levelATransition({ preferReducedMotion: true }).duration).toBe(0);
    expect(levelCTransition({ preferReducedMotion: true }).duration).toBe(0);
  });
});
