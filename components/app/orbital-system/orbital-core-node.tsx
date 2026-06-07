"use client";

import React, { useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Home, Search, Radar, Bookmark, Columns3, X } from "lucide-react";
import Link from "next/link";
import { useOrbitalContext } from "./orbital-context";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home, color: "#6a3cff" },
  { href: "/archivio", label: "Cerca", icon: Search, color: "#39d2f6" },
  { href: "/product-hunt", label: "Radar", icon: Radar, color: "#f3bf4c" },
  { href: "/shortlist", label: "Salvati", icon: Bookmark, color: "#8b6cff" },
  { href: "/compare", label: "Confronta", icon: Columns3, color: "#2bb9de" },
];

interface OrbitalCoreNodeProps {
  x: number;
  y: number;
  isMobile: boolean;
  inSafeZone?: boolean;
}

export function OrbitalCoreNode({ x, y, isMobile, inSafeZone = false }: OrbitalCoreNodeProps) {
  const { coreMenuOpen, setCoreMenuOpen, setIsPaused } = useOrbitalContext();
  const nodeRef = useRef<HTMLDivElement>(null);
  const size = isMobile ? 58 : 72;
  const hitSize = isMobile ? 76 : 82;
  const menuRadius = isMobile ? 94 : 116;

  const handleOpen = useCallback(() => {
    setCoreMenuOpen(true);
    setIsPaused(true);
  }, [setCoreMenuOpen, setIsPaused]);

  const handleClose = useCallback(() => {
    setCoreMenuOpen(false);
    setIsPaused(false);
  }, [setCoreMenuOpen, setIsPaused]);

  const handleToggle = useCallback(() => {
    if (coreMenuOpen) {
      handleClose();
    } else {
      handleOpen();
    }
  }, [coreMenuOpen, handleOpen, handleClose]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && coreMenuOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [coreMenuOpen, handleClose]);

  // Close on click outside
  useEffect(() => {
    if (!coreMenuOpen) return;
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (nodeRef.current && !nodeRef.current.contains(target)) {
        handleClose();
      }
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("touchend", onDocClick);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("touchend", onDocClick);
    };
  }, [coreMenuOpen, handleClose]);

  // Safe-zone visual feedback: the engine has already pushed the node away;
  // this subtle state makes the "repelled by text" behavior legible.
  const dimOpacity = inSafeZone ? 0.12 : 1;
  const dimScale = inSafeZone ? 0.58 : 1;

  return (
    <motion.div
      ref={nodeRef}
      className="pointer-events-auto absolute"
      style={{
        left: x,
        top: y,
        translateX: "-50%",
        translateY: "-50%",
        willChange: "transform",
        zIndex: coreMenuOpen ? 30 : 15,
      }}
      animate={{
        scale: coreMenuOpen ? 1.15 : dimScale,
        opacity: dimOpacity,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 20, opacity: { duration: 0.35 } }}
    >
      <button
        type="button"
        aria-label={coreMenuOpen ? "Chiudi navigazione rapida" : "Apri navigazione rapida"}
        aria-expanded={coreMenuOpen}
        className="group relative flex cursor-pointer items-center justify-center rounded-full outline-none transition-transform active:scale-95 focus-visible:ring-4 focus-visible:ring-violet-300/60"
        style={{
          width: hitSize,
          height: hitSize,
          touchAction: "manipulation",
        }}
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
      >
        {/* Ambient glow */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={{
            opacity: coreMenuOpen ? 0.55 : 0.28,
            scale: coreMenuOpen ? 1.85 : 1.48,
          }}
          transition={{ duration: 0.4 }}
          style={{
            background: "radial-gradient(circle, rgba(106,60,255,0.38) 0%, transparent 70%)",
            filter: "blur(14px)",
          }}
        />

        {/* Pulse ring invitation */}
        {!coreMenuOpen && (
          <motion.div
            className="pointer-events-none absolute rounded-full"
            animate={{
              scale: [1, 1.28, 1],
              opacity: [0.28, 0, 0.28],
            }}
            transition={{
              duration: 3.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              inset: (hitSize - size) / 2,
              border: "2px solid rgba(106,60,255,0.42)",
            }}
          />
        )}

        {/* Core body */}
        <motion.span
          className="relative flex items-center justify-center rounded-full transition-transform group-hover:scale-105"
          style={{
            width: size,
            height: size,
            background: "radial-gradient(circle at 35% 35%, #1a1233 0%, #0a0618 60%, #05030f 100%)",
            border: "2px solid rgba(106,60,255,0.6)",
            boxShadow: coreMenuOpen
              ? "0 0 30px rgba(106,60,255,0.58), inset 0 0 14px rgba(106,60,255,0.18)"
              : "0 0 20px rgba(106,60,255,0.34), inset 0 0 10px rgba(106,60,255,0.1)",
          }}
          animate={{
            borderColor: coreMenuOpen ? "rgba(106,60,255,0.9)" : "rgba(106,60,255,0.6)",
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Inner swirl */}
          <span
            className="absolute inset-0 rounded-full opacity-45"
            style={{
              background: "conic-gradient(from 0deg, transparent 0%, rgba(106,60,255,0.3) 40%, transparent 60%, rgba(57,210,246,0.18) 80%, transparent 100%)",
              animation: "coreSpin 8s linear infinite",
            }}
          />
          {/* Center dot */}
          <span
            className="relative z-10 rounded-full"
            style={{
              width: size * 0.22,
              height: size * 0.22,
              background: "radial-gradient(circle, #6a3cff 0%, #0a0618 100%)",
              boxShadow: "0 0 8px rgba(106,60,255,0.65)",
            }}
          />
        </motion.span>
      </button>

      {/* Close indicator when open */}
      <AnimatePresence>
        {coreMenuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="pointer-events-none absolute right-2 top-2 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow"
          >
            <X size={10} className="text-[#120d2f]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial menu */}
      <AnimatePresence>
        {coreMenuOpen && (
          <>
            {/* Backdrop glow behind menu */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: menuRadius * 2.6,
                height: menuRadius * 2.6,
                background: "radial-gradient(circle, rgba(10,6,24,0.45) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />
            {NAV_ITEMS.map((item, i) => {
              const angle = (i / NAV_ITEMS.length) * Math.PI * 2 - Math.PI / 2;
              const tx = Math.cos(angle) * menuRadius;
              const ty = Math.sin(angle) * menuRadius;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x: tx, y: ty }}
                  exit={{ opacity: 0, scale: 0.3, x: 0, y: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 22,
                    delay: i * 0.04,
                  }}
                  className="pointer-events-auto absolute left-1/2 top-1/2"
                  style={{ translateX: "-50%", translateY: "-50%" }}
                >
                  <Link
                    href={item.href}
                    onClick={() => handleClose()}
                    className="flex flex-col items-center gap-1.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"
                    aria-label={item.label}
                  >
                    <motion.div
                      className="flex items-center justify-center rounded-2xl border shadow-lg"
                      style={{
                        width: isMobile ? 46 : 52,
                        height: isMobile ? 46 : 52,
                        background: `radial-gradient(circle at 30% 30%, ${item.color}22, rgba(255,255,255,0.92))`,
                        borderColor: `${item.color}35`,
                        boxShadow: `0 4px 16px ${item.color}25, inset 0 1px 0 rgba(255,255,255,0.6)`,
                      }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <item.icon
                        size={isMobile ? 18 : 20}
                        style={{ color: item.color }}
                        strokeWidth={2.2}
                      />
                    </motion.div>
                    <span
                      className="whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow"
                      style={{
                        background: "rgba(10,6,24,0.75)",
                        textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                      }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes coreSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </motion.div>
  );
}
