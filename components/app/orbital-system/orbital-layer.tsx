"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOrbitalContext } from "./orbital-context";
import { usePerformanceMode, useOrbitalConfigForItems, getItemWeight } from "./use-performance-mode";
import { OrbitingBadge } from "./orbiting-badge";
import { OrbitalCoreNode } from "./orbital-core-node";
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

function getStaticSafeZones(w: number, h: number, sectionId: string | null, isMobile: boolean): SafeZone[] {
  const zones: SafeZone[] = [];
  // Header navbar zone
  zones.push({ x: w / 2, y: 32, w: w, h: 72, padding: 20 });
  // Mobile bottom nav zone
  if (isMobile) {
    zones.push({ x: w / 2, y: h - 38, w: w, h: 90, padding: 24 });
  }

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
    // Section-specific tighter safe zones to protect text without over-pushing
    const mobilePad = isMobile ? 56 : 44;
    const map: Record<string, SafeZone> = {
      "home-hero": { x: w / 2, y: h * 0.42, w: Math.min(640, w * 0.72), h: 280, padding: mobilePad + 8 },
      "home-routes": { x: w / 2, y: h * 0.44, w: Math.min(520, w * 0.62), h: 200, padding: mobilePad },
      "home-decision": { x: w / 2, y: h * 0.44, w: Math.min(560, w * 0.66), h: 220, padding: mobilePad },
      "home-weekly": { x: w / 2, y: h * 0.44, w: Math.min(520, w * 0.62), h: 200, padding: mobilePad },
      "home-catalog": { x: w / 2, y: h * 0.44, w: Math.min(600, w * 0.68), h: 220, padding: mobilePad },
      "archive-categories": { x: w / 2, y: h * 0.44, w: Math.min(520, w * 0.62), h: 200, padding: mobilePad },
      "archive-tools": { x: w / 2, y: h * 0.44, w: Math.min(520, w * 0.62), h: 200, padding: mobilePad },
    };
    const zone = sectionId ? map[sectionId] : undefined;
    if (zone) {
      zones.push(zone);
    } else {
      zones.push({ x: w / 2, y: h * 0.42, w: Math.min(560, w * 0.62), h: 220, padding: mobilePad });
    }
  }
  return zones;
}

function readDynamicSafeZones(): SafeZone[] {
  const zones: SafeZone[] = [];
  const shields = document.querySelectorAll<HTMLElement>("[data-orbit-shield]");
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const basePad = vw < 768 ? 52 : 36;
  shields.forEach((el) => {
    const rect = el.getBoundingClientRect();
    // Only include elements visible in viewport (with some margin)
    if (rect.bottom < -40 || rect.top > vh + 40) return;
    const priority = el.dataset.orbitShieldPriority === "high" ? 1.5 : 1.0;
    zones.push({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      w: rect.width,
      h: rect.height,
      padding: basePad * priority,
    });
  });
  return zones;
}

function applyCenterRepulsion(
  cx: number,
  cy: number,
  zones: SafeZone[],
  centerRadius: number
): { x: number; y: number } {
  let nx = cx;
  let ny = cy;
  for (const zone of zones) {
    const halfW = zone.w / 2 + zone.padding + centerRadius;
    const halfH = zone.h / 2 + zone.padding + centerRadius;
    const dx = nx - zone.x;
    const dy = ny - zone.y;
    if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
      const distX = halfW - Math.abs(dx);
      const distY = halfH - Math.abs(dy);
      // Push along the shortest axis with softer force
      const force = 0.55;
      if (distX < distY) {
        nx += dx > 0 ? distX * force + 4 : -(distX * force + 4);
      } else {
        ny += dy > 0 ? distY * force + 4 : -(distY * force + 4);
      }
    }
  }
  return { x: nx, y: ny };
}

/** Horizontal offset so large nodes orbit off-center and avoid centered text */
function getSectionOrbitOffset(sectionId: string | null, w: number): { x: number; y: number } {
  if (!sectionId) return { x: 0, y: 0 };
  const offsets: Record<string, { x: number; y: number }> = {
    "home-hero": { x: w * 0.18, y: 0 },
    "home-routes": { x: -w * 0.16, y: 0 },
    "home-decision": { x: w * 0.16, y: 0 },
    "home-weekly": { x: -w * 0.16, y: 0 },
    "home-catalog": { x: w * 0.18, y: 0 },
    "archive-categories": { x: -w * 0.14, y: 0 },
    "archive-tools": { x: w * 0.14, y: 0 },
  };
  return offsets[sectionId] ?? { x: 0, y: 0 };
}

