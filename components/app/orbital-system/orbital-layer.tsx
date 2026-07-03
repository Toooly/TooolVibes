"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { useOrbitalContext } from "./orbital-context";
import { usePerformanceMode, useOrbitalConfigForItems, getItemWeight } from "./use-performance-mode";
import { OrbitingBadge } from "./orbiting-badge";
import { OrbitalCoreNode } from "./orbital-core-node";
import type { OrbitalItem, OrbitConfig } from "./types";
import { useMobileUIStore } from "@/lib/stores/mobile-ui-store";

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
  priority?: number;
}

function getStaticSafeZones(w: number, h: number, sectionId: string | null, isMobile: boolean): SafeZone[] {
  const zones: SafeZone[] = [];
  // Header navbar zone
  zones.push({ x: w / 2, y: 32, w: w, h: 72, padding: 0, priority: 0.65 });
  // Mobile bottom nav zone
  if (isMobile) {
    zones.push({ x: w / 2, y: h - 42, w: w, h: 104, padding: 22, priority: 1.2 });
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
      "home-hero": { x: w / 2, y: h * 0.42, w: Math.min(680, w * 0.82), h: 300, padding: mobilePad + 18, priority: 1.35 },
      "home-routes": { x: w / 2, y: h * 0.45, w: Math.min(560, w * 0.78), h: 230, padding: mobilePad + 10, priority: 1.3 },
      "home-decision": { x: w / 2, y: h * 0.45, w: Math.min(590, w * 0.78), h: 240, padding: mobilePad + 10, priority: 1.25 },
      "home-weekly": { x: w / 2, y: h * 0.45, w: Math.min(560, w * 0.78), h: 230, padding: mobilePad + 10, priority: 1.3 },
      "home-catalog": { x: w / 2, y: h * 0.45, w: Math.min(620, w * 0.8), h: 240, padding: mobilePad + 10, priority: 1.25 },
      "archive-categories": { x: w / 2, y: h * 0.44, w: Math.min(560, w * 0.72), h: 220, padding: mobilePad, priority: 1.15 },
      "archive-tools": { x: w / 2, y: h * 0.44, w: Math.min(560, w * 0.72), h: 220, padding: mobilePad, priority: 1.15 },
    };
    const zone = sectionId ? map[sectionId] : undefined;
    if (zone) {
      zones.push(zone);
    } else {
      zones.push({ x: w / 2, y: h * 0.42, w: Math.min(580, w * 0.72), h: 230, padding: mobilePad, priority: 1.1 });
    }
  }
  return zones;
}

function readDynamicSafeZones(): SafeZone[] {
  const zones: SafeZone[] = [];
  const shields = document.querySelectorAll<HTMLElement>("[data-orbit-shield]");
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const basePad = vw < 768 ? 66 : 42;
  shields.forEach((el) => {
    const rect = el.getBoundingClientRect();
    // Only include elements visible in viewport (with some margin)
    if (rect.bottom < -40 || rect.top > vh + 40) return;
    const priority = el.dataset.orbitShieldPriority === "high" ? 1.65 : 1.0;
    zones.push({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      w: rect.width,
      h: rect.height,
      padding: basePad * priority,
      priority,
    });
  });
  return zones;
}

