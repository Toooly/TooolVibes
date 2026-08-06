"use client";

import { useEffect, useId, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";

import type { RewardEnvelope } from "@/lib/rewards/contracts";
import { MOTION_DURATION_S, MOTION_EASING } from "@/lib/motion/tokens";
import { mapDurationForMotion } from "@/lib/motion/reduced-motion";

type AchievementRevealProps = {
  envelope: RewardEnvelope;
  preferReducedMotion: boolean;
  quietMode: boolean;
  onDismiss: () => void;
  /** Eyebrow label: "Achievement" by default, "Traguardo" for static milestones. */
  eyebrow?: string;
};

export function AchievementReveal({
  envelope,
  preferReducedMotion,
  quietMode,
  onDismiss,
  eyebrow = "Achievement",
}: AchievementRevealProps) {
  const titleId = useId();
  const descId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
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

  const duration = mapDurationForMotion(
    MOTION_DURATION_S.deliberate,
    preferReducedMotion || quietMode,
  );

  return (
    <div className="tv-reward-ach-root" data-reward-tier="achievement">
      <button
        type="button"
        className="tv-reward-ach__backdrop"
        aria-label="Chiudi achievement"
        onClick={onDismiss}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="tv-reward-ach"
        data-reward-grant={envelope.grantId}
        initial={preferReducedMotion || quietMode ? false : { opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={preferReducedMotion || quietMode ? undefined : { opacity: 0, y: 8 }}
        transition={{
          duration,
          ease: [...MOTION_EASING.decelerate] as [number, number, number, number],
        }}
      >
        <p className="tv-reward-ach__eyebrow">{eyebrow}</p>
        <h2 id={titleId} className="tv-reward-ach__title">
          {envelope.title}
        </h2>
        <p id={descId} className="tv-reward-ach__description">
          {envelope.description}
        </p>
        {envelope.levelLabel ? (
          <p className="tv-reward-ach__level">{envelope.levelLabel}</p>
        ) : null}
        {typeof envelope.displayDelta === "number" && envelope.displayDelta > 0 ? (
          <p className="tv-reward-ach__delta">+{envelope.displayDelta}</p>
        ) : null}
        {envelope.badgeId ? (
          <p className="tv-reward-ach__level">Segno aggiunto al cabinet</p>
        ) : null}
        <button
          ref={closeRef}
          type="button"
          className="tv-reward-ach__close"
          onClick={onDismiss}
        >
          Continua
        </button>
        <Link
          href="/account"
          className="tv-reward-ach__close"
          onClick={onDismiss}
        >
          Vedi i tuoi progressi
        </Link>
        <span className="sr-only" role="status" aria-live="polite">
          {envelope.accessibilityAnnouncement}
        </span>
      </motion.div>
    </div>
  );
}
