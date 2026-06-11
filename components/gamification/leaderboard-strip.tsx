"use client";

import { Trophy } from "lucide-react";
import Marquee from "react-fast-marquee";
import NumberFlow from "@number-flow/react";

import { useLeaderboard } from "@/lib/gamification/hooks/use-leaderboard";
import { cn } from "@/lib/utils";

type LeaderboardStripProps = {
  className?: string;
};

export function LeaderboardStrip({ className }: LeaderboardStripProps) {
  const { data: entries, isLoading } = useLeaderboard();

  if (isLoading || !entries || entries.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("leaderboard-strip", className)}
      role="region"
      aria-label="Classifica settimanale"
    >
      <div className="leaderboard-strip__badge">
        <Trophy size={14} aria-hidden="true" />
        <span>Top weekly</span>
      </div>
      <Marquee
        pauseOnHover
        speed={36}
        gradient={false}
        className="leaderboard-strip__marquee"
      >
        {entries.map((entry, index) => (
          <div
            key={entry.user_id}
            className="leaderboard-strip__item"
            aria-label={`Posizione ${index + 1}, ${entry.xp_gained} XP`}
          >
            <span className="leaderboard-strip__rank">#{index + 1}</span>
            <span className="leaderboard-strip__name">Hunter</span>
            <span className="leaderboard-strip__xp">
              <NumberFlow value={entry.xp_gained} /> XP
            </span>
          </div>
        ))}
      </Marquee>
    </div>
  );
}
