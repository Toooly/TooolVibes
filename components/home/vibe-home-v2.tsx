"use client";

import Link from "next/link";
import { Sparkles, Zap } from "lucide-react";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { HeroSection } from "./hero-section";
import { FloatingSectionAnchor } from "./floating-section-anchor";
import { SectionOrbitProvider } from "@/components/app/orbital-system";
import type { OrbitalItem, OrbitalShapeType } from "@/components/app/orbital-system";

type VibeHomeV2Props = {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
  supportingTools: DirectoryTool[];
};

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
  const initials = words.length === 1 ? words[0].slice(0, 2).toUpperCase() : (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
  const domain = tool.domain || tool.externalUrl;
  const iconUrl = domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : undefined;
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

const routeCards = [
  {
    icon: "Compass" as const,
    label: "Catalogo",
    href: "/archivio",
    detail: "Tool AI per categoria",
    color: "#6a3cff",
    meta: "Esplora",
  },
  {
    icon: "Radar" as const,
    label: "Radar live",
    href: "/product-hunt",
    detail: "Segnali Product Hunt",
    color: "#39d2f6",
    meta: "Live",
    badge: "LIVE",
  },
  {
    icon: "Boxes" as const,
    label: "Collection",
    href: "/collections",
    detail: "Percorsi editoriali",
    color: "#f3bf4c",
    meta: "Curati",
  },
];

const decisionSteps = [
  {
    icon: "Search" as const,
    label: "Discover",
    title: "Parti da tool già curati",
    description: "Categorie leggibili, filtri utili e una selezione editoriale che tiene fuori il rumore.",
    href: "/archivio",
    color: "#6a3cff",
  },
  {
    icon: "GitCompare" as const,
    label: "Compare",
    title: "Confronta solo i candidati forti",
    description: "Porta avanti pochi tool alla volta e guarda differenze, livello e casi d'uso reali.",
    href: "/compare",
    color: "#39d2f6",
  },
  {
    icon: "Bookmark" as const,
    label: "Shortlist",
    title: "Chiudi con una scelta rapida",
    description: "Salva, rivedi e trasforma la ricerca in una lista operativa pronta da provare.",
    href: "/shortlist",
    color: "#f3bf4c",
  },
];

export function VibeHomeV2({ tools, weeklyTool, supportingTools: _supportingTools }: VibeHomeV2Props) {
  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0];
  const displayTools = [
    ...featuredTools.filter((tool) => tool.slug !== focusTool?.slug),
    ...tools.filter((tool) => tool.slug !== focusTool?.slug),
  ].slice(0, 6);

  // ── Orbital items ──
  const heroItems = featuredTools.slice(0, 5).map((t) => toolToOrbital(t, "home-hero", 1));

  const routeItems: OrbitalItem[] = routeCards.map((rc, i) => ({
    id: `route-${rc.label}`,
    title: rc.label,
    initials: rc.label.slice(0, 1).toUpperCase(),
    description: rc.detail,
    category: "Percorso",
    href: rc.href,
    sectionId: "home-routes",
    priority: 1,
    color: rc.color,
    shapeType: (["gem", "hexagon", "crystal"] as OrbitalShapeType[])[i % 3],
    variant: "route",
    size: "lg",
    iconName: rc.icon,
    badge: rc.badge,
    meta: rc.meta,
  }));

  const decisionItems: OrbitalItem[] = decisionSteps.map((ds, i) => ({
    id: `decision-${ds.label}`,
    title: ds.label,
    initials: ds.label.slice(0, 1).toUpperCase(),
    description: ds.description,
    category: "Metodo",
    href: ds.href,
    sectionId: "home-decision",
    priority: 1,
    color: ds.color,
    shapeType: (["crystal", "shard", "blob"] as OrbitalShapeType[])[i % 3],
    variant: "step",
    size: "md",
    iconName: ds.icon,
  }));

  const weeklyItems: OrbitalItem[] = focusTool
    ? [
        {
          ...toolToOrbital(focusTool, "home-weekly", 1),
          variant: "featured",
          size: "lg",
          badge: "TOP",
          meta: focusTool.categoryLabel,
        },
      ]
    : [];

  const catalogItems = displayTools.slice(0, 6).map((t) => ({
    ...toolToOrbital(t, "home-catalog", 1),
    variant: "tool" as const,
    size: "sm" as const,
  }));

  return (
    <div className="relative">
      {/* ═══════════════════════════════════════════════════════════
          HERO — kept as the primary spatial entry point
          The orbital items orbit around the hero text
      ═══════════════════════════════════════════════════════════ */}
      <SectionOrbitProvider sectionId="home-hero" label="Hero" items={heroItems}>
        <HeroSection tools={tools} weeklyTool={weeklyTool} />
      </SectionOrbitProvider>

      {/* ═══════════════════════════════════════════════════════════
          ROUTES — floating constellation of major navigation nodes
          Traditional card grid replaced by large orbital route nodes
      ═══════════════════════════════════════════════════════════ */}
      <SectionOrbitProvider sectionId="home-routes" label="Percorsi" items={routeItems}>
        <FloatingSectionAnchor
          label="Percorsi principali"
          title="Scegli la tua prossima rotta"
          description="Tre direzioni per esplorare il catalogo, i segnali live e i percorsi editoriali."
        />
      </SectionOrbitProvider>

      {/* ═══════════════════════════════════════════════════════════
          METHOD — orbital steps showing the decision flow
          Traditional timeline replaced by orbital step nodes
      ═══════════════════════════════════════════════════════════ */}
      <SectionOrbitProvider sectionId="home-decision" label="Metodo" items={decisionItems}>
        <FloatingSectionAnchor
          label="Metodo"
          title="Un flusso ordinato, non una vetrina infinita"
          description="Discover i tool curati, confronta i candidati forti, chiudi con una shortlist operativa."
        />
      </SectionOrbitProvider>

      {/* ═══════════════════════════════════════════════════════════
          FEATURED TOOL — single prominent orbital node
          Traditional large card replaced by a featured orbital node
      ═══════════════════════════════════════════════════════════ */}
      {focusTool && (
        <SectionOrbitProvider sectionId="home-weekly" label="Tool della settimana" items={weeklyItems}>
          <FloatingSectionAnchor
            label="Tool della settimana"
            title={focusTool.name}
            description={focusTool.whyItMatters}
            action={{ label: "Scopri di più", href: `/toools/${focusTool.slug}` }}
          />
        </SectionOrbitProvider>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CATALOG CLUSTER — floating tool nodes
          Traditional 6-card grid replaced by a cluster of tool orbital nodes
      ═══════════════════════════════════════════════════════════ */}
      <SectionOrbitProvider sectionId="home-catalog" label="Catalogo" items={catalogItems}>
        <FloatingSectionAnchor
          label="Catalogo vivo"
          title="Alternative reali, ordinate per decidere meglio"
          description="Una selezione editoriale di tool AI verificati, pronti per essere esplorati, confrontati e salvati."
          action={{ label: "Vedi tutti i tool", href: "/archivio" }}
        />
      </SectionOrbitProvider>

      {/* ═══════════════════════════════════════════════════════════
          FINAL CTA — integrated spatial closing
          Kept minimal, centered, part of the scene
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative z-10 flex min-h-[50vh] items-center justify-center px-4 md:px-6 lg:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6a3cff] to-[#39d2f6] shadow-[0_0_30px_rgba(106,60,255,0.25)]">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-[#120d2f] md:text-4xl">
            Costruisci la tua <span className="text-[#6a3cff]">shortlist operativa</span>
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-[#4f4970]/80">
            Inizia da un catalogo curato, confronta i candidati e salva solo quelli che contano.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/archivio"
              data-sonic-action="nav"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-8 py-4 text-sm font-semibold text-white shadow-[0_6px_24px_rgba(106,60,255,0.3)] transition-all hover:shadow-[0_8px_28px_rgba(106,60,255,0.4)]"
            >
              <Zap size={18} />
              Esplora ora
            </Link>
            <Link
              href="/wishlist"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(106,60,255,0.12)] bg-[rgba(255,255,255,0.5)] px-8 py-4 text-sm font-semibold text-[#120d2f] backdrop-blur-md transition-all hover:bg-[rgba(106,60,255,0.06)] hover:border-[rgba(106,60,255,0.25)]"
            >
              Suggerisci un tool
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
