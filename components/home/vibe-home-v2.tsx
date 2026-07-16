"use client";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { NativePlacement } from "@/components/monetization/native-placement";
import { MobileHeroSolar } from "./mobile-hero-solar";
import { MobileMethodSteps } from "./mobile-method-steps";
import { MobileSpotlight } from "./mobile-spotlight";

type VibeHomeV2Props = {
  tools: ToolPublicView[];
  weeklyTool?: ToolPublicView | null;
  supportingTools: ToolPublicView[];
};

const methodSteps = [
  {
    icon: "Search" as const,
    label: "Scopri",
    title: "Parti da tool già curati",
    description: "Categorie leggibili, filtri utili e una selezione editoriale che tiene fuori il rumore.",
    href: "/archivio",
    color: "#6a3cff",
  },
  {
    icon: "GitCompare" as const,
    label: "Confronta",
    title: "Confronta solo i candidati forti",
    description: "Porta avanti pochi tool alla volta e guarda differenze, livello e casi d'uso reali.",
    href: "/compare",
    color: "#39d2f6",
  },
  {
    icon: "Bookmark" as const,
    label: "Salva",
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
      href: "/radar",
      color: "#39d2f6",
      icon: "Radar" as const,
      badge: "Ora",
    },
    {
      id: "solar-shortlist",
      label: "Salvati",
      href: "/shortlist",
      color: "#f3bf4c",
      icon: "Bookmark" as const,
    },
    {
      id: "solar-confronta",
      label: "Confronto",
      href: "/compare",
      color: "#10b981",
      icon: "GitCompare" as const,
    },
    {
      id: "solar-top-tool",
      label: "Tool scelto",
      href: focusTool ? `/toools/${focusTool.slug}` : "/archivio",
      color: "#ec4899",
      icon: "Sparkles" as const,
    },
  ];

  return (
    <div className="vibe-home-mobile-origin relative">
      <MobileHeroSolar routes={solarRoutes} />
      {focusTool && <MobileSpotlight tool={focusTool} supportingTools={supportingTools} />}
      <section className="page-shell sm:hidden">
        <NativePlacement placementKey="home-featured-tool" variant="compact" />
      </section>
      <MobileMethodSteps steps={methodSteps} />
    </div>
  );
}