function getNodeRadius(item: OrbitalItem, isMobile: boolean): number {
  const sizeMap: Record<string, { m: number; d: number }> = {
    sm: { m: 36, d: 44 },
    md: { m: 44, d: 56 },
    lg: { m: 52, d: 68 },
  };
  const variantMap: Record<string, { m: number; d: number }> = {
    featured: { m: 56, d: 76 },
    route: { m: 52, d: 68 },
    category: { m: 48, d: 64 },
    step: { m: 44, d: 56 },
    tool: { m: 36, d: 48 },
  };
  let s = isMobile ? 36 : 48;
  if (item.size && sizeMap[item.size]) {
    s = isMobile ? sizeMap[item.size].m : sizeMap[item.size].d;
  } else if (item.variant && variantMap[item.variant]) {
    s = isMobile ? variantMap[item.variant].m : variantMap[item.variant].d;
  }
  return s / 2;
}

function applyRepulsion(
  x: number,
  y: number,
  zones: SafeZone[],
  nodeRadius: number,
  nodeWeight: number,
  isMobile: boolean
): { x: number; y: number; inSafeZone: boolean } {
  let nx = x;
  let ny = y;
  let inSafeZone = false;
  const paddingMul = isMobile ? 1.35 : 1.0;
  for (const zone of zones) {
    const halfW = zone.w / 2 + zone.padding * paddingMul + nodeRadius * (0.5 + nodeWeight * 0.4);
    const halfH = zone.h / 2 + zone.padding * paddingMul + nodeRadius * (0.5 + nodeWeight * 0.4);
    const dx = nx - zone.x;
    const dy = ny - zone.y;
    if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
      inSafeZone = true;
      const distX = halfW - Math.abs(dx);
      const distY = halfH - Math.abs(dy);
      const force = 0.8 + nodeWeight * 0.35;
      if (distX < distY) {
        nx += dx > 0 ? distX * force + 8 : -(distX * force + 8);
      } else {
        ny += dy > 0 ? distY * force + 8 : -(distY * force + 8);
      }
    }
  }
  return { x: nx, y: ny, inSafeZone };
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

interface NodePosition {
  x: number;
  y: number;
  scale: number;
  inSafeZone: boolean;
}

