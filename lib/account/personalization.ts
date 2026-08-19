import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { activePersonalStacks } from "@/lib/account/workspace-pipeline";
import {
  FOCUS_AREA_LABELS,
  PRIMARY_GOAL_LABELS,
  type SignalFocusArea,
  type SignalPrimaryGoal,
} from "@/lib/signal-progression/profile-context";

export type CatalogHint = {
  slug: string;
  name: string;
  categoryLabel: string;
  tags?: readonly string[];
};

export type RecommendationReason =
  | "open_compare_category"
  | "fits_stack"
  | "alternative_to_saved"
  | "declared_focus"
  | "declared_goal";

export type WorkspaceRecommendation = {
  slug: string;
  name: string;
  reason: RecommendationReason;
  detail: string;
};

const FOCUS_TOKENS: Record<SignalFocusArea, readonly string[]> = {
  product: ["builder", "no-code", "cms", "app", "prodotto", "product"],
  design: ["design", "immagini", "video", "creativ", "avatar", "siti", "ritratti"],
  engineering: ["coding", "engineer", "builder", "vibe coding", "langchain", "agenti", "flussi"],
  marketing: ["marketing", "seo", "lead", "affiliate", "linkedin", "annunci", "attribuzione", "vendite"],
  operations: ["automazion", "pagamenti", "supporto", "ticket", "chatbot", "notion", "merchant"],
  research: ["ricerca", "scrittura", "dati", "blogging"],
};

const GOAL_TOKENS: Partial<Record<SignalPrimaryGoal, readonly string[]>> = {
  learn: ["ricerca", "scrittura", "dati", "blogging"],
};

function rejectedSlugs(workspace: WorkspaceStateV1) {
  const slugs = new Set<string>();
  for (const [slug, tool] of Object.entries(workspace.toolStates)) {
    if (tool.decision?.outcome === "rejected") slugs.add(slug);
  }
  return slugs;
}

function toolHaystack(tool: CatalogHint) {
  return [tool.categoryLabel, tool.name, ...(tool.tags ?? [])]
    .join(" ")
    .toLowerCase();
}

function matchesTokens(tool: CatalogHint, tokens: readonly string[]) {
  const haystack = toolHaystack(tool);
  return tokens.some((token) => haystack.includes(token.toLowerCase()));
}

export function recommendWorkspaceTools(input: {
  catalog: readonly CatalogHint[];
  workspace: WorkspaceStateV1;
  focusArea?: SignalFocusArea | null;
  primaryGoal?: SignalPrimaryGoal | null;
  limit?: number;
}): WorkspaceRecommendation[] {
  const limit = input.limit ?? 3;
  const saved = new Set(input.workspace.saved.slugs);
  const rejected = rejectedSlugs(input.workspace);
  const compare = new Set(input.workspace.compare.slugs);
  const catalogBySlug = new Map(input.catalog.map((tool) => [tool.slug, tool]));
  const compareCategories = new Set(
    input.workspace.compare.slugs
      .map((slug) => catalogBySlug.get(slug)?.categoryLabel)
      .filter((value): value is string => Boolean(value)),
  );
  const savedCategories = new Set(
    input.workspace.saved.slugs
      .map((slug) => catalogBySlug.get(slug)?.categoryLabel)
      .filter((value): value is string => Boolean(value)),
  );
  const stacks = activePersonalStacks(input.workspace);
  const results: WorkspaceRecommendation[] = [];
  const seen = new Set<string>();

  const push = (item: WorkspaceRecommendation) => {
    if (
      saved.has(item.slug) ||
      rejected.has(item.slug) ||
      seen.has(item.slug) ||
      results.length >= limit
    ) {
      return;
    }
    seen.add(item.slug);
    results.push(item);
  };

  for (const tool of input.catalog) {
    if (compareCategories.has(tool.categoryLabel) && !compare.has(tool.slug)) {
      push({
        slug: tool.slug,
        name: tool.name,
        reason: "open_compare_category",
        detail: `Perché stai confrontando ${tool.categoryLabel}`,
      });
    }
  }

  for (const stack of stacks) {
    const haystack = `${stack.name} ${stack.description ?? ""}`.toLowerCase();
    for (const tool of input.catalog) {
      if (haystack.includes(tool.categoryLabel.toLowerCase())) {
        push({
          slug: tool.slug,
          name: tool.name,
          reason: "fits_stack",
          detail: `Si adatta allo stack ${stack.name}`,
        });
      }
    }
  }

  if (savedCategories.size > 0) {
    for (const tool of input.catalog) {
      if (savedCategories.has(tool.categoryLabel)) {
        push({
          slug: tool.slug,
          name: tool.name,
          reason: "alternative_to_saved",
          detail: `Alternativa nella categoria ${tool.categoryLabel}`,
        });
      }
    }
  }

  const focusArea = input.focusArea ?? null;
  if (focusArea) {
    const tokens = FOCUS_TOKENS[focusArea];
    const focusName = FOCUS_AREA_LABELS[focusArea];
    for (const tool of input.catalog) {
      if (matchesTokens(tool, tokens)) {
        push({
          slug: tool.slug,
          name: tool.name,
          reason: "declared_focus",
          detail: `Vicino al tuo focus ${focusName}`,
        });
      }
    }
  }

  const primaryGoal = input.primaryGoal ?? null;
  const goalTokens = primaryGoal ? GOAL_TOKENS[primaryGoal] : undefined;
  if (primaryGoal && goalTokens && goalTokens.length > 0) {
    const goalName = PRIMARY_GOAL_LABELS[primaryGoal];
    for (const tool of input.catalog) {
      if (matchesTokens(tool, goalTokens)) {
        push({
          slug: tool.slug,
          name: tool.name,
          reason: "declared_goal",
          detail: `Per il tuo obiettivo: ${goalName}`,
        });
      }
    }
  }

  return results.slice(0, limit);
}
