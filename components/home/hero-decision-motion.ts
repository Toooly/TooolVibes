export const HERO_ARTWORK = "/hero/decision-instrument.webp";

/** Reveal all three steps while the artwork is still in view, in either direction. */
export function getHeroJourneyStep(progress: number) {
  return progress >= 0.18 ? 3 : progress >= 0.055 ? 2 : progress >= 0.005 ? 1 : 0;
}

/** Scroll is observed, never intercepted. Damping uses seconds, not frame count. */
export function getHeroScrollProgress(scrollY: number, start: number, distance: number) {
  return Math.min(1, Math.max(0, (scrollY - start) / Math.max(1, distance)));
}

export function dampHeroScroll(current: number, target: number, deltaSeconds: number) {
  const next = current + (target - current) * (1 - Math.exp(-Math.max(0, deltaSeconds) / 0.18));
  return Math.abs(next - target) < 0.00001 ? target : next;
}
