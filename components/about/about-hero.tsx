"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { UsersRound } from "lucide-react";

type AboutHeroProps = {
  heroCopy: string;
  teamCaptionCopy: string;
};

export function AboutHero({ heroCopy, teamCaptionCopy }: AboutHeroProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="v-about-hero motion-reveal overflow-hidden px-0 py-6 text-[var(--tv-ink-primary)] sm:py-8">
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
          <p className="max-w-[41rem] text-[1rem] leading-7 text-[var(--tv-ink-secondary)] sm:text-[1.08rem]">
            <LocalizedText>{heroCopy}</LocalizedText>
          </p>

          <p className="mt-4 max-w-[41rem] text-[1rem] leading-7 text-[var(--tv-ink-secondary)] sm:text-[1.08rem]">
            <LocalizedText>{teamCaptionCopy}</LocalizedText>
          </p>
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
          className="v-about-image-frame relative min-h-[18rem] sm:min-h-[23rem] xl:min-h-[26rem]"
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
            <UsersRound className="size-4" aria-hidden="true" /><LocalizedText>{"Il team TooolVibes"}</LocalizedText></div>

        </motion.div>
      </div>
    </section>
  );
}
