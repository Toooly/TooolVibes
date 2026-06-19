"use client";

import { GameMissionPanel } from "@/components/gamification/game-mission-panel";

export function ArenaGameMissions() {
  return (
    <GameMissionPanel
      scope="arena"
      variant="arena"
      eyebrow="Missioni confronto"
      title="Anche il confronto fa crescere il tuo XP."
      description="Ogni tool entra come contendente: il confronto può crescere in sfide, livelli e verdetti sempre più leggibili."
    />
  );
}
