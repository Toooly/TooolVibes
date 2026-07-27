"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { playGameSound } from "@/lib/gamification/sound-engine";

const LABELS: Record<string, string> = {
  "/radar": "SCANSIONE",
  "/confronta": "CONFRONTO",
  "/compare": "CONFRONTO",
};

export function CinematicTransition() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const lastPath = useRef(pathname);

  useEffect(() => {
    if (lastPath.current === (pathname ?? '')) return;
    lastPath.current = pathname;
    const label = LABELS[pathname ?? ''];
    if (!label) return;
    setActive(true);
    playGameSound("route");
    const t = window.setTimeout(() => setActive(false), 900);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="cinematic-transition"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, delay: 0.7 }}
          aria-hidden="true"
        >
          <div className="cinematic-transition__flash" />
          <div className="cinematic-transition__scanline" />
          <div className="cinematic-transition__wipe" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-4xl font-black tracking-[0.3em] text-white/90">
              {LABELS[pathname ?? '']}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
