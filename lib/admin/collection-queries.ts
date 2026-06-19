import "server-only";

import { cache } from "react";

import {
  attachTransitionReviews,
  buildCollectionReadinessSummary,
} from "@/lib/admin/collection-review";
import { buildCollectionSyncPreview } from "@/lib/admin/collection-sync-preview";
import { buildCollectionTransitionReport } from "@/lib/collections/source-transition";
import { buildCollectionRepositorySnapshot } from "@/lib/collections/editorial";
import { contentCollections } from "@/lib/data/content-collections";
import { getCollectionRepositorySnapshot } from "@/lib/data/collection-repository";
import { mockCollections } from "@/lib/data/mock-collections";
import {
  canAccessSupabaseCollectionsAdmin,
  getAdminCollectionByIdFromSupabase,
  getAdminCollectionsFromSupabase,
} from "@/lib/supabase/collection-repository";
import {
  canAccessSupabaseCollectionTransitionReviewsAdmin,
  getCollectionTransitionReviewsFromSupabase,
} from "@/lib/supabase/collection-review-repository";
import {
  canAccessSupabaseCollectionSafeAlignAdmin,
  getCollectionSafeAlignEventsFromSupabase,
} from "@/lib/supabase/collection-safe-align-repository";
import type {
  CollectionSafeAlignEventRecord,
  CollectionReadinessSummary,
  CollectionEditorialState,
  CollectionRepositorySnapshot,
  CollectionSyncPreview,
  CollectionTransitionReport,
  CollectionTransitionReviewRecord,
  CuratedCollectionRecord,
} from "@/lib/types/collection";
import { isSupabaseAdminEnabled } from "@/lib/admin/tool-queries";

export type AdminCollectionsRuntime = {
  collections: CuratedCollectionRecord[];
  publicSnapshot: CollectionRepositorySnapshot;
  workspaceSnapshot: CollectionRepositorySnapshot;
  adminReadSource: "supabase" | "snapshot";
  canWrite: boolean;
  writeTarget: "supabase" | null;
  writeMessage: string;
  transitionReport: CollectionTransitionReport;
  canReview: boolean;
  reviewWriteTarget: "supabase" | null;
  reviewMessage: string;
  transitionReviews: CollectionTransitionReviewRecord[];
  readinessBySlug: Record<string, CollectionReadinessSummary>;
  syncPreviewBySlug: Record<string, CollectionSyncPreview | null>;
  canSafeAlign: boolean;
  safeAlignMessage: string;
  safeAlignEvents: CollectionSafeAlignEventRecord[];
  lastSafeAlignBySlug: Record<string, CollectionSafeAlignEventRecord | null>;
};

export async function getAdminCollectionsSnapshot(): Promise<CollectionRepositorySnapshot> {
  return getCollectionRepositorySnapshot();
}

export const isSupabaseCollectionsWriteEnabled = cache(async () => {
  if (!isSupabaseAdminEnabled()) {
    return false;
  }

  return canAccessSupabaseCollectionsAdmin();
});

