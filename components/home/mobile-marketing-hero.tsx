"use client";

import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PremiumLink } from "@/components/ui/premium";
import type { HomeLayout } from "@/lib/config/home-experience";
import type { ToolPublicView } from "@/lib/data/tool-public-view";

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

type MobileMarketingHeroProps = {
  /* BATCH 40 (MOB-704): "legacy" = hero 100svh; "time-to-value" = hero
     compatto con CTA primaria e chip del tool in evidenza nel primo
     viewport (flag TOOOLVIBES_HOME_LAYOUT, lib/config/home-experience.ts). */
  layout?: HomeLayout;
  spotlightTool?: ToolPublicView | null;
};

export function MobileMarketingHero({
  layout = "legacy",
  spotlightTool = null,
}: MobileMarketingHeroProps) {
  const reducedMotion = useReducedMotion();
  const isTimeToValue = layout === "time-to-value";

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

  const sectionClassName = isTimeToValue
    ? "v-hero-mobile v-hero-mobile--compact relative flex min-h-0 flex-col items-center justify-center overflow-hidden px-6 pb-12 pt-24 text-center"
    : "v-hero-mobile relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center";

  return (
    <section className={sectionClassName}>
      <div className="v-hero-mobile__bg" aria-hidden="true" />
      <Starfield />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <motion.span
          className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition(0.1)}
        >
          Curatela indipendente · meno rumore, più segnale
        </motion.span>

        <motion.h1
          className="text-[2rem] font-bold leading-[1.05] text-white sm:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition(0.2)}
        >
          Trova il tool giusto prima che il rumore scelga per te.
        </motion.h1>

        <motion.p
          className="mt-4 text-lg leading-relaxed text-slate-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition(0.3)}
        >
          Tool AI, SaaS e no-code selezionati per aiutarti a scegliere con
          più chiarezza.
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

        {isTimeToValue && spotlightTool && (
          <motion.div
            className="mt-6 flex w-full justify-center"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={getTransition(0.5)}
          >
            <Link
              href={`/toools/${spotlightTool.slug}`}
              className="v-hero-mobile__tool-chip"
              aria-label={`${
                spotlightTool.toolOfWeek
                  ? "Tool della settimana"
                  : "Tool in evidenza"
              }: ${spotlightTool.name}. Apri la scheda`}
            >
              <Sparkles
                size={14}
                aria-hidden="true"
                className="v-hero-mobile__tool-chip-icon"
              />
              <span className="v-hero-mobile__tool-chip-text">
                {spotlightTool.toolOfWeek
                  ? "Tool della settimana"
                  : "Tool in evidenza"}
                <strong>{spotlightTool.name}</strong>
              </span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </motion.div>
        )}
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
