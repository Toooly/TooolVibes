"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import type { OrbitalItem } from "./types";

interface ToolPreviewPopoverProps {
  item: OrbitalItem;
  visible: boolean;
  onClose: () => void;
  position: "top" | "bottom" | "left" | "right";
}

const arrowClasses = {
  top: "bottom-[-5px] left-1/2 -translate-x-1/2 rotate-180",
  bottom: "top-[-5px] left-1/2 -translate-x-1/2",
  left: "right-[-5px] top-1/2 -translate-y-1/2 rotate-90",
  right: "left-[-5px] top-1/2 -translate-y-1/2 -rotate-90",
};

export function ToolPreviewPopover({ item, visible, onClose, position }: ToolPreviewPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const color = item.color ?? "#6a3cff";
  const [imgError, setImgError] = useState(false);
  const actionLabel = item.variant === "tool" || item.variant === "featured" ? "Vedi tool" : "Apri percorso";

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, onClose]);

  const positionClasses = {
    top: "bottom-full mb-3 left-1/2 -translate-x-1/2",
    bottom: "top-full mt-3 left-1/2 -translate-x-1/2",
    left: "right-full mr-3 top-1/2 -translate-y-1/2",
    right: "left-full ml-3 top-1/2 -translate-y-1/2",
  };

  const enterY = position === "bottom" ? -10 : position === "top" ? 10 : 0;
  const enterX = position === "right" ? -10 : position === "left" ? 10 : 0;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.88, y: enterY, x: enterX }}
          animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: enterY * 0.6, x: enterX * 0.6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className={`absolute ${positionClasses[position]} z-[var(--z-modal)] w-[260px] sm:w-[300px]`}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="relative overflow-hidden rounded-2xl border bg-white/95 backdrop-blur-2xl"
            style={{
              borderColor: `${color}22`,
              boxShadow: `0 20px 60px rgba(18,13,47,0.22), 0 0 0 1px ${color}10, 0 8px 24px ${color}15`,
            }}
          >
            {/* Top gradient line */}
            <div
              className="absolute left-0 right-0 top-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
            />

            {/* Arrow */}
            <div
              className={`absolute ${arrowClasses[position]} z-10 h-3 w-3`}
              style={{
                background: "rgba(255,255,255,0.95)",
                borderRightWidth: "1px",
                borderBottomWidth: "1px",
                borderColor: `${color}30`,
              }}
            />

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.22, ease: "easeOut" }}
              className="flex items-start justify-between gap-3 border-b border-[rgba(106,60,255,0.06)] px-4 py-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {/* Mini icon */}
                {item.iconUrl && !imgError ? (
                  <img
                    src={item.iconUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    onError={() => setImgError(true)}
                    className="h-7 w-7 shrink-0 rounded-lg border border-[rgba(106,60,255,0.08)] object-contain"
                  />
                ) : (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${color}, #4f46e5)` }}
                  >
                    {item.initials?.slice(0, 1)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#120d2f]">{item.title}</p>
                  <p className="mt-0.5 text-[11px] font-medium" style={{ color }}>{item.category}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#4f4970] transition-colors hover:bg-[rgba(106,60,255,0.06)] hover:text-[#120d2f]"
                aria-label="Chiudi anteprima"
              >
                <X size={14} />
              </button>
            </motion.div>

            {/* Body */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.22, ease: "easeOut" }}
              className="max-h-[180px] overflow-y-auto overscroll-contain px-4 py-3"
            >
              <p className="text-xs leading-relaxed text-[#4f4970]">{item.description}</p>
            </motion.div>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.22, ease: "easeOut" }}
              className="relative overflow-hidden border-t border-[rgba(106,60,255,0.06)] px-4 py-2.5"
            >
              {/* Shimmer */}
              <div
                className="pointer-events-none absolute inset-0 opacity-20"
                style={{
                  background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2.5s infinite linear",
                }}
              />
              <Link
                href={item.href}
                onClick={onClose}
                className="group relative inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:shadow-[0_4px_20px_rgba(106,60,255,0.35)]"
                style={{ background: `linear-gradient(135deg, ${color}, #4f46e5)` }}
              >
                {actionLabel}
                <ArrowUpRight size={12} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
