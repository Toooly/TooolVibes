"use client";

import { useEffect, useRef, useState } from "react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

export type UseOnceInViewOptions = {
  rootMargin?: string;
  threshold?: number;
  immediateWhenReduced?: boolean;
};

/**
 * Fires once when the element is meaningfully visible.
 * Does not reset on rerender — suitable for one-shot score/podium reveals.
 * After mount, immediately marks visible if already intersecting (avoids
 * hidden content waiting on a late IntersectionObserver callback).
 */
export function useOnceInView<T extends Element = HTMLElement>(
  options: UseOnceInViewOptions = {},
) {
  const {
    rootMargin = "0px 0px -12% 0px",
    threshold = 0.35,
    immediateWhenReduced = true,
  } = options;
  const ref = useRef<T | null>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (hasBeenVisible) return;
    if (immediateWhenReduced && reducedMotion) {
      setHasBeenVisible(true);
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setHasBeenVisible(true);
      return;
    }

    const mark = () => setHasBeenVisible(true);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          mark();
          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    observer.observe(node);

    // Synchronous first paint check after observe registration.
    const rect = node.getBoundingClientRect();
    const vh = window.innerHeight || 0;
    const vw = window.innerWidth || 0;
    const alreadyVisible =
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < vh * 0.92 &&
      rect.left < vw;
    if (alreadyVisible) {
      mark();
      observer.disconnect();
    }

    return () => observer.disconnect();
  }, [hasBeenVisible, immediateWhenReduced, reducedMotion, rootMargin, threshold]);

  return { ref, hasBeenVisible, preferReducedMotion: reducedMotion };
}
