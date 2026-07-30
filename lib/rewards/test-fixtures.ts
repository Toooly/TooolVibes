import type { RewardEnvelope } from "@/lib/rewards/contracts";

/** Development / unit fixtures only — never import from production UI. */
export function makeMicroEnvelope(
  overrides: Partial<RewardEnvelope> = {},
): RewardEnvelope {
  return {
    grantId: overrides.grantId ?? "grant_micro_test_0001",
    eventId: overrides.eventId ?? "evt_test_micro_1",
    tier: "micro",
    code: overrides.code ?? "first_signal_step",
    title: overrides.title ?? "Passo registrato",
    description:
      overrides.description ?? "Hai completato un micro-segnale verificato.",
    displayDelta: overrides.displayDelta ?? 5,
    resultingBalance: overrides.resultingBalance,
    levelLabel: overrides.levelLabel,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    priority: overrides.priority ?? 10,
    expiresAt: overrides.expiresAt,
    accessibilityAnnouncement:
      overrides.accessibilityAnnouncement ??
      "Micro ricompensa: passo registrato.",
    rulesVersion: overrides.rulesVersion ?? "reward-runtime-v1",
    iconId: overrides.iconId,
    badgeId: overrides.badgeId,
  };
}

export function makeAchievementEnvelope(
  overrides: Partial<RewardEnvelope> = {},
): RewardEnvelope {
  return {
    grantId: overrides.grantId ?? "grant_ach_test_0001",
    eventId: overrides.eventId ?? "evt_test_ach_1",
    tier: "achievement",
    code: overrides.code ?? "first_verdict",
    title: overrides.title ?? "Primo verdetto",
    description:
      overrides.description ?? "Hai chiuso il tuo primo confronto significativo.",
    displayDelta: overrides.displayDelta ?? 60,
    resultingBalance: overrides.resultingBalance,
    levelLabel: overrides.levelLabel ?? "Selezionatore",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    priority: overrides.priority ?? 80,
    expiresAt: overrides.expiresAt,
    accessibilityAnnouncement:
      overrides.accessibilityAnnouncement ??
      "Achievement sbloccato: Primo verdetto.",
    rulesVersion: overrides.rulesVersion ?? "reward-runtime-v1",
    iconId: overrides.iconId ?? "sparkles",
    badgeId: overrides.badgeId ?? "first_verdict",
  };
}

export function makeMilestoneEnvelope(
  overrides: Partial<RewardEnvelope> = {},
): RewardEnvelope {
  return {
    grantId: overrides.grantId ?? "grant_mst_test_0001",
    eventId: overrides.eventId ?? "evt_test_mst_1",
    tier: "milestone",
    code: overrides.code ?? "level_advanced",
    title: overrides.title ?? "Nuovo livello: Stratega",
    description:
      overrides.description ??
      "Le tue decisioni poggiano su confronti ripetuti e strutturati.",
    displayDelta: overrides.displayDelta ?? 0,
    resultingBalance: overrides.resultingBalance ?? 900,
    levelLabel: overrides.levelLabel ?? "Stratega",
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    priority: overrides.priority ?? 92,
    expiresAt: overrides.expiresAt,
    accessibilityAnnouncement:
      overrides.accessibilityAnnouncement ??
      "Hai raggiunto il livello Stratega.",
    rulesVersion: overrides.rulesVersion ?? "signal-achievements-v1",
    iconId: overrides.iconId,
    badgeId: overrides.badgeId,
  };
}
