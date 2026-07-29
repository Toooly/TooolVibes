import "server-only";

import { z } from "@/lib/validation/zod";

import { SIGNAL_EVENT_TYPES } from "@/lib/signal-progression/rules";

const contextValueSchema = z.string().min(1).max(128);

export const signalEventIngestSchema = z
  .object({
    eventType: z.enum(SIGNAL_EVENT_TYPES),
    context: z.record(z.string(), contextValueSchema).default({}),
    clientIdempotencyKey: z.string().min(8).max(128).optional(),
    occurredAt: z.string().datetime({ offset: true }).optional(),
  })
  .strict();

export type SignalEventIngestInput = z.infer<typeof signalEventIngestSchema>;

export const signalAcknowledgeSchema = z
  .object({
    grantId: z.string().uuid(),
    status: z.enum(["acknowledged", "dismissed"]),
  })
  .strict();

export type SignalAcknowledgeInput = z.infer<typeof signalAcknowledgeSchema>;

/** Forbidden client fields — any presence rejects the payload. */
export const FORBIDDEN_CLIENT_REWARD_FIELDS = [
  "xpDelta",
  "spDelta",
  "points",
  "newBalance",
  "newLevel",
  "achievementUnlocked",
  "rewardTier",
  "userId",
  "user_id",
] as const;

export function assertNoClientRewardFields(body: unknown): string | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return null;
  }
  const record = body as Record<string, unknown>;
  for (const key of FORBIDDEN_CLIENT_REWARD_FIELDS) {
    if (key in record) {
      return `forbidden_field:${key}`;
    }
  }
  return null;
}