function applyCenterRepulsion(
  cx: number,
  cy: number,
  zones: SafeZone[],
  centerRadius: number,
  viewportW: number,
  viewportH: number,
  isMobile: boolean
): { x: number; y: number; inSafeZone: boolean } {
  let nx = cx;
  let ny = cy;
  let inSafeZone = false;
  const topLimit = isMobile ? 118 : 82;
  const bottomLimit = viewportH - (isMobile ? 128 : 72);
  const sideLimit = isMobile ? 42 : 56;

  for (let pass = 0; pass < 3; pass++) {
    for (const zone of zones) {
      const halfW = zone.w / 2 + zone.padding + centerRadius;
      const halfH = zone.h / 2 + zone.padding + centerRadius;
      const dx = nx - zone.x;
      const dy = ny - zone.y;
      if (Math.abs(dx) < halfW && Math.abs(dy) < halfH) {
        inSafeZone = true;
        const distX = halfW - Math.abs(dx);
        const distY = halfH - Math.abs(dy);
        const priority = zone.priority ?? 1;
        const force = 0.92 * priority;
        const fullWidthTextZone = isMobile && zone.w > viewportW * 0.72 && zone.y < viewportH * 0.58;
        const centeredTextZone = Math.abs(zone.x - viewportW / 2) < viewportW * 0.18 && zone.w > viewportW * 0.42;
        const verticalEscapeIsTight = isMobile && zone.y > topLimit + 96 && zone.y < bottomLimit - 88;
        const topCrowdedLabel = isMobile && centeredTextZone && zone.y < topLimit + 120;

        if (fullWidthTextZone) {
          if (zone.y < topLimit + 120) {
            ny = Math.max(ny, zone.y + halfH + 12);
          } else {
            ny = Math.min(ny, zone.y - halfH - 12);
          }
        } else if (distX < distY || (centeredTextZone && (verticalEscapeIsTight || topCrowdedLabel))) {
          const dir = dx === 0 ? (zone.x > viewportW / 2 ? -1 : 1) : Math.sign(dx);
          nx += dir * (distX * force + 10);
        } else {
          const preferUp = zone.y > viewportH * 0.38 || ny > zone.y;
          const dir = dy === 0 ? (preferUp ? -1 : 1) : Math.sign(dy);
          ny += dir * (distY * force + 10);
        }
      }
    }
    nx = Math.max(sideLimit, Math.min(viewportW - sideLimit, nx));
    ny = Math.max(topLimit, Math.min(bottomLimit, ny));
  }

  return { x: nx, y: ny, inSafeZone };
}