function useOrbitEngine(
  items: OrbitalItem[],
  configs: OrbitConfig[],
  isPaused: boolean,
  profile: ReturnType<typeof usePerformanceMode>,
  activeSectionId: string | null,
  dynamicZonesRef: React.RefObject<SafeZone[]>
) {
  const positionsRef = useRef<NodePosition[]>([]);
  const [positions, setPositions] = useState<NodePosition[]>([]);
  const [centerState, setCenterState] = useState({ x: 0, y: 0, inSafeZone: false });
  const timeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const mouseRef = useRef({ x: 0, y: 0 });
  const currentCenterRef = useRef({ x: 0, y: 0 });
  const targetCenterRef = useRef({ x: 0, y: 0 });
  const sectionShiftRef = useRef(0);
  const sectionShiftTargetRef = useRef(0);
  const sectionOrbitOffsetRef = useRef({ x: 0, y: 0 });
  const sectionOrbitOffsetTargetRef = useRef({ x: 0, y: 0 });

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

  // Section shift + horizontal offset
  useEffect(() => {
    sectionShiftTargetRef.current = getSectionShift(activeSectionId);
    sectionOrbitOffsetTargetRef.current = getSectionOrbitOffset(activeSectionId, typeof window !== "undefined" ? window.innerWidth : 1200);
  }, [activeSectionId]);

  // Init center on mount
  useEffect(() => {
    const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 800;
    const cy = typeof window !== "undefined" ? window.innerHeight * (profile.isMobile ? 0.26 : 0.3) : 300;
    currentCenterRef.current = { x: cx, y: cy };
    targetCenterRef.current = { x: cx, y: cy };
  }, [profile.isMobile]);

  useEffect(() => {
    positionsRef.current = items.map(() => ({ x: currentCenterRef.current.x, y: currentCenterRef.current.y, scale: 1, inSafeZone: false }));
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
      sectionOrbitOffsetRef.current.x += (sectionOrbitOffsetTargetRef.current.x - sectionOrbitOffsetRef.current.x) * 0.015;
      sectionOrbitOffsetRef.current.y += (sectionOrbitOffsetTargetRef.current.y - sectionOrbitOffsetRef.current.y) * 0.015;

      // Build target center
      targetCenterRef.current.x = cx + mx + breathX + sectionOrbitOffsetRef.current.x;
      targetCenterRef.current.y = cyBase + my + breathY + sectionShiftRef.current + sectionOrbitOffsetRef.current.y;

      // Combine static + dynamic safe zones
      const staticZones = getStaticSafeZones(w, h, activeSectionId, profile.isMobile);
      const dynamicZones = dynamicZonesRef.current ?? [];
      const allZones = staticZones.concat(dynamicZones);

      // Repel the orbit center itself from text safe zones
      const centerBefore = { x: targetCenterRef.current.x, y: targetCenterRef.current.y };
      const centerRepelled = applyCenterRepulsion(
        targetCenterRef.current.x,
        targetCenterRef.current.y,
        allZones,
        profile.isMobile ? 68 : 86
      );
      targetCenterRef.current.x = centerRepelled.x;
      targetCenterRef.current.y = centerRepelled.y;
      const centerInSafeZone = Math.abs(centerBefore.x - centerRepelled.x) > 0.5 || Math.abs(centerBefore.y - centerRepelled.y) > 0.5;

      // Smooth lerp to target
      currentCenterRef.current.x += (targetCenterRef.current.x - currentCenterRef.current.x) * 0.04;
      currentCenterRef.current.y += (targetCenterRef.current.y - currentCenterRef.current.y) * 0.04;

      const ccx = currentCenterRef.current.x;
      const ccy = currentCenterRef.current.y;

      // Global scale: shrink slightly as user scrolls
      const globalScale = 1 - Math.min(0.18, scrollProgress * 0.35);

      const next = items.map((item, i) => {
        if (i >= configs.length) return { x: ccx, y: ccy, scale: globalScale, inSafeZone: false };
        const cfg = configs[i];
        const angle = cfg.phase + t * cfg.speed * 0.001;
        const rx = cfg.radiusX * (profile.isMobile ? 0.55 : 1);
        const ry = cfg.radiusY * (profile.isMobile ? 0.45 : 1) + scrollProgress * 25;
        const tilt = cfg.tilt;

        let x = ccx + Math.cos(angle) * rx;
        let y = ccy + Math.sin(angle + tilt) * ry + Math.sin(angle * 0.5) * 10;

        // Apply repulsion from safe zones (weight-based for large nodes)
        const nodeRadius = getNodeRadius(item, profile.isMobile);
        const weight = getItemWeight(item);
        const repelled = applyRepulsion(x, y, allZones, nodeRadius, weight, profile.isMobile);
        x = repelled.x;
        y = repelled.y;

        // Clamp to viewport with margin
        x = Math.max(30, Math.min(w - 30, x));
        y = Math.max(30, Math.min(h - 30, y));

        // Dim and shrink if pushed into safe zone
        const nodeScale = repelled.inSafeZone ? Math.max(0.3, globalScale * (1 - weight * 0.22)) : globalScale;

        return { x, y, scale: nodeScale, inSafeZone: repelled.inSafeZone };
      });

      positionsRef.current = next;
      setPositions(next);
      setCenterState({ x: currentCenterRef.current.x, y: currentCenterRef.current.y, inSafeZone: centerInSafeZone });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [items, configs, isPaused, profile.isMobile, profile.reducedMotion, activeSectionId, dynamicZonesRef]);

  return { positions, centerX: centerState.x, centerY: centerState.y, centerInSafeZone: centerState.inSafeZone };
}

export function OrbitalLayer() {
  const { activeSectionId, getItemsForSection, isPaused, setSelectedItemId } = useOrbitalContext();
  const profile = usePerformanceMode();
  useScrollState();

  // Dynamic safe zones from real DOM text blocks
  const dynamicZonesRef = useRef<SafeZone[]>([]);
  const lastZoneUpdateRef = useRef(0);

  useEffect(() => {
    let rafId = 0;
    const updateZones = () => {
      dynamicZonesRef.current = readDynamicSafeZones();
      lastZoneUpdateRef.current = Date.now();
    };
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastZoneUpdateRef.current > 120) {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(updateZones);
      }
    };
    window.addEventListener("scroll", throttledUpdate, { passive: true });
    updateZones();
    return () => {
      window.removeEventListener("scroll", throttledUpdate);
      cancelAnimationFrame(rafId);
    };
  }, [activeSectionId]);

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
  const { positions, centerX, centerY, centerInSafeZone } = useOrbitEngine(activeItems, configs, isPaused, profile, activeSectionId, dynamicZonesRef);

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
          const pos = positions[i] ?? { x: -100, y: -100, scale: 1, inSafeZone: false };
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
                inSafeZone={pos.inSafeZone}
                isSectionActive={activeSectionId === item.sectionId}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      <OrbitalCoreNode x={centerX} y={centerY} isMobile={profile.isMobile} inSafeZone={centerInSafeZone} />
    </div>
  );
}
