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
    parts.push("anchor");
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
      return "Riallineerebbe l'ordering editoriale del repository reale al legacy mock.";
    case "featured_slot":
      return "Riallineerebbe il featured slot del repository reale al framing legacy.";
    case "metadata":
      return "Toccherebbe copy e framing editoriali: meglio leggerlo come decisione, non come sync automatico.";
    case "editorial_state":
      return "Cambierebbe lo stato editoriale pubblico: fuori da un allineamento prudente.";
    case "surface":
      return "Cambierebbe il tipo di superficie curatoriale: richiede decisione esplicita.";
    case "included_tools":
      return "Cambierebbe i tool inclusi o il sequencing della collection.";
    default:
      return "Differenza rilevata tra legacy mock e repository reale.";
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
        summary: "Il legacy mock include un tool che oggi non esiste nella collection Supabase.",
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
        summary: "Supabase include un tool che il legacy mock non considera pi? parte della collection.",
      });
      continue;
    }

    if (!mockRecord || !supabaseRecord) {
      continue;
    }

    if (mockRecord.index !== supabaseRecord.index) {
      changes.push({
        key: "reordered",
        label: "Sequencing diverso",
        tool_slug: slug,
        risk: "medium",
        current_value: formatSlotSnapshot(supabaseRecord.slot, supabaseRecord.index),
        legacy_value: formatSlotSnapshot(mockRecord.slot, mockRecord.index),
        summary: "Il tool ? presente in entrambe le source ma con un ordine diverso.",
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
        summary: "Il ruolo editoriale assegnato al tool ? cambiato tra mock e Supabase.",
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
        summary: "La nota curatoriale del tool non ? allineata tra legacy e repository reale.",
      });
    }

    if ((mockRecord.slot.featured ?? false) !== (supabaseRecord.slot.featured ?? false)) {
      changes.push({
        key: "anchor",
        label: "Anchor diverso",
        tool_slug: slug,
        risk: "high",
        current_value: supabaseRecord.slot.featured ? "anchor" : "non anchor",
        legacy_value: mockRecord.slot.featured ? "anchor" : "non anchor",
        summary: "L'anchor tool cambia tra mock e Supabase, quindi tocca il framing della collection.",
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
      "Il pubblico oggi legge gi? Supabase: un eventuale allineamento toccherebbe la versione pubblica corrente.",
    );
  } else if (entry.public_source === "mock") {
    notes.push(
      "Il pubblico legge ancora il legacy mock per questo slug: l'allineamento serve soprattutto a portare coerenza nel repository reale.",
    );
  }

  if (editorialChangeCount > 0) {
    notes.push(
      "La preview include differenze che restano fuori da un sync prudente: servono decisione editoriale o un futuro merge assistito.",
    );
  }

  if (canSafeAlignFields) {
    notes.push(
      "Questa preview tocca solo campi primari non conflittuali, quindi ? candidata a un safe align futuro.",
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
      ? "Le differenze aperte restano nel perimetro di un possibile safe align futuro."
      : "La preview tocca anche elementi editoriali o di sequencing, quindi resta preview-only.",
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
        label: "Safe align preview",
        description: "Le differenze restano nei campi pi? delimitati. Il sync reale non ? ancora automatico, ma la preview ? pulita.",
      };
    case "needs-editorial-decision":
    default:
      return {
        label: "Needs editorial decision",
        description: "La preview tocca copy, surface o tool inclusi: va trattata come decisione editoriale esplicita.",
      };
  }
}

export function getCollectionSyncPreviewRiskMeta(risk: CollectionSyncPreviewRisk) {
  switch (risk) {
    case "high":
      return {
        label: "High impact",
        description: "L'align modificherebbe aspetti che cambiano davvero la lettura pubblica della collection.",
      };
    case "medium":
      return {
        label: "Medium impact",
        description: "Le differenze sono leggibili e non distruttive, ma restano abbastanza rilevanti da meritare una scelta editoriale.",
      };
    case "low":
    default:
      return {
        label: "Low impact",
        description: "La preview resta confinata ai campi pi? delimitati e non tocca tool slot complessi.",
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
      label: "Lascia com'?",
      tone: "pass" as const,
      description: "Non c'? una preview di riallineamento utile: la collection ? gi? allineata o non ha un target confrontabile.",
    };
  }

  const reviewState = entry ? getCollectionTransitionReviewState(entry) : "unreviewed";
  const severity = entry ? getCollectionTransitionSeverity(entry) : "clean";

  if (preview.can_safe_align_fields && readiness?.state !== "blocked" && reviewState === "reviewed") {
    return {
      label: "Pronta a safe align",
      tone: "pass" as const,
      description: "La preview resta prudente e la review ? gi? stata chiusa: in un pass futuro potra` diventare una vera azione sicura.",
    };
  }

  if (preview.can_safe_align_fields) {
    return {
      label: "Solo da rivedere",
      tone: "warning" as const,
      description: "La preview sembra sicura, ma conviene confermarla editorialmente prima di introdurre qualunque sync applicato.",
    };
  }

  if (severity === "critical-conflict" || preview.risk === "high") {
    return {
      label: "Troppo ambigua per sync prudente",
      tone: "error" as const,
      description: "Le differenze toccano il framing editoriale o i tool inclusi: meglio fermarsi alla preview.",
    };
  }

  return {
    label: "Needs editorial decision",
    tone: "warning" as const,
    description: "La preview ? utile per decidere, ma non abbastanza delimitata da suggerire un sync automatico.",
  };
}
