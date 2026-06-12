# Gamification UI/UX Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere le meccaniche di gamification (Vibe Rush header mini-game, mobile Arena fight scene, mobile comparison matrix) visivamente coerenti, premium e delight, secondo lo spec in `docs/superpowers/specs/2026-06-08-gamification-ui-ux-polish-design.md`.

**Architecture:** Lavoriamo sui tre componenti esistenti senza cambiare backend o navigazione. Aggiungiamo un piccolo hook `useReducedMotion`, un helper per lo scroll sincronizzato e nuovi token CSS. Il motion resta basato su `transform`/`opacity` per garantire 60 fps.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Motion, NumberFlow, canvas-confetti, Sonner.

---

## File Structure

| File | Responsibility |
|------|----------------|
| `components/gamification/vibe-tap-mini-game.tsx` | Launcher + modal di Vibe Rush. |
| `components/layout/site-header-v2.tsx` | Posizionamento del launcher nell'header. |
| `components/tools/mobile-compare-view.tsx` | Arena mobile, fight scene, matrice confronti. |
| `components/gamification/arena-battle-stage.tsx` | Versione desktop/gamification della battaglia. |
| `app/globals.css` | Nuovi stili, token e keyframes. |
| `lib/hooks/use-reduced-motion.ts` | Rileva `prefers-reduced-motion`. |

---

## Helper da creare una tantum

### `lib/hooks/use-reduced-motion.ts`

Create this file before any task that uses it.

```ts
"use client";

import { useEffect, useState } from "react";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
```

---

## Task 1: Refactor VibeTapMiniGame

**Files:**
- Modify: `components/gamification/vibe-tap-mini-game.tsx`

**Why:** Aggiungere timer circolare, feedback visivo a ogni hit, end screen, evitare che i target saltino bruscamente e sistemare lo stale closure nel timer.

- [ ] **Step 1: Replace the component code**

