"use client";

import { useEffect } from "react";
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
 * TinyAdz v2 reads `document.currentScript`, then falls back to a script whose
 * `src` contains main.js AND a `site-id` attribute (not only data-site-id).
 * next/script leaves currentScript null, so we inject a real script node with
 * both `site-id` and `data-site-id` after consent is granted.
 */
export function TinyAdzLoader() {
  const pathname = usePathname();
  const { state: consent } = useAdvertisingConsent();
  const config = readTinyAdzConfig({
    [TINYADZ_ENABLED_ENV]: process.env.NEXT_PUBLIC_TINYADZ_ENABLED,
    [TINYADZ_SITE_ID_ENV]: process.env.NEXT_PUBLIC_TINYADZ_SITE_ID,
    [TINYADZ_TEST_MODE_ENV]: process.env.NEXT_PUBLIC_TINYADZ_TEST_MODE,
  });

  const shouldLoad =
    config.enabled &&
    Boolean(config.siteId) &&
    consent === "granted" &&
    isTinyAdzEligiblePath(pathname);

  useEffect(() => {
    if (!shouldLoad || !config.siteId) return;
    if (document.getElementById(TINYADZ_SCRIPT_ID)) return;

    const script = document.createElement("script");
    script.id = TINYADZ_SCRIPT_ID;
    script.src = TINYADZ_SCRIPT_URL;
    script.async = true;
    script.setAttribute("site-id", config.siteId);
    script.setAttribute("data-site-id", config.siteId);
    script.setAttribute("test-mode", config.testMode);
    script.setAttribute("data-test-mode", config.testMode);
    document.body.appendChild(script);
  }, [shouldLoad, config.siteId, config.testMode]);

  return null;
}
