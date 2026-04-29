import type {
  AdvancedSpecialIssueBlock,
  CollectionEditorialState,
  CollectionFeaturedSlot,
  CollectionRepositoryResolutionMode,
  CollectionRepositorySnapshot,
  CollectionSourceKind,
  CollectionSourceMode,
  CollectionSurface,
  CollectionValidationIssue,
  CuratedCollectionRecord,
} from "@/lib/types/collection";
import { hasAdvancedSpecialIssue } from "@/lib/collections/format";

const editorialStateMeta: Record<
  CollectionEditorialState,
  { label: string; description: string }
> = {
  draft: {
    label: "Draft",
    description: "Pronta per essere rifinita ma non ancora esposta pubblicamente.",
  },
  scheduled: {
    label: "Scheduled",
    description: "Impostata per una pubblicazione futura o per un issue prossimo.",
  },
  published: {
    label: "Published",
    description: "Visibile nelle superfici pubbliche standard.",
  },
  featured: {
    label: "Featured",
    description: "Pubblicata con un ruolo pi? forte nelle superfici curate.",
  },
  archived: {
    label: "Archived",
    description: "Tenuta come memoria editoriale, fuori dal flusso pubblico attivo.",
  },
};

const surfaceMeta: Record<CollectionSurface, { label: string; description: string }> = {
  collection: {
    label: "Collection",
    description: "Una raccolta curatoriale dentro il flusso prodotto standard.",
  },
  "special-issue": {
    label: "Special issue",
    description: "Una deep curation pi? ricca, pensata per alzare il valore percepito.",
  },
};

const featuredSlotMeta: Record<CollectionFeaturedSlot, string> = {
  "home-hero": "Home hero",
  "home-secondary": "Home secondary",
  "archive-strip": "Archive strip",
  "special-issue": "Special issue",
};

export function getCollectionEditorialStateMeta(state: CollectionEditorialState) {
  return editorialStateMeta[state];
}

export function getCollectionSurfaceMeta(surface: CollectionSurface) {
  return surfaceMeta[surface];
}

export function getCollectionFeaturedSlotLabel(slot: CollectionFeaturedSlot) {
  return featuredSlotMeta[slot];
}

export function getRequestedCollectionsSource(): CollectionSourceMode {
  const value = process.env.TOOOLVIBES_COLLECTIONS_SOURCE?.trim().toLowerCase();

  if (value === "mock" || value === "content" || value === "supabase") {
    return value;
  }

  return "auto";
}

export function isCollectionPublic(collection: CuratedCollectionRecord) {
  return collection.editorial_state === "published" || collection.editorial_state === "featured";
}

export function isCollectionFeatured(collection: CuratedCollectionRecord) {
  return collection.editorial_state === "featured" || Boolean(collection.featured_slot);
}

export function normalizeCollectionRecord(
  collection: CuratedCollectionRecord,
  sourceKind: CollectionSourceKind,
): CuratedCollectionRecord {
  return {
    ...collection,
    source_kind: collection.source_kind ?? sourceKind,
    featured_slot: collection.featured_slot ?? null,
    editorial_order: collection.editorial_order ?? 999,
    scheduled_for: collection.scheduled_for ?? null,
    first_published_at: collection.first_published_at ?? null,
    published_at: collection.published_at ?? null,
    archived_at: collection.archived_at ?? null,
    included_tools: [...collection.included_tools].sort(
      (left, right) => (left.order ?? 999) - (right.order ?? 999),
    ),
  };
}

export function validateCollectionRecord(
  collection: CuratedCollectionRecord,
): CollectionValidationIssue[] {
  const issues: CollectionValidationIssue[] = [];
  const issueToolSlugs = new Set(collection.included_tools.map((slot) => slot.tool_slug));
  const advancedIssue = hasAdvancedSpecialIssue(collection) ? collection.advanced_issue : undefined;

  if (collection.included_tools.length === 0) {
    issues.push({
      level: "error",
      message: "Collection senza tool inclusi.",
    });
  }

  if (collection.editorial_state === "scheduled" && !collection.scheduled_for) {
    issues.push({
      level: "warning",
      message: "Collection scheduled senza `scheduled_for`.",
    });
  }

  if (
    (collection.editorial_state === "published" || collection.editorial_state === "featured") &&
    !collection.published_at
  ) {
    issues.push({
      level: "warning",
      message: "Collection pubblica senza `published_at` esplicito.",
    });
  }

  if (collection.editorial_state === "archived" && !collection.archived_at) {
    issues.push({
      level: "warning",
      message: "Collection archiviata senza `archived_at`.",
    });
  }

  if (collection.editorial_state === "featured" && !collection.featured_slot) {
    issues.push({
      level: "warning",
      message: "Collection featured senza `featured_slot`.",
    });
  }

  if (collection.surface === "special-issue" && collection.tone !== "special-issue") {
    issues.push({
      level: "warning",
      message: "Le special issue dovrebbero usare il tone `special-issu?.",
    });
  }

  if (collection.surface !== "special-issue" && collection.featured_slot === "special-issue") {
    issues.push({
      level: "warning",
      message: "Featured slot `special-issu? usato fuori da una special issue.",
    });
  }

  const duplicateToolSlugs = collection.included_tools.reduce<Record<string, number>>(
    (accumulator, slot) => {
      accumulator[slot.tool_slug] = (accumulator[slot.tool_slug] ?? 0) + 1;
      return accumulator;
    },
    {},
  );

  const repeatedTools = Object.entries(duplicateToolSlugs)
    .filter(([, count]) => count > 1)
    .map(([slug]) => slug);

  if (repeatedTools.length > 0) {
    issues.push({
      level: "error",
      message: `Tool duplicati nella collection: ${repeatedTools.join(", ")}.`,
    });
  }

  if (collection.highlights.length === 0) {
    issues.push({
      level: "warning",
      message: "Collection senza highlights editoriali leggibili.",
    });
  }

  if (collection.surface === "special-issue" && !collection.premium_teaser) {
    issues.push({
      level: "warning",
      message: "Special issue senza premium teaser o framing evolutivo.",
    });
  }

  if (collection.access !== "open" && !collection.premium_teaser) {
    issues.push({
      level: "warning",
      message: "Surface premium o preview senza teaser leggibile per il pubblico.",
    });
  }

  if (collection.advanced_issue && collection.surface !== "special-issue") {
    issues.push({
      level: "warning",
      message: "Il formato advanced special issue dovrebbe vivere solo su `special-issu?.",
    });
  }

  if (advancedIssue && advancedIssue.blocks.length < 4) {
    issues.push({
      level: "warning",
      message: "Advanced special issue con pochi blocchi: rischia di sembrare una collection standard estesa.",
    });
  }

  if (advancedIssue) {
    const referencedSlugs = advancedIssue.blocks.flatMap((block) =>
      getReferencedIssueToolSlugs(block),
    );
    const missingSlugs = referencedSlugs.filter((slug) => !issueToolSlugs.has(slug));

    if (missingSlugs.length > 0) {
      issues.push({
        level: "warning",
        message: `Issue avanzata con riferimenti tool fuori dalla collection: ${Array.from(new Set(missingSlugs)).join(", ")}.`,
      });
    }
  }

  return issues;
}

