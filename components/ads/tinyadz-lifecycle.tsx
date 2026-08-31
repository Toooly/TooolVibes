"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useAdvertisingConsent } from "@/components/ads/advertising-consent-provider";
import { isTinyAdzEligiblePath } from "@/lib/ads/tinyadz-config";
import {
  bestEffortHideTinyAdz,
  requestTinyAdzAd,
  tinyadzRuntimeActive,
} from "@/components/ads/tinyadz-runtime";

/**
 * SPA route-lifecycle for TinyAdz.
 * Hide on excluded routes. Ask for the next ad when coming back to an
 * eligible route so navigation cannot starve the runtime.
 */
export function TinyAdzLifecycle() {
  const { state } = useAdvertisingConsent();
  const pathname = usePathname();
  const previousEligible = useRef<boolean | null>(null);

  useEffect(() => {
    const eligible = isTinyAdzEligiblePath(pathname);
    const previous = previousEligible.current;
    previousEligible.current = eligible;

    if (previous === null) {
      return;
    }

    const granted = state === "granted";
    if (previous === true && eligible === false && granted && tinyadzRuntimeActive()) {
      bestEffortHideTinyAdz();
      return;
    }
    if (previous === false && eligible === true && granted) {
      requestTinyAdzAd();
    }
  }, [pathname, state]);

  return null;
}
