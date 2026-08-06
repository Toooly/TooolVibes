"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

import {
  isTinyAdzEligiblePath,
  readTinyAdzConfig,
  TINYADZ_ENABLED_ENV,
  TINYADZ_SCRIPT_ID,
  TINYADZ_SCRIPT_URL,
  TINYADZ_SITE_ID_ENV,
  TINYADZ_TEST_MODE_ENV,
} from "@/lib/ads/tinyadz-config";
import { useAdvertisingConsent } from "@/components/ads/advertising-consent-provider";

/**
 * TinyAdz publisher loader.
 *
 * Mounted once inside the public marketing layout. It renders the TinyAdz
 * script only when ALL of the following hold:
 *
 *  1. the feature flag is enabled (defaults OFF);
 *  2. a site id is configured (defaults none);
 *  3. advertising consent is explicitly `granted` via the canonical
 *     AdvertisingConsentProvider (never `unknown` nor `denied`);
 *  4. the current pathname is an eligible public discovery route.
 *
 * The gate is evaluated on every render, so the script is never mounted on
 * excluded routes. Because the loader lives in the shared marketing layout it
 * is not mounted on admin, auth or dev routes at all.
 *
 * `next/script` with a stable `id` deduplicates the script node across
 * client-side navigations, guaranteeing a single `<script id="tinyadz-v2">`.
 */
export function TinyAdzLoader() {
  const pathname = usePathname();
  const { state: consent } = useAdvertisingConsent();
  const config = readTinyAdzConfig({
    [TINYADZ_ENABLED_ENV]: process.env.NEXT_PUBLIC_TINYADZ_ENABLED,
    [TINYADZ_SITE_ID_ENV]: process.env.NEXT_PUBLIC_TINYADZ_SITE_ID,
    [TINYADZ_TEST_MODE_ENV]: process.env.NEXT_PUBLIC_TINYADZ_TEST_MODE,
  });

  if (
    !config.enabled ||
    !config.siteId ||
    consent !== "granted" ||
    !isTinyAdzEligiblePath(pathname)
  ) {
    return null;
  }

  return (
    <Script
      id={TINYADZ_SCRIPT_ID}
      src={TINYADZ_SCRIPT_URL}
      strategy="afterInteractive"
      data-site-id={config.siteId}
      data-test-mode={config.testMode}
    />
  );
}
