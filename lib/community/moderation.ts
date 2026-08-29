import {
  COMMUNITY_STATUSES,
  type ExperienceStatus,
} from "@/lib/community/schema";

export const COMMUNITY_MODERATOR_ACTOR = "founder-admin";
export const MIN_MODERATION_REASON_LENGTH = 4;
export const MAX_MODERATION_REASON_LENGTH = 500;
export const ADMIN_EXPERIENCE_PAGE_SIZE = 20;

export const MODERATION_ACTIONS = [
  "publish",
  "reject",
  "hide",
  "republish",
] as const;

export type ModerationAction = (typeof MODERATION_ACTIONS)[number];

export type ModerationPatch = {
  status: ExperienceStatus;
  published_at?: string | null;
  moderated_at: string;
  moderated_by: string;
  moderation_reason: string | null;
};

export type ModerationPlan =
  | { ok: true; kind: "applied"; patch: ModerationPatch }
  | { ok: true; kind: "noop" }
  | {
      ok: false;
      code: "EXPERIENCE_STATE_CONFLICT" | "INVALID_INPUT";
    };

const REASON_REQUIRED = new Set<ModerationAction>(["reject", "hide"]);

export function isModerationAction(value: unknown): value is ModerationAction {
  return (
    typeof value === "string" &&
    (MODERATION_ACTIONS as readonly string[]).includes(value)
  );
}

export function isExperienceStatus(value: unknown): value is ExperienceStatus {
  return (
    typeof value === "string" &&
    (COMMUNITY_STATUSES as readonly string[]).includes(value)
  );
}

export function normalizeModerationReason(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.normalize("NFC").trim();
  if (
    trimmed.length < MIN_MODERATION_REASON_LENGTH ||
    trimmed.length > MAX_MODERATION_REASON_LENGTH
  ) {
    return null;
  }
  return trimmed;
}

export function planExperienceModeration(input: {
  currentStatus: ExperienceStatus;
  action: ModerationAction;
  reason: unknown;
  nowIso: string;
  actor: string;
  currentPublishedAt: string | null;
}): ModerationPlan {
  const actor = input.actor.normalize("NFC").trim();
  if (actor.length < 1 || actor.length > 120) {
    return { ok: false, code: "INVALID_INPUT" };
  }

  const reason = REASON_REQUIRED.has(input.action)
    ? normalizeModerationReason(input.reason)
    : null;
  if (REASON_REQUIRED.has(input.action) && !reason) {
    return { ok: false, code: "INVALID_INPUT" };
  }

  const { currentStatus, action } = input;

  if (action === "publish") {
    if (currentStatus === "published") return { ok: true, kind: "noop" };
    if (currentStatus !== "pending") {
      return { ok: false, code: "EXPERIENCE_STATE_CONFLICT" };
    }
    return {
      ok: true,
      kind: "applied",
      patch: {
        status: "published",
        published_at: input.nowIso,
        moderated_at: input.nowIso,
        moderated_by: actor,
        moderation_reason: null,
      },
    };
  }

  if (action === "reject") {
    if (currentStatus === "rejected") return { ok: true, kind: "noop" };
    if (currentStatus !== "pending") {
      return { ok: false, code: "EXPERIENCE_STATE_CONFLICT" };
    }
    return {
      ok: true,
      kind: "applied",
      patch: {
        status: "rejected",
        moderated_at: input.nowIso,
        moderated_by: actor,
        moderation_reason: reason,
      },
    };
  }

  if (action === "hide") {
    if (currentStatus === "hidden") return { ok: true, kind: "noop" };
    if (currentStatus !== "published") {
      return { ok: false, code: "EXPERIENCE_STATE_CONFLICT" };
    }
    return {
      ok: true,
      kind: "applied",
      patch: {
        status: "hidden",
        moderated_at: input.nowIso,
        moderated_by: actor,
        moderation_reason: reason,
      },
    };
  }

  if (currentStatus === "published") return { ok: true, kind: "noop" };
  if (currentStatus !== "hidden") {
    return { ok: false, code: "EXPERIENCE_STATE_CONFLICT" };
  }

  return {
    ok: true,
    kind: "applied",
    patch: {
      status: "published",
      ...(input.currentPublishedAt ? {} : { published_at: input.nowIso }),
      moderated_at: input.nowIso,
      moderated_by: actor,
      moderation_reason: null,
    },
  };
}

export function moderationChangesPublicVisibility(
  action: ModerationAction,
  kind: "applied" | "noop",
) {
  return kind === "applied" && action !== "reject";
}
