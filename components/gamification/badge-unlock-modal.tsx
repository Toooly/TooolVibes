"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import {
  Bookmark,
  Flame,
  Radar,
  Sparkles,
  Swords,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Badge } from "@/lib/gamification/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  Radar,
  Swords,
  Trophy,
  Sparkles,
  Bookmark,
  Flame,
};

let unlockSoundSrc: string | null = null;

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function getUnlockSoundSrc() {
  if (unlockSoundSrc) return unlockSoundSrc;

  const sampleRate = 22050;
  const duration = 0.28;
  const sampleCount = Math.floor(sampleRate * duration);
  const bytes = new Uint8Array(44 + sampleCount * 2);
  const view = new DataView(bytes.buffer);

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.max(0, 1 - index / sampleCount);
    const tone = Math.sin(2 * Math.PI * 880 * time) * 0.22 * envelope;
    const sparkle = Math.sin(2 * Math.PI * 1760 * time) * 0.1 * envelope;
    view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, tone + sparkle)) * 32767, true);
  }

  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  unlockSoundSrc = `data:audio/wav;base64,${btoa(binary)}`;
  return unlockSoundSrc;
}

async function fireBadgeCelebration() {
  const [{ default: confetti }, { Howl }] = await Promise.all([
    import("canvas-confetti"),
    import("howler"),
  ]);

  const colors = ["#f3bf4c", "#39d2f6", "#6a3cff", "#ffffff"];

  confetti({
    colors,
    disableForReducedMotion: true,
    origin: { y: 0.6 },
    particleCount: 80,
    scalar: 1,
    spread: 70,
  });

  confetti({
    angle: 60,
    colors,
    disableForReducedMotion: true,
    origin: { x: 0.1, y: 0.55 },
    particleCount: 30,
    scalar: 0.8,
    spread: 50,
  });

  confetti({
    angle: 120,
    colors,
    disableForReducedMotion: true,
    origin: { x: 0.9, y: 0.55 },
    particleCount: 30,
    scalar: 0.8,
    spread: 50,
  });

  new Howl({
    src: [getUnlockSoundSrc()],
    volume: 0.28,
  }).play();
}

type BadgeUnlockModalProps = {
  badge: Badge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BadgeUnlockModal({ badge, open, onOpenChange }: BadgeUnlockModalProps) {
  useEffect(() => {
    if (open && badge) {
      void fireBadgeCelebration();
    }
  }, [open, badge]);

  if (!badge) return null;

  const Icon = ICONS[badge.icon] ?? Sparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
            className={cn(
              "mb-4 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-[#f3bf4c] to-[#6a3cff] text-white shadow-lg shadow-[#6a3cff]/25",
            )}
          >
            <Icon aria-hidden="true" className="size-11" />
          </motion.div>

          <DialogHeader className="items-center">
            <DialogTitle className="text-xl">Badge sbloccato!</DialogTitle>
            <DialogDescription className="max-w-[16rem]">
              {badge.description}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-1">
            <p className="text-lg font-semibold">{badge.name}</p>
            <p className="inline-flex items-center gap-1 rounded-full bg-[rgba(106,60,255,0.12)] px-3 py-1 text-sm font-semibold text-[var(--accent-strong)]">
              +<NumberFlow value={badge.xp_bonus} /> XP
            </p>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            <Sparkles aria-hidden="true" />
            Fantastico
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
