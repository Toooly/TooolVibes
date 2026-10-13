"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { UsersRound } from "lucide-react";

const signals = ["Discovery", "Design", "Build", "Deploy"];

const aboutStats = [
  ["3", "founder operativi"],
  ["0", "fumo nei processi"],
  ["1", "obiettivo: un sistema chiaro"],
] as const;

type AboutHeroProps = {
  heroCopy: string;
  teamCaptionCopy: string;
};

export function AboutHero({ heroCopy, teamCaptionCopy }: AboutHeroProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="v-about-hero motion-reveal overflow-hidden px-0 py-6 text-[var(--tv-ink-inverted)] sm:py-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(24rem,1.12fr)] xl:items-center">
        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 0.62, ease: [0.16, 1, 0.3, 1] }
          }
          className="max-w-[47rem]"
        >
          <p className="max-w-[41rem] text-[1rem] leading-7 text-[var(--tv-ink-inverted-secondary)] sm:text-[1.08rem]">
            <LocalizedText>{heroCopy}</LocalizedText>
          </p>

          <LocalizedAttributes><div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3" aria-label="Metriche TooolVibes">
            {aboutStats.map(([value, label]) => (
              <div key={label} className="v-about-stat-card">
                <strong className="block font-[var(--tv-font-system)] text-2xl leading-none text-[var(--tv-accent-brand)]">
                  {value}
                </strong>
                <span className="mt-1 block text-xs font-bold uppercase tracking-[0.1em] text-[var(--tv-ink-inverted-secondary)]">
                  <LocalizedText>{label}</LocalizedText>
                </span>
              </div>
            ))}
          </div></LocalizedAttributes>
        </motion.div>

        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  duration: 0.72,
                  delay: 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }
          }
          className="v-about-image-frame relative min-h-[18rem] sm:min-h-[30rem] xl:min-h-[34rem]"
        >
          <LocalizedAttributes><Image
            src="/about/team-working.jpg"
            alt="Team TooolVibes al lavoro intorno a un laptop"
            fill
            priority
            unoptimized
            sizes="(min-width: 1024px) 54vw, 100vw"
            className="object-cover"
          /></LocalizedAttributes>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-raised)] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--tv-ink-primary)] sm:left-5 sm:top-5">
            <UsersRound className="size-4" aria-hidden="true" /><LocalizedText>{"Team reale "}</LocalizedText></div>
          <div className="absolute bottom-4 left-4 right-4 rounded-[24px] border border-[var(--tv-border-interactive)] bg-[var(--tv-surface-raised)] p-4 text-[var(--tv-ink-primary)] sm:bottom-5 sm:left-5 sm:right-5 sm:p-5">
            <div className="flex flex-wrap gap-2">
              {signals.map((signal) => (
                <span key={signal} className="v-about-signal-chip">
                  <LocalizedText>{signal}</LocalizedText>
                </span>
              ))}
            </div>
            <p className="mt-4 max-w-[34rem] text-[0.95rem] leading-6 text-[var(--tv-ink-secondary)]">
              <LocalizedText>{teamCaptionCopy}</LocalizedText>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
