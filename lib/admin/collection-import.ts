"use server";

import "server-only";

import { toCollectionMutationInput } from "@/lib/admin/collection-form";
import { createCollection } from "@/lib/admin/collection-mutations";
import { buildCollectionTransitionReport } from "@/lib/collections/source-transition";
import { contentCollections } from "@/lib/data/content-collections";
import { mockCollections } from "@/lib/data/mock-collections";
import { getAdminCollectionsFromSupabase } from "@/lib/supabase/collection-repository";

export type MockCollectionImportItemResult = {
  slug: string;
  title: string;
  status: "imported" | "skipped" | "conflict";
  reason?: string;
  toolSlugs: string[];
};

export type MockCollectionImportResult = {
  dryRun: boolean;
  items: MockCollectionImportItemResult[];
  imported: number;
  skipped: number;
  conflicts: number;
  report: ReturnType<typeof buildCollectionTransitionReport>;
};

type ImportMockCollectionsOptions = {
  dryRun?: boolean;
  slugs?: string[];
};

export async function previewMockCollectionsImport() {
  const supabaseCollections = await getAdminCollectionsFromSupabase();

  return buildCollectionTransitionReport({
    mockCollections,
    contentCollections,
    supabaseCollections,
  });
}

export async function importMockCollectionsToSupabase({
  dryRun = false,
  slugs,
}: ImportMockCollectionsOptions = {}): Promise<MockCollectionImportResult> {
  const supabaseCollections = await getAdminCollectionsFromSupabase();
  const report = buildCollectionTransitionReport({
    mockCollections,
    contentCollections,
    supabaseCollections,
  });
  const requestedSlugs = slugs?.length ? new Set(slugs) : null;
  const candidateEntries = report.entries.filter((entry) => {
    if (!entry.mock) {
      return false;
    }

    if (requestedSlugs && !requestedSlugs.has(entry.slug)) {
      return false;
    }

    if (!requestedSlugs) {
      return entry.import_status === "pending-import";
    }

    return entry.import_status !== "content-only" && entry.import_status !== "remote-only";
  });

  const items: MockCollectionImportItemResult[] = [];

  for (const entry of candidateEntries) {
    const toolSlugs = entry.mock?.included_tools.map((slot) => slot.tool_slug) ?? [];

    if (entry.import_status === "imported") {
      items.push({
        slug: entry.slug,
        title: entry.title,
        status: "skipped",
        reason: "Già presente nell'archivio reale con lo stesso slug.",
        toolSlugs,
      });
      continue;
    }

    if (entry.import_status === "conflict" || !entry.mock) {
      items.push({
        slug: entry.slug,
        title: entry.title,
        status: "conflict",
        reason:
          entry.warnings[0] ??
          "Esiste già una raccolta con questo slug nell'archivio reale, ma con contenuti diversi.",
        toolSlugs,
      });
      continue;
    }

    if (dryRun) {
      items.push({
        slug: entry.slug,
        title: entry.title,
        status: "skipped",
        reason: "Anteprima: pronta per l'importazione.",
        toolSlugs,
      });
      continue;
    }

    try {
      await createCollection(toCollectionMutationInput(entry.mock));
      items.push({
        slug: entry.slug,
        title: entry.title,
        status: "imported",
        toolSlugs,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      items.push({
        slug: entry.slug,
        title: entry.title,
        status: message.includes("collections_slug_key") ? "conflict" : "skipped",
        reason: message,
        toolSlugs,
      });
    }
  }

  return {
    dryRun,
    items,
    imported: items.filter((item) => item.status === "imported").length,
    skipped: items.filter((item) => item.status === "skipped").length,
    conflicts: items.filter((item) => item.status === "conflict").length,
    report,
  };
}
