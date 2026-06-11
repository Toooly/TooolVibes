"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Swords, Trophy, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import type { BattleResult } from "@/lib/gamification/battle-engine";
import { useArenaBattle } from "@/lib/gamification/hooks/use-arena-battle";
import type { ArenaBattleMode } from "@/lib/gamification/types";

export function ArenaBattleStage({
  tools,
  mode,
}: {
  tools: { slug: string; votes: number; trend7d: number; comments: number; completeness: number }[];
  mode: ArenaBattleMode;
}) {
  const [status, setStatus] = useState<"idle" | "fighting" | "done">("idle");
  const [result, setResult] = useState<BattleResult | null>(null);
  const { mutateAsync } = useArenaBattle();

  const startBattle = async () => {
    setStatus("fighting");
    try {
      const battlePromise = mutateAsync({ mode, tools });
      await new Promise((resolve) => setTimeout(resolve, 5000));
      const battle = await battlePromise;
      setResult({
        mode: battle.mode,
        toolSlugs: battle.tool_slugs,
        winnerSlug: battle.winner_slug,
        scoreSnapshot: battle.score_snapshot,
        battleLog: battle.battle_log,
      });
      setStatus("done");
    } catch {
      toast.error("Errore durante la battaglia");
      setStatus("idle");
    }
  };

  const reset = () => {
    setStatus("idle");
    setResult(null);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--gradient-panel)] p-6 shadow-card">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Swords className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-semibold text-[var(--foreground)]">
          Arena
        </h3>
      </header>

      <AnimatePresence mode="wait">
        {status === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center justify-center gap-4 py-10"
          >
            <p className="text-sm text-[var(--muted)]">
              {tools.length} contendenti pronti per la battaglia
            </p>
            <button
              type="button"
              onClick={startBattle}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-medium text-white transition hover:bg-[var(--accent-hover)]"
            >
              <Swords className="h-4 w-4" />
              Inizia battaglia
            </button>
          </motion.div>
        )}

        {status === "fighting" && (
          <motion.div
            key="fighting"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col items-center justify-center gap-4 py-16"
          >
            <span className="relative flex h-12 w-12 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent-soft)] opacity-75" />
              <Swords className="relative h-6 w-6 text-[var(--accent)]" />
            </span>
            <p className="animate-pulse text-base font-medium text-[var(--foreground)]">
              Battaglia in corso…
            </p>
          </motion.div>
        )}

        {status === "done" && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center gap-3 rounded-2xl bg-[var(--gold-soft)] p-5 text-center">
              <Trophy className="h-6 w-6 text-[var(--gold)]" />
              <p className="text-lg font-bold text-[var(--foreground)]">
                Vincitore: {result.winnerSlug}
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {result.toolSlugs.map((slug) => (
                <li
                  key={slug}
                  className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/60 px-4 py-3"
                >
                  <span className="font-medium text-[var(--foreground)]">
                    {slug}
                  </span>
                  <NumberFlow
                    value={Math.round(result.scoreSnapshot[slug] ?? 0)}
                    className="text-lg font-semibold text-[var(--accent)]"
                  />
                </li>
              ))}
            </ul>

            <div className="flex justify-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-5 py-2.5 font-medium text-[var(--foreground)] transition hover:bg-[var(--line)]"
              >
                <RotateCcw className="h-4 w-4" />
                Rigioca
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
