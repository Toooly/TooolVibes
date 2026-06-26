"use client";

import { motion } from "motion/react";
import { Bookmark, ArrowRight } from "lucide-react";
import Link from "next/link";
import { TiltCard3D } from "./tilt-card-3d";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";

export function Shortlist3DVault({
  savedTools,
}: {
  savedTools: DirectoryTool[];
}) {
  const slots = Array.from({ length: 6 }, (_, i) => savedTools[i] ?? null);

  return (
    <div className="relative flex min-h-[60vh] items-center justify-center overflow-hidden py-16">
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-[#7C4DFF]">Biblioteca operativa</p>
          <h1 className="v-text-gradient-purple text-4xl font-bold sm:text-5xl">
            Il tuo hangar personale
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-[#9E99B8]">
            Ogni tool salvato è un modulo archiviato. Slot liberi per i prossimi candidati.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slots.map((tool, i) => (
            <motion.div
              key={tool?.slug ?? `slot-${i}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              {tool ? (
                <TiltCard3D tiltAmount={6} glowColor="rgba(124,77,255,0.2)">
                  <div className="v-card-3d flex flex-col items-center gap-3 p-6">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `linear-gradient(135deg, ${tool.accentFrom}30, ${tool.accentTo}20)` }}>
                      <DirectoryToolGlyph tool={tool} size="md" />
                    </div>
                    <strong className="text-[#F0EFFF]">{tool.name}</strong>
                    <span className="text-sm text-[#9E99B8]">{tool.categoryLabel}</span>
                    <Link href={`/toools/${tool.slug}`} className="mt-2 inline-flex items-center gap-1 text-sm text-[#00E5FF] hover:underline">
                      Apri <ArrowRight size={14} />
                    </Link>
                  </div>
                </TiltCard3D>
              ) : (
                <div className="v-slot-empty">
                  <span className="v-slot-empty__number">#{String(i + 1).padStart(2, "0")}</span>
                  <span className="v-slot-empty__label">Slot libero</span>
                  <Bookmark size={20} className="v-slot-empty__icon" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
