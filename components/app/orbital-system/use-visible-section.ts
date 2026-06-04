"use client";

import { useEffect, useRef } from "react";
import { useOrbitalContext } from "./orbital-context";

export function useVisibleSection(
  sectionId: string,
  enabled = true
) {
  const { setActiveSectionId } = useOrbitalContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    const el = ref.current;
    let isVisible = false;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible && !isVisible) {
          isVisible = true;
          setActiveSectionId(sectionId);
        } else if (!nowVisible && isVisible) {
          isVisible = false;
        }
      },
      { threshold: 0.25, rootMargin: "-80px 0px -40% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionId, enabled, setActiveSectionId]);

  return ref;
}
