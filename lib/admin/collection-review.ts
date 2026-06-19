import type {
  CollectionConflictReviewState,
  CollectionConflictSeverity,
  CollectionReadinessSummary,
  CollectionTransitionDiffItem,
  CollectionTransitionEntry,
  CollectionTransitionReport,
  CollectionTransitionReviewRecord,
  CollectionValidationIssue,
  CuratedCollectionRecord,
} from "@/lib/types/collection";

function formatToolSlots(collection: CuratedCollectionRecord | null) {
  if (!collection || collection.included_tools.length === 0) {
    return "nessun tool";
  }

  return collection.included_tools
    .map((slot, index) => `${String(index + 1).padStart(2, "0")} ${slot.tool_slug}`)
    .join(" · ");
}

function formatMetadataSnapshot(collection: CuratedCollectionRecord | null) {
  if (!collection) {
    return "n/d";
  }

  return [
    collection.title,
    collection.access,
    collection.tone,
    collection.audience,
  ].join(" · ");
}

export function attachTransitionReviews(
  report: CollectionTransitionReport,
  reviews: CollectionTransitionReviewRecord[],
): CollectionTransitionReport {
  const reviewsBySlug = new Map(reviews.map((review) => [review.slug, review]));

  return {
    ...report,
    entries: report.entries.map((entry) => ({
      ...entry,
      review: reviewsBySlug.get(entry.slug) ?? null,
    })),
  };
}

export function getCollectionTransitionReviewState(
  entry: CollectionTransitionEntry,
): CollectionConflictReviewState {
  return entry.review?.review_state ?? "unreviewed";
}

export function getCollectionTransitionReviewMeta(state: CollectionConflictReviewState) {
  switch (state) {
    case "reviewed":
      return {
        label: "Rivista",
        description: "Differenza letta e accettata editorialmente.",
      };
    case "dismissed":
      return {
        label: "Archiviata",
        description: "Segnale archiviato in attesa di un riallineamento più ricco.",
      };
    case "unreviewed":
    default:
      return {
        label: "Da leggere",
        description: "Richiede ancora una decisione editoriale esplicita.",
      };
  }
}

export function getCollectionTransitionSeverity(
  entry: CollectionTransitionEntry,
): CollectionConflictSeverity {
  if (entry.import_status === "pending-import") {
    return "pending";
  }

  if (entry.import_status !== "conflict") {
    return "clean";
  }

  if (entry.diff.editorial_state || entry.diff.surface || entry.diff.included_tools) {
    return "critical-conflict";
  }

  return "minor-drift";
}

export function getCollectionTransitionSeverityMeta(
  severity: CollectionConflictSeverity,
) {
  switch (severity) {
    case "critical-conflict":
      return {
        label: "Conflitto critico",
        description: "Le differenze toccano stato, formato o tool inclusi e meritano attenzione prima di fidarsi della pubblicazione.",
      };
    case "minor-drift":
      return {
        label: "Differenza lieve",
        description: "Le differenze sono editoriali ma non ancora strutturalmente bloccanti.",
      };
    case "pending":
      return {
        label: "Da importare",
        description: "La raccolta esiste ancora solo nella sorgente locale e va importata se vuoi gestirla nell'archivio reale.",
      };
    case "clean":
    default:
      return {
        label: "Pulita",
        description: "Nessuna differenza operativa rilevata tra sorgente locale e archivio reale.",
      };
  }
}

export function getCollectionTransitionDiffItems(
  entry: CollectionTransitionEntry,
): CollectionTransitionDiffItem[] {
  const winner =
    entry.public_source === "supabase"
      ? entry.supabase
      : entry.public_source === "mock"
        ? entry.mock
        : entry.content;
  const items: CollectionTransitionDiffItem[] = [];

  if (entry.diff.editorial_state) {
    items.push({
      key: "editorial_state",
      label: "Stato editoriale",
      severity: "critical",
      mock_value: entry.mock?.editorial_state ?? "n/d",
      supabase_value: entry.supabase?.editorial_state ?? "n/d",
      winner_value: winner?.editorial_state ?? "n/d",
    });
  }

  if (entry.diff.editorial_order) {
    items.push({
      key: "editorial_order",
      label: "Ordine",
      severity: "minor",
      mock_value: String(entry.mock?.editorial_order ?? 999),
      supabase_value: String(entry.supabase?.editorial_order ?? 999),
      winner_value: String(winner?.editorial_order ?? 999),
    });
  }

  if (entry.diff.featured_slot) {
    items.push({
      key: "featured_slot",
      label: "Spazio in evidenza",
      severity: "minor",
      mock_value: entry.mock?.featured_slot ?? "nessuno",
      supabase_value: entry.supabase?.featured_slot ?? "nessuno",
      winner_value: winner?.featured_slot ?? "nessuno",
    });
  }

  if (entry.diff.surface) {
    items.push({
      key: "surface",
      label: "Formato",
      severity: "critical",
      mock_value: entry.mock?.surface ?? "n/d",
      supabase_value: entry.supabase?.surface ?? "n/d",
      winner_value: winner?.surface ?? "n/d",
    });
  }

  if (entry.diff.metadata) {
    items.push({
      key: "metadata",
      label: "Informazioni chiave",
      severity: "minor",
      mock_value: formatMetadataSnapshot(entry.mock),
      supabase_value: formatMetadataSnapshot(entry.supabase),
      winner_value: formatMetadataSnapshot(winner ?? null),
    });
  }

  if (entry.diff.included_tools) {
    items.push({
      key: "included_tools",
      label: "Tool inclusi",
      severity: "critical",
      mock_value: formatToolSlots(entry.mock),
      supabase_value: formatToolSlots(entry.supabase),
      winner_value: formatToolSlots(winner ?? null),
    });
  }

  return items;
}