export const getAdminCollectionsRuntime = cache(async (): Promise<AdminCollectionsRuntime> => {
  const publicSnapshot = await getCollectionRepositorySnapshot();
  const canWrite = await isSupabaseCollectionsWriteEnabled();
  let canReview = isSupabaseAdminEnabled()
    ? await canAccessSupabaseCollectionTransitionReviewsAdmin()
    : false;
  let reviewMessage = canReview
    ? "Revisione salvata attiva per conflitti e differenze."
    : "Revisione non ancora salvata: completa la configurazione per mantenere gli stati rivista/archiviata.";
  let transitionReviews: CollectionTransitionReviewRecord[] = [];

  if (canReview) {
    try {
      transitionReviews = await getCollectionTransitionReviewsFromSupabase();
    } catch {
      canReview = false;
      reviewMessage =
        "Revisione non disponibile in questo ambiente: il pannello interno resta leggibile e continua con dati locali finché l'archivio non è pronto.";
    }
  }

  let canSafeAlign = canWrite && (await canAccessSupabaseCollectionSafeAlignAdmin());
  let safeAlignMessage = canSafeAlign
    ? "Riallineamento sicuro attivo per le differenze minori: applica solo i campi ammessi e registra la modifica."
    : "Riallineamento sicuro disattivato: completa la configurazione prima di usare l'azione.";
  let safeAlignEvents: CollectionSafeAlignEventRecord[] = [];

  if (canSafeAlign) {
    try {
      safeAlignEvents = await getCollectionSafeAlignEventsFromSupabase();
    } catch {
      canSafeAlign = false;
      safeAlignMessage =
        "Riallineamento sicuro in pausa: l'anteprima resta leggibile ma il registro modifiche non è disponibile in questo ambiente.";
    }
  }
  const lastSafeAlignBySlug = safeAlignEvents.reduce<
    Record<string, CollectionSafeAlignEventRecord | null>
  >((accumulator, event) => {
    if (!accumulator[event.slug]) {
      accumulator[event.slug] = event;
    }

    return accumulator;
  }, {});
  const transitionReportFromSnapshot = attachTransitionReviews(
    buildCollectionTransitionReport({
      mockCollections,
      contentCollections,
      supabaseCollections: publicSnapshot.collections.filter(
        (collection) => collection.source_kind === "supabase",
      ),
    }),
    transitionReviews,
  );
  const readinessFromSnapshot = Object.fromEntries(
    publicSnapshot.collections.map((collection) => [
      collection.slug,
      buildCollectionReadinessSummary({
        collection,
        validationIssues: publicSnapshot.validation[collection.slug] ?? [],
        transitionEntry:
          transitionReportFromSnapshot.entries.find((entry) => entry.slug === collection.slug) ??
          null,
      }),
    ]),
  ) as Record<string, CollectionReadinessSummary>;
  const syncPreviewFromSnapshot = Object.fromEntries(
    transitionReportFromSnapshot.entries.map((entry) => [
      entry.slug,
      buildCollectionSyncPreview(entry),
    ]),
  ) as Record<string, CollectionSyncPreview | null>;

  if (!canWrite) {
    return {
      collections: publicSnapshot.collections,
      publicSnapshot,
      workspaceSnapshot: publicSnapshot,
      adminReadSource: "snapshot",
      canWrite: false,
      writeTarget: null,
      writeMessage:
        "Salvataggio raccolte non attivo: il pannello interno usa la sorgente locale corrente e resta in sola lettura finché l'archivio non è pronto.",
      transitionReport: transitionReportFromSnapshot,
      canReview,
      reviewWriteTarget: canReview ? "supabase" : null,
      reviewMessage,
      transitionReviews,
      readinessBySlug: readinessFromSnapshot,
      syncPreviewBySlug: syncPreviewFromSnapshot,
      canSafeAlign: false,
      safeAlignMessage:
        "Riallineamento sicuro non attivo: servono salvataggio raccolte e registro modifiche prima di usare questa azione.",
      safeAlignEvents: [],
      lastSafeAlignBySlug: {},
    };
  }

  const collections = await getAdminCollectionsFromSupabase();
  const workspaceSnapshot = buildCollectionRepositorySnapshot(collections, {
    requestedSource: "supabase",
    activeSource: "supabase",
    composedSources: ["supabase"],
    sourcePrecedence: ["supabase"],
  });
  const transitionReport = attachTransitionReviews(
    buildCollectionTransitionReport({
      mockCollections,
      contentCollections,
      supabaseCollections: collections,
    }),
    transitionReviews,
  );
  const readinessBySlug = Object.fromEntries(
    collections.map((collection) => [
      collection.slug,
      buildCollectionReadinessSummary({
        collection,
        validationIssues: workspaceSnapshot.validation[collection.slug] ?? [],
        transitionEntry:
          transitionReport.entries.find((entry) => entry.slug === collection.slug) ?? null,
      }),
    ]),
  ) as Record<string, CollectionReadinessSummary>;
  const syncPreviewBySlug = Object.fromEntries(
    transitionReport.entries.map((entry) => [entry.slug, buildCollectionSyncPreview(entry)]),
  ) as Record<string, CollectionSyncPreview | null>;

  return {
    collections,
    publicSnapshot,
    workspaceSnapshot,
    adminReadSource: "supabase",
    canWrite: true,
    writeTarget: "supabase",
    writeMessage:
      "Salvataggio raccolte attivo. Questo pannello modifica l'archivio editoriale principale.",
    transitionReport,
    canReview,
    reviewWriteTarget: canReview ? "supabase" : null,
    reviewMessage,
    transitionReviews,
    readinessBySlug,
    syncPreviewBySlug,
    canSafeAlign,
    safeAlignMessage,
    safeAlignEvents,
    lastSafeAlignBySlug,
  };
});

export async function getAdminCollections() {
  const runtime = await getAdminCollectionsRuntime();
  return runtime.collections;
}

export async function getAdminCollectionById(id: string) {
  const runtime = await getAdminCollectionsRuntime();

  if (runtime.canWrite) {
    return getAdminCollectionByIdFromSupabase(id);
  }

  return runtime.collections.find((collection) => collection.id === id) ?? null;
}

export function getCollectionStateCounts(collections: CuratedCollectionRecord[]) {
  return collections.reduce<Record<CollectionEditorialState, number>>(
    (accumulator, collection) => {
      accumulator[collection.editorial_state] += 1;
      return accumulator;
    },
    {
      draft: 0,
      scheduled: 0,
      published: 0,
      featured: 0,
      archived: 0,
    },
  );
}
