"use client";

/**
 * TooolVibes — Tool Detail v4 CTA bar (client)
 *
 * Replaces the legacy shortlist + compare toggle pair with a Tool-Detail
 * specific action bar that:
 *
 *  - matches the v4 44×44 control size
 *  - reads from / writes to the canonical tool workspace store
 *  - respects MIN_COMPARE_TOOLS / MAX_COMPARE_TOOLS contract
 *  - shows current compare-rank when selected
 *  - prevents adding beyond MAX
 *
 *  Renders:
 *    [ Primary CTA ]  [ Save ]  [ Compare ]  [ Rank #01 ]
 *
 *  No fabricated state: every chip / button reads from the store.
 */

import { useMemo } from "react";
import Link from "next/link";
import { Bookmark, Columns3, ExternalLink } from "lucide-react";

import {
  MAX_COMPARE_TOOLS,
  MIN_COMPARE_TOOLS,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { cn } from "@/lib/utils";

type ToolDetailCtaBarProps = {
  slug: string;
  name: string;
  externalUrl: string;
  primaryLabel?: string;
  /** when true, this tool is already selected in compare */
  isAffiliateLink?: boolean;
};

export function ToolDetailCtaBar({
  slug,
  name,
  externalUrl,
  primaryLabel = "Apri il sito",
  isAffiliateLink = false,
}: ToolDetailCtaBarProps) {
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

  const handleSave = () => {
    toggleSaved(slug);
  };

  const handleCompare = () => {
    toggleCompare(slug);
  };

  return (
    <div className="td4-actions" role="group" aria-label="Azioni scheda">
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="td4-cta--primary"
        aria-label={`${primaryLabel} di ${name} in una nuova scheda`}
      >
        <span>{primaryLabel}</span>
        <ExternalLink size={15} aria-hidden="true" />
      </a>

      {isAffiliateLink ? (
        <span
          className="td4-affiliate-note"
          style={{
            flexBasis: "100%",
          }}
        >
          Link partner: potremmo ricevere una commissione senza costi extra per te.
        </span>
      ) : null}

      <button
        type="button"
        onClick={handleSave}
        className="td4-icon-btn"
        aria-pressed={isSaved}
        aria-label={isSaved ? "Rimuovi dai salvati" : "Salva tool"}
        title={isSaved ? "Salvato" : "Salva"}
      >
        <Bookmark
          size={17}
          aria-hidden="true"
          fill={isSaved ? "currentColor" : "none"}
        />
      </button>

      <button
        type="button"
        onClick={handleCompare}
        className="td4-icon-btn"
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
        disabled={false}
      >
        <Columns3 size={17} aria-hidden="true" />
      </button>

      {compareRank > 0 ? (
        <span
          className="td4-compare-rank"
          aria-label={`Selezionato, posizione ${compareRank}`}
        >
          #{String(compareRank).padStart(2, "0")}
          <span className="td4-compare-rank__suffix">
            di {compareCount}/{MAX_COMPARE_TOOLS}
          </span>
        </span>
      ) : null}

      {compareCount > 0 ? (
        <Link
          href="/compare"
          className={cn(
            "td4-cta--secondary",
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
        </Link>
      ) : null}
    </div>
  );
}
