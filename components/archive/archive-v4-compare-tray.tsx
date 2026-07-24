"use client";

/**
 * TooolVibes — Archive V4 Comparison Tray
 * 2026-07-24
 *
 * Sticky bottom tray that surfaces the current compare list and the
 * "Apri confronto" CTA. Hidden when the compare list is empty.
 * Adapts to viewport: at xl+ it docks to the bottom-right corner as a
 * compact card; below xl it docks to the bottom edge full-width above
 * the mobile bottom nav.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { X, ArrowRight, Columns3 } from "lucide-react";

import { useToolWorkspaceStore, MAX_COMPARE_TOOLS } from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { cn } from "@/lib/utils";

type ArchiveV4CompareTrayProps = {
  tools: ToolPublicView[];
};

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

  if (compareSlugs.length === 0) return null;

  const compareTools = compareSlugs
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean) as ToolPublicView[];

  const ready = compareSlugs.length >= 2;
  const remaining = Math.max(0, MAX_COMPARE_TOOLS - compareSlugs.length);

  const iconUrl = (t: ToolPublicView) =>
    t.domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(t.domain)}&sz=64` : null;
  const initial = (n: string) => n.slice(0, 2).toUpperCase();

  return (
    <aside
      className={cn("ar4-tray", isDesktop && "is-desktop", ready && "is-ready")}
      role="region"
      aria-label="Confronto attivo"
    >
      <div className="ar4-tray__inner">
        <div className="ar4-tray__head">
          <span className="ar4-tray__icon" aria-hidden="true">
            <Columns3 size={14} />
          </span>
          <div>
            <p className="ar4-tray__title">
              Confronto · {compareSlugs.length}/{MAX_COMPARE_TOOLS}
            </p>
            <p className="ar4-tray__sub">
              {ready
                ? "Pronto per il confronto."
                : `Aggiungi ${remaining === 1 ? "1 tool" : `${remaining} tool`} per attivare il confronto.`}
            </p>
          </div>
        </div>

        <ol className="ar4-tray__chips" aria-label="Tool selezionati">
          {compareTools.map((t) => (
            <li key={t.slug} className="ar4-tray__chip">
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
            className={cn("ar4-tray__cta", !ready && "is-disabled")}
            aria-disabled={!ready}
            tabIndex={ready ? 0 : -1}
          >
            Apri confronto
            <ArrowRight size={14} aria-hidden="true" />
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
