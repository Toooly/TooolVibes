"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, RadioTower, Radar, ScanLine, Sparkles, Target, Zap } from "lucide-react";
import { toast } from "sonner";

import { useRadarPrediction } from "@/lib/gamification/hooks/use-radar-prediction";
import { useGamificationSurface } from "@/lib/gamification/release-context";
import { playGameSound } from "@/lib/gamification/sound-engine";
import { cn } from "@/lib/utils";

export type RadarConsoleItem = {
  id: string;
  name: string;
  tagline?: string;
  votesCount?: number;
  commentsCount?: number;
  productHuntUrl?: string;
  thumbnailUrl?: string;
};

type RadarConsoleProps = {
  items: RadarConsoleItem[];
  hiddenDiscovered?: boolean;
  className?: string;
};

function CountdownTimer({
  duration,
  isPlaying,
  onComplete,
}: {
  duration: number;
  isPlaying: boolean;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(1);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isPlaying) return;
    startRef.current = performance.now();
    const tick = (now: number) => {
      const elapsed = now - (startRef.current ?? now);
      const remaining = Math.max(0, duration - elapsed);
      const p = remaining / duration;
      setProgress(p);
      if (remaining <= 0) {
        onComplete();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying, duration, onComplete]);

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <svg width="56" height="56" viewBox="0 0 56 56" className="radar-console__timer-circle">
      <defs>
        <linearGradient id="radar-timer-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6a3cff" />
          <stop offset="100%" stopColor="#39d2f6" />
        </linearGradient>
      </defs>
      <circle className="radar-console__timer-bg" cx="28" cy="28" r={radius} />
      <circle
        className="radar-console__timer-fg"
        cx="28" cy="28" r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}

function SignalSparkline({ values }: { values: number[] }) {
  const width = 120;
  const height = 40;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={width} height={height} className="radar-console__sparkline">
      <defs>
        <linearGradient id="radar-sparkline-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6a3cff" />
          <stop offset="100%" stopColor="#39d2f6" />
        </linearGradient>
      </defs>
      <polyline points={points} />
    </svg>
  );
}

const fallbackItem: RadarConsoleItem = {
  id: "radar-console-placeholder",
  name: "Segnale in attesa",
  tagline: "Avvia la scansione appena arrivano nuovi dati.",
  votesCount: 0,
  commentsCount: 0,
};

// HUD console for Radar scans, signal discovery and daily prediction locking.
export function RadarConsole(props: RadarConsoleProps) {
  const { persistentRewardsEnabled } = useGamificationSurface("prediction");

  if (!persistentRewardsEnabled) return null;

  return <RewardedRadarConsole {...props} />;
}

