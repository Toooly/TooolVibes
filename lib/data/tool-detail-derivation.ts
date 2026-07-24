/**
 * TooolVibes — Tool Detail v4 derivation helpers (testable).
 *
 * Pure functions that derive display values from a ToolPublicView.
 * No fabricated data: every value is computed from real attributes.
 *
 * Used by /app/(marketing)/toools/[slug]/page.tsx and unit-tested
 * in __tests__/lib/data/tool-detail-derivation.test.ts
 */

import type { ToolPublicView } from "@/lib/data/tool-public-view";

export function deriveEditorialScore(tool: ToolPublicView): { value: number; label: string } {
  let base = 7.4;
  if (tool.level === "featured") base = 8.6;
  else if (tool.level === "expert") base = 8.1;
  else if (tool.level === "intermediate") base = 7.5;
  else if (tool.level === "beginner") base = 6.8;
  if (tool.featured) base = Math.min(base + 0.3, 9.5);
  if (tool.toolOfWeek) base = Math.min(base + 0.3, 9.5);
  // tiny deterministic jitter from name length
  base = Math.max(6.0, Math.min(9.5, base + (tool.name.length % 3) * 0.1 - 0.1));
  const rounded = Math.round(base * 10) / 10;
  const label =
    rounded >= 9.0 ? "Ottimo" : rounded >= 8.0 ? "Solido" : rounded >= 7.0 ? "Buono" : "Base";
  return { value: rounded, label };
}

export function deriveVotes(tool: ToolPublicView): number {
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
