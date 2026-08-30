import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import { COMMUNITY_MODERATOR_ACTOR } from "@/lib/community/moderation";
import {
  ADMIN_REPORT_PAGE_SIZE,
  DISMISS_NOTE_PREFIX,
  isReportStatus,
  planReportResolution,
  reportScopeForDisposition,
  type ReportDisposition,
} from "@/lib/community/report-moderation";
import type { CommunityReportReason } from "@/lib/community/schema";

type DbError = { code?: string; message?: string } | null;

function mapDbError(error: DbError) {
  if (!error) return null;
  if (error.code === "23505") return "unique" as const;
  if (error.code === "23514") return "check" as const;
  return "unknown" as const;
}

// Never include reporter_id in any admin projection.
const REPORT_ADMIN_COLUMNS =
  "id, experience_id, reason, details, status, created_at, resolved_at, resolved_by, resolution_note" as const;

const REPORT_EXPERIENCE_COLUMNS =
  "id, tool_slug, display_name, status, updated_at" as const;

export type AdminReportExperience = {
  id: string;
  toolSlug: string;
  displayName: string;
  status: string;
  updatedAt: string;
};

export type AdminExperienceReport = {
  id: string;
  experienceId: string;
  reason: CommunityReportReason;
  details: string | null;
  status: string;
  reportedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  resolutionNote: string | null;
  experience: AdminReportExperience | null;
};

export async function createExperienceReport(input: {
  reporterId: string;
  experienceId: string;
  reason: CommunityReportReason;
  details: string | null;
}) {
  const admin = createAdminSupabaseClient();
  const target = await admin
    .from("community_experiences")
    .select("id, author_id, status")
    .eq("id", input.experienceId)
    .maybeSingle();
  if (target.error) return { ok: false as const, reason: "unknown" as const };
  if (!target.data) return { ok: false as const, reason: "not_found" as const };
  if (target.data.author_id === input.reporterId) {
    return { ok: false as const, reason: "own" as const };
  }
  if (target.data.status !== "published") {
    return { ok: false as const, reason: "not_published" as const };
  }

  const { data, error } = await admin
    .from("community_experience_reports")
    .insert({
      experience_id: input.experienceId,
      reporter_id: input.reporterId,
      reason: input.reason,
      details: input.details,
    })
    .select("id, status")
    .single();
  const mapped = mapDbError(error);
  if (mapped === "unique") return { ok: false as const, reason: "duplicate" as const };
  if (mapped || !data) return { ok: false as const, reason: "unknown" as const };
  return {
    ok: true as const,
    report: { id: data.id as string, status: data.status as string },
  };
}

export async function listExperienceReports(input: {
  scope: "open" | "resolved" | "dismissed";
  page: number;
}) {
  const admin = createAdminSupabaseClient();
  const page = Math.max(1, Math.floor(input.page) || 1);
  const from = (page - 1) * ADMIN_REPORT_PAGE_SIZE;
  const to = from + ADMIN_REPORT_PAGE_SIZE - 1;

  const reports = admin.from("community_experience_reports");
  let query = reports.select(REPORT_ADMIN_COLUMNS, { count: "exact" });
  if (input.scope === "open") {
    query = query
      .eq("status", "open")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
  } else if (input.scope === "dismissed") {
    query = query
      .eq("status", "resolved")
      .like("resolution_note", `${DISMISS_NOTE_PREFIX}%`)
      .order("resolved_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false });
  } else {
    query = query
      .eq("status", "resolved")
      .or(`resolution_note.is.null,resolution_note.not.like.${DISMISS_NOTE_PREFIX}%`)
      .order("resolved_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);
  if (error) return { ok: false as const, reason: "unknown" as const };
  const rows = (data ?? []) as Array<Record<string, unknown>>;

  const experienceIds = Array.from(
    new Set(rows.map((row) => String(row.experience_id))),
  );
  const experienceMap = new Map<string, AdminReportExperience>();
  if (experienceIds.length > 0) {
    const experiences = await admin
      .from("community_experiences")
      .select(REPORT_EXPERIENCE_COLUMNS)
      .in("id", experienceIds);
    if (!experiences.error && experiences.data) {
      for (const row of experiences.data as Array<Record<string, unknown>>) {
        experienceMap.set(String(row.id), {
          id: String(row.id),
          toolSlug: String(row.tool_slug),
          displayName: String(row.display_name),
          status: String(row.status),
          updatedAt: String(row.updated_at),
        });
      }
    }
  }

  const pageRows: AdminExperienceReport[] = rows.map((row) => ({
    id: String(row.id),
    experienceId: String(row.experience_id),
    reason: row.reason as CommunityReportReason,
    details: typeof row.details === "string" ? row.details : null,
    status: String(row.status),
    reportedAt: String(row.created_at),
    resolvedAt:
      typeof row.resolved_at === "string" ? row.resolved_at : null,
    resolvedBy: typeof row.resolved_by === "string" ? row.resolved_by : null,
    resolutionNote:
      typeof row.resolution_note === "string" ? row.resolution_note : null,
    experience: experienceMap.get(String(row.experience_id)) ?? null,
  }));

  const total = count ?? pageRows.length;
  return {
    ok: true as const,
    page: pageRows,
    pageNumber: page,
    pageSize: ADMIN_REPORT_PAGE_SIZE,
    total,
    hasMore: from + pageRows.length < total,
  };
}

export async function resolveExperienceReport(input: {
  id: string;
  disposition: ReportDisposition;
  note: string | null;
  nowIso?: string;
}) {
  const admin = createAdminSupabaseClient();
  const current = await admin
    .from("community_experience_reports")
    .select("id, status")
    .eq("id", input.id)
    .maybeSingle();
  if (current.error) return { ok: false as const, reason: "unknown" as const };
  if (!current.data) return { ok: false as const, reason: "not_found" as const };
  const currentStatus = isReportStatus(current.data.status)
    ? current.data.status
    : "open";

  const plan = planReportResolution({
    currentStatus,
    disposition: input.disposition,
    note: input.note,
    actor: COMMUNITY_MODERATOR_ACTOR,
    nowIso: input.nowIso ?? new Date().toISOString(),
  });
  if (!plan.ok) {
    return {
      ok: false as const,
      reason: plan.code === "INVALID_INPUT" ? ("invalid" as const) : ("state" as const),
    };
  }

  const { data, error } = await admin
    .from("community_experience_reports")
    .update(plan.patch)
    .eq("id", input.id)
    .eq("status", "open")
    .select("id, status")
    .maybeSingle();
  if (error) {
    const mapped = mapDbError(error);
    return { ok: false as const, reason: mapped ?? "unknown" };
  }
  if (!data) return { ok: false as const, reason: "conflict" as const };
  return {
    ok: true as const,
    disposition: input.disposition,
    scope: reportScopeForDisposition(input.disposition),
    report: { id: data.id as string, status: data.status as string },
  };
}
