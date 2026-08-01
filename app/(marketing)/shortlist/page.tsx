import type { Metadata } from "next";

import { MobileShortlistBoard } from "@/components/tools/mobile-shortlist-board";
import { releaseFeatures } from "@/lib/config/release-features";
import { getPublishedTools } from "@/lib/data/public-tools";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import "./shortlist.css";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Salvati",
  description: "Raccogli, organizza e confronta i tool che hai salvato.",
  path: "/shortlist",
});

export default async function ShortlistPage() {
  return (
    <div className="shortlist-final-surface">
      <MobileShortlistBoard
        tools={await getPublishedTools()}
        decisionMemoryEnabled={releaseFeatures.decisionMemoryBoard.enabled}
      />
    </div>
  );
}
