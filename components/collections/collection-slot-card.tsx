import type { ResolvedCollectionToolSlot } from "@/lib/types/collection";
import { getToolBestFor, getToolPricing, getToolWhyHere } from "@/lib/tools/discovery";

import { ToolCard } from "@/components/tools/tool-card";

type CollectionSlotCardProps = {
  slot: ResolvedCollectionToolSlot;
  index: number;
  collectionTitle: string;
};

export function CollectionSlotCard({
  slot,
  index,
  collectionTitle,
}: CollectionSlotCardProps) {
  const slotContext = slot.note ?? getToolWhyHere(slot.tool);
  const toolBestFor = getToolBestFor(slot.tool);
  const toolPricing = getToolPricing(slot.tool);

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
            className="selection-chip rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
            style={{
              borderColor: "var(--line)",
              background: "rgba(255,255,255,0.78)",
              color: "var(--muted-strong)",
            }}
          >
            {slot.tool.category}
          </span>
          <span
            className="selection-chip rounded-full border px-3 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em]"
            style={{
              borderColor: "var(--line)",
              background: "rgba(255,255,255,0.78)",
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
            background: "linear-gradient(180deg, rgba(255,255,255,0.76), rgba(245,239,255,0.7))",
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
            background: "linear-gradient(180deg, rgba(255,255,255,0.76), rgba(245,239,255,0.7))",
          }}
        >
          <p className="editorial-label">Uso ideale</p>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
            {toolBestFor}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <ToolCard
          tool={slot.tool}
          variant={slot.featured ? "standard" : "compact"}
          contextLabel={collectionTitle}
          index={index}
          priority={slot.featured}
        />
      </div>
    </article>
  );
}
