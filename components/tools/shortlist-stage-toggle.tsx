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
            data-sonic-action="tab"
            className={`selection-chip text-ui-strong inline-flex shrink-0 rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] ${
              active ? "quick-filter-chip is-active" : ""
            }`}
            style={{
              borderColor: active ? "rgba(112,82,255,0.24)" : "var(--line)",
              background: active ? meta.background : "linear-gradient(180deg, rgba(252,249,255,0.9), rgba(246,241,255,0.82))",
              color: active ? meta.tone : "var(--muted-strong)",
            }}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}
