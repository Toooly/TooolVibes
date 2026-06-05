import type { Metadata } from "next";
import { Activity, MessageCircle, TrendingUp } from "lucide-react";

import { DesktopVibeRadar } from "@/components/desktop/desktop-vibe-radar";
import { MobileRadarCanvas } from "@/components/radar/mobile-radar-canvas";
import { ProductHuntRankings } from "@/components/product-hunt/product-hunt-rankings";
import { PremiumLink } from "@/components/ui/premium";
import { PageOrbitShell } from "@/components/app/orbital-system";
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
    <PageOrbitShell sectionId="radar-page" label="Radar" items={radarItems}>
      <>
        <DesktopVibeRadar />

        <div className="tone-radar page-shell space-y-4 pb-14 pt-6 sm:space-y-6 sm:pb-18 sm:pt-9 lg:hidden">
          <section className="hero-shell hero-shell-radar motion-reveal px-5 py-5 sm:rounded-[38px] sm:px-7 sm:py-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.52fr)] lg:items-center">
              <div className="max-w-[48rem]">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/58">
                  Product Hunt radar
                </p>
                <h1 className="mt-4 max-w-[13ch] text-[clamp(2rem,9vw,3.35rem)] leading-[1.05] text-white">
                  I lanci si muovono dentro un radar 3D.
                </h1>
                <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-white/70 sm:mt-5 sm:text-[1rem]">
                  Il radar non è più un blocco appoggiato alla pagina: la classifica vive come
                  una sala di segnali, con orbite, sweep e card agganciate alla profondità del sito.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <PremiumLink href="/archivio">Esplora la directory</PremiumLink>
                  <PremiumLink href="/wishlist" tone="secondary">
                    Suggerisci un tool
                  </PremiumLink>
                </div>
              </div>
            </div>

            {/* Mobile Radar Visual */}
            <div className="relative mt-6 h-72 w-full overflow-hidden rounded-[28px] border border-white/12 bg-[rgba(12,8,38,0.55)] sm:h-80">
              <MobileRadarCanvas />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center gap-4 pb-3">
                {[
                  { icon: Activity, label: "Rank" },
                  { icon: MessageCircle, label: "Segnali" },
                  { icon: TrendingUp, label: "Trend" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80 backdrop-blur-md"
                    >
                      <Icon className="size-3" aria-hidden="true" />
                      {item.label}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>

          <div id="rankings">
            <ProductHuntRankings variant="wide" className="mx-auto max-w-[70rem]" />
          </div>
        </div>
      </>
    </PageOrbitShell>
  );
}
