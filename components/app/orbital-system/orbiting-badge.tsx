"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { OrbitalItem } from "./types";
import { ToolPreviewPopover } from "./tool-preview-popover";
import { useOrbitalContext } from "./orbital-context";

interface OrbitingBadgeProps {
  item: OrbitalItem;
  x: number;
  y: number;
  index: number;
  isMobile: boolean;
  enableGlow: boolean;
}

export function OrbitingBadge({ item, x, y, index, isMobile, enableGlow }: OrbitingBadgeProps) {
  const { hoveredItemId, setHoveredItemId, selectedItemId, setSelectedItemId, setIsPaused } = useOrbitalContext();
  const [isHovered, setIsHovered] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<"top" | "bottom" | "left" | "right">("bottom");
  const badgeRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number>(0);

  const isActive = hoveredItemId === item.id || selectedItemId === item.id;

  useEffect(() => {
    if (selectedItemId !== item.id) {
      setPopoverOpen(false);
    }
  }, [selectedItemId, item.id]);

  const updatePopoverPos = useCallback(() => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const spaceBottom = window.innerHeight - rect.bottom;
    const spaceTop = rect.top;
    const spaceRight = window.innerWidth - rect.right;

    if (spaceBottom > 220) setPopoverPos("bottom");
    else if (spaceTop > 220) setPopoverPos("top");
    else if (spaceRight > 300) setPopoverPos("right");
    else setPopoverPos("left");
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isMobile) return;
    setIsHovered(true);
    setHoveredItemId(item.id);
    setIsPaused(true);
    updatePopoverPos();
    setPopoverOpen(true);
  }, [isMobile, item.id, setHoveredItemId, setIsPaused, updatePopoverPos]);

  const handleMouseLeave = useCallback(() => {
    if (isMobile) return;
    setIsHovered(false);
    setHoveredItemId(null);
    setIsPaused(false);
    setPopoverOpen(false);
  }, [isMobile, setHoveredItemId, setIsPaused]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile) {
        e.preventDefault();
        if (selectedItemId === item.id) {
          window.location.href = item.href;
        } else {
          setSelectedItemId(item.id);
          updatePopoverPos();
          setPopoverOpen(true);
        }
      }
    },
    [isMobile, item.id, item.href, selectedItemId, setSelectedItemId, updatePopoverPos]
  );

  const handleTouchStart = useCallback(() => {
    touchStartRef.current = Date.now();
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const duration = Date.now() - touchStartRef.current;
      if (duration < 300) {
        if (selectedItemId === item.id) {
          window.location.href = item.href;
        } else {
          e.preventDefault();
          setSelectedItemId(item.id);
          updatePopoverPos();
          setPopoverOpen(true);
        }
      }
    },
    [item.id, item.href, selectedItemId, setSelectedItemId, updatePopoverPos]
  );

  const glowColor = item.color ?? "#6a3cff";

  return (
    <motion.div
      ref={badgeRef}
      className="absolute"
      style={{
        left: x,
        top: y,
        translateX: "-50%",
        translateY: "-50%",
        willChange: "transform",
        zIndex: isActive ? 60 : 20 + index,
      }}
      animate={{
        scale: isActive ? 1.18 : isHovered ? 1.1 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {enableGlow && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            opacity: isActive ? 0.35 : 0,
            scale: isActive ? 1.6 : 1.2,
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: `radial-gradient(circle, ${glowColor}40 0%, transparent 70%)`,
            filter: "blur(8px)",
          }}
        />
      )}

      <div
        className="relative flex items-center justify-center rounded-full border backdrop-blur-md transition-colors"
        style={{
          width: isActive ? 52 : 40,
          height: isActive ? 52 : 40,
          background: isActive
            ? `linear-gradient(135deg, ${glowColor}20, ${glowColor}08)`
            : "rgba(18,13,47,0.72)",
          borderColor: isActive ? `${glowColor}50` : "rgba(255,255,255,0.08)",
          boxShadow: isActive
            ? `0 0 20px ${glowColor}30, inset 0 0 8px ${glowColor}15`
            : "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <span
          className="select-none text-[10px] font-bold tracking-wider text-white"
          style={{ textShadow: `0 0 8px ${glowColor}60` }}
        >
          {item.initials}
        </span>
      </div>

      <AnimatePresence>
        {(isActive || isHovered) && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap"
          >
            <span className="rounded-full bg-[rgba(18,13,47,0.85)] px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-md">
              {item.title}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <ToolPreviewPopover
        item={item}
        visible={popoverOpen}
        onClose={() => {
          setPopoverOpen(false);
          setSelectedItemId(null);
          setIsPaused(false);
        }}
        position={popoverPos}
      />
    </motion.div>
  );
}
