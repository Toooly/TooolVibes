"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import type { OrbitalItem } from "./types";
import { ToolPreviewPopover } from "./tool-preview-popover";
import { useOrbitalContext } from "./orbital-context";
import { OrbitalShape } from "./orbital-shapes";

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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number>(0);

  const isActive = hoveredItemId === item.id || selectedItemId === item.id;
  const isRealTool = item.href !== "#";

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

    if (spaceBottom > 240) setPopoverPos("bottom");
    else if (spaceTop > 240) setPopoverPos("top");
    else if (spaceRight > 320) setPopoverPos("right");
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
    setTilt({ x: 0, y: 0 });
  }, [isMobile, setHoveredItemId, setIsPaused]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isMobile || !badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / (rect.width / 2);
    const dy = (e.clientY - cy) / (rect.height / 2);
    setTilt({ x: dy * -8, y: dx * 8 });
  }, [isMobile]);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
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
    [item.id, item.href, selectedItemId, setSelectedItemId, updatePopoverPos]
  );

  const baseSize = isMobile ? 36 : 48;
  const size = isActive ? baseSize + 6 : baseSize;

  return (
    <motion.div
      ref={badgeRef}
      role="button"
      tabIndex={0}
      aria-label={`${item.title}: ${item.description}`}
      className="absolute cursor-pointer outline-none"
      style={{
        left: x,
        top: y,
        translateX: "-50%",
        translateY: "-50%",
        willChange: "transform",
        zIndex: isActive ? 60 : 20 + index,
        perspective: 400,
      }}
      animate={{
        scale: isActive ? 1.22 : isHovered ? 1.12 : 1,
        rotateX: tilt.x,
        rotateY: tilt.y,
      }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {/* Focus ring */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity focus-visible:opacity-100"
        style={{
          boxShadow: `0 0 0 3px ${item.color ?? "#6a3cff"}40`,
          transform: "scale(1.25)",
        }}
      />

      {/* Pulse ring (subtle invitation) */}
      {isRealTool && !isMobile && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={{
            scale: [1.15, 1.45, 1.15],
            opacity: [0.15, 0, 0.15],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.4,
          }}
          style={{
            border: `1.5px solid ${item.color ?? "#6a3cff"}`,
          }}
        />
      )}

      {/* Glow */}
      {enableGlow && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-full"
          animate={{
            opacity: isActive ? 0.4 : 0,
            scale: isActive ? 1.7 : 1.2,
          }}
          transition={{ duration: 0.3 }}
          style={{
            background: `radial-gradient(circle, ${item.color ?? "#6a3cff"}35 0%, transparent 70%)`,
            filter: "blur(10px)",
          }}
        />
      )}

      {/* Shape */}
      <OrbitalShape
        type={item.shapeType ?? "gem"}
        color={item.color ?? "#6a3cff"}
        size={size}
        isActive={isActive}
        isHovered={isHovered}
        iconUrl={item.iconUrl}
        initials={item.initials}
      />

      {/* Label — always visible for real tools, hover-only for decorative */}
      <div className="absolute left-1/2 top-full mt-2.5 -translate-x-1/2">
        <AnimatePresence>
          {(isRealTool || isActive || isHovered) && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: isActive || isHovered ? 1 : isRealTool ? 0.75 : 0, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-md"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${item.color ?? "#6a3cff"}35, rgba(18,13,47,0.75))`
                    : "rgba(18,13,47,0.65)",
                  boxShadow: isActive ? `0 2px 12px ${item.color ?? "#6a3cff"}25` : "0 2px 8px rgba(0,0,0,0.15)",
                  border: `1px solid ${isActive ? `${item.color ?? "#6a3cff"}40` : "rgba(255,255,255,0.06)"}`,
                }}
              >
                {item.title}
              </span>

              {/* Explore callout on hover */}
              {(isActive || isHovered) && isRealTool && (
                <motion.span
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 3 }}
                  transition={{ delay: 0.06, duration: 0.15 }}
                  className="flex items-center gap-0.5 whitespace-nowrap text-[9px] font-medium"
                  style={{ color: item.color ?? "#6a3cff" }}
                >
                  Esplora
                  <ArrowUpRight size={9} />
                </motion.span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

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
