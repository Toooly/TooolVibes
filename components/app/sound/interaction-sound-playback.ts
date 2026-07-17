import { playTone } from "./sound-playback";
import type { SoundKind } from "./sound-profiles";
import type { InteractionSoundState } from "./interaction-sound-state";

/* ═══════════════════════════════════════════════════════════════
   interaction-sound-playback — audio lifecycle del layer (B26).
   Unlock lazy dell'AudioContext (webkit fallback), resume su
   suspended, throttle per chiave, flush del suono intro pendente
   e teardown completo su unmount (close context, stop drone,
   cleanup dataset tvSound). Port 1:1 delle closure del monolite.
   ═══════════════════════════════════════════════════════════════ */

export function getLayerAudioContext(
  state: InteractionSoundState
): AudioContext | null {
  if (state.muted) {
    return null;
  }
  const AudioContextConstructor =
    window.AudioContext ??
    (
      window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }
    ).webkitAudioContext;
  if (!AudioContextConstructor) {
    return null;
  }
  const context = state.audio ?? new AudioContextConstructor();
  state.audio = context;
  if (context.state === "suspended") {
    void context.resume();
  }
  return context;
}

export function playSystemTone(
  state: InteractionSoundState,
  soundKind: SoundKind,
  throttleMs = 120,
  key: string = soundKind
) {
  if (!state.audioUnlocked) {
    return;
  }
  const now = performance.now();
  const lastPlayed = state.systemLastPlayed[key] ?? 0;
  if (now - lastPlayed < throttleMs) {
    return;
  }
  state.systemLastPlayed[key] = now;
  const context = getLayerAudioContext(state);
  if (context) {
    playTone(context, soundKind);
  }
}

export function playInteractionTone(
  state: InteractionSoundState,
  soundKind: SoundKind
) {
  const context = getLayerAudioContext(state);
  if (!context) {
    return;
  }
  state.audioUnlocked = true;
  document.documentElement.dataset.tvSound = "on";
  if (!state.drone.running) {
    state.drone.init(context);
  }
  playTone(context, soundKind);
  const pendingIntroSound = state.pendingIntroSound;
  if (
    pendingIntroSound &&
    soundKind !== "introClose" &&
    performance.now() - pendingIntroSound.at < 5200 &&
    document.documentElement.classList.contains("brand-intro-active")
  ) {
    state.pendingIntroSound = null;
    window.setTimeout(
      () => playSystemTone(state, pendingIntroSound.kind, 480, "pending:intro"),
      90
    );
  }
}

export function teardownInteractionAudio(state: InteractionSoundState) {
  void state.audio?.close();
  state.audio = null;
  state.drone.stop();
  delete document.documentElement.dataset.tvSound;
}
