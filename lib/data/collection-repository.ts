import "server-only";

import { cache } from "react";

import {
  buildCollectionRepositorySnapshot,
  getRequestedCollectionsSource,
} from "@/lib/collections/editorial";
import { mergeCollectionsByPrecedence } from "@/lib/collections/source-transition";
import { contentCollections } from "@/lib/data/content-collections";
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

async function loadCollectionsFromSource(
  source: CollectionSourceKind,
): Promise<CuratedCollectionRecord[]> {
  switch (source) {
    case "content":
      return contentCollections;
    case "supabase":
      return getCollectionsFromSupabase();
    case "mock":
    default:
      return mockCollections;
  }
}

async function trySource(
  source: CollectionSourceKind,
  warnings: string[],
  { warnIfEmpty = source !== "content" }: { warnIfEmpty?: boolean } = {},
): Promise<CuratedCollectionRecord[] | null> {
  try {
    const collections = await loadCollectionsFromSource(source);

    if (!hasCollections(collections) && source !== "mock") {
      if (warnIfEmpty) {
        warnings.push(`Source ${source} non ha restituito collection, fallback alla successiva.`);
      }
      return null;
    }

    return collections;
  } catch (error) {
    warnings.push(
      `Source ${source} non disponibile: ${
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
      return buildCollectionRepositorySnapshot(mockCollections, {
        requestedSource,
        activeSource: "mock",
        composedSources: ["mock"],
        sourcePrecedence: ["mock"],
      });
    }

    if (requestedSource === "content") {
      const collections = await trySource("content", warnings);

      return buildCollectionRepositorySnapshot(collections ?? mockCollections, {
        requestedSource,
        activeSource: collections ? "content" : "mock",
        fallbackSource: collections ? null : "mock",
        warnings,
        composedSources: collections ? ["content"] : ["mock"],
        sourcePrecedence: ["content", "mock"],
      });
    }

    if (requestedSource === "supabase") {
      const collections = isSupabasePublicEnabled()
        ? await trySource("supabase", warnings)
        : null;

      if (!isSupabasePublicEnabled()) {
        warnings.push("Env pubbliche Supabase mancanti: fallback alla source locale.");
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

      return buildCollectionRepositorySnapshot(fallbackContent ?? mockCollections, {
        requestedSource,
        activeSource: fallbackContent ? "content" : "mock",
        fallbackSource: fallbackContent ? "content" : "mock",
        warnings,
        composedSources: fallbackContent ? ["content"] : ["mock"],
        sourcePrecedence: ["supabase", "content", "mock"],
      });
    }

    const supabaseCollections = isSupabasePublicEnabled()
      ? await trySource("supabase", warnings)
      : null;

    if (!isSupabasePublicEnabled()) {
      warnings.push("Env pubbliche Supabase mancanti: la transizione collections resta locale.");
    }

    const structuredContentCollections = await trySource("content", warnings, {
      warnIfEmpty: false,
    });
    const merged = mergeCollectionsByPrecedence({
      mockCollections,
      contentCollections: structuredContentCollections ?? [],
      supabaseCollections: supabaseCollections ?? [],
    });

    return buildCollectionRepositorySnapshot(merged.collections, {
      requestedSource,
      activeSource: merged.activeSource,
      fallbackSource:
        merged.composedSources.length > 1 ? merged.composedSources.at(-1) ?? null : null,
      warnings: [...warnings, ...merged.warnings],
      resolutionMode:
        merged.composedSources.length > 1 ? "merged-precedence" : "single-source",
      composedSources: merged.composedSources,
      sourcePrecedence: merged.transition.source_precedence,
    });
  },
);
