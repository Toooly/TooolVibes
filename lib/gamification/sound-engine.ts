"use client";

import { useEffect } from "react";
import {
  SOUND_PLAY_EVENT,
  type TooolvibesSoundKind,
} from "@/lib/config/sound";
import { isReleaseAudioEnabled } from "@/lib/config/audio-runtime";

const MUTED_KEY = "tooolvibes:sound-muted";

let audioCtx: AudioContext | null = null;
let muted = false;

function getAudioContext(): AudioContext {
  if (typeof window === "undefined") throw new Error("AudioContext only in browser");
  if (!audioCtx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function beep(
  frequency: number,
  type: OscillatorType,
  duration: number,
  startGain: number,
  endGain: number
) {
  if (!isReleaseAudioEnabled() || muted || typeof window === "undefined") return;
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(startGain, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(endGain, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export type SoundName = TooolvibesSoundKind;

export function playGameSound(name: SoundName) {
  if (!isReleaseAudioEnabled() || muted) return;
  switch (name) {
    case "tap":
    case "nav":
      beep(800, "sine", 0.08, 0.0001, 0.12);
      break;
    case "hover":
      beep(600, "sine", 0.05, 0.0001, 0.06);
      break;
    case "route":
      beep(400, "sawtooth", 0.25, 0.0001, 0.08);
      break;
    case "reveal":
      beep(1200, "triangle", 0.25, 0.0001, 0.12);
      break;
    case "introOpen":
      beep(500, "sine", 0.12, 0.0001, 0.1);
      break;
    case "introClose":
      beep(700, "sine", 0.2, 0.0001, 0.1);
      break;
    case "battleStart":
      beep(300, "square", 0.15, 0.0001, 0.12);
      break;
    case "battleHit":
      beep(1480, "square", 0.035, 0.0001, 0.14);
      setTimeout(() => beep(2489, "triangle", 0.09, 0.0001, 0.09), 18);
      setTimeout(() => beep(3729, "sine", 0.12, 0.0001, 0.05), 52);
      break;
    case "battleWin":
      beep(523, "triangle", 0.15, 0.0001, 0.15);
      setTimeout(() => beep(659, "triangle", 0.15, 0.0001, 0.15), 120);
      setTimeout(() => beep(784, "triangle", 0.3, 0.0001, 0.1), 240);
      setTimeout(() => beep(1046, "sine", 0.28, 0.0001, 0.08), 380);
      break;
    case "badgeUnlock":
      beep(1000, "sine", 0.12, 0.0001, 0.12);
      break;
    case "levelUp":
      beep(523, "triangle", 0.12, 0.0001, 0.18);
      setTimeout(() => beep(659, "triangle", 0.12, 0.0001, 0.18), 100);
      setTimeout(() => beep(784, "triangle", 0.25, 0.0001, 0.12), 200);
      break;
    case "predictionLock":
      beep(880, "sine", 0.15, 0.0001, 0.1);
      break;
    case "success":
    case "update":
      beep(750, "sine", 0.12, 0.0001, 0.12);
      break;
    case "warning":
      beep(300, "sawtooth", 0.2, 0.0001, 0.1);
      break;
    default:
      // Default subtle click for unmapped sounds
      beep(700, "sine", 0.06, 0.0001, 0.08);
  }
}

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTED_KEY) === "1";
}

export function setSoundMuted(value: boolean) {
  if (typeof window === "undefined") return;
  muted = value;
  window.localStorage.setItem(MUTED_KEY, value ? "1" : "0");
}

export function useGameSound() {
  useEffect(() => {
    muted = isSoundMuted();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as
        | { kind?: SoundName }
        | undefined;
      if (detail?.kind) {
        playGameSound(detail.kind);
      }
    };
    window.addEventListener(SOUND_PLAY_EVENT, handler);
    return () => window.removeEventListener(SOUND_PLAY_EVENT, handler);
  }, []);
}

export {
  SOUND_PLAY_EVENT,
  type TooolvibesSoundKind,
  playTooolvibesSound,
} from "@/lib/config/sound";
