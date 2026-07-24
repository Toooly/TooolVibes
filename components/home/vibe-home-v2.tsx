"use client";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import type { HomeLayout } from "@/lib/config/home-experience";
import { NativePlacement } from "@/components/monetization/native-placement";
import { MobileHeroSolar } from "./mobile-hero-solar";
import { HomeRadarPreview } from "./home-radar-preview";
import { MobileMethodSteps } from "./mobile-method-steps";
import { MobileSpotlight } from "./mobile-spotlight";

type VibeHomeV2Props = {
  tools: ToolPublicView[];
  weeklyTool?: ToolPublicView | null;
  supportingTools: ToolPublicView[];
  /* BATCH 40 (MOB-704): "legacy" = composizione originale; "time-to-value"
     = discovery stage a flusso e margini mobile corretti (flag
     TOOOLVIBES_HOME_LAYOUT, lib/config/home-experience.ts). L'ordine delle
     sezioni resta invariato in entrambe le modalita': lo stage orbitale
     possiede l'offset dell'header fixed.
     FIX-1 (post-Phase 7 audit): il MobileHeroSolar (discovery stage) è
     SEMPRE renderizzato nella composizione. La feature 3D desktop
     (Home3DHero) è già nascosta da CSS sotto 768px e può coesistere con
     l'hero mobile nel render tree. Non esiste più alcun conditional che
     leghi il rendering dell'hero mobile a threeD.enabled. */
  layout?: HomeLayout;
};

const methodSteps = [
  {
    icon: "Search" as const,
    label: "Scopri",
    title: "Parti da tool già curati",
    description: "Categorie leggibili, filtri utili e una selezione editoriale che tiene fuori il rumore.",
    href: "/archivio",
    color: "var(--tv-accent-primary)",
  },
  {
    icon: "GitCompare" as const,
    label: "Confronta",
    title: "Confronta solo i candidati forti",
    description: "Porta avanti pochi tool alla volta e guarda differenze, livello e casi d'uso reali.",
    href: "/compare",
    color: "var(--tv-accent-cyan)",
  },
  {
    icon: "Bookmark" as const,
    label: "Salva",
    title: "Chiudi con una scelta rapida",
    description: "Salva, rivedi e trasforma la ricerca in una lista operativa pronta da provare.",
    href: "/shortlist",
    color: "var(--tv-accent-gold)",
  },
];

export function VibeHomeV2({
  tools,
  weeklyTool,
  supportingTools,
  layout = "legacy",
}: VibeHomeV2Props) {
  const featuredTools = tools.filter((tool) => tool.featured);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0] ?? null;
  const isTimeToValue = layout === "time-to-value";

  const solarRoutes = [
    {
      id: "solar-catalogo",
      label: "Catalogo",
      href: "/archivio",
      color: "var(--tv-accent-primary)",
      icon: "Compass" as const,
    },
    {
      id: "solar-radar",
      label: "Radar",
      href: "/radar",
      color: "var(--tv-accent-cyan)",
      icon: "Radar" as const,
      badge: "Ora",
    },
    {
      id: "solar-shortlist",
      label: "Salvati",
      href: "/shortlist",
      color: "var(--tv-accent-gold)",
      icon: "Bookmark" as const,
    },
    {
      id: "solar-confronta",
      label: "Confronto",
      href: "/compare",
      color: "var(--tv-accent-cyan)",
      icon: "GitCompare" as const,
    },
    {
      id: "solar-top-tool",
      label: "Tool scelto",
      href: focusTool ? `/toools/${focusTool.slug}` : "/archivio",
      color: "var(--tv-accent-primary)",
      icon: "Sparkles" as const,
    },
  ];

  return (
    <div
      className={`vibe-home-mobile-origin${isTimeToValue ? " vibe-home-mobile-origin--ttv" : ""} relative`}
      data-home-layout={layout}
    >
      <MobileHeroSolar routes={solarRoutes} compact={isTimeToValue} />
      <HomeRadarPreview fallbackNodes={solarRoutes} />
      {focusTool && <MobileSpotlight tool={focusTool} supportingTools={supportingTools} />}
      <section className="page-shell sm:hidden">
        <NativePlacement placementKey="home-featured-tool" variant="compact" dark={true} />
      </section>
      <MobileMethodSteps steps={methodSteps} />
    </div>
  );
}
