"use client";

import { useEffect, useRef } from "react";

import { useAdvertisingConsent } from "@/components/ads/advertising-consent-provider";

/**
 * First-party consent banner. Shown only while advertising consent is
 * `unknown` — i.e. until a real user choice exists.
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

  useEffect(() => {
    if (state === "unknown") {
      regionRef.current?.focus();
    }
  }, [state]);

  if (state !== "unknown") {
    return null;
  }

  return (
    <div
      ref={regionRef}
      role="dialog"
      aria-modal="false"
      aria-label="Preferenze pubblicitarie"
      tabIndex={-1}
      className="fixed inset-x-0 bottom-0 z-[9000] border-t border-border bg-background/95 p-4 backdrop-blur shadow-[0_-8px_24px_rgba(0,0,0,0.3)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <h2 className="text-sm font-semibold">Rispettiamo la tua privacy</h2>
        <p className="text-sm text-muted-foreground">
          Usiamo cookie tecnici per il funzionamento del sito. Pubblicità e
          misurazione (TinyAdz) caricano componenti di terze parti e utilizzano
          dati solo con il tuo consenso.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={grantAll}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            Accetta tutto
          </button>
          <button
            type="button"
            onClick={denyNonNecessary}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            Rifiuta non necessari
          </button>
          <button
            type="button"
            onClick={openSettings}
            className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            Personalizza
          </button>
        </div>
      </div>
    </div>
  );
}
