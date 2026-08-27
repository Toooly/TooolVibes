import type { Metadata } from "next";

import { MobileShortlistBoard } from "@/components/tools/mobile-shortlist-board";
import { ShortlistRouteGate } from "@/components/tools/shortlist-route-gate";
import { releaseFeatures } from "@/lib/config/release-features";
import { getPublishedTools } from "@/lib/data/public-tools";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import "./shortlist.css";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Salvati",
  description: "La tua shortlist operativa: raccogli i candidati, annota il motivo e riprendi il confronto quando vuoi.",
  path: "/shortlist",
});

export default async function ShortlistPage() {
  return (
    <ShortlistRouteGate>
      <div className="shortlist-final-surface">
        <MobileShortlistBoard
          tools={await getPublishedTools()}
          decisionMemoryEnabled={releaseFeatures.decisionMemoryBoard.enabled}
        />
      </div>
    </ShortlistRouteGate>
  );
}
