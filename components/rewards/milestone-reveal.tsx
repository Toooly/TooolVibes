"use client";

import { useEffect, useId, useRef } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";

import type { RewardEnvelope } from "@/lib/rewards/contracts";
import { MOTION_DURATION_S, MOTION_EASING } from "@/lib/motion/tokens";
import { mapDurationForMotion } from "@/lib/motion/reduced-motion";
import { playTooolvibesSound } from "@/lib/config/sound";

const CONFETTI_COLORS = ["#f3bf4c", "#39d2f6", "#6a3cff", "#ffffff"];

type MilestoneRevealProps = {
  envelope: RewardEnvelope;
  quietMode: boolean;
  muteRewardSounds: boolean;
  onDismiss: () => void;
};

/**
 * Tier 3 major milestone presentation. Mounted only when the reward machine
 * selected the `full` presentation mode (milestones flag ON, no reduced
 * motion, no quiet mode, celebrations not suppressed, document visible,
 * daily cap available). The dialog content is the static accessible
 * alternative: it communicates the complete milestone even when the
 * celebration layer is unavailable.
 */
export function MilestoneReveal({
  envelope,
  quietMode,
  muteRewardSounds,
  onDismiss,
}: MilestoneRevealProps) {
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current =
      typeof document !== "undefined"
        ? (document.activeElement as HTMLElement | null)
        : null;
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previousFocus.current?.focus?.();
    };
  }, [onDismiss, envelope.grantId]);

  // Rare, bounded celebration layer: dynamically imported confetti on a
  // dialog-local canvas (never full-screen), ~1.2s total, silent on failure.
  useEffect(() => {
    if (typeof document !== "undefined" && document.hidden) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let reset: (() => void) | null = null;
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    void (async () => {
      try {
        const { default: confetti } = await import("canvas-confetti");
        if (cancelled) return;
        const fire = confetti.create(canvas, {
          resize: true,
          disableForReducedMotion: true,
          useWorker: false,
        });
        reset = () => confetti.reset();
        const base = {
          colors: CONFETTI_COLORS,
          scalar: 0.9,
          // ~0.8s particle life; two waves at 0/400ms end within ~1.2s total.
          ticks: 130,
        };
        void fire({ ...base, particleCount: 60, spread: 70, origin: { x: 0.5, y: 0.55 } });
        timeouts.push(
          setTimeout(() => {
            if (cancelled) return;
            void fire({ ...base, particleCount: 40, spread: 100, origin: { x: 0.3, y: 0.6 } });
            void fire({ ...base, particleCount: 40, spread: 100, origin: { x: 0.7, y: 0.6 } });
          }, 400),
        );
      } catch {
        // Confetti import failure degrades safely to the static milestone card.
      }
    })();

    return () => {
      cancelled = true;
      for (const t of timeouts) clearTimeout(t);
      reset?.();
    };
  }, [envelope.grantId]);

  // Optional sound: respects mute + quiet mode; engine handles gesture gating.
  useEffect(() => {
    if (quietMode || muteRewardSounds) return;
    playTooolvibesSound("levelUp");
  }, [quietMode, muteRewardSounds, envelope.grantId]);

  const duration = mapDurationForMotion(MOTION_DURATION_S.deliberate, false);

  return (
    <div className="tv-reward-ach-root" data-reward-tier="milestone">
      <button
        type="button"
        className="tv-reward-ach__backdrop"
        aria-label="Chiudi traguardo"
        onClick={onDismiss}
      />
      <div className="tv-reward-milestone-stage">
        <canvas
          ref={canvasRef}
          className="tv-reward-milestone-canvas"
          aria-hidden="true"
        />
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="tv-reward-ach tv-reward-milestone"
          data-reward-grant={envelope.grantId}
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{
            duration,
            ease: [...MOTION_EASING.decelerate] as [number, number, number, number],
          }}
        >
          <p className="tv-reward-ach__eyebrow">Traguardo</p>
          <h2 id={titleId} className="tv-reward-ach__title">
            {envelope.title}
          </h2>
          <p id={descId} className="tv-reward-ach__description">
            {envelope.description}
          </p>
          {envelope.levelLabel ? (
            <p className="tv-reward-ach__level tv-reward-milestone__level">
              {envelope.levelLabel}
            </p>
          ) : null}
          {typeof envelope.resultingBalance === "number" ? (
            <p className="tv-reward-ach__delta" aria-label={`Bilancio ${envelope.resultingBalance} Signal Points`}>
              <NumberFlow value={envelope.resultingBalance} />
              <span className="tv-reward-milestone__delta-unit"> SP</span>
            </p>
          ) : null}
          <button
            ref={closeRef}
            type="button"
            className="tv-reward-ach__close"
            onClick={onDismiss}
          >
            Continua
          </button>
          <span className="sr-only" role="status" aria-live="polite">
            {envelope.accessibilityAnnouncement}
          </span>
        </motion.div>
      </div>
    </div>
  );
}
