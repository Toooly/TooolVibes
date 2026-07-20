"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Radar } from "lucide-react";

import type { RadarDesktopVisual } from "@/lib/radar/radar-view-config";

/**
 * Render responsive esclusivo del Radar (B44 / quota PERF-1201).
 *
 * Il DOM contiene sempre UNA sola view: il viewport è risolto dopo il mount
 * via matchMedia (mai lettura di `window` durante il render, nessuna
 * hydration mismatch), con fallback identico tra SSR e primo render client.
 * Le due view sono dynamic import: il bundle mobile non carica il tree
 * desktop (3D incluso) e viceversa, e allo swap di viewport il tree
 * precedente viene smontato (un solo fetch/listener attivo, cache query
 * condivisa via `useProductHuntRadar`).
 */

export const RADAR_DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";

type RadarViewport = "mobile" | "desktop";

function RadarViewFallback() {
  return (
    <div className="radar-loading-state" role="status" aria-busy="true">
      <span className="sr-only">Caricamento del radar…</span>
      <span className="radar-loading-state__icon" aria-hidden="true">
        <Radar />
      </span>
      <p className="radar-loading-state__eyebrow">Radar live</p>
      <strong>Sintonizzazione dei segnali in corso.</strong>
      <p>Stiamo ordinando i lanci più interessanti prima di mostrarteli.</p>
      <span className="radar-loading-state__progress" aria-hidden="true">
        <i />
      </span>
    </div>
  );
}

const MobileRadarView = dynamic(
  () =>
    import("@/components/radar/mobile-radar-view").then(
      (mod) => mod.MobileRadarView,
    ),
  { loading: () => <RadarViewFallback /> },
);

const DesktopVibeRadar = dynamic(
  () =>
    import("@/components/desktop/desktop-vibe-radar").then(
      (mod) => mod.DesktopVibeRadar,
    ),
  { loading: () => <RadarViewFallback /> },
);

export function RadarViewSwitch({
  threeDEnabled,
  initialDesktopVisual,
}: {
  threeDEnabled: boolean;
  initialDesktopVisual: RadarDesktopVisual;
}) {
  // `null` su server e primo render client: markup identico, hydration safe.
  const [viewport, setViewport] = useState<RadarViewport | null>(null);

  useEffect(() => {
    const media = window.matchMedia(RADAR_DESKTOP_MEDIA_QUERY);
    const update = () =>
      setViewport(media.matches ? "desktop" : "mobile");

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  if (viewport === "desktop") {
    return (
      <DesktopVibeRadar
        threeDEnabled={threeDEnabled}
        initialVisual={initialDesktopVisual}
      />
    );
  }

  if (viewport === "mobile") {
    return <MobileRadarView />;
  }

  return <RadarViewFallback />;
}
