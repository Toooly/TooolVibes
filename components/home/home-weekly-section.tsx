"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

interface HomeWeeklySectionProps {
  tool?: DirectoryTool | null;
}

export function HomeWeeklySection({ tool }: HomeWeeklySectionProps) {
  if (!tool) return null;

  return (
    <section className="relative z-10 px-4 py-16 md:px-8 md:py-20 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#39d2f6]">
          In orbita questa settimana
        </p>
        <h2 className="mt-3 text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold leading-tight text-white">
          {tool.name}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{tool.whyItMatters || tool.shortDescription}</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/toools/${tool.slug}`}
            className="group relative col-span-1 overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(12,8,38,0.45)] p-6 backdrop-blur-xl transition-all hover:border-[#6a3cff]/30 sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#f3bf4c]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ffeaa0]">
                  Weekly pick
                </span>
                <h3 className="mt-3 text-2xl font-bold text-white">{tool.name}</h3>
                <p className="mt-2 max-w-lg text-sm leading-7 text-white/65">{tool.longDescription || tool.shortDescription}</p>
              </div>
              {tool.domain && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=64`}
                  alt=""
                  className="size-12 rounded-xl"
                />
              )}
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#39d2f6]">
              <span>Apri la scheda</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {[1, 2].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] p-5 backdrop-blur-sm"
            >
              <span className="inline-flex items-center rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                {i === 1 ? "Trending" : "From Product Hunt"}
              </span>
              <p className="mt-4 text-sm font-semibold text-white/40">Prossimamente</p>
              <p className="mt-1 text-xs text-white/25">Integrazione Product Hunt in arrivo.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
