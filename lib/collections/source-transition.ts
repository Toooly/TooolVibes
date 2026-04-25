import {
  normalizeCollectionRecord,
  sortCollectionRecords,
} from "@/lib/collections/editorial";
import type {
  CollectionSourceKind,
  CollectionTransitionDiff,
  CollectionTransitionEntry,
  CollectionTransitionReport,
  CuratedCollectionRecord,
} from "@/lib/types/collection";

const collectionSourcePrecedence: CollectionSourceKind[] = ["supabase", "content", "mock"];

function getRecordBySlug(
  collections: CuratedCollectionRecord[],
  source: CollectionSourceKind,
) {
  return new Map(
    collections.map((collection) => [
      collection.slug,
      normalizeCollectionRecord(collection, source),
    ]),
  );
}

function getComparableMetadata(collection: CuratedCollectionRecord) {
  return {
    title: collection.title,
    description: collection.description,
    cover_image_url: collection.cover_image_url,
    cover_kicker: collection.cover_kicker,
    rationale: collection.rationale,
    highlights: collection.highlights,
    premium_teaser: collection.premium_teaser ?? null,
    theme: collection.theme,
    audience: collection.audience,
    difficulty: collection.difficulty,
    tone: collection.tone,
    access: collection.access,
    scheduled_for: collection.scheduled_for ?? null,
    first_published_at: collection.first_published_at ?? null,
    published_at: collection.published_at ?? null,
    archived_at: collection.archived_at ?? null,
  };
}

function getComparableSlots(collection: CuratedCollectionRecord) {
  return collection.included_tools.map((slot, index) => ({
    tool_slug: slot.tool_slug,
    role: slot.role,
    note: slot.note ?? null,
    featured: slot.featured ?? false,
    order: slot.order ?? index,
  }));
}

