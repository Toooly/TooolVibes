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

export type AcceptSignalResult =
  | {
      ok: true;
      status: "accepted" | "duplicate";
      granted: boolean;
      envelope: RewardEnvelope | null;
      spAwarded: number;
    }
  | { ok: false; error: string; status: number };

function normalizeEnvelope(raw: unknown): RewardEnvelope | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  // RPC returns timestamptz object/string — coerce createdAt
  const createdAt =
    typeof record.createdAt === "string"
      ? record.createdAt
      : new Date().toISOString();
  const candidate = {
    ...record,
    createdAt: createdAt.includes("T")
      ? createdAt
      : new Date(createdAt).toISOString(),
    priority:
      typeof record.priority === "number" ? record.priority : Number(record.priority ?? 0),
    displayDelta:
      typeof record.displayDelta === "number"
        ? record.displayDelta
        : record.displayDelta != null
          ? Number(record.displayDelta)
          : undefined,
    resultingBalance:
      typeof record.resultingBalance === "number"
        ? record.resultingBalance
        : record.resultingBalance != null
          ? Number(record.resultingBalance)
          : undefined,
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

export async function acceptSignalEngagement(
  userId: string,
  validated: ValidatedSignalEvent,
): Promise<AcceptSignalResult> {
  try {
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
    };

    const envelope = normalizeEnvelope(payload?.envelope ?? null);
    return {
      ok: true,
      status: payload?.status === "duplicate" ? "duplicate" : "accepted",
      granted: Boolean(payload?.granted && envelope),
      envelope,
      spAwarded: Number(payload?.spAwarded ?? envelope?.displayDelta ?? 0),
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
    if (error || !Array.isArray(data)) return [];
    const envelopes: RewardEnvelope[] = [];
    for (const item of data) {
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
    // Use user-scoped client via admin getUser then service update is wrong for acknowledge RPC
    // acknowledge_signal_reward requires auth.uid() — call with user JWT
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
