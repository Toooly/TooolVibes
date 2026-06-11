"use client";

import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import { BadgeUnlockModal } from "./badge-unlock-modal";
import { LevelUpModal } from "./level-up-modal";

export function GameEffectsLayer() {
  const pendingBadge = useGameProgressStore((s) => s.pendingBadge);
  const pendingLevelUp = useGameProgressStore((s) => s.pendingLevelUp);
  const setPendingBadge = useGameProgressStore((s) => s.setPendingBadge);
  const setPendingLevelUp = useGameProgressStore((s) => s.setPendingLevelUp);

  return (
    <>
      <BadgeUnlockModal
        badge={pendingBadge}
        onClose={() => setPendingBadge(null)}
      />
      <LevelUpModal
        level={pendingLevelUp ?? 0}
        onClose={() => setPendingLevelUp(null)}
      />
    </>
  );
}
