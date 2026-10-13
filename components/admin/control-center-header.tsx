import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
import type { ReactNode } from "react";
import Link from "@/components/ui/app-link";

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
  backHref,
  backLabel,
  metrics,
  className,
}: {
  kicker?: string;
  title: string;
  description?: string;
  primaryHref?: string;
  primaryLabel?: string;
  backHref?: string;
  backLabel?: string;
  metrics?: ControlCenterMetric[];
  className?: string;
}) {
  return (
    <header className={cn("tv-cc-header", className)}>
      <div>
        <p className="tv-cc-kicker"><LocalizedText>{kicker}</LocalizedText></p>
        <h1 className="tv-cc-title"><LocalizedText>{title}</LocalizedText></h1>
        {description ? <p className="tv-cc-desc"><LocalizedText>{description}</LocalizedText></p> : null}
        {metrics && metrics.length > 0 ? (
          <div className="tv-cc-metrics">
            {metrics.map((item) => (
              <span key={item.label} className="tv-cc-metric">
                <strong>{item.value}</strong>
                <LocalizedText>{item.label}</LocalizedText>
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {backHref || (primaryHref && primaryLabel) ? (
        <div className="admin-sticky-actions">
          {backHref ? (
            <Link href={backHref} className="tv-cc-btn tv-cc-btn--ghost">
              <LocalizedText>{backLabel ?? "Indietro"}</LocalizedText>
            </Link>
          ) : null}
          {primaryHref && primaryLabel ? (
            <Link href={primaryHref} className="tv-cc-btn tv-cc-btn--primary">
              <LocalizedText>{primaryLabel}</LocalizedText>
            </Link>
          ) : null}
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
    <LocalizedAttributes><nav className="tv-cc-filters" aria-label="Filtri">
      {items.map((item) => (
        <Link
          key={item.value}
          href={item.href}
          className={cn("tv-cc-filter", active === item.value && "is-active")}
        >
          <LocalizedText>{item.label}</LocalizedText>
          <LocalizedText>{typeof item.count === "number" ? ` (${item.count})` : ""}</LocalizedText>
        </Link>
      ))}
    </nav></LocalizedAttributes>
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
