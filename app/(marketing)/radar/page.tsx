import type { Metadata } from "next";

import { RadarViewSwitch } from "@/components/radar/radar-view-switch";
import { releaseFeatures } from "@/lib/config/release-features";
import { siteConfig } from "@/lib/config/site";
import { radarDesktopVisual } from "@/lib/radar/radar-view-config";

export const metadata: Metadata = {
  title: "Radar",
  description:
    "Il radar TooolVibes con i migliori lanci Product Hunt del giorno, della settimana e del mese.",
  openGraph: {
    title: `Radar | ${siteConfig.name}`,
    description:
      "Scopri i lanci e i segnali esterni più interessanti selezionati da TooolVibes.",
    url: `${siteConfig.url}/radar`,
  },
};

export default function RadarPage() {
  return (
    <RadarViewSwitch
      threeDEnabled={releaseFeatures.threeD.enabled}
      initialDesktopVisual={radarDesktopVisual}
    />
  );
}
