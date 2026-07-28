import type { ResolvedCollectionToolSlot } from "@/lib/types/collection";
import { getToolPricing, getToolWhyHere } from "@/lib/tools/discovery";

import { CanonicalToolCard } from "@/components/directory/canonical-tool-card";
import { adaptToolRecordToPublic } from "@/lib/data/tool-public-adapters";
import { createToolPublicView } from "@/lib/data/tool-public-view";

type CollectionSlotCardProps = {
  slot: ResolvedCollectionToolSlot;
  index: number;
};

export function CollectionSlotCard({
  slot,
  index,
}: CollectionSlotCardProps) {
  const slotContext = slot.note ?? getToolWhyHere(slot.tool);
  const toolPricing = getToolPricing(slot.tool);
  const publicTool = createToolPublicView(adaptToolRecordToPublic(slot.tool));

  return (
    <article
      className="collection-slot-panel rounded-[26px] border border-[var(--tv-border-default)] p-4 sm:p-5"
      style={{
        background: "var(--tv-surface-inverted-raised)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="editorial-label">Passaggio {String(index + 1).padStart(2, "0")}</p>
          <h3 className="text-display-card mt-2 text-[1.12rem]">{slot.role}</h3>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
            {slotContext}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {slot.featured ? <span className="selection-chip">Tool guida</span> : null}
          <span className="selection-chip">{toolPricing}</span>
        </div>
      </div>

      <div className="mt-4">
        <CanonicalToolCard
          tool={publicTool}
          density="mobile-list"
          priority={slot.featured}
          className="shadow-none"
        />
      </div>
    </article>
  );
}
