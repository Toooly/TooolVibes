"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useAdvertisingConsent } from "@/components/ads/advertising-consent-provider";
import { scheduleTinyAdzInlineBind } from "@/components/ads/tinyadz-runtime";
import {
  isTinyAdzEligiblePath,
  readTinyAdzConfig,
  TINYADZ_ENABLED_ENV,
  TINYADZ_SITE_ID_ENV,
  TINYADZ_TEST_MODE_ENV,
} from "@/lib/ads/tinyadz-config";
import "./tinyadz-inline-slot.css";

/**
 * TinyAdz manual inline slot for curated page placements.
 *
 * This component only renders the TinyAdz inline container agreement:
 *
 *    <div data-tv-ad-frame="" />
 *
 * It renders NO script (the TinyAdzLoader owns the single script node), keeps
 * a single canonical consent state (consumed from AdvertisingConsentProvider),
 * and returns `null` whenever TinyAdz is disabled, the site id is missing,
 * advertising consent is not explicitly granted, or the pathname is excluded.
 *
 * Because it returns nothing unless the ad may actually run, there is no blank
 * advertising gap before consent.
 */
export function TinyAdzInlineSlot({
  placement,
}: Readonly<{ placement: string }>) {
  const pathname = usePathname();
  const { state: consent } = useAdvertisingConsent();
  const config = readTinyAdzConfig({
    [TINYADZ_ENABLED_ENV]: process.env.NEXT_PUBLIC_TINYADZ_ENABLED,
    [TINYADZ_SITE_ID_ENV]: process.env.NEXT_PUBLIC_TINYADZ_SITE_ID,
    [TINYADZ_TEST_MODE_ENV]: process.env.NEXT_PUBLIC_TINYADZ_TEST_MODE,
  });

  const canMount =
    config.enabled &&
    Boolean(config.siteId) &&
    consent === "granted" &&
    isTinyAdzEligiblePath(pathname);

  useEffect(() => {
    if (!canMount) return;
    scheduleTinyAdzInlineBind();
  }, [canMount, pathname, placement]);

  if (!canMount) {
    return null;
  }

  return (
    <aside
      aria-label="Pubblicità"
      className="tinyadz-inline-slot"
      data-tinyadz-placement={placement}
    >
      <p className="tinyadz-inline-slot__label">Pubblicità</p>
      <div data-tv-ad-frame="" />
    </aside>
  );
}
