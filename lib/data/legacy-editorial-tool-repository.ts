import "server-only";

import { cache } from "react";

import { canUseMockDataFallback } from "@/lib/data/mock-fallback";
import { mockTools } from "@/lib/data/mock-tools";
import { isSupabasePublicEnabled } from "@/lib/supabase/public-client";
import { getPublicPublishedToolsFromSupabase } from "@/lib/supabase/tool-repository";
import type { ToolRecord } from "@/lib/types/tool";

export const LEGACY_EDITORIAL_TOOLS_WARNING =
  "legacy-editorial-tool-repository-active-until-data-203";

export type LegacyEditorialToolsDataSource = "mock" | "supabase";

export type LegacyEditorialToolsSnapshot = {
  tools: ToolRecord[];
  source: LegacyEditorialToolsDataSource;
  requestedSource: LegacyEditorialToolsDataSource;
  warnings: string[];
  transitional: true;
  readOnly: true;
};

let didWarnAboutLegacyRepository = false;

function warnAboutLegacyRepository() {
  if (didWarnAboutLegacyRepository) {
    return;
  }

  didWarnAboutLegacyRepository = true;
  console.warn(
    "[tools:legacy-editorial] Transitional read-only repository active; migrate Posts and Collections in DATA-203.",
    { warning: LEGACY_EDITORIAL_TOOLS_WARNING },
  );
}

function withTransitionWarning(warnings: string[] = []) {
  return [LEGACY_EDITORIAL_TOOLS_WARNING, ...warnings];
}

function sortTools(items: ToolRecord[]) {
  return [...items].sort((left, right) =>
    right.date_discovered.localeCompare(left.date_discovered),
  );
}

function onlyPublished(items: ToolRecord[]) {
  return items.filter((tool) => tool.is_published);
}

function emptySupabaseSnapshot(warning: string): LegacyEditorialToolsSnapshot {
  return {
    tools: [],
    source: "supabase",
    requestedSource: "supabase",
    warnings: withTransitionWarning([warning]),
    transitional: true,
    readOnly: true,
  };
}

const toolEditorialOverlayBySlug = new Map(
  mockTools.map((tool) => [tool.slug, tool]),
);

/**
 * Preserves the pre-DATA-202 editorial fallback contract only.
 * This overlay must never be imported by the canonical ToolPublic repository.
 */
function withLegacyEditorialOverlay(tool: ToolRecord): ToolRecord {
  const overlay = toolEditorialOverlayBySlug.get(tool.slug);

  if (!overlay) {
    return tool;
  }

  return {
    ...tool,
    short_description_it: overlay.short_description_it || tool.short_description_it,
    description_it: overlay.description_it || tool.description_it,
    website_url: tool.website_url || overlay.website_url,
    tooolvibes_post_url: tool.tooolvibes_post_url || overlay.tooolvibes_post_url,
    cover_image_url: tool.cover_image_url || overlay.cover_image_url,
    source: tool.source || overlay.source,
    editorial_state: overlay.editorial_state ?? tool.editorial_state,
    pricing: overlay.pricing ?? tool.pricing,
    platforms: overlay.platforms?.length ? overlay.platforms : tool.platforms,
    best_for: overlay.best_for ?? tool.best_for,
    editorial_note: overlay.editorial_note ?? tool.editorial_note,
    why_here: overlay.why_here ?? tool.why_here,
    use_cases: overlay.use_cases?.length ? overlay.use_cases : tool.use_cases,
    strengths: overlay.strengths?.length ? overlay.strengths : tool.strengths,
    cautions: overlay.cautions?.length ? overlay.cautions : tool.cautions,
    editorial_scorecard:
      overlay.editorial_scorecard && Object.keys(overlay.editorial_scorecard).length > 0
        ? overlay.editorial_scorecard
        : tool.editorial_scorecard,
  };
}

const loadLegacyEditorialToolsSnapshot = cache(
  async (): Promise<LegacyEditorialToolsSnapshot> => {
    warnAboutLegacyRepository();

    if (!isSupabasePublicEnabled()) {
      if (!canUseMockDataFallback()) {
        return emptySupabaseSnapshot("supabase-public-env-missing");
      }

      return {
        tools: onlyPublished(mockTools),
        source: "mock",
        requestedSource: "mock",
        warnings: withTransitionWarning(),
        transitional: true,
        readOnly: true,
      };
    }

    try {
      const supabaseTools = onlyPublished(
        await getPublicPublishedToolsFromSupabase(),
      ).map(
        canUseMockDataFallback()
          ? withLegacyEditorialOverlay
          : (tool) => tool,
      );

      if (supabaseTools.length === 0) {
        if (!canUseMockDataFallback()) {
          return emptySupabaseSnapshot("supabase-empty");
        }

        return {
          tools: onlyPublished(mockTools),
          source: "mock",
          requestedSource: "supabase",
          warnings: withTransitionWarning(["supabase-empty-fallback"]),
          transitional: true,
          readOnly: true,
        };
      }

      return {
        tools: supabaseTools,
        source: "supabase",
        requestedSource: "supabase",
        warnings: withTransitionWarning(),
        transitional: true,
        readOnly: true,
      };
    } catch (error) {
      console.error(
        "[tools:legacy-editorial] Public archive read failed.",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );

      if (!canUseMockDataFallback()) {
        return emptySupabaseSnapshot("supabase-public-read-failed");
      }

      return {
        tools: onlyPublished(mockTools),
        source: "mock",
        requestedSource: "supabase",
        warnings: withTransitionWarning(["supabase-public-read-failed"]),
        transitional: true,
        readOnly: true,
      };
    }
  },
);

export const getLegacyEditorialToolsSnapshot = cache(
  async (): Promise<LegacyEditorialToolsSnapshot> => {
    const snapshot = await loadLegacyEditorialToolsSnapshot();

    return {
      ...snapshot,
      tools: sortTools(snapshot.tools),
    };
  },
);

export const getLegacyEditorialPublishedTools = cache(async () => {
  const snapshot = await getLegacyEditorialToolsSnapshot();
  return snapshot.tools;
});

export const getLegacyEditorialToolBySlug = cache(async (slug: string) => {
  const tools = await getLegacyEditorialPublishedTools();
  return tools.find((tool) => tool.slug === slug) ?? null;
});
