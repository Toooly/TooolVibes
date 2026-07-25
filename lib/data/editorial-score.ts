/**
 * TooolVibes — Canonical editorial score formula
 *
 * ONE source of truth shared by:
 *   - Archive v4 tool card (components/archive/archive-v4-tool-card.tsx)
 *   - Tool Detail v4 score instrument (app/(marketing)/toools/[slug]/page.tsx)
 *   - Compare route (when rendered with score column)
 *   - Future detail-score consumption
 *
 * Contract:
 *   - Deterministic (same input → same output, no Math.random)
 *   - Range [6.8, 9.5]
 *   - Tool of week gets a +0.6 bonus
 *   - Built from tool name length (no fabricated reviews/ratings)
 *   - Capped at 9.5 (never 10.0)
 *
 * Tested in __tests__/lib/data/editorial-score.test.ts
 */

import type { ToolPublicView } from "@/lib/data/tool-public-view";

export type EditorialScore = {
  value: number; // rounded to 1 decimal
  label: "Base" | "Buono" | "Solido" | "Ottimo";
};

export const EDITORIAL_SCORE_MIN = 6.8;
export const EDITORIAL_SCORE_MAX = 9.5;
export const EDITORIAL_SCORE_TOOL_OF_WEEK_BONUS = 0.6;
export const EDITORIAL_SCORE_JITTER_STEP = 0.5;

export function computeEditorialScore(tool: Pick<ToolPublicView, "name" | "toolOfWeek">): EditorialScore {
  const base = EDITORIAL_SCORE_MIN + (tool.name.length % 3) * EDITORIAL_SCORE_JITTER_STEP;
  const boosted = tool.toolOfWeek
    ? Math.min(base + EDITORIAL_SCORE_TOOL_OF_WEEK_BONUS, EDITORIAL_SCORE_MAX)
    : base;
  const value = Math.round(boosted * 10) / 10;
  const label: EditorialScore["label"] =
    value >= 9.0 ? "Ottimo" : value >= 8.0 ? "Solido" : value >= 7.0 ? "Buono" : "Base";
  return { value, label };
}
