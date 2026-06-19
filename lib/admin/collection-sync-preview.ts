import {
  getCollectionTransitionDiffItems,
  getCollectionTransitionReviewState,
  getCollectionTransitionSeverity,
} from "@/lib/admin/collection-review";
import type {
  CollectionReadinessSummary,
  CollectionSyncPreview,
  CollectionSyncPreviewFieldChange,
  CollectionSyncPreviewRisk,
  CollectionSyncPreviewSlotChange,
  CollectionTransitionEntry,
  CollectionToolSlot,
  CuratedCollectionRecord,
} from "@/lib/types/collection";

function formatSlotSnapshot(slot: CollectionToolSlot | null, index: number | null) {
  if (!slot) {
    return "assente";
  }

  const parts = [
    `#${String((index ?? slot.order ?? 0) + 1).padStart(2, "0")}`,
    slot.role,
  ];

  if (slot.featured) {
    parts.push("tool guida");
  }

  if (slot.note) {
    parts.push(slot.note);
  }

  return parts.join(" · ");
}

function normalizeSlots(collection: CuratedCollectionRecord | null) {
  return (collection?.included_tools ?? [])
    .map((slot, index) => ({
      ...slot,
      order: slot.order ?? index,
    }))
    .sort((left, right) => left.order - right.order);
}

function buildFieldSummary(change: CollectionSyncPreviewFieldChange) {
  switch (change.key) {
    case "editorial_order":
      return "Riallineerebbe l'ordine editoriale dell'archivio reale alla sorgente locale.";
    case "featured_slot":
      return "Riallineerebbe lo spazio in evidenza dell'archivio reale al taglio locale.";
    case "metadata":
      return "Toccherebbe copy e taglio editoriale: meglio leggerlo come decisione, non come sincronizzazione automatica.";
    case "editorial_state":
      return "Cambierebbe lo stato editoriale pubblico: fuori da un allineamento prudente.";
    case "surface":
      return "Cambierebbe il tipo di superficie curatoriale: richiede decisione esplicita.";
    case "included_tools":
      return "Cambierebbe i tool inclusi o la sequenza della raccolta.";
    default:
      return "Differenza rilevata tra sorgente locale e archivio reale.";
  }
}

function toFieldChange(entry: CollectionTransitionEntry) {
  return getCollectionTransitionDiffItems(entry).map<CollectionSyncPreviewFieldChange>((item) => {
    const safeField = item.key === "editorial_order" || item.key === "featured_slot";

    return {
      key: item.key,
      label: item.label,
      kind: safeField ? "safe" : "editorial",
      risk:
        item.key === "editorial_order" || item.key === "featured_slot"
          ? "low"
          : item.key === "metadata"
            ? "medium"
            : "high",
      current_value: item.supabase_value,
      legacy_value: item.mock_value,
      target_value: item.mock_value,
      summary: buildFieldSummary({
        key: item.key,
        label: item.label,
        kind: safeField ? "safe" : "editorial",
        risk:
          item.key === "editorial_order" || item.key === "featured_slot"
            ? "low"
            : item.key === "metadata"
              ? "medium"
              : "high",
        current_value: item.supabase_value,
        legacy_value: item.mock_value,
        target_value: item.mock_value,
        summary: "",
      }),
    };
  });
}

