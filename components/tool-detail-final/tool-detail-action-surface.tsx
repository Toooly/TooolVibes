"use client";

/**
 * TooolVibes — Tool Detail FINAL — Action Surface (A.2)
 *
 * 44×44 controls: external CTA, Save, Compare, rank chip, shortcut CTA.
 * Reads / writes the canonical tool workspace store.
 * Respects MIN_COMPARE_TOOLS=2 / MAX_COMPARE_TOOLS=5.
 *
 * Namespace: .td-final-*
 */

import { useMemo } from "react";
import { Bookmark, Columns3, ExternalLink } from "lucide-react";

import {
  MAX_COMPARE_TOOLS,
  MIN_COMPARE_TOOLS,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { cn } from "@/lib/utils";

type ToolDetailActionSurfaceProps = {
  slug: string;
  name: string;
  externalUrl: string;
  primaryLabel: string;
  isAffiliateLink?: boolean;
};

export function ToolDetailActionSurface({
  slug,
  name,
  externalUrl,
  primaryLabel,
  isAffiliateLink = false,
}: ToolDetailActionSurfaceProps) {
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
    <div className="td-final-actions" role="group" aria-label="Azioni scheda">
      <button
        type="button"
        onClick={() => toggleCompare(slug)}
        className="td-final-cta--primary"
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
        <span>{compareRank > 0 ? "Rimuovi dal confronto" : "Aggiungi al confronto"}</span>
      </button>

      <button
        type="button"
        onClick={() => toggleSaved(slug)}
        className={cn("td-final-cta--save", isSaved && "is-saved")}
        aria-pressed={isSaved}
        aria-label={isSaved ? "Rimuovi dai salvati" : "Salva"}
        title={isSaved ? "Salvato" : "Salva"}
      >
        <Bookmark
          size={17}
          aria-hidden="true"
          fill={isSaved ? "currentColor" : "none"}
        />
        <span>{isSaved ? "Salvato" : "Salva"}</span>
      </button>

      <a
        href={externalUrl}
        target="_blank"
        rel={isAffiliateLink ? "sponsored noopener noreferrer" : "noopener noreferrer"}
        className="td-final-cta--secondary"
        aria-label={`${primaryLabel} di ${name} in una nuova scheda`}
      >
        <span>Visita il sito ufficiale</span>
        <ExternalLink size={15} aria-hidden="true" />
      </a>

      {isAffiliateLink ? (
        <span className="td-final-affiliate-note">
          Link partner: potremmo ricevere una commissione senza costi extra per te.
        </span>
      ) : null}

      {compareRank > 0 ? (
        <span
          className="td-final-compare-rank"
          aria-label={`Selezionato, posizione ${compareRank}`}
        >
          #{String(compareRank).padStart(2, "0")}
          <span className="td-final-compare-rank__suffix">
            di {compareCount}/{MAX_COMPARE_TOOLS}
          </span>
        </span>
      ) : null}

      {compareCount > 0 ? (
        <a
          href="/compare"
          className={cn(
            "td-final-cta--secondary",
            compareCount >= MIN_COMPARE_TOOLS && "is-ready",
          )}
          aria-label={
            compareCount >= MIN_COMPARE_TOOLS
              ? "Apri la pagina di confronto"
              : `Aggiungi ancora ${MIN_COMPARE_TOOLS - compareCount} tool per attivare il confronto`
          }
        >
          <span>
            {compareCount >= MIN_COMPARE_TOOLS
              ? "Apri confronto"
              : `Confronto · ${compareCount}/${MAX_COMPARE_TOOLS}`}
          </span>
        </a>
      ) : null}
    </div>
  );
}
