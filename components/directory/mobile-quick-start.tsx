"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Bookmark,
  Bot,
  Code2,
  FileText,
  GitCompare,
  Workflow,
} from "lucide-react";

import { PremiumBadge, PremiumPanel } from "@/components/ui/premium";
import { DecorativeGlow, SectionHeader } from "@/components/ui/premium-section";

const quickPaths = [
  {
    title: "Cerco tool AI",
    description: "Parti dal catalogo completo e filtra per categoria.",
    href: "/archivio",
    icon: Bot,
  },
  {
    title: "Voglio automatizzare",
    description: "Workflow, agenti e integrazioni operative.",
    href: "/archivio?group=automation",
    icon: Workflow,
  },
  {
    title: "Creo contenuti",
    description: "Writing, video, immagini e repurposing.",
    href: "/archivio?group=ai-writing",
    icon: FileText,
  },
  {
    title: "Sviluppo più veloce",
    description: "Vibe coding, UI builder e app builder.",
    href: "/archivio?group=vibe-coding",
    icon: Code2,
  },
  {
    title: "Confronto tool",
    description: "Aggiungi candidati e leggi le differenze.",
    href: "/compare",
    icon: GitCompare,
  },
  {
    title: "Creo una shortlist",
    description: "Salva i tool migliori per ritrovarli dopo.",
    href: "/shortlist",
    icon: Bookmark,
  },
];

export function MobileQuickStart() {
  return (
    <section className="page-shell">
      <PremiumPanel tone="dark" className="relative p-5 sm:p-7">
        <DecorativeGlow className="-right-10 -top-10" tone="cyan" />
        <DecorativeGlow className="-bottom-12 left-10" tone="violet" />
        <div className="relative">
          <SectionHeader
            eyebrow="Percorsi rapidi"
            title="Da dove vuoi partire?"
            description="Su mobile non devi scorrere tutto: scegli un intento e vai subito alla sezione giusta."
            className="text-white [&_h2]:text-white [&_p]:text-white/68"
          />

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {quickPaths.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.24, delay: Math.min(index * 0.03, 0.16) }}
                >
                  <Link
                    href={item.href}
                    className="group flex h-full min-h-[8.2rem] items-start gap-3 rounded-[24px] border border-white/10 bg-white/8 p-4 text-white transition duration-200 hover:-translate-y-0.5 hover:border-white/22 hover:bg-white/12 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/60"
                  >
                    <span className="grid size-11 shrink-0 place-items-center rounded-[18px] border border-white/10 bg-white/10 text-white">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[1rem] font-semibold leading-tight">
                          {item.title}
                        </span>
                        {index < 2 ? <PremiumBadge tone="dark">Start</PremiumBadge> : null}
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
