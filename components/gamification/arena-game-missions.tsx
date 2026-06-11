"use client";

import { GameMissionPanel } from "@/components/gamification/game-mission-panel";

export function ArenaGameMissions({
  featuredCount,
  rewardId = "arena-battle-pass",
}: {
  featuredCount: number;
  rewardId?: string;
}) {
  return (
    <GameMissionPanel
      scope="arena"
      variant="arena"
      rewardId={rewardId}
      eyebrow="Battle pass arena"
      title="La stanza confronto ha il suo XP."
      description="Ogni tool entra come contendente: il confronto puo crescere in sfide, livelli e verdetti sempre piu leggibili."
    />
  );
}
