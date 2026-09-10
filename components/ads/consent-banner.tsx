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
 * P0 occlusion contract (v3.2): on mobile the banner is a COMPACT bar
 * (~120px). It must never swallow a large share of the viewport, because
 * every pixel it covers is a pixel where catalog cards and CTAs silently
 * refuse taps. One body line + two equal CTAs + inline settings link.
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
      <h2 className="sr-only">Rispettiamo la tua privacy</h2>
      <div className="tv-consent-banner__inner">
        <p className="tv-consent-banner__body">
          Cookie tecnici per far funzionare il sito; con il tuo consenso,
          anche gli spazi TinyAdz. Cambia scelta quando vuoi:{" "}
          <button
            type="button"
            onClick={openSettings}
            className="tv-consent-banner__settings-link"
          >
            Personalizza
          </button>
          .
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
        </div>
      </div>
    </div>,
    document.body,
  );
}
