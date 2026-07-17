"use client";

import { useEffect } from "react";

import { attachInteractionSoundListeners } from "./interaction-sound-listeners";
import type { InteractionSoundState } from "./interaction-sound-state";

/* ═══════════════════════════════════════════════════════════════
   useInteractionSoundListeners — capability hook listener DOM
   singoli (B26): pointerdown/pointerover/click/toggle/
   animationstart/input/change su window in capture, ognuno con
   cleanup dedicato e nessun duplicato su remount.
   ═══════════════════════════════════════════════════════════════ */

export function useInteractionSoundListeners(state: InteractionSoundState) {
  useEffect(() => attachInteractionSoundListeners(state), [state]);
}
