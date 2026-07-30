import type { HostRewardTier } from "@/lib/rewards/contracts";

/** Presentation frequency caps (session + rolling windows in memory). */
export const REWARD_PRESENTATION_CAPS = {
  microPerHour: 10,
  achievementPerDay: 5,
  /** Tier 3 stays rare: at most one automatic milestone presentation/day. */
  milestonePerDay: 1,
  maxQueue: 12,
} as const;

export type PresentationLogEntry = {
  grantId: string;
  tier: HostRewardTier;
  presentedAtMs: number;
};

export function prunePresentationLog(
  log: readonly PresentationLogEntry[],
  nowMs: number,
): PresentationLogEntry[] {
  const hourAgo = nowMs - 60 * 60 * 1000;
  const dayAgo = nowMs - 24 * 60 * 60 * 1000;
  // keep a day of history for daily caps
  return log.filter((entry) => entry.presentedAtMs >= dayAgo || entry.presentedAtMs >= hourAgo);
}

export function canPresentTier(
  tier: HostRewardTier,
  log: readonly PresentationLogEntry[],
  nowMs: number = Date.now(),
): boolean {
  const pruned = prunePresentationLog(log, nowMs);
  if (tier === "micro") {
    const hourAgo = nowMs - 60 * 60 * 1000;
    const count = pruned.filter(
      (e) => e.tier === "micro" && e.presentedAtMs >= hourAgo,
    ).length;
    return count < REWARD_PRESENTATION_CAPS.microPerHour;
  }
  const dayAgo = nowMs - 24 * 60 * 60 * 1000;
  if (tier === "milestone") {
    const count = pruned.filter(
      (e) => e.tier === "milestone" && e.presentedAtMs >= dayAgo,
    ).length;
    return count < REWARD_PRESENTATION_CAPS.milestonePerDay;
  }
  const count = pruned.filter(
    (e) => e.tier === "achievement" && e.presentedAtMs >= dayAgo,
  ).length;
  return count < REWARD_PRESENTATION_CAPS.achievementPerDay;
}

export function recordPresentation(
  log: readonly PresentationLogEntry[],
  entry: PresentationLogEntry,
): PresentationLogEntry[] {
  return prunePresentationLog([...log, entry], entry.presentedAtMs);
}
