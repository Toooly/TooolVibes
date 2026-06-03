"use client";

import Link from "next/link";
import { motion } from "motion/react";
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
  Star,
} from "lucide-react";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { DirectoryToolGlyph } from "@/components/directory/directory-tool-glyph";
import { HeroSection } from "./hero-section";
import { TiltCard } from "./tilt-card";
import { ScrollReveal, StaggerContainer, StaggerItem } from "./scroll-reveal";

type VibeHomeV2Props = {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
  supportingTools: DirectoryTool[];
};

const decisionSteps = [
  {
    icon: Search,
    label: "Discover",
    title: "Parti da tool già curati",
    description: "Categorie leggibili, filtri utili e una selezione editoriale che tiene fuori il rumore.",
    href: "/archivio",
    color: "#6a3cff",
  },
  {
    icon: GitCompare,
    label: "Compare",
    title: "Confronta solo i candidati forti",
    description: "Porta avanti pochi tool alla volta e guarda differenze, livello e casi d'uso reali.",
    href: "/compare",
    color: "#39d2f6",
  },
  {
    icon: Bookmark,
    label: "Shortlist",
    title: "Chiudi con una scelta rapida",
    description: "Salva, rivedi e trasforma la ricerca in una lista operativa pronta da provare.",
    href: "/shortlist",
    color: "#f3bf4c",
  },
];

const routeCards = [
  {
    icon: Compass,
    label: "Catalogo",
    href: "/archivio",
    detail: "Tool AI per categoria",
    color: "#6a3cff",
    gradient: "from-[rgba(106,60,255,0.12)] to-[rgba(79,70,229,0.08)]",
  },
  {
    icon: Radar,
    label: "Radar live",
    href: "/product-hunt",
    detail: "Segnali Product Hunt",
    color: "#39d2f6",
    gradient: "from-[rgba(57,210,246,0.12)] to-[rgba(43,185,222,0.08)]",
  },
  {
    icon: Boxes,
    label: "Collection",
    href: "/collections",
    detail: "Percorsi editoriali",
    color: "#f3bf4c",
    gradient: "from-[rgba(243,191,76,0.12)] to-[rgba(217,157,39,0.08)]",
  },
];

