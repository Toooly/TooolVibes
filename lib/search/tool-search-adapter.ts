import Fuse from "fuse.js";

import {
  searchTools,
  type ToolSearchDocument,
  type ToolSearchOptions,
} from "./tool-search";

/* ═══════════════════════════════════════════════════════════════
   Tool search adapter (B31) — engine selection + reversibility.

   "canonical"   → shared deterministic service (lib/search/tool-search).
   "legacy-fuse" → pre-B31 archive behavior: Fuse.js fuzzy search with
                   the exact keys/threshold the catalog controller used.

   The release flag `unifiedSearch` (TOOOLVIBES_UNIFIED_SEARCH_ENABLED,
   default ON) picks the engine; setting it to false restores the
   legacy search without a code revert.
   ═══════════════════════════════════════════════════════════════ */

export const TOOL_SEARCH_ENGINES = ["canonical", "legacy-fuse"] as const;

export type ToolSearchEngine = (typeof TOOL_SEARCH_ENGINES)[number];

export function resolveToolSearchEngine(
  unifiedSearchEnabled: boolean,
): ToolSearchEngine {
  return unifiedSearchEnabled ? "canonical" : "legacy-fuse";
}

/**
 * Exact pre-B31 Fuse configuration of the archive catalog controller
 * (createCatalogSearchIndex). Kept as a single exported definition so
 * the legacy engine stays byte-identical wherever it is mounted.
 */
export const LEGACY_TOOL_SEARCH_FUSE_OPTIONS = {
  keys: ["name", "categoryLabel", "tags", "shortDescription", "longDescription"],
  threshold: 0.35,
};

export function createLegacyToolSearchIndex<T extends ToolSearchDocument>(
  tools: readonly T[],
): Fuse<T> {
  return new Fuse(tools as T[], LEGACY_TOOL_SEARCH_FUSE_OPTIONS);
}

export function searchToolsWithEngine<T extends ToolSearchDocument>(
  tools: readonly T[],
  rawQuery: string,
  engine: ToolSearchEngine,
  options?: ToolSearchOptions,
): T[] {
  const query = rawQuery.trim();
  if (!query) return [];

  if (engine === "legacy-fuse") {
    const results = createLegacyToolSearchIndex(tools)
      .search(query)
      .map((entry) => entry.item);
    return options?.limit !== undefined
      ? results.slice(0, options.limit)
      : results;
  }

  return searchTools(tools, query, options);
}
