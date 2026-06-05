"use client";

import Link from "next/link";
import { Search, GitCompare, Bookmark } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover",
    description: "Scopri strumenti utili selezionati, non liste infinite.",
    href: "/archivio",
  },
  {
    icon: GitCompare,
    title: "Compare",
    description: "Confronta alternative reali, non pubblicità.",
    href: "/compare",
  },
  {
    icon: Bookmark,
    title: "Shortlist",
    description: "Salva e costruisci la tua selezione operativa.",
    href: "/shortlist",
  },
];

export function HomeDiscoverSection() {
  return (
    <section className="relative z-10 px-4 py-12 md:px-8 md:py-16 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.title}
                href={step.href}
                className="group rounded-[24px] border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm transition-colors hover:border-white/15 hover:bg-white/[0.06] sm:p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8">
                  <Icon className="size-6 text-white/80" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{step.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
