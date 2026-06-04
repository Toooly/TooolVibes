"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useOrbitalContext } from "./orbital-context";
import type { OrbitalItem } from "./types";

interface SectionOrbitProviderProps {
  sectionId: string;
  label: string;
  items: OrbitalItem[];
  children: ReactNode;
  className?: string;
  enabled?: boolean;
}

export function SectionOrbitProvider({
  sectionId,
  label,
  items,
  children,
  className,
  enabled = true,
}: SectionOrbitProviderProps) {
  const { registerSection, unregisterSection, setActiveSectionId } = useOrbitalContext();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    registerSection({ id: sectionId, label, items });
    return () => unregisterSection(sectionId);
  }, [sectionId, label, items, enabled, registerSection, unregisterSection]);

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
      { threshold: 0.2, rootMargin: "-80px 0px -35% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [sectionId, enabled, setActiveSectionId]);

  return (
    <div ref={ref} className={className} data-orbit-section={sectionId}>
      {children}
    </div>
  );
}
