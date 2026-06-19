import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import type {
  CollectionConflictReviewState,
  CollectionTransitionReviewRecord,
} from "@/lib/types/collection";

type CollectionTransitionReviewRow = {
  slug: string;
  review_state: Exclude<CollectionConflictReviewState, "unreviewed">;
  note: string | null;
  updated_at: string;
  reviewed_at: string | null;
};

function mapReviewRow(
  row: CollectionTransitionReviewRow,
): CollectionTransitionReviewRecord {
  return {
    slug: row.slug,
    review_state: row.review_state,
    note: row.note,
    updated_at: row.updated_at,
    reviewed_at: row.reviewed_at,
  };
}

function isMissingTransitionReviewTable(message: string) {
  return (
    message.includes("collection_transition_reviews") &&
    (message.includes("schema cache") || message.includes("does not exist"))
  );
}

export const canAccessSupabaseCollectionTransitionReviewsAdmin = cache(
  async (): Promise<boolean> => {
    try {
      const client = createAdminSupabaseClient();
      const { error } = await client
        .from("collection_transition_reviews")
        .select("slug", { head: true, count: "estimated" })
        .limit(1);

      return !error;
    } catch {
      return false;
    }
  },
);

export async function getCollectionTransitionReviewsFromSupabase(): Promise<
  CollectionTransitionReviewRecord[]
> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("collection_transition_reviews")
    .select("slug, review_state, note, updated_at, reviewed_at")
    .order("updated_at", { ascending: false });

  if (error) {
    if (isMissingTransitionReviewTable(error.message)) {
      return [];
    }

    throw new Error(`Non è stato possibile caricare le revisioni delle raccolte. Dettaglio: ${error.message}`);
  }

  return ((data ?? []) as CollectionTransitionReviewRow[]).map(mapReviewRow);
}

export async function upsertCollectionTransitionReview({
  slug,
  reviewState,
}: {
  slug: string;
  reviewState: Exclude<CollectionConflictReviewState, "unreviewed">;
}) {
  const client = createAdminSupabaseClient();
  const timestamp = new Date().toISOString();
  const { error } = await client.from("collection_transition_reviews").upsert(
    {
      slug,
      review_state: reviewState,
      reviewed_at: timestamp,
    },
    {
      onConflict: "slug",
    },
  );

  if (error) {
    throw new Error(`Non è stato possibile salvare la revisione della raccolta. Dettaglio: ${error.message}`);
  }
}

export async function clearCollectionTransitionReview(slug: string) {
  const client = createAdminSupabaseClient();
  const { error } = await client
    .from("collection_transition_reviews")
    .delete()
    .eq("slug", slug);

  if (error) {
    throw new Error(`Non è stato possibile rimuovere la revisione della raccolta. Dettaglio: ${error.message}`);
  }
}
