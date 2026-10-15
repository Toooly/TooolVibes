import type { NormalisedTool } from "../tool-battle-shared";

export type CompareDecisionTarget = {
  slug: string;
  toolName: string;
  accentFrom?: string;
  accentTo?: string;
  alternatives: string[];
  alternativeNames: Array<{ slug: string; name: string }>;
};

export function captureCompareDecisionTarget(
  tools: readonly Pick<
    NormalisedTool,
    "slug" | "name" | "accentFrom" | "accentTo"
  >[],
  chosenSlug?: string | null,
): CompareDecisionTarget | null {
  const chosen =
    (chosenSlug ? tools.find((tool) => tool.slug === chosenSlug) : null) ??
    tools[0] ??
    null;
  if (!chosen) return null;
  const rest = tools.filter((tool) => tool.slug !== chosen.slug);
  return {
    slug: chosen.slug,
    toolName: chosen.name,
    accentFrom: chosen.accentFrom,
    accentTo: chosen.accentTo,
    alternatives: rest.map((tool) => tool.slug),
    alternativeNames: rest.map((tool) => ({
      slug: tool.slug,
      name: tool.name,
    })),
  };
}
