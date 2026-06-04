"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useOrbitalContext } from "./orbital-context";
import { usePerformanceMode, useOrbitalConfig } from "./use-performance-mode";
import { OrbitingBadge } from "./orbiting-badge";
import type { OrbitalItem } from "./types";

function generateDecorItems(count: number, sectionId: string): OrbitalItem[] {
  const labels = ["Orbita", "Nodo", "Segmento", "Punto", "Traccia", "Eco", "Vibra", "Flusso"];
  return Array.from({ length: count }, (_, i) => ({
    id: `decor-${sectionId}-${i}`,
    title: labels[i % labels.length],
    initials: "●",
    description: "Elemento orbitale del sistema TooolVibes",
    category: "Sistema",
    href: "#",
    sectionId,
    priority: 0,
    color: "#6a3cff",
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

function useOrbitEngine(
  items: OrbitalItem[],
  configs: ReturnType<typeof useOrbitalConfig>,
  isPaused: boolean,
  profile: ReturnType<typeof usePerformanceMode>,
  activeSectionId: string | null
) {
  const positionsRef = useRef<{ x: number; y: number }[]>([]);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
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
    const cy = typeof window !== "undefined" ? window.innerHeight * (profile.isMobile ? 0.28 : 0.35) : 300;
    currentCenterRef.current = { x: cx, y: cy };
    targetCenterRef.current = { x: cx, y: cy };
  }, [profile.isMobile]);

  useEffect(() => {
    positionsRef.current = items.map(() => ({ x: currentCenterRef.current.x, y: currentCenterRef.current.y }));
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
      const cyBase = h * (profile.isMobile ? 0.28 : 0.35);

      // Mouse parallax (very subtle)
      let mx = 0;
      let my = 0;
      if (!profile.isMobile && !profile.reducedMotion) {
        mx = (mouseRef.current.x - cx) * 0.04;
        my = (mouseRef.current.y - cyBase) * 0.03;
      }

      // Breathing
      const breathX = Math.sin(t * 0.0007) * 6;
      const breathY = Math.cos(t * 0.0009) * 8;

      // Section shift lerp
      sectionShiftRef.current += (sectionShiftTargetRef.current - sectionShiftRef.current) * 0.015;

      // Build target center
      targetCenterRef.current.x = cx + mx + breathX;
      targetCenterRef.current.y = cyBase + my + breathY + sectionShiftRef.current;

      // Smooth lerp to target
      currentCenterRef.current.x += (targetCenterRef.current.x - currentCenterRef.current.x) * 0.04;
      currentCenterRef.current.y += (targetCenterRef.current.y - currentCenterRef.current.y) * 0.04;

      const ccx = currentCenterRef.current.x;
      const ccy = currentCenterRef.current.y;

      const next = items.map((_, i) => {
        if (i >= configs.length) return { x: ccx, y: ccy };
        const cfg = configs[i];
        const angle = cfg.phase + t * cfg.speed * 0.001;
        const rx = cfg.radiusX * (profile.isMobile ? 0.6 : 1);
        const ry = cfg.radiusY * (profile.isMobile ? 0.5 : 1);
        const tilt = cfg.tilt;

        const x = ccx + Math.cos(angle) * rx;
        const y = ccy + Math.sin(angle + tilt) * ry + Math.sin(angle * 0.5) * 12;
        return { x, y };
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
  }, [items, configs, isPaused, profile.isMobile, profile.reducedMotion]);

  return positions;
}

export function OrbitalLayer() {
  const { activeSectionId, getItemsForSection, isPaused, setSelectedItemId } = useOrbitalContext();
  const profile = usePerformanceMode();

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

  const configs = useOrbitalConfig(activeItems.length, profile);
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
          const pos = positions[i] ?? { x: -100, y: -100 };
          // Skip rendering if way off-screen to save perf
          if (pos.x < -60 || pos.x > window.innerWidth + 60 || pos.y < -60 || pos.y > window.innerHeight + 60) {
            return null;
          }
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
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
