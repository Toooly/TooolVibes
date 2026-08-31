"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

import { routeTransitionPreset } from "@/lib/motion/presets";
import {
  REDUCED_MOTION_QUERY,
  getPrefersReducedMotion,
} from "@/lib/motion/reduced-motion";

function subscribeReducedMotion(onStoreChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mq = window.matchMedia(REDUCED_MOTION_QUERY);
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const preferReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getPrefersReducedMotion,
    () => false,
  );
  const preset = routeTransitionPreset({ preferReducedMotion });

  return (
    <motion.div
      key={pathname}
      className="tv-page-transition"
      initial={preferReducedMotion ? false : { opacity: 0.18 }}
      animate={{ opacity: 1 }}
      transition={preset.transition}
    >
      {children}
    </motion.div>
  );
}
