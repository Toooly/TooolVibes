"use client";

import { AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";

import { useRewardRuntime } from "@/components/rewards/reward-provider";

const MicroRewardToast = dynamic(
  () =>
    import("@/components/rewards/micro-reward-toast").then((m) => m.MicroRewardToast),
  { ssr: false },
);

const AchievementReveal = dynamic(
  () =>
    import("@/components/rewards/achievement-reveal").then(
      (m) => m.AchievementReveal,
    ),
  { ssr: false },
);

// Tier 3 module (and its confetti chunk) loads only for a valid full
// milestone presentation — never when flags are OFF.
const MilestoneReveal = dynamic(
  () =>
    import("@/components/rewards/milestone-reveal").then(
      (m) => m.MilestoneReveal,
    ),
  { ssr: false },
);

/**
 * Single app-level host. Inert when flag OFF or no active envelope.
 * Lazy-loads presentation modules only when needed.
 */
export function RewardHost() {
  const {
    runtimeEnabled,
    active,
    activePresentation,
    preferences,
    preferReducedMotion,
    dismissActive,
    completeActive,
  } = useRewardRuntime();

  if (!runtimeEnabled) {
    return null;
  }

  const reduced = preferReducedMotion || preferences.reduceRewardAnimations;
  const quiet = preferences.quietMode;

  return (
    <div
      className="tv-reward-host"
      data-reward-host=""
      data-reward-active={active ? active.tier : "none"}
      aria-live="off"
    >
      <AnimatePresence mode="wait">
        {active?.tier === "micro" ? (
          <MicroRewardToast
            key={active.grantId}
            envelope={active}
            preferReducedMotion={reduced}
            quietMode={quiet}
            onComplete={completeActive}
            onDismiss={dismissActive}
          />
        ) : null}
        {active?.tier === "achievement" ? (
          <AchievementReveal
            key={active.grantId}
            envelope={active}
            preferReducedMotion={reduced}
            quietMode={quiet}
            onDismiss={dismissActive}
          />
        ) : null}
        {active?.tier === "milestone" && activePresentation === "full" ? (
          <MilestoneReveal
            key={active.grantId}
            envelope={active}
            quietMode={quiet}
            muteRewardSounds={preferences.muteRewardSounds}
            onDismiss={dismissActive}
          />
        ) : null}
        {active?.tier === "milestone" && activePresentation === "static" ? (
          <AchievementReveal
            key={active.grantId}
            envelope={active}
            eyebrow="Traguardo"
            preferReducedMotion={reduced}
            quietMode={quiet}
            onDismiss={dismissActive}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
