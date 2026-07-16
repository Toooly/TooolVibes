import type { Metadata } from "next";

import { MobileShortlistBoard } from "@/components/tools/mobile-shortlist-board";
import { getPublishedTools } from "@/lib/data/public-tools";

export const metadata: Metadata = {
  title: "Salvati",
  description: "Raccogli, organizza e confronta i tool salvati nella tua shortlist.",
  alternates: { canonical: "/shortlist" },
};

export default async function ShortlistPage() {
  return <MobileShortlistBoard tools={await getPublishedTools()} />;
}
