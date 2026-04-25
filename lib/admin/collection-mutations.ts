"use server";

import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import type { CollectionMutationInput } from "@/lib/admin/collection-form";
import type { CollectionSafeAlignableField } from "@/lib/types/collection";

function mapCollectionRow(input: CollectionMutationInput) {
  return {
    title: input.title,
    slug: input.slug,
    description: input.description,
    cover_image_url: input.cover_image_url,
    cover_kicker: input.cover_kicker,
    rationale: input.rationale,
    highlights: input.highlights,
    premium_teaser: input.premium_teaser ?? null,
    theme: input.theme,
    audience: input.audience,
    difficulty: input.difficulty,
    tone: input.tone,
    access: input.access,
    editorial_state: input.editorial_state,
    surface: input.surface,
    featured_slot: input.featured_slot ?? null,
    editorial_order: input.editorial_order ?? 999,
    scheduled_for: input.scheduled_for ?? null,
    first_published_at: input.first_published_at ?? null,
    published_at: input.published_at ?? null,
    archived_at: input.archived_at ?? null,
  };
}

function mapCollectionSlots(collectionId: string, input: CollectionMutationInput) {
  return input.included_tools.map((slot, index) => ({
    collection_id: collectionId,
    tool_slug: slot.tool_slug,
    role: slot.role,
    note: slot.note ?? null,
    featured: slot.featured ?? false,
    position: slot.order ?? index,
  }));
}

export async function createCollection(input: CollectionMutationInput) {
  const client = createAdminSupabaseClient();
  const { data, error } = await client
    .from("collections")
    .insert(mapCollectionRow(input))
    .select("id")
    .single();

  if (error) {
    throw new Error(`Unable to create collection: ${error.message}`);
  }

  const slots = mapCollectionSlots(data.id, input);

  if (slots.length > 0) {
    const { error: slotsError } = await client.from("collection_tool_slots").insert(slots);

    if (slotsError) {
      await client.from("collections").delete().eq("id", data.id);
      throw new Error(`Unable to create collection slots: ${slotsError.message}`);
    }
  }

  return data;
}

export async function updateCollection(id: string, input: CollectionMutationInput) {
  const client = createAdminSupabaseClient();
  const previousSlotsResponse = await client
    .from("collection_tool_slots")
    .select("tool_slug, role, note, featured, position")
    .eq("collection_id", id)
    .order("position", { ascending: true });

  if (previousSlotsResponse.error) {
    throw new Error(`Unable to read current collection slots: ${previousSlotsResponse.error.message}`);
  }

  const { error } = await client.from("collections").update(mapCollectionRow(input)).eq("id", id);

  if (error) {
    throw new Error(`Unable to update collection: ${error.message}`);
  }

  const { error: deleteSlotsError } = await client
    .from("collection_tool_slots")
    .delete()
    .eq("collection_id", id);

  if (deleteSlotsError) {
    throw new Error(`Unable to reset collection slots: ${deleteSlotsError.message}`);
  }

  const slots = mapCollectionSlots(id, input);

  if (slots.length > 0) {
    const { error: slotsError } = await client.from("collection_tool_slots").insert(slots);

    if (slotsError) {
      const previousSlots = (previousSlotsResponse.data ?? []).map((slot) => ({
        collection_id: id,
        tool_slug: slot.tool_slug,
        role: slot.role,
        note: slot.note,
        featured: slot.featured,
        position: slot.position,
      }));

      if (previousSlots.length > 0) {
        await client.from("collection_tool_slots").insert(previousSlots);
      }

      throw new Error(`Unable to update collection slots: ${slotsError.message}`);
    }
  }

  return { id };
}

export async function applyCollectionSafeAlignment(
  id: string,
  input: Partial<Record<CollectionSafeAlignableField, number | string | null>>,
) {
  const client = createAdminSupabaseClient();
  const payload = {
    ...(Object.prototype.hasOwnProperty.call(input, "editorial_order")
      ? { editorial_order: input.editorial_order ?? 999 }
      : {}),
    ...(Object.prototype.hasOwnProperty.call(input, "featured_slot")
      ? { featured_slot: input.featured_slot ?? null }
      : {}),
  };

  if (Object.keys(payload).length === 0) {
    throw new Error("Unable to apply safe align: no supported fields were provided.");
  }

  const { error } = await client.from("collections").update(payload).eq("id", id);

  if (error) {
    throw new Error(`Unable to apply safe collection alignment: ${error.message}`);
  }

  return { id };
}