function buildSlotChanges(entry: CollectionTransitionEntry): CollectionSyncPreviewSlotChange[] {
  if (!entry.mock || !entry.supabase || !entry.diff.included_tools) {
    return [];
  }

  const mockSlots = normalizeSlots(entry.mock);
  const supabaseSlots = normalizeSlots(entry.supabase);
  const mockBySlug = new Map(mockSlots.map((slot, index) => [slot.tool_slug, { slot, index }]));
  const supabaseBySlug = new Map(
    supabaseSlots.map((slot, index) => [slot.tool_slug, { slot, index }]),
  );
  const allSlugs = new Set([...mockBySlug.keys(), ...supabaseBySlug.keys()]);

  const changes: CollectionSyncPreviewSlotChange[] = [];

  for (const slug of allSlugs) {
    const mockRecord = mockBySlug.get(slug) ?? null;
    const supabaseRecord = supabaseBySlug.get(slug) ?? null;

    if (mockRecord && !supabaseRecord) {
      changes.push({
        key: "added",
        label: "Tool aggiunto",
        tool_slug: slug,
        risk: "high",
        current_value: "assente",
        legacy_value: formatSlotSnapshot(mockRecord.slot, mockRecord.index),
        summary: "La sorgente locale include un tool che oggi non esiste nell'archivio reale.",
      });
      continue;
    }

    if (!mockRecord && supabaseRecord) {
      changes.push({
        key: "removed",
        label: "Tool rimosso",
        tool_slug: slug,
        risk: "high",
        current_value: formatSlotSnapshot(supabaseRecord.slot, supabaseRecord.index),
        legacy_value: "assente",
        summary: "L'archivio reale include un tool che la sorgente locale non considera più parte della raccolta.",
      });
      continue;
    }

    if (!mockRecord || !supabaseRecord) {
      continue;
    }

    if (mockRecord.index !== supabaseRecord.index) {
      changes.push({
        key: "reordered",
        label: "Sequenza diversa",
        tool_slug: slug,
        risk: "medium",
        current_value: formatSlotSnapshot(supabaseRecord.slot, supabaseRecord.index),
        legacy_value: formatSlotSnapshot(mockRecord.slot, mockRecord.index),
        summary: "Il tool è presente in entrambe le sorgenti ma con un ordine diverso.",
      });
    }

    if (mockRecord.slot.role !== supabaseRecord.slot.role) {
      changes.push({
        key: "role",
        label: "Ruolo diverso",
        tool_slug: slug,
        risk: "medium",
        current_value: supabaseRecord.slot.role,
        legacy_value: mockRecord.slot.role,
        summary: "Il ruolo editoriale assegnato al tool è cambiato tra sorgente locale e archivio reale.",
      });
    }

    if ((mockRecord.slot.note ?? "") !== (supabaseRecord.slot.note ?? "")) {
      changes.push({
        key: "note",
        label: "Nota diversa",
        tool_slug: slug,
        risk: "medium",
        current_value: supabaseRecord.slot.note ?? "nessuna nota",
        legacy_value: mockRecord.slot.note ?? "nessuna nota",
        summary: "La nota curatoriale del tool non è allineata tra sorgente locale e archivio reale.",
      });
    }

    if ((mockRecord.slot.featured ?? false) !== (supabaseRecord.slot.featured ?? false)) {
      changes.push({
        key: "anchor",
        label: "Tool guida diverso",
        tool_slug: slug,
        risk: "high",
        current_value: supabaseRecord.slot.featured ? "tool guida" : "non guida",
        legacy_value: mockRecord.slot.featured ? "tool guida" : "non guida",
        summary: "Il tool guida cambia tra sorgente locale e archivio reale, quindi tocca il taglio della raccolta.",
      });
    }
  }

  return changes.sort((left, right) => left.tool_slug.localeCompare(right.tool_slug));
}

export function buildCollectionSyncPreview(
  entry: CollectionTransitionEntry | null | undefined,
): CollectionSyncPreview | null {
  if (!entry || entry.import_status !== "conflict" || !entry.mock || !entry.supabase) {
    return null;
  }

  const fieldChanges = toFieldChange(entry);
  const slotChanges = buildSlotChanges(entry);

  if (fieldChanges.length === 0 && slotChanges.length === 0) {
    return null;
  }

  const safeChangeCount = fieldChanges.filter((change) => change.kind === "safe").length;
  const editorialChangeCount =
    fieldChanges.filter((change) => change.kind === "editorial").length + slotChanges.length;
  const canSafeAlignFields = safeChangeCount > 0 && editorialChangeCount === 0;
  const risk: CollectionSyncPreviewRisk = canSafeAlignFields
    ? "low"
    : slotChanges.some((change) => change.risk === "high") ||
        fieldChanges.some((change) => change.risk === "high")
      ? "high"
      : "medium";

  const notes: string[] = [];

  if (entry.public_source === "supabase") {
    notes.push(
      "Il pubblico oggi legge già l'archivio principale: un eventuale allineamento toccherebbe la versione pubblica corrente.",
    );
  } else if (entry.public_source === "mock") {
    notes.push(
      "Il pubblico legge ancora la sorgente locale per questo slug: l'allineamento serve soprattutto a portare coerenza nell'archivio reale.",
    );
  }

  if (editorialChangeCount > 0) {
    notes.push(
      "L'anteprima include differenze che restano fuori da un riallineamento prudente: servono decisione editoriale o un futuro passaggio assistito.",
    );
  }

  if (canSafeAlignFields) {
    notes.push(
      "Questa anteprima tocca solo campi primari non conflittuali, quindi è candidata a un riallineamento sicuro futuro.",
    );
  }

  return {
    slug: entry.slug,
    title: entry.title,
    state: canSafeAlignFields ? "safe-align-ready" : "needs-editorial-decision",
    risk,
    public_winner: entry.public_source,
    legacy_source: "mock",
    target: "supabase",
    summary: canSafeAlignFields
      ? "Le differenze aperte restano nel perimetro di un possibile riallineamento sicuro futuro."
      : "L'anteprima tocca anche elementi editoriali o di sequenza, quindi resta solo informativa.",
    notes,
    field_changes: fieldChanges,
    slot_changes: slotChanges,
    safe_change_count: safeChangeCount,
    editorial_change_count: editorialChangeCount,
    can_safe_align_fields: canSafeAlignFields,
  };
}

