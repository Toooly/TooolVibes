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
      className="metadata-block collection-slot-panel rounded-[26px] border p-4 sm:p-5"
      style={{
        borderColor: "var(--line)",
        background: "var(--tv-surface-inverted-raised)",
      }}
      aria-label={`Slot ${index + 1}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="editorial-label">Passaggio {String(index + 1).padStart(2, "0")}</p>
          <h3 className="text-display-card mt-2 text-[1.12rem]">{role}</h3>
        </div>
        <span className="editorial-label">{toolName}</span>
      </div>
      <p className="mt-3 text-sm leading-6" style={{ color: "var(--muted-strong)" }}>
        {note}
      </p>
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
