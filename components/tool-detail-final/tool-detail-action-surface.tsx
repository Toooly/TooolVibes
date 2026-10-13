"use client";

import { LocalizedText, LocalizedAttributes } from "@/components/i18n/localized-text";
/**
 * TooolVibes — Tool Detail FINAL — Action Surface
 *
 * Public actions: Confronta (primary) → Visita (secondary) → Salva (icon/cluster).
 * Speed 2 overflow/hold still opens stack actions for logged-in workspace.
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
import { SaveOverflow } from "@/components/tools/save-overflow";
import { feedback } from "@/lib/feedback";
import { useSaveHold } from "@/components/tools/save-hold";
import { openSaveOverflow } from "@/components/tools/save-overflow-state";

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
  const isAtMax = compareCount >= MAX_COMPARE_TOOLS && compareRank === 0;

  const saveHold = useSaveHold({
    isSaved,
    onToggle: () => {
      toggleSaved(slug);
      feedback.success();
    },
    onSpeed2Open: () => openSaveOverflow(slug),
    slug,
  });

  return (
    <LocalizedAttributes><div className="td-final-actions" role="group" aria-label="Azioni scheda">
      <LocalizedAttributes><button
        type="button"
        onClick={() => {
          toggleCompare(slug);
          feedback.selection();
        }}
        className="td-final-cta--primary"
        aria-pressed={compareRank > 0}
        aria-label={
          compareRank > 0
            ? `Rimuovi ${name} dal confronto (posizione ${compareRank})`
            : isAtMax
              ? `Limite di ${MAX_COMPARE_TOOLS} tool raggiunto`
              : `Confronta ${name}`
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
        <span><LocalizedText>{compareRank > 0 ? "In confronto" : "Confronta"}</LocalizedText></span>
      </button></LocalizedAttributes>

      <LocalizedAttributes><a
        href={externalUrl}
        target="_blank"
        rel={isAffiliateLink ? "sponsored noopener noreferrer" : "noopener noreferrer"}
        className="td-final-cta--secondary"
        aria-label={`Visita il sito ufficiale di ${name}`}
      >
        <span><LocalizedText>{"Visita"}</LocalizedText></span>
        <ExternalLink size={15} aria-hidden="true" />
      </a></LocalizedAttributes>

      <div className="td-final-save-cluster">
        <LocalizedAttributes><button
          type="button"
          {...saveHold}
          className={cn("td-final-cta--save", isSaved && "is-saved")}
          aria-pressed={isSaved}
          aria-label={isSaved ? `Rimuovi ${name} dai Salvati` : `Salva ${name}`}
          title={isSaved ? "Salvato" : "Salva"}
        >
          <Bookmark
            size={17}
            aria-hidden="true"
            fill={isSaved ? "currentColor" : "none"}
          />
          <span className="td-final-cta__label"><LocalizedText>{isSaved ? "Salvato" : "Salva"}</LocalizedText></span>
        </button></LocalizedAttributes>
        <SaveOverflow
          slug={slug}
          toolName={name}
          triggerClassName="td-final-save-more"
        />
      </div>

      {isAffiliateLink ? (
        <span className="td-final-affiliate-note"><LocalizedText>{"Link affiliato: potremmo ricevere una commissione senza costi extra per te. "}</LocalizedText></span>
      ) : null}

      {compareRank > 0 ? (
        <LocalizedAttributes><span
          className="td-final-compare-rank"
          aria-label={`Selezionato, posizione ${compareRank}`}
        >
          #<LocalizedText>{String(compareRank).padStart(2, "0")}</LocalizedText>
          <span className="td-final-compare-rank__suffix"><LocalizedText>{"di "}</LocalizedText>{compareCount}/{MAX_COMPARE_TOOLS}
          </span>
        </span></LocalizedAttributes>
      ) : null}

      {compareCount > 0 ? (
        <LocalizedAttributes><a
          href="/compare"
          className={cn(
            "td-final-cta--secondary",
            "td-final-cta--open-compare",
            compareCount >= MIN_COMPARE_TOOLS && "is-ready",
          )}
          aria-label={
            compareCount >= MIN_COMPARE_TOOLS
              ? "Apri la pagina di confronto"
              : `Aggiungi ancora ${MIN_COMPARE_TOOLS - compareCount} tool per attivare il confronto`
          }
        >
          <span>
            <LocalizedText>{compareCount >= MIN_COMPARE_TOOLS
              ? "Apri confronto"
              : `Confronto · ${compareCount}/{MAX_COMPARE_TOOLS}`}</LocalizedText>
          </span>
        </a></LocalizedAttributes>
      ) : null}
    </div></LocalizedAttributes>
  );
}
