import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import {
  OWNER_COLUMNS,
  PUBLIC_COLUMNS,
  type CreateExperienceInput,
  type UpdateExperienceInput,
} from "@/lib/community/schema";
import { ownerEditPatch } from "@/lib/community/transitions";
import {
  toOwnerExperience,
  toPublicExperience,
} from "@/lib/community/projections";

type DbError = { code?: string; message?: string } | null;

function mapDbError(error: DbError) {
  if (!error) return null;
  if (error.code === "23505") return "unique" as const;
  if (error.code === "23514") return "check" as const;
  return "unknown" as const;
}

export async function listPublishedExperiences(input: {
  toolSlug: string;
  limit: number;
  cursor: { publishedAt: string | null; id: string } | null;
}) {
  const admin = createAdminSupabaseClient();
  let query = admin
    .from("community_experiences")
    .select(PUBLIC_COLUMNS)
    .eq("tool_slug", input.toolSlug)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false })
    .limit(input.limit + 1);

  if (input.cursor) {
    const stamp = input.cursor.publishedAt ?? "";
    query = query.or(
      `published_at.lt.${stamp},and(published_at.eq.${stamp},id.lt.${input.cursor.id})`,
    );
  }

  const { data, error } = await query;
  if (error) return { ok: false as const, reason: "unknown" as const };
  const rows = (data ?? []).map((row) => toPublicExperience(row as never));
  const hasMore = rows.length > input.limit;
  const page = hasMore ? rows.slice(0, input.limit) : rows;
  return { ok: true as const, page, hasMore };
}

export async function getOwnerExperience(input: {
  userId: string;
  toolSlug: string;
}) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("community_experiences")
    .select(OWNER_COLUMNS)
    .eq("author_id", input.userId)
    .eq("tool_slug", input.toolSlug)
    .maybeSingle();
  if (error) return { ok: false as const, reason: "unknown" as const };
  if (!data) return { ok: true as const, experience: null };
  return { ok: true as const, experience: toOwnerExperience(data as never) };
}

export async function createExperience(input: {
  userId: string;
  payload: CreateExperienceInput;
}) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("community_experiences")
    .insert({
      tool_slug: input.payload.toolSlug,
      author_id: input.userId,
      display_name: input.payload.displayName,
      use_case: input.payload.useCase,
      body: input.payload.body,
      pros: input.payload.pros,
      limits: input.payload.limits,
      duration_bucket: input.payload.durationBucket,
      switched_from_slug: input.payload.switchedFromSlug ?? null,
      switched_from_label: input.payload.switchedFromLabel ?? null,
    })
    .select(OWNER_COLUMNS)
    .single();
  const mapped = mapDbError(error);
  if (mapped === "unique") return { ok: false as const, reason: "unique" as const };
  if (mapped) return { ok: false as const, reason: mapped };
  return { ok: true as const, experience: toOwnerExperience(data as never) };
}

export async function updateOwnerExperience(input: {
  id: string;
  userId: string;
  expectedUpdatedAt: string;
  payload: UpdateExperienceInput;
}) {
  const admin = createAdminSupabaseClient();
  const existing = await admin
    .from("community_experiences")
    .select("id, author_id, updated_at, status, tool_slug")
    .eq("id", input.id)
    .maybeSingle();
  if (existing.error) return { ok: false as const, reason: "unknown" as const };
  if (!existing.data || existing.data.author_id !== input.userId) {
    return { ok: false as const, reason: "not_found" as const };
  }
  if (existing.data.updated_at !== input.expectedUpdatedAt) {
    return { ok: false as const, reason: "conflict" as const };
  }
  if (
    input.payload.switchedFromSlug &&
    input.payload.switchedFromSlug === existing.data.tool_slug
  ) {
    return { ok: false as const, reason: "check" as const };
  }

  const nowIso = new Date().toISOString();
  const content: Record<string, unknown> = {
    ...ownerEditPatch(nowIso),
  };
  if (input.payload.displayName !== undefined) content.display_name = input.payload.displayName;
  if (input.payload.useCase !== undefined) content.use_case = input.payload.useCase;
  if (input.payload.body !== undefined) content.body = input.payload.body;
  if (input.payload.pros !== undefined) content.pros = input.payload.pros;
  if (input.payload.limits !== undefined) content.limits = input.payload.limits;
  if (input.payload.durationBucket !== undefined) {
    content.duration_bucket = input.payload.durationBucket;
  }
  if (input.payload.switchedFromSlug !== undefined) {
    content.switched_from_slug = input.payload.switchedFromSlug;
    if (input.payload.switchedFromSlug) content.switched_from_label = null;
  }
  if (input.payload.switchedFromLabel !== undefined) {
    content.switched_from_label = input.payload.switchedFromLabel;
    if (input.payload.switchedFromLabel) content.switched_from_slug = null;
  }

  const { data, error } = await admin
    .from("community_experiences")
    .update(content)
    .eq("id", input.id)
    .eq("author_id", input.userId)
    .eq("updated_at", input.expectedUpdatedAt)
    .select(OWNER_COLUMNS)
    .maybeSingle();
  if (error) {
    const mapped = mapDbError(error);
    return { ok: false as const, reason: mapped ?? "unknown" };
  }
  if (!data) return { ok: false as const, reason: "conflict" as const };
  return { ok: true as const, experience: toOwnerExperience(data as never) };
}

export async function deleteOwnerExperience(input: { id: string; userId: string }) {
  const admin = createAdminSupabaseClient();
  const existing = await admin
    .from("community_experiences")
    .select("id, author_id")
    .eq("id", input.id)
    .maybeSingle();
  if (existing.error) return { ok: false as const, reason: "unknown" as const };
  if (!existing.data || existing.data.author_id !== input.userId) {
    return { ok: false as const, reason: "not_found" as const };
  }
  const { error } = await admin
    .from("community_experiences")
    .delete()
    .eq("id", input.id)
    .eq("author_id", input.userId);
  if (error) return { ok: false as const, reason: "unknown" as const };
  return { ok: true as const };
}
