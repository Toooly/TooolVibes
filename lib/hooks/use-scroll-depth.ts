"use client";

import { useEffect, useRef } from "react";

export interface ScrollDepthState {
  scrollY: number;
  scrollProgress: number; // 0 to 1
  scrollMax: number;
  velocity: number; // pixels per frame
  direction: "up" | "down" | "idle";
}

export function useScrollDepth(callback?: (state: ScrollDepthState) => void) {
  const stateRef = useRef<ScrollDepthState>({
    scrollY: 0,
    scrollProgress: 0,
    scrollMax: 0,
    velocity: 0,
    direction: "idle",
  });

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let lastTime = performance.now();
    let rafId: number;

    const update = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime);
      const scrollY = window.scrollY;
      const scrollMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const scrollProgress = Math.min(1, Math.max(0, scrollY / scrollMax));
      const delta = scrollY - lastScrollY;
      const velocity = (delta / dt) * 16; // normalize to ~60fps
      const direction = delta > 0.5 ? "down" : delta < -0.5 ? "up" : "idle";

      stateRef.current = {
        scrollY,
        scrollProgress,
        scrollMax,
        velocity,
        direction,
      };

      callback?.(stateRef.current);

      lastScrollY = scrollY;
      lastTime = now;
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [callback]);

  return stateRef;
}