```tsx
"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { Gamepad2, Sparkles, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

type VibeTarget = {
  id: number;
  x: number;
  y: number;
  size: number;
};

type FloatingScore = {
  id: number;
  x: number;
  y: number;
  value: number;
};

type VibeTapMiniGameProps = {
  className?: string;
};

const GAME_SECONDS = 12;
const TARGET_COUNT = 5;

function createTargets(seed: number): VibeTarget[] {
  return Array.from({ length: TARGET_COUNT }).map((_, index) => {
    const angle = (seed * 37 + index * 71) % 360;
    const radius = 18 + ((seed + index * 19) % 28);

    return {
      id: seed * 10 + index,
      x: 50 + Math.cos((angle * Math.PI) / 180) * radius,
      y: 50 + Math.sin((angle * Math.PI) / 180) * radius,
      size: 2.4 + ((seed + index) % 3) * 0.35,
    };
  });
}

async function celebrateMiniGame(score: number) {
  const { default: confetti } = await import("canvas-confetti");

  confetti({
    colors: ["#6a3cff", "#39d2f6", "#f3bf4c", "#ffffff"],
    disableForReducedMotion: true,
    origin: { y: 0.58 },
    particleCount: Math.min(90, 34 + score * 2),
    scalar: 0.78,
    spread: 54,
  });
}

function CircularTimer({ seconds, total }: { seconds: number; total: number }) {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, seconds / total);
  const dash = circumference * progress;
  const urgent = seconds <= 3;

  return (
    <div className="vibe-mini-game__timer" data-urgent={urgent} aria-hidden="true">
      <svg viewBox="0 0 44 44">
        <circle className="vibe-mini-game__timer-track" cx="22" cy="22" r={radius} />
        <circle
          className="vibe-mini-game__timer-fill"
          cx="22"
          cy="22"
          r={radius}
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset={0}
          transform="rotate(-90 22 22)"
        />
      </svg>
      <NumberFlow value={seconds} />
    </div>
  );
}

export function VibeTapMiniGame({ className }: VibeTapMiniGameProps) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [wave, setWave] = useState(1);
  const [finished, setFinished] = useState(false);
  const [floaters, setFloaters] = useState<FloatingScore[]>([]);
  const reducedMotion = useReducedMotion();
  const scoreRef = useRef(score);
  const floaterIdRef = useRef(0);

  scoreRef.current = score;

  const targets = useMemo(() => createTargets(wave), [wave]);
  const charge = Math.min(100, Math.round((score / 24) * 100));

  useEffect(() => {
    if (!running) return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setRunning(false);
          setCombo(1);
          setFinished(true);
          const finalScore = scoreRef.current;
          void celebrateMiniGame(finalScore);
          toast.success(finalScore >= 20 ? "Vibe rush completato" : "Mini run chiusa", {
            description: `Hai raccolto ${finalScore} vibe in ${GAME_SECONDS} secondi.`,
          });
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  function startGame() {
    setScore(0);
    setCombo(1);
    setFinished(false);
    setWave((current) => current + 1);
    setTimeLeft(GAME_SECONDS);
    setRunning(true);
    setFloaters([]);
  }

  function closeGame() {
    setOpen(false);
    setRunning(false);
    setFinished(false);
    setScore(0);
    setCombo(1);
    setTimeLeft(GAME_SECONDS);
    setFloaters([]);
  }

  function hitTarget(targetId: number, targetX: number, targetY: number) {
    if (!running) {
      startGame();
      return;
    }

    const gain = combo;
    setScore((current) => current + gain);
    setCombo((current) => Math.min(5, current + 1));

    const id = ++floaterIdRef.current;
    setFloaters((current) => [...current, { id, x: targetX, y: targetY, value: gain }]);
    window.setTimeout(() => {
      setFloaters((current) => current.filter((f) => f.id !== id));
    }, 650);
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label="Apri il minigioco Vibe Rush"
        onClick={() => setOpen(true)}
        data-sonic-action="tap"
      >
        <span className="vibe-mini-launcher__core" aria-hidden="true">
          <Gamepad2 size={15} />
          <span />
        </span>
        <span className="vibe-mini-launcher__label">Vibe Rush</span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            className="vibe-mini-game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-label="Vibe Rush"
          >
            <button
              type="button"
              className="vibe-mini-game__backdrop"
              aria-label="Chiudi minigioco"
              onClick={closeGame}
            />
            <motion.div
              className="vibe-mini-game__panel"
              initial={{ y: 18, scale: 0.96, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 12, scale: 0.96, opacity: 0 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
            >
              <div className="vibe-mini-game__top">
                <div>
                  <p className="vibe-mini-game__eyebrow">Mini run</p>
                  <h2>Vibe Rush</h2>
                </div>
                <button type="button" aria-label="Chiudi Vibe Rush" onClick={closeGame}>
                  <X size={18} />
                </button>
              </div>

              <div
                className="vibe-mini-game__stats"
                aria-live="polite"
                aria-atomic="false"
                aria-relevant="text"
              >
                <span>
                  Score <strong><NumberFlow value={score} /></strong>
                </span>
                <span data-combo={combo}>
                  Combo <strong>x<NumberFlow value={combo} /></strong>
                </span>
                <span>
                  Time <CircularTimer seconds={timeLeft} total={GAME_SECONDS} /></span>
              </div>

              <div className="vibe-mini-game__stage" data-running={running} data-finished={finished}>
                <span
                  className="vibe-mini-game__charge"
                  style={{ "--charge": `${charge}%` } as CSSProperties}
                />
                {targets.map((target) => (
                  <motion.button
                    key={target.id}
                    type="button"
                    className="vibe-mini-game__target"
                    style={
                      {
                        left: `${target.x}%`,
                        top: `${target.y}%`,
                        width: `${target.size}rem`,
                      } as CSSProperties
                    }
                    initial={reducedMotion ? {} : { scale: 0, opacity: 0 }}
                    animate={reducedMotion ? {} : { scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 380, damping: 18 }}
                    whileTap={{ scale: 0.76 }}
                    onClick={() => hitTarget(target.id, target.x, target.y)}
                    aria-label={`Raccogli vibe target ${target.id}`}
                  >
                    <Sparkles size={15} />
                  </motion.button>
                ))}

                <AnimatePresence>
                  {floaters.map((f) => (
                    <motion.span
                      key={f.id}
                      className="vibe-mini-game__floater"
                      initial={{ opacity: 1, y: 0, scale: 1 }}
                      animate={{ opacity: 0, y: -32, scale: 1.15 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ left: `${f.x}%`, top: `${f.y}%` } as CSSProperties}
                    >
                      +{f.value}
                    </motion.span>
                  ))}
                </AnimatePresence>

                {!running && !finished ? (
                  <button type="button" className="vibe-mini-game__start" onClick={startGame}>
                    <Zap size={16} />
                    Start rush
                  </button>
                ) : null}

                {finished ? (
                  <div className="vibe-mini-game__result">
                    <span className="vibe-mini-game__result-title">
                      {score >= 20 ? "Vibe rush completato" : "Mini run chiusa"}
                    </span>
                    <span className="vibe-mini-game__result-score">
                      <NumberFlow value={score} /> vibe raccolti
                    </span>
                    <div className="vibe-mini-game__result-actions">
                      <button type="button" className="vibe-mini-game__start" onClick={startGame}>
                        <Zap size={16} />
                        Gioca ancora
                      </button>
                      <button type="button" className="vibe-mini-game__hint-btn" onClick={closeGame}>
                        Chiudi
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              {!running && !finished ? (
                <p className="vibe-mini-game__hint">
                  Micro run da {GAME_SECONDS}s: ritmo, tap e feedback immediato.
                </p>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit --pretty`
Expected: no errors in `vibe-tap-mini-game.tsx`

- [ ] **Step 3: Commit**

```bash
git add components/gamification/vibe-tap-mini-game.tsx lib/hooks/use-reduced-motion.ts
git commit -m "feat(gamification): refactor VibeTapMiniGame with circular timer, floaters and end screen"
```

---

## Task 2: Update SiteHeaderV2 launcher

**Files:**
- Modify: `components/layout/site-header-v2.tsx`

**Why:** Rinominare la label in "Vibe Rush" e assicurarsi che il launcher occupi lo spazio corretto tra logo e wordmark.

- [ ] **Step 1: Update launcher usage**

