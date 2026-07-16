"use client";

import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { MobileCompareView } from "./mobile-compare-view";
import { DesktopCompareView } from "./desktop-compare-view";

export function ToolBattleView({ tools }: { tools: ToolPublicView[] }) {
  return (
    <>
      <div className="md:hidden">
        <MobileCompareView tools={tools} />
      </div>
      <div className="hidden md:block">
        <DesktopCompareView tools={tools} />
      </div>
    </>
  );
}
