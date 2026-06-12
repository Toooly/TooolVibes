"use client";

import { GameMissionPanel } from "@/components/gamification/game-mission-panel";

export function RadarGameMissions() {
  return (
    <GameMissionPanel
      scope="radar"
      variant="radar"
      eyebrow="Missioni radar"
      title="Daily scan pronto al claim."
      description="Il radar diventa una routine giornaliera: intercetta, leggi i segnali, porta i tool migliori verso la directory."
    />
  );
}
