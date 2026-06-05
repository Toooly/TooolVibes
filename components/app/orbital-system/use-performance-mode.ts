"use client";

import { useEffect, useState, useMemo } from "react";
import type { OrbitalItem } from "./types";

export interface PerformanceProfile {
  isMobile: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  lowEnd: boolean;
  maxItems: number;
  orbitSpeed: number;
  enableGlow: boolean;
  dpr: number;
}

function detectProfile(): PerformanceProfile {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      reducedMotion: false,
      saveData: false,
      lowEnd: false,
      maxItems: 6,
      orbitSpeed: 1,
      enableGlow: true,
      dpr: 1,
    };
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 1024;
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  const saveData = Boolean(nav.connection?.saveData);
  const memory = nav.deviceMemory;
  const lowEnd = isMobile || saveData || (typeof memory === "number" && memory < 4);

  if (reducedMotion) {
    return { isMobile, reducedMotion, saveData, lowEnd, maxItems: 3, orbitSpeed: 0.15, enableGlow: false, dpr: 1 };
  }
  if (lowEnd) {
    return { isMobile, reducedMotion, saveData, lowEnd, maxItems: 4, orbitSpeed: 0.4, enableGlow: false, dpr: 1 };
  }
  if (isMobile) {
    return { isMobile, reducedMotion, saveData, lowEnd, maxItems: 5, orbitSpeed: 0.6, enableGlow: true, dpr: 1 };
  }
  return { isMobile, reducedMotion, saveData, lowEnd, maxItems: 8, orbitSpeed: 1, enableGlow: true, dpr: Math.min(1.5, window.devicePixelRatio) };
}

export function usePerformanceMode(): PerformanceProfile {
  const [profile, setProfile] = useState<PerformanceProfile>(detectProfile);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setProfile(detectProfile());
    mq.addEventListener("change", onChange);
    window.addEventListener("resize", onChange);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("resize", onChange);
    };
  }, []);

  return profile;
}

function getItemWeight(item: OrbitalItem): number {
  switch (item.variant) {
    case "featured":
      return 3;
    case "route":
    case "category":
      return 2;
    case "step":
      return 1;
    default:
      return 0;
  }
}

export function useOrbitalConfig(itemCount: number, profile: PerformanceProfile) {
  return useMemo(() => {
    const count = Math.min(itemCount, profile.maxItems);
    const configs = Array.from({ length: count }, (_, i) => {
      const tier = i % 3;
      return {
        radiusX: 260 + tier * 80,
        radiusY: 120 + tier * 40,
        speed: (0.00025 + tier * 0.00008) * profile.orbitSpeed,
        phase: (i / Math.max(1, count)) * Math.PI * 2 + (i * 1.3),
        tilt: tier === 0 ? 0 : tier === 1 ? 0.15 : -0.1,
      };
    });
    return configs;
  }, [itemCount, profile.maxItems, profile.orbitSpeed]);
}

/** Item-aware orbital config: larger nodes get wider, slower orbits */
export function useOrbitalConfigForItems(items: OrbitalItem[], profile: PerformanceProfile) {
  return useMemo(() => {
    const count = Math.min(items.length, profile.maxItems);
    if (count === 0) return [];

    // Sort by weight desc so heavy nodes get outer orbits
    const indexed = items.slice(0, count).map((item, originalIndex) => ({
      item,
      originalIndex,
      weight: getItemWeight(item),
    }));
    const sorted = [...indexed].sort((a, b) => b.weight - a.weight);

    const built = sorted.map(({ item }, i) => {
      const tier = i % 3;
      const isLarge = item.variant === "featured" || item.variant === "route" || item.variant === "category";
      return {
        radiusX: (isLarge ? 300 : 240) + tier * 90,
        radiusY: (isLarge ? 135 : 110) + tier * 45,
        speed: (0.0002 + tier * 0.00007) * profile.orbitSpeed,
        phase: (i / Math.max(1, count)) * Math.PI * 2 + (i * 1.3),
        tilt: tier === 0 ? 0 : tier === 1 ? 0.15 : -0.1,
      };
    });

    // Restore original order so each item gets its config by index
    const result = new Array(count);
    sorted.forEach(({ originalIndex }, i) => {
      result[originalIndex] = built[i];
    });
    return result;
  }, [items, profile.maxItems, profile.orbitSpeed]);
}
