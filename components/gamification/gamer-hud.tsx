"use client";

import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import { Flame, Trophy, Zap } from "lucide-react";

import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import { useGameProfile } from "@/lib/gamification/hooks/use-game-profile";
import { xpProgressInLevel } from "@/lib/gamification/level-utils";
import { cn } from "@/lib/utils";

type GamerHudProps = {
  className?: string;
  compact?: boolean;
};

// Persistent header HUD that turns the user's level, XP and streak into a compact game status.
export function GamerHud({ className, compact = false }: GamerHudProps) {
  const { profile } = useGameProfile();
  const localXp = useGameProgressStore((state) => state.totalXp);

  if (!profile) {
    return null;
  }

  const totalXp = Math.max(profile.xp, localXp);
  const level = profile.level;
  const streakDays = profile.streak_days;
  const { current, needed } = xpProgressInLevel(totalXp);
  const progressPercent = Math.min(100, Math.max(0, Math.round((current / needed) * 100)));

  return (
    <aside
      className={cn("gamer-hud", compact && "gamer-hud--compact", className)}
      aria-label={`Livello ${level}, ${totalXp} XP, streak ${streakDays} giorni`}
      data-hud-level={level}
    >
      <span className="gamer-hud__level">
        <Trophy aria-hidden="true" size={15} />
        <span>Lv</span>
        <strong>
          <NumberFlow value={level} />
        </strong>
      </span>

      <div className="gamer-hud__xp" aria-hidden="true">
        <div className="gamer-hud__track relative h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#6a3cff] to-[#39d2f6]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <span className="gamer-hud__xp-value">
          <Zap aria-hidden="true" size={12} />
          <NumberFlow value={totalXp} /> XP
        </span>
      </div>

      <span className={cn("gamer-hud__streak", streakDays > 0 && "is-active")}>
        <Flame aria-hidden="true" size={14} />
        <NumberFlow value={streakDays} />
      </span>
    </aside>
  );
}
