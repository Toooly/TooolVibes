"use client";

import { useEffect, useRef } from "react";

import {
  emitCollectionOpened,
  emitCollectionProgressed,
} from "@/lib/signal-progression/client";

export function CollectionSignalTracker({
  slug,
  stepCount,
}: {
  slug: string;
  stepCount: number;
}) {
  const opened = useRef(false);
  const seenSteps = useRef(new Set<number>());

  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    emitCollectionOpened(slug);
  }, [slug]);

  useEffect(() => {
    if (typeof window === "undefined" || stepCount < 1) return;
    const nodes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-collection-step]"),
    );
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const raw = entry.target.getAttribute("data-collection-step");
          const step = raw ? Number(raw) : NaN;
          if (!Number.isInteger(step) || step < 1) continue;
          if (seenSteps.current.has(step)) continue;
          seenSteps.current.add(step);
          emitCollectionProgressed(slug, step);
        }
      },
      { threshold: 0.55 },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [slug, stepCount]);

  return null;
}
