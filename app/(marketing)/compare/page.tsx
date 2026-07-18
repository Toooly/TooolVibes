import type { Metadata } from "next";

import { Compare3DHero } from "@/components/3d-maestoso/compare-3d-hero";
import { ToolBattleView } from "@/components/tools/tool-battle-view";
import { releaseFeatures } from "@/lib/config/release-features";
import { getPublicToolViews } from "@/lib/data/public-tools";

export const metadata: Metadata = {
  title: "Confronto tool",
  description: "Confronta tool salvati e alternative per scegliere lo stack piu adatto.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const tools = await getPublicToolViews();

  return (
    <div className="compare-space-page">
      {releaseFeatures.threeD.enabled && <Compare3DHero />}
      <ToolBattleView
        tools={tools}
        objectiveEnabled={releaseFeatures.compareObjective.enabled}
      />
    </div>
  );
}
