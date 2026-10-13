"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
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
 *  - accept and reject controls have equal visual prominence;
 *  - fully keyboard operable via natural tab order.
 */
export function ConsentBanner() {
  const { state, grantAll, denyNonNecessary, openSettings } =
    useAdvertisingConsent();
  const [mounted, setMounted] = useState(false);
  const bannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (!mounted || state !== "unknown") {
      root.style.setProperty("--tv-consent-banner-height", "0px");
      return () => {
        root.style.setProperty("--tv-consent-banner-height", "0px");
      };
    }

    const publish = () => {
      const height = bannerRef.current?.offsetHeight ?? 0;
      root.style.setProperty("--tv-consent-banner-height", `${height}px`);
    };

    publish();
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(publish);
    if (bannerRef.current && observer) observer.observe(bannerRef.current);
    window.addEventListener("resize", publish);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", publish);
      root.style.setProperty("--tv-consent-banner-height", "0px");
    };
  }, [mounted, state]);

  /* v3.2: no auto-focus. The banner is a NON-modal surface; stealing the
     initial focus breaks the skip-link-first keyboard contract on every
     fresh page load. Keyboard users reach the banner through natural tab
     order (it is portalled as the last body child). */

  if (!mounted || state !== "unknown") {
    return null;
  }

  return createPortal(
    <LocalizedAttributes><div
      ref={bannerRef}
      role="dialog"
      aria-modal="false"
      aria-label="Preferenze pubblicitarie"
      tabIndex={-1}
      className="tv-consent-banner"
    >
      <h2 className="sr-only"><LocalizedText>{"Rispettiamo la tua privacy"}</LocalizedText></h2>
      <div className="tv-consent-banner__inner">
        <p className="tv-consent-banner__body"><LocalizedText>{"Cookie tecnici per far funzionare il sito; con il tuo consenso, anche gli spazi TinyAdz. Cambia scelta quando vuoi:"}</LocalizedText><LocalizedText>{" "}</LocalizedText>
          <button
            type="button"
            onClick={openSettings}
            className="tv-consent-banner__settings-link"
          ><LocalizedText>{"Personalizza "}</LocalizedText></button>
          .
        </p>
        <div className="tv-consent-banner__actions">
          <button
            type="button"
            onClick={grantAll}
            className="tv-consent-banner__cta"
          ><LocalizedText>{"Accetta tutto "}</LocalizedText></button>
          <button
            type="button"
            onClick={denyNonNecessary}
            className="tv-consent-banner__cta"
          ><LocalizedText>{"Rifiuta non necessari "}</LocalizedText></button>
        </div>
      </div>
    </div></LocalizedAttributes>,
    document.body,
  );
}
