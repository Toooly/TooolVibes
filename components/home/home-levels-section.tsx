"use client";

import type { DirectoryFilterGroup, DirectoryTool } from "@/lib/data/tooolvibes-directory";

const levels: {
  key: "beginner" | "intermediate" | "expert";
  title: string;
  color: string;
  border: string;
  bg: string;
  description: string;
  categories: DirectoryFilterGroup[];
}[] = [
  {
    key: "beginner",
    title: "Beginner",
    color: "#10b981",
    border: "border-emerald-500/25",
    bg: "from-emerald-500/10 to-transparent",
    description: "Per chi vuole partire veloce, scoprire tool semplici e trovare strumenti immediati.",
    categories: ["no-code", "ai-app-builder"],
  },
  {
    key: "intermediate",
    title: "Intermediate",
    color: "#8b5cf6",
    border: "border-violet-500/25",
    bg: "from-violet-500/10 to-transparent",
    description: "Per chi usa già tool AI/SaaS e vuole alternative migliori e workflow più efficienti.",
    categories: ["marketing", "automation"],
  },
  {
    key: "expert",
    title: "Expert",
    color: "#f59e0b",
    border: "border-amber-500/25",
    bg: "from-amber-500/10 to-transparent",
    description: "Per chi cerca tool avanzati, automazioni, API, stack professionali e soluzioni tecniche.",
    categories: ["headless-cms", "vibe-coding"],
  },
];

interface HomeLevelsSectionProps {
  tools: DirectoryTool[];
}

export function HomeLevelsSection({ tools }: HomeLevelsSectionProps) {
  return (
    <section className="relative z-10 px-4 py-16 md:px-8 md:py-20 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#39d2f6]">
          Percorsi per livello
        </p>
        <h2 className="mt-3 text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold leading-tight text-white">
          Trova il tuo livello
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {levels.map((level) => {
            const examples = tools
              .filter((t) => level.categories.some((c) => t.segments.includes(c)))
              .slice(0, 3);

            return (
              <div
                key={level.key}
                className={`group relative overflow-hidden rounded-[28px] border ${level.border} bg-gradient-to-br ${level.bg} p-6 backdrop-blur-md transition-all hover:-translate-y-1 sm:p-7`}
              >
                <div
                  className="h-1 w-12 rounded-full"
                  style={{ backgroundColor: level.color }}
                />
                <h3 className="mt-5 text-xl font-bold text-white">{level.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{level.description}</p>

                <div className="relative mt-6 h-16">
                  {examples.map((tool, i) => (
                    <div
                      key={tool.slug}
                      className="absolute flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm"
                      style={{
                        left: `${i * 28}%`,
                        top: `${(i % 2) * 18}px`,
                        animation: `float ${4 + i}s ease-in-out infinite`,
                      }}
                    >
                      {tool.domain ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=64`}
                          alt=""
                          className="size-4 rounded"
                        />
                      ) : (
                        <span className="size-4 rounded bg-white/10 text-[9px] leading-4 text-center">
                          {tool.name.slice(0, 1)}
                        </span>
                      )}
                      {tool.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
