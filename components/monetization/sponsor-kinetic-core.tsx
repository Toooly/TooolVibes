"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type SponsorKineticDensity = "xl" | "card" | "slot";

export type SponsorKineticCoreProps = {
  partnerName: string;
  monogram?: string;
  density?: SponsorKineticDensity;
  className?: string;
};

/**
 * Decorative dark visual nucleus for the direct-sponsor surfaces.
 *
 * Pure presentational module:
 *   - `aria-hidden="true"` / role presentation: never read by AT.
 *   - All animation is on `transform` / `opacity` only.
 *   - Pauses via `data-in-view="false"` when the element scrolls offscreen
 *     (single IntersectionObserver per mount, threshold 0.05).
 *   - Honors `prefers-reduced-motion: reduce` — all animations are removed
 *     and the static composition (rings, nodes, monogram, grid) stays
 *     fully visible.
 *   - Server-render safe: no `window`/`document` access at render time.
 */
export function SponsorKineticCore({
  partnerName,
  monogram,
  density = "xl",
  className,
}: SponsorKineticCoreProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setInView(entry.isIntersecting);
      },
      { threshold: 0.05 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const initial = (monogram ?? partnerName ?? "").trim().charAt(0).toUpperCase() || "•";

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      role="presentation"
      data-in-view={inView ? "true" : "false"}
      className={cn(
        "sponsor-kinetic",
        density === "xl" && "sponsor-kinetic--xl",
        density === "card" && "sponsor-kinetic--card",
        density === "slot" && "sponsor-kinetic--slot",
        className,
      )}
    >
      <div className="sponsor-kinetic__grid" />
      <div className="sponsor-kinetic__rings">
        <span className="sponsor-kinetic__ring sponsor-kinetic__ring--outer">
          <span className="sponsor-kinetic__node sponsor-kinetic__node--cyan" />
          <span className="sponsor-kinetic__node sponsor-kinetic__node--gold" />
        </span>
        <span className="sponsor-kinetic__ring sponsor-kinetic__ring--inner">
          <span className="sponsor-kinetic__node sponsor-kinetic__node--gold" />
          <span className="sponsor-kinetic__node sponsor-kinetic__node--cyan" />
        </span>
      </div>
      <span className="sponsor-kinetic__scan" />
      <span className="sponsor-kinetic__core" aria-hidden="true">
        <span className="sponsor-kinetic__monogram">{initial}</span>
      </span>
    </div>
  );
}
