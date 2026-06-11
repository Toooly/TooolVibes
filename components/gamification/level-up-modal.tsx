"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import NumberFlow from "@number-flow/react";
import { Crown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

let levelUpSoundSrc: string | null = null;

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function getLevelUpSoundSrc() {
  if (levelUpSoundSrc) return levelUpSoundSrc;

  const sampleRate = 22050;
  const duration = 0.45;
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

  const notes = [523.25, 659.25, 783.99, 1046.5];

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const noteIndex = Math.min(notes.length - 1, Math.floor(time / 0.1));
    const noteTime = time - noteIndex * 0.1;
    const envelope = Math.max(0, 1 - noteTime / 0.1);
    const frequency = notes[noteIndex];
    const tone = Math.sin(2 * Math.PI * frequency * noteTime) * 0.22 * envelope;
    view.setInt16(44 + index * 2, Math.max(-1, Math.min(1, tone)) * 32767, true);
  }

  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  levelUpSoundSrc = `data:audio/wav;base64,${btoa(binary)}`;
  return levelUpSoundSrc;
}

async function fireLevelUpCelebration() {
  const [{ default: confetti }, { Howl }] = await Promise.all([
    import("canvas-confetti"),
    import("howler"),
  ]);

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

  new Howl({
    src: [getLevelUpSoundSrc()],
    volume: 0.32,
  }).play();
}

type LevelUpModalProps = {
  level: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function LevelUpModal({ level, open, onOpenChange }: LevelUpModalProps) {
  useEffect(() => {
    if (open && level > 0) {
      void fireLevelUpCelebration();
    }
  }, [open, level]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 14 }}
            className="mb-4 flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-[#6a3cff] to-[#39d2f6] text-white shadow-lg shadow-[#6a3cff]/25"
          >
            <Crown aria-hidden="true" className="size-11" />
          </motion.div>

          <DialogHeader className="items-center">
            <DialogTitle className="text-xl">Level up!</DialogTitle>
            <DialogDescription className="max-w-[16rem]">
              Sei salito di livello. Continua a esplorare per sbloccare nuove ricompense.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 flex items-baseline justify-center gap-1 text-5xl font-bold text-[var(--accent-strong)]">
            <NumberFlow value={level} />
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
            Continua
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