export function VibeHomeV2({ tools, weeklyTool, supportingTools }: VibeHomeV2Props) {
  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0];
  const displayTools = [
    ...featuredTools.filter((tool) => tool.slug !== focusTool?.slug),
    ...tools.filter((tool) => tool.slug !== focusTool?.slug),
  ].slice(0, 6);

  return (
    <div className="relative">
      {/* ── HERO ── */}
      <HeroSection tools={tools} weeklyTool={weeklyTool} />

      {/* ── ROUTE CARDS ── */}
      <section className="relative z-10 px-4 py-20 md:px-6 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <ScrollReveal className="mb-10 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(106,60,255,0.12)] bg-[rgba(255,255,255,0.5)] px-4 py-1.5 text-xs font-medium text-[#6a3cff]">
              <Compass size={14} />
              Percorsi principali
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#120d2f] md:text-4xl">
              Scegli la tua prossima <span className="text-[#6a3cff]">rotta</span>
            </h2>
          </ScrollReveal>

          <StaggerContainer className="grid gap-6 md:grid-cols-3" staggerDelay={0.15}>
            {routeCards.map((item) => {
              const Icon = item.icon;
              return (
                <StaggerItem key={item.href}>
                  <TiltCard tiltAmount={8} glowColor={`${item.color}30`}>
                    <Link
                      href={item.href}
                      data-sonic-action="nav"
                      className="group relative flex flex-col gap-4 rounded-2xl border border-[rgba(106,60,255,0.08)] bg-gradient-to-br p-6 transition-all duration-300 hover:border-[rgba(106,60,255,0.2)] hover:shadow-[0_16px_48px_rgba(106,60,255,0.12)]"
                      style={{
                        background: `linear-gradient(135deg, ${item.gradient.replace("from-", "").replace(" to-", ", ")})`,
                      }}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl"
                        style={{ background: `${item.color}15`, color: item.color }}
                      >
                        <Icon size={24} />
                      </div>
                      <div>
                        <h3 className="mb-1 text-lg font-semibold text-[#120d2f] group-hover:text-[#6a3cff] transition-colors">
                          {item.label}
                        </h3>
                        <p className="text-sm text-[#4f4970]">{item.detail}</p>
                      </div>
                      <div className="mt-auto flex items-center gap-1 text-sm font-medium" style={{ color: item.color }}>
                        Esplora
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </TiltCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ── DECISION PROCESS ── */}
      <section className="relative z-10 px-4 py-20 md:px-6 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <ScrollReveal className="mb-12 text-center">
            <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(106,60,255,0.12)] bg-[rgba(255,255,255,0.5)] px-4 py-1.5 text-xs font-medium text-[#6a3cff]">
              <Zap size={14} />
              Metodo
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-[#120d2f] md:text-4xl">
              Un flusso ordinato, <span className="text-[#39d2f6]">non una vetrina infinita</span>
            </h2>
          </ScrollReveal>

          <div className="relative">
            {/* Connection line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#6a3cff] via-[#39d2f6] to-[#f3bf4c] md:left-1/2 md:-translate-x-1/2" />

            <StaggerContainer className="relative flex flex-col gap-8" staggerDelay={0.2}>
              {decisionSteps.map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 0;

                return (
                  <StaggerItem key={step.label}>
                    <div className={`flex items-center gap-6 md:gap-12 ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}>
                      <div className={`flex-1 ${isEven ? "md:text-right" : "md:text-left"}`}>
                        <TiltCard tiltAmount={5} glowColor={`${step.color}20`}>
                          <Link
                            href={step.href}
                            data-sonic-action="nav"
                            className="group block rounded-2xl border border-[rgba(106,60,255,0.08)] bg-[rgba(255,255,255,0.7)] p-6 backdrop-blur-sm transition-all hover:border-[rgba(106,60,255,0.2)] hover:shadow-[0_12px_40px_rgba(106,60,255,0.1)]"
                          >
                            <span
                              className="mb-2 inline-block text-xs font-semibold uppercase tracking-wider"
                              style={{ color: step.color }}
                            >
                              {step.label}
                            </span>
                            <h3 className="mb-2 text-xl font-bold text-[#120d2f]">{step.title}</h3>
                            <p className="text-sm leading-relaxed text-[#4f4970]">{step.description}</p>
                          </Link>
                        </TiltCard>
                      </div>

                      {/* Center node */}
                      <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-[#f7f5ff] shadow-[0_0_20px_rgba(106,60,255,0.3)]"
                        style={{ background: step.color }}
                      >
                        <Icon size={20} className="text-white" />
                      </div>

                      <div className="hidden flex-1 md:block" />
                    </div>
                  </StaggerItem>
                );
              })}
            </StaggerContainer>
          </div>
        </div>
      </section>

      {/* ── TOOL OF THE WEEK ── */}
      {focusTool && (
        <section className="relative z-10 px-4 py-20 md:px-6 lg:px-12">
          <div className="mx-auto max-w-[1440px]">
            <ScrollReveal>
              <div className="relative overflow-hidden rounded-3xl border border-[rgba(106,60,255,0.12)] bg-gradient-to-br from-[rgba(106,60,255,0.06)] via-[rgba(57,210,246,0.04)] to-[rgba(243,191,76,0.06)] p-8 md:p-12 lg:p-16">
                {/* Background glow */}
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[rgba(106,60,255,0.1)] blur-3xl" />
                <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[rgba(57,210,246,0.1)] blur-3xl" />

                <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
                  <div className="max-w-lg text-center lg:text-left">
                    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[rgba(243,191,76,0.3)] bg-[rgba(243,191,76,0.1)] px-4 py-1.5 text-xs font-medium text-[#d99d27]">
                      <Star size={14} className="fill-[#f3bf4c] text-[#f3bf4c]" />
                      Tool della settimana
                    </span>
                    <h2 className="mb-4 text-3xl font-bold text-[#120d2f] md:text-4xl">
                      {focusTool.name}
                    </h2>
                    <p className="mb-2 text-sm font-medium text-[#6a3cff]">{focusTool.categoryLabel}</p>
                    <p className="mb-6 text-[#4f4970] leading-relaxed">{focusTool.whyItMatters}</p>
                    <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                      {focusTool.highlights.slice(0, 3).map((h) => (
                        <span
                          key={h}
                          className="rounded-full border border-[rgba(106,60,255,0.12)] bg-[rgba(255,255,255,0.6)] px-3 py-1 text-xs text-[#4f4970]"
                        >
                          {h}
                        </span>
                      ))}
                    </div>
                    <Link
                      href={`/toools/${focusTool.slug}`}
                  data-sonic-action="detail"
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(106,60,255,0.35)] transition-all hover:shadow-[0_12px_40px_rgba(106,60,255,0.5)] hover:scale-[1.03]"
                    >
                      Scopri di più
                      <ArrowRight size={16} />
                    </Link>
                  </div>

                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 2 }}
                    className="relative"
                  >
                    <div className="absolute inset-0 rounded-3xl bg-[rgba(106,60,255,0.2)] blur-2xl" />
                    <div className="relative flex h-48 w-48 items-center justify-center rounded-3xl border border-[rgba(106,60,255,0.15)] bg-[rgba(255,255,255,0.8)] shadow-[0_24px_64px_rgba(106,60,255,0.2)] backdrop-blur-md md:h-56 md:w-56">
                      <DirectoryToolGlyph tool={focusTool} size="lg" />
                    </div>
                  </motion.div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ── CATALOG GRID ── */}
      <section className="relative z-10 px-4 py-20 md:px-6 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <ScrollReveal className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-[rgba(106,60,255,0.12)] bg-[rgba(255,255,255,0.5)] px-4 py-1.5 text-xs font-medium text-[#6a3cff]">
                <Boxes size={14} />
                Catalogo vivo
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-[#120d2f] md:text-4xl">
                Alternative reali, <span className="text-[#6a3cff]">ordinate per decidere meglio</span>
              </h2>
            </div>
            <Link
              href="/archivio" data-sonic-action="nav"
              className="group inline-flex items-center gap-2 rounded-xl border border-[rgba(106,60,255,0.2)] bg-[rgba(255,255,255,0.6)] px-5 py-2.5 text-sm font-medium text-[#120d2f] backdrop-blur-md transition-all hover:bg-[rgba(106,60,255,0.08)] hover:border-[#6a3cff]"
            >
              Vedi tutti
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </ScrollReveal>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.08}>
            {displayTools.map((tool) => (
              <StaggerItem key={tool.slug}>
                <TiltCard tiltAmount={6} glowColor={`${tool.accentFrom}30`}>
                  <Link
                    href={`/toools/${tool.slug}`}
                      data-sonic-action="detail"
                    className="group flex items-center gap-4 rounded-2xl border border-[rgba(106,60,255,0.06)] bg-[rgba(255,255,255,0.7)] p-5 backdrop-blur-sm transition-all hover:border-[rgba(106,60,255,0.2)] hover:shadow-[0_12px_40px_rgba(106,60,255,0.1)]"
                  >
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `linear-gradient(135deg, ${tool.accentFrom}20, ${tool.accentTo}15)`,
                      }}
                    >
                      <DirectoryToolGlyph tool={tool} size="sm" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-[#120d2f] group-hover:text-[#6a3cff] transition-colors">
                        {tool.name}
                      </h3>
                      <p className="truncate text-xs text-[#4f4970]">{tool.levelLabel}</p>
                    </div>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-[#4f4970] opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100"
                    />
                  </Link>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative z-10 px-4 py-20 md:px-6 lg:px-12">
        <div className="mx-auto max-w-[1440px]">
          <ScrollReveal>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#120d2e] via-[#21135c] to-[#0d0823] p-10 text-center md:p-16">
              {/* Animated background particles */}
              <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 20 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-1 w-1 rounded-full bg-white"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      opacity: Math.random() * 0.4 + 0.1,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 4,
                      repeat: Infinity,
                      delay: Math.random() * 3,
                    }}
                  />
                ))}
              </div>

              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6a3cff] to-[#39d2f6] shadow-[0_0_40px_rgba(106,60,255,0.4)]"
                >
                  <Sparkles className="h-8 w-8 text-white" />
                </motion.div>
                <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
                  Costruisci la tua <span className="text-[#39d2f6]">shortlist operativa</span>
                </h2>
                <p className="mx-auto mb-8 max-w-lg text-[rgba(255,255,255,0.7)]">
                  Inizia da un catalogo curato, confronta i candidati e salva solo quelli che contano.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/archivio" data-sonic-action="nav"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-8 py-4 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(106,60,255,0.4)] transition-all hover:shadow-[0_12px_40px_rgba(106,60,255,0.6)] hover:scale-[1.03]"
                  >
                    <Zap size={18} />
                    Esplora ora
                  </Link>
                  <Link
                    href="/wishlist"
                    className="inline-flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.06)] px-8 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.3)]"
                  >
                    Suggerisci un tool
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
