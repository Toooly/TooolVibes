"use client";

import { useEffect } from "react";

function throttle<T extends (...args: unknown[]) => void>(fn: T, ms: number) {
  let last = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

function getOverlapPercent(rect1: DOMRect, rect2: DOMRect): number {
  const xOverlap = Math.max(
    0,
    Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left)
  );
  const yOverlap = Math.max(
    0,
    Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)
  );
  const overlapArea = xOverlap * yOverlap;
  const nodeArea = rect1.width * rect1.height;
  return nodeArea > 0 ? overlapArea / nodeArea : 0;
}

/**
 * Hook che monitora la sovrapposizione tra nodi orbitali e zone di testo.
 * Quando un nodo sovrappone una text-zone per >30%, aggiunge la classe
 * `home-orbit-node--avoiding` e setta `--avoid-shift` per lo spostamento laterale.
 */
export function useTextAvoidance(containerRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const check = () => {
      const nodes = container.querySelectorAll<HTMLElement>(".catalog-orbit-node");
      const textZones = document.querySelectorAll<HTMLElement>('[data-text-zone="true"]');

      if (nodes.length === 0 || textZones.length === 0) return;

      const textRects = Array.from(textZones).map((el) => el.getBoundingClientRect());

      nodes.forEach((node) => {
        // Skip atmospheric nodes — already transparent enough
        if (node.classList.contains("home-orbit-node--atmospheric")) return;

        const nodeRect = node.getBoundingClientRect();
        let maxOverlap = 0;
        let shiftDirection = 0; // -1 = left, 1 = right

        for (const textRect of textRects) {
          const overlap = getOverlapPercent(nodeRect, textRect);
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            const viewportCenter = window.innerWidth / 2;
            const nodeCenter = nodeRect.left + nodeRect.width / 2;
            shiftDirection = nodeCenter < viewportCenter ? -1 : 1;
          }
        }

        if (maxOverlap > 0.3) {
          node.classList.add("home-orbit-node--avoiding");
          node.style.setProperty("--avoid-shift", `${shiftDirection * 40}px`);
        } else if (maxOverlap < 0.1) {
          node.classList.remove("home-orbit-node--avoiding");
          node.style.removeProperty("--avoid-shift");
        }
      });
    };

    const throttledCheck = throttle(check, 16);
    window.addEventListener("scroll", throttledCheck, { passive: true });
    window.addEventListener("resize", throttledCheck, { passive: true });

    const rafId = requestAnimationFrame(() => requestAnimationFrame(check));

    return () => {
      window.removeEventListener("scroll", throttledCheck);
      window.removeEventListener("resize", throttledCheck);
      cancelAnimationFrame(rafId);
    };
  }, [containerRef]);
}
