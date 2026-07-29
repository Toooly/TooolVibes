"use client";

import { useSyncExternalStore } from "react";

import {
  REDUCED_MOTION_QUERY,
  getPrefersReducedMotion,
} from "@/lib/motion/reduced-motion";

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

/**
 * Client hook for prefers-reduced-motion.
 * SSR snapshot is always false so the first paint matches server HTML;
 * the store then updates after hydration if the user prefers reduced motion.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getPrefersReducedMotion, () => false);
}
