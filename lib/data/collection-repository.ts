import "server-only";

import { cache } from "react";

import {
  buildCollectionRepositorySnapshot,
  getRequestedCollectionsSource,
} from "@/lib/collections/editorial";
import { contentCollections } from "@/lib/data/content-collections";
import { canUseMockDataFallback } from "@/lib/data/mock-fallback";
import { mockCollections } from "@/lib/data/mock-collections";
import { isSupabasePublicEnabled } from "@/lib/supabase/public-client";
import { getCollectionsFromSupabase } from "@/lib/supabase/collection-repository";
import type {
  CollectionRepositorySnapshot,
  CollectionSourceKind,
  CuratedCollectionRecord,
} from "@/lib/types/collection";

function hasCollections(items: CuratedCollectionRecord[]) {
  return items.length > 0;
}

function canLoadMockCollectionsLocally() {
  return process.env.NODE_ENV !== "production" && canUseMockDataFallback();
}

async function loadCollectionsFromSource(
  source: CollectionSourceKind,
): Promise<CuratedCollectionRecord[]> {
  switch (source) {
    case "content":
      return contentCollections;
    case "supabase":
      return getCollectionsFromSupabase();
    case "mock":
      return mockCollections;
    default:
      return contentCollections;
  }
}

async function trySource(
  source: CollectionSourceKind,
  warnings: string[],
  { warnIfEmpty = true }: { warnIfEmpty?: boolean } = {},
): Promise<CuratedCollectionRecord[] | null> {
  try {
    const collections = await loadCollectionsFromSource(source);

    if (!hasCollections(collections)) {
      if (warnIfEmpty) {
        warnings.push(`La sorgente ${source} non ha restituito raccolte.`);
      }
      return null;
    }

    return collections;
  } catch (error) {
    warnings.push(
      `Sorgente ${source} non disponibile: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return null;
  }
}

export const getCollectionRepositorySnapshot = cache(
  async (): Promise<CollectionRepositorySnapshot> => {
    const requestedSource = getRequestedCollectionsSource();
    const warnings: string[] = [];

    if (requestedSource === "mock") {
      if (!canLoadMockCollectionsLocally()) {
        return buildCollectionRepositorySnapshot([], {
          requestedSource,
          activeSource: "mock",
          warnings: ["mock-source-disabled-for-public-v1"],
          composedSources: [],
          sourcePrecedence: ["mock"],
        });
      }

      return buildCollectionRepositorySnapshot(mockCollections, {
        requestedSource,
        activeSource: "mock",
        composedSources: ["mock"],
        sourcePrecedence: ["mock"],
      });
    }

    // V1 keeps the public catalog deterministic: content is both the default
    // and the only automatic source. Remote records remain opt-in for a later
    // migration, while mock data can only be selected locally and explicitly.
    if (requestedSource === "content" || requestedSource === "auto") {
      const collections = await trySource("content", warnings);

      return buildCollectionRepositorySnapshot(
        collections ?? [],
        {
          requestedSource,
          activeSource: "content",
          warnings,
          composedSources: collections ? ["content"] : [],
          sourcePrecedence: ["content"],
        },
      );
    }

    if (requestedSource === "supabase") {
      const collections = isSupabasePublicEnabled()
        ? await trySource("supabase", warnings)
        : null;

      if (!isSupabasePublicEnabled()) {
        warnings.push("Archivio pubblico non disponibile: uso la sorgente locale.");
      }

      if (collections) {
        return buildCollectionRepositorySnapshot(collections, {
          requestedSource,
          activeSource: "supabase",
          warnings,
          composedSources: ["supabase"],
          sourcePrecedence: ["supabase"],
        });
      }

      const fallbackContent = await trySource("content", warnings);

      return buildCollectionRepositorySnapshot(
        fallbackContent ?? [],
        {
          requestedSource,
          activeSource: fallbackContent ? "content" : "supabase",
          fallbackSource: fallbackContent ? "content" : null,
          warnings,
          composedSources: fallbackContent ? ["content"] : [],
          sourcePrecedence: ["supabase", "content"],
        },
      );
    }

    return buildCollectionRepositorySnapshot([], {
      requestedSource,
      activeSource: "content",
      warnings: ["unsupported-collection-source"],
      composedSources: [],
      sourcePrecedence: ["content"],
    });
  },
);
