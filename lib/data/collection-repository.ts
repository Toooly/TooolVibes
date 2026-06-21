import "server-only";

import { cache } from "react";

import {
  buildCollectionRepositorySnapshot,
  getRequestedCollectionsSource,
} from "@/lib/collections/editorial";
import { mergeCollectionsByPrecedence } from "@/lib/collections/source-transition";
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
        warnings.push(`La sorgente ${source} non ha restituito raccolte: passo alla sorgente successiva.`);
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
    const mockFallbackEnabled = canUseMockDataFallback();

    if (requestedSource === "mock") {
      if (!mockFallbackEnabled) {
        return buildCollectionRepositorySnapshot([], {
          requestedSource,
          activeSource: "mock",
          warnings: ["mock-source-disabled-in-production"],
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

    if (requestedSource === "content") {
      const collections = await trySource("content", warnings);

      return buildCollectionRepositorySnapshot(
        collections ?? (mockFallbackEnabled ? mockCollections : []),
        {
        requestedSource,
        activeSource: collections ? "content" : mockFallbackEnabled ? "mock" : "content",
        fallbackSource: collections ? null : mockFallbackEnabled ? "mock" : null,
        warnings,
        composedSources: collections ? ["content"] : mockFallbackEnabled ? ["mock"] : [],
        sourcePrecedence: mockFallbackEnabled ? ["content", "mock"] : ["content"],
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
        fallbackContent ?? (mockFallbackEnabled ? mockCollections : []),
        {
        requestedSource,
        activeSource: fallbackContent ? "content" : mockFallbackEnabled ? "mock" : "supabase",
        fallbackSource: fallbackContent ? "content" : mockFallbackEnabled ? "mock" : null,
        warnings,
        composedSources: fallbackContent ? ["content"] : mockFallbackEnabled ? ["mock"] : [],
        sourcePrecedence: mockFallbackEnabled
          ? ["supabase", "content", "mock"]
          : ["supabase", "content"],
        },
      );
    }

    const supabaseCollections = isSupabasePublicEnabled()
      ? await trySource("supabase", warnings)
      : null;

    if (!isSupabasePublicEnabled()) {
      warnings.push("Archivio pubblico non disponibile: la transizione delle raccolte resta locale.");
    }

    const structuredContentCollections = await trySource("content", warnings, {
      warnIfEmpty: false,
    });
    const merged = mergeCollectionsByPrecedence({
      mockCollections: mockFallbackEnabled ? mockCollections : [],
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
