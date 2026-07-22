"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ChevronRight, Code2, GitCompare, MousePointerClick, TrendingUp, Workflow } from "lucide-react";

import { PremiumBadge, PremiumPanel } from "@/components/ui/premium";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DecorativeGlow } from "@/components/ui/premium-section";
import { SectionHeader } from "@/components/ui/section-header";

const quickPaths = [
  {
    title: "Voglio creare un'app",
    description: "App builder, UI generator e percorsi prompt-to-product.",
    href: "/archivio?group=ai-app-builder",
    icon: Code2,
  },
  {
    title: "Voglio automatizzare",
    description: "Flussi, agenti e integrazioni per processi ripetibili.",
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
    href: "/radar",
    icon: TrendingUp,
  },
];

export function MobileQuickStart() {
  const visibleQuickPaths = quickPaths.slice(0, 2);
  const extraQuickPaths = quickPaths.slice(2);

  return (
    <section className="page-shell">
      <PremiumPanel tone="blue" className="relative p-4 sm:p-7">
        <DecorativeGlow className="-right-10 -top-10" tone="cyan" />
        <DecorativeGlow className="-bottom-12 left-10" tone="violet" />
        <div className="relative">
          <SectionHeader
            eyebrow="Percorsi rapidi"
            title="Da dove vuoi partire?"
            description="Scegli un intento e arriva subito al catalogo, al confronto o al radar."
            className="[&_h2]:text-[var(--foreground)] [&_p]:text-[var(--muted-strong)]"
          />

          <motion.div
            className="micro-popover-panel mt-4 hidden items-center gap-3 px-3 py-2.5 sm:flex"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.24 }}
          >
            <span className="live-icon-orbit grid size-9 shrink-0 place-items-center rounded-[14px]">
              <MousePointerClick className="size-4" aria-hidden="true" />
            </span>
            <p className="text-xs leading-5 text-[var(--muted-strong)]">
              Tocca un percorso: gli altri restano compatti e si aprono quando servono.
            </p>
          </motion.div>

          <div className="mt-4 grid gap-2.5 sm:hidden">
            {visibleQuickPaths.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="dynamic-link-card group flex items-center justify-between gap-3 rounded-[20px] border border-white/12 bg-white/9 p-3 transition duration-200 active:scale-[0.99]"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-[16px] border border-white/10 bg-white/10">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.94rem] font-semibold">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[0.78rem] leading-5 text-white/64">
                        {item.description}
                      </span>
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-white/42 transition group-hover:translate-x-1" />
                </Link>
              );
            })}

            <Accordion className="gap-2">
              <AccordionItem
                value="extra-quick-paths"
                className="motion-accordion-item rounded-[20px] border border-white/12 bg-white/9 px-3"
              >
                <AccordionTrigger className="py-3 text-[0.92rem] font-semibold hover:no-underline">
                  Altri percorsi rapidi
                </AccordionTrigger>
                <AccordionContent className="pb-3">
                  <div className="grid gap-2">
                    {extraQuickPaths.map((item) => {
                      const Icon = item.icon;

                      return (
                        <Link
                          key={item.title}
                          href={item.href}
                          className="dynamic-link-card flex items-center justify-between gap-3 rounded-[16px] border border-white/10 bg-white/8 px-3 py-2.5 text-sm font-semibold transition active:scale-[0.99]"
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <Icon className="size-4 shrink-0" aria-hidden="true" />
                            <span className="truncate">{item.title}</span>
                          </span>
                          <ChevronRight className="size-4 shrink-0 text-white/42" />
                        </Link>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="tool-rail -mx-2 mt-5 hidden snap-x gap-3 overflow-x-auto px-2 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4">
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
                    className="dynamic-link-card group flex h-full min-h-[8.8rem] flex-col justify-between rounded-[24px] border border-white/12 bg-white/9 p-4 text-white transition duration-200 hover:-translate-y-1 hover:border-violet-200/36 hover:bg-white/14 hover:shadow-[0_18px_44px_rgba(8,14,38,0.2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
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
                        {index === 0 ? <PremiumBadge tone="dark">Inizia qui</PremiumBadge> : null}
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
