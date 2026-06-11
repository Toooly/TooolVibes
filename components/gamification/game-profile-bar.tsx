"use client";

import { Flame, Trophy } from "lucide-react";
import NumberFlow from "@number-flow/react";

import { useGameProfile } from "@/lib/gamification/hooks/use-game-profile";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import { xpProgressInLevel } from "@/lib/gamification/level-utils";
import { cn } from "@/lib/utils";

type GameProfileBarProps = {
  className?: string;
};

export function GameProfileBar({ className }: GameProfileBarProps) {
  const { profile, isLoading } = useGameProfile();
  const localXp = useGameProgressStore((state) => state.totalXp);

  if (!isLoading && !profile) {
    return null;
  }

  const level = profile?.level ?? 1;
  const totalXp = profile?.xp ?? localXp;
  const streakDays = profile?.streak_days ?? 0;
  const { current, needed } = xpProgressInLevel(totalXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((current / needed) * 100)));

  return (
    <div
      className={cn(
        "game-profile-bar",
        isLoading && "game-profile-bar--loading",
        className
      )}
      aria-label={`Livello ${level}, ${totalXp} XP, serie di ${streakDays} giorni`}
    >
      <div className="game-profile-bar__level" aria-hidden="true">
        <Trophy size={14} />
        <span>Lv</span>
        <NumberFlow value={level} />
      </div>

      <div className="game-profile-bar__xp">
        <div className="game-profile-bar__track" aria-hidden="true">
          <span
            className="game-profile-bar__fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="game-profile-bar__total">
          <NumberFlow value={totalXp} /> XP
        </span>
      </div>

      {streakDays > 0 && (
        <div className="game-profile-bar__streak" aria-label={`${streakDays} giorni di serie`}>
          <Flame size={14} />
          <NumberFlow value={streakDays} />
        </div>
      )}
    </div>
  );
}
