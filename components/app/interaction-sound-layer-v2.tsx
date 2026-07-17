"use client";

import { useInteractionSoundLayer } from "./sound/use-interaction-sound-layer";

/* ═══════════════════════════════════════════════════════════════
   InteractionSoundLayerV2 — facade del sound layer (B26).
   API preesistente invariata: stesso export, nessuna prop, render
   null. La logica vive nei moduli components/app/sound/* (data
   profiles, mapping DOM, preferences, playback, drone, listener
   singoli e capability hook); i consumer non cambiano e il
   kill switch B04 resta intatto. Reversibile ripristinando il
   monolite in questo file.
   ═══════════════════════════════════════════════════════════════ */

export function InteractionSoundLayerV2() {
  useInteractionSoundLayer();
  return null;
}
