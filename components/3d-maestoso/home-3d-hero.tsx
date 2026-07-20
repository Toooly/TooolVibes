"use client";

import { motion } from "motion/react";
import { VibesReactor } from "./vibes-reactor";
import { PremiumLink } from "@/components/ui/premium";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const heroOrbPalette = [
  "#64FFDA",
  "#FFD166",
  "#FF6B9D",
  "#39D2F6",
  "#A78BFA",
  "#8AF5FF",
  "#F3BF4C",
  "#10B981",
];

export function Home3DHero({
  tools,
  weeklyTool,
}: {
  tools: ToolPublicView[];
  weeklyTool?: ToolPublicView | null;
}) {
  const focusTool = weeklyTool ?? tools[0] ?? null;
  const orbTools = tools.filter((t) => t.featured).slice(0, 7);
  if (focusTool && !orbTools.find((t) => t.slug === focusTool.slug)) {
    orbTools.unshift(focusTool);
  }
  const orbs = orbTools.slice(0, 8).map((t, i) => ({
    name: t.name,
    color: heroOrbPalette[i % heroOrbPalette.length],
    position: [2.2 + (i % 3) * 0.6, ((i % 2) - 0.5) * 0.8, 2.2 + Math.floor(i / 3) * 0.6] as [number, number, number],
    speed: 0.15 + i * 0.04,
  }));

  const [reactorEnabled, setReactorEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const update = () => setReactorEnabled(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return (
    <section className="home-3d-hero relative flex min-h-[60vh] items-center justify-center overflow-hidden sm:min-h-[85vh]">
      {reactorEnabled && <VibesReactor orbs={orbs} className="home-3d-hero__reactor" />}
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.p
          className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#B388FF]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Curatela indipendente · meno rumore, più segnale
        </motion.p>
        <motion.h1
          className="home-3d-hero__title v-text-gradient-purple text-[1.75rem] font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          Trova il tool giusto prima che il rumore scelga per te.
        </motion.h1>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#9E99B8]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          Una selezione ragionata di tool AI, SaaS e no-code per passare
          dalla scoperta alla scelta con più chiarezza.
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <PremiumLink href="/archivio" size="lg" className="home-3d-hero__cta home-3d-hero__cta--catalog">
            Esplora catalogo
          </PremiumLink>
          <Link href="/radar" className="home-3d-hero__cta home-3d-hero__cta--radar v-btn-radar-live">
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
