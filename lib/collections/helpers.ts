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
  CuratedCollection,
  CuratedCollectionRecord,
  ResolvedCollectionToolSlot,
} from "@/lib/types/collection";
import type { ToolRecord } from "@/lib/types/tool";

const toneMeta: Record<CollectionTone, { label: string; description: string }> = {
  "starter-stack": {
    label: "Stack essenziale",
    description: "Una sequenza corta per partire bene senza accumulare rumore.",
  },
  "focused-bundle": {
    label: "Bundle compatto",
    description: "Una raccolta pi? stretta, utile quando il task ? molto chiaro.",
  },
  "editorial-picks": {
    label: "Scelta curatoriale",
    description: "Una lettura curatoriale pi? orientata al fit che alla completezza.",
  },
  "special-issue": {
    label: "Special issue",
    description: "Una superficie pi? densa, pensata per una lettura premium davvero distinta.",
  },
};

const difficultyMeta: Record<CollectionDifficulty, string> = {
  starter: "Partenza facile",
  growing: "Gi? operativo",
  advanced: "Pi? intenzionale",
};

const accessMeta: Record<
  CollectionAccess,
  { label: string; subtleLabel: string; description: string }
> = {
  open: {
    label: "Collection aperta",
    subtleLabel: "Aperta",
    description: "Accesso pieno alla collection.",
  },
  "premium-preview": {
    label: "Anteprima premium",
    subtleLabel: "Anteprima",
    description: "Una parte della lettura resta visibile, mentre il livello pi? denso ? gi? impostato nel layer member.",
  },
  premium: {
    label: "Member issue",
    subtleLabel: "Riservata",
    description: "Issue member pi? densa, leggibile in teaser e pensata per una lettura completa distinta dalla parte open.",
  },
};

const audienceMeta: Record<CollectionAudience, string> = {
  "Solo founders": "Per founder indipendenti e builder snelli",
  "Designer-builders": "Per chi deve passare da concept a superficie navigabile",
  "Creator teams": "Per creator e team contenuto con workflow visuale",
  "Research-led teams": "Per chi trasforma orientamento e insight in conoscenza riusabile",
  "Indie launchers": "Per lanci piccoli ma molto curati",
};

const themeMeta: Record<CollectionTheme, string> = {
  "founder-stack": "Stack founder",
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
  tools: ToolRecord[],
): CuratedCollection {
  const slots = collection.included_tools
    .map((slot, index) => {
      const tool = tools.find((item) => item.slug === slot.tool_slug);

      if (!tool) {
        return null;
      }

      return {
        ...slot,
        order: slot.order ?? index,
        tool,
      } satisfies ResolvedCollectionToolSlot;
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
