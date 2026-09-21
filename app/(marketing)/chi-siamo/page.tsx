import type { Metadata } from "next";

import { AboutPage } from "@/components/about/about-page";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Chi siamo",
  description:
    "Il team e il metodo dietro TooolVibes, il sistema decisionale per scegliere software con criterio.",
  path: "/chi-siamo",
  openGraphDescription:
    "Il team TooolVibes, il metodo e i servizi digitali per costruire prodotti più chiari e vivi.",
});

export default function ChiSiamoPage() {
  return <AboutPage />;
}
