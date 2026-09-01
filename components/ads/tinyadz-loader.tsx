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
 * Official v2 snippet, consent-gated:
 *   <script src="https://cdn.apitiny.net/scripts/v2.0/main.js"
 *           data-site-id="..." data-test-mode="false" async></script>
 *
 * `next/script` afterInteractive is async and keeps a single node via `id`.
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
