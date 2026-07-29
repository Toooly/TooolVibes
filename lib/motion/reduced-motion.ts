/**
 * Reduced-motion contract helpers (SSR-safe pure functions + client query).
 *
 * Server rendering must never read window/matchMedia. Prefer:
 * - pure mappers that accept `preferReducedMotion: boolean`
 * - client-only `getPrefersReducedMotion()` / hooks after mount
 *
 * Initial SSR output stays motion-capable DOM; client applies reduced behaviour
 * without changing structure (no conditional trees that mismatch hydration).
 */

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Pure: true when optional motion should be disabled. */
export function shouldDisableOptionalMotion(preferReducedMotion: boolean): boolean {
  return preferReducedMotion === true;
}

/** Client-only. Returns false during SSR / when window is unavailable. */
export function getPrefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export type MotionScalar = number;

/**
 * Map a full-motion duration (seconds or ms — caller convention) to reduced.
 * Reduced motion collapses optional timing to zero.
 */
export function mapDurationForMotion(
  fullValue: MotionScalar,
  preferReducedMotion: boolean,
  options: { reducedValue?: MotionScalar } = {},
): MotionScalar {
  if (!preferReducedMotion) return fullValue;
  return options.reducedValue ?? 0;
}

/** Stagger is always disabled under reduced motion. */
export function mapStaggerForMotion(
  fullStagger: MotionScalar,
  preferReducedMotion: boolean,
): MotionScalar {
  return preferReducedMotion ? 0 : fullStagger;
}

export type TransformReveal = {
  opacity: number;
  x?: number;
  y?: number;
  scale?: number;
};

/** Collapse transform-based reveals to opacity-only (or instant visible). */
export function mapRevealForMotion(
  full: TransformReveal,
  preferReducedMotion: boolean,
): TransformReveal {
  if (!preferReducedMotion) return full;
  return { opacity: full.opacity };
}

/** Whether Lenis / parallax / continuous scroll coupling may run. */
export function shouldEnableComplexScrollMotion(
  preferReducedMotion: boolean,
): boolean {
  return !preferReducedMotion;
}

/** Whether route-transition loader presentation may show. */
export function shouldShowRouteTransitionPresentation(
  preferReducedMotion: boolean,
): boolean {
  return !preferReducedMotion;
}

/** Whether IntersectionObserver reveal choreography may run. */
export function shouldEnableRevealObserver(
  preferReducedMotion: boolean,
): boolean {
  return !preferReducedMotion;
}
