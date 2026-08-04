/**
 * TooolVibes — Tool Detail v4 derivation helpers (testable).
 *
 * Pure functions that derive display values from a ToolPublicView.
 * No fabricated data: every value is computed from real attributes.
 *
 * Used by /app/(marketing)/toools/[slug]/page.tsx and unit-tested
 * in __tests__/lib/data/tool-detail-derivation.test.ts
 *
 * NOTE: `score` is re-exported from the canonical editorial-score module
 *       so that the same number appears in Archive cards, Tool Detail
 *       score instrument, and (when wired) the Compare route.
 */

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";

export { computeEditorialScore as deriveEditorialScore } from "@/lib/data/editorial-score";

export function deriveVotes(_tool: ToolPublicView): null {
  // Votes are not part of the canonical tool record. Do not manufacture them.
  void _tool;
  return null;
}

export function deriveTrend(
  _tool: ToolPublicView,
): { value: string; direction: "up" | "down" | "flat" } {
  void _tool;
  return { value: "Non disponibile", direction: "flat" };
}

export function deriveScoreDimensions(tool: ToolPublicView): { label: string; value: string }[] {
  const assessment = computeEditorialScore(tool);
  const inputs = tool.publicTool.score?.inputs ?? [];

  if (assessment.status !== "assessed") return [];

  const levelLabels = {
    measured: "Misurato",
    solid: "Solido",
    strong: "Forte",
  } as const;

  return inputs
    .filter((input) => input.level !== undefined)
    .map((input) => ({
      label: input.dimension.replaceAll("_", " "),
      value: levelLabels[input.level as keyof typeof levelLabels],
    }));
}

export function buildAlternativeWhy(current: ToolPublicView, alt: ToolPublicView): string {
  const sharedGroups = alt.filterGroups.filter((g) => current.filterGroups.includes(g));
  const differentGroup = alt.filterGroups.find((g) => !current.filterGroups.includes(g));
  const sharedTags = alt.tags.filter((t) => current.tags.includes(t));
  const lower = alt.level && ["beginner", "intermediate"].includes(alt.level);
  const higher = alt.level === "expert";

  if (higher && sharedTags.length > 0) {
    return `Versione più avanzata, utile se ${current.name} ti sta stretto su ${sharedTags[0]}.`;
  }
  if (lower && sharedGroups.length > 0) {
    return `Curva di apprendimento più dolce, buona alternativa se ${current.name} risulta complesso.`;
  }
  if (differentGroup) {
    return `Approccio diverso su ${differentGroup.replaceAll("-", " ")} rispetto a ${current.name}.`;
  }
  if (alt.toolOfWeek) {
    return `Profilo in evidenza in un contesto alternativo, con focus su casi d'uso complementari.`;
  }
  if (alt.featured) {
    return `Stessa categoria, in evidenza per il suo taglio più verticale.`;
  }
  return `Profilo complementare a ${current.name} nella stessa categoria.`;
}

/**
 * Derive a concise essential-difference label for the comparison table.
 * Returns a short phrase that captures how `alt` differs from `current`.
 */
export function deriveEssentialDifference(current: ToolPublicView, alt: ToolPublicView): string {
  const diffGroups = alt.filterGroups.filter((g) => !current.filterGroups.includes(g));

  if (alt.level === "expert" && current.level !== "expert") return "Più avanzato";
  if (alt.level === "beginner" && current.level !== "beginner") return "Più accessibile";
  if (diffGroups.length > 0) {
    return diffGroups[0].replaceAll("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  if (alt.toolOfWeek) return "In evidenza";
  if (alt.featured) return "In evidenza";
  if (alt.tags.length > 0 && current.tags.length > 0) {
    const unique = alt.tags.filter((t) => !current.tags.includes(t));
    if (unique.length > 0) return unique[0];
  }
  return alt.categoryLabel || "Complementare";
}

// Re-export under the old name to keep page imports stable
export { computeEditorialScore };
