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
      label: "Preview non disponibile",
      description: "Manca il contesto di source transition necessario a proporre un align prudente.",
    };
  }

  if (entry.import_status !== "conflict") {
    return {
      eligible: false,
      label: "Nessun drift allineabile",
      description: "Questo slug non è in conflitto tra mock e Supabase, quindi non richiede un safe align.",
    };
  }

  if (!entry.mock || !entry.supabase) {
    return {
      eligible: false,
      label: "Source incompleta",
      description: "Serve sia il legacy mock sia la collection Supabase reale per allineare in sicurezza.",
    };
  }

  const resolvedPreview = preview ?? buildCollectionSyncPreview(entry);

  if (!resolvedPreview) {
    return {
      eligible: false,
      label: "Preview non definita",
      description: "Il drift esiste, ma non rientra ancora in una preview abbastanza chiara da diventare azione.",
    };
  }

  if (!resolvedPreview.can_safe_align_fields) {
    return {
      eligible: false,
      label: "Needs editorial decision",
      description: "La preview tocca campi fuori policy o slot tool: resta volutamente preview-only.",
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
      label: "Fuori policy",
      description: "Questo caso richiede un sync più ricco: non rientra nel perimetro del safe align v15.",
    };
  }

  const projectedCollection = buildProjectedSafeAlignCollection(entry);

  if (!projectedCollection) {
    return {
      eligible: false,
      label: "Source incompleta",
      description: "Il safe align richiede sia il record mock sia il record Supabase completi.",
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
      label: "Validation delta aperto",
      description: `Il safe align introdurrebbe nuovi warning o errori: ${introducedIssues[0]}`,
    };
  }

  return {
    eligible: true,
    label: "Safe align eligible",
    description: "Il drift è confinato ai campi operativi più delimitati e può essere riallineato in modo prudente.",
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
      reason: "Preview non disponibile per questo slug.",
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
      reason: "La preview non contiene campi allineabili secondo la policy attuale.",
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
