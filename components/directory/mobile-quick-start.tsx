"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight, Code2, GitCompare, TrendingUp, Workflow } from "lucide-react";

import { PremiumBadge, PremiumPanel } from "@/components/ui/premium";
import { DecorativeGlow, SectionHeader } from "@/components/ui/premium-section";

const quickPaths = [
  {
    title: "Voglio creare un'app",
    description: "App builder, UI generator e percorsi prompt-to-product.",
    href: "/archivio?group=ai-app-builder",
    icon: Code2,
  },
  {
    title: "Voglio automatizzare",
    description: "Workflow, agenti e integrazioni per processi ripetibili.",
    href: "/archivio?group=automation",
    icon: Workflow,
  },
  {
    title: "Voglio confrontare tool",
    description: "Metti i candidati fianco a fianco prima di provarli.",
    href: "/compare",
    icon: GitCompare,
  },
  {
    title: "Voglio tool trending",
    description: "Guarda lanci e segnali esterni dal radar Product Hunt.",
    href: "/product-hunt",
    icon: TrendingUp,
  },
];

export function MobileQuickStart() {
  return (
    <section className="page-shell">
      <PremiumPanel tone="blue" className="relative p-5 sm:p-7">
        <DecorativeGlow className="-right-10 -top-10" tone="cyan" />
        <DecorativeGlow className="-bottom-12 left-10" tone="violet" />
        <div className="relative">
          <SectionHeader
            eyebrow="Percorsi rapidi"
            title="Da dove vuoi partire?"
            description="Scegli un intento e arriva subito al catalogo, al confronto o al radar."
            className="text-white [&_h2]:text-white [&_p]:text-white/68"
          />

          <div className="tool-rail -mx-2 mt-5 flex snap-x gap-3 overflow-x-auto px-2 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
            {quickPaths.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  className="w-[min(78vw,18.5rem)] shrink-0 snap-start sm:w-auto"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.16) }}
                >
                  <Link
                    href={item.href}
                    className="group flex h-full min-h-[8.8rem] flex-col justify-between rounded-[24px] border border-white/12 bg-white/9 p-4 text-white transition duration-200 hover:-translate-y-1 hover:border-violet-200/36 hover:bg-white/14 hover:shadow-[0_18px_44px_rgba(8,14,38,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
                  >
                    <span className="flex items-start justify-between gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-[18px] border border-white/10 bg-white/10 text-white">
                        <Icon className="size-5" aria-hidden="true" />
                      </span>
                      <ChevronRight className="size-4 text-white/40 transition duration-200 group-hover:translate-x-1 group-hover:text-white" />
                    </span>
                    <span className="min-w-0 pt-3">
                      <span className="flex items-center gap-2">
                        <span className="text-[1rem] font-semibold leading-tight">
                          {item.title}
                        </span>
                        {index === 0 ? <PremiumBadge tone="dark">Start</PremiumBadge> : null}
                      </span>
                      <span className="mt-2 block text-sm leading-6 text-white/64">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </PremiumPanel>
    </section>
  );
}
