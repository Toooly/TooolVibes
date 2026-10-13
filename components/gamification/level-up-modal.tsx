"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { playGameSound } from "@/lib/gamification/sound-engine";

async function fireLevelUpCelebration() {
  const confetti = (await import("canvas-confetti")).default;

  const colors = ["#6a3cff", "#ff6b9a", "#39d2f6", "#f3bf4c"];

  confetti({
    colors,
    disableForReducedMotion: true,
    origin: { y: 0.55 },
    particleCount: 100,
    scalar: 1.1,
    spread: 80,
  });

  confetti({
    angle: 60,
    colors,
    disableForReducedMotion: true,
    origin: { x: 0.05, y: 0.5 },
    particleCount: 40,
    scalar: 0.9,
    spread: 60,
  });

  confetti({
    angle: 120,
    colors,
    disableForReducedMotion: true,
    origin: { x: 0.95, y: 0.5 },
    particleCount: 40,
    scalar: 0.9,
    spread: 60,
  });

  playGameSound("levelUp");
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 64 64" className="level-up-modal__trophy" aria-hidden="true">
      <defs>
        <linearGradient id="trophy-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f3bf4c" />
          <stop offset="100%" stopColor="#d4a017" />
        </linearGradient>
      </defs>
      <path
        d="M16 12h32M18 12v6c0 8 6 14 12 16v6H22v4h20v-4H34v-6c6-2 12-8 12-16v-6"
        fill="none" stroke="url(#trophy-gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
      />
      <path
        d="M14 14h-4c0 6 3 10 7 11M50 14h4c0 6-3 10-7 11"
        fill="none" stroke="url(#trophy-gradient)" strokeWidth="3" strokeLinecap="round"
      />
    </svg>
  );
}

type LevelUpModalProps = {
  level: number;
  onClose: () => void;
};

export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  useEffect(() => {
    if (!level) return;
    void fireLevelUpCelebration();
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [level, onClose]);

  return (
    <AnimatePresence>
      {level > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 240, damping: 14 }}
            className="w-full max-w-sm rounded-2xl border bg-[var(--card)] p-6 text-[var(--card-foreground)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="relative flex items-center justify-center py-6">
                <TrophyIcon />
                <span className="level-up-modal__sparkle" style={{ top: "20%", left: "30%", animationDelay: "0s" }} />
                <span className="level-up-modal__sparkle" style={{ top: "70%", right: "25%", animationDelay: "0.4s" }} />
                <span className="level-up-modal__sparkle" style={{ top: "35%", right: "20%", animationDelay: "0.8s" }} />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-semibold"><LocalizedText>{"Level up!"}</LocalizedText></h2>
                <p className="max-w-[16rem] text-sm text-[var(--muted-foreground)]"><LocalizedText>{"Sei salito di livello. Continua a esplorare per sbloccare nuove ricompense. "}</LocalizedText></p>
              </div>

              <div className="mt-3 flex items-baseline justify-center gap-1 text-5xl font-bold text-[var(--accent-strong)]">
                <NumberFlow value={level} />
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={onClose}
              >
                <Sparkles aria-hidden="true" /><LocalizedText>{"Continua "}</LocalizedText></Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
