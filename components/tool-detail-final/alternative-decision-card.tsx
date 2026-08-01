"use client";

/**
 * TooolVibes — Tool Detail FINAL — Alternative Decision Card
 *
 * Replaces ArchiveV4ToolCard in the Tool Detail alternatives flow.
 * Owns its own DOM and classes (.td-final-alt-*) on the ivory surface.
 * Does NOT render .ar4-card* markup; does NOT inherit Archive styles.
 *
 * Data: ToolPublicView (real fields only, no fabrication).
 * Save/Compare state: canonical tool workspace store.
 */

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

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  expert: "Esperto",
  featured: "In evidenza",
};

type AlternativeDecisionCardProps = {
  tool: ToolPublicView;
};

export function AlternativeDecisionCard({ tool }: AlternativeDecisionCardProps) {
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

  const assessment = computeEditorialScore(tool);

  const levelLabel = tool.level ? (LEVEL_LABEL[tool.level] ?? tool.levelLabel ?? "Base") : "Base";

  const iconUrl = tool.domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=128`
    : null;
  const initial = tool.name.slice(0, 2).toUpperCase();

  return (
    <div
      className={cn(
        "td-final-alt",
      )}
    >
      <article
        className={cn(
          "td-final-alt__card",
          isSelected && "is-selected",
          isSaved && "is-saved",
        )}
        data-selected={isSelected || undefined}
        data-saved={isSaved || undefined}
      >
        <div className="td-final-alt__row">
          <span className="td-final-alt__avatar" aria-hidden="true">
            {iconUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={iconUrl} alt="" loading="lazy" decoding="async" />
            ) : (
              <span>{initial}</span>
            )}
          </span>
          <div className="td-final-alt__identity">
            <h3 className="td-final-alt__name">
              <Link href={`/toools/${tool.slug}`}>{tool.name}</Link>
            </h3>
            <p className="td-final-alt__category">{tool.categoryLabel}</p>
          </div>
        </div>

        <p className="td-final-alt__desc">
          {tool.tldr || tool.shortDescription || "Tool selezionato da TooolVibes."}
        </p>

        <div className="td-final-alt__metrics">
          <span className="td-final-alt__level">{levelLabel}</span>
          <span className="td-final-alt__score" title={assessment.label}>
            {assessment.value !== null ? (
              <>
                <strong>{assessment.value.toFixed(1)}</strong>
                <em>/ 10</em>
              </>
            ) : (
              <em>Da valutare</em>
            )}
          </span>
          <span className="td-final-alt__evidence">{assessment.label}</span>
        </div>

        <div className="td-final-alt__actions">
          <Link href={`/toools/${tool.slug}`} className="td-final-alt__open">
            Apri scheda
            <span aria-hidden="true">→</span>
          </Link>
          <button
            type="button"
            onClick={() => toggleSaved(tool.slug)}
            className="td-final-alt__toggle"
            aria-pressed={isSaved}
            aria-label={isSaved ? "Rimuovi dai salvati" : "Salva tool"}
            title={isSaved ? "Salvato" : "Salva"}
          >
            <Bookmark
              size={15}
              aria-hidden="true"
              fill={isSaved ? "currentColor" : "none"}
            />
          </button>
          <button
            type="button"
            onClick={() => toggleCompare(tool.slug)}
            className="td-final-alt__toggle"
            aria-pressed={isSelected}
            aria-label={
              isSelected
                ? `Rimuovi dal confronto (posizione ${compareRank})`
                : "Aggiungi al confronto"
            }
            title={
              isSelected
                ? `Confronto #${String(compareRank).padStart(2, "0")}`
                : "Confronta"
            }
            disabled={false}
            data-sonic-action="compare"
          >
            <Columns3 size={15} aria-hidden="true" />
          </button>
          {compareRank > 0 ? (
            <span
              className="td-final-compare-rank"
              aria-label={`Selezionato, posizione ${compareRank}`}
            >
              #{String(compareRank).padStart(2, "0")}
              <span className="td-final-compare-rank__suffix">
                di {compareSlugs.length}/{MAX_COMPARE_TOOLS}
              </span>
            </span>
          ) : null}
        </div>
      </article>
    </div>
  );
}
