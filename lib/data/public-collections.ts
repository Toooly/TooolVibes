import "server-only";

import { cache } from "react";

import { isCollectionFeatured, isCollectionPublic } from "@/lib/collections/editorial";
import {
  getCollectionsForToolSlug,
  getRelatedCollections,
  resolveCuratedCollection,
  sortCollections,
} from "@/lib/collections/helpers";
import { getCollectionRepositorySnapshot } from "@/lib/data/collection-repository";
import { getPublishedTools } from "@/lib/data/public-tools";
import type { CuratedCollection, CollectionTool } from "@/lib/types/collection";
import type { ToolPublic } from "@/lib/types/tool-public";

function toCollectionTool(tool: ToolPublic): CollectionTool {
  return {
    id: tool.provenance.sourceId,
    name: tool.name,
    slug: tool.slug,
    category: tool.taxonomy.canonicalCategory ?? tool.taxonomy.sourceCategoryLabel,
    short_description_it: tool.content.summary,
    website_url: tool.urls.website,
    affiliate_url: tool.urls.affiliate,
    pricing: tool.attributes.pricing ?? undefined,
    why_here:
      tool.editorial.evidence.find((evidence) => evidence.kind === "rationale")
        ?.text,
  };
}

const loadCollections = cache(async (): Promise<CuratedCollection[]> => {
  const [tools, snapshot] = await Promise.all([
    getPublishedTools(),
    getCollectionRepositorySnapshot(),
  ]);
  const collectionTools = tools.map(toCollectionTool);

  return sortCollections(
    snapshot.collections
      .filter(isCollectionPublic)
      .map((collection) => resolveCuratedCollection(collection, collectionTools))
      .filter((collection) => collection.tool_count > 0),
  );
});

export const getCuratedCollections = cache(async () => {
  return loadCollections();
});

export const getCollectionsDataSource = cache(async () => {
  const snapshot = await getCollectionRepositorySnapshot();
  return snapshot.meta;
});

export const getFeaturedCollections = cache(async () => {
  const collections = await loadCollections();
  return collections.filter((collection) => isCollectionFeatured(collection)).slice(0, 3);
});

export const getPremiumCollections = cache(async () => {
  const collections = await loadCollections();
  return collections.filter((collection) => collection.access !== "open");
});

export const getPremiumPreviewCollections = cache(async () => {
  const collections = await loadCollections();
  return collections.filter((collection) => collection.access === "premium-preview");
});

export const getFeaturedSpecialIssue = cache(async () => {
  const collections = await loadCollections();
  return (
    collections.find(
      (collection) =>
        collection.surface === "special-issue" &&
        (collection.is_featured || collection.featured_slot === "special-issue"),
    ) ?? null
  );
});

export const getCollectionBySlug = cache(async (slug: string) => {
  const collections = await loadCollections();
  return collections.find((collection) => collection.slug === slug) ?? null;
});

export const getCollectionsByToolSlug = cache(async (toolSlug: string) => {
  const collections = await loadCollections();
  return getCollectionsForToolSlug(toolSlug, collections);
});

export const getRelatedCollectionsForSlug = cache(async (slug: string) => {
  const collections = await loadCollections();
  const current = collections.find((collection) => collection.slug === slug);

  if (!current) {
    return [];
  }

  return getRelatedCollections(current, collections);
});
