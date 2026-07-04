"use client";

import Link from "next/link";

import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { TiltCard3D } from "./tilt-card-3d";

export function Compare3DHero() {
  return (
    <section className="compare-hero-light relative flex min-h-[30vh] items-center justify-center overflow-hidden py-16 md:min-h-[38vh]">
      <div className="compare-hero-light__glow" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          Tool Battle
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          Metti i tool sul ring e scegli il vincitore.
        </p>
      </div>
    </section>
  );
}

export function Compare3DFloatCard({ tool, index }: { tool: DirectoryTool; index: number }) {
  return (
    <TiltCard3D tiltAmount={8} glowColor="rgba(255,215,64,0.25)">
      <Link
        href={`/toools/${tool.slug}`}
        className="flex flex-col items-center gap-3 rounded-2xl p-5 v-card-3d"
        style={{ background: `linear-gradient(145deg, ${tool.accentFrom}15, ${tool.accentTo}10)` }}
      >
        <DirectoryToolGlyph tool={tool} size={index === 0 ? "lg" : "md"} />
        <span className="text-center">
          <strong className="block text-[#F0EFFF]">{tool.name}</strong>
          <small className="text-[#9E99B8]">{tool.levelLabel}</small>
        </span>
      </Link>
    </TiltCard3D>
  );
}
