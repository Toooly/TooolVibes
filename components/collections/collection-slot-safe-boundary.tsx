import type { ResolvedCollectionToolSlot } from "@/lib/types/collection";
import { CollectionSlotCard } from "./collection-slot-card";
import { CollectionSlotErrorBoundary } from "./collection-slot-error-boundary";

type Props = {
  slot: ResolvedCollectionToolSlot;
  index: number;
};

function SlotFallback({ slot, index }: Props) {
  const role = slot?.role ?? "Slot della raccolta";
  const toolName = slot?.tool?.name ?? "Tool";
  const note =
    slot?.note ?? "Slot descritto nel percorso della raccolta.";
  return (
    <article
      className="rounded-[26px] border border-[var(--tv-border-default)] p-4 sm:p-5"
      style={{
        background: "var(--tv-surface-inverted-raised)",
      }}
      aria-label={`Slot ${index + 1}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="editorial-label">Passaggio {String(index + 1).padStart(2, "0")}</p>
          <h3 className="text-display-card mt-2 text-[1.12rem]">{role}</h3>
          <p className="mt-2 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
            {note}
          </p>
        </div>
        <span className="selection-chip">{toolName}</span>
      </div>
    </article>
  );
}

export function CollectionSlotSafeBoundary({ slot, index }: Props) {
  return (
    <CollectionSlotErrorBoundary fallback={<SlotFallback slot={slot} index={index} />}>
      <CollectionSlotCard slot={slot} index={index} />
    </CollectionSlotErrorBoundary>
  );
}