function RewardedRadarConsole({ items, hiddenDiscovered = false, className }: RadarConsoleProps) {
  const [scanState, setScanState] = useState<"idle" | "scanning" | "revealed">("idle");
  const [scanRemaining, setScanRemaining] = useState(4);
  const { prediction, createPrediction, isCreating } = useRadarPrediction();

  const topSignals = useMemo(() => {
    const sorted = [...items]
      .sort((a, b) => (b.votesCount ?? 0) - (a.votesCount ?? 0))
      .slice(0, 5);
    return sorted.length ? sorted : [fallbackItem];
  }, [items]);

  const leader = topSignals[0] ?? fallbackItem;
  const totalVotes = topSignals.reduce((sum, item) => sum + (item.votesCount ?? 0), 0);
  const totalComments = topSignals.reduce((sum, item) => sum + (item.commentsCount ?? 0), 0);
  const hotSignals = topSignals.filter((item) => (item.votesCount ?? 0) >= 80).length;
  const scanCompletion = Math.min(100, Math.round((topSignals.length / 5) * 74 + (hiddenDiscovered ? 26 : 0)));
  const isLocked = prediction?.tool_slug === leader.id || Boolean(prediction);

  useEffect(() => {
    if (scanState !== "scanning") {
      return;
    }

    setScanRemaining(4);
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      setScanRemaining(Math.max(0, 4 - elapsedSeconds));
    }, 180);

    return () => window.clearInterval(timer);
  }, [scanState]);

  const startScan = () => {
    setScanRemaining(4);
    setScanState("scanning");
    playGameSound("route");
  };

  const completeScan = useCallback(() => {
    setScanState("revealed");
    playGameSound("success");
  }, []);

  const lockPrediction = () => {
    if (isLocked || isCreating || leader.id === fallbackItem.id) {
      return;
    }

    createPrediction(leader.id);
    playGameSound("battleWin");
    toast.success("Pronostico salvato", {
      description: `${leader.name} entra nella tua giornata.`,
    });
  };

  return (
    <section
      className={cn(
        "radar-console bg-white/5 backdrop-blur-md border border-white/10",
        className
      )}
      data-state={scanState}
    >
      <header className="radar-console__header">
        <span className="radar-console__kicker">
          <Radar aria-hidden="true" size={15} />
          Radar Console
        </span>
        <div>
          <h2>Scansione giornaliera</h2>
          <p>Trova il segnale caldo, blocca una predizione e chiudi la run.</p>
        </div>
      </header>

      <div className="radar-console__body">
        <div className="radar-console__meter" aria-label={`Scansione completata al ${scanCompletion}%`}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, index) => {
              const active = index < Math.round((scanCompletion / 100) * 12);
              return (
                <circle
                  key={index}
                  cx="60"
                  cy="60"
                  r="49"
                  pathLength="12"
                  strokeDasharray="0.62 0.38"
                  strokeDashoffset={-index}
                  className={active ? "is-active" : undefined}
                />
              );
            })}
          </svg>
          <span>
            <NumberFlow value={scanCompletion} suffix="%" />
          </span>
        </div>

        <div className="radar-console__scan">
          <AnimatePresence mode="wait">
            {scanState === "scanning" ? (
              <motion.div
                key="timer"
                className="radar-console__timer"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
              >
                <CountdownTimer
                  isPlaying
                  duration={4}
                  onComplete={completeScan}
                />
                <span className="radar-console__timer-value">
                  <span className="radar-console__timer-number">{scanRemaining}</span>
                </span>
              </motion.div>
            ) : (
              <motion.button
                key="button"
                type="button"
                className="radar-console__scan-button"
                onClick={startScan}
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
              >
                <ScanLine aria-hidden="true" size={18} />
                {scanState === "revealed" ? "Riscansiona" : "Avvia scansione"}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="radar-console__sparkline-wrap" aria-hidden="true">
        <SignalSparkline values={topSignals.slice(0, 3).map((s) => s.votesCount ?? 0)} />
      </div>

      <div className="radar-console__stats">
        <span>
          <RadioTower aria-hidden="true" size={14} />
          <strong><NumberFlow value={topSignals.length} /></strong>
          segnali
        </span>
        <span>
          <Zap aria-hidden="true" size={14} />
          <strong><NumberFlow value={hotSignals} /></strong>
          hot
        </span>
        <span>
          <Sparkles aria-hidden="true" size={14} />
          <strong><NumberFlow value={totalVotes + totalComments} /></strong>
          energia
        </span>
      </div>

      <div className="radar-console__signals">
        {topSignals.map((item, index) => (
          <motion.article
            key={item.id}
            className="radar-console__signal"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.08 }}
          >
            <span className="radar-console__signal-rank">#{index + 1}</span>
            <span className="radar-console__signal-visual">
              {item.thumbnailUrl ? (
                <img src={item.thumbnailUrl} alt="" loading="lazy" />
              ) : (
                item.name.slice(0, 2).toUpperCase()
              )}
            </span>
            <span className="radar-console__signal-copy">
              <strong>{item.name}</strong>
              <small>{item.tagline ?? "Segnale rilevato"}</small>
            </span>
            <span className="radar-console__signal-score">
              <NumberFlow value={item.votesCount ?? 0} />
            </span>
          </motion.article>
        ))}
      </div>

      <footer className="radar-console__prediction">
        <span>
          <Target aria-hidden="true" size={15} />
          Pronostico del giorno
        </span>
        <strong>{prediction ? prediction.tool_slug : leader.name}</strong>
        <button
          type="button"
          onClick={lockPrediction}
          disabled={isLocked || isCreating || leader.id === fallbackItem.id}
        >
          <CheckCircle2 aria-hidden="true" size={15} />
          {isLocked ? "Bloccata" : isCreating ? "Salvataggio" : "Blocca"}
        </button>
      </footer>
    </section>
  );
}
