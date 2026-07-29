/**
 * Canonical Motion OS tokens (TypeScript mirror of styles/tokens.css).
 *
 * Source-of-truth strategy:
 * - CSS custom properties in styles/tokens.css are the runtime chrome source.
 * - This module mirrors the same numeric/cubic values for Motion/JS consumers.
 * - Contract tests (__tests__/lib/motion/tokens-contract.test.ts) fail if TS and CSS drift.
 */

export const MOTION_DURATION_MS = {
  instant: 80,
  fast: 120,
  base: 180,
  /** Semantic chrome transition (maps to --tv-motion-base / --tv-duration-slow). */
  standard: 240,
  route: 280,
  deliberate: 360,
  reward: 480,
  staggerStep: 40,
  epic: 720,
} as const;

export type MotionDurationKey = keyof typeof MOTION_DURATION_MS;

/** CSS custom property names for duration tokens. */
export const MOTION_DURATION_CSS_VAR = {
  instant: "--tv-duration-instant",
  fast: "--tv-duration-fast",
  base: "--tv-duration-base",
  standard: "--tv-duration-slow",
  route: "--tv-duration-route",
  deliberate: "--tv-duration-cinematic",
  reward: "--tv-duration-reward",
  staggerStep: "--tv-duration-stagger-step",
  epic: "--tv-duration-epic",
} as const;

/** Seconds for motion/react transition.duration */
export const MOTION_DURATION_S = {
  instant: MOTION_DURATION_MS.instant / 1000,
  fast: MOTION_DURATION_MS.fast / 1000,
  base: MOTION_DURATION_MS.base / 1000,
  standard: MOTION_DURATION_MS.standard / 1000,
  route: MOTION_DURATION_MS.route / 1000,
  deliberate: MOTION_DURATION_MS.deliberate / 1000,
  reward: MOTION_DURATION_MS.reward / 1000,
  staggerStep: MOTION_DURATION_MS.staggerStep / 1000,
  epic: MOTION_DURATION_MS.epic / 1000,
} as const;

/** Cubic-bezier tuples matching --tv-easing-* */
export const MOTION_EASING = {
  standard: [0.2, 0, 0, 1] as const,
  emphasis: [0.4, 0, 0.2, 1] as const,
  decelerate: [0, 0, 0.2, 1] as const,
  accelerate: [0.4, 0, 1, 1] as const,
  springGentle: [0.25, 0.46, 0.45, 0.94] as const,
  springSmooth: [0.45, 0, 0.15, 1] as const,
  springSnappy: [0.34, 1.56, 0.64, 1] as const,
  /** Reward-only overshoot — never for layout chrome. */
  springReward: [0.68, -0.55, 0.265, 1.55] as const,
} as const;

export type MotionEasingKey = keyof typeof MOTION_EASING;

export const MOTION_EASING_CSS_VAR = {
  standard: "--tv-easing-standard",
  emphasis: "--tv-easing-emphasis",
  decelerate: "--tv-easing-decelerate",
  accelerate: "--tv-easing-accelerate",
  springGentle: "--tv-easing-spring-gentle",
  springSmooth: "--tv-easing-spring-smooth",
  springSnappy: "--tv-easing-spring-snappy",
  springReward: "--tv-easing-spring-bouncy",
} as const;

/** CSS var() references for stylesheets / inline style. */
export const motionCss = {
  duration: {
    instant: `var(${MOTION_DURATION_CSS_VAR.instant})`,
    fast: `var(${MOTION_DURATION_CSS_VAR.fast})`,
    base: `var(${MOTION_DURATION_CSS_VAR.base})`,
    standard: `var(${MOTION_DURATION_CSS_VAR.standard})`,
    route: `var(${MOTION_DURATION_CSS_VAR.route})`,
    deliberate: `var(${MOTION_DURATION_CSS_VAR.deliberate})`,
    reward: `var(${MOTION_DURATION_CSS_VAR.reward})`,
    staggerStep: `var(${MOTION_DURATION_CSS_VAR.staggerStep})`,
    epic: `var(${MOTION_DURATION_CSS_VAR.epic})`,
  },
  easing: {
    standard: `var(${MOTION_EASING_CSS_VAR.standard})`,
    emphasis: `var(${MOTION_EASING_CSS_VAR.emphasis})`,
    decelerate: `var(${MOTION_EASING_CSS_VAR.decelerate})`,
    accelerate: `var(${MOTION_EASING_CSS_VAR.accelerate})`,
    springGentle: `var(${MOTION_EASING_CSS_VAR.springGentle})`,
    springSmooth: `var(${MOTION_EASING_CSS_VAR.springSmooth})`,
    springSnappy: `var(${MOTION_EASING_CSS_VAR.springSnappy})`,
    springReward: `var(${MOTION_EASING_CSS_VAR.springReward})`,
  },
} as const;

export function durationMsToCss(ms: number): string {
  return `${ms}ms`;
}

export function easingToCss(easing: readonly [number, number, number, number]): string {
  return `cubic-bezier(${easing.join(", ")})`;
}
