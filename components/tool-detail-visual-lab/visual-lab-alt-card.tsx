"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bookmark, Columns3 } from "lucide-react";

import {
  MAX_COMPARE_TOOLS,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { cn } from "@/lib/utils";

type VisualLabAltCardProps = {
  tool: ToolPublicView;
  why: string;
  targetUser: string;
  difference: string;
};

export function VisualLabAltCard({
  tool,
  why,
  targetUser,
  difference,
}: VisualLabAltCardProps) {
  const savedSlugs = useToolWorkspaceStore((s) => s.savedSlugs);
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const toggleSaved = useToolWorkspaceStore((s) => s.toggleSaved);
  const toggleCompare = useToolWorkspaceStore((s) => s.toggleCompare);

  const isSaved = savedSlugs.includes(tool.slug);
  const isSelected = compareSlugs.includes(tool.slug);
  const compareRank = useMemo(
    () => (isSelected ? compareSlugs.indexOf(tool.slug) + 1 : 0),
    [compareSlugs, tool.slug, isSelected],
  );

  const { value: score } = computeEditorialScore(tool);
  const iconUrl = tool.domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`
    : null;
  const initial = tool.name.slice(0, 2).toUpperCase();

  return (
    <article
      className={cn(
        "td-lab-desk-card",
        isSelected && "is-selected",
        isSaved && "is-saved",
      )}
      data-selected={isSelected || undefined}
      data-saved={isSaved || undefined}
    >
      <header className="td-lab-desk-card__head">
        <span className="td-lab-desk-card__avatar" aria-hidden="true">
          {iconUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={iconUrl} alt="" loading="lazy" decoding="async" />
          ) : (
            <span>{initial}</span>
          )}
          <span className="td-lab-desk-card__orbit" />
        </span>
        <div className="td-lab-desk-card__id">
          <h3 className="td-lab-desk-card__name">
            <Link href={`/toools/${tool.slug}`}>{tool.name}</Link>
          </h3>
          <p className="td-lab-desk-card__category">{tool.categoryLabel}</p>
        </div>
        <div className="td-lab-desk-card__score" title={`${score} / 10 editoriale`}>
          <strong>{score.toFixed(1)}</strong>
          <span>/10</span>
        </div>
      </header>

      <p className="td-lab-desk-card__why">
        <span className="td-lab-desk-card__kicker">Perché sceglierlo al posto di Blink</span>
        {why}
      </p>

      <dl className="td-lab-desk-card__facts">
        <div>
          <dt>Differenza</dt>
          <dd>{difference}</dd>
        </div>
        <div>
          <dt>Utente target</dt>
          <dd>{targetUser}</dd>
        </div>
      </dl>

      <div className="td-lab-desk-card__actions">
        <Link href={`/toools/${tool.slug}`} className="td-lab-desk-card__open">
          Apri scheda
          <span aria-hidden="true">→</span>
        </Link>
        <button
          type="button"
          onClick={() => toggleSaved(tool.slug)}
          className={cn("td-lab-desk-card__toggle", isSaved && "is-active")}
          aria-pressed={isSaved}
          aria-label={isSaved ? "Rimuovi dai salvati" : "Salva tool"}
        >
          <Bookmark size={15} aria-hidden="true" fill={isSaved ? "currentColor" : "none"} />
        </button>
        <button
          type="button"
          onClick={() => toggleCompare(tool.slug)}
          className={cn("td-lab-desk-card__toggle", isSelected && "is-active")}
          aria-pressed={isSelected}
          aria-label={
            isSelected
              ? `Rimuovi dal confronto (posizione ${compareRank})`
              : "Aggiungi al confronto"
          }
        >
          <Columns3 size={15} aria-hidden="true" />
        </button>
        {compareRank > 0 ? (
          <span className="td-lab-lock-rank td-lab-lock-rank--compact">
            #{String(compareRank).padStart(2, "0")}
            <em>/{MAX_COMPARE_TOOLS}</em>
          </span>
        ) : null}
      </div>
    </article>
  );
}
