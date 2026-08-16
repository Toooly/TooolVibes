import type { WorkspaceStateV1 } from "@/lib/discovery/types";
import { activePersonalStacks } from "@/lib/account/workspace-pipeline";

export type CatalogHint = {
  slug: string;
  name: string;
  categoryLabel: string;
};

export type RecommendationReason =
  | "open_compare_category"
  | "fits_stack"
  | "alternative_to_saved"
  | "declared_focus";

export type WorkspaceRecommendation = {
  slug: string;
  name: string;
  reason: RecommendationReason;
  detail: string;
};

export function recommendWorkspaceTools(input: {
  catalog: readonly CatalogHint[];
  workspace: WorkspaceStateV1;
  focusLabel?: string | null;
  limit?: number;
}): WorkspaceRecommendation[] {
  const limit = input.limit ?? 3;
  const saved = new Set(input.workspace.saved.slugs);
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
    if (saved.has(item.slug) || seen.has(item.slug) || results.length >= limit) {
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

  const focus = input.focusLabel?.trim();
  if (focus) {
    const focusKey = focus.toLowerCase();
    for (const tool of input.catalog) {
      if (
        tool.categoryLabel.toLowerCase().includes(focusKey) ||
        tool.name.toLowerCase().includes(focusKey)
      ) {
        push({
          slug: tool.slug,
          name: tool.name,
          reason: "declared_focus",
          detail: `Vicino al tuo focus ${focus}`,
        });
      }
    }
  }

  return results.slice(0, limit);
}
