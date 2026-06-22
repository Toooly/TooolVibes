import type { Metadata } from "next";

import { AboutPage } from "@/components/about/about-page";
import { siteConfig } from "@/lib/config/site";

export const metadata: Metadata = {
  title: "Chi siamo",
  description:
    "Scopri il team TooolVibes, il metodo e i servizi digitali che offriamo a founder, creator e team.",
  openGraph: {
    title: `Chi siamo | ${siteConfig.name}`,
    description:
      "Il team TooolVibes, il metodo e i servizi digitali per costruire prodotti piu chiari e vivi.",
    url: `${siteConfig.url}/chi-siamo`,
  },
};

export default function ChiSiamoPage() {
  return <AboutPage />;
}
