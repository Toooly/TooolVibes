import type { Metadata } from "next";

import { DesktopVibeRadar } from "@/components/desktop/desktop-vibe-radar";
import { MobileRadarView } from "@/components/radar/mobile-radar-view";
import { releaseFeatures } from "@/lib/config/release-features";
import { siteConfig } from "@/lib/config/site";

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
    <>
      <DesktopVibeRadar threeDEnabled={releaseFeatures.threeD.enabled} />
      <div className="lg:hidden">
        <MobileRadarView />
      </div>
    </>
  );
}
