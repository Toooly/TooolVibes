"use client";

import { useEffect } from "react";

import { attachSoundMutedChangeListener } from "./interaction-sound-listeners";
import {
  applySoundMuted,
  type InteractionSoundState,
} from "./interaction-sound-state";
import { readInitialSoundMuted } from "./sound-preferences";

/* ═══════════════════════════════════════════════════════════════
   useSoundMutedState — capability hook opt-in audio (B26).
   Applica la preferenza persistente (localStorage → reduced
   motion) e ascolta l'evento globale di mute-change del toggle
   B04: contratto kill switch invariato (suono close/open ai
   bordi, dataset tvSound, drone mute).
   ═══════════════════════════════════════════════════════════════ */

export function useSoundMutedState(state: InteractionSoundState) {
  useEffect(() => {
    applySoundMuted(state, readInitialSoundMuted());
    return attachSoundMutedChangeListener(state);
  }, [state]);
}
