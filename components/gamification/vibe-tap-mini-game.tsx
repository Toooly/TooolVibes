"use client";

import { type CSSProperties, type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { Play, Sparkles, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

type VibeTarget = {
  id: number;
  x: number;
  y: number;
  size: number;
  driftX: number;
  driftY: number;
  delay: number;
};

type FloatingScore = {
  id: number;
  x: number;
  y: number;
  value: number;
};

type VibeTapMiniGameProps = {
  className?: string;
  badge?: string;
};

const GAME_SECONDS = 12;
const TARGET_COUNT = 4;
const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

function createTargets(seed: number): VibeTarget[] {
  return Array.from({ length: TARGET_COUNT }).map((_, index) => {
    const angle = (seed * 37 + index * 71) % 360;
    const radius = 12 + ((seed + index * 19) % 22);
    const direction = (seed + index) % 2 === 0 ? 1 : -1;

    return {
      id: seed * 10 + index,
      x: Math.min(78, Math.max(22, 50 + Math.cos((angle * Math.PI) / 180) * radius)),
      y: Math.min(76, Math.max(24, 50 + Math.sin((angle * Math.PI) / 180) * radius)),
      size: 2.4 + ((seed + index) % 3) * 0.35,
      driftX: direction * (8 + ((seed * 5 + index * 3) % 8)),
      driftY: -direction * (5 + ((seed * 7 + index * 5) % 7)),
      delay: index * 0.14,
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

export function VibeTapMiniGame({ className, badge }: VibeTapMiniGameProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1);
  const [wave, setWave] = useState(1);
  const [finished, setFinished] = useState(false);
  const [floaters, setFloaters] = useState<FloatingScore[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const reducedMotion = useReducedMotion();
  const prevComboRef = useRef(1);
  const scoreRef = useRef(score);
  const floaterIdRef = useRef(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const startLockedRef = useRef(false);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const targets = useMemo(() => createTargets(wave), [wave]);
  const charge = Math.min(100, Math.round((score / 24) * 100));
  const xp = Math.round(score * 1.5);

  useEffect(() => {
    if (!running) return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running]);

  useEffect(() => {
    if (!running || timeLeft > 0) return;

    setRunning(false);
    setCombo(1);
    setFinished(true);
    const finalScore = scoreRef.current;
    void celebrateMiniGame(finalScore);
    toast.success(finalScore >= 20 ? "Vibe rush completato" : "Mini run chiusa", {
      description: `Hai raccolto ${finalScore} vibe in ${GAME_SECONDS} secondi.`,
    });
  }, [running, timeLeft]);

  useEffect(() => {
    if (combo > prevComboRef.current && (combo === 3 || combo === 5)) {
      setAnnouncement(`Combo x${combo}`);
    }
    prevComboRef.current = combo;
  }, [combo]);

  useEffect(() => {
    if (finished) {
      setAnnouncement(`Gioco finito. ${score} vibe raccolti. Più ${xp} XP.`);
    }
  }, [finished, score, xp]);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const first = focusables[0];
    if (first) {
      window.setTimeout(() => first.focus(), 0);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeGame();
        return;
      }

      if (event.key !== "Tab" || !panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (nodes.length === 0) return;

      const firstNode = nodes[0];
      const lastNode = nodes[nodes.length - 1];

      if (event.shiftKey && document.activeElement === firstNode) {
        event.preventDefault();
        lastNode.focus();
      } else if (!event.shiftKey && document.activeElement === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open && wasOpenRef.current) {
      launcherRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  function startGame() {
    if (running || startLockedRef.current) return;
    startLockedRef.current = true;
    setScore(0);
    setCombo(1);
    setFinished(false);
    setWave((current) => current + 1);
    setTimeLeft(GAME_SECONDS);
    setRunning(true);
    setFloaters([]);
    window.setTimeout(() => {
      startLockedRef.current = false;
    }, 220);
  }

  function closeGame() {
    setOpen(false);
    setRunning(false);
    setFinished(false);
    setScore(0);
    setCombo(1);
    setTimeLeft(GAME_SECONDS);
    setFloaters([]);
    setSignupEmail("");
    startLockedRef.current = false;
  }

  function hitTarget(targetX: number, targetY: number) {
    if (!running) {
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

  function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = signupEmail.trim().toLowerCase();
    if (!email) return;

    const params = new URLSearchParams({
      source: "vibe-rush",
      email,
      vibes: String(score),
      xp: String(xp),
    });

    closeGame();
    router.push(`/account?${params.toString()}#account-upgrade`);
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        className={className}
        aria-label="Apri il minigioco Vibe Rush"
        onClick={() => setOpen(true)}
        data-sonic-action="tap"
      >
        <span className="vibe-mini-launcher__core" aria-hidden="true">
          <Play size={15} />
          {badge ? (
            <span className="vibe-mini-launcher__core-badge" aria-hidden="true">
              {badge}
            </span>
          ) : (
            <span aria-hidden="true" />
          )}
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
              ref={panelRef}
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

              <span className="sr-only" aria-live="polite" aria-atomic="true">
                {announcement}
              </span>

              <div className="vibe-mini-game__stats">
                <span>
                  Score <strong><NumberFlow value={score} /></strong>
                </span>
                <span data-combo={combo}>
                  Combo <strong>x
                    <span className="vibe-mini-game__combo">
                      <NumberFlow value={combo} />
                      <motion.span
                        key={combo}
                        className="vibe-mini-game__combo-pulse"
                        aria-hidden="true"
                        initial={{ scale: 1, opacity: reducedMotion ? 0 : 0.5 }}
                        animate={{ scale: reducedMotion ? 1 : [1, 1.35, 1], opacity: reducedMotion ? 0 : [0.5, 0, 0.5] }}
                        transition={{ duration: 0.25 }}
                      />
                    </span>
                  </strong>
                </span>
                <span>
                  Time <CircularTimer seconds={timeLeft} total={GAME_SECONDS} /></span>
              </div>

              <div className="vibe-mini-game__stage" data-running={running} data-finished={finished}>
                <span
                  className="vibe-mini-game__charge"
                  style={{ "--charge-scale": `${charge / 100}` } as CSSProperties}
                />
                {running ? targets.map((target) => (
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
                    animate={
                      reducedMotion
                        ? {}
                        : {
                            scale: [0.82, 1.28, 0.72, 1.08, 0.92],
                            opacity: [0.84, 1, 0.88, 1, 0.9],
                            x: [0, target.driftX, target.driftX * -0.42, 0],
                            y: [0, target.driftY, target.driftY * -0.58, 0],
                          }
                    }
                    transition={{
                      duration: 1.45 + target.delay,
                      ease: "easeInOut",
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: target.delay,
                    }}
                    whileTap={reducedMotion ? undefined : { scale: 0.76 }}
                    onClick={() => hitTarget(target.x, target.y)}
                    aria-label={`Raccogli vibe target ${target.id}`}
                  >
                    <Sparkles size={15} />
                  </motion.button>
                )) : null}

                <AnimatePresence>
                  {floaters.map((f) => (
                    <motion.span
                      key={f.id}
                      className="vibe-mini-game__floater"
                      initial={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
                      animate={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -32, scale: 1.15 }}
                      exit={{ opacity: 0 }}
                      transition={
                        reducedMotion
                          ? { duration: 0.3 }
                          : { duration: 0.6, ease: "easeOut" }
                      }
                      style={{ left: `${f.x}%`, top: `${f.y}%` } as CSSProperties}
                    >
                      +{f.value}
                    </motion.span>
                  ))}
                </AnimatePresence>

                {!running && !finished ? (
                  <button
                    type="button"
                    className="vibe-mini-game__start"
                    onPointerDown={(event) => {
                      event.preventDefault();
                      startGame();
                    }}
                    onClick={startGame}
                  >
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
                    <span className="vibe-mini-game__result-xp">+{xp} XP</span>
                    <div className="vibe-mini-game__result-actions">
                      <button
                        type="button"
                        className="vibe-mini-game__start"
                        onPointerDown={(event) => {
                          event.preventDefault();
                          startGame();
                        }}
                        onClick={startGame}
                      >
                        <Zap size={16} />
                        Gioca ancora
                      </button>
                      <button type="button" className="vibe-mini-game__hint-btn" onClick={closeGame}>
                        Chiudi
                      </button>
                    </div>
                    <form className="vibe-mini-game__signup" onSubmit={handleSignup}>
                      <p>Salva i progressi e ricevi il riepilogo dei vibe raccolti.</p>
                      <div>
                        <input
                          type="email"
                          value={signupEmail}
                          onChange={(event) => setSignupEmail(event.target.value)}
                          placeholder="la tua email"
                          autoComplete="email"
                        />
                        <button type="submit" disabled={!signupEmail.trim()}>
                          Registrati
                        </button>
                      </div>
                    </form>
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
