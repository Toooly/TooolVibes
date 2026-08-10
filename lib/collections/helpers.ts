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
  "Course creators": "Per formatori, consulenti e team L&D che pubblicano prodotti formativi",
  "Agency operators": "Per founder di agenzie digitali, AI o growth con team 2-8 persone",
  "Indie hackers": "Per chi sperimenta AI senza budget o è in fase stealth / early stage",
  "Sales and growth teams": "Per sales lead, growth marketer e founder B2B che generano lead qualificati",
};

const themeMeta: Record<CollectionTheme, string> = {
  "founder-stack": "Kit founder",
  "design-sprint": "Design sprint",
  "creator-video": "Creator video",
  "research-synthesis": "Ricerca e sintesi",
  "indie-launch": "Lancio indie",
  "video-training": "Formazione strutturata",
  "agency-operating": "Operatività agenzia",
  "free-budget": "AI a basso costo",
  "lead-generation": "Lead generation B2B",
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

/** Whether the collection has at least one declared stack variant. */
export function hasStackVariants(collection: CuratedCollection) {
  return Boolean(collection.stack_variants && collection.stack_variants.length > 0);
}

/** Returns ordered CORE tool slugs in the collection. */
export function getCollectionCoreToolSlugs(collection: CuratedCollection) {
  return collection.included_tools
    .filter((slot) => slot.is_core)
    .sort((a, b) => a.order - b.order)
    .map((slot) => slot.tool.slug);
}

/** Returns ordered OPTIONAL tool slugs in the collection. */
export function getCollectionOptionalToolSlugs(collection: CuratedCollection) {
  return collection.included_tools
    .filter((slot) => slot.is_optional)
    .sort((a, b) => a.order - b.order)
    .map((slot) => slot.tool.slug);
}

/** Returns ordered ALTERNATIVE tool slugs in the collection. */
export function getCollectionAlternativeToolSlugs(collection: CuratedCollection) {
  return collection.included_tools
    .filter((slot) => slot.is_alternative)
    .sort((a, b) => a.order - b.order)
    .map((slot) => slot.tool.slug);
}

/** Compact workflow preview as a string: "Jenni → Meku → VibeCode". */
export function getCollectionWorkflowPreview(collection: CuratedCollection) {
  return getCollectionCoreToolSlugs(collection)
    .map((slug) => collection.included_tools.find((slot) => slot.tool.slug === slug)?.tool.name ?? slug);
}

/** Returns a short, compact, 1-line theme/area label for the collection. */
export function getCollectionAreaLabel(collection: CuratedCollection) {
  switch (collection.theme) {
    case "founder-stack":
      return "Founder stack";
    case "design-sprint":
      return "Design sprint";
    case "creator-video":
      return "Creator video";
    case "research-synthesis":
      return "Content marketing";
    case "indie-launch":
      return "Operations";
    default:
      return "Raccolta";
  }
}

/** Returns a short, compact, 1-line audience label. */
export function getCollectionAudienceShort(collection: CuratedCollection) {
  return collection.audience;
}

/** Cost band, normalized to a human-readable italian string. */
export function getCollectionCostLabel(collection: CuratedCollection) {
  const band = collection.stack_meta?.monthly_cost_band;
  if (!band) return null;
  switch (band) {
    case "€0":
      return "€0/mese";
    case "€0-30":
      return "€0–30/mese";
    case "€30-100":
      return "€30–100/mese";
    case "€100-300":
      return "€100–300/mese";
    case "€300+":
      return "€300+/mese";
    case "pricing-requires-quote":
      return "Su preventivo";
    default:
      return band;
  }
}

/** Returns the difficulty label, falling back to the legacy difficulty field. */
export function getCollectionDifficultyShort(collection: CuratedCollection) {
  return (
    collection.stack_meta?.difficulty_label ??
    getCollectionDifficultyLabel(collection.difficulty)
  );
}

/** Returns a human-readable setup-time string. */
export function getCollectionSetupLabel(collection: CuratedCollection) {
  return collection.stack_meta?.setup_time ?? null;
}

/** Returns the lead tool (first CORE or featured) for visual emphasis. */
export function getCollectionLeadTool(collection: CuratedCollection) {
  return (
    collection.featured_tool_slot?.tool ??
    collection.included_tools.find((slot) => slot.is_core)?.tool ??
    collection.included_tools[0]?.tool ??
    null
  );
}

/** Returns the slug of the lead tool. */
export function getCollectionLeadToolSlug(collection: CuratedCollection) {
  return getCollectionLeadTool(collection)?.slug ?? null;
}
