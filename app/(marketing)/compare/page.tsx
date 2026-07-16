import type { Metadata } from "next";

import { Compare3DHero } from "@/components/3d-maestoso/compare-3d-hero";
import { ToolBattleView } from "@/components/tools/tool-battle-view";
import { releaseFeatures } from "@/lib/config/release-features";
import { getPublishedTools } from "@/lib/data/public-tools";
import { directoryTools } from "@/lib/data/tooolvibes-directory";

export const metadata: Metadata = {
  title: "Confronto tool",
  description: "Confronta tool salvati e alternative per scegliere lo stack piu adatto.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const tools = await getPublishedTools();

  return (
    <div className="compare-space-page">
      {releaseFeatures.threeD.enabled && <Compare3DHero />}
      <ToolBattleView directoryTools={directoryTools} legacyTools={tools} />
    </div>
  );
}
