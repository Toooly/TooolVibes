"use client";

import { useEffect, useRef } from "react";

import { teardownInteractionAudio } from "./interaction-sound-playback";
import {
  createInteractionSoundState,
  type InteractionSoundState,
} from "./interaction-sound-state";
import { useInteractionSoundListeners } from "./use-interaction-sound-listeners";
import { useSoundMutedState } from "./use-sound-muted-state";
import { useSystemSoundEvents } from "./use-system-sound-events";

/* ═══════════════════════════════════════════════════════════════
   useInteractionSoundLayer — orchestratore del sound layer (B26).
   Crea lo stato condiviso una sola volta e compone i capability
   hook dedicati: opt-in persistente + mute-change, listener DOM
   singoli, eventi sistema. L'ultimo effect chiude il lifecycle
   audio su unmount (context close, drone stop, dataset pulito).
   ═══════════════════════════════════════════════════════════════ */

export function useInteractionSoundLayer() {
  const stateRef = useRef<InteractionSoundState | null>(null);
  stateRef.current ??= createInteractionSoundState();
  const state = stateRef.current;

  useSoundMutedState(state);
  useInteractionSoundListeners(state);
  useSystemSoundEvents(state);
  useEffect(() => () => teardownInteractionAudio(state), [state]);
}
