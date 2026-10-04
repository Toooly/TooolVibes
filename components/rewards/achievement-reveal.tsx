"use client";

import { useEffect } from "react";
import { motion } from "motion/react";

import type { RewardEnvelope } from "@/lib/rewards/contracts";
import { MOTION_DURATION_S, MOTION_EASING } from "@/lib/motion/tokens";
import { mapDurationForMotion } from "@/lib/motion/reduced-motion";

const AUTO_DISMISS_MS = 2200;

type AchievementRevealProps = {
  envelope: RewardEnvelope;
  preferReducedMotion: boolean;
  quietMode: boolean;
  onDismiss: () => void;
  /** Eyebrow label: "Missione sbloccata" by default, "Traguardo" for static milestones. */
  eyebrow?: string;
};

/**
 * Compact non-blocking achievement acknowledgement (pill).
 *
 * Replaces the previous blocking modal. Requirements:
 * - compact floating pill/banner, max ~2 short lines
 * - does NOT cover the card
 * - does NOT require "Continua"
 * - no blocking overlay, no focus trap, no page dimming
 * - auto-dismisses after ~2.2s
 * - positioned above Compare Dock / Bottom Nav
 * - aria-live polite
 *
 * Achievement logic (unlock + persist) is preserved — only the
 * presentation changes from modal to pill.
 */
export function AchievementReveal({
  envelope,
  preferReducedMotion,
  quietMode,
  onDismiss,
  eyebrow = "Missione sbloccata",
}: AchievementRevealProps) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [onDismiss, envelope.grantId]);

  const duration = mapDurationForMotion(
    MOTION_DURATION_S.standard,
    preferReducedMotion || quietMode,
  );

  // Compact copy: "Missione sbloccata · Primo salvataggio +20"
  const compactLabel = envelope.displayDelta && envelope.displayDelta > 0
    ? `+${envelope.displayDelta}`
    : envelope.levelLabel ?? "";

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="tv-reward-ach-pill"
      data-reward-tier="achievement"
      data-reward-grant={envelope.grantId}
      initial={preferReducedMotion || quietMode ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={preferReducedMotion || quietMode ? undefined : { opacity: 0, y: 4 }}
      transition={{
        duration,
        ease: [...MOTION_EASING.decelerate] as [number, number, number, number],
      }}
    >
      <svg
        className="tv-reward-ach-pill__icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
        <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      </svg>
      <span className="tv-reward-ach-pill__text">
        <span className="tv-reward-ach-pill__eyebrow">{eyebrow}</span>
        <span className="tv-reward-ach-pill__title">{envelope.title}</span>
        {compactLabel ? (
          <span className="tv-reward-ach-pill__delta">{compactLabel}</span>
        ) : null}
      </span>
      <span className="sr-only">{envelope.accessibilityAnnouncement}</span>
    </motion.div>
  );
}
