"use client";

import { useEffect, useState } from "react";

import type { VibeSignupContext } from "./account-panel-model";

/* ═══════════════════════════════════════════════════════════════
   useAccountVibeContext (B27) — contesto signup Vibe Rush.
   Effetto di mount invariato rispetto al monolite: legge i
   parametri URL (source/email/vibes/xp) e il best locale da
   localStorage. Nessuna lettura durante SSR.
   ═══════════════════════════════════════════════════════════════ */

export function useAccountVibeContext() {
  const [vibeRushBest, setVibeRushBest] = useState(0);
  const [vibeContext, setVibeContext] = useState<VibeSignupContext>({
    source: "",
    email: "",
    vibes: "",
    xp: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const nextContext = {
      source: params.get("source") ?? "",
      email: params.get("email") ?? "",
      vibes: params.get("vibes") ?? "",
      xp: params.get("xp") ?? "",
    };
    setVibeContext(nextContext);

    const storedBest = Number(window.localStorage.getItem("tooolvibes:vibe-rush-best") ?? "0");
    if (Number.isFinite(storedBest)) {
      setVibeRushBest(storedBest);
    }
  }, []);

  return { vibeContext, vibeRushBest };
}
