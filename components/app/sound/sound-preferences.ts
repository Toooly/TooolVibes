import { SOUND_STORAGE_KEY } from "@/lib/config/sound";

/* ═══════════════════════════════════════════════════════════════
   sound-preferences — lettura opt-in audio persistente (B26).
   La preferenza salvata in localStorage (scritta dal toggle B04,
   invariato) vince; in assenza si rispetta prefers-reduced-motion.
   Estratto invariato dal monolite interaction-sound-layer-v2.
   ═══════════════════════════════════════════════════════════════ */

export function readInitialSoundMuted() {
  try {
    const storedValue = window.localStorage.getItem(SOUND_STORAGE_KEY);
    if (storedValue !== null) {
      return storedValue === "true";
    }
  } catch {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
