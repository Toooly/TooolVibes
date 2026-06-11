"use client";

import { GameMissionPanel } from "@/components/gamification/game-mission-panel";

export function ArenaGameMissions() {
  return (
    <GameMissionPanel
      scope="arena"
      variant="arena"
      rewardId="arena-battle-pass"
      eyebrow="Battle pass arena"
      title="La stanza confronto ha il suo XP."
      description="Ogni tool entra come contendente: il confronto puo crescere in sfide, livelli e verdetti sempre piu leggibili."
    />
  );
}
