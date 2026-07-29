import type { Transition } from "motion/react";

import { MOTION_DURATION_S, MOTION_EASING } from "@/lib/motion/tokens";
import { mapDurationForMotion } from "@/lib/motion/reduced-motion";

export type MotionTransitionOptions = {
  preferReducedMotion?: boolean;
};

/** Layout marker / active tab spring — collapses under reduced motion. */
export function layoutMarkerTransition(
  options: MotionTransitionOptions = {},
): Transition {
  if (options.preferReducedMotion) {
    return { duration: 0 };
  }
  return {
    type: "spring",
    stiffness: 380,
    damping: 32,
    mass: 0.85,
  };
}

/** Badge / micro pop. */
export function microPopTransition(
  options: MotionTransitionOptions = {},
): Transition {
  if (options.preferReducedMotion) {
    return { duration: 0 };
  }
  return {
    type: "spring",
    stiffness: 420,
    damping: 26,
    mass: 0.7,
  };
}

/** Level A timed transition (seconds). */
export function levelATransition(
  options: MotionTransitionOptions = {},
): Transition {
  const rm = options.preferReducedMotion === true;
  return {
    duration: mapDurationForMotion(MOTION_DURATION_S.fast, rm),
    ease: [...MOTION_EASING.standard] as [number, number, number, number],
  };
}

/** Level B timed transition. */
export function levelBTransition(
  options: MotionTransitionOptions = {},
): Transition {
  const rm = options.preferReducedMotion === true;
  return {
    duration: mapDurationForMotion(MOTION_DURATION_S.standard, rm),
    ease: [...MOTION_EASING.decelerate] as [number, number, number, number],
  };
}

/** Level C signature settle. */
export function levelCTransition(
  options: MotionTransitionOptions = {},
): Transition {
  const rm = options.preferReducedMotion === true;
  return {
    duration: mapDurationForMotion(MOTION_DURATION_S.deliberate, rm),
    ease: [...MOTION_EASING.decelerate] as [number, number, number, number],
  };
}
