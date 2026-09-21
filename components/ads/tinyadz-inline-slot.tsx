"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { useAdvertisingConsent } from "@/components/ads/advertising-consent-provider";
import {
  isTinyAdzEligiblePath,
  readTinyAdzConfig,
  TINYADZ_ENABLED_ENV,
  TINYADZ_SITE_ID_ENV,
  TINYADZ_TEST_MODE_ENV,
} from "@/lib/ads/tinyadz-config";
import "./tinyadz-inline-slot.css";

const FILL_TIMEOUT_MS = 8000;
const MIN_FILL_PX = 32;

type FillState = "waiting" | "filled" | "empty";

function paintedFillPx(root: Element): number {
  const iframe = root.querySelector("iframe.inlined-ta-ad");
  if (!iframe) return 0;
  return iframe.getBoundingClientRect().height;
}

/**
 * TinyAdz manual inline slot for curated page placements.
 *
 * Renders the TinyAdz inline container agreement:
 *
 *    <div ta-ad-container="" />
 *
 * No script (TinyAdzLoader owns the single script node). Returns null when
 * TinyAdz is disabled, the site id is missing, advertising consent is not
 * granted, or the pathname is excluded. An empty vendor fill keeps the host
 * mounted at height 0 so a late fill can still paint.
 */
export function TinyAdzInlineSlot({
  placement,
  asGridItem = false,
}: Readonly<{ placement: string; asGridItem?: boolean }>) {
  const pathname = usePathname();
  const { state: consent } = useAdvertisingConsent();
  const config = readTinyAdzConfig({
    [TINYADZ_ENABLED_ENV]: process.env.NEXT_PUBLIC_TINYADZ_ENABLED,
    [TINYADZ_SITE_ID_ENV]: process.env.NEXT_PUBLIC_TINYADZ_SITE_ID,
    [TINYADZ_TEST_MODE_ENV]: process.env.NEXT_PUBLIC_TINYADZ_TEST_MODE,
  });
  const hostRef = useRef<HTMLElement | null>(null);
  const [fillState, setFillState] = useState<FillState>("waiting");

  const gated =
    !config.enabled ||
    !config.siteId ||
    consent !== "granted" ||
    !isTinyAdzEligiblePath(pathname);

  useEffect(() => {
    if (gated) return;
    const host = hostRef.current;
    if (!host) return;

    let resizeObserver: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let timer = 0;

    const observePainted = () => {
      if (typeof ResizeObserver === "undefined") return;
      if (!resizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          detect();
        });
      }
      resizeObserver.observe(host);
      host.querySelectorAll("iframe.inlined-ta-ad").forEach((frame) => {
        resizeObserver?.observe(frame);
      });
    };

    const detect = () => {
      if (paintedFillPx(host) >= MIN_FILL_PX) {
        setFillState("filled");
        mutationObserver?.disconnect();
        resizeObserver?.disconnect();
        window.clearTimeout(timer);
        return true;
      }
      observePainted();
      return false;
    };

    if (detect()) return;

    mutationObserver = new MutationObserver(() => {
      detect();
    });
    mutationObserver.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    timer = window.setTimeout(() => {
      setFillState((current) => (current === "waiting" ? "empty" : current));
    }, FILL_TIMEOUT_MS);

    return () => {
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      window.clearTimeout(timer);
    };
  }, [gated]);

  if (gated) {
    return null;
  }

  const slot = (
    <aside
      ref={hostRef}
      aria-label={fillState === "filled" ? "Pubblicità" : undefined}
      aria-hidden={fillState !== "filled"}
      className="tinyadz-inline-slot"
      data-tinyadz-placement={placement}
      data-tinyadz-state={fillState}
    >
      {fillState === "filled" ? (
        <p className="tinyadz-inline-slot__label">Pubblicità</p>
      ) : null}
      <div ta-ad-container="" />
    </aside>
  );

  if (asGridItem) {
    if (fillState !== "filled") {
      return (
        <div className="tinyadz-inline-slot--probe" aria-hidden="true">
          {slot}
        </div>
      );
    }
    return <li className="ar4-grid__item--ad">{slot}</li>;
  }

  return slot;
}
