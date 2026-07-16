import "server-only";

import { cache } from "react";

import { mockTools } from "@/lib/data/mock-tools";
import {
  getPublicToolsRuntimePolicy,
  requirePublicToolsSnapshot,
  resolvePublicToolsSnapshot,
  PublicToolsSourceError,
  type PublicToolsDataSource,
  type PublicToolsSnapshot,
  type PublicToolsSourceLoaders,
  type PublicToolsTelemetryEvent,
} from "@/lib/data/tool-public-repository";
import {
  adaptDirectoryToolToPublic,
  adaptToolRecordToPublic,
} from "@/lib/data/tool-public-adapters";
import {
  createToolPublicView,
  getRelatedToolViews,
  getToolFilterGroups,
} from "@/lib/data/tool-public-view";
import { directoryTools } from "@/lib/data/tooolvibes-directory";
import { isSupabasePublicEnabled } from "@/lib/supabase/public-client";
import { getPublicPublishedToolsFromSupabase } from "@/lib/supabase/tool-repository";

export type {
  PublicToolsDataSource,
  PublicToolsSnapshot,
} from "@/lib/data/tool-public-repository";

function telemetry(event: PublicToolsTelemetryEvent) {
  if (event.event === "source-comparison") {
    console.info("[tools:data:comparison]", {
      comparisonSource: event.source,
      status: event.status,
      activeCount: event.activeCount,
      comparisonCount: event.comparisonCount,
      overlapCount: event.overlapCount,
      activeOnlyCount: event.activeOnlyCount,
      comparisonOnlyCount: event.comparisonOnlyCount,
      fieldMismatchCount: event.fieldMismatchCount,
    });
    return;
  }

  console.info("[tools:data:resolution]", {
    requestedSource: event.requestedSource,
    activeSource: event.activeSource,
    fallbackSource: event.fallbackSource,
    status: event.status,
    count: event.count,
    failureReason: event.failureReason,
  });
}

const sourceLoaders: PublicToolsSourceLoaders = {
  directory: async () => ({
    tools: directoryTools.map((directoryTool) => {
      const publicTool = adaptDirectoryToolToPublic(directoryTool, {
        status: "published",
      });

      return createToolPublicView(publicTool, directoryTool);
    }),
  }),
  supabase: async () => {
    if (!isSupabasePublicEnabled()) {
      throw new PublicToolsSourceError("source-not-configured");
    }

    const records = await getPublicPublishedToolsFromSupabase();
    return {
      tools: records.map((record) =>
        createToolPublicView(adaptToolRecordToPublic(record)),
      ),
    };
  },
  mock: async () => ({
    tools: mockTools.map((record) =>
      createToolPublicView(adaptToolRecordToPublic(record)),
    ),
  }),
};

const loadPublicToolsSnapshot = cache(async (): Promise<PublicToolsSnapshot> => {
  const policy = getPublicToolsRuntimePolicy({
    NODE_ENV: process.env.NODE_ENV,
    TOOOLVIBES_TOOLS_SOURCE: process.env.TOOOLVIBES_TOOLS_SOURCE,
    TOOOLVIBES_TOOLS_FALLBACK: process.env.TOOOLVIBES_TOOLS_FALLBACK,
    TOOOLVIBES_TOOLS_COMPARE_SOURCE:
      process.env.TOOOLVIBES_TOOLS_COMPARE_SOURCE,
    TOOOLVIBES_ALLOW_MOCK_DATA: process.env.TOOOLVIBES_ALLOW_MOCK_DATA,
  });

  return resolvePublicToolsSnapshot({
    policy,
    loaders: sourceLoaders,
    telemetry,
  });
});

export const getPublicToolsSnapshot = cache(async () => {
  return loadPublicToolsSnapshot();
});

export const getPublicToolsDataSource = cache(
  async (): Promise<PublicToolsDataSource | null> => {
    const snapshot = await loadPublicToolsSnapshot();
    return snapshot.source;
  },
);

export const getPublishedTools = cache(async () => {
  const snapshot = requirePublicToolsSnapshot(await loadPublicToolsSnapshot());
  return snapshot.tools;
});

export const getPublicToolViews = cache(async () => {
  const snapshot = requirePublicToolsSnapshot(await loadPublicToolsSnapshot());
  return snapshot.views;
});

export async function getFeaturedTools(limit = 4) {
  const tools = await getPublishedTools();
  return tools.filter((tool) => tool.flags.featured).slice(0, limit);
}

export async function getFeaturedToolViews(limit = 4) {
  const tools = await getPublicToolViews();
  return tools.filter((tool) => tool.featured).slice(0, limit);
}

export async function getToolSpotlightView() {
  const tools = await getPublicToolViews();
  return (
    tools.find((tool) => tool.toolOfWeek) ??
    tools.find((tool) => tool.featured) ??
    tools[0] ??
    null
  );
}

export async function getPublicToolFilterGroups() {
  return getToolFilterGroups(await getPublicToolViews());
}

export async function getAllCategories() {
  const tools = await getPublishedTools();
  return Array.from(
    new Set(tools.map((tool) => tool.taxonomy.sourceCategory)),
  ).sort((left, right) => left.localeCompare(right, "it"));
}

export async function getAllTags() {
  const tools = await getPublishedTools();

  return tools
    .flatMap((tool) => tool.taxonomy.tags)
    .reduce<Record<string, number>>((accumulator, tag) => {
      accumulator[tag] = (accumulator[tag] ?? 0) + 1;
      return accumulator;
    }, {});
}

export async function getToolBySlug(slug: string) {
  const tools = await getPublishedTools();
  return tools.find((tool) => tool.slug === slug) ?? null;
}

export async function getToolViewBySlug(slug: string) {
  const tools = await getPublicToolViews();
  return tools.find((tool) => tool.slug === slug) ?? null;
}

export async function getRelatedToolViewsBySlug(slug: string, limit = 3) {
  const tools = await getPublicToolViews();
  const current = tools.find((tool) => tool.slug === slug);

  return current ? getRelatedToolViews(current, tools, limit) : [];
}
