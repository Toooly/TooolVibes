import { buildCollectionSyncPreview } from "@/lib/admin/collection-sync-preview";
import { validateCollectionRecord } from "@/lib/collections/editorial";
import type {
  CollectionSafeAlignChange,
  CollectionSafeAlignableField,
  CollectionSyncPreview,
  CollectionTransitionEntry,
} from "@/lib/types/collection";

export const collectionSafeAlignPolicyFields: CollectionSafeAlignableField[] = [
  "editorial_order",
  "featured_slot",
];

function buildProjectedSafeAlignCollection(entry: CollectionTransitionEntry) {
  if (!entry.mock || !entry.supabase) {
    return null;
  }

  return {
    ...entry.supabase,
    editorial_order: entry.mock.editorial_order ?? 999,
    featured_slot: entry.mock.featured_slot ?? null,
  };
}

function formatSafeAlignValue(
  field: CollectionSafeAlignableField,
  value: number | string | null | undefined,
): string {
  if (field === "editorial_order") {
    return String(value ?? 999);
  }

  return String(value ?? "nessuno");
}

export function getCollectionSafeAlignEligibility({
  entry,
  preview,
}: {
  entry: CollectionTransitionEntry | null | undefined;
  preview?: CollectionSyncPreview | null;
}) {
  if (!entry) {
    return {
      eligible: false,
      label: "Anteprima non disponibile",
      description: "Manca il contesto di transizione necessario a proporre un riallineamento prudente.",
    };
  }

  if (entry.import_status !== "conflict") {
    return {
      eligible: false,
      label: "Nessuna differenza allineabile",
      description: "Questa raccolta non è in conflitto tra sorgente locale e archivio reale, quindi non richiede un riallineamento sicuro.",
    };
  }

  if (!entry.mock || !entry.supabase) {
    return {
      eligible: false,
      label: "Sorgente incompleta",
      description: "Servono sia la sorgente locale sia la raccolta nell'archivio reale per allineare in sicurezza.",
    };
  }

  const resolvedPreview = preview ?? buildCollectionSyncPreview(entry);

  if (!resolvedPreview) {
    return {
      eligible: false,
      label: "Anteprima non definita",
      description: "La differenza esiste, ma non rientra ancora in un'anteprima abbastanza chiara da diventare azione.",
    };
  }

  if (!resolvedPreview.can_safe_align_fields) {
    return {
      eligible: false,
      label: "Richiede una decisione editoriale",
      description: "L'anteprima tocca campi fuori regola o spazi tool: resta volutamente solo informativa.",
    };
  }

  const unsafeFields = resolvedPreview.field_changes.filter(
    (change) =>
      change.kind !== "safe" ||
      !collectionSafeAlignPolicyFields.includes(change.key as CollectionSafeAlignableField),
  );

  if (unsafeFields.length > 0 || resolvedPreview.slot_changes.length > 0) {
    return {
      eligible: false,
      label: "Fuori perimetro",
      description: "Questo caso richiede un riallineamento più ricco: non rientra nel perimetro dell'azione sicura attuale.",
    };
  }

  const projectedCollection = buildProjectedSafeAlignCollection(entry);

  if (!projectedCollection) {
    return {
      eligible: false,
      label: "Sorgente incompleta",
      description: "Il riallineamento sicuro richiede dati completi sia nella sorgente locale sia nell'archivio reale.",
    };
  }

  const currentIssues = validateCollectionRecord(entry.supabase).map((issue) => issue.message);
  const projectedIssues = validateCollectionRecord(projectedCollection).map(
    (issue) => issue.message,
  );
  const introducedIssues = projectedIssues.filter(
    (message) => !currentIssues.includes(message),
  );

  if (introducedIssues.length > 0) {
    return {
      eligible: false,
      label: "Nuovi controlli aperti",
      description: `Il riallineamento sicuro introdurrebbe nuovi avvisi o errori: ${introducedIssues[0]}`,
    };
  }

  return {
    eligible: true,
    label: "Riallineamento sicuro possibile",
    description: "La differenza è confinata ai campi operativi più delimitati e può essere riallineata in modo prudente.",
  };
}

export function buildCollectionSafeAlignPlan({
  entry,
  preview,
}: {
  entry: CollectionTransitionEntry | null | undefined;
  preview?: CollectionSyncPreview | null;
}) {
  const eligibility = getCollectionSafeAlignEligibility({ entry, preview });

  if (!entry || !entry.mock || !entry.supabase || !eligibility.eligible) {
    return {
      eligible: false,
      reason: eligibility.description,
      changes: [] as CollectionSafeAlignChange[],
      payload: null,
      preview: preview ?? buildCollectionSyncPreview(entry),
    };
  }

  const resolvedPreview = preview ?? buildCollectionSyncPreview(entry);

  if (!resolvedPreview) {
    return {
      eligible: false,
      reason: "Anteprima non disponibile per questo slug.",
      changes: [] as CollectionSafeAlignChange[],
      payload: null,
      preview: null,
    };
  }

  const fields = resolvedPreview.field_changes
    .filter(
      (change) =>
        change.kind === "safe" &&
        collectionSafeAlignPolicyFields.includes(change.key as CollectionSafeAlignableField),
    )
    .map((change) => change.key as CollectionSafeAlignableField);

  const uniqueFields = Array.from(new Set(fields));

  if (uniqueFields.length === 0) {
    return {
      eligible: false,
      reason: "L'anteprima non contiene campi allineabili secondo le regole attuali.",
      changes: [] as CollectionSafeAlignChange[],
      payload: null,
      preview: resolvedPreview,
    };
  }

  const payload: Partial<Record<CollectionSafeAlignableField, number | string | null>> = {};
  const changes: CollectionSafeAlignChange[] = [];

  for (const field of uniqueFields) {
    if (field === "editorial_order") {
      payload.editorial_order = entry.mock.editorial_order ?? 999;
      changes.push({
        field,
        current_value: formatSafeAlignValue(field, entry.supabase.editorial_order ?? 999),
        next_value: formatSafeAlignValue(field, entry.mock.editorial_order ?? 999),
      });
    }

    if (field === "featured_slot") {
      payload.featured_slot = entry.mock.featured_slot ?? null;
      changes.push({
        field,
        current_value: formatSafeAlignValue(field, entry.supabase.featured_slot ?? null),
        next_value: formatSafeAlignValue(field, entry.mock.featured_slot ?? null),
      });
    }
  }

  return {
    eligible: true,
    reason: null,
    changes,
    payload,
    preview: resolvedPreview,
  };
}
