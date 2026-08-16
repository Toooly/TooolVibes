import type { ReactNode } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type ControlCenterMetric = {
  label: string;
  value: number | string;
};

export function ControlCenterHeader({
  kicker = "Control Center",
  title,
  description,
  primaryHref,
  primaryLabel,
  metrics,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  metrics?: ControlCenterMetric[];
  className?: string;
}) {
  return (
    <header className={cn("tv-cc-header", className)}>
      <div>
        <p className="tv-cc-kicker">{kicker}</p>
        <h1 className="tv-cc-title">{title}</h1>
        {description ? <p className="tv-cc-desc">{description}</p> : null}
        {metrics && metrics.length > 0 ? (
          <div className="tv-cc-metrics">
            {metrics.map((item) => (
              <span key={item.label} className="tv-cc-metric">
                <strong>{item.value}</strong>
                {item.label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {primaryHref && primaryLabel ? (
        <div className="admin-sticky-actions">
          <Link href={primaryHref} className="tv-cc-btn tv-cc-btn--primary">
            {primaryLabel}
          </Link>
        </div>
      ) : null}
    </header>
  );
}

export function ControlCenterFilters({
  items,
  active,
}: {
  items: Array<{ href: string; label: string; value: string; count?: number }>;
  active: string;
}) {
  return (
    <nav className="tv-cc-filters" aria-label="Filtri">
      {items.map((item) => (
        <Link
          key={item.value}
          href={item.href}
          className={cn("tv-cc-filter", active === item.value && "is-active")}
        >
          {item.label}
          {typeof item.count === "number" ? ` (${item.count})` : ""}
        </Link>
      ))}
    </nav>
  );
}

export function ControlCenterNotice({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "ok" | "warn";
}) {
  return (
    <p className={cn("tv-cc-notice", tone === "ok" && "tv-cc-notice--ok", tone === "warn" && "tv-cc-notice--warn")}>
      {children}
    </p>
  );
}
