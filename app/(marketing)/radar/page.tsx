import type { Metadata } from "next";

import { RadarExperience } from "@/components/radar/radar-experience";
import { radarDesktopVisual } from "@/lib/radar/radar-view-config";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Radar",
  description:
    "Il radar TooolVibes con i migliori lanci Product Hunt del giorno, della settimana e del mese.",
  path: "/radar",
  openGraphDescription:
    "Scopri i lanci e i segnali esterni più interessanti selezionati da TooolVibes.",
});

export default function RadarPage() {
  return <RadarExperience initialVisual={radarDesktopVisual} />;
}