function getReferencedIssueToolSlugs(block: AdvancedSpecialIssueBlock) {
  if (block.type === "curated-picks") {
    return block.tool_moments.map((tool) => tool.tool_slug);
  }

  if (block.type === "compare-insight") {
    return block.compare.compared_tool_slugs;
  }

  if (block.type === "workflow") {
    return block.steps.map((step) => step.tool_slug).filter(Boolean) as string[];
  }

  return [];
}

export function sortCollectionRecords(collections: CuratedCollectionRecord[]) {
  return [...collections].sort((left, right) => {
    const leftFeatured = isCollectionFeatured(left);
    const rightFeatured = isCollectionFeatured(right);

    if (leftFeatured !== rightFeatured) {
      return leftFeatured ? -1 : 1;
    }

    if ((left.editorial_order ?? 999) !== (right.editorial_order ?? 999)) {
      return (left.editorial_order ?? 999) - (right.editorial_order ?? 999);
    }

    return right.updated_at.localeCompare(left.updated_at);
  });
}

export function buildCollectionRepositorySnapshot(
  collections: CuratedCollectionRecord[],
  {
    requestedSource,
    activeSource,
    fallbackSource = null,
    warnings = [],
    resolutionMode = "single-source",
    composedSources,
    sourcePrecedence,
  }: {
    requestedSource: CollectionSourceMode;
    activeSource: CollectionSourceKind;
    fallbackSource?: CollectionSourceKind | null;
    warnings?: string[];
    resolutionMode?: CollectionRepositoryResolutionMode;
    composedSources?: CollectionSourceKind[];
    sourcePrecedence?: CollectionSourceKind[];
  },
): CollectionRepositorySnapshot {
  const normalizedCollections = sortCollectionRecords(
    collections.map((collection) => normalizeCollectionRecord(collection, activeSource)),
  );

  return {
    collections: normalizedCollections,
    meta: {
      requested_source: requestedSource,
      active_source: activeSource,
      fallback_source: fallbackSource,
      warnings,
      loaded_at: new Date().toISOString(),
      resolution_mode: resolutionMode,
      composed_sources: composedSources,
      source_precedence: sourcePrecedence,
    },
    validation: (() => {
      const issuesMap = Object.fromEntries(
        normalizedCollections.map((collection) => [
          collection.slug,
          validateCollectionRecord(collection),
        ]),
      ) as Record<string, CollectionValidationIssue[]>;

      const slugCounts = normalizedCollections.reduce<Record<string, number>>((accumulator, collection) => {
        accumulator[collection.slug] = (accumulator[collection.slug] ?? 0) + 1;
        return accumulator;
      }, {});

      const orderingCounts = normalizedCollections.reduce<Record<string, number>>((accumulator, collection) => {
        const key = `${collection.editorial_state}:${collection.editorial_order ?? 999}`;
        accumulator[key] = (accumulator[key] ?? 0) + 1;
        return accumulator;
      }, {});

      const featuredSlotCounts = normalizedCollections.reduce<Record<string, number>>((accumulator, collection) => {
        if (!collection.featured_slot) {
          return accumulator;
        }

        accumulator[collection.featured_slot] = (accumulator[collection.featured_slot] ?? 0) + 1;
        return accumulator;
      }, {});

      for (const collection of normalizedCollections) {
        if ((slugCounts[collection.slug] ?? 0) > 1) {
          issuesMap[collection.slug]?.push({
            level: "error",
            message: "Slug duplicato nel repository collections.",
          });
        }

        const orderingKey = `${collection.editorial_state}:${collection.editorial_order ?? 999}`;

        if ((orderingCounts[orderingKey] ?? 0) > 1) {
          issuesMap[collection.slug]?.push({
            level: "warning",
            message: "Ordering condiviso con un'altra collection nello stesso stato editoriale.",
          });
        }

        if (
          collection.featured_slot &&
          (featuredSlotCounts[collection.featured_slot] ?? 0) > 1
        ) {
          issuesMap[collection.slug]?.push({
            level: "warning",
            message: "Featured slot condiviso con un'altra collection.",
          });
        }
      }

      return issuesMap;
    })(),
  };
}
