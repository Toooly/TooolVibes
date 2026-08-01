import type { Metadata } from "next";

import { ToolBattleView } from "@/components/tools/tool-battle-view";
import { releaseFeatures } from "@/lib/config/release-features";
import { getPublicToolViews } from "@/lib/data/public-tools";
import { createPublicPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = createPublicPageMetadata({
  title: "Confronto tool",
  description: "Confronta tool salvati e alternative per scegliere lo stack piu adatto.",
  path: "/compare",
});

export default async function ComparePage() {
  const tools = await getPublicToolViews();

  return (
    <div className="compare-space-page">
      <ToolBattleView
        tools={tools}
        objectiveEnabled={releaseFeatures.compareObjective.enabled}
        decisionEnabled={releaseFeatures.compareDecision.enabled}
        showIntro
      />
    </div>
  );
}
