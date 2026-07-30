import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import {
  GLOBAL_DAILY_SP_CAP,
  SIGNAL_RULES_VERSION,
} from "@/lib/signal-progression/rules";
import type { ValidatedSignalEvent } from "@/lib/signal-progression/validate-event";
import {
  parseRewardEnvelope,
  type RewardEnvelope,
} from "@/lib/rewards/contracts";
import { missionsCompletedByEvent } from "@/lib/signal-progression/missions";
import { calculateSignalLevel } from "@/lib/signal-progression/levels";
import { SIGNAL_ACHIEVEMENTS_RULES_VERSION } from "@/lib/signal-progression/achievements";
import { canEvaluateSignalAchievements } from "@/lib/signal-progression/flags";
import type { SignalProfileContextInput } from "@/lib/signal-progression/profile-context";
import { getSignalProgressHub } from "@/lib/signal-progression/read-model";

export type AcceptSignalResult =
  | {
      ok: true;
      status: "accepted" | "duplicate";
      granted: boolean;
      envelope: RewardEnvelope | null;
      spAwarded: number;
      missionEnvelopes: RewardEnvelope[];
      achievementEnvelopes: RewardEnvelope[];
    }
  | { ok: false; error: string; status: number };

function normalizeEnvelope(raw: unknown): RewardEnvelope | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const createdAt =
    typeof record.createdAt === "string"
      ? record.createdAt
      : new Date().toISOString();
  const balance =
    typeof record.resultingBalance === "number"
      ? record.resultingBalance
      : record.resultingBalance != null
        ? Number(record.resultingBalance)
        : undefined;
  const levelLabel =
    typeof record.levelLabel === "string"
      ? record.levelLabel
      : balance != null
        ? calculateSignalLevel(balance).title
        : undefined;
  const candidate = {
    ...record,
    createdAt: createdAt.includes("T")
      ? createdAt
      : new Date(createdAt).toISOString(),
    priority:
      typeof record.priority === "number"
        ? record.priority
        : Number(record.priority ?? 0),
    displayDelta:
      typeof record.displayDelta === "number"
        ? record.displayDelta
        : record.displayDelta != null
          ? Number(record.displayDelta)
          : undefined,
    resultingBalance: balance,
    levelLabel,
  };
  const parsed = parseRewardEnvelope(candidate);
  return parsed.ok ? parsed.envelope : null;
}

