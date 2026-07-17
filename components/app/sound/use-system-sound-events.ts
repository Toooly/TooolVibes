"use client";

import { useEffect } from "react";

import { attachSystemSoundListener } from "./interaction-sound-listeners";
import type { InteractionSoundState } from "./interaction-sound-state";

/* ═══════════════════════════════════════════════════════════════
   useSystemSoundEvents — capability hook eventi sistema (B26).
   Ascolta SOUND_PLAY_EVENT tipizzato (route, toast, reward
   gamification, intro) con flush del suono intro pendente;
   emissione gated dal kill switch B04 lato lib/config/sound.
   ═══════════════════════════════════════════════════════════════ */

export function useSystemSoundEvents(state: InteractionSoundState) {
  useEffect(() => attachSystemSoundListener(state), [state]);
}
