import type { Metadata } from "next";

import { MemberPreviewGate } from "@/components/account/member-preview-gate";
import { RadarExperience } from "@/components/radar/radar-experience";
import { radarDesktopVisual } from "@/lib/radar/radar-view-config";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

/**
 * SEO Radar. Title is the product noun + job, not the source brand.
 * Root layout applies `%s | TooolVibes`.
 */
export const metadata: Metadata = createPublicPageMetadata({
  title: "Radar: lanci da seguire",
  description:
    "Lanci reali, ordinati per periodo. Consulta la mappa o l'elenco e individua i segnali da approfondire.",
  path: "/radar",
  openGraphDescription:
    "Lanci reali organizzati per periodo, con mappa, elenco e collegamento alla fonte.",
});

export default function RadarPage() {
  return (
    <MemberPreviewGate
      kicker="Radar completo"
      title="Accedi per esplorare tutti i segnali"
      body="La preview in homepage è pubblica. Il Radar completo con mappa, elenco esteso e strumenti di analisi è riservato ai membri."
    >
      <RadarExperience initialVisual={radarDesktopVisual} />
    </MemberPreviewGate>
  );
}