export async function resolveAuthenticatedUserId(
  accessToken: string,
): Promise<string | null> {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.auth.getUser(accessToken);
    if (error || !data.user?.id) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

async function projectMissionsForEvent(
  userId: string,
  eventType: ValidatedSignalEvent["rule"]["eventType"],
  sourceEventId: string | null,
): Promise<RewardEnvelope[]> {
  const missions = missionsCompletedByEvent(eventType);
  if (missions.length === 0) return [];

  const admin = createAdminSupabaseClient();
  const envelopes: RewardEnvelope[] = [];

  for (const mission of missions) {
    const { data, error } = await admin.rpc("complete_signal_mission", {
      p_user_id: userId,
      p_mission_id: mission.id,
      p_source_event_id: sourceEventId,
      p_sp_delta: mission.rewardSp,
      p_reward_tier: mission.rewardTier,
      p_reason_code: mission.reasonCode,
      p_title: mission.rewardTitle,
      p_description: mission.rewardDescription,
      p_announcement: mission.announcement,
      p_priority: mission.priority,
      p_rules_version: SIGNAL_RULES_VERSION,
      p_daily_sp_cap: GLOBAL_DAILY_SP_CAP,
      p_badge_id: mission.badgeId ?? null,
    });
    if (error || !data) continue;
    const payload = data as { envelope?: unknown; granted?: boolean };
    const envelope = normalizeEnvelope(payload.envelope ?? null);
    if (envelope) envelopes.push(envelope);
  }
  return envelopes;
}

async function evaluateAchievementsForUser(
  userId: string,
): Promise<RewardEnvelope[]> {
  if (!canEvaluateSignalAchievements()) return [];
  const admin = createAdminSupabaseClient();
  try {
    const { data, error } = await admin.rpc("evaluate_signal_achievements", {
      p_user_id: userId,
      p_daily_sp_cap: GLOBAL_DAILY_SP_CAP,
      p_rules_version: SIGNAL_ACHIEVEMENTS_RULES_VERSION,
    });
    if (error) {
      console.warn("[signal-achievements] evaluate failed", {
        operation: "evaluate_signal_achievements",
        code: error.code,
        message: error.message,
      });
      return [];
    }
    if (!data || typeof data !== "object") return [];
    const obj = data as { envelopes?: unknown };
    const raw = obj.envelopes;
    if (!Array.isArray(raw)) return [];
    const envelopes: RewardEnvelope[] = [];
    for (const item of raw) {
      const envelope = normalizeEnvelope(item);
      if (envelope) envelopes.push(envelope);
    }
    return envelopes;
  } catch (error) {
    console.warn("[signal-achievements] evaluate threw", {
      operation: "evaluate_signal_achievements",
      code: error instanceof Error ? error.name : "unknown",
      message: error instanceof Error ? error.message : String(error),
    });
    return [];
  }
}

export async function isProfileContextComplete(
  userId: string,
): Promise<boolean> {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin
      .from("signal_user_context")
      .select("completed_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !data) return false;
    return data.completed_at != null;
  } catch {
    return false;
  }
}

export async function acceptSignalEngagement(
  userId: string,
  validated: ValidatedSignalEvent,
): Promise<AcceptSignalResult> {
  try {
    // Server-side profile proof: client cannot claim completed:true
    if (validated.rule.eventType === "profile_completed") {
      const complete = await isProfileContextComplete(userId);
      if (!complete) {
        return { ok: false, error: "profile_incomplete", status: 400 };
      }
    }

    const admin = createAdminSupabaseClient();
    const { rule, input, context, dedupeKey } = validated;

    const { data, error } = await admin.rpc("accept_signal_engagement", {
      p_user_id: userId,
      p_event_type: rule.eventType,
      p_dedupe_key: dedupeKey,
      p_context: context,
      p_sp_delta: rule.spDelta,
      p_reward_tier: rule.tier,
      p_reason_code: rule.reasonCode,
      p_title: rule.title,
      p_description: rule.description,
      p_announcement: rule.announcement,
      p_priority: rule.priority,
      p_rules_version: SIGNAL_RULES_VERSION,
      p_client_idempotency_key: input.clientIdempotencyKey ?? null,
      p_occurred_at: input.occurredAt ?? null,
      p_daily_sp_cap: GLOBAL_DAILY_SP_CAP,
    });

    if (error) {
      return { ok: false, error: "grant_failed", status: 503 };
    }

    const payload = data as {
      status?: string;
      granted?: boolean;
      envelope?: unknown;
      spAwarded?: number;
      eventId?: string;
    };

    const envelope = normalizeEnvelope(payload?.envelope ?? null);
    const status = payload?.status === "duplicate" ? "duplicate" : "accepted";
    const eventId =
      typeof payload?.eventId === "string" ? payload.eventId : null;

    let missionEnvelopes: RewardEnvelope[] = [];
    let achievementEnvelopes: RewardEnvelope[] = [];
    if (status === "accepted") {
      missionEnvelopes = await projectMissionsForEvent(
        userId,
        rule.eventType,
        eventId,
      );
      // Server-owned eligibility projection runs after every SP-changing path
      // (event grant + mission grants) so level crossings are caught exactly
      // once. Failure here must never break the primary action.
      achievementEnvelopes = await evaluateAchievementsForUser(userId);
    }

    return {
      ok: true,
      status,
      granted:
        Boolean(payload?.granted && envelope) ||
        missionEnvelopes.length > 0 ||
        achievementEnvelopes.length > 0,
      envelope,
      spAwarded: Number(payload?.spAwarded ?? envelope?.displayDelta ?? 0),
      missionEnvelopes,
      achievementEnvelopes,
    };
  } catch {
    return { ok: false, error: "service_unavailable", status: 503 };
  }
}

export async function listPendingSignalEnvelopes(
  userId: string,
  limit = 10,
): Promise<RewardEnvelope[]> {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("list_pending_signal_rewards", {
      p_user_id: userId,
      p_limit: limit,
    });
    if (error || !Array.isArray(data)) {
      // RPC may return jsonb array directly
      if (error || data == null) return [];
    }
    const list = Array.isArray(data) ? data : [];
    const envelopes: RewardEnvelope[] = [];
    for (const item of list) {
      const envelope = normalizeEnvelope(item);
      if (envelope) envelopes.push(envelope);
    }
    return envelopes;
  } catch {
    return [];
  }
}

export async function acknowledgeSignalReward(
  accessToken: string,
  grantId: string,
  status: "acknowledged" | "dismissed",
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const { getSupabasePublicEnv } = await import("@/lib/supabase/env");
    const { url, anonKey } = getSupabasePublicEnv();
    if (!url || !anonKey) {
      return { ok: false, error: "not_configured", status: 503 };
    }
    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${accessToken}` } },
    });
    const { error } = await userClient.rpc("acknowledge_signal_reward", {
      p_grant_id: grantId,
      p_status: status,
    });
    if (error) {
      return { ok: false, error: "ack_failed", status: 400 };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "service_unavailable", status: 503 };
  }
}

export async function upsertSignalProfileContext(
  userId: string,
  input: SignalProfileContextInput,
): Promise<
  | { ok: true; completed: boolean; envelopes: RewardEnvelope[] }
  | { ok: false; error: string; status: number }
> {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("upsert_signal_user_context", {
      p_user_id: userId,
      p_focus_area: input.focusArea,
      p_primary_goal: input.primaryGoal,
    });
    if (error || !data) {
      return { ok: false, error: "context_failed", status: 503 };
    }
    const payload = data as { completed?: boolean };
    const envelopes: RewardEnvelope[] = [];
    if (payload.completed) {
      // Server issues profile_completed after verified fields exist
      const { validateSignalEventPayload } = await import(
        "@/lib/signal-progression/validate-event"
      );
      const validated = validateSignalEventPayload(
        {
          eventType: "profile_completed",
          context: {},
          clientIdempotencyKey: `profile-complete:${userId}`,
        },
        userId,
      );
      if (validated.ok) {
        const result = await acceptSignalEngagement(userId, validated.value);
        if (result.ok) {
          if (result.envelope) envelopes.push(result.envelope);
          envelopes.push(...result.missionEnvelopes);
          envelopes.push(...result.achievementEnvelopes);
        }
      }
    }
    return { ok: true, completed: Boolean(payload.completed), envelopes };
  } catch {
    return { ok: false, error: "service_unavailable", status: 503 };
  }
}

export { getSignalProgressHub };
