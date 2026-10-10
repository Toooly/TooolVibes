import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Current values only; callers own calculation, provenance and loading. */
export function MetricStrip({ items, label, className }: {
  items: readonly { label: string; value: ReactNode; note?: string }[];
  label: string;
  className?: string;
}) {
  return (
    <dl className={cn("tv-sys-metrics", className)} aria-label={label}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
          {item.note ? <span className="tv-sys-metrics__note">{item.note}</span> : null}
        </div>
      ))}
    </dl>
  );
}
