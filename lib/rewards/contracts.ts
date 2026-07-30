import { z } from "@/lib/validation/zod";

/** Presentation tiers. `interaction` is Tier 0 (no host overlay). */
export const REWARD_TIERS = [
  "interaction",
  "micro",
  "achievement",
  "milestone",
] as const;

export type RewardTier = (typeof REWARD_TIERS)[number];

export const rewardTierPresentedByHost = [
  "micro",
  "achievement",
  "milestone",
] as const;
export type HostRewardTier = (typeof rewardTierPresentedByHost)[number];

/**
 * Server-verified reward envelope (presentation-safe fields only).
 * Phase 3: validated client-side; Phase 4+ issued by backend only.
 */
export const rewardEnvelopeSchema = z.object({
  grantId: z.string().min(8).max(128),
  eventId: z.string().min(1).max(128),
  tier: z.enum(REWARD_TIERS),
  code: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9_-]*$/i),
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(280),
  iconId: z.string().min(1).max(64).optional(),
  badgeId: z.string().min(1).max(64).optional(),
  /** Server-approved display delta only — never from UI handlers. */
  displayDelta: z.number().int().min(0).max(10_000).optional(),
  resultingBalance: z.number().int().min(0).max(10_000_000).optional(),
  levelLabel: z.string().min(1).max(64).optional(),
  createdAt: z.string().datetime({ offset: true }),
  /** Higher = sooner. Default 0. */
  priority: z.number().int().min(0).max(1000).default(0),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  accessibilityAnnouncement: z.string().min(1).max(280),
  rulesVersion: z.string().min(1).max(32),
});

export type RewardEnvelope = z.infer<typeof rewardEnvelopeSchema>;

export type RewardEnvelopeParseResult =
  | { ok: true; envelope: RewardEnvelope }
  | { ok: false; error: string };

export function parseRewardEnvelope(input: unknown): RewardEnvelopeParseResult {
  const parsed = rewardEnvelopeSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; ") || "invalid",
    };
  }
  return { ok: true, envelope: parsed.data };
}

export function isHostPresentableTier(
  tier: RewardTier,
): tier is HostRewardTier {
  return tier === "micro" || tier === "achievement" || tier === "milestone";
}

export function isEnvelopeExpired(
  envelope: RewardEnvelope,
  nowMs: number = Date.now(),
): boolean {
  if (!envelope.expiresAt) return false;
  const expires = Date.parse(envelope.expiresAt);
  if (Number.isNaN(expires)) return true;
  return expires <= nowMs;
}