In `components/layout/site-header-v2.tsx`, find the `VibeTapMiniGame` usage and ensure it is:

```tsx
<VibeTapMiniGame className="vibe-mini-launcher" />
```

The existing code already passes this className (line 145), so no change is required unless you want an explicit wrapper. Confirm the label in the launcher component now reads "Vibe Rush" (done in Task 1).

- [ ] **Step 2: Commit**

```bash
git add components/layout/site-header-v2.tsx
git commit -m "chore(header): keep Vibe Rush launcher integration"
```

---

## Task 3: Polish gamification ArenaBattleStage

**Files:**
- Modify: `components/gamification/arena-battle-stage.tsx`

**Why:** Fix `--accent-hover` undefined variable, show readable tool names, show error state.

- [ ] **Step 1: Replace the component code**

```tsx
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
    for (const t of tools) map.set(t.slug, t.slug);
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
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 font-medium text-white transition hover:bg-[#5a2de6]"
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
```

- [ ] **Step 2: Commit**

```bash
git add components/gamification/arena-battle-stage.tsx
git commit -m "fix(gamification): polish ArenaBattleStage UI and error state"
```

---

## Task 4: Polish mobile ArenaBattleStage

**Files:**
- Modify: `components/tools/mobile-compare-view.tsx`

**Why:** Migliorare posizionamento fighter, aggiungere linee di energia, tooltip nomi, winner highlight più marcato.

- [ ] **Step 1: Replace the local `ArenaBattleStage` sub-component**

Find the local `ArenaBattleStage` function (lines 376-470) and replace it with:

