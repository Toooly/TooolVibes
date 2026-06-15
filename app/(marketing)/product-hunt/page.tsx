import type { Metadata } from "next";

import { MobileRadarView } from "@/components/radar/mobile-radar-view";
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

export default function ProductHuntPage() {
  return <MobileRadarView />;
}
