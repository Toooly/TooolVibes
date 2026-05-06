"use client";

import { useEffect, useState } from "react";
import { MonitorSmartphone, Sparkles, X } from "lucide-react";

export function GlobalVibeLayer() {
  const [visible, setVisible] = useState(false);
  const [deviceLabel, setDeviceLabel] = useState("desktop");

  useEffect(() => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    setDeviceLabel(isMobile ? "mobile" : "desktop");

    const openTimer = window.setTimeout(() => {
      setVisible(true);
    }, 650);
    const closeTimer = window.setTimeout(() => setVisible(false), 5200);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(closeTimer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="global-vibe-toast" role="status" aria-live="polite">
      <span className="global-vibe-toast__icon" aria-hidden="true">
        <MonitorSmartphone className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="global-vibe-toast__eyebrow">
          TooolVibes experience
        </span>
        <span className="global-vibe-toast__text">
          Benvenuto: esperienza {deviceLabel} attiva, tool vivi e segnali in movimento.
        </span>
      </span>
      <Sparkles className="global-vibe-toast__spark size-4" aria-hidden="true" />
      <button
        type="button"
        className="global-vibe-toast__close"
        aria-label="Chiudi messaggio"
        onClick={() => setVisible(false)}
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
