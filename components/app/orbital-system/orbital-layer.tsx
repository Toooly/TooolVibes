"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOrbitalContext } from "./orbital-context";
import { usePerformanceMode, useOrbitalConfigForItems } from "./use-performance-mode";
import { OrbitingBadge } from "./orbiting-badge";
import type { OrbitalItem, OrbitConfig } from "./types";

function generateDecorItems(count: number, sectionId: string): OrbitalItem[] {
  const shapes: OrbitalItem["shapeType"][] = ["shard", "blob", "gem", "crystal", "hexagon"];
  return Array.from({ length: count }, (_, i) => ({
    id: `decor-${sectionId}-${i}`,
    title: "Elemento",
    initials: "●",
    description: "Elemento orbitale del sistema TooolVibes",
    category: "Sistema",
    href: "#",
    sectionId,
    priority: 0,
    color: "#6a3cff",
    shapeType: shapes[i % shapes.length],
  }));
}

function getSectionShift(sectionId: string | null): number {
  if (!sectionId) return 0;
  let hash = 0;
  for (let i = 0; i < sectionId.length; i++) {
    hash = ((hash << 5) - hash) + sectionId.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 70) - 35);
}

// ── Safe Zones ──
interface SafeZone {
  x: number;
  y: number;
  w: number;
  h: number;
  padding: number;
}

function getSafeZones(w: number, h: number, sectionId: string | null): SafeZone[] {
  const zones: SafeZone[] = [];
  // Header navbar zone
  zones.push({ x: w / 2, y: 32, w: w, h: 68, padding: 16 });
  // Text safe zone — active on all floating-UI pages to protect centered anchors
  const isMinimalSection =
    !sectionId ||
    sectionId.startsWith("home-") ||
    sectionId.startsWith("archive-") ||
    sectionId.startsWith("compare-") ||
    sectionId.startsWith("shortlist-") ||
    sectionId.startsWith("collections-") ||
    sectionId.startsWith("tool-") ||
    sectionId.startsWith("wishlist-") ||
    sectionId.startsWith("radar-");
  if (isMinimalSection) {
    zones.push({
      x: w / 2,
      y: h * 0.42,
      w: Math.min(720, w * 0.8),
      h: Math.min(480, h * 0.52),
      padding: 48,
    });
  }
  return zones;
}

function applyRepulsion(x: number, y: number, zones: SafeZone[]): { x: number; y: number } {
  let nx = x;
  let ny = y;
  for (const zone of zones) {
    const halfW = zone.w / 2 + zone.padding;
    const halfH = zone.h / 2 + zone.padding;
    const dx = nx - zone.x;
    const dy = ny - zone.y;
    if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
      const distX = halfW - Math.abs(dx);
      const distY = halfH - Math.abs(dy);
      // Push toward nearest edge
      if (distX < distY) {
        nx += dx > 0 ? distX * 0.55 + 4 : -(distX * 0.55 + 4);
      } else {
        ny += dy > 0 ? distY * 0.55 + 4 : -(distY * 0.55 + 4);
      }
    }
  }
  return { x: nx, y: ny };
}

// ── Scroll State ──
const scrollState = { y: 0, progress: 0 };
function useScrollState() {
  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        scrollState.y = window.scrollY;
        const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        scrollState.progress = Math.min(1, Math.max(0, scrollState.y / max));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);
}

