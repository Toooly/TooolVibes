"use client";

import { RadarScene3D } from "./radar-scene-3d";

const radarLayerMask = {
  overflow: "hidden",
  borderRadius: "50%",
  clipPath: "circle(49.4% at 50% 50%)",
  WebkitMaskImage: "radial-gradient(circle closest-side at 50% 50%, #000 90%, rgba(0, 0, 0, 0.65) 96%, transparent 100%)",
  maskImage: "radial-gradient(circle closest-side at 50% 50%, #000 90%, rgba(0, 0, 0, 0.65) 96%, transparent 100%)",
} as const;

const radarSignals = [
  { name: "Cursor", color: "#FF4081", angle: 0.5, distance: 2.5, status: "hot" as const },
  { name: "Blink", color: "#00E5FF", angle: 2.1, distance: 3.0, status: "trending" as const },
  { name: "VibeCode", color: "#7C4DFF", angle: 3.8, distance: 2.2, status: "new" as const },
  { name: "WeWeb", color: "#FFD740", angle: 5.2, distance: 3.5, status: "rising" as const },
  { name: "CosmicJS", color: "#64FFDA", angle: 1.2, distance: 2.8, status: "hot" as const },
  { name: "Lovable", color: "#FF5252", angle: 4.5, distance: 3.2, status: "trending" as const },
  { name: "Bolt", color: "#536DFE", angle: 6.0, distance: 2.0, status: "new" as const },
  { name: "Replit", color: "#B388FF", angle: 0.8, distance: 3.8, status: "rising" as const },
];

export function Radar3DLayer() {
  return (
    <div className="desktop-vibe-radar-3d-layer absolute inset-0" style={radarLayerMask}>
      <RadarScene3D
        signals={radarSignals}
        className="desktop-vibe-radar-3d-scene"
        style={{ ...radarLayerMask, opacity: 0.76 }}
      />
    </div>
  );
}
