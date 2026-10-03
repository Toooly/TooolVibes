/**
 * Podium metallic tier resolution.
 *
 * Derives gold / silver / bronze identity from the CANONICAL ranking order
 * of the tools array — the same source that determines the Home podium
 * (components/home/start-here.tsx:404 `tools.slice(0, 9)` → `ranked[0..2]`).
 *
 * Position 01 → "primary"   (gold)
 * Position 02 → "secondary" (silver)
 * Position 03 → "tertiary"  (bronze)
 *
 * No tool identity is special. If admin/backend changes the ranking,
 * metallic tiers follow automatically with zero code changes.
 */

export type PodiumTier = "primary" | "secondary" | "tertiary";

const PODIUM_TIERS_BY_POSITION: readonly PodiumTier[] = ["primary", "secondary", "tertiary"];

/**
 * Resolve metallic podium tiers from a canonical-ordered tools array.
 *
 * - Assigns tier by array position (0 → gold, 1 → silver, 2 → bronze).
 * - Each slug receives at most one tier (first occurrence wins).
 * - Handles 0–3+ items gracefully; positions beyond 2 are ignored.
 * - Returns a plain object map: slug → tier.
 */
export function resolvePodiumTiers(
  tools: ReadonlyArray<{ slug: string }>
): Record<string, PodiumTier> {
  const map: Record<string, PodiumTier> = {};
  const seen = new Set<string>();
  const limit = Math.min(3, tools.length);
  for (let i = 0; i < limit; i++) {
    const slug = tools[i].slug;
    if (seen.has(slug)) continue;
    seen.add(slug);
    map[slug] = PODIUM_TIERS_BY_POSITION[i];
  }
  return map;
}
