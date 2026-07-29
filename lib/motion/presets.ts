import type { Transition, Variants } from "motion/react";

import {
  MOTION_DURATION_S,
  MOTION_EASING,
} from "@/lib/motion/tokens";
import {
  mapDurationForMotion,
  mapRevealForMotion,
  mapStaggerForMotion,
} from "@/lib/motion/reduced-motion";

/** Allowed animated properties for foundation presets. */
export const MOTION_ALLOWED_PROPERTIES = [
  "opacity",
  "transform",
  "x",
  "y",
  "scale",
  "filter",
] as const;

export const MOTION_FORBIDDEN_LAYOUT_PROPERTIES = [
  "height",
  "width",
  "top",
  "left",
  "right",
  "bottom",
  "margin",
  "padding",
] as const;

export type MotionPresetOptions = {
  preferReducedMotion?: boolean;
};

function transition(
  durationS: number,
  ease: readonly [number, number, number, number],
  preferReducedMotion: boolean,
): Transition {
  return {
    duration: mapDurationForMotion(durationS, preferReducedMotion),
    ease: [...ease] as [number, number, number, number],
  };
}

/** Fade only — no translation. */
export function fadeInPreset(options: MotionPresetOptions = {}): Variants {
  const rm = options.preferReducedMotion === true;
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: transition(MOTION_DURATION_S.standard, MOTION_EASING.standard, rm),
    },
  };
}

/** Editorial reveal: opacity + small Y (transform only). */
export function revealPreset(options: MotionPresetOptions = {}): Variants {
  const rm = options.preferReducedMotion === true;
  const hidden = mapRevealForMotion({ opacity: 0, y: 12 }, rm);
  return {
    hidden,
    visible: {
      opacity: 1,
      y: 0,
      transition: transition(MOTION_DURATION_S.deliberate, MOTION_EASING.decelerate, rm),
    },
  };
}

/** Press feedback scale — microinteraction. */
export function pressPreset(options: MotionPresetOptions = {}): {
  whileTap: { scale: number };
  transition: Transition;
} {
  const rm = options.preferReducedMotion === true;
  return {
    whileTap: { scale: rm ? 1 : 0.98 },
    transition: transition(MOTION_DURATION_S.fast, MOTION_EASING.standard, rm),
  };
}

/** Selected / active state settle. */
export function selectPreset(options: MotionPresetOptions = {}): Variants {
  const rm = options.preferReducedMotion === true;
  return {
    idle: { scale: 1, opacity: 1 },
    selected: {
      scale: rm ? 1 : 1.02,
      opacity: 1,
      transition: transition(MOTION_DURATION_S.fast, MOTION_EASING.springSnappy, rm),
    },
  };
}

/** Route crossfade — matches existing PageTransition perceptual timing. */
export function routeTransitionPreset(options: MotionPresetOptions = {}): {
  initial: false | { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: Transition;
} {
  const rm = options.preferReducedMotion === true;
  return {
    initial: false,
    animate: { opacity: 1, y: 0 },
    transition: transition(MOTION_DURATION_S.route, MOTION_EASING.springSmooth, rm),
  };
}

/** List item enter/exit (opacity + Y only). */
export function listItemPreset(options: MotionPresetOptions = {}): Variants {
  const rm = options.preferReducedMotion === true;
  const hidden = mapRevealForMotion({ opacity: 0, y: 8 }, rm);
  return {
    hidden,
    visible: {
      opacity: 1,
      y: 0,
      transition: transition(MOTION_DURATION_S.standard, MOTION_EASING.standard, rm),
    },
    exit: {
      opacity: 0,
      y: rm ? 0 : -4,
      transition: transition(MOTION_DURATION_S.fast, MOTION_EASING.accelerate, rm),
    },
  };
}

/** Drawer / sheet presence (opacity + Y). */
export function drawerPreset(options: MotionPresetOptions = {}): Variants {
  const rm = options.preferReducedMotion === true;
  const hidden = mapRevealForMotion({ opacity: 0, y: 16 }, rm);
  return {
    hidden,
    visible: {
      opacity: 1,
      y: 0,
      transition: transition(MOTION_DURATION_S.deliberate, MOTION_EASING.decelerate, rm),
    },
    exit: {
      opacity: 0,
      y: rm ? 0 : 12,
      transition: transition(MOTION_DURATION_S.base, MOTION_EASING.accelerate, rm),
    },
  };
}

/**
 * Future reward settle — not wired to grants in Phase 1.
 * Transform/opacity only; no confetti.
 */
export function rewardSettlePreset(options: MotionPresetOptions = {}): Variants {
  const rm = options.preferReducedMotion === true;
  const hidden = mapRevealForMotion({ opacity: 0, scale: 0.96 }, rm);
  return {
    hidden,
    visible: {
      opacity: 1,
      scale: 1,
      transition: transition(
        MOTION_DURATION_S.reward,
        rm ? MOTION_EASING.standard : MOTION_EASING.springReward,
        rm,
      ),
    },
  };
}

/** Stagger children delay in seconds. */
export function staggerChildrenDelay(
  preferReducedMotion = false,
): number {
  return mapStaggerForMotion(MOTION_DURATION_S.staggerStep, preferReducedMotion);
}
