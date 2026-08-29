import { describe, expect, it } from "vitest";

import {
  COMMUNITY_MODERATOR_ACTOR,
  MAX_MODERATION_REASON_LENGTH,
  MIN_MODERATION_REASON_LENGTH,
  moderationChangesPublicVisibility,
  normalizeModerationReason,
  planExperienceModeration,
  type ModerationAction,
} from "@/lib/community/moderation";
import type { ExperienceStatus } from "@/lib/community/schema";

const now = "2026-08-30T12:00:00.000Z";
const reason = "Contenuto fuorviante per il catalogo.";

function plan(
  status: ExperienceStatus,
  action: ModerationAction,
  extra?: Partial<Parameters<typeof planExperienceModeration>[0]>,
) {
  return planExperienceModeration({
    currentStatus: status,
    action,
    reason,
    nowIso: now,
    actor: COMMUNITY_MODERATOR_ACTOR,
    currentPublishedAt: status === "pending" || status === "rejected" ? null : now,
    ...extra,
  });
}

describe("H3 moderation state machine", () => {
  const statuses: ExperienceStatus[] = ["pending", "published", "hidden", "rejected"];
  const actions: ModerationAction[] = ["publish", "reject", "hide", "republish"];

  const expected: Record<
    ExperienceStatus,
    Record<ModerationAction, "applied" | "noop" | "EXPERIENCE_STATE_CONFLICT">
  > = {
    pending: {
      publish: "applied",
      reject: "applied",
      hide: "EXPERIENCE_STATE_CONFLICT",
      republish: "EXPERIENCE_STATE_CONFLICT",
    },
    published: {
      publish: "noop",
      reject: "EXPERIENCE_STATE_CONFLICT",
      hide: "applied",
      republish: "noop",
    },
    hidden: {
      publish: "EXPERIENCE_STATE_CONFLICT",
      reject: "EXPERIENCE_STATE_CONFLICT",
      hide: "noop",
      republish: "applied",
    },
    rejected: {
      publish: "EXPERIENCE_STATE_CONFLICT",
      reject: "noop",
      hide: "EXPERIENCE_STATE_CONFLICT",
      republish: "EXPERIENCE_STATE_CONFLICT",
    },
  };

  it("covers every status/action pair", () => {
    for (const status of statuses) {
      for (const action of actions) {
        const result = plan(status, action);
        const want = expected[status][action];
        if (want === "EXPERIENCE_STATE_CONFLICT") {
          expect(result, `${status} ${action}`).toEqual({
            ok: false,
            code: "EXPERIENCE_STATE_CONFLICT",
          });
        } else {
          expect(result.ok, `${status} ${action}`).toBe(true);
          if (result.ok) expect(result.kind).toBe(want);
        }
      }
    }
  });

  it("H3-PUBLISH pending sets published_at, moderated metadata, clears reason", () => {
    const result = plan("pending", "publish");
    expect(result).toEqual({
      ok: true,
      kind: "applied",
      patch: {
        status: "published",
        published_at: now,
        moderated_at: now,
        moderated_by: COMMUNITY_MODERATOR_ACTOR,
        moderation_reason: null,
      },
    });
  });

  it("H3-REJECT pending requires reason and keeps published_at untouched", () => {
    const missing = planExperienceModeration({
      currentStatus: "pending",
      action: "reject",
      reason: "no",
      nowIso: now,
      actor: COMMUNITY_MODERATOR_ACTOR,
      currentPublishedAt: null,
    });
    expect(missing).toEqual({ ok: false, code: "INVALID_INPUT" });

    const result = plan("pending", "reject");
    expect(result.ok && result.kind === "applied").toBe(true);
    if (result.ok && result.kind === "applied") {
      expect(result.patch.status).toBe("rejected");
      expect(result.patch.published_at).toBeUndefined();
      expect(result.patch.moderation_reason).toBe(reason);
      expect(result.patch.moderated_by).toBe(COMMUNITY_MODERATOR_ACTOR);
    }
  });

  it("H3-HIDE published retains published_at", () => {
    const result = plan("published", "hide", { currentPublishedAt: "2026-01-01T00:00:00.000Z" });
    expect(result.ok && result.kind === "applied").toBe(true);
    if (result.ok && result.kind === "applied") {
      expect(result.patch.status).toBe("hidden");
      expect(result.patch.published_at).toBeUndefined();
      expect(result.patch.moderation_reason).toBe(reason);
    }
  });

  it("H3-REPUBLISH preserves original published_at", () => {
    const original = "2026-01-01T00:00:00.000Z";
    const result = plan("hidden", "republish", { currentPublishedAt: original });
    expect(result.ok && result.kind === "applied").toBe(true);
    if (result.ok && result.kind === "applied") {
      expect(result.patch.status).toBe("published");
      expect(result.patch.published_at).toBeUndefined();
      expect(result.patch.moderation_reason).toBeNull();
    }
  });

  it("H3-REPUBLISH sets published_at only if missing", () => {
    const result = plan("hidden", "republish", { currentPublishedAt: null });
    expect(result.ok && result.kind === "applied").toBe(true);
    if (result.ok && result.kind === "applied") {
      expect(result.patch.published_at).toBe(now);
    }
  });

  it("does not take actor or reason from untrusted publish payload", () => {
    const result = planExperienceModeration({
      currentStatus: "pending",
      action: "publish",
      reason: "<script>xss</script> not used",
      nowIso: now,
      actor: COMMUNITY_MODERATOR_ACTOR,
      currentPublishedAt: null,
    });
    expect(result.ok && result.kind === "applied" && result.patch.moderated_by).toBe(
      COMMUNITY_MODERATOR_ACTOR,
    );
    if (result.ok && result.kind === "applied") {
      expect(result.patch.moderation_reason).toBeNull();
    }
  });

  it("bounds moderation reason", () => {
    expect(normalizeModerationReason("abc")).toBeNull();
    expect(normalizeModerationReason("abcd")).toBe("abcd");
    expect(normalizeModerationReason("  abcd  ")).toBe("abcd");
    expect(normalizeModerationReason("a".repeat(MAX_MODERATION_REASON_LENGTH + 1))).toBeNull();
    expect(MIN_MODERATION_REASON_LENGTH).toBe(4);
  });

  it("marks public visibility changes", () => {
    expect(moderationChangesPublicVisibility("publish", "applied")).toBe(true);
    expect(moderationChangesPublicVisibility("hide", "applied")).toBe(true);
    expect(moderationChangesPublicVisibility("republish", "applied")).toBe(true);
    expect(moderationChangesPublicVisibility("reject", "applied")).toBe(false);
    expect(moderationChangesPublicVisibility("publish", "noop")).toBe(false);
  });
});
