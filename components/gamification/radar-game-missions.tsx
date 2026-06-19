"use client";

import { GameMissionPanel } from "@/components/gamification/game-mission-panel";

export function RadarGameMissions() {
  return (
    <GameMissionPanel
      scope="radar"
      variant="radar"
      eyebrow="Missioni radar"
      title="Scansione giornaliera pronta."
      description="Il radar diventa una routine giornaliera: intercetta i segnali, leggili con calma e porta i tool migliori verso il catalogo."
    />
  );
}
