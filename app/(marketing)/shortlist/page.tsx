import type { Metadata } from "next";

import { MobileShortlistBoard } from "@/components/tools/mobile-shortlist-board";
import { releaseFeatures } from "@/lib/config/release-features";
import { getPublishedTools } from "@/lib/data/public-tools";

export const metadata: Metadata = {
  title: "Salvati",
  description: "Raccogli, organizza e confronta i tool salvati nella tua shortlist.",
  alternates: { canonical: "/shortlist" },
};

export default async function ShortlistPage() {
  return (
    <MobileShortlistBoard
      tools={await getPublishedTools()}
      decisionMemoryEnabled={releaseFeatures.decisionMemoryBoard.enabled}
    />
  );
}
