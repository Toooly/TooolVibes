"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useAdvertisingConsent } from "@/components/ads/advertising-consent-provider";

/**
 * First-party consent banner. Shown only while advertising consent is
 * `unknown` — i.e. until a real user choice exists.
 *
 * The banner is portalled to `document.body` with a high z-index so it can
 * never be hidden below the app's own portalled mobile bottom navigation.
 *
 * Accessibility:
 *  - `role="dialog"` (non-modal) with an accessible name;
 *  - receives initial focus when it appears;
 *  - accept and reject controls have equal visual prominence;
 *  - fully keyboard operable.
 */
export function ConsentBanner() {
  const { state, grantAll, denyNonNecessary, openSettings } =
    useAdvertisingConsent();
  const regionRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state === "unknown" && mounted) {
      regionRef.current?.focus();
    }
  }, [state, mounted]);

  if (!mounted || state !== "unknown") {
    return null;
  }

  return createPortal(
    <div
      ref={regionRef}
      role="dialog"
      aria-modal="false"
      aria-label="Preferenze pubblicitarie"
      tabIndex={-1}
      className="tv-consent-banner"
    >
      <div className="tv-consent-banner__inner">
        <h2 className="tv-consent-banner__title">Rispettiamo la tua privacy</h2>
        <p className="tv-consent-banner__body">
          Usiamo cookie tecnici per far funzionare il sito. Per vedere anche
          gli spazi pubblicitari TinyAdz, scegli Accetta tutto. Puoi cambiare
          idea in qualsiasi momento.
        </p>
        <div className="tv-consent-banner__actions">
          <button
            type="button"
            onClick={grantAll}
            className="tv-consent-banner__cta"
          >
            Accetta tutto
          </button>
          <button
            type="button"
            onClick={denyNonNecessary}
            className="tv-consent-banner__cta"
          >
            Rifiuta non necessari
          </button>
          <button
            type="button"
            onClick={openSettings}
            className="tv-consent-banner__ghost"
          >
            Personalizza
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
