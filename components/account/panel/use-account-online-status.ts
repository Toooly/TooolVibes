"use client";

import { useEffect, useState } from "react";

/* ═══════════════════════════════════════════════════════════════
   useAccountOnlineStatus (B59) — stato connessione del browser.
   Default ottimista online (SSR/primo paint); all'effetto legge
   navigator.onLine reale e segue gli eventi online/offline.
   In jsdom: navigator.onLine è stubbabile e gli eventi si
   dispatcano su window, quindi il comportamento è deterministico.
   ═══════════════════════════════════════════════════════════════ */

function readBrowserOnline(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.onLine !== "boolean") {
    return true;
  }
  return navigator.onLine;
}

export function useAccountOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(readBrowserOnline());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
