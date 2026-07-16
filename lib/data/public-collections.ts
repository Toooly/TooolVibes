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
import { getLegacyEditorialPublishedTools } from "@/lib/data/legacy-editorial-tool-repository";
import type { CuratedCollection } from "@/lib/types/collection";

const loadCollections = cache(async (): Promise<CuratedCollection[]> => {
  const [tools, snapshot] = await Promise.all([
    getLegacyEditorialPublishedTools(),
    getCollectionRepositorySnapshot(),
  ]);

  return sortCollections(
    snapshot.collections
      .filter(isCollectionPublic)
      .map((collection) => resolveCuratedCollection(collection, tools))
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
