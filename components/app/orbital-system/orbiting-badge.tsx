"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowUpRight,
  Compass,
  Radar,
  Boxes,
  Search,
  GitCompare,
  Bookmark,
  Star,
  Sparkles,
  Zap,
  Code,
  Layers,
  Database,
  Cpu,
  Palette,
  FileText,
  Globe,
  Image,
  PenTool,
  Split,
  ListChecks,
  Heart,
} from "lucide-react";
import type { OrbitalItem, OrbitalNodeVariant } from "./types";
import { ToolPreviewPopover } from "./tool-preview-popover";
import { useOrbitalContext } from "./orbital-context";
import { OrbitalShape } from "./orbital-shapes";

const LUCIDE_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Compass,
  Radar,
  Boxes,
  Search,
  GitCompare,
  Bookmark,
  Star,
  Sparkles,
  Zap,
  Code,
  Layers,
  Database,
  Cpu,
  Palette,
  FileText,
  Globe,
  Image,
  PenTool,
  Split,
  ListChecks,
  Heart,
};

interface OrbitingBadgeProps {
  item: OrbitalItem;
  x: number;
  y: number;
  index: number;
  isMobile: boolean;
  enableGlow: boolean;
  inSafeZone?: boolean;
  isSectionActive?: boolean;
}

const VARIANT_SIZE: Record<OrbitalNodeVariant, { mobile: number; desktop: number }> = {
  featured: { mobile: 56, desktop: 76 },
  route: { mobile: 52, desktop: 68 },
  category: { mobile: 48, desktop: 64 },
  step: { mobile: 44, desktop: 56 },
  tool: { mobile: 36, desktop: 48 },
};

const SIZE_MAP: Record<string, { mobile: number; desktop: number }> = {
  sm: { mobile: 36, desktop: 44 },
  md: { mobile: 44, desktop: 56 },
  lg: { mobile: 52, desktop: 68 },
};

function getBaseSize(item: OrbitalItem, isMobile: boolean): number {
  if (item.size && SIZE_MAP[item.size]) {
    return isMobile ? SIZE_MAP[item.size].mobile : SIZE_MAP[item.size].desktop;
  }
  if (item.variant && VARIANT_SIZE[item.variant]) {
    return isMobile ? VARIANT_SIZE[item.variant].mobile : VARIANT_SIZE[item.variant].desktop;
  }
  return isMobile ? 36 : 48;
}

function getNodeLabelMode(variant?: OrbitalNodeVariant): "always" | "hover" | "never" {
  switch (variant) {
    case "route":
    case "featured":
    case "category":
      return "always";
    case "step":
      return "always";
    default:
      return "hover";
  }
}

export function OrbitingBadge({
  item,
  x,
  y,
  index,
  isMobile,
  enableGlow,
  inSafeZone = false,
  isSectionActive = false,
}: OrbitingBadgeProps) {
  const { hoveredItemId, setHoveredItemId, selectedItemId, setSelectedItemId, setIsPaused } = useOrbitalContext();
  const [isHovered, setIsHovered] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPos, setPopoverPos] = useState<"top" | "bottom" | "left" | "right">("bottom");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const badgeRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number>(0);

  const isActive = hoveredItemId === item.id || selectedItemId === item.id;
  const isRealTool = item.href !== "#";
  const labelMode = getNodeLabelMode(item.variant);
  const shouldShowLabel = labelMode === "always" || isActive || isHovered;
  const baseSize = getBaseSize(item, isMobile);
  const size = isActive ? baseSize + 6 : isSectionActive ? baseSize + 4 : baseSize;

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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isMobile || !badgeRef.current) return;
      const rect = badgeRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      setTilt({ x: dy * -8, y: dx * 8 });
    },
    [isMobile]
  );

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
      } else {
        // Desktop: direct navigation so categories/routes/tools are actually clickable
        if (isRealTool) {
          window.location.href = item.href;
        }
      }
    },
    [isMobile, item.id, item.href, selectedItemId, setSelectedItemId, updatePopoverPos, isRealTool]
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

  const iconSize = Math.max(14, Math.floor(size * 0.35));
  const IconComponent = item.iconName ? LUCIDE_ICON_MAP[item.iconName] : null;
  const shouldDim = inSafeZone && !isActive && !isHovered;

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
        opacity: shouldDim ? 0.3 : 1,
        filter: shouldDim ? "blur(3px)" : "none",
      }}
      animate={{
        scale: isActive ? 1.22 : isSectionActive ? 1.15 : isHovered ? 1.12 : 1,
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
            opacity: isActive ? 0.45 : isSectionActive ? 0.25 : 0,
            scale: isActive ? 1.7 : isSectionActive ? 1.5 : 1.2,
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
        iconUrl={IconComponent ? undefined : item.iconUrl}
        initials={IconComponent ? undefined : item.initials}
      />

      {/* Center icon overlay for route/step/featured/category variants */}
      {IconComponent && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <IconComponent size={iconSize} className="text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]" />
        </div>
      )}

      {/* Micro badge */}
      {item.badge && (isActive || isHovered || labelMode === "always") && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none absolute -right-1 -top-1 z-30 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white"
          style={{
            background: item.color ?? "#6a3cff",
            boxShadow: `0 2px 6px ${item.color ?? "#6a3cff"}40`,
          }}
        >
          {item.badge}
        </motion.div>
      )}

      {/* Label */}
      <div className="absolute left-1/2 top-full mt-2.5 -translate-x-1/2">
        <AnimatePresence>
          {shouldShowLabel && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: isActive || isHovered ? 1 : labelMode === "always" ? 0.9 : 0.75, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center gap-1"
            >
              <span
                className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xl"
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${item.color ?? "#6a3cff"}45, rgba(18,13,47,0.85))`
                    : "rgba(18,13,47,0.78)",
                  boxShadow: isActive ? `0 2px 14px ${item.color ?? "#6a3cff"}30` : "0 2px 10px rgba(0,0,0,0.2)",
                  border: `1px solid ${isActive ? `${item.color ?? "#6a3cff"}50` : "rgba(255,255,255,0.08)"}`,
                  textShadow: "0 1px 2px rgba(0,0,0,0.35)",
                }}
              >
                {item.title}
              </span>

              {/* Meta line */}
              {item.meta && (isActive || isHovered || (labelMode === "always" && isSectionActive)) && (
                <motion.span
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 3 }}
                  transition={{ delay: 0.06, duration: 0.15 }}
                  className="whitespace-nowrap text-[10px] font-medium text-white/70"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.35)" }}
                >
                  {item.meta}
                </motion.span>
              )}

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
