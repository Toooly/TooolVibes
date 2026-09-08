"use client";

import { useDiscoverySnapshot } from "@/lib/discovery/client-store";
import { setShortlistStage } from "@/lib/discovery/local-storage";
import { getShortlistStageMeta } from "@/lib/tools/discovery";
import type { ShortlistStage } from "@/lib/types/tool";

type ShortlistStageToggleProps = {
  slug: string;
};

const stageOptions: ShortlistStage[] = ["saved", "review", "top"];

export function ShortlistStageToggle({ slug }: ShortlistStageToggleProps) {
  const discovery = useDiscoverySnapshot();
  const stage = discovery.shortlistStages[slug] ?? "saved";

  return (
    <div className="tool-rail -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
      {stageOptions.map((option) => {
        const meta = getShortlistStageMeta(option);
        const active = stage === option;

        return (
          <button
            key={option}
            type="button"
            onClick={() => setShortlistStage(slug, option)}
            disabled={active}
            aria-pressed={active}
            data-sonic-action="tab"
            className="shortlist-stage-chip"
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
