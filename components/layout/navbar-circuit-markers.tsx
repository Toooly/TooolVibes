"use client";

import { useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   Navbar Circuit Markers — animated symbols following the real
   rounded-rect border of each navbar pill.
   ═══════════════════════════════════════════════════════════════ */

type MarkerStyle = {
  color: string;
  glow: string;
  size: number;
  shape: "circle" | "square" | "triangle";
};

type PillConfig = {
  viewBoxW: number;
  viewBoxH: number;
  pathD: string;
  markers: MarkerStyle[];
  duration: number;
};

export const PILL_CONFIGS: Record<string, PillConfig> = {
  brand: {
    viewBoxW: 288,
    viewBoxH: 55,
    pathD:
      "M 34.5,11.5 L 273.5,11.5 A 14,14 0 0,1 287.5,25.5 L 287.5,16.5 A 27,27 0 0,1 260.5,43.5 L 28.5,43.5 A 17,17 0 0,1 11.5,26.5 L 11.5,34.5 A 23,23 0 0,1 34.5,11.5 Z",
    markers: [
      { color: "#6a3cff", glow: "rgba(106,60,255,0.45)", size: 9, shape: "triangle" },
      { color: "#39d2f6", glow: "rgba(57,210,246,0.4)", size: 6, shape: "circle" },
    ],
    duration: 7200,
  },
  nav: {
    viewBoxW: 584,
    viewBoxH: 55,
    pathD:
      "M 28,11 L 541,11 A 32,32 0 0,1 573,43 L 573,26 A 18,18 0 0,1 555,44 L 47,44 A 36,36 0 0,1 11,8 L 11,28 A 17,17 0 0,1 28,11 Z",
    markers: [
      { color: "#39d2f6", glow: "rgba(57,210,246,0.4)", size: 8, shape: "square" },
      { color: "#ff5eb8", glow: "rgba(255,94,184,0.35)", size: 6, shape: "circle" },
      { color: "#6a3cff", glow: "rgba(106,60,255,0.35)", size: 5, shape: "circle" },
    ],
    duration: 8400,
  },
  actions: {
    viewBoxW: 344,
    viewBoxH: 55,
    pathD:
      "M 43.5,12.5 L 314.5,12.5 A 17,17 0 0,1 331.5,29.5 L 331.5,18.5 A 24,24 0 0,1 307.5,42.5 L 26.5,42.5 A 14,14 0 0,1 12.5,28.5 L 12.5,43.5 A 31,31 0 0,1 43.5,12.5 Z",
    markers: [
      { color: "#f3bf4c", glow: "rgba(243,191,76,0.4)", size: 8, shape: "circle" },
      { color: "#39d2f6", glow: "rgba(57,210,246,0.35)", size: 5, shape: "circle" },
    ],
    duration: 7800,
  },
};

export function CircuitPill({
  config,
  containerRef,
}: {
  config: PillConfig;
  containerRef: React.RefObject<HTMLElement | null>;
}) {
  const svgPathRef = useRef<SVGPathElement>(null);
  const markerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rafRef = useRef<number>(0);
  const scaleRef = useRef(1);

  const updateScale = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    scaleRef.current = rect.width / config.viewBoxW;
  }, [containerRef, config.viewBoxW]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScale();
    const ro = new ResizeObserver(() => updateScale());
    ro.observe(el);

    const path = svgPathRef.current;
    if (!path) {
      ro.disconnect();
      return;
    }
    const totalLen = path.getTotalLength();

    // Check reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const start = performance.now();

    const tick = (now: number) => {
      const scale = scaleRef.current;

      config.markers.forEach((marker, i) => {
        const div = markerRefs.current[i];
        if (!div) return;

        if (prefersReduced) {
          // Static position: evenly spaced along the path
          const t = i / config.markers.length;
          const pt = path.getPointAtLength(t * totalLen);
          div.style.transform = `translate(${pt.x * scale}px, ${pt.y * scale}px)`;
          div.style.opacity = "0.6";
          return;
        }

        const offset = (i / config.markers.length) * config.duration;
        const t = ((now - start + offset) % config.duration) / config.duration;
        const pt = path.getPointAtLength(t * totalLen);
        div.style.transform = `translate(${pt.x * scale}px, ${pt.y * scale}px)`;
        div.style.opacity = String(0.5 + Math.sin(t * Math.PI * 2) * 0.3);
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [config, containerRef, updateScale]);

  return (
    <>
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          opacity: 0,
        }}
        viewBox={`0 0 ${config.viewBoxW} ${config.viewBoxH}`}
        preserveAspectRatio="none"
      >
        <path ref={svgPathRef} d={config.pathD} fill="none" />
      </svg>
      {config.markers.map((marker, i) => (
        <div
          key={i}
          ref={(el) => { markerRefs.current[i] = el; }}
          className="navbar-circuit-marker"
          data-shape={marker.shape}
          style={
            {
              position: "absolute",
              left: 0,
              top: 0,
              width: marker.size,
              height: marker.size,
              marginLeft: -(marker.size / 2),
              marginTop: -(marker.size / 2),
              background: marker.color,
              boxShadow: `0 0 10px 2px ${marker.glow}`,
              pointerEvents: "none",
              zIndex: 4,
              willChange: "transform",
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}

export function NavbarCircuitMarkers({
  brandRef,
  navRef,
  actionsRef,
}: {
  brandRef: React.RefObject<HTMLElement | null>;
  navRef: React.RefObject<HTMLElement | null>;
  actionsRef: React.RefObject<HTMLElement | null>;
}) {
  return (
    <>
      <CircuitPill config={PILL_CONFIGS.brand} containerRef={brandRef} />
      <CircuitPill config={PILL_CONFIGS.nav} containerRef={navRef} />
      <CircuitPill config={PILL_CONFIGS.actions} containerRef={actionsRef} />
    </>
  );
}