/** Horizontal offset so large nodes orbit off-center and avoid centered text */
function getSectionOrbitOffset(sectionId: string | null, w: number): { x: number; y: number } {
  if (!sectionId) return { x: 0, y: 0 };
  const offsets: Record<string, { x: number; y: number }> = {
    "home-hero": { x: w * 0.2, y: -12 },
    "home-routes": { x: -w * 0.2, y: -8 },
    "home-decision": { x: w * 0.2, y: -6 },
    "home-weekly": { x: -w * 0.18, y: -8 },
    "home-catalog": { x: w * 0.2, y: -8 },
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
  const lastDynamicZoneReadRef = useRef(0);

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
    if (items.length === 0 || document.hidden) {
      setPositions([]);
      return undefined;
    }

    let running = true;

    const tick = (now: number) => {
      if (!running) return;
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
      const isNarrowViewport = profile.isMobile || w < 768;
      const cx = w / 2;
      const scrollProgress = scrollState.progress;

      // The layer is fixed in the viewport: section changes and scroll progress
      // guide the core, while collision zones keep it out of readable copy.
      const cyBase =
        h * (isNarrowViewport ? 0.28 : 0.32) +
        Math.sin(scrollProgress * Math.PI * 2) * (isNarrowViewport ? 18 : 28);

      // Mouse parallax (subtle)
      let mx = 0;
      let my = 0;
      if (!isNarrowViewport && !profile.reducedMotion) {
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
      const staticZones = getStaticSafeZones(w, h, activeSectionId, isNarrowViewport);
      if (now - lastDynamicZoneReadRef.current > 140) {
        dynamicZonesRef.current = readDynamicSafeZones();
        lastDynamicZoneReadRef.current = now;
      }
      const dynamicZones = dynamicZonesRef.current ?? [];
      const allZones = staticZones.concat(dynamicZones);

      // Repel the orbit center itself from text safe zones
      const centerBefore = { x: targetCenterRef.current.x, y: targetCenterRef.current.y };
      const centerRepelled = applyCenterRepulsion(
        targetCenterRef.current.x,
        targetCenterRef.current.y,
        allZones,
        isNarrowViewport ? 74 : 92,
        w,
        h,
        isNarrowViewport
      );
      targetCenterRef.current.x = centerRepelled.x;
      targetCenterRef.current.y = centerRepelled.y;
      const centerInSafeZone = centerRepelled.inSafeZone || Math.abs(centerBefore.x - centerRepelled.x) > 0.5 || Math.abs(centerBefore.y - centerRepelled.y) > 0.5;

      // Smooth lerp to target
      const centerEase = profile.reducedMotion ? 1 : isNarrowViewport ? 0.11 : 0.085;
      currentCenterRef.current.x += (targetCenterRef.current.x - currentCenterRef.current.x) * centerEase;
      currentCenterRef.current.y += (targetCenterRef.current.y - currentCenterRef.current.y) * centerEase;

      const currentRepelled = applyCenterRepulsion(
        currentCenterRef.current.x,
        currentCenterRef.current.y,
        allZones,
        isNarrowViewport ? 74 : 92,
        w,
        h,
        isNarrowViewport
      );
      if (currentRepelled.inSafeZone) {
        const correctionEase = profile.reducedMotion ? 1 : isNarrowViewport ? 0.72 : 0.58;
        currentCenterRef.current.x += (currentRepelled.x - currentCenterRef.current.x) * correctionEase;
        currentCenterRef.current.y += (currentRepelled.y - currentCenterRef.current.y) * correctionEase;
      }

      currentCenterRef.current.x = Math.max(isNarrowViewport ? 42 : 56, Math.min(w - (isNarrowViewport ? 42 : 56), currentCenterRef.current.x));
      currentCenterRef.current.y = Math.max(isNarrowViewport ? 118 : 82, Math.min(h - (isNarrowViewport ? 128 : 72), currentCenterRef.current.y));

      const ccx = currentCenterRef.current.x;
      const ccy = currentCenterRef.current.y;
      const nodeZones = allZones.concat({
        x: ccx,
        y: ccy,
        w: (isNarrowViewport ? 92 : 112),
        h: (isNarrowViewport ? 92 : 112),
        padding: isNarrowViewport ? 34 : 28,
        priority: 1.2,
      });

      // Global scale: shrink slightly as user scrolls
      const globalScale = 1 - Math.min(0.18, scrollProgress * 0.35);

      let next = items.map((item, i) => {
        if (i >= configs.length) return { x: ccx, y: ccy, scale: globalScale, inSafeZone: false };
        const cfg = configs[i];
        const angle = cfg.phase + t * cfg.speed * 0.001;
        const rx = cfg.radiusX * (isNarrowViewport ? 0.55 : 1);
        const ry = cfg.radiusY * (isNarrowViewport ? 0.45 : 1) + scrollProgress * 25;
        const tilt = cfg.tilt;

        let x = ccx + Math.cos(angle) * rx;
        let y = ccy + Math.sin(angle + tilt) * ry + Math.sin(angle * 0.5) * 10;

        // Apply repulsion from safe zones (weight-based for large nodes)
        const nodeRadius = getNodeRadius(item, isNarrowViewport);
        const weight = getItemWeight(item);
        const repelled = applyRepulsion(x, y, nodeZones, nodeRadius, weight, isNarrowViewport);
        x = repelled.x;
        y = repelled.y;

        // Clamp to viewport with margin
        const nodeMargin = Math.max(34, nodeRadius + (isNarrowViewport ? 42 : 28));
        const nodeTopMargin = Math.max(nodeMargin, isNarrowViewport ? 126 : 72);
        const nodeBottomMargin = Math.max(nodeMargin, isNarrowViewport ? 126 : 72);
        x = Math.max(nodeMargin, Math.min(w - nodeMargin, x));
        y = Math.max(nodeTopMargin, Math.min(h - nodeBottomMargin, y));

        // Dim and shrink if pushed into safe zone
        const nodeScale = repelled.inSafeZone ? Math.max(0.3, globalScale * (1 - weight * 0.22)) : globalScale;

        return { x, y, scale: nodeScale, inSafeZone: repelled.inSafeZone };
      });

      for (let pass = 0; pass < 2; pass++) {
        next = next.map((pos) => ({ ...pos }));
        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];
            const ar = getNodeRadius(items[i], isNarrowViewport);
            const br = getNodeRadius(items[j], isNarrowViewport);
            const minDist = ar + br + (isNarrowViewport ? 58 : 34);
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.max(1, Math.hypot(dx, dy));
            if (dist >= minDist) continue;

            const push = (minDist - dist) / 2;
            const ux = dx / dist;
            const uy = dy / dist;
            a.x -= ux * push;
            a.y -= uy * push;
            b.x += ux * push;
            b.y += uy * push;
          }
        }

        next = next.map((pos, i) => {
          const radius = getNodeRadius(items[i], isNarrowViewport);
          const margin = Math.max(34, radius + (isNarrowViewport ? 42 : 28));
          const topMargin = Math.max(margin, isNarrowViewport ? 126 : 72);
          const bottomMargin = Math.max(margin, isNarrowViewport ? 126 : 72);
          return {
            ...pos,
            x: Math.max(margin, Math.min(w - margin, pos.x)),
            y: Math.max(topMargin, Math.min(h - bottomMargin, pos.y)),
          };
        });
      }

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
  const pathname = usePathname();
  const profile = usePerformanceMode();
  const [hasMounted, setHasMounted] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const isMobileOriginPage =
    pathname === "/" ||
    pathname?.startsWith("/archivio") ||
    pathname?.startsWith("/compare") ||
    pathname?.startsWith("/shortlist") ||
    pathname?.startsWith("/radar") ||
    pathname?.startsWith("/product-hunt") ||
    pathname?.startsWith("/collections") ||
    pathname?.startsWith("/wishlist");
  const isToolDetailPage = pathname?.startsWith("/toools/");
  const textPages = ["/chi-siamo", "/community", "/shop", "/privacy", "/termini", "/metodo"];
  const isTextPage = textPages.some((p) => pathname === p || pathname?.startsWith(`${p}/`));
  const hideFloatingLayer =
    isMobileOriginPage ||
    isToolDetailPage;
  const hideCoreNode =
    isMobileOriginPage ||
    isToolDetailPage;
  useScrollState();

  useEffect(() => {
    setHasMounted(true);
    const update = () => setIsCompactViewport(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    const updateVisibility = () => setPageHidden(document.hidden);
    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);
    return () => document.removeEventListener("visibilitychange", updateVisibility);
  }, []);

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
    window.addEventListener("resize", throttledUpdate, { passive: true });
    updateZones();
    return () => {
      window.removeEventListener("scroll", throttledUpdate);
      window.removeEventListener("resize", throttledUpdate);
      cancelAnimationFrame(rafId);
    };
  }, [activeSectionId]);

  // Calcola gli item attivi in base alla sezione
  const activeItems = useMemo<OrbitalItem[]>(() => {
    if (!activeSectionId) {
      return [];
    }
    const items = getItemsForSection(activeSectionId);
    if (items.length === 0) {
      return [];
    }
    return items.slice(0, profile.maxItems);
  }, [activeSectionId, getItemsForSection, profile.maxItems]);

  const configs = useOrbitalConfigForItems(activeItems, profile);
  const { positions, centerX, centerY, centerInSafeZone } = useOrbitEngine(activeItems, configs, isPaused || pageHidden, profile, activeSectionId, dynamicZonesRef);
  const layerIsMobile = profile.isMobile || isCompactViewport;
  const isOverlayOpen = useMobileUIStore((s) => s.isOverlayOpen);

  // Click outside per chiudere il popover su mobile
  const layerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Element;
      if (layerRef.current && !layerRef.current.contains(target)) {
        const isNavTap = target.closest?.("nav, header, [role=\"dialog\"], [role=\"button\"], .mobile-bottom-motion, .mobile-radar-view__sheet, .mobile-shortlist-board__sheet");
        if (isNavTap) return;
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

  if (!hasMounted || hideFloatingLayer || (layerIsMobile && isTextPage) || (!profile.enableGlow && profile.reducedMotion && activeItems.length === 0)) {
    return null;
  }

  return (
    <div
      ref={layerRef}
      className="fixed inset-0 z-[15] pointer-events-none"
      style={{ opacity: isOverlayOpen ? 0 : 1, transition: "opacity 300ms ease" }}
      aria-hidden="false"
    >
      <AnimatePresence mode="popLayout">
        {activeItems.map((item, i) => {
          const pos = positions[i] ?? { x: -100, y: -100, scale: 1, inSafeZone: false };
          // Skip rendering if way off-screen to save perf
          if (typeof window !== 'undefined' && (pos.x < -80 || pos.x > window.innerWidth + 80 || pos.y < -80 || pos.y > window.innerHeight + 80)) {
            return null;
          }
          return (
            <OrbitingBadge
              key={item.id}
              item={item}
              x={pos.x}
              y={pos.y}
              index={i}
              isMobile={layerIsMobile}
              enableGlow={profile.enableGlow}
              inSafeZone={pos.inSafeZone}
              isSectionActive={activeSectionId === item.sectionId}
            />
          );
        })}
      </AnimatePresence>
      {!hideCoreNode && (
        <OrbitalCoreNode x={centerX} y={centerY} isMobile={layerIsMobile} inSafeZone={centerInSafeZone} />
      )}
    </div>
  );
}
