"use client";

import Link from "next/link";
import {
  ArrowRight,
  Bookmark,
  Boxes,
  Compass,
  GitCompare,
  Radar,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { OrbitalItem, OrbitalShapeType } from "@/components/app/orbital-system";

const HOME_ICON_MAP = {
  Bookmark,
  Boxes,
  Compass,
  GitCompare,
  Radar,
  Search,
  Sparkles,
  Zap,
} as const;

function slugToShape(slug: string): OrbitalShapeType {
  const shapes: OrbitalShapeType[] = ["hexagon", "crystal", "shard", "gem", "blob"];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return shapes[Math.abs(hash) % shapes.length];
}

function toolToOrbital(tool: DirectoryTool, sectionId: string, priority = 1): OrbitalItem {
  const words = tool.name.split(/\s+/).filter(Boolean);
  const initials =
    words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
  const domain = tool.domain || tool.externalUrl;
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : undefined;
  return {
    id: `${sectionId}-${tool.slug}`,
    title: tool.name,
    initials: initials.toUpperCase(),
    description: tool.shortDescription || tool.tldr || tool.description,
    category: tool.categoryLabel,
    href: `/toools/${tool.slug}`,
    sectionId,
    priority,
    color: tool.accentFrom || "#6a3cff",
    shapeType: slugToShape(tool.slug),
    iconUrl,
    variant: "tool",
    size: "sm",
  };
}

interface HomeHeroSectionProps {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
  supportingTools: DirectoryTool[];
}

export function HomeHeroSection({ tools, weeklyTool, supportingTools }: HomeHeroSectionProps) {
  const featuredTools = tools.filter((t) => t.featured).slice(0, 5);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0];
  const support = supportingTools.length > 0
    ? supportingTools
    : featuredTools.filter((t) => t.slug !== focusTool?.slug).slice(0, 4);

  return (
    <section className="relative z-10 min-h-[calc(85svh-4rem)] overflow-visible px-4 pt-16 pb-20 md:px-8 md:pt-20 md:pb-24 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />

      <div className="relative z-20 mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#39d2f6]">
            Sistema TooolVibes
          </p>
          <h1 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] text-white">
            Scegli tool validi senza attraversare il rumore.
          </h1>
          <p className="mt-4 max-w-xl text-[0.95rem] leading-7 text-white/75 sm:text-[1.05rem]">
            TooolVibes seleziona, organizza e aggiorna i migliori strumenti AI e SaaS.
            Nessuna lista infinita: solo quelli che fanno davvero la differenza.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/archivio"
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(106,60,255,0.25)] transition-transform hover:translate-y-[-2px]"
            >
              Esplora il catalogo
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/product-hunt"
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/12"
            >
              Scopri il Radar
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr]">
          <Link
            href={`/toools/${focusTool.slug}`}
            className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(12,8,38,0.45)] p-5 backdrop-blur-xl transition-all hover:border-[#6a3cff]/30 hover:bg-[rgba(12,8,38,0.6)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#6a3cff]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#bda8ff]">
                  Tool del giorno
                </span>
                <h3 className="mt-3 text-xl font-bold text-white">{focusTool.name}</h3>
                <p className="mt-1 text-sm leading-6 text-white/65">
                  {focusTool.shortDescription || focusTool.tldr}
                </p>
              </div>
              {focusTool.domain && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(focusTool.domain)}&sz=64`}
                  alt=""
                  className="size-10 rounded-lg"
                />
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#39d2f6]">
              <span>Scopri di più</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {support.slice(0, 4).map((tool) => (
              <Link
                key={tool.slug}
                href={`/toools/${tool.slug}`}
                className="group relative overflow-hidden rounded-[22px] border border-white/8 bg-[rgba(12,8,38,0.35)] p-4 backdrop-blur-md transition-all hover:border-white/15 hover:bg-[rgba(12,8,38,0.5)]"
              >
                <div className="flex items-center gap-3">
                  {tool.domain ? (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=64`}
                      alt=""
                      className="size-8 rounded-md"
                    />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-md bg-[#6a3cff]/20 text-xs font-bold text-white">
                      {tool.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{tool.name}</p>
                    <p className="truncate text-[11px] text-white/50">{tool.categoryLabel}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-[5%] top-[15%] hidden lg:block">
        <div className="animate-[float_6s_ease-in-out_infinite] rounded-2xl border border-[#6a3cff]/20 bg-[#6a3cff]/10 px-4 py-2 text-xs font-bold text-[#bda8ff] backdrop-blur-md">
          AI
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-[20%] left-[3%] hidden lg:block">
        <div className="animate-[float_5s_ease-in-out_infinite_1s] rounded-2xl border border-[#39d2f6]/20 bg-[#39d2f6]/10 px-4 py-2 text-xs font-bold text-[#a8f0ff] backdrop-blur-md">
          SaaS
        </div>
      </div>
    </section>
  );
}
