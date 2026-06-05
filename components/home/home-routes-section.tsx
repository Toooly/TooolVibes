"use client";

import Link from "next/link";
import { ArrowRight, Compass, Radar, Boxes } from "lucide-react";

const routes = [
  {
    icon: Compass,
    title: "Catalogo",
    description: "Esplora l'archivio. Tutti i tool selezionati, filtrabili per categoria e utilizzo.",
    href: "/archivio",
    cta: "Entra nel catalogo",
    gradient: "from-[#6a3cff]/20 to-transparent",
    border: "border-[#6a3cff]/25",
    hover: "hover:border-[#6a3cff]/50",
  },
  {
    icon: Boxes,
    title: "Collection",
    description: "Collezioni tematiche. Selezione curata per esigenze specifiche.",
    href: "/collections",
    cta: "Scopri le collection",
    gradient: "from-[#f3bf4c]/15 to-transparent",
    border: "border-[#f3bf4c]/25",
    hover: "hover:border-[#f3bf4c]/50",
  },
  {
    icon: Radar,
    title: "Radar Live",
    description: "Radar & trend. I lanci più caldi e i segnali da non perdere.",
    href: "/product-hunt",
    cta: "Apri il Radar",
    gradient: "from-[#39d2f6]/15 to-transparent",
    border: "border-[#39d2f6]/25",
    hover: "hover:border-[#39d2f6]/50",
  },
];

export function HomeRoutesSection() {
  return (
    <section className="relative z-10 px-4 py-16 md:px-8 md:py-20 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#39d2f6]">
          Percorsi principali
        </p>
        <h2 className="mt-3 text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold leading-tight text-white">
          Scegli la tua prossima rotta
        </h2>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.title}
                href={route.href}
                className={`group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[28px] border bg-gradient-to-br ${route.gradient} ${route.border} ${route.hover} p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:min-h-[300px] sm:p-7`}
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8">
                    <Icon className="size-6 text-white" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">{route.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{route.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors group-hover:text-white">
                  {route.cta}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
