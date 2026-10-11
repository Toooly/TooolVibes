import type { Metadata } from "next";

import { MemberOnlyGate } from "@/components/account/member-only-gate";
import { RadarExperience } from "@/components/radar/full-radar-experience";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

/**
 * FULL Radar — logged-only intelligence surface (spec §3).
 *
 * Auth contract: `MemberOnlyGate` renders NOTHING of the Radar for guests
 * (no `inert` preview, no data fetch) and resolves access through the
 * canonical `useAccount()` status. Presentation cookies never grant access.
 *
 * The Home Radar preview stays public and lives in
 * `components/radar/home-radar-preview.tsx` (frozen).
 */
export const metadata: Metadata = createPublicPageMetadata({
  title: "Radar: cosa sta emergendo adesso",
  description:
    "Mappa radiale dei lanci AI reali, trend, opportunità personali e watchlist. Dati di mercato da Product Hunt, spiegati.",
  path: "/radar",
  openGraphDescription:
    "Scopri cosa sta emergendo nell'AI: mappa, trend, segnali personali e watchlist.",
});

export default function RadarPage() {
  return (
    <MemberOnlyGate
      kicker="Radar completo"
      title="Accedi per esplorare tutti i segnali"
      body="La preview in homepage è pubblica. Il Radar completo con mappa, trend, Per te e Watchlist è riservato ai membri."
    >
      <RadarExperience />
    </MemberOnlyGate>
  );
}
