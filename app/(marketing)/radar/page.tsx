import type { Metadata } from "next";

import { RadarExperience } from "@/components/radar/radar-experience";
import { radarDesktopVisual } from "@/lib/radar/radar-view-config";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

/**
 * SEO Radar V2 (2026-08-03).
 *
 * Source title "Radar Product Hunt" — il layout globale applica il
 * template `%s | TooolVibes` quindi il title finale sarà
 * "Radar Product Hunt | TooolVibes" senza duplicare il brand.
 */
export const metadata: Metadata = createPublicPageMetadata({
  title: "Radar Product Hunt",
  description:
    "Segui i lanci di Product Hunt, organizzati per periodo. Consulta la mappa o l'elenco e individua i segnali da approfondire.",
  path: "/radar",
  openGraphTitle: "Radar TooolVibes · Segnali da Product Hunt",
  openGraphDescription:
    "Lanci reali organizzati per periodo, con mappa, elenco e collegamento alla fonte. Nessun dato simulato.",
});

export default function RadarPage() {
  return <RadarExperience initialVisual={radarDesktopVisual} />;
}
