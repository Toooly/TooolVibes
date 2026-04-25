import "server-only";

import { cache } from "react";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { createPublicSupabaseClient } from "@/lib/supabase/public-client";
import type { CuratedCollectionRecord } from "@/lib/types/collection";

const publicCollectionSelect = `
  id,
  title,
  slug,
  description,
  cover_image_url,
  cover_kicker,
  rationale,
  highlights,
  premium_teaser,
  theme,
  audience,
  difficulty,
  tone,
  access,
  editorial_state,
  surface,
  featured_slot,
  editorial_order,
  scheduled_for,
  first_published_at,
  published_at,
  archived_at,
  created_at,
  updated_at,
  collection_tool_slots (
    tool_slug,
    role,
    note,
    featured,
    position
  )
`;

type SupabaseCollectionToolSlotRow = {
  tool_slug: string;
  role: string;
  note: string | null;
  featured: boolean | null;
  position: number | null;
};

type SupabaseCollectionRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  cover_image_url: string;
  cover_kicker: string;
  rationale: string;
  highlights: string[] | null;
  premium_teaser: string | null;
  theme: CuratedCollectionRecord["theme"];
  audience: CuratedCollectionRecord["audience"];
  difficulty: CuratedCollectionRecord["difficulty"];
  tone: CuratedCollectionRecord["tone"];
  access: CuratedCollectionRecord["access"];
  editorial_state: CuratedCollectionRecord["editorial_state"];
  surface: CuratedCollectionRecord["surface"];
  featured_slot: CuratedCollectionRecord["featured_slot"];
  editorial_order: number | null;
  scheduled_for: string | null;
  first_published_at: string | null;
  published_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  collection_tool_slots: SupabaseCollectionToolSlotRow[] | null;
};

function mapSupabaseCollection(row: SupabaseCollectionRow): CuratedCollectionRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    cover_image_url: row.cover_image_url,
    cover_kicker: row.cover_kicker,
    rationale: row.rationale,
    highlights: row.highlights ?? [],
    premium_teaser: row.premium_teaser ?? undefined,
    theme: row.theme,
    audience: row.audience,
    difficulty: row.difficulty,
    tone: row.tone,
    access: row.access,
    editorial_state: row.editorial_state,
    surface: row.surface,
    featured_slot: row.featured_slot ?? null,
    editorial_order: row.editorial_order ?? 999,
    included_tools: (row.collection_tool_slots ?? []).map((slot, index) => ({
      tool_slug: slot.tool_slug,
      role: slot.role,
      note: slot.note ?? undefined,
      featured: slot.featured ?? false,
      order: slot.position ?? index,
    })),
    created_at: row.created_at,
    updated_at: row.updated_at,
    scheduled_for: row.scheduled_for,
    first_published_at: row.first_published_at,
    published_at: row.published_at,
    archived_at: row.archived_at,
  };
}

export const getCollectionsFromSupabase = cache(async (): Promise<CuratedCollectionRecord[]> => {
  const client = createPublicSupabaseClient();
  const { data, error } = await client
    .from("collections")
    .select(publicCollectionSelect)
    .order("editorial_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .order("position", { ascending: true, foreignTable: "collection_tool_slots" });

  if (error) {
    throw new Error(`Unable to load collections from Supabase: ${error.message}`);
  }

  return ((data ?? []) as SupabaseCollectionRow[]).map(mapSupabaseCollection);
});

export const canAccessSupabaseCollectionsAdmin = cache(async (): Promise<boolean> => {
  try {
    const client = createAdminSupabaseClient();
    const [{ error: collectionsError }, { error: slotsError }] = await Promise.all([
      client.from("collections").select("id", { head: true, count: "estimated" }).limit(1),
      client
        .from("collection_tool_slots")
        .select("id", { head: true, count: "estimated" })
        .limit(1),
    ]);

    return !collectionsError && !slotsError;
  } catch {
    return false;
  }
});

export async function getAdminCollectionsFromSupabase(): Promise<CuratedCollectionRecord[]> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("collections")
    .select(publicCollectionSelect)
    .order("editorial_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .order("position", { ascending: true, foreignTable: "collection_tool_slots" });

  if (error) {
    throw new Error(`Unable to load admin collections from Supabase: ${error.message}`);
  }

  return ((data ?? []) as SupabaseCollectionRow[]).map(mapSupabaseCollection);
}

export async function getAdminCollectionByIdFromSupabase(
  id: string,
): Promise<CuratedCollectionRecord | null> {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("collections")
    .select(publicCollectionSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load collection ${id} from Supabase: ${error.message}`);
  }

  return data ? mapSupabaseCollection(data as SupabaseCollectionRow) : null;
}