function useOrbitEngine(
  items: OrbitalItem[],
  configs: OrbitConfig[],
  isPaused: boolean,
  profile: ReturnType<typeof usePerformanceMode>,
  activeSectionId: string | null
) {
  const positionsRef = useRef<{ x: number; y: number; scale: number }[]>([]);
  const [positions, setPositions] = useState<{ x: number; y: number; scale: number }[]>([]);
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const mouseRef = useRef({ x: 0, y: 0 });
  const currentCenterRef = useRef({ x: 0, y: 0 });
  const targetCenterRef = useRef({ x: 0, y: 0 });
  const sectionShiftRef = useRef(0);
  const sectionShiftTargetRef = useRef(0);

  // Mouse tracking
  useEffect(() => {
    if (profile.isMobile || profile.reducedMotion) return;
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener("mousemove", onMouseMove);
    return () => window.removeEventListener("mousemove", onMouseMove);
  }, [profile.isMobile, profile.reducedMotion]);

  // Section shift
  useEffect(() => {
    sectionShiftTargetRef.current = getSectionShift(activeSectionId);
  }, [activeSectionId]);

  // Init center on mount
  useEffect(() => {
    const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 800;
    const cy = typeof window !== "undefined" ? window.innerHeight * (profile.isMobile ? 0.26 : 0.3) : 300;
    currentCenterRef.current = { x: cx, y: cy };
    targetCenterRef.current = { x: cx, y: cy };
  }, [profile.isMobile]);

  useEffect(() => {
    positionsRef.current = items.map(() => ({ x: currentCenterRef.current.x, y: currentCenterRef.current.y, scale: 1 }));
    setPositions(positionsRef.current);
  }, [items]);

  useEffect(() => {
    let running = true;

    const tick = (now: number) => {
      if (!running) return;
      if (document.hidden) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTimeRef.current === 0) lastTimeRef.current = now;
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (!isPaused) {
        timeRef.current += delta;
      } else {
        timeRef.current += delta * 0.05;
      }

      const t = timeRef.current;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const scrollY = scrollState.y;
      const scrollProgress = scrollState.progress;

      // Base center Y: start higher (avoid hero text), drift down with scroll
      const cyBase = h * (profile.isMobile ? 0.26 : 0.3) + scrollY * 0.12;

      // Mouse parallax (subtle)
      let mx = 0;
      let my = 0;
      if (!profile.isMobile && !profile.reducedMotion) {
        mx = (mouseRef.current.x - cx) * 0.035;
        my = (mouseRef.current.y - cyBase) * 0.025;
      }

      // Breathing
      const breathX = Math.sin(t * 0.0006) * 5;
      const breathY = Math.cos(t * 0.0008) * 7;

      // Section shift lerp
      sectionShiftRef.current += (sectionShiftTargetRef.current - sectionShiftRef.current) * 0.012;

      // Build target center
      targetCenterRef.current.x = cx + mx + breathX;
      targetCenterRef.current.y = cyBase + my + breathY + sectionShiftRef.current;

      // Smooth lerp to target
      currentCenterRef.current.x += (targetCenterRef.current.x - currentCenterRef.current.x) * 0.04;
      currentCenterRef.current.y += (targetCenterRef.current.y - currentCenterRef.current.y) * 0.04;

      const ccx = currentCenterRef.current.x;
      const ccy = currentCenterRef.current.y;

      // Global scale: shrink slightly as user scrolls
      const globalScale = 1 - Math.min(0.18, scrollProgress * 0.35);

      // Safe zones
      const zones = getSafeZones(w, h, activeSectionId);

      const next = items.map((_, i) => {
        if (i >= configs.length) return { x: ccx, y: ccy, scale: globalScale };
        const cfg = configs[i];
        const angle = cfg.phase + t * cfg.speed * 0.001;
        const rx = cfg.radiusX * (profile.isMobile ? 0.55 : 1);
        const ry = cfg.radiusY * (profile.isMobile ? 0.45 : 1) + scrollProgress * 25;
        const tilt = cfg.tilt;

        let x = ccx + Math.cos(angle) * rx;
        let y = ccy + Math.sin(angle + tilt) * ry + Math.sin(angle * 0.5) * 10;

        // Apply repulsion from safe zones
        const repelled = applyRepulsion(x, y, zones);
        x = repelled.x;
        y = repelled.y;

        // Clamp to viewport with margin
        x = Math.max(30, Math.min(w - 30, x));
        y = Math.max(30, Math.min(h - 30, y));

        return { x, y, scale: globalScale };
      });

      positionsRef.current = next;
      setPositions(next);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [items, configs, isPaused, profile.isMobile, profile.reducedMotion, activeSectionId]);

  return positions;
}

export function OrbitalLayer() {
  const { activeSectionId, getItemsForSection, isPaused, setSelectedItemId } = useOrbitalContext();
  const profile = usePerformanceMode();
  useScrollState();

  // Calcola gli item attivi in base alla sezione
  const activeItems = useMemo<OrbitalItem[]>(() => {
    if (!activeSectionId) {
      return generateDecorItems(Math.min(5, profile.maxItems), "decor-default");
    }
    const items = getItemsForSection(activeSectionId);
    if (items.length === 0) {
      return generateDecorItems(Math.min(5, profile.maxItems), activeSectionId);
    }
    return items.slice(0, profile.maxItems);
  }, [activeSectionId, getItemsForSection, profile.maxItems]);

  const configs = useOrbitalConfigForItems(activeItems, profile);
  const positions = useOrbitEngine(activeItems, configs, isPaused, profile, activeSectionId);

  // Click outside per chiudere il popover su mobile
  const layerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (layerRef.current && !layerRef.current.contains(target)) {
        setSelectedItemId(null);
      }
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("touchend", onDocClick);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("touchend", onDocClick);
    };
  }, [setSelectedItemId]);

  if (!profile.enableGlow && profile.reducedMotion && activeItems.length === 0) {
    return null;
  }

  return (
    <div
      ref={layerRef}
      className="fixed inset-0 z-[15] pointer-events-none"
      aria-hidden="false"
    >
      <AnimatePresence mode="popLayout">
        {activeItems.map((item, i) => {
          const pos = positions[i] ?? { x: -100, y: -100, scale: 1 };
          // Skip rendering if way off-screen to save perf
          if (pos.x < -80 || pos.x > window.innerWidth + 80 || pos.y < -80 || pos.y > window.innerHeight + 80) {
            return null;
          }
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.5 * pos.scale }}
              animate={{ opacity: 1, scale: pos.scale }}
              exit={{ opacity: 0, scale: 0.5 * pos.scale }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              layout
              className="pointer-events-auto"
            >
              <OrbitingBadge
                item={item}
                x={pos.x}
                y={pos.y}
                index={i}
                isMobile={profile.isMobile}
                enableGlow={profile.enableGlow}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
