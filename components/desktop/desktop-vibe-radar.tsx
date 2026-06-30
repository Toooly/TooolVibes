import { Radar } from "lucide-react";

import { Radar3DLayer } from "@/components/3d-maestoso/radar-3d-layer";
import { DesktopRadarNodes } from "@/components/desktop/desktop-radar-nodes";
import { DesktopRadarTable } from "@/components/desktop/desktop-radar-table";

export function DesktopVibeRadar() {
  return (
    <div className="desktop-vibe desktop-vibe-radar hidden lg:block">
      <section className="desktop-vibe-section desktop-vibe-radar-hero desktop-vibe-radar-hero--simple">
        <div className="desktop-vibe-copy desktop-vibe-radar-title" data-orbit-shield>
          <h1>Radar Live</h1>
        </div>

        <div className="desktop-vibe-radar-stage" aria-label="Radar 3D Product Hunt">
          <Radar3DLayer />
          <span className="desktop-vibe-radar-sweep-line" aria-hidden="true" />
          <span className="desktop-vibe-radar-core" aria-hidden="true">
            <Radar />
          </span>
          <DesktopRadarNodes />
        </div>
      </section>

      <section className="desktop-vibe-section desktop-vibe-radar-console">
        <div className="desktop-vibe-radar-console__header">
          <div data-orbit-shield>
            <p className="desktop-vibe-eyebrow">Classifica live</p>
            <h2>Classifica Product Hunt</h2>
          </div>
        </div>
        <div id="rankings">
          <DesktopRadarTable />
        </div>
      </section>
    </div>
  );
}
