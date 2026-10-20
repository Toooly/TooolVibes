export const HERO_ARTWORK = "/hero/decision-instrument.webp";

/** Scroll is observed, never intercepted. Damping uses seconds, not frame count. */
export function getHeroScrollProgress(scrollY: number, start: number, distance: number) {
  return Math.min(1, Math.max(0, (scrollY - start) / Math.max(1, distance)));
}

export function dampHeroScroll(current: number, target: number, deltaSeconds: number) {
  const next = current + (target - current) * (1 - Math.exp(-Math.max(0, deltaSeconds) / 0.18));
  return Math.abs(next - target) < 0.00001 ? target : next;
}
