"use client";

import { useMemo } from "react";
import { Bookmark, Columns3, ExternalLink } from "lucide-react";

import {
  MAX_COMPARE_TOOLS,
  MIN_COMPARE_TOOLS,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { cn } from "@/lib/utils";

type VisualLabActionSurfaceProps = {
  slug: string;
  name: string;
  externalUrl: string;
  primaryLabel: string;
  isAffiliateLink?: boolean;
};

export function VisualLabActionSurface({
  slug,
  name,
  externalUrl,
  primaryLabel,
  isAffiliateLink = false,
}: VisualLabActionSurfaceProps) {
  const savedSlugs = useToolWorkspaceStore((s) => s.savedSlugs);
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const toggleSaved = useToolWorkspaceStore((s) => s.toggleSaved);
  const toggleCompare = useToolWorkspaceStore((s) => s.toggleCompare);

  const isSaved = savedSlugs.includes(slug);
  const compareRank = useMemo(
    () => (compareSlugs.includes(slug) ? compareSlugs.indexOf(slug) + 1 : 0),
    [compareSlugs, slug],
  );
  const compareCount = compareSlugs.length;
  const isAtMax = compareCount >= MAX_COMPARE_TOOLS;

  return (
    <div className="td-lab-actions" role="group" aria-label="Azioni scheda">
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="td-lab-cta-primary"
        aria-label={`${primaryLabel} di ${name} in una nuova scheda`}
      >
        <span className="td-lab-cta-primary__pulse" aria-hidden="true" />
        <span>{primaryLabel}</span>
        <ExternalLink size={15} aria-hidden="true" />
      </a>

      {isAffiliateLink ? (
        <span className="td-lab-affiliate">
          Link partner: potremmo ricevere una commissione senza costi extra per te.
        </span>
      ) : null}

      <div className="td-lab-actions__toggles">
        <button
          type="button"
          onClick={() => toggleSaved(slug)}
          className={cn("td-lab-icon-btn", isSaved && "is-active")}
          aria-pressed={isSaved}
          aria-label={isSaved ? "Rimuovi dai salvati" : "Salva tool"}
          title={isSaved ? "Salvato" : "Salva"}
        >
          <Bookmark size={17} aria-hidden="true" fill={isSaved ? "currentColor" : "none"} />
          <span className="td-lab-icon-btn__label">Salva</span>
        </button>

        <button
          type="button"
          onClick={() => toggleCompare(slug)}
          className={cn("td-lab-icon-btn", compareRank > 0 && "is-active")}
          aria-pressed={compareRank > 0}
          aria-label={
            compareRank > 0
              ? `Rimuovi dal confronto (posizione ${compareRank})`
              : isAtMax
                ? `Limite di ${MAX_COMPARE_TOOLS} tool raggiunto`
                : "Aggiungi al confronto"
          }
          title={
            compareRank > 0
              ? `Confronto #${String(compareRank).padStart(2, "0")}`
              : isAtMax
                ? "Limite raggiunto"
                : "Confronta"
          }
        >
          <Columns3 size={17} aria-hidden="true" />
          <span className="td-lab-icon-btn__label">Confronta</span>
        </button>

        {compareRank > 0 ? (
          <span className="td-lab-lock-rank" aria-label={`Selezionato, posizione ${compareRank}`}>
            <span className="td-lab-lock-rank__node" aria-hidden="true" />
            #{String(compareRank).padStart(2, "0")}
            <em>
              di {compareCount}/{MAX_COMPARE_TOOLS}
            </em>
          </span>
        ) : null}

        {compareCount > 0 ? (
          <a
            href="/compare"
            className={cn(
              "td-lab-cta-secondary",
              compareCount >= MIN_COMPARE_TOOLS && "is-ready",
            )}
            aria-label={
              compareCount >= MIN_COMPARE_TOOLS
                ? "Apri la pagina di confronto"
                : `Aggiungi ancora ${MIN_COMPARE_TOOLS - compareCount} tool per attivare il confronto`
            }
          >
            {compareCount >= MIN_COMPARE_TOOLS
              ? "Apri confronto"
              : `Confronto · ${compareCount}/${MAX_COMPARE_TOOLS}`}
          </a>
        ) : null}
      </div>
    </div>
  );
}
