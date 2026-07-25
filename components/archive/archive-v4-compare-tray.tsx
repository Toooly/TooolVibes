"use client";

/**
 * TooolVibes — Archive V4 Comparison Tray
 * 2026-07-24 (compare-contract stabilized)
 *
 * Sticky bottom tray that surfaces the current compare list and the
 * "Apri confronto" CTA. Hidden when the compare list is empty.
 * Adapts to viewport: at xl+ it docks to the bottom-right corner as a
 * compact card; below xl it docks to the bottom edge full-width above
 * the mobile bottom nav.
 *
 * State contract (derived from canonical MIN/MAX in workspace-constants):
 *   0 selected        → tray hidden
 *   1 selected        → counter 1/MAX, CTA disabled (need 1 more)
 *                        helper: "Aggiungi 1 tool per attivare il confronto."
 *   2..MAX-1 selected → counter N/MAX, CTA active
 *                        helper: "Pronto per il confronto."
 *   MAX selected      → counter MAX/MAX, CTA disabled (limit reached)
 *                        helper: "Hai raggiunto il limite di MAX tool."
 *                        adding a new candidate is blocked at store level
 *                        (toggleCompare returns { added: false, limited: true })
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { X, ArrowRight, Columns3 } from "lucide-react";

import {
  useToolWorkspaceStore,
  MAX_COMPARE_TOOLS,
  MIN_COMPARE_TOOLS,
} from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { cn } from "@/lib/utils";

type ArchiveV4CompareTrayProps = {
  tools: ToolPublicView[];
};

/**
 * Build the tray helper copy deterministically from the canonical
 * MIN_COMPARE_TOOLS / MAX_COMPARE_TOOLS. Italian singular/plural aware.
 */
function buildHelperCopy(currentCount: number): {
  copy: string;
  ctaEnabled: boolean;
  atMax: boolean;
} {
  if (currentCount >= MAX_COMPARE_TOOLS) {
    return {
      copy: `Hai raggiunto il limite di ${MAX_COMPARE_TOOLS} tool.`,
      ctaEnabled: false,
      atMax: true,
    };
  }
  if (currentCount >= MIN_COMPARE_TOOLS) {
    return {
      copy: "Pronto per il confronto.",
      ctaEnabled: true,
      atMax: false,
    };
  }
  const stillNeeded = MIN_COMPARE_TOOLS - currentCount;
  return {
    copy:
      stillNeeded === 1
        ? "Aggiungi 1 tool per attivare il confronto."
        : `Aggiungi ${stillNeeded} tool per attivare il confronto.`,
    ctaEnabled: false,
    atMax: false,
  };
}

function ArchiveV4CompareTrayInner({ tools }: ArchiveV4CompareTrayProps) {
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const toggleCompare = useToolWorkspaceStore((s) => s.toggleCompare);
  const clearCompare = useToolWorkspaceStore((s) => s.clearCompare);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(min-width: 1280px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", update);
      return () => mq.removeEventListener("change", update);
    }
    mq.addListener(update);
    return () => mq.removeListener(update);
  }, []);

  /* Fixed-surface contract (binding).
     The Comparison Tray publishes --tv-tray-height on <html> when it is
     visible so the route can compute its padding-bottom dynamically.
     0 when hidden (no permanent blank area), ≈80px on mobile when
     shown, 0 on desktop because the tray docks to a corner. */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (compareSlugs.length === 0) {
      root.style.setProperty("--tv-tray-height", "0px");
      return;
    }
    const total = isDesktop ? "0px" : "80px";
    root.style.setProperty("--tv-tray-height", total);
  }, [compareSlugs.length, isDesktop]);

  // 0 selected → tray hidden (this is the "0" state of the contract)
  if (compareSlugs.length === 0) return null;

  const compareTools = compareSlugs
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean) as ToolPublicView[];

  const { copy, ctaEnabled, atMax } = buildHelperCopy(compareSlugs.length);

  const iconUrl = (t: ToolPublicView) =>
    t.domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(t.domain)}&sz=64` : null;
  const initial = (n: string) => n.slice(0, 2).toUpperCase();

  return (
    <aside
      className={cn(
        "ar4-tray",
        isDesktop && "is-desktop",
        ctaEnabled && "is-ready",
        atMax && "is-at-max",
      )}
      role="region"
      aria-label="Confronto attivo"
    >
      <div className="ar4-tray__inner">
        <div className="ar4-tray__head">
          <span className="ar4-tray__icon" aria-hidden="true">
            <Columns3 size={14} />
          </span>
          <div>
            <p className="ar4-tray__title" data-testid="ar4-tray-title">
              Confronto · {compareSlugs.length}/{MAX_COMPARE_TOOLS}
            </p>
            <p className="ar4-tray__sub" data-testid="ar4-tray-sub">
              {copy}
            </p>
          </div>
        </div>

        <ol className="ar4-tray__chips" aria-label="Tool selezionati" data-testid="ar4-tray-chips">
          {compareTools.map((t, idx) => (
            <li key={t.slug} className="ar4-tray__chip" data-testid={`ar4-tray-chip-${idx}`}>
              <span className="ar4-tray__chip-avatar" aria-hidden="true">
                {iconUrl(t) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={iconUrl(t)!} alt="" loading="lazy" decoding="async" />
                ) : (
                  <span>{initial(t.name)}</span>
                )}
              </span>
              <span className="ar4-tray__chip-name">{t.name}</span>
              <button
                type="button"
                className="ar4-tray__chip-remove"
                onClick={() => toggleCompare(t.slug)}
                aria-label={`Rimuovi ${t.name} dal confronto`}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ol>

        <div className="ar4-tray__actions">
          <button type="button" className="ar4-tray__clear" onClick={() => clearCompare()}>
            Svuota
          </button>
          <Link
            href="/compare"
            className={cn("ar4-tray__cta", !ctaEnabled && "is-disabled")}
            aria-disabled={!ctaEnabled}
            data-testid="ar4-tray-cta"
            tabIndex={ctaEnabled ? 0 : -1}
          >
            {atMax ? "Limite raggiunto" : "Apri confronto"}
            {!atMax && <ArrowRight size={14} aria-hidden="true" />}
          </Link>
        </div>
      </div>
    </aside>
  );
}

export function ArchiveV4CompareTray(props: ArchiveV4CompareTrayProps) {
  return <ArchiveV4CompareTrayInner {...props} />;
}

export default ArchiveV4CompareTray;
