"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import { useEffect } from "react";
import { motion } from "motion/react";

import type { RewardEnvelope } from "@/lib/rewards/contracts";
import { MOTION_DURATION_MS, MOTION_DURATION_S, MOTION_EASING } from "@/lib/motion/tokens";
import { mapDurationForMotion } from "@/lib/motion/reduced-motion";

const AUTO_DISMISS_MS = 1800;

type MicroRewardToastProps = {
  envelope: RewardEnvelope;
  preferReducedMotion: boolean;
  quietMode: boolean;
  onComplete: () => void;
  onDismiss: () => void;
};

export function MicroRewardToast({
  envelope,
  preferReducedMotion,
  quietMode,
  onComplete,
  onDismiss,
}: MicroRewardToastProps) {
  useEffect(() => {
    if (preferReducedMotion || quietMode) {
      const t = window.setTimeout(onComplete, preferReducedMotion ? 1200 : AUTO_DISMISS_MS);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(onComplete, AUTO_DISMISS_MS);
    return () => window.clearTimeout(t);
  }, [onComplete, preferReducedMotion, quietMode, envelope.grantId]);

  const duration = mapDurationForMotion(
    MOTION_DURATION_S.standard,
    preferReducedMotion || quietMode,
  );

  return (
    <motion.div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="tv-reward-micro"
      data-reward-tier="micro"
      data-reward-grant={envelope.grantId}
      initial={preferReducedMotion || quietMode ? false : { opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={preferReducedMotion || quietMode ? undefined : { opacity: 0, y: 4 }}
      transition={{
        duration,
        ease: [...MOTION_EASING.decelerate] as [number, number, number, number],
      }}
    >
      <div className="tv-reward-micro__body">
        <p className="tv-reward-micro__title"><LocalizedText>{envelope.title}</LocalizedText></p>
        <p className="tv-reward-micro__description"><LocalizedText>{envelope.description}</LocalizedText></p>
        {typeof envelope.displayDelta === "number" ? (
          <LocalizedAttributes><p className="tv-reward-micro__delta" aria-label={`Delta ${envelope.displayDelta}`}>
            +{envelope.displayDelta}
          </p></LocalizedAttributes>
        ) : null}
      </div>
      <LocalizedAttributes><button
        type="button"
        className="tv-reward-micro__dismiss"
        onClick={onDismiss}
        aria-label="Chiudi notifica"
      ><LocalizedText>{"Chiudi "}</LocalizedText></button></LocalizedAttributes>
      <span className="sr-only"><LocalizedText>{envelope.accessibilityAnnouncement}</LocalizedText></span>
    </motion.div>
  );
}

export const MICRO_REWARD_AUTO_MS = AUTO_DISMISS_MS;
export const MICRO_REWARD_TOKEN_MS = MOTION_DURATION_MS.standard;