function areEqual(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getTransitionDiff(
  mockCollection: CuratedCollectionRecord | null,
  supabaseCollection: CuratedCollectionRecord | null,
): CollectionTransitionDiff {
  if (!mockCollection || !supabaseCollection) {
    return {
      editorial_state: false,
      editorial_order: false,
      featured_slot: false,
      surface: false,
      metadata: false,
      included_tools: false,
    };
  }

  return {
    editorial_state: mockCollection.editorial_state !== supabaseCollection.editorial_state,
    editorial_order:
      (mockCollection.editorial_order ?? 999) !== (supabaseCollection.editorial_order ?? 999),
    featured_slot:
      (mockCollection.featured_slot ?? null) !== (supabaseCollection.featured_slot ?? null),
    surface: mockCollection.surface !== supabaseCollection.surface,
    metadata: !areEqual(
      getComparableMetadata(mockCollection),
      getComparableMetadata(supabaseCollection),
    ),
    included_tools: !areEqual(
      getComparableSlots(mockCollection),
      getComparableSlots(supabaseCollection),
    ),
  };
}

function getTransitionWarnings({
  mockCollection,
  contentCollection,
  supabaseCollection,
  diff,
}: {
  mockCollection: CuratedCollectionRecord | null;
  contentCollection: CuratedCollectionRecord | null;
  supabaseCollection: CuratedCollectionRecord | null;
  diff: CollectionTransitionDiff;
}) {
  const warnings: string[] = [];

  if (mockCollection && !supabaseCollection) {
    warnings.push("Presente solo nella mock source: pronta per import verso Supabase.");
  }

  if (mockCollection && supabaseCollection) {
    if (diff.editorial_state) {
      warnings.push("Stato editoriale diverso tra mock e Supabase.");
    }

    if (diff.editorial_order) {
      warnings.push("Ordering diverso tra mock e Supabase.");
    }

    if (diff.featured_slot) {
      warnings.push("Featured slot diverso tra mock e Supabase.");
    }

    if (diff.surface) {
      warnings.push("Surface diversa tra mock e Supabase.");
    }

    if (diff.metadata) {
      warnings.push("Metadata editoriali diversi tra mock e Supabase.");
    }

    if (diff.included_tools) {
      warnings.push("Tool inclusi o sequencing diversi tra mock e Supabase.");
    }
  }

  if (!mockCollection && supabaseCollection) {
    warnings.push("Collection presente solo su Supabase.");
  }

  if (!mockCollection && contentCollection && !supabaseCollection) {
    warnings.push("Collection presente solo nella content source strutturata.");
  }

  return warnings;
}

export function getCollectionSourcePrecedence() {
  return [...collectionSourcePrecedence];
}

export function buildCollectionTransitionReport({
  mockCollections,
  contentCollections,
  supabaseCollections,
}: {
  mockCollections: CuratedCollectionRecord[];
  contentCollections?: CuratedCollectionRecord[];
  supabaseCollections?: CuratedCollectionRecord[];
}): CollectionTransitionReport {
  const mockBySlug = getRecordBySlug(mockCollections, "mock");
  const contentBySlug = getRecordBySlug(contentCollections ?? [], "content");
  const supabaseBySlug = getRecordBySlug(supabaseCollections ?? [], "supabase");

  const allSlugs = new Set([
    ...mockBySlug.keys(),
    ...contentBySlug.keys(),
    ...supabaseBySlug.keys(),
  ]);

  const entries = Array.from(allSlugs)
    .map((slug) => {
      const mockCollection = mockBySlug.get(slug) ?? null;
      const contentCollection = contentBySlug.get(slug) ?? null;
      const supabaseCollection = supabaseBySlug.get(slug) ?? null;
      const diff = getTransitionDiff(mockCollection, supabaseCollection);
      const publicSource =
        collectionSourcePrecedence.find((source) => {
          if (source === "supabase") {
            return Boolean(supabaseCollection);
          }

          if (source === "content") {
            return Boolean(contentCollection);
          }

          return Boolean(mockCollection);
        }) ?? null;

      let importStatus: CollectionTransitionEntry["import_status"];

      if (mockCollection && supabaseCollection) {
        importStatus = Object.values(diff).some(Boolean) ? "conflict" : "imported";
      } else if (mockCollection) {
        importStatus = "pending-import";
      } else if (supabaseCollection) {
        importStatus = "remote-only";
      } else {
        importStatus = "content-only";
      }

      return {
        slug,
        title:
          supabaseCollection?.title ??
          contentCollection?.title ??
          mockCollection?.title ??
          slug,
        mock: mockCollection,
        content: contentCollection,
        supabase: supabaseCollection,
        public_source: publicSource,
        import_status: importStatus,
        warnings: getTransitionWarnings({
          mockCollection,
          contentCollection,
          supabaseCollection,
          diff,
        }),
        diff,
      } satisfies CollectionTransitionEntry;
    })
    .sort((left, right) => {
      const precedenceOrder = {
        conflict: 0,
        "pending-import": 1,
        imported: 2,
        "remote-only": 3,
        "content-only": 4,
      } satisfies Record<CollectionTransitionEntry["import_status"], number>;

      if (precedenceOrder[left.import_status] !== precedenceOrder[right.import_status]) {
        return precedenceOrder[left.import_status] - precedenceOrder[right.import_status];
      }

      return left.title.localeCompare(right.title);
    });

  return {
    entries,
    summary: {
      mock_total: mockCollections.length,
      content_total: contentCollections?.length ?? 0,
      supabase_total: supabaseCollections?.length ?? 0,
      pending_import: entries.filter((entry) => entry.import_status === "pending-import").length,
      imported: entries.filter((entry) => entry.import_status === "imported").length,
      conflicts: entries.filter((entry) => entry.import_status === "conflict").length,
      remote_only: entries.filter((entry) => entry.import_status === "remote-only").length,
      content_only: entries.filter((entry) => entry.import_status === "content-only").length,
      public_total: entries.filter((entry) => Boolean(entry.public_source)).length,
    },
    source_precedence: getCollectionSourcePrecedence(),
  };
}

export function mergeCollectionsByPrecedence({
  mockCollections,
  contentCollections,
  supabaseCollections,
}: {
  mockCollections: CuratedCollectionRecord[];
  contentCollections?: CuratedCollectionRecord[];
  supabaseCollections?: CuratedCollectionRecord[];
}) {
  const transition = buildCollectionTransitionReport({
    mockCollections,
    contentCollections,
    supabaseCollections,
  });

  const mergedCollections = sortCollectionRecords(
    transition.entries
      .map((entry) => {
        switch (entry.public_source) {
          case "supabase":
            return entry.supabase;
          case "content":
            return entry.content;
          case "mock":
            return entry.mock;
          default:
            return null;
        }
      })
      .filter((collection): collection is CuratedCollectionRecord => Boolean(collection)),
  );

  const composedSources = transition.source_precedence.filter((source) =>
    transition.entries.some((entry) => entry.public_source === source),
  );

  const warnings: string[] = [];

  if (composedSources.length > 1) {
    warnings.push(
      "Source collections in transizione: Supabase prevale sugli slug gia` migrati, mentre le source locali restano fallback per i restanti.",
    );
  }

  if (transition.summary.conflicts > 0) {
    warnings.push(
      `${transition.summary.conflicts} collection hanno drift tra mock e Supabase: il pubblico usa la versione Supabase finche' il conflitto non viene riallineato.`,
    );
  }

  return {
    collections: mergedCollections,
    transition,
    composedSources,
    activeSource: composedSources[0] ?? "mock",
    warnings,
  };
}
