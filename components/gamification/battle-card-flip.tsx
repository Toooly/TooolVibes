"use client";

import { useState, type CSSProperties } from "react";
import NumberFlow from "@number-flow/react";
import { motion } from "motion/react";
import { RotateCcw, Sparkles, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";

export type BattleCardFlipStat = {
  label: string;
  value: string | number;
};

type BattleCardFlipProps = {
  name: string;
  initials: string;
  category?: string;
  score: number;
  accentFrom?: string;
  accentTo?: string;
  stats?: BattleCardFlipStat[];
  revealed?: boolean;
  winner?: boolean;
  dimmed?: boolean;
  className?: string;
};

// Trading-card flip used by Arena to reveal each tool's battle stats in a tactile way.
export function BattleCardFlip({
  name,
  initials,
  category,
  score,
  accentFrom = "#6a3cff",
  accentTo = "#39d2f6",
  stats = [],
  revealed = false,
  winner = false,
  dimmed = false,
  className,
}: BattleCardFlipProps) {
  const [flipped, setFlipped] = useState(false);
  const isBackVisible = revealed || flipped;

  return (
    <motion.button
      type="button"
      className={cn(
        "battle-card-flip relative",
        "rounded-2xl border border-white/10",
        "bg-gradient-to-br from-white/10 to-white/5",
        "shadow-[0_8px_32px_rgba(106,60,255,0.15)]",
        winner && "is-winner",
        dimmed && "is-dimmed",
        className,
      )}
      style={
        {
          "--battle-card-a": accentFrom,
          "--battle-card-b": accentTo,
        } as CSSProperties
      }
      aria-pressed={isBackVisible}
      aria-label={`${name}, punteggio ${score}. Tocca per girare la card`}
      onClick={() => setFlipped((value) => !value)}
      whileTap={{ scale: 0.98 }}
    >
      <div className="battle-card-flip__shine" aria-hidden="true" />
      <motion.span
        className="battle-card-flip__inner"
        animate={{ rotateY: isBackVisible ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <span className="battle-card-flip__face battle-card-flip__face--front">
          <span className="battle-card-flip__glyph">{initials}</span>
          <span className="battle-card-flip__name">{name}</span>
          <span className="battle-card-flip__category">{category ?? "Tool"}</span>
          <span className="battle-card-flip__hint">
            <RotateCcw aria-hidden="true" size={12} />
            Stats
          </span>
        </span>

        <span className="battle-card-flip__face battle-card-flip__face--back">
          <span className="battle-card-flip__back-head">
            {winner ? <Trophy aria-hidden="true" size={16} /> : <Sparkles aria-hidden="true" size={16} />}
            <span>{winner ? "Campione" : "Profilo"}</span>
          </span>
          <span className="battle-card-flip__score">
            <NumberFlow value={score} />
            <small>/100</small>
          </span>
          <span className="battle-card-flip__stats">
            {stats.slice(0, 3).map((stat) => (
              <span key={stat.label}>
                <small>{stat.label}</small>
                <strong>{stat.value}</strong>
              </span>
            ))}
          </span>
        </span>
      </motion.span>
    </motion.button>
  );
}
