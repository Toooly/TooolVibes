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
