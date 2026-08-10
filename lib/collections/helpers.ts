import {
  isCollectionFeatured,
  isCollectionPublic,
} from "@/lib/collections/editorial";
import type {
  CollectionAccess,
  CollectionAudience,
  CollectionDifficulty,
  CollectionTheme,
  CollectionTone,
  CollectionTool,
  CuratedCollection,
  CuratedCollectionRecord,
  ResolvedCollectionToolSlot,
} from "@/lib/types/collection";

const toneMeta: Record<CollectionTone, { label: string; description: string }> = {
  "starter-stack": {
    label: "Kit essenziale",
    description: "Una sequenza corta per partire bene senza accumulare rumore.",
  },
  "focused-bundle": {
    label: "Percorso compatto",
    description: "Una raccolta più stretta, utile quando l'obiettivo è già chiaro.",
  },
  "editorial-picks": {
    label: "Percorso guidato",
    description: "Un percorso più orientato all'uso giusto che alla completezza.",
  },
  "special-issue": {
    label: "Speciale",
    description: "Una raccolta più ricca, pensata per guidare la scelta con più contesto.",
  },
};

const difficultyMeta: Record<CollectionDifficulty, string> = {
  starter: "Partenza facile",
  growing: "Già operativo",
  advanced: "Più intenzionale",
};

const accessMeta: Record<
  CollectionAccess,
  { label: string; subtleLabel: string; description: string }
> = {
  open: {
    label: "Raccolta aperta",
    subtleLabel: "Aperta",
    description: "Accesso pieno alla raccolta.",
  },
  "premium-preview": {
    label: "Anteprima premium",
    subtleLabel: "Anteprima",
    description: "Una parte della raccolta resta visibile, mentre la versione completa è riservata agli utenti iscritti.",
  },
  premium: {
    label: "Raccolta riservata",
    subtleLabel: "Riservata",
    description: "Raccolta più approfondita, leggibile in anteprima e pensata per una consultazione completa riservata.",
  },
};

const audienceMeta: Record<CollectionAudience, string> = {
  "Solo founders": "Per founder indipendenti e builder snelli",
  "Designer-builders": "Per chi deve passare da idea a prototipo navigabile",
  "Creator teams": "Per creator e team contenuto con flussi visuali",
  "Research-led teams": "Per chi trasforma orientamento e insight in conoscenza riusabile",
  "Indie launchers": "Per lanci piccoli ma molto curati",
};

const themeMeta: Record<CollectionTheme, string> = {
  "founder-stack": "Kit founder",
  "design-sprint": "Design sprint",
  "creator-video": "Creator video",
  "research-synthesis": "Ricerca e sintesi",
  "indie-launch": "Lancio indie",
};

export function getCollectionToneMeta(tone: CollectionTone) {
  return toneMeta[tone];
}

export function getCollectionDifficultyLabel(difficulty: CollectionDifficulty) {
  return difficultyMeta[difficulty];
}

export function getCollectionAccessMeta(access: CollectionAccess) {
  return accessMeta[access];
}

export function getCollectionAudienceDescription(audience: CollectionAudience) {
  return audienceMeta[audience];
}

export function getCollectionThemeLabel(theme: CollectionTheme) {
  return themeMeta[theme];
}

export function resolveCuratedCollection(
  collection: CuratedCollectionRecord,
  tools: CollectionTool[],
): CuratedCollection {
  const slots = collection.included_tools
    .map((slot, index) => {
      const tool = tools.find((item) => item.slug === slot.tool_slug);

      if (!tool) {
        return null;
      }

      const status = slot.status ?? "core";
      const resolved: ResolvedCollectionToolSlot = {
        ...slot,
        order: slot.order ?? index,
        tool,
        is_core: status === "core",
        is_alternative: status === "alternative",
        is_optional: status === "optional",
      };

      return resolved;
    })
    .filter((slot): slot is ResolvedCollectionToolSlot => Boolean(slot))
    .sort((left, right) => left.order - right.order);

  const featuredToolSlot = slots.find((slot) => slot.featured) ?? slots[0] ?? null;
  const remainingSlots = slots.filter((slot) => slot.tool.slug !== featuredToolSlot?.tool.slug);

  return {
    ...collection,
    included_tools: slots,
    tool_count: slots.length,
    featured_tool_slot: featuredToolSlot,
    remaining_slots: remainingSlots,
    is_featured: isCollectionFeatured(collection),
    is_public: isCollectionPublic(collection),
    source_kind: collection.source_kind ?? "mock",
  };
}

export function sortCollections(collections: CuratedCollection[]) {
  return [...collections].sort((left, right) => {
    if (left.is_featured !== right.is_featured) {
      return left.is_featured ? -1 : 1;
    }

    if ((left.editorial_order ?? 999) !== (right.editorial_order ?? 999)) {
      return (left.editorial_order ?? 999) - (right.editorial_order ?? 999);
    }

    return right.updated_at.localeCompare(left.updated_at);
  });
}

export function getRelatedCollections(
  current: CuratedCollection,
  collections: CuratedCollection[],
  limit = 2,
) {
  return collections
    .filter((collection) => collection.slug !== current.slug)
    .map((collection) => {
      let score = 0;

      if (collection.theme === current.theme) {
        score += 3;
      }

      if (collection.audience === current.audience) {
        score += 2;
      }

      if (collection.tone === current.tone) {
        score += 1;
      }

      if (collection.surface === current.surface) {
        score += 2;
      }

      const overlappingTools = collection.included_tools.filter((slot) =>
        current.included_tools.some((currentSlot) => currentSlot.tool.slug === slot.tool.slug),
      ).length;

      return {
        collection,
        score: score + overlappingTools,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.collection);
}

export function getCollectionsForToolSlug(
  toolSlug: string,
  collections: CuratedCollection[],
  limit = 3,
) {
  return collections
    .filter((collection) => collection.included_tools.some((slot) => slot.tool.slug === toolSlug))
    .slice(0, limit);
}

export function getCollectionPreviewTools(collection: CuratedCollection, limit = 3) {
  return collection.included_tools.slice(0, limit).map((slot) => slot.tool.name);
}

/** Returns the CORE slots of a Collection in order. */
export function getCollectionCoreSlots(collection: CuratedCollection) {
  return collection.included_tools.filter((slot) => slot.is_core);
}

/** Returns the OPTIONAL slots of a Collection in order. */
export function getCollectionOptionalSlots(collection: CuratedCollection) {
  return collection.included_tools.filter((slot) => slot.is_optional);
}

/** Returns the ALTERNATIVE slots of a Collection in order. */
export function getCollectionAlternativeSlots(collection: CuratedCollection) {
  return collection.included_tools.filter((slot) => slot.is_alternative);
}

/** Resolved variant by label. Returns null when not declared. */
export function getCollectionVariant(
  collection: CuratedCollection,
  label: "lean" | "balanced" | "advanced",
) {
  return collection.stack_variants?.find((variant) => variant.label === label) ?? null;
}
