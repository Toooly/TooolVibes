"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import { clearCompareTools } from "@/lib/discovery/local-storage";
import { useDiscoveryPersistence } from "@/components/discovery/discovery-persistence-provider";

export function CompareTray() {
  const pathname = usePathname();
  const persistence = useDiscoveryPersistence();
  const compareSlugs = useToolWorkspaceStore((state) => state.compareSlugs);
  const compare = compareSlugs;
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (compare.length > 0) {
      setIsOpen(true);
    }
  }, [compare.length]);

  if (compare.length === 0 || pathname.startsWith("/compare")) {
    return null;
  }

  const compareProgress = Math.min(compare.length, 3);
  const isCompareReady = compare.length >= 2;
  const readinessLabel =
    compare.length === 1 ? "Manca 1 profilo" : isCompareReady ? "Pronto al verdetto" : "Riempi il confronto";

  const persistenceLabel =
    persistence.mode === "remote"
      ? persistence.phase === "saving"
        ? "Sync in corso"
        : persistence.phase === "error"
          ? "Sync in pausa"
          : "Workspace salvata"
      : "Sessione locale";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 px-4">
      <div className="page-shell">
        <div
          className={`pointer-events-auto compare-tray brand-panel brand-aura surface-sheen mx-auto max-w-[56rem] rounded-[28px] border px-4 py-3.5 shadow-[0_24px_62px_rgba(47,30,108,0.18)] transition-all duration-300 ${
            isOpen ? "translate-y-0 opacity-100" : "is-collapsed translate-y-[calc(100%-2.5rem)] opacity-92"
          }`}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="selection-status">Compare attivo</span>
                <span
                  className={`selection-chip inline-flex items-center rounded-full border px-3 py-1 text-[0.64rem] font-semibold uppercase tracking-[0.15em] ${
                    compare.length > 0 ? "is-live" : ""
                  }`}
                  style={{
                    borderColor: "var(--line)",
                    background: "rgba(255,255,255,0.78)",
                    color: isCompareReady ? "#8a5a16" : "var(--muted-strong)",
                  }}
                >
                  {readinessLabel}
                </span>
                <span className="text-[0.72rem] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  {compare.length}/3 in tray
                </span>
                <span className="text-[0.72rem] uppercase tracking-[0.18em]" style={{ color: "var(--muted)" }}>
                  {persistenceLabel}
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="progress-track h-2 w-[7.2rem] sm:w-[8.2rem]">
                  <div
                    className={`progress-fill ${isCompareReady ? "is-ready" : ""}`}
                    style={{ width: `${(compareProgress / 3) * 100}%` }}
                  />
                </div>
                <span className="text-[0.66rem] font-semibold uppercase tracking-[0.16em]" style={{ color: "var(--muted)" }}>
                  {isCompareReady ? "Apri il confronto" : "Aggiungi un altro profilo"}
                </span>
              </div>
              <p className="text-body-soft mt-2 text-[0.9rem]" style={{ color: "var(--muted-strong)" }}>
                {compare.length < 2
                  ? "Ti manca ancora un profilo per arrivare a un verdetto che abbia davvero contrasto."
                  : "Apri compare e leggi i profili affiancati con un verdetto più netto e più leggibile."}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/compare"
                className="button-shell button-primary text-ui-strong inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white sm:w-auto"
              >
                Apri compare
                <ArrowRight aria-hidden="true" className="button-arrow size-4" />
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="selection-chip text-ui-strong rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] sm:w-auto"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)", color: "var(--muted-strong)" }}
              >
                {isOpen ? "Comprimi" : "Riapri tray"}
              </button>
              <button
                type="button"
                onClick={() => clearCompareTools()}
                className="selection-chip text-ui-strong rounded-full border px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.15em] sm:w-auto"
                style={{ borderColor: "var(--line)", background: "rgba(255,255,255,0.76)", color: "var(--muted)" }}
              >
                Svuota
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
