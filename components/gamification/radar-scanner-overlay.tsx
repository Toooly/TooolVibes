"use client";

import { motion } from "motion/react";

export function RadarScannerOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-full">
      <motion.div
        className="absolute left-1/2 top-1/2 h-1/2 w-1 bg-gradient-to-b from-transparent via-emerald-400/40 to-transparent"
        style={{ originX: 0.5, originY: 1 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
