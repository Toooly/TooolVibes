import type { Metadata } from "next";

import { MobileShortlistBoard } from "@/components/tools/mobile-shortlist-board";
import { ShortlistRouteGate } from "@/components/tools/shortlist-route-gate";
import { releaseFeatures } from "@/lib/config/release-features";
import { getPublishedTools, getPublicToolFilterGroups } from "@/lib/data/public-tools";
import { createPublicPageMetadata } from "@/lib/seo/metadata";
import "./shortlist.css";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Salvati: shortlist di tool",
  description: "La tua shortlist operativa: raccogli i candidati, annota il motivo e riprendi il confronto quando vuoi.",
  path: "/shortlist",
});

export default async function ShortlistPage() {
  const [tools, filterGroups] = await Promise.all([
    getPublishedTools(),
    getPublicToolFilterGroups(),
  ]);

  return (
    <ShortlistRouteGate>
      <div className="shortlist-final-surface">
        <MobileShortlistBoard
          tools={tools}
          categoryCount={filterGroups.filter((group) => group.key !== "all").length}
          decisionMemoryEnabled={releaseFeatures.decisionMemoryBoard.enabled}
        />
      </div>
    </ShortlistRouteGate>
  );
}
