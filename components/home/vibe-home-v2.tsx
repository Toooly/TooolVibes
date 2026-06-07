"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useTextAvoidance } from "@/lib/hooks/use-text-avoidance";
import { MobileHeroSolar } from "./mobile-hero-solar";
import { MobileSpotlight } from "./mobile-spotlight";
import { MobileMethodSteps } from "./mobile-method-steps";

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
  const initials =
    words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
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
    title: "Parti da tool gia curati",
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

interface HomeOrbitStageProps {
  sectionId: string;
  label: string;
  title: string;
  description?: string;
  items: OrbitalItem[];
  align?: "left" | "right";
  isHero?: boolean;
  primaryAction?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
}

function HomeOrbitStage({
  sectionId,
  label,
  title,
  description,
  items,
  align = "left",
  isHero,
  primaryAction,
  secondaryAction,
}: HomeOrbitStageProps) {
  const router = useRouter();
  const [isCompact, setIsCompact] = useState(false);
  const orbitSystemRef = useRef<HTMLDivElement>(null);
  useTextAvoidance(orbitSystemRef);

  useEffect(() => {
    const update = () => setIsCompact(window.innerWidth < 768);
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxVisible = isCompact ? 5 : 9;
  const visibleItems = items.slice(0, maxVisible);
  const ringRadii = isCompact ? [120, 186] : [150, 234, 318];
  const ringCounts = isCompact ? [2, 3] : [3, 3, 3];

  let assigned = 0;
  const ringForIndex: number[] = [];
  const stepForIndex: number[] = [];
  ringCounts.forEach((count, rIdx) => {
    for (let sIdx = 0; sIdx < count && assigned < visibleItems.length; sIdx++, assigned++) {
      ringForIndex.push(rIdx);
      stepForIndex.push(sIdx);
    }
  });

  return (
    <section
      className={`home-orbit-stage home-orbit-stage--${align} catalog-orbit-stage relative z-10 min-h-[calc(100svh-4rem)] md:min-h-[calc(92svh-4rem)] overflow-hidden px-4 pt-24 pb-32 md:px-8 lg:px-12 lg:pt-20 lg:pb-24`}
      aria-label={title}
      data-home-orbit-stage={sectionId}
    >
      <div className="home-orbit-hud catalog-orbit-hud" data-orbit-shield data-text-zone="true">
        <p>{label}</p>
        {isHero ? <h1>{title}</h1> : <h2>{title}</h2>}
        {description && <span>{description}</span>}
        {(primaryAction || secondaryAction) && (
          <div className="home-orbit-hud__actions">
            {primaryAction && (
              <Link href={primaryAction.href} className="home-orbit-hud__action home-orbit-hud__action--primary">
                {primaryAction.label}
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            )}
            {secondaryAction && (
              <Link href={secondaryAction.href} className="home-orbit-hud__action">
                {secondaryAction.label}
              </Link>
            )}
          </div>
        )}
      </div>

      <div
        ref={orbitSystemRef}
        className="home-orbit-system catalog-orbit-system"
        aria-label={`${label}: nodi interattivi`}
      >
        <div className="catalog-orbit-depth" aria-hidden="true" />
        {ringRadii.map((radius, index) => (
          <span
            key={radius}
            className="catalog-orbit-ring"
            style={{
              "--ring-radius": `${radius}px`,
              "--ring-width": `${radius * 2}px`,
              "--ring-height": `${Math.round(radius * 0.72)}px`,
              "--ring-opacity": `${0.38 - index * 0.06}`,
            } as CSSProperties}
          />
        ))}
        <div className="catalog-orbit-planet home-orbit-planet" aria-hidden="true">
          <span />
        </div>

        {visibleItems.map((item, index) => {
          const ringIndex = isCompact ? (ringForIndex[index] ?? 0) : (index % ringRadii.length);
          const stepIndex = isCompact ? (stepForIndex[index] ?? 0) : Math.floor(index / ringRadii.length);
          const sameRingCount = isCompact ? (ringCounts[ringIndex] ?? 1) : Math.ceil(visibleItems.length / ringRadii.length);
          const nodePriority = isCompact ? (index < 2 ? "principal" : index === 2 ? "secondary" : "atmospheric") : "";
          const angle = (stepIndex / Math.max(1, sameRingCount)) * 360 + ringIndex * 34 + (align === "right" ? 18 : -10);
          const isPrimary = item.variant === "route" || item.variant === "featured" || item.size === "lg";
          const color = item.color ?? "#6a3cff";
          const Icon =
            item.iconName && item.iconName in HOME_ICON_MAP
              ? HOME_ICON_MAP[item.iconName as keyof typeof HOME_ICON_MAP]
              : Sparkles;
          const nodeStyle = {
            "--orbit-angle": `${angle}deg`,
            "--orbit-angle-back": `${-angle}deg`,
            "--orbit-radius": `clamp(${ringRadii[ringIndex] * 0.74}px, ${21 + ringIndex * 9}vw, ${ringRadii[ringIndex]}px)`,
            "--orbit-depth": `${ringIndex * 24}px`,
            "--orbit-duration": `${32 + ringIndex * 8}s`,
            "--orbit-delay": `${index * -1.45}s`,
            "--node-color": color,
            "--node-size": isCompact
              ? (nodePriority === "principal" ? "3.5rem" : nodePriority === "secondary" ? "2.25rem" : "2rem")
              : (isPrimary ? "6rem" : "5rem"),
          } as CSSProperties;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`catalog-orbit-node home-orbit-node${nodePriority ? ` home-orbit-node--${nodePriority}` : ""} home-orbit-node--${item.variant ?? "tool"}${index >= 5 ? " home-orbit-node--compact-extra" : ""}`}
              style={nodeStyle}
              aria-label={`${item.title}. ${item.description}`}
              onClick={(event) => {
                if (!item.href.startsWith("/")) return;
                event.preventDefault();
                router.push(item.href);
              }}
            >
              <span className="catalog-orbit-node__halo" aria-hidden="true" />
              <span className="catalog-orbit-node__body">
                {item.iconUrl ? (
                  <img src={item.iconUrl} alt="" loading="lazy" decoding="async" />
                ) : item.variant === "tool" ? (
                  <strong>{item.initials.slice(0, 2)}</strong>
                ) : (
                  <Icon aria-hidden="true" />
                )}
              </span>
              <span className="catalog-orbit-node__label">
                <strong>{item.title}</strong>
                <small>{item.meta ?? item.category}</small>
              </span>
              {item.badge && <span className="home-orbit-node__badge">{item.badge}</span>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export function VibeHomeV2({ tools, weeklyTool, supportingTools }: VibeHomeV2Props) {
  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0];
  const displayTools = [
    ...featuredTools.filter((tool) => tool.slug !== focusTool?.slug),
    ...tools.filter((tool) => tool.slug !== focusTool?.slug),
  ].slice(0, 6);

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

  const solarRoutes = [
    {
      id: "solar-catalogo",
      label: "Catalogo",
      href: "/archivio",
      color: "#6a3cff",
      icon: "Compass" as const,
    },
    {
      id: "solar-radar",
      label: "Radar",
      href: "/product-hunt",
      color: "#39d2f6",
      icon: "Radar" as const,
      badge: "LIVE",
    },
    {
      id: "solar-shortlist",
      label: "Shortlist",
      href: "/shortlist",
      color: "#f3bf4c",
      icon: "Bookmark" as const,
    },
    {
      id: "solar-confronta",
      label: "Confronta",
      href: "/compare",
      color: "#10b981",
      icon: "GitCompare" as const,
    },
    {
      id: "solar-top-tool",
      label: "Top Tool",
      href: focusTool ? `/toools/${focusTool.slug}` : "/archivio",
      color: "#ec4899",
      icon: "Sparkles" as const,
    },
  ];

  const methodSteps = decisionSteps.map((ds) => ({
    icon: ds.icon,
    label: ds.label,
    title: ds.title,
    description: ds.description,
    href: ds.href,
    color: ds.color,
  }));

  return (
    <div className="relative">
      {/* Mobile: Opzione C — Sistema Solare Editoriale */}
      <div className="md:hidden">
        <MobileHeroSolar routes={solarRoutes} />
        {focusTool && <MobileSpotlight tool={focusTool} supportingTools={supportingTools} />}
        <MobileMethodSteps steps={methodSteps} />
      </div>

      {/* Desktop: 6 stage orbitali esistenti */}
      <div className="hidden md:block">
        <HomeOrbitStage
          sectionId="home-hero"
          label="Sistema TooolVibes"
          title="Scegli tool AI validi senza attraversare il rumore."
          description="TooolVibes seleziona e confronta tool AI e SaaS utili. Nessuna vetrina infinita: solo nodi curati da esplorare, salvare e provare."
          items={heroItems}
          isHero
          primaryAction={{ label: "Catalogo", href: "/archivio" }}
          secondaryAction={{ label: "Radar", href: "/product-hunt" }}
        />

        <HomeOrbitStage
          sectionId="home-routes"
          label="Percorsi principali"
          title="Scegli la tua prossima rotta"
          description="Catalogo, Radar e Collection: tre orbite per scoprire, monitorare e approfondire i tool più utili."
          items={routeItems}
          align="right"
        />

        <HomeOrbitStage
          sectionId="home-decision"
          label="Metodo"
          title="Discover, Compare, Shortlist"
          description="Un percorso chiaro: scopri, confronta, decidi. Senza perdere tempo tra decine di schede uguali."
          items={decisionItems}
        />

        {focusTool && (
          <HomeOrbitStage
            sectionId="home-weekly"
            label="Tool della settimana"
            title={focusTool.name}
            description={focusTool.whyItMatters}
            items={weeklyItems}
            align="right"
            primaryAction={{ label: "Apri tool", href: `/toools/${focusTool.slug}` }}
          />
        )}

        <HomeOrbitStage
          sectionId="home-catalog"
          label="Catalogo vivo"
          title="Alternative reali, in orbita"
          description="Esplora nodi reali: ogni pianeta e un tool selezionato, pronto da aprire o confrontare."
          items={catalogItems}
          primaryAction={{ label: "Vedi tutti", href: "/archivio" }}
          secondaryAction={{ label: "Confronta", href: "/compare" }}
        />

        <HomeOrbitStage
          sectionId="home-final"
          label="Shortlist"
          title="Costruisci la tua shortlist operativa"
          description="Salva i tool che contano. Costruisci la tua shortlist operativa in pochi click."
          items={decisionItems.slice(1)}
          align="right"
          primaryAction={{ label: "Esplora ora", href: "/archivio" }}
          secondaryAction={{ label: "Wishlist", href: "/wishlist" }}
        />
      </div>
    </div>
  );
}