export function buildCollectionReadinessSummary({
  collection,
  validationIssues,
  transitionEntry,
}: {
  collection: CuratedCollectionRecord;
  validationIssues: CollectionValidationIssue[];
  transitionEntry?: CollectionTransitionEntry | null;
}): CollectionReadinessSummary {
  const errors = validationIssues.filter((issue) => issue.level === "error");
  const warnings = validationIssues.filter((issue) => issue.level === "warning");
  const reviewState = transitionEntry
    ? getCollectionTransitionReviewState(transitionEntry)
    : "unreviewed";
  const transitionSeverity = transitionEntry
    ? getCollectionTransitionSeverity(transitionEntry)
    : "clean";
  const isPublic =
    collection.editorial_state === "published" || collection.editorial_state === "featured";
  const hasFeaturedAnchor = collection.included_tools.some((slot) => slot.featured);

  const checks = [
    {
      label: "Controlli",
      state:
        errors.length > 0
          ? "error"
          : warnings.length > 0
            ? "warning"
            : "pass",
      detail:
        errors.length > 0
          ? `${errors.length} errore/i aperti.`
          : warnings.length > 0
            ? `${warnings.length} avvisi da rivedere.`
            : "Nessun avviso o errore aperto.",
    },
    {
      label: "Stato pubblicazione",
      state:
        isPublic && !collection.published_at
          ? "warning"
          : collection.editorial_state === "scheduled" && !collection.scheduled_for
            ? "warning"
            : "pass",
      detail:
        isPublic && !collection.published_at
          ? "Raccolta pubblica senza data di pubblicazione esplicita."
          : collection.editorial_state === "scheduled" && !collection.scheduled_for
            ? "Raccolta programmata senza data di uscita."
            : "Stato editoriale coerente con i timestamp principali.",
    },
    {
      label: "Struttura",
      state:
        collection.included_tools.length === 0
          ? "error"
          : hasFeaturedAnchor
            ? "pass"
            : "warning",
      detail:
        collection.included_tools.length === 0
          ? "Nessun tool incluso."
          : hasFeaturedAnchor
            ? "Sequenza tool con guida chiara."
            : "Manca un tool guida esplicito nella sequenza.",
    },
    {
      label: "Revisione transizione",
      state:
        transitionSeverity === "critical-conflict" &&
        reviewState === "unreviewed"
          ? "error"
          : transitionSeverity === "minor-drift" && reviewState === "unreviewed"
            ? "warning"
            : transitionSeverity === "pending"
              ? "warning"
              : "pass",
      detail:
        transitionSeverity === "critical-conflict" &&
        reviewState === "unreviewed"
          ? "Conflitto critico aperto tra sorgente locale e archivio reale."
          : transitionSeverity === "minor-drift" && reviewState === "unreviewed"
            ? "Differenza lieve non ancora rivista."
            : transitionSeverity === "pending"
              ? "Raccolta ancora solo locale o non pienamente migrata."
              : reviewState === "dismissed"
                ? "Differenza archiviata editorialmente in attesa di un riallineamento futuro."
                : "Nessun rischio aperto nel passaggio di transizione.",
    },
    {
      label: "Raccolta speciale",
      state:
        collection.surface === "special-issue" && !collection.premium_teaser
          ? "warning"
          : "pass",
      detail:
        collection.surface === "special-issue" && !collection.premium_teaser
          ? "Raccolta speciale senza teaser premium."
          : "Formato coerente.",
    },
  ] as const;

  const hasError = checks.some((check) => check.state === "error");
  const hasWarning = checks.some((check) => check.state === "warning");

  if (hasError) {
    return {
      state: "blocked",
      label: "Bloccata",
      summary: "Prima di fidarti della pubblicazione va chiuso almeno un rischio strutturale o di transizione.",
      checks: [...checks],
    };
  }

  if (hasWarning) {
    return {
      state: "review",
      label: "Da rivedere",
      summary: "La raccolta è leggibile, ma conviene una revisione editoriale prima di considerarla davvero pronta.",
      checks: [...checks],
    };
  }

  return {
    state: "ready",
    label: "Pronta",
    summary: "La raccolta ha segnali coerenti e nessun blocco aperto sul flusso editoriale corrente.",
    checks: [...checks],
  };
}
