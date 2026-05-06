"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Activity, BellRing, Layers3, MousePointerClick, Radar, X } from "lucide-react";

import { PremiumBadge, PremiumLink } from "@/components/ui/premium";

const liveSignals = [
  {
    label: "Radar attivo",
    copy: "Trend, tool curati e segnali esterni scorrono insieme prima della scelta.",
    icon: Radar,
  },
  {
    label: "Stack guidato",
    copy: "Salva, confronta e trasforma pochi candidati in un workflow piu chiaro.",
    icon: Layers3,
  },
  {
    label: "Tap feedback",
    copy: "Ogni percorso risponde meglio: hover, tap, aperture e dettagli in contesto.",
    icon: MousePointerClick,
  },
];

export function HomeLiveLayer({
  toolCount,
  featuredCount,
}: {
  toolCount: number;
  featuredCount: number;
}) {
  const [activeSignal, setActiveSignal] = useState(0);
  const [showHint, setShowHint] = useState(true);
  const reduceMotion = useReducedMotion();
  const signal = liveSignals[activeSignal];
  const SignalIcon = signal.icon;

  useEffect(() => {
    if (reduceMotion) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveSignal((current) => (current + 1) % liveSignals.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  return (
    <div className="mt-5 grid gap-3 sm:mt-6">
      <motion.div
        className="live-signal-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="live-icon-orbit grid size-11 shrink-0 place-items-center rounded-[18px]">
            <SignalIcon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="live-signal-dot" aria-hidden="true" />
              <AnimatePresence mode="wait">
                <motion.p
                  key={signal.label}
                  className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]"
                  initial={{ opacity: 0, y: 7, filter: "blur(5px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
                  transition={{ duration: 0.22 }}
                >
                  {signal.label}
                </motion.p>
              </AnimatePresence>
              <PremiumBadge tone="warning" className="hidden sm:inline-flex">
                Live
              </PremiumBadge>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={signal.copy}
                className="mt-1 text-sm leading-6 text-[var(--muted-strong)]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.22 }}
              >
                {signal.copy}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:hidden">
          {[
            [`${toolCount}`, "Tool"],
            [`${featuredCount}`, "Pick"],
            ["3", "Azioni"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-[16px] border border-[var(--border-soft)] bg-white/62 px-2 py-2">
              <p className="text-[1rem] font-semibold leading-none text-[var(--foreground)]">{value}</p>
              <p className="mt-1 text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                {label}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {showHint ? (
          <motion.div
            className="live-hint-popover"
            role="status"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-[15px] bg-[rgba(106,60,255,0.1)] text-[var(--accent-strong)]">
              <BellRing className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--foreground)]">Vuoi una scorciatoia?</p>
              <p className="mt-0.5 text-xs leading-5 text-[var(--muted)]">
                Apri lo stack builder e scegli una combinazione invece di scorrere tutto.
              </p>
            </div>
            <PremiumLink href="/archivio#stack-builder" tone="secondary" size="sm" className="hidden shrink-0 sm:inline-flex">
              Stack
            </PremiumLink>
            <Link
              href="/archivio#stack-builder"
              className="live-hint-mini-link sm:hidden"
              aria-label="Apri stack builder"
            >
              Vai
            </Link>
            <button
              type="button"
              className="live-hint-close"
              aria-label="Chiudi suggerimento"
              onClick={() => setShowHint(false)}
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </motion.div>
        ) : (
          <motion.button
            type="button"
            className="live-hint-restore"
            onClick={() => setShowHint(true)}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Activity className="size-4" aria-hidden="true" />
            Mostra hint live
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
