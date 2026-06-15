"use client";

import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { MobileHeroSolar } from "./mobile-hero-solar";
import { MobileMethodSteps } from "./mobile-method-steps";
import { MobileSpotlight } from "./mobile-spotlight";

type VibeHomeV2Props = {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
  supportingTools: DirectoryTool[];
};

const methodSteps = [
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

export function VibeHomeV2({ tools, weeklyTool, supportingTools }: VibeHomeV2Props) {
  const featuredTools = tools.filter((tool) => tool.featured);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0] ?? null;

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

  return (
    <div className="vibe-home-mobile-origin relative">
      <MobileHeroSolar routes={solarRoutes} />
      {focusTool && <MobileSpotlight tool={focusTool} supportingTools={supportingTools} />}
      <MobileMethodSteps steps={methodSteps} />
    </div>
  );
}
