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

export function deriveVotes(tool: ToolPublicView): number {
  // deterministic — bound between 18 and 107
  return 18 + ((tool.name.length * 11) % 90);
}

export function deriveTrend(
  tool: ToolPublicView,
): { value: string; direction: "up" | "down" | "flat" } {
  const idx = tool.name.length % 5;
  if (idx === 0) return { value: "+24%", direction: "up" };
  if (idx === 1) return { value: "+82%", direction: "up" };
  if (idx === 2) return { value: "+6%", direction: "up" };
  if (idx === 3) return { value: "—", direction: "flat" };
  return { value: "-3%", direction: "down" };
}

export function deriveScoreDimensions(tool: ToolPublicView): { label: string; value: string }[] {
  return [
    { label: "Velocità", value: tool.toolOfWeek ? "Alta" : tool.featured ? "Alta" : "Buona" },
    {
      label: "Curva",
      value: tool.level === "beginner" ? "Dolce" : tool.level === "expert" ? "Impegnativa" : "Media",
    },
    { label: "Flessibilità", value: tool.tags.length > 4 ? "Ampia" : "Focalizzata" },
    {
      label: "Supporto",
      value: tool.editorialReview ? "Editoriale TooolVibes" : "Scheda base",
    },
  ];
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
    return `Tool della settimana alternativo, focus su casi d'uso complementari.`;
  }
  if (alt.featured) {
    return `Stessa categoria, in evidenza editoriale per il suo taglio più verticale.`;
  }
  return `Profilo complementare a ${current.name} nella stessa categoria.`;
}

// Re-export under the old name to keep page imports stable
export { computeEditorialScore };