```tsx
type BattleState = "idle" | "fighting" | "result";

const FIGHTER_POSITIONS: Record<number, Array<{ x: number; y: number; align?: string }>> = {
  2: [
    { x: 18, y: 62 },
    { x: 82, y: 62 },
  ],
  3: [
    { x: 50, y: 24 },
    { x: 20, y: 74 },
    { x: 80, y: 74 },
  ],
  4: [
    { x: 22, y: 28 },
    { x: 78, y: 28 },
    { x: 22, y: 76 },
    { x: 78, y: 76 },
  ],
  5: [
    { x: 50, y: 18 },
    { x: 16, y: 50 },
    { x: 84, y: 50 },
    { x: 30, y: 82 },
    { x: 70, y: 82 },
  ],
};

function ArenaBattleStage({
  battleState,
  onFight,
  tools,
  winner,
}: {
  battleState: BattleState;
  onFight: () => void;
  tools: NormalisedTool[];
  winner: NormalisedTool;
}) {
  const modeLabel =
    tools.length === 2
      ? "Duel"
      : tools.length === 3
        ? "Tri-clash"
        : tools.length === 4
          ? "Corners"
          : "Vibe royale";

  const positions = FIGHTER_POSITIONS[tools.length] ?? FIGHTER_POSITIONS[2];
  const reducedMotion = useReducedMotion();

  return (
    <section
      className="mobile-compare-arena__battle-stage"
      data-count={Math.min(tools.length, 5)}
      data-state={battleState}
      aria-label="Arena fight"
    >
      <div className="mobile-compare-arena__battle-grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="mobile-compare-arena__battle-core">
        <span>{modeLabel}</span>
        <strong>
          {battleState === "fighting" ? "CLASH" : battleState === "result" ? "WINNER" : "READY"}
        </strong>
      </div>

      {battleState === "fighting" && (
        <div className="mobile-compare-arena__energy-lines" aria-hidden="true">
          {positions.map((pos, i) => (
            <span
              key={i}
              className="mobile-compare-arena__energy-line"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` } as CSSProperties}
            />
          ))}
        </div>
      )}

      <div className="mobile-compare-arena__fighters">
        {tools.map((tool, index) => {
          const isWinner = battleState === "result" && tool.slug === winner.slug;
          const pos = positions[index] ?? positions[0];

          return (
            <motion.div
              key={tool.slug}
              className={cn("mobile-compare-arena__fighter", isWinner && "is-winner")}
              style={
                {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  "--arena-a": tool.accentFrom,
                  "--arena-b": tool.accentTo,
                  "--fighter-index": index,
                } as CSSProperties
              }
              animate={
                battleState === "fighting" && !reducedMotion
                  ? { scale: [1, 1.12, 0.98, 1.08, 1], rotate: [0, -5, 4, -2, 0] }
                  : { scale: isWinner ? 1.12 : 1, rotate: 0 }
              }
              transition={{ duration: battleState === "fighting" ? 0.82 : 0.28, repeat: battleState === "fighting" ? Infinity : 0 }}
            >
              <span className="mobile-compare-arena__fighter-orb">
                {tool.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="mobile-compare-arena__fighter-name" title={tool.name}>
                {tool.name}
              </span>
              <small>{tool.score}</small>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {battleState === "result" ? (
          <motion.div
            className="mobile-compare-arena__battle-result"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
          >
            <Trophy className="size-4" />
            <span>{winner.name} vince il round</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        className="mobile-compare-arena__fight-button"
        disabled={battleState === "fighting"}
        onClick={onFight}
        data-sonic-action="battle"
      >
        <Swords className="size-5" />
        {battleState === "fighting" ? "Fighting..." : "FIGHT"}
      </button>
    </section>
  );
}
```

- [ ] **Step 2: Import `useReducedMotion` in `mobile-compare-view.tsx`**

Add near the top:

```tsx
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
```

Then replace `const reducedMotion = false;` inside `ArenaBattleStage` with:

```tsx
const reducedMotion = useReducedMotion();
```

- [ ] **Step 3: Commit**

```bash
git add components/tools/mobile-compare-view.tsx
git commit -m "feat(compare): polish mobile arena fight scene with energy lines and fixed layouts"
```

---

## Task 5: Synced scroll + improved DiffMatrix

**Files:**
- Modify: `components/tools/mobile-compare-view.tsx`

**Why:** Sincronizzare lo scroll orizzontale delle righe, aggiungere header sticky con nomi tool, evitare di ripetere il nome tool in ogni cella, aggiungere barre comparative.

- [ ] **Step 1: Replace the `DiffMatrix` sub-component**

Find `DiffMatrix` (lines 310-374) and replace with:

```tsx
function DiffMatrix({ tools }: { tools: NormalisedTool[] }) {
  if (tools.length < 2) return null;
  const maxScore = Math.max(...tools.map((t) => t.score), 1);
  const cellsRef = useRef<(HTMLDivElement | null)[]>([]);

  const handleScroll = (index: number) => {
    const source = cellsRef.current[index];
    if (!source) return;
    cellsRef.current.forEach((el, i) => {
      if (el && i !== index) {
        el.scrollLeft = source.scrollLeft;
      }
    });
  };

  const rows = [
    {
      label: "Categoria",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <span className={cn("mobile-compare-arena__matrix-badge", isWinner && "is-winner")}>
          {t.categoryLabel}
        </span>
      ),
      winnerIndex: 0, // no winner logic for category
    },
    {
      label: "Punteggio",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <div className="mobile-compare-arena__matrix-bar">
          <span
            className={cn(isWinner && "is-winner")}
            style={{ width: `${(t.score / maxScore) * 100}%` }}
          />
          <strong>{t.score}</strong>
        </div>
      ),
      winnerIndex: tools.findIndex((t) => t.score === Math.max(...tools.map((tt) => tt.score))),
    },
    {
      label: "Fit",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <span className={cn(isWinner && "mobile-compare-arena__matrix-value--winner")}>
          {t.useCasesCount || "—"}
        </span>
      ),
      winnerIndex: tools.findIndex((t) => t.useCasesCount === Math.max(...tools.map((tt) => tt.useCasesCount))),
    },
    {
      label: "Highlights",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <span className={cn(isWinner && "mobile-compare-arena__matrix-value--winner")}>
          {t.highlights.length}
        </span>
      ),
      winnerIndex: tools.findIndex((t) => t.highlights.length === Math.max(...tools.map((tt) => tt.highlights.length))),
    },
    {
      label: "Tempo",
      render: (t: NormalisedTool) => <span>{t.readingTime}</span>,
      winnerIndex: -1,
    },
  ];

  return (
    <section className="mobile-compare-arena__matrix">
      <div className="mobile-compare-arena__matrix-header">
        <Scale className="size-4" />
        <span>Confronto caratteristiche</span>
      </div>

      <div className="mobile-compare-arena__matrix-head" aria-hidden="true">
        <div className="mobile-compare-arena__matrix-axis mobile-compare-arena__matrix-axis--head">
          Attributo
        </div>
        <div className="mobile-compare-arena__matrix-cells">
          {tools.map((tool) => (
            <div
              key={tool.slug}
              className="mobile-compare-arena__matrix-cell mobile-compare-arena__matrix-cell--head"
              style={{ "--arena-a": tool.accentFrom, "--arena-b": tool.accentTo } as CSSProperties}
            >
              <span className="mobile-compare-arena__matrix-tool">{tool.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mobile-compare-arena__matrix-grid">
        {rows.map((row, rowIndex) => (
          <div key={row.label} className="mobile-compare-arena__matrix-row">
            <div className="mobile-compare-arena__matrix-axis">{row.label}</div>
            <div
              className="mobile-compare-arena__matrix-cells"
              ref={(el) => { cellsRef.current[rowIndex] = el; }}
              onScroll={() => handleScroll(rowIndex)}
            >
              {tools.map((tool, toolIndex) => (
                <div
                  key={tool.slug}
                  className={cn(
                    "mobile-compare-arena__matrix-cell",
                    toolIndex === row.winnerIndex && "is-winner",
                  )}
                  style={{ "--arena-a": tool.accentFrom, "--arena-b": tool.accentTo } as CSSProperties}
                >
                  <span className="mobile-compare-arena__matrix-value">{row.render(tool, toolIndex === row.winnerIndex)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add `useRef` import**

Ensure `useRef` is imported from React at the top of `mobile-compare-view.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/tools/mobile-compare-view.tsx
git commit -m "feat(compare): sync matrix scroll, add sticky header and winner badges"
```

---

## Task 6: Global CSS tokens and styles

**Files:**
- Modify: `app/globals.css`

**Why:** Centralizzare nuovi token e fornire stili per i componenti rinnovati.

- [ ] **Step 1: Add CSS tokens**

Find `:root` and add (or ensure they exist):

```css
:root {
  /* existing tokens */
  --game-danger: #ff4d6d;
  --game-success: #00d084;
}
```

- [ ] **Step 2: Replace VibeTapMiniGame CSS block**

Find the existing `.vibe-mini-launcher` … `.vibe-mini-game__hint` block (around lines 20287–20544) and replace with:

```css
/* ═══════════════════════════════════════════════════════════════
   VIBE TAP MINI GAME
   ═══════════════════════════════════════════════════════════════ */

.vibe-mini-launcher {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.32rem 0.85rem 0.32rem 0.32rem;
  border-radius: 999px;
  border: 1px solid rgba(106, 60, 255, 0.18);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(244, 239, 255, 0.6));
  box-shadow:
    0 4px 14px rgba(106, 60, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  color: #120d2f;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  transition:
    transform 200ms cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 200ms ease,
    border-color 200ms ease;
}

.vibe-mini-launcher:hover {
  transform: translateY(-1px);
  border-color: rgba(106, 60, 255, 0.32);
  box-shadow:
    0 8px 22px rgba(106, 60, 255, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.vibe-mini-launcher__core {
  position: relative;
  display: grid;
  place-items: center;
  width: 1.72rem;
  height: 1.72rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #6a3cff, #39d2f6);
  color: #ffffff;
  box-shadow: 0 3px 10px rgba(106, 60, 255, 0.28);
}

.vibe-mini-launcher__core::after {
  content: "";
  position: absolute;
  top: 0.18rem;
  right: 0.18rem;
  width: 0.38rem;
  height: 0.38rem;
  border-radius: 999px;
  background: #f3bf4c;
  border: 1.5px solid #ffffff;
  box-shadow: 0 0 8px rgba(243, 191, 76, 0.6);
  animation: vibe-launcher-dot-pulse 2.4s ease-in-out infinite;
}

@keyframes vibe-launcher-dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.25); opacity: 0.8; }
}

.vibe-mini-game {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: grid;
  place-items: center;
  padding: 1rem;
}

.vibe-mini-game__backdrop {
  position: absolute;
  inset: 0;
  border: none;
  background: rgba(11, 7, 28, 0.56);
  backdrop-filter: blur(14px);
  cursor: pointer;
}

.vibe-mini-game__panel {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 24rem;
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background:
    radial-gradient(circle at 30% 0%, rgba(106, 60, 255, 0.22), transparent 40%),
    radial-gradient(circle at 80% 100%, rgba(57, 210, 246, 0.16), transparent 40%),
    linear-gradient(135deg, #1a113d, #0f0a24);
  box-shadow:
    0 32px 80px rgba(11, 7, 28, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  color: #ffffff;
  padding: 1.35rem;
  overflow: hidden;
}

.vibe-mini-game__panel::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(106, 60, 255, 0.2), rgba(57, 210, 246, 0.25));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.vibe-mini-game__top {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;
}

.vibe-mini-game__top h2 {
  margin: 0;
  font-family: "Rubik", sans-serif;
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.vibe-mini-game__eyebrow {
  margin: 0 0 0.2rem;
  font-size: 0.65rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #39d2f6;
}

.vibe-mini-game__top button {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.78);
  transition: all 180ms ease;
}

.vibe-mini-game__top button:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.vibe-mini-game__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;
  margin-bottom: 1.1rem;
}

.vibe-mini-game__stats > span {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.55rem 0.35rem;
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.05);
  font-size: 0.6rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.6);
}

.vibe-mini-game__stats > span strong {
  font-size: 1.05rem;
  font-weight: 800;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
}

.vibe-mini-game__stats > span[data-combo="2"] strong,
.vibe-mini-game__stats > span[data-combo="3"] strong {
  color: #f3bf4c;
}

.vibe-mini-game__stats > span[data-combo="4"] strong,
.vibe-mini-game__stats > span[data-combo="5"] strong {
  color: #00d084;
  text-shadow: 0 0 12px rgba(0, 208, 132, 0.45);
}

.vibe-mini-game__timer {
  position: relative;
  display: grid;
  place-items: center;
  width: 2.6rem;
  height: 2.6rem;
  font-size: 0.95rem;
  font-weight: 800;
}

.vibe-mini-game__timer svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.vibe-mini-game__timer-track {
  fill: none;
  stroke: rgba(255, 255, 255, 0.1);
  stroke-width: 3;
}

.vibe-mini-game__timer-fill {
  fill: none;
  stroke: #39d2f6;
  stroke-width: 3;
  stroke-linecap: round;
  transition: stroke-dasharray 1s linear;
}

.vibe-mini-game__timer[data-urgent="true"] .vibe-mini-game__timer-fill {
  stroke: #ff4d6d;
}

.vibe-mini-game__stage {
  position: relative;
  height: 19rem;
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 50% 50%, rgba(106, 60, 255, 0.12), transparent 60%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
  overflow: hidden;
}

.vibe-mini-game__stage::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
  background-size: 2rem 2rem;
  mask-image: radial-gradient(circle at 50% 50%, #000 0%, transparent 75%);
  pointer-events: none;
}

.vibe-mini-game__charge {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 0.35rem;
  background: linear-gradient(90deg, #6a3cff, #39d2f6, #f3bf4c);
  width: var(--charge, 0%);
  transition: width 180ms ease-out;
  box-shadow: 0 0 14px rgba(57, 210, 246, 0.35);
}

.vibe-mini-game__target {
  position: absolute;
  display: grid;
  place-items: center;
  aspect-ratio: 1;
  border-radius: 999px;
  border: none;
  background: radial-gradient(circle at 30% 30%, #39d2f6, #6a3cff);
  color: #ffffff;
  box-shadow:
    0 8px 24px rgba(106, 60, 255, 0.35),
    inset 0 2px 4px rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transform: translate(-50%, -50%);
  animation: tv-vibe-target-pulse 2s ease-in-out infinite;
}

.vibe-mini-game__target:hover {
  filter: brightness(1.12);
}

@keyframes tv-vibe-target-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); filter: saturate(1); }
  50% { transform: translate(-50%, -50%) scale(1.08); filter: saturate(1.15); }
}

.vibe-mini-game__floater {
  position: absolute;
  pointer-events: none;
  font-size: 1.1rem;
  font-weight: 900;
  color: #f3bf4c;
  text-shadow: 0 0 10px rgba(243, 191, 76, 0.6);
  transform: translate(-50%, -50%);
  z-index: 2;
}

.vibe-mini-game__start {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.75rem 1.35rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #f3bf4c, #6a3cff);
  color: #ffffff;
  font-weight: 800;
  font-size: 0.92rem;
  box-shadow: 0 10px 30px rgba(106, 60, 255, 0.35);
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease;
}

.vibe-mini-game__start:hover {
  transform: translate(-50%, -50%) scale(1.04);
  box-shadow: 0 14px 38px rgba(106, 60, 255, 0.45);
}

.vibe-mini-game__hint {
  margin: 0.85rem 0 0;
  text-align: center;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.55);
}

.vibe-mini-game__hint-btn {
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.78);
  font-weight: 700;
  cursor: pointer;
  transition: all 180ms ease;
}

.vibe-mini-game__hint-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
}

.vibe-mini-game__result {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  background: rgba(11, 7, 28, 0.72);
  backdrop-filter: blur(4px);
  text-align: center;
  padding: 1.25rem;
}

.vibe-mini-game__result-title {
  font-size: 1.1rem;
  font-weight: 800;
  color: #ffffff;
}

.vibe-mini-game__result-score {
  font-size: 1.55rem;
  font-weight: 900;
  background: linear-gradient(135deg, #f3bf4c, #39d2f6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.vibe-mini-game__result-actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.5rem;
}

.vibe-mini-game__result-actions .vibe-mini-game__start {
  position: static;
  transform: none;
}

.vibe-mini-game__result-actions .vibe-mini-game__start:hover {
  transform: scale(1.04);
}

@media (max-width: 420px) {
  .vibe-mini-launcher__label {
    display: none;
  }

  .vibe-mini-game__panel {
    padding: 1.1rem;
    border-radius: 24px;
  }

  .vibe-mini-game__stage {
    height: 16.5rem;
  }
}
```

- [ ] **Step 3: Replace mobile compare arena CSS block**

Find the existing `.mobile-compare-arena` block (around lines 16522–17404) and update key sub-sections. Because the block is large, replace the fight-stage, fighter and matrix rules with:

```css
.mobile-compare-arena__battle-stage {
  position: relative;
  min-height: 19rem;
  border-radius: 1.75rem;
  border: 1px solid rgba(106, 60, 255, 0.18);
  background:
    radial-gradient(circle at 50% 50%, rgba(106, 60, 255, 0.18), transparent 55%),
    radial-gradient(circle at 50% 50%, rgba(57, 210, 246, 0.08), transparent 45%),
    linear-gradient(180deg, #150d35, #0b0720);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 16px 48px rgba(11, 7, 28, 0.35);
  overflow: hidden;
  margin-bottom: 1.25rem;
}

.mobile-compare-arena__battle-stage[data-state="result"] {
  background:
    radial-gradient(circle at 50% 50%, rgba(243, 191, 76, 0.18), transparent 55%),
    radial-gradient(circle at 50% 50%, rgba(106, 60, 255, 0.12), transparent 45%),
    linear-gradient(180deg, #1a1130, #0b0720);
}

.mobile-compare-arena__battle-grid {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
}

.mobile-compare-arena__battle-grid span {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(106, 60, 255, 0.14);
}

.mobile-compare-arena__battle-grid span:nth-child(1) { width: 8rem; height: 8rem; }
.mobile-compare-arena__battle-grid span:nth-child(2) { width: 13rem; height: 13rem; }
.mobile-compare-arena__battle-grid span:nth-child(3) { width: 18rem; height: 18rem; }

.mobile-compare-arena__battle-core {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(57, 210, 246, 0.35), rgba(106, 60, 255, 0.15));
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 30px rgba(106, 60, 255, 0.25);
  text-align: center;
  z-index: 1;
}

.mobile-compare-arena__battle-core span {
  font-size: 0.55rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.55);
}

.mobile-compare-arena__battle-core strong {
  font-family: "Rubik", sans-serif;
  font-size: 0.95rem;
  font-weight: 900;
  color: #ffffff;
}

.mobile-compare-arena__battle-stage[data-state="fighting"] .mobile-compare-arena__battle-core {
  animation: tv-arena-core-clash 0.9s ease-in-out infinite;
}

@keyframes tv-arena-core-clash {
  0%, 100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 30px rgba(106, 60, 255, 0.25); }
  50% { transform: translate(-50%, -50%) scale(1.15); box-shadow: 0 0 50px rgba(57, 210, 246, 0.45); }
}

.mobile-compare-arena__energy-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.mobile-compare-arena__energy-line {
  position: absolute;
  width: 2px;
  height: 40%;
  background: linear-gradient(180deg, rgba(57, 210, 246, 0.45), transparent);
  transform: translate(-50%, -50%) rotate(var(--energy-angle, 0deg));
  opacity: 0.7;
  animation: tv-arena-energy 0.6s ease-in-out infinite alternate;
}

@keyframes tv-arena-energy {
  from { opacity: 0.3; transform: translate(-50%, -50%) rotate(var(--energy-angle, 0deg)) scaleY(0.85); }
  to { opacity: 0.8; transform: translate(-50%, -50%) rotate(var(--energy-angle, 0deg)) scaleY(1.05); }
}

.mobile-compare-arena__fighters {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.mobile-compare-arena__fighter {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  transform: translate(-50%, -50%);
  width: 5rem;
  text-align: center;
}

.mobile-compare-arena__fighter-orb {
  display: grid;
  place-items: center;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--arena-a, #6a3cff), var(--arena-b, #39d2f6));
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 900;
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.25),
    inset 0 1px 2px rgba(255, 255, 255, 0.25);
}

.mobile-compare-arena__fighter-name {
  max-width: 5.8rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mobile-compare-arena__fighter small {
  font-size: 0.6rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.55);
}

.mobile-compare-arena__fighter.is-winner .mobile-compare-arena__fighter-orb {
  box-shadow:
    0 0 0 3px rgba(243, 191, 76, 0.5),
    0 10px 30px rgba(243, 191, 76, 0.35),
    inset 0 1px 2px rgba(255, 255, 255, 0.3);
}

.mobile-compare-arena__fighter.is-winner .mobile-compare-arena__fighter-name {
  color: #f3bf4c;
  text-shadow: 0 0 10px rgba(243, 191, 76, 0.45);
}

.mobile-compare-arena__battle-result {
  position: absolute;
  left: 50%;
  bottom: 3.8rem;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: rgba(243, 191, 76, 0.16);
  border: 1px solid rgba(243, 191, 76, 0.35);
  color: #f3bf4c;
  font-size: 0.75rem;
  font-weight: 800;
  z-index: 3;
}

.mobile-compare-arena__fight-button {
  position: absolute;
  left: 50%;
  bottom: 1.1rem;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.65rem 1.35rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(135deg, #f3bf4c, #ff6b9d, #6a3cff);
  background-size: 200% 200%;
  color: #ffffff;
  font-size: 0.85rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  box-shadow: 0 10px 28px rgba(106, 60, 255, 0.35);
  cursor: pointer;
  transition: transform 180ms ease, box-shadow 180ms ease;
  animation: tv-fight-button-shimmer 2.5s ease infinite;
  z-index: 4;
}

.mobile-compare-arena__fight-button:hover:not(:disabled) {
  transform: translateX(-50%) scale(1.05);
  box-shadow: 0 14px 36px rgba(106, 60, 255, 0.45);
}

.mobile-compare-arena__fight-button:disabled {
  opacity: 0.7;
  cursor: wait;
}

@keyframes tv-fight-button-shimmer {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* Matrix */
.mobile-compare-arena__matrix {
  margin-top: 1.5rem;
}

.mobile-compare-arena__matrix-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.7rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.7);
}

.mobile-compare-arena__matrix-head {
  display: flex;
  align-items: stretch;
  border-radius: 1rem 1rem 0 0;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-bottom: none;
  background: rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.mobile-compare-arena__matrix-axis {
  flex: 0 0 5.5rem;
  display: flex;
  align-items: center;
  padding: 0 0.7rem;
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.45);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.mobile-compare-arena__matrix-axis--head {
  color: rgba(255, 255, 255, 0.35);
}

.mobile-compare-arena__matrix-cells {
  flex: 1;
  display: flex;
  overflow-x: auto;
  scrollbar-width: none;
}

.mobile-compare-arena__matrix-cells::-webkit-scrollbar {
  display: none;
}

.mobile-compare-arena__matrix-cell {
  flex: 0 0 7.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.7rem 0.5rem;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
}

.mobile-compare-arena__matrix-cell--head {
  background: rgba(255, 255, 255, 0.03);
}

.mobile-compare-arena__matrix-tool {
  font-size: 0.72rem;
  font-weight: 800;
  color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.mobile-compare-arena__matrix-value {
  font-size: 0.9rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.85);
}

.mobile-compare-arena__matrix-value--winner {
  color: #f3bf4c;
}

.mobile-compare-arena__matrix-cell.is-winner .mobile-compare-arena__matrix-value {
  color: #f3bf4c;
}

.mobile-compare-arena__matrix-cell.is-winner {
  background: rgba(243, 191, 76, 0.08);
}

.mobile-compare-arena__matrix-badge {
  display: inline-flex;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  background: rgba(106, 60, 255, 0.18);
  color: #ffffff;
  font-size: 0.65rem;
  font-weight: 800;
}

.mobile-compare-arena__matrix-badge.is-winner {
  background: rgba(243, 191, 76, 0.2);
  color: #f3bf4c;
}

.mobile-compare-arena__matrix-bar {
  position: relative;
  width: 100%;
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  overflow: hidden;
}

.mobile-compare-arena__matrix-bar span {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--arena-a, #6a3cff), var(--arena-b, #39d2f6));
  transition: width 400ms ease-out;
}

.mobile-compare-arena__matrix-bar span.is-winner {
  background: linear-gradient(90deg, #f3bf4c, #ff6b9d);
}

.mobile-compare-arena__matrix-bar strong {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 0.7rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: #ffffff;
}

.mobile-compare-arena__matrix-row {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.mobile-compare-arena__matrix-row:last-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0 0 1rem 1rem;
  overflow: hidden;
}
```

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "feat(styles): add gamification UI polish tokens and component styles"
```

---

## Task 7: Test and lint

**Files:**
- All modified files

- [ ] **Step 1: Run tests**

```bash
npm run test
```

Expected: all tests pass (currently 19/19).

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: 0 errors. Warnings pre-existing are acceptable.

- [ ] **Step 3: Run TypeScript check**

```bash
npx tsc --noEmit --pretty
```

Expected: no errors.

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "chore(gamification): final UI/UX polish QA"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|------------------|------|
| Launcher pill con label “Vibe Rush” e dot dorato | Task 1 + 2 |
| Modal glassmorphism con timer circolare | Task 1 |
| Target spawn animato e floating score | Task 1 |
| End screen con confetti e CTA | Task 1 |
| Arena fight con layout 2/3/4/5 fighter | Task 4 |
| Energy lines e vortice centrale | Task 4 |
| Winner highlight oro | Task 4 |
| Matrice scroll sincronizzato | Task 5 |
| Header sticky e barre comparative | Task 5 |
| Token `--game-danger` / `--game-success` | Task 6 |
| `prefers-reduced-motion` | Task 1 + 4 |
| Fix variabili CSS e error state in `ArenaBattleStage` | Task 3 |

---

## Placeholder Scan

- No TBD/TODO.
- No vague instructions like "add appropriate error handling".
- Code blocks are complete for their scope.

---

## Post-implementation Updates

Implemented on 2026-06-12 via `superpowers:subagent-driven-development`. The following adjustments were made during review loops and are reflected in the final code but not always in the original task snippets above:

1. **VibeTapMiniGame**
   - Launcher icon changed from `Gamepad2` to `Play` (from `lucide-react`).
   - Added manual focus trap (no external library), `Esc` close, and focus restore to launcher button.
   - End screen shows XP computed as `Math.round(score * 1.5)`.
   - Charge bar uses `transform: scaleX(var(--charge-scale))` instead of `width` for GPU performance.
   - Target pulse keyframes animate only `transform`/`opacity`; disabled under `prefers-reduced-motion: reduce`.
   - Combo pulse applied via a decorative wrapper so `NumberFlow` is not remounted.
   - Floating `+N` feedback is reduced to a fade-only animation when reduced motion is preferred.
   - Replaced noisy `aria-live` on stats with a dedicated `sr-only` live region for combo milestones and final result.

2. **ArenaBattleStage**
   - Added optional `name?: string` to `BattleTool` in `lib/gamification/battle-engine.ts` so readable tool names can be shown.
   - Error state added (`"error"`) with retry CTA.
   - Reduced-motion guards added for `animate-ping` / `animate-pulse`.

3. **MobileCompareView**
   - Renamed local `ArenaBattleStage` to `MobileArenaBattleStage` to avoid collision with the gamification component.
   - Fighter positions are driven by inline JS coordinates; conflicting CSS position rules were removed.
   - Energy lines are oriented radially using `--energy-angle` computed with `Math.atan2`.
   - Fight timeout is stored in a ref and cleared on unmount/`compareSlugs` change.
   - Matrix header is sticky and its horizontal scroll is synchronized with body rows via `cellsRef` (with `isSyncing` guard).
   - Tie handling: multiple tools can share the winner highlight for a row.

4. **app/globals.css**
   - Removed an orphan/duplicate block near `.vibe-mini-game__result-actions`.
   - Removed obsolete duplicate matrix CSS rules.
   - Added `--game-danger` and `--game-success` tokens to `:root`.
   - Added `@media (prefers-reduced-motion: reduce)` overrides for arena core/energy-line animations.

5. **Final QA**
   - `npm run test`: 19/19 passed.
   - `npm run lint`: 0 errors (21 pre-existing warnings).
   - `npx tsc --noEmit --pretty`: no errors.
