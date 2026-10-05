/**
 * Radar Watchlist domain.
 *
 * WATCH ≠ SAVE:
 *   SAVE  (gold)   = "voglio tenere questo tool"          → workspace.saved
 *   WATCH (cyan)   = "segnalami movimenti attorno a…"     → workspace.radarWatch
 *
 * ALERT TRUTH RULES (spec §21):
 *   A signal may only claim "nuovo" / "cambiato" when a previous snapshot is
 *   actually available. With history absent the model degrades to presence
 *   digests ("N tool nella categoria che segui") and the UI must show
 *   "Dati storici in raccolta" for movement alerts. No fake notifications.
 *
 * Scheduling/push infrastructure does not exist on this platform: this is the
 * in-app signal model only. Backend follow-up is documented separately.
 */

import type { RadarTool } from "@/lib/radar/radar-domain";
import type { RadarWatchState } from "@/lib/discovery/types";

export type RadarWatchSignalKind =
  | "presence-digest"
  | "new-in-category"
  | "watched-tool-present"
  | "watched-tool-moved"
  | "attention-delta";

export type RadarWatchSignal = {
  id: string;
  kind: RadarWatchSignalKind;
  title: string;
  explanation: string;
  toolId?: string;
  categoryId?: string;
  /** True only when the claim is grounded in a previous snapshot. */
  grounded: boolean;
};

export type RadarWatchDigest = {
  watchedToolCount: number;
  watchedCategoryCount: number;
  /** Tools currently on the Radar that match the watchlist. */
  matchedTools: readonly RadarTool[];
  matchedCategoryIds: readonly string[];
  signals: readonly RadarWatchSignal[];
  /** True when movement alerts cannot be computed (no previous snapshot). */
  movementAlertsAvailable: boolean;
};

export const RADAR_WATCH_MOVEMENT_REASON =
  "Dati storici in raccolta: gli alert di movimento appariranno quando sono disponibili più snapshot.";

function normalizeCategoryKey(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isRadarWatchEmpty(watch: RadarWatchState | null | undefined): boolean {
  if (!watch) return true;
  return watch.slugs.length === 0 && watch.categories.length === 0;
}

/**
 * Evaluates the in-app Radar watch signal model.
 *
 * `previousTools` is `null` today (no feed history). When it becomes
 * available the movement/delta kinds light up automatically — nothing here
 * invents a delta from a single snapshot.
 */
export function evaluateRadarWatchSignals(
  watch: RadarWatchState,
  tools: readonly RadarTool[],
  previousTools: readonly RadarTool[] | null = null,
): RadarWatchDigest {
  const watchedSlugs = new Set(watch.slugs);
  const watchedCategories = new Set(
    watch.categories.map((category) => normalizeCategoryKey(category)),
  );

  const matchedTools = tools.filter((tool) => {
    if (tool.catalogSlug && watchedSlugs.has(tool.catalogSlug)) return true;
    if (watchedSlugs.has(tool.id)) return true;
    if (tool.category && watchedCategories.has(normalizeCategoryKey(tool.category.id))) {
      return true;
    }
    return false;
  });

  const matchedCategoryIds = Array.from(
    new Set(
      matchedTools
        .map((tool) => tool.category?.id ?? null)
        .filter((id): id is string => id !== null),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const signals: RadarWatchSignal[] = [];
  const movementAlertsAvailable = previousTools !== null;

  for (const categoryId of matchedCategoryIds) {
    const count = matchedTools.filter(
      (tool) => tool.category?.id === categoryId,
    ).length;
    const label =
      matchedTools.find((tool) => tool.category?.id === categoryId)?.category
        ?.label ?? categoryId;
    signals.push({
      id: `presence-category:${categoryId}`,
      kind: "presence-digest",
      categoryId,
      title: `${label}: ${count} ${count === 1 ? "tool" : "tool"} nel Radar`,
      explanation:
        "Presenza attuale nel periodo selezionato. Non è una variazione: servono più snapshot per misurare il movimento.",
      grounded: true,
    });
  }

  for (const tool of matchedTools) {
    const watchedBySlug =
      (tool.catalogSlug && watchedSlugs.has(tool.catalogSlug)) ||
      watchedSlugs.has(tool.id);
    if (!watchedBySlug) continue;
    signals.push({
      id: `presence-tool:${tool.id}`,
      kind: "watched-tool-present",
      toolId: tool.id,
      title: `${tool.name} è nel Radar`,
      explanation: `Presenza attuale: ${tool.votesCount} voti · ${tool.commentsCount} commenti · #${tool.rank} nel periodo. Movimento non disponibile senza storico.`,
      grounded: true,
    });
  }

  if (previousTools) {
    const previousById = new Map(previousTools.map((tool) => [tool.id, tool]));
    for (const tool of matchedTools) {
      const previous = previousById.get(tool.id);
      if (!previous) {
        signals.push({
          id: `new-tool:${tool.id}`,
          kind: "new-in-category",
          toolId: tool.id,
          title: `${tool.name} è entrato nel Radar`,
          explanation: "Assente dallo snapshot precedente, presente in questo.",
          grounded: true,
        });
        continue;
      }
      const rankDelta = previous.rank - tool.rank;
      if (rankDelta !== 0) {
        signals.push({
          id: `moved:${tool.id}`,
          kind: "watched-tool-moved",
          toolId: tool.id,
          title: `${tool.name} ${rankDelta > 0 ? "sale" : "scende"} di ${Math.abs(rankDelta)} ${Math.abs(rankDelta) === 1 ? "posizione" : "posizioni"}`,
          explanation: `Da #${previous.rank} a #${tool.rank} rispetto allo snapshot precedente.`,
          grounded: true,
        });
      }
    }
  }

  return {
    watchedToolCount: watch.slugs.length,
    watchedCategoryCount: watch.categories.length,
    matchedTools,
    matchedCategoryIds,
    signals,
    movementAlertsAvailable,
  };
}
