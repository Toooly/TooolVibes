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
  TINYADZ_INLINE_WIDGET_ID_ENV,
} from "@/lib/ads/tinyadz-config";
import { useAdvertisingConsent } from "@/components/ads/advertising-consent-provider";
import {
  installTinyAdzConfigCapture,
  installTinyAdzWidgetMessages,
  requestTinyAdzAd,
} from "@/components/ads/tinyadz-runtime";

/**
 * TinyAdz publisher loader.
 *
 * TinyAdz v2 reads `document.currentScript`, then falls back to a script whose
 * `src` contains main.js AND a `site-id` attribute (not only data-site-id).
 * Dynamically inserted scripts default to async; we force classic execution
 * so currentScript and site-id are visible. After consent, every eligible
 * route asks for the next ad so SPA navigation cannot silently starve ads.
 */
export function TinyAdzLoader() {
  const pathname = usePathname();
  const consent = useAdvertisingConsent();
  const config = readTinyAdzConfig({
    [TINYADZ_ENABLED_ENV]: process.env.NEXT_PUBLIC_TINYADZ_ENABLED,
    [TINYADZ_SITE_ID_ENV]: process.env.NEXT_PUBLIC_TINYADZ_SITE_ID,
    [TINYADZ_TEST_MODE_ENV]: process.env.NEXT_PUBLIC_TINYADZ_TEST_MODE,
    [TINYADZ_INLINE_WIDGET_ID_ENV]: process.env.NEXT_PUBLIC_TINYADZ_INLINE_WIDGET_ID,
  });

  const loaded = consent.loaded !== false;
  const shouldLoad =
    loaded &&
    config.enabled &&
    Boolean(config.siteId) &&
    consent.state === "granted" &&
    isTinyAdzEligiblePath(pathname);

  useEffect(() => {
    if (!shouldLoad || !config.siteId) return;

    installTinyAdzConfigCapture();
    installTinyAdzWidgetMessages();

    const existing = document.getElementById(TINYADZ_SCRIPT_ID);
    if (existing) {
      if (config.inlineWidgetId && !existing.getAttribute("data-inline-widget-id")) {
        existing.setAttribute("data-inline-widget-id", config.inlineWidgetId);
      }
      requestTinyAdzAd();
      return;
    }

    const script = document.createElement("script");
    script.id = TINYADZ_SCRIPT_ID;
    script.src = TINYADZ_SCRIPT_URL;
    script.async = true;
    script.setAttribute("site-id", config.siteId);
    script.setAttribute("data-site-id", config.siteId);
    script.setAttribute("test-mode", config.testMode);
    script.setAttribute("data-test-mode", config.testMode);
    if (config.inlineWidgetId) {
      script.setAttribute("data-inline-widget-id", config.inlineWidgetId);
    }
    script.addEventListener("load", () => {
      requestTinyAdzAd();
    });
    document.body.appendChild(script);
  }, [shouldLoad, config.siteId, config.testMode, config.inlineWidgetId, pathname]);

  return null;
}
