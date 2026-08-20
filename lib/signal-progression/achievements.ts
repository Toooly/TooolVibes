import "server-only";

import type { RewardTier } from "@/lib/rewards/contracts";

/**
 * Phase 6 Signal achievement registry (presentation metadata only).
 *
 * Eligibility, ownership, rarity enforcement and SP bonuses are decided
 * exclusively by the server (`evaluate_signal_achievements` RPC against
 * authoritative state). This module mirrors public names and presentation
 * hints so the read model and Account surfaces can render truthful labels
 * without ever evaluating rules client-side.
 */

export const SIGNAL_ACHIEVEMENTS_RULES_VERSION = "signal-achievements-v1";

export const SIGNAL_ACHIEVEMENT_CODES = [
  "first_signal",
  "profile_set",
  "first_verdict",
  "pathfinder",
  "stack_builder",
  "radar_return",
  "curator_mark",
  "strategist",
  "cartographer",
] as const;

export type SignalAchievementCode = (typeof SIGNAL_ACHIEVEMENT_CODES)[number];

export type SignalAchievementDefinition = {
  code: SignalAchievementCode;
  publicName: string;
  rarity: "common" | "uncommon" | "rare";
  /** Presentation tier used when the server issues a dedicated envelope. */
  presentationTier: RewardTier;
  /**
   * Merged achievements persist ownership only: the visible envelope is the
   * matching mission envelope carrying `badgeId`. No duplicate SP grant.
   */
  mergedIntoMission: string | null;
};

export const SIGNAL_ACHIEVEMENT_DEFINITIONS: readonly SignalAchievementDefinition[] =
  [
    {
      code: "first_signal",
      publicName: "Prima traccia",
      rarity: "common",
      presentationTier: "achievement",
      mergedIntoMission: "save_first_tool",
    },
    {
      code: "profile_set",
      publicName: "Contesto pronto",
      rarity: "common",
      presentationTier: "achievement",
      mergedIntoMission: null,
    },
    {
      code: "first_verdict",
      publicName: "Prima decisione",
      rarity: "uncommon",
      presentationTier: "achievement",
      mergedIntoMission: "complete_first_comparison",
    },
    {
      code: "pathfinder",
      publicName: "Apri pista",
      rarity: "uncommon",
      presentationTier: "achievement",
      mergedIntoMission: null,
    },
    {
      code: "stack_builder",
      publicName: "Stack iniziale",
      rarity: "uncommon",
      presentationTier: "achievement",
      mergedIntoMission: null,
    },
    {
      code: "radar_return",
      publicName: "Ritorno al segnale",
      rarity: "uncommon",
      presentationTier: "achievement",
      mergedIntoMission: null,
    },
    {
      code: "curator_mark",
      publicName: "Segno del builder",
      rarity: "rare",
      presentationTier: "achievement",
      mergedIntoMission: null,
    },
    {
      code: "strategist",
      publicName: "Decisione ferma",
      rarity: "rare",
      presentationTier: "achievement",
      mergedIntoMission: null,
    },
    {
      code: "cartographer",
      publicName: "Cartografo",
      rarity: "rare",
      presentationTier: "milestone",
      mergedIntoMission: null,
    },
  ] as const;

export function isSignalAchievementCode(
  code: string,
): code is SignalAchievementCode {
  return (SIGNAL_ACHIEVEMENT_CODES as readonly string[]).includes(code);
}

/** Level advancement presentation tiers (server emits; this is display-only). */
export function levelAdvancementTier(level: number): RewardTier {
  return level >= 4 ? "milestone" : "achievement";
}
