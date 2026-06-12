import type { Metadata } from "next";

import { MobileRadarView } from '@/components/radar/mobile-radar-view';
import { ProductHuntRankings } from "@/components/product-hunt/product-hunt-rankings";
import { PageOrbitShell } from "@/components/app/orbital-system";
import { RadarGameMissions } from "@/components/gamification/radar-game-missions";
import type { OrbitalItem } from "@/components/app/orbital-system";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Product Hunt Top",
  description:
    "Classifica dei migliori lanci Product Hunt del giorno, della settimana e del mese dentro TooolVibes.",
  openGraph: {
    title: `Product Hunt Top | ${siteConfig.name}`,
    description:
      "Classifica dei migliori lanci Product Hunt del giorno, della settimana e del mese.",
    url: `${siteConfig.url}/product-hunt`,
  },
};

const radarItems: OrbitalItem[] = [
  {
    id: "radar-today",
    title: "Oggi",
    initials: "OG",
    description: "I lanci Product Hunt più votati di oggi.",
    category: "Radar",
    href: "#rankings",
    sectionId: "radar-page",
    priority: 1,
    color: "#6a3cff",
  },
  {
    id: "radar-week",
    title: "Settimana",
    initials: "ST",
    description: "I lanci che hanno dominato la settimana su Product Hunt.",
    category: "Radar",
    href: "#rankings",
    sectionId: "radar-page",
    priority: 1,
    color: "#39d2f6",
  },
  {
    id: "radar-month",
    title: "Mese",
    initials: "ME",
    description: "I prodotti più forti del mese in classifica.",
    category: "Radar",
    href: "#rankings",
    sectionId: "radar-page",
    priority: 1,
    color: "#f3bf4c",
  },
  {
    id: "radar-signals",
    title: "Segnali",
    initials: "SE",
    description: "Commenti e voti validi per capire il vero valore di un lancio.",
    category: "Radar",
    href: "#rankings",
    sectionId: "radar-page",
    priority: 1,
    color: "#8b6cff",
  },
];

export default function ProductHuntPage() {
  return (
    <>
      {/* Mobile: Sala Comandi Full-Screen */}
      <div className="md:hidden">
        <MobileRadarView />
      </div>

      {/* Desktop: Classifica pulita */}
      <div className="hidden md:block">
        <PageOrbitShell sectionId="radar-page" label="Radar" items={radarItems}>
          <div className="tone-radar page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9">
            <section className="hero-shell hero-shell-radar motion-reveal px-5 py-5 sm:rounded-[38px] sm:px-7 sm:py-8">
              <div className="max-w-[48rem]">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/58">
                  Product Hunt radar
                </p>
                <h1 className="mt-4 max-w-[13ch] text-[clamp(2rem,9vw,3.35rem)] leading-[1.05] text-white">
                  I lanci più forti del momento.
                </h1>
                <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-white/70 sm:mt-5 sm:text-[1rem]">
                  Classifica live dei prodotti più votati su Product Hunt: giorno, settimana e mese in una vista unica.
                </p>
              </div>
            </section>

            <section className="mx-auto max-w-[70rem]">
              <RadarGameMissions />
            </section>

            <div id="rankings-page">
              <ProductHuntRankings variant="wide" className="mx-auto max-w-[70rem]" />
            </div>
          </div>
        </PageOrbitShell>
      </div>
    </>
  );
}
