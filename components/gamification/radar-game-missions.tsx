"use client";

import { LocalizedAttributes } from "@/components/i18n/localized-text";
import { GameMissionPanel } from "@/components/gamification/game-mission-panel";
import { useGamificationSurface } from "@/lib/gamification/release-context";

export function RadarGameMissions() {
  const { persistentRewardsEnabled } = useGamificationSurface("missions");

  if (!persistentRewardsEnabled) return null;

  return (
    <LocalizedAttributes><GameMissionPanel
      scope="radar"
      variant="radar"
      eyebrow="Missioni radar"
      title="Scansione giornaliera pronta."
      description="Il radar diventa una routine giornaliera: intercetta i segnali, leggili con calma e porta i tool migliori verso il catalogo."
    /></LocalizedAttributes>
  );
}
