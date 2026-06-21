import "server-only";

import { cache } from "react";

import { canUseMockDataFallback } from "@/lib/data/mock-fallback";
import { mockTools } from "@/lib/data/mock-tools";
import { getPublicPublishedToolsFromSupabase } from "@/lib/supabase/tool-repository";
import { isSupabasePublicEnabled } from "@/lib/supabase/public-client";
import type { ToolCategory, ToolRecord } from "@/lib/types/tool";

export type PublicToolsDataSource = "mock" | "supabase";
export type PublicToolsSnapshot = {
  tools: ToolRecord[];
  source: PublicToolsDataSource;
  requestedSource: PublicToolsDataSource;
  warnings: string[];
};

function sortTools(items: ToolRecord[]) {
  return [...items].sort((left, right) =>
    right.date_discovered.localeCompare(left.date_discovered),
  );
}

function onlyPublished(items: ToolRecord[]) {
  return items.filter((tool) => tool.is_published);
}

function emptySupabaseSnapshot(warning: string): PublicToolsSnapshot {
  return {
    tools: [],
    source: "supabase",
    requestedSource: "supabase",
    warnings: [warning],
  };
}

const toolEditorialOverlayBySlug = new Map(
  mockTools.map((tool) => [tool.slug, tool]),
);

function withEditorialOverlay(tool: ToolRecord): ToolRecord {
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

export const getPublicToolsDataSource = cache(async (): Promise<PublicToolsDataSource> => {
  const snapshot = await loadPublicToolsSnapshot();
  return snapshot.source;
});

const loadPublicToolsSnapshot = cache(async (): Promise<PublicToolsSnapshot> => {
  if (!isSupabasePublicEnabled()) {
    if (!canUseMockDataFallback()) {
      return emptySupabaseSnapshot("supabase-public-env-missing");
    }

    return {
      tools: onlyPublished(mockTools),
      source: "mock",
      requestedSource: "mock",
      warnings: [],
    };
  }

  try {
    const supabaseTools = onlyPublished(await getPublicPublishedToolsFromSupabase()).map(
      canUseMockDataFallback() ? withEditorialOverlay : (tool) => tool,
    );

    if (supabaseTools.length === 0) {
      if (!canUseMockDataFallback()) {
        return emptySupabaseSnapshot("supabase-empty");
      }

      return {
        tools: onlyPublished(mockTools),
        source: "mock",
        requestedSource: "supabase",
        warnings: ["supabase-empty-fallback"],
      };
    }

    return {
      tools: supabaseTools,
      source: "supabase",
      requestedSource: "supabase",
      warnings: [],
    };
  } catch (error) {
    console.error("[tools:data] Lettura archivio pubblico non riuscita.", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (!canUseMockDataFallback()) {
      return emptySupabaseSnapshot("supabase-public-read-failed");
    }

    return {
      tools: onlyPublished(mockTools),
      source: "mock",
      requestedSource: "supabase",
      warnings: ["supabase-public-read-failed"],
    };
  }
});

export const getPublishedTools = cache(async () => {
  const snapshot = await loadPublicToolsSnapshot();
  return sortTools(snapshot.tools);
});

export const getPublicToolsSnapshot = cache(async (): Promise<PublicToolsSnapshot> => {
  const snapshot = await loadPublicToolsSnapshot();
  return {
    ...snapshot,
    tools: sortTools(snapshot.tools),
  };
});

export async function getFeaturedTools() {
  const tools = await getPublishedTools();

  return tools.filter((tool) => tool.is_featured).slice(0, 4);
}

export async function getAllCategories(): Promise<ToolCategory[]> {
  const tools = await getPublishedTools();
  return Array.from(new Set(tools.map((tool) => tool.category))).sort() as ToolCategory[];
}

export async function getAllTags() {
  const tools = await getPublishedTools();

  return tools
    .flatMap((tool) => tool.tags)
    .reduce<Record<string, number>>((accumulator, tag) => {
      accumulator[tag] = (accumulator[tag] ?? 0) + 1;
      return accumulator;
    }, {});
}

export async function getToolBySlug(slug: string) {
  const tools = await getPublishedTools();
  return tools.find((tool) => tool.slug === slug) ?? null;
}
