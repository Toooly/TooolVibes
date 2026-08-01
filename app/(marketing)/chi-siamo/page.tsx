import type { Metadata } from "next";

import { AboutPage } from "@/components/about/about-page";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Chi siamo",
  description:
    "Scopri il team TooolVibes, il metodo e i servizi digitali che offriamo a founder, creator e team.",
  path: "/chi-siamo",
  openGraphDescription:
    "Il team TooolVibes, il metodo e i servizi digitali per costruire prodotti piu chiari e vivi.",
});

export default function ChiSiamoPage() {
  return <AboutPage />;
}
