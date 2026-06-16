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
    color: "var(--tv-brand-primary)",
  },
  {
    icon: "GitCompare" as const,
    label: "Compare",
    title: "Confronta solo i candidati forti",
    description: "Porta avanti pochi tool alla volta e guarda differenze, livello e casi d'uso reali.",
    href: "/compare",
    color: "var(--tv-brand-secondary)",
  },
  {
    icon: "Bookmark" as const,
    label: "Shortlist",
    title: "Chiudi con una scelta rapida",
    description: "Salva, rivedi e trasforma la ricerca in una lista operativa pronta da provare.",
    href: "/shortlist",
    color: "var(--tv-warning)",
  },
];

export function VibeHomeV2({ tools, weeklyTool, supportingTools }: VibeHomeV2Props) {
  const featuredTools = tools.filter((tool) => tool.featured);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0] ?? null;

  return (
    <div className="vibe-home-mobile-origin relative">
      <MobileHeroSolar focusTool={focusTool} supportingTools={supportingTools} />
      {focusTool && <MobileSpotlight tool={focusTool} supportingTools={supportingTools} />}
      <MobileMethodSteps steps={methodSteps} />
    </div>
  );
}
