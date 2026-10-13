"use client";

import { LocalizedText } from "@/components/i18n/localized-text";
import { useAdvertisingConsent } from "@/components/ads/advertising-consent-provider";

/**
 * Persistent "Gestisci preferenze" access, placed in the site footer legal
 * row. Opens the consent settings panel whenever the site advertises.
 */
export function ConsentFooterLink() {
  const { openSettings } = useAdvertisingConsent();

  return (
    <button
      type="button"
      id="consent-dialog-opener"
      onClick={openSettings}
      className="site-footer-v2__legal-link cursor-pointer bg-transparent"
    ><LocalizedText>{"Gestisci preferenze "}</LocalizedText></button>
  );
}
