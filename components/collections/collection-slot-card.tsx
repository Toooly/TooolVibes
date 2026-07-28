import type { ResolvedCollectionToolSlot } from "@/lib/types/collection";
import { getToolBestFor, getToolPricing, getToolWhyHere } from "@/lib/tools/discovery";

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
  const toolBestFor = getToolBestFor(slot.tool);
  const toolPricing = getToolPricing(slot.tool);
  const publicTool = createToolPublicView(adaptToolRecordToPublic(slot.tool));

  return (
    <article
      className={`metadata-block collection-slot-panel collection-slot-card surface-sheen rounded-[26px] p-3.5 sm:p-4.5 ${
        slot.featured ? "ring-1 ring-[rgba(112,82,255,0.12)]" : ""
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="editorial-label">Passaggio {String(index + 1).padStart(2, "0")}</p>
          <h3 className="text-display-card mt-2 text-[1.12rem]">{slot.role}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
            style={{
              borderColor: "var(--line)",
              background: "var(--tv-surface-inverted-raised)",
              color: "var(--muted-strong)",
            }}
          >
            {slot.tool.category}
          </span>
          <span
            className="selection-chip rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]"
            style={{
              borderColor: "var(--line)",
              background: "var(--tv-surface-inverted-raised)",
              color: "var(--muted-strong)",
            }}
          >
            {toolPricing}
          </span>
          {slot.featured ? <span className="selection-status">Tool guida</span> : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div
          className="stat-block rounded-[22px] border px-4 py-4"
          style={{
            borderColor: "var(--line)",
            background: "var(--tv-surface-inverted-raised)",
          }}
        >
          <p className="editorial-label">Ruolo nel percorso</p>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
            {slotContext}
          </p>
        </div>
        <div
          className="stat-block rounded-[22px] border px-4 py-4"
          style={{
            borderColor: "var(--line)",
            background: "var(--tv-surface-inverted-raised)",
          }}
        >
          <p className="editorial-label">Uso ideale</p>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
            {toolBestFor}
          </p>
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
