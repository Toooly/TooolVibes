"use client";

import { motion } from "motion/react";
import { VibesReactor } from "./vibes-reactor";
import { PremiumLink } from "@/components/ui/premium";
import { siteConfig } from "@/lib/config/site";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Home3DHero({
  tools,
  weeklyTool,
}: {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
}) {
  const focusTool = weeklyTool ?? tools[0] ?? null;
  const orbTools = tools.filter((t) => t.featured).slice(0, 7);
  if (focusTool && !orbTools.find((t) => t.slug === focusTool.slug)) {
    orbTools.unshift(focusTool);
  }
  const orbs = orbTools.slice(0, 8).map((t, i) => ({
    name: t.name,
    color: t.accentFrom || "#7C4DFF",
    position: [2.2 + (i % 3) * 0.6, ((i % 2) - 0.5) * 0.8, 2.2 + Math.floor(i / 3) * 0.6] as [number, number, number],
    speed: 0.15 + i * 0.04,
  }));

  return (
    <section className="relative flex min-h-[60vh] sm:min-h-[85vh] items-center justify-center overflow-hidden">
      <VibesReactor orbs={orbs} />
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.p
          className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#B388FF]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Sistema TooolVibes
        </motion.p>
        <motion.h1
          className="v-text-gradient-purple text-[1.75rem] sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          Scegli tool AI validi senza attraversare il rumore
        </motion.h1>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#9E99B8]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {siteConfig.description}
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <PremiumLink href="/archivio" size="lg">
            Esplora catalogo
          </PremiumLink>
          <Link href="/radar" className="v-btn-radar-live">
            <span className="v-btn-radar-live__dot" aria-hidden="true" />
            <span className="v-btn-radar-live__glow" aria-hidden="true" />
            Radar live
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
