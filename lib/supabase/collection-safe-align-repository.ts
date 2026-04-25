import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import type {
  CollectionSafeAlignEventRecord,
  CollectionSafeAlignableField,
} from "@/lib/types/collection";

type CollectionSafeAlignEventRow = {
  slug: string;
  collection_id: string;
  source_from: "mock";
  source_to: "supabase";
  aligned_fields: CollectionSafeAlignableField[];
  applied_at: string;
};

function mapSafeAlignRow(
  row: CollectionSafeAlignEventRow,
): CollectionSafeAlignEventRecord {
  return {
    slug: row.slug,
    collection_id: row.collection_id,
    source_from: row.source_from,
    source_to: row.source_to,
    aligned_fields: row.aligned_fields,
    applied_at: row.applied_at,
  };
}

function isMissingSafeAlignTable(message: string) {
  return (
    message.includes("collection_safe_align_events") &&
    (message.includes("schema cache") || message.includes("does not exist"))
  );
}

export const canAccessSupabaseCollectionSafeAlignAdmin = cache(async (): Promise<boolean> => {
  try {
    const client = createAdminSupabaseClient();
    const { error } = await client
      .from("collection_safe_align_events")
      .select("slug", { head: true, count: "estimated" })
      .limit(1);

    return !error;
  } catch {
    return false;
  }
});

export async function getCollectionSafeAlignEventsFromSupabase(): Promise<
  CollectionSafeAlignEventRecord[]
> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("collection_safe_align_events")
    .select("slug, collection_id, source_from, source_to, aligned_fields, applied_at")
    .order("applied_at", { ascending: false });

  if (error) {
    if (isMissingSafeAlignTable(error.message)) {
      return [];
    }

    throw new Error(`Unable to load collection safe align events: ${error.message}`);
  }

  return ((data ?? []) as CollectionSafeAlignEventRow[]).map(mapSafeAlignRow);
}

export async function insertCollectionSafeAlignEvent({
  slug,
  collectionId,
  alignedFields,
}: {
  slug: string;
  collectionId: string;
  alignedFields: CollectionSafeAlignableField[];
}) {
  const client = createAdminSupabaseClient();
  const { error } = await client.from("collection_safe_align_events").insert({
    slug,
    collection_id: collectionId,
    source_from: "mock",
    source_to: "supabase",
    aligned_fields: alignedFields,
  });

  if (error) {
    throw new Error(`Unable to record collection safe align event: ${error.message}`);
  }
}
