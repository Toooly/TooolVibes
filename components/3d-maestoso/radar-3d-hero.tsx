"use client";

import { RadarScene3D } from "./radar-scene-3d";

export function Radar3DHero({ signals }: { signals: { name: string; color: string; angle: number; distance: number; status: "hot" | "trending" | "new" | "rising"; }[] }) {
  return (
    <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
      <RadarScene3D signals={signals} />
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#00E5FF]">Radar live</p>
        <h1 className="v-text-gradient-purple text-4xl font-bold sm:text-5xl md:text-6xl">
          I lanci si muovono dentro un radar 3D
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[#9E99B8]">
          La classifica Product Hunt come una sala di segnali: orbite, sweep e card agganciate alla profondità del sito.
        </p>
      </div>
    </div>
  );
}