export function getCollectionSyncPreviewMeta(state: CollectionSyncPreview["state"]) {
  switch (state) {
    case "safe-align-ready":
      return {
        label: "Anteprima riallineabile",
        description: "Le differenze restano nei campi più delimitati. Il riallineamento reale non è automatico, ma l'anteprima è pulita.",
      };
    case "needs-editorial-decision":
    default:
      return {
        label: "Decisione editoriale",
        description: "L'anteprima tocca copy, formato o tool inclusi: va trattata come decisione editoriale esplicita.",
      };
  }
}

export function getCollectionSyncPreviewRiskMeta(risk: CollectionSyncPreviewRisk) {
  switch (risk) {
    case "high":
      return {
        label: "Impatto alto",
        description: "Il riallineamento modificherebbe aspetti che cambiano davvero la lettura pubblica della raccolta.",
      };
    case "medium":
      return {
        label: "Impatto medio",
        description: "Le differenze sono leggibili e non distruttive, ma restano abbastanza rilevanti da meritare una scelta editoriale.",
      };
    case "low":
    default:
      return {
        label: "Impatto basso",
        description: "L'anteprima resta confinata ai campi più delimitati e non tocca spazi tool complessi.",
      };
  }
}

export function getCollectionSyncPreviewPosture({
  preview,
  readiness,
  entry,
}: {
  preview: CollectionSyncPreview | null;
  readiness?: CollectionReadinessSummary | null;
  entry?: CollectionTransitionEntry | null;
}) {
  if (!preview) {
    return {
      label: "Lascia com'è",
      tone: "pass" as const,
      description: "Non c'è un'anteprima di riallineamento utile: la raccolta è già allineata o non ha una destinazione confrontabile.",
    };
  }

  const reviewState = entry ? getCollectionTransitionReviewState(entry) : "unreviewed";
  const severity = entry ? getCollectionTransitionSeverity(entry) : "clean";

  if (preview.can_safe_align_fields && readiness?.state !== "blocked" && reviewState === "reviewed") {
    return {
      label: "Pronta al riallineamento sicuro",
      tone: "pass" as const,
      description: "L'anteprima resta prudente e la revisione è già stata chiusa: in un passaggio futuro potrà diventare una vera azione sicura.",
    };
  }

  if (preview.can_safe_align_fields) {
    return {
      label: "Solo da rivedere",
      tone: "warning" as const,
      description: "L'anteprima sembra sicura, ma conviene confermarla editorialmente prima di introdurre qualunque riallineamento applicato.",
    };
  }

  if (severity === "critical-conflict" || preview.risk === "high") {
    return {
      label: "Troppo ambigua per un riallineamento prudente",
      tone: "error" as const,
      description: "Le differenze toccano il taglio editoriale o i tool inclusi: meglio fermarsi all'anteprima.",
    };
  }

  return {
    label: "Decisione editoriale",
    tone: "warning" as const,
    description: "L'anteprima è utile per decidere, ma non abbastanza delimitata da suggerire un riallineamento automatico.",
  };
}
