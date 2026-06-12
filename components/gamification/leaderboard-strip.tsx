"use client";

import { Trophy } from "lucide-react";
import Marquee from "react-fast-marquee";
import NumberFlow from "@number-flow/react";
import { useEffect, useState } from "react";

import { useLeaderboard } from "@/lib/gamification/hooks/use-leaderboard";
import { cn } from "@/lib/utils";

type LeaderboardStripProps = {
  className?: string;
};

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mediaQuery.matches);

    function handleChange(event: MediaQueryListEvent) {
      setReduced(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return reduced;
}

function LeaderboardSkeleton() {
  return (
    <div className="leaderboard-strip__marquee flex flex-1 items-center gap-3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-5 w-28 animate-pulse rounded-full bg-muted"
        />
      ))}
    </div>
  );
}

function LeaderboardEmpty() {
  return (
    <div className="leaderboard-strip__marquee flex flex-1 items-center overflow-hidden text-xs text-muted-foreground">
      Classifica settimanale in aggiornamento…
    </div>
  );
}

export function LeaderboardStrip({ className }: LeaderboardStripProps) {
  const { data: entries, isLoading } = useLeaderboard();
  const reducedMotion = usePrefersReducedMotion();

  const renderEntries = () =>
    entries?.map((entry) => (
      <div
        key={entry.user_id}
        className="leaderboard-strip__item"
        aria-label={`Posizione ${entry.rank ?? "-"}, ${entry.xp_gained} XP`}
      >
        <span className="leaderboard-strip__rank">#{entry.rank ?? "-"}</span>
        <span className="leaderboard-strip__name">
          Hunter #{entry.rank ?? "-"}
        </span>
        <span className="leaderboard-strip__xp">
          <NumberFlow value={entry.xp_gained} /> XP
        </span>
      </div>
    ));

  return (
    <div
      className={cn("leaderboard-strip h-8", className)}
      role="region"
      aria-label="Classifica settimanale"
    >
      <div className="leaderboard-strip__badge">
        <Trophy size={14} aria-hidden="true" />
        <span>Top weekly</span>
      </div>
      {isLoading ? (
        <LeaderboardSkeleton />
      ) : !entries || entries.length === 0 ? (
        <LeaderboardEmpty />
      ) : reducedMotion ? (
        <div className="leaderboard-strip__marquee flex flex-1 items-center gap-2 overflow-hidden">
          {renderEntries()}
        </div>
      ) : (
        <Marquee
          pauseOnHover
          speed={36}
          gradient={false}
          className="leaderboard-strip__marquee"
        >
          {renderEntries()}
        </Marquee>
      )}
    </div>
  );
}
