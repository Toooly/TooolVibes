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
        label: "Reviewed",
        description: "Drift letto e accettato editorialmente.",
      };
    case "dismissed":
      return {
        label: "Dismissed",
        description: "Warning archiviato in attesa di un sync più ricco.",
      };
    case "unreviewed":
    default:
      return {
        label: "Unreviewed",
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
        description: "Il drift tocca stato, surface o tool inclusi e merita attenzione prima di fidarsi della pubblicazione.",
      };
    case "minor-drift":
      return {
        label: "Drift lieve",
        description: "Le differenze sono editoriali ma non ancora strutturalmente bloccanti.",
      };
    case "pending":
      return {
        label: "Pending import",
        description: "La collection esiste ancora solo nella source legacy e va importata se vuoi gestirla nel repository reale.",
      };
    case "clean":
    default:
      return {
        label: "Clean",
        description: "Nessun drift operativo rilevato tra legacy e repository reale.",
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
      label: "Ordering",
      severity: "minor",
      mock_value: String(entry.mock?.editorial_order ?? 999),
      supabase_value: String(entry.supabase?.editorial_order ?? 999),
      winner_value: String(winner?.editorial_order ?? 999),
    });
  }

  if (entry.diff.featured_slot) {
    items.push({
      key: "featured_slot",
      label: "Featured slot",
      severity: "minor",
      mock_value: entry.mock?.featured_slot ?? "nessuno",
      supabase_value: entry.supabase?.featured_slot ?? "nessuno",
      winner_value: winner?.featured_slot ?? "nessuno",
    });
  }

  if (entry.diff.surface) {
    items.push({
      key: "surface",
      label: "Surface",
      severity: "critical",
      mock_value: entry.mock?.surface ?? "n/d",
      supabase_value: entry.supabase?.surface ?? "n/d",
      winner_value: winner?.surface ?? "n/d",
    });
  }

  if (entry.diff.metadata) {
    items.push({
      key: "metadata",
      label: "Metadata chiave",
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
      label: "Validation",
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
            ? `${warnings.length} warning da rivedere.`
            : "Nessun warning o errore aperto.",
    },
    {
      label: "Publish state",
      state:
        isPublic && !collection.published_at
          ? "warning"
          : collection.editorial_state === "scheduled" && !collection.scheduled_for
            ? "warning"
            : "pass",
      detail:
        isPublic && !collection.published_at
          ? "Collection pubblica senza published_at esplicito."
          : collection.editorial_state === "scheduled" && !collection.scheduled_for
            ? "Scheduled senza scheduled_for."
            : "Stato editoriale coerente con i timestamp principali.",
    },
    {
      label: "Structure",
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
            ? "Sequenza tool con anchor chiara."
            : "Manca un tool anchor esplicito nella sequenza.",
    },
    {
      label: "Transition review",
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
          ? "Conflitto critico aperto tra mock e Supabase."
          : transitionSeverity === "minor-drift" && reviewState === "unreviewed"
            ? "Drift lieve non ancora rivisto."
            : transitionSeverity === "pending"
              ? "Collection ancora solo legacy o non pienamente migrata."
              : reviewState === "dismissed"
                ? "Drift archiviato editorialmente in attesa di sync futuro."
                : "Nessun rischio aperto sul boundary di transizione.",
    },
    {
      label: "Special issue",
      state:
        collection.surface === "special-issue" && !collection.premium_teaser
          ? "warning"
          : "pass",
      detail:
        collection.surface === "special-issue" && !collection.premium_teaser
          ? "Special issue senza premium teaser."
          : "Framing surface coerente.",
    },
  ] as const;

  const hasError = checks.some((check) => check.state === "error");
  const hasWarning = checks.some((check) => check.state === "warning");

  if (hasError) {
    return {
      state: "blocked",
      label: "Blocked",
      summary: "Prima di fidarti della pubblicazione va chiuso almeno un rischio strutturale o di transizione.",
      checks: [...checks],
    };
  }

  if (hasWarning) {
    return {
      state: "review",
      label: "Review",
      summary: "La collection ? leggibile, ma conviene una revisione editoriale prima di considerarla davvero pronta.",
      checks: [...checks],
    };
  }

  return {
    state: "ready",
    label: "Ready",
    summary: "La collection ha segnali coerenti e nessun blocco aperto sul flusso editoriale corrente.",
    checks: [...checks],
  };
}
