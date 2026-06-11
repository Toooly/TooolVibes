"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Loader2, Sparkles, Swords, Trophy } from "lucide-react";
import { toast } from "sonner";

import { useArenaBattle } from "@/lib/gamification/hooks/use-arena-battle";
import type { ArenaBattle, ArenaBattleMode } from "@/lib/gamification/types";
import { cn } from "@/lib/utils";

type ArenaBattleStageProps = {
  className?: string;
  mode: ArenaBattleMode;
  toolSlugs: string[];
  scoreSnapshot: Record<string, number>;
  onComplete?: (winnerSlug: string) => void;
};

const MODE_LABELS: Record<ArenaBattleMode, string> = {
  "1v1": "Duello 1 vs 1",
  royale: "Battaglia Royale",
  bracket: "Torneo ad Eliminazione",
};

const REASON_LABELS: Record<string, string> = {
  votes: "voti",
  trend: "trend",
  comments: "commenti",
  completeness: "completezza",
  surprise: "sorpresa",
};

export function ArenaBattleStage({
  className,
  mode,
  toolSlugs,
  scoreSnapshot,
  onComplete,
}: ArenaBattleStageProps) {
  const { lastBattle, createBattle, isCreating, clearLastBattle } =
    useArenaBattle();
  const [displayedBattle, setDisplayedBattle] = useState<ArenaBattle | null>(
    null,
  );

  const battleKey = useMemo(
    () => `${mode}:${toolSlugs.join(",")}:${JSON.stringify(scoreSnapshot)}`,
    [mode, toolSlugs, scoreSnapshot],
  );

  useEffect(() => {
    setDisplayedBattle(null);
    clearLastBattle();
  }, [battleKey, clearLastBattle]);

  useEffect(() => {
    if (!lastBattle && !isCreating && toolSlugs.length > 0) {
      createBattle({ mode, toolSlugs, scoreSnapshot });
    }
  }, [
    lastBattle,
    isCreating,
    battleKey,
    createBattle,
    mode,
    toolSlugs,
    scoreSnapshot,
  ]);

  useEffect(() => {
    if (lastBattle && !displayedBattle) {
      setDisplayedBattle(lastBattle);
      toast.success(`${lastBattle.winner_slug} vince la battaglia!`, {
        icon: <Trophy className="h-4 w-4" />,
      });
      onComplete?.(lastBattle.winner_slug);
    }
  }, [lastBattle, displayedBattle, onComplete]);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--gradient-panel)] p-6 shadow-card",
        className,
      )}
    >
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
            <Swords className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              {MODE_LABELS[mode]}
            </h3>
            <p className="text-sm text-[var(--muted)]">
              {toolSlugs.length} contendenti
            </p>
          </div>
        </div>
        {isCreating && (
          <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
        )}
      </header>

      {isCreating && !displayedBattle && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-[var(--muted)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
          <p>Preparazione arena…</p>
        </div>
      )}

      <AnimatePresence>
        {displayedBattle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center gap-4 rounded-2xl bg-[var(--gold-soft)] p-4 text-center">
              <Sparkles
                className="h-5 w-5 text-[var(--gold)]"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm text-[var(--muted-strong)]">Vincitore</p>
                <p className="text-xl font-bold text-[var(--foreground)]">
                  {displayedBattle.winner_slug}
                </p>
              </div>
              <Trophy
                className="h-5 w-5 text-[var(--gold)]"
                aria-hidden="true"
              />
            </div>

            <ul className="space-y-2">
              {displayedBattle.battle_log.map((turn, index) => (
                <motion.li
                  key={`${turn.turn}-${turn.attacker}-${turn.defender}-${index}`}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.06 }}
                  className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/60 px-4 py-3 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-muted)] text-xs font-medium text-[var(--muted-strong)]">
                      {turn.turn}
                    </span>
                    <span className="text-sm text-[var(--foreground)]">
                      <strong>{turn.attacker}</strong> colpisce{" "}
                      <strong>{turn.defender}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-[var(--muted)]">
                      {REASON_LABELS[turn.reason] ?? turn.reason}
                    </span>
                    <span className="inline-flex min-w-[3rem] items-center justify-end font-semibold text-[var(--danger)]">
                      -<NumberFlow value={turn.damage} />
                    </span>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
