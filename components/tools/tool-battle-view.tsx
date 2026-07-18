"use client";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { useCompareObjective } from "@/lib/hooks/use-compare-objective";
import { MobileCompareView } from "./mobile-compare-view";
import { DesktopCompareView } from "./desktop-compare-view";

export function ToolBattleView({
  tools,
  objectiveEnabled = true,
}: {
  tools: ToolPublicView[];
  /** Flag B34 (TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED): OFF = contratto base B33. */
  objectiveEnabled?: boolean;
}) {
  // B34 / FLOW-603: un solo stato obiettivo condiviso tra le due superfici
  // (entrambe restano montate): la selezione fatta su mobile si riflette
  // identica su desktop e viceversa, e sopravvive al reload.
  const { objective, setObjective } = useCompareObjective();

  return (
    <>
      <div className="md:hidden">
        <MobileCompareView
          tools={tools}
          objective={objective}
          onObjectiveChange={setObjective}
          objectiveEnabled={objectiveEnabled}
        />
      </div>
      <div className="hidden md:block">
        <DesktopCompareView
          tools={tools}
          objective={objective}
          onObjectiveChange={setObjective}
          objectiveEnabled={objectiveEnabled}
        />
      </div>
    </>
  );
}
