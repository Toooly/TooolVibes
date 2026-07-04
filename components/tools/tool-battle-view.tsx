"use client";

import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";
import { MobileCompareView } from "./mobile-compare-view";
import { DesktopCompareView } from "./desktop-compare-view";

export function ToolBattleView({
  directoryTools,
  legacyTools,
}: {
  directoryTools: DirectoryTool[];
  legacyTools: ToolRecord[];
}) {
  return (
    <>
      <div className="md:hidden">
        <MobileCompareView directoryTools={directoryTools} legacyTools={legacyTools} />
      </div>
      <div className="hidden md:block">
        <DesktopCompareView directoryTools={directoryTools} legacyTools={legacyTools} />
      </div>
    </>
  );
}
