import { AmbientDrone } from "./ambient-drone";
import type { SoundKind } from "./sound-profiles";

/* ═══════════════════════════════════════════════════════════════
   interaction-sound-state — stato condiviso del sound layer (B26).
   Factory pura: i campi corrispondono 1:1 ai ref del monolite
   (audioRef, audioUnlockedRef, lastPlayedRef, mutedRef,
   systemLastPlayedRef, pendingIntroSoundRef, droneRef).
   applySoundMuted porta la transizione di mute: dataset tvSound
   + drone, persistenza opt-in letta da sound-preferences.
   ═══════════════════════════════════════════════════════════════ */

export type InteractionSoundState = {
  audio: AudioContext | null;
  audioUnlocked: boolean;
  lastPlayedAt: number;
  muted: boolean;
  systemLastPlayed: Record<string, number>;
  pendingIntroSound: {
    kind: SoundKind;
    at: number;
  } | null;
  drone: AmbientDrone;
};

export function createInteractionSoundState(): InteractionSoundState {
  return {
    audio: null,
    audioUnlocked: false,
    lastPlayedAt: 0,
    muted: false,
    systemLastPlayed: {},
    pendingIntroSound: null,
    drone: new AmbientDrone(),
  };
}

export function applySoundMuted(
  state: InteractionSoundState,
  muted: boolean
) {
  state.muted = muted;
  document.documentElement.dataset.tvSound = muted
    ? "muted"
    : state.audioUnlocked
      ? "on"
      : "ready";
  state.drone.setMuted(muted);
}
