"use client";

import { useSyncExternalStore } from "react";

export const GUIDE_PARTNER_RAIL_QUERY = "(min-width: 100rem)";

function getSnapshot(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(GUIDE_PARTNER_RAIL_QUERY).matches
  );
}

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }

  const query = window.matchMedia(GUIDE_PARTNER_RAIL_QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

/**
 * SSR-safe format switch for the single paid Guide placement.
 * The server snapshot stays inline; React reconciles the live media-query
 * snapshot after hydration without mounting both paid variants.
 */
export function useGuidePartnerMode(): "inline" | "rail" {
  const isRail = useSyncExternalStore(subscribe, getSnapshot, () => false);
  return isRail ? "rail" : "inline";
}
