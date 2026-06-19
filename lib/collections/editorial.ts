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
    label: "Bozza",
    description: "Pronta per essere rifinita ma non ancora esposta pubblicamente.",
  },
  scheduled: {
    label: "Programmata",
    description: "Impostata per una pubblicazione futura.",
  },
  published: {
    label: "Pubblicata",
    description: "Visibile nelle pagine pubbliche.",
  },
  featured: {
    label: "In evidenza",
    description: "Pubblicata con un ruolo più forte nelle aree curate.",
  },
  archived: {
    label: "Archiviata",
    description: "Tenuta come memoria editoriale, fuori dal flusso pubblico attivo.",
  },
};

const surfaceMeta: Record<CollectionSurface, { label: string; description: string }> = {
  collection: {
    label: "Raccolta",
    description: "Una raccolta curatoriale pensata per orientare la scelta.",
  },
  "special-issue": {
    label: "Speciale",
    description: "Una selezione più ricca, pensata per spiegare meglio uno scenario.",
  },
};

const featuredSlotMeta: Record<CollectionFeaturedSlot, string> = {
  "home-hero": "Apertura home",
  "home-secondary": "Sezione home",
  "archive-strip": "Fascia archivio",
  "special-issue": "Speciale",
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
      message: "Raccolta senza tool inclusi.",
    });
  }

  if (collection.editorial_state === "scheduled" && !collection.scheduled_for) {
    issues.push({
      level: "warning",
      message: "Raccolta programmata senza data di pubblicazione.",
    });
  }

  if (
    (collection.editorial_state === "published" || collection.editorial_state === "featured") &&
    !collection.published_at
  ) {
    issues.push({
      level: "warning",
      message: "Raccolta pubblica senza data di pubblicazione esplicita.",
    });
  }

  if (collection.editorial_state === "archived" && !collection.archived_at) {
    issues.push({
      level: "warning",
      message: "Raccolta archiviata senza data di archiviazione.",
    });
  }

  if (collection.editorial_state === "featured" && !collection.featured_slot) {
    issues.push({
      level: "warning",
      message: "Raccolta in evidenza senza spazio dedicato.",
    });
  }

  if (collection.surface === "special-issue" && collection.tone !== "special-issue") {
    issues.push({
      level: "warning",
      message: "Le raccolte speciali dovrebbero usare il tono dedicato.",
    });
  }

  if (collection.surface !== "special-issue" && collection.featured_slot === "special-issue") {
    issues.push({
      level: "warning",
      message: "Spazio speciale usato fuori da una raccolta speciale.",
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
      message: `Tool duplicati nella raccolta: ${repeatedTools.join(", ")}.`,
    });
  }

  if (collection.highlights.length === 0) {
    issues.push({
      level: "warning",
      message: "Raccolta senza punti chiave editoriali leggibili.",
    });
  }

  if (collection.surface === "special-issue" && !collection.premium_teaser) {
    issues.push({
      level: "warning",
      message: "Raccolta speciale senza anteprima premium o contesto dedicato.",
    });
  }

  if (collection.access !== "open" && !collection.premium_teaser) {
    issues.push({
      level: "warning",
      message: "Raccolta premium senza anteprima leggibile per il pubblico.",
    });
  }

  if (collection.advanced_issue && collection.surface !== "special-issue") {
    issues.push({
      level: "warning",
      message: "Il formato speciale avanzato dovrebbe vivere solo in una raccolta speciale.",
    });
  }

  if (advancedIssue && advancedIssue.blocks.length < 4) {
    issues.push({
      level: "warning",
      message: "Raccolta speciale avanzata con pochi blocchi: rischia di sembrare una raccolta standard estesa.",
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
        message: `Raccolta avanzata con riferimenti tool fuori dalla raccolta: ${Array.from(new Set(missingSlugs)).join(", ")}.`,
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
            message: "Slug duplicato nel repository raccolte.",
          });
        }

        const orderingKey = `${collection.editorial_state}:${collection.editorial_order ?? 999}`;

        if ((orderingCounts[orderingKey] ?? 0) > 1) {
          issuesMap[collection.slug]?.push({
            level: "warning",
            message: "Ordine condiviso con un'altra raccolta nello stesso stato editoriale.",
          });
        }

        if (
          collection.featured_slot &&
          (featuredSlotCounts[collection.featured_slot] ?? 0) > 1
        ) {
          issuesMap[collection.slug]?.push({
            level: "warning",
            message: "Spazio in evidenza condiviso con un'altra raccolta.",
          });
        }
      }

      return issuesMap;
    })(),
  };
}
