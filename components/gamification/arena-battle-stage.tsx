"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Swords, Trophy, RotateCcw, AlertCircle } from "lucide-react";

import type { BattleResult, BattleTool } from "@/lib/gamification/battle-engine";
import { useArenaBattle } from "@/lib/gamification/hooks/use-arena-battle";
import type { ArenaBattleMode } from "@/lib/gamification/types";

const MINIMUM_FIGHT_DURATION_MS = 2000;

export function ArenaBattleStage({
  tools,
  mode,
}: {
  tools: BattleTool[];
  mode: ArenaBattleMode;
}) {
  const [status, setStatus] = useState<"idle" | "fighting" | "done" | "error">("idle");
  const [result, setResult] = useState<BattleResult | null>(null);
  const { mutateAsync } = useArenaBattle();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const toolNameBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tools) map.set(t.slug, t.name ?? t.slug);
    return map;
  }, [tools]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const startBattle = async () => {
    setStatus("fighting");
    try {
      const battlePromise = mutateAsync({ mode, tools });
      const delayPromise = new Promise<void>((resolve) => {
        timeoutRef.current = setTimeout(resolve, MINIMUM_FIGHT_DURATION_MS);
      });
      const [battle] = await Promise.all([battlePromise, delayPromise]);
      if (isMountedRef.current) {
        setResult({
          mode: battle.mode,
          toolSlugs: battle.tool_slugs,
          winnerSlug: battle.winner_slug,
          scoreSnapshot: battle.score_snapshot,
          battleLog: battle.battle_log,
        });
        setStatus("done");
      }
    } catch {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (isMountedRef.current) {
        setStatus("error");
      }
    }
  };

  const reset = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setStatus("idle");
    setResult(null);
  };

  const readableName = (slug: string) => toolNameBySlug.get(slug) ?? slug;

  return (
    <section className="arena-battle-stage">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Swords className="h-5 w-5" aria-hidden="true" />
        </span>
        <h3 className="text-lg font-semibold text-[var(--foreground)]">Arena</h3>
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
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-medium text-white transition hover:bg-[var(--accent-strong)]"
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
                Vincitore: {readableName(result.winnerSlug)}
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {result.toolSlugs.map((slug) => (
                <li
                  key={slug}
                  className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-white/60 px-4 py-3"
                >
                  <span className="font-medium text-[var(--foreground)]">
                    {readableName(slug)}
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

        {status === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col items-center gap-4 py-10 text-center"
          >
            <AlertCircle className="h-8 w-8 text-[var(--game-danger)]" />
            <p className="text-sm text-[var(--muted)]">
              La battaglia non è partita. Riprova tra un attimo.
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-5 py-2.5 font-medium text-[var(--foreground)] transition hover:bg-[var(--line)]"
            >
              <RotateCcw className="h-4 w-4" />
              Riprova
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
