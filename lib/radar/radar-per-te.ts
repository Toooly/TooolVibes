/**
 * "Per te" — explainable personalization for the logged-only Radar.
 *
 * DETERMINISTIC, NOT ML. Recommendations are grounded in the user's own
 * workspace (saved / compared / decided / stacked tools). Copy always says
 * why ("Perché hai salvato tool di …"). No sensitive-attribute inference.
 *
 * Cold start: a logged user with no meaningful interaction history gets a
 * strong onboarding state instead of fake recommendations.
 */

import type { PublicToolCatalogItem } from "@/lib/data/public-tool-catalog-types";
import type { RadarTool } from "@/lib/radar/radar-domain";
import { radarCategoryClusterLabel } from "@/lib/radar/radar-domain";
import type { WorkspaceStateV1 } from "@/lib/discovery/types";

export type RadarPerTeReason =
  | "saved-category"
  | "compared-category"
  | "followed-category"
  | "watched-tool"
  | "workspace-known";

export type RadarPerTeCard = {
  tool: RadarTool;
  reason: RadarPerTeReason;
  title: string;
  explanation: string;
};

export type RadarPerTeModel = {
  coldStart: boolean;
  cards: readonly RadarPerTeCard[];
  /** User category labels that drove the selection (for the "Perché" panel). */
  interests: readonly string[];
  /** True when nothing matched — the UI must show a calm empty state. */
  empty: boolean;
};

const REASON_COPY: Record<
  RadarPerTeReason,
  { title: (label: string) => string; explanation: (label: string) => string }
> = {
  "saved-category": {
    title: (label) => `Per i tuoi interessi: ${label}`,
    explanation: (label) => `Perché hai salvato tool di ${label}.`,
  },
  "compared-category": {
    title: (label) => `Vicino ai tuoi confronti: ${label}`,
    explanation: (label) => `Perché hai confrontato tool di ${label}.`,
  },
  "followed-category": {
    title: (label) => `Categoria seguita: ${label}`,
    explanation: (label) => `Perché segui la categoria ${label} nella tua Watchlist.`,
  },
  "watched-tool": {
    title: () => `Nella tua Watchlist`,
    explanation: () => `Perché segui questo tool.`,
  },
  "workspace-known": {
    title: (label) => `Esplora ${label}`,
    explanation: () => `Perché hai già lavorato con tool di quest'area.`,
  },
};

/**
 * True only when the workspace carries real interaction history.
 * Saving nothing and deciding nothing = cold start. Never fake it.
 */
export function isRadarColdStart(workspace: WorkspaceStateV1): boolean {
  return (
    workspace.saved.slugs.length === 0 &&
    workspace.compare.slugs.length === 0 &&
    workspace.stack.slugs.length === 0 &&
    workspace.radarWatch.slugs.length === 0 &&
    workspace.radarWatch.categories.length === 0 &&
    Object.keys(workspace.toolStates).length === 0
  );
}

function categoryLabelForSlug(
  slug: string,
  catalog: readonly PublicToolCatalogItem[],
): string | null {
  const hint = catalog.find((tool) => tool.slug === slug);
  return hint ? radarCategoryClusterLabel(hint.categoryLabel) : null;
}

/**
 * Builds explainable "Per te" cards from real workspace signals.
 * Ordering is deterministic: reason priority, then tool rank.
 */
export function buildRadarPerTe(
  tools: readonly RadarTool[],
  workspace: WorkspaceStateV1,
  catalog: readonly PublicToolCatalogItem[],
): RadarPerTeModel {
  if (isRadarColdStart(workspace)) {
    return { coldStart: true, cards: [], interests: [], empty: true };
  }

  const savedLabels = new Map<string, string>();
  for (const slug of workspace.saved.slugs) {
    const label = categoryLabelForSlug(slug, catalog);
    if (label) savedLabels.set(label.toLowerCase(), label);
  }
  const comparedLabels = new Map<string, string>();
  for (const slug of workspace.compare.slugs) {
    const label = categoryLabelForSlug(slug, catalog);
    if (label) comparedLabels.set(label.toLowerCase(), label);
  }
  const knownLabels = new Map<string, string>();
  for (const slug of Object.keys(workspace.toolStates)) {
    const label = categoryLabelForSlug(slug, catalog);
    if (label) knownLabels.set(label.toLowerCase(), label);
  }
  const watchedCategories = new Map<string, string>();
  for (const category of workspace.radarWatch.categories) {
    watchedCategories.set(category.toLowerCase(), category);
  }
  const watchedSlugs = new Set(workspace.radarWatch.slugs);

  const reasonPriority: Record<RadarPerTeReason, number> = {
    "watched-tool": 10,
    "saved-category": 20,
    "followed-category": 30,
    "compared-category": 40,
    "workspace-known": 50,
  };

  const cards: RadarPerTeCard[] = [];
  const usedToolIds = new Set<string>();

  for (const tool of tools) {
    if (usedToolIds.has(tool.id)) continue;

    const toolSlug = tool.catalogSlug ?? tool.id;
    let reason: RadarPerTeReason | null = null;
    let interestLabel = tool.categoryLabel
      ? radarCategoryClusterLabel(tool.categoryLabel)
      : tool.category?.label ?? "";

    if (
      watchedSlugs.has(toolSlug) ||
      watchedSlugs.has(tool.id)
    ) {
      reason = "watched-tool";
      interestLabel = tool.name;
    } else if (
      tool.categoryLabel &&
      savedLabels.has(radarCategoryClusterLabel(tool.categoryLabel).toLowerCase())
    ) {
      reason = "saved-category";
      interestLabel = radarCategoryClusterLabel(tool.categoryLabel);
    } else if (
      tool.category &&
      watchedCategories.has(tool.category.id.toLowerCase())
    ) {
      reason = "followed-category";
      interestLabel = tool.category.label;
    } else if (
      tool.categoryLabel &&
      comparedLabels.has(radarCategoryClusterLabel(tool.categoryLabel).toLowerCase())
    ) {
      reason = "compared-category";
      interestLabel = radarCategoryClusterLabel(tool.categoryLabel);
    } else if (
      tool.categoryLabel &&
      knownLabels.has(radarCategoryClusterLabel(tool.categoryLabel).toLowerCase())
    ) {
      reason = "workspace-known";
      interestLabel = radarCategoryClusterLabel(tool.categoryLabel);
    }

    if (!reason) continue;
    usedToolIds.add(tool.id);
    const copy = REASON_COPY[reason];
    cards.push({
      tool,
      reason,
      title: copy.title(interestLabel),
      explanation: copy.explanation(interestLabel),
    });
  }

  cards.sort(
    (a, b) =>
      reasonPriority[a.reason] - reasonPriority[b.reason] ||
      a.tool.rank - b.tool.rank ||
      a.tool.id.localeCompare(b.tool.id),
  );

  const interests = Array.from(
    new Set(
      cards
        .map((card) =>
          card.reason === "watched-tool"
            ? null
            : card.tool.categoryLabel
              ? radarCategoryClusterLabel(card.tool.categoryLabel)
              : card.tool.category?.label ?? null,
        )
        .filter((label): label is string => label !== null),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return {
    coldStart: false,
    cards: cards.slice(0, 8),
    interests,
    empty: cards.length === 0,
  };
}
