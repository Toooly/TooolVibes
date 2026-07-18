import type { ToolPublicView } from "@/lib/data/tool-public-view";

/**
 * LEGACY COMPARE SCORE — SOLO CONFRONTO INTERNO (test/dev).
 *
 * Questo modulo conserva il comportamento pre-B33 (livello, featured,
 * offset hash su slug:categoria:indice, decadimento per rank) come
 * riferimento per i test di confronto interno in
 * `__tests__/lib/compare/legacy-score.test.ts`.
 *
 * NON importare da view, route o copy pubblico: il punteggio pubblico
 * e` prodotto esclusivamente da `@/lib/compare/compare-score`.
 */

type LegacyCatalogScoreLevel = "featured" | "beginner" | "intermediate" | "expert";

function isLegacyCatalogScoreLevel(value: string | null): value is LegacyCatalogScoreLevel {
  return (
    value === "featured" ||
    value === "beginner" ||
    value === "intermediate" ||
    value === "expert"
  );
}

export const legacyLevelScoreBase: Record<LegacyCatalogScoreLevel, number> = {
  featured: 91,
  beginner: 72,
  intermediate: 82,
  expert: 87,
};

export function legacyDirScore(t: ToolPublicView) {
  const levelBase = isLegacyCatalogScoreLevel(t.level) ? legacyLevelScoreBase[t.level] : 70;

  return Math.min(
    98,
    levelBase +
      (t.toolOfWeek ? 4 : 0) +
      (t.featured ? 2 : 0) +
      Math.min(t.highlights.length, 3),
  );
}

export function legacyBaseScore(t: ToolPublicView): number {
  return Math.min(95, 70 + (t.featured ? 10 : 0) + Math.min(t.tags.length, 5) * 2);
}

export function legacyStableScoreOffset(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return (hash % 13) - 6;
}

export type LegacyBattleScoreInput = {
  slug: string;
  name: string;
  category: string;
  score: number;
};

/**
 * Vecchio ranking arena: offset dipendente dall'indice di input e
 * decadimento per rank. Mantenuto solo per dimostrare nei test
 * interni la non-invarianza rispetto alle permutazioni.
 */
export function withLegacyBattleScores<T extends LegacyBattleScoreInput>(
  tools: T[],
): (T & { battleScore: number })[] {
  const ranked = tools
    .map((tool, index) => ({
      index,
      tool,
      raw: tool.score + legacyStableScoreOffset(`${tool.slug}:${tool.category}:${index}`),
    }))
    .sort((a, b) => b.raw - a.raw || a.tool.name.localeCompare(b.tool.name));

  const battleBySlug = new Map<string, number>();
  ranked.forEach(({ tool, raw }, rank) => {
    const score = Math.max(62, Math.min(99, Math.round(raw - rank * 2.25)));
    battleBySlug.set(tool.slug, score);
  });

  return tools.map((tool) => ({
    ...tool,
    battleScore: battleBySlug.get(tool.slug) ?? tool.score,
  }));
}
