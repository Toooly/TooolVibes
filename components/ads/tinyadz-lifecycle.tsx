"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useAdvertisingConsent } from "@/components/ads/advertising-consent-provider";
import { isTinyAdzEligiblePath } from "@/lib/ads/tinyadz-config";
import { bestEffortHideTinyAdz, reloadOnce, tinyadzRuntimeActive } from "@/components/ads/tinyadz-runtime";

/**
 * SPA route-lifecycle guard for TinyAdz.
 *
 * `main.js` re-arms `requestNextAd()` on history/popstate, so a TinyAdz popup
 * can survive client navigation onto an excluded route (e.g. /compare, whose
 * own fresh load is clean). Because TinyAdz exposes no official destroy API,
 * when we transition from an ACTIVE eligible route to an EXCLUDED route we:
 *   1. best-effort hide any visible popup via the manager methods; and
 *   2. issue ONE session-guarded full-page reload.
 * After the reload the loader does not mount on the excluded route, so the
 * page is guaranteed to contain zero TinyAdz scripts/iframes/containers and no
 * reload loop is possible.
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

    const wasActive = previous === true && state === "granted";
    const nowExcluded = eligible === false;
    if (wasActive && nowExcluded && tinyadzRuntimeActive()) {
      bestEffortHideTinyAdz();
      reloadOnce("route");
    }
  }, [pathname, state]);

  return null;
}
