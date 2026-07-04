"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PremiumLink } from "@/components/ui/premium";

const STARS_COUNT = 24;

function Starfield() {
  const stars = useMemo(() => {
    return Array.from({ length: STARS_COUNT }).map((_, i) => ({
      id: i,
      top: `${(i * 37) % 100}%`,
      left: `${(i * 53) % 100}%`,
      size: 1 + (i % 3),
      opacity: 0.25 + ((i * 7) % 40) / 100,
    }));
  }, []);

  return (
    <div className="v-hero-mobile__stars" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="v-hero-mobile__star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
}

export function MobileMarketingHero() {
  const reducedMotion = useReducedMotion();

  const getTransition = (delay: number) =>
    reducedMotion
      ? { duration: 0, delay: 0 }
      : { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const };

  const handleExploreClick = () => {
    const target = document.getElementById("v-discovery-stage");
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    }
  };

  return (
    <section className="v-hero-mobile relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div className="v-hero-mobile__bg" aria-hidden="true" />
      <Starfield />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <motion.span
          className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition(0.1)}
        >
          TooolVibes
        </motion.span>

        <motion.h1
          className="text-[2rem] font-bold leading-[1.05] text-white sm:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition(0.2)}
        >
          Scegli tool AI validi
        </motion.h1>

        <motion.p
          className="mt-4 text-lg leading-relaxed text-slate-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition(0.3)}
        >
          Senza attraversare il rumore.
        </motion.p>

        <motion.div
          className="mt-8 flex w-full flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition(0.4)}
        >
          <PremiumLink
            href="/archivio"
            size="lg"
            className="v-hero-mobile__cta v-hero-mobile__cta--primary w-full max-w-xs justify-center"
          >
            Esplora catalogo
          </PremiumLink>

          <Link
            href="/radar"
            className="v-hero-mobile__cta v-hero-mobile__cta--secondary"
          >
            Radar live
          </Link>
        </motion.div>
      </div>

      <div className="v-hero-mobile__explore-wrap">
        <motion.button
          type="button"
          onClick={handleExploreClick}
          className="v-hero-mobile__explore"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition(0.6)}
          aria-label="Scorri per esplorare"
        >
          <span>Esplora</span>
          <ChevronDown className="v-hero-mobile__explore-chevron" size={16} />
        </motion.button>
      </div>
    </section>
  );
}
