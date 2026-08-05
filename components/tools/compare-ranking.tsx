"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NormalisedTool } from "./tool-battle-shared";

type CompareRankingProps = {
  tools: NormalisedTool[];
  winner: NormalisedTool | null;
  onRemove?: (slug: string) => void;
  layoutMode: "desktop" | "mobile";
};

function getRank(tool: NormalisedTool): number | string {
  const rank = tool.objectiveRank ?? tool.compareScore.rank;
  if (rank === null || rank === undefined) return "—";
  return rank;
}

export function CompareRanking({
  tools,
  winner,
  onRemove,
  layoutMode,
}: CompareRankingProps) {
  if (tools.length === 0) return null;

  return (
    <ol
      className="compare-ranking"
      data-layout={layoutMode}
      aria-label="Classifica del confronto"
    >
      {tools.map((tool) => {
        const isWinner = winner?.slug === tool.slug;
        const rank = getRank(tool);
        const summary = tool.objectiveSummary || tool.tldr;
        const score = tool.battleScore;
        return (
          <li
            key={tool.slug}
            className={cn(
              "compare-ranking__item",
              isWinner && "compare-ranking__item--winner",
            )}
            data-winner={isWinner}
            data-layout={layoutMode}
          >
            <span className="compare-ranking__pos" aria-label={`Posizione ${rank}`}>
              #{rank}
            </span>
            <div className="compare-ranking__info">
              <h3 className="compare-ranking__name">{tool.name}</h3>
              <p className="compare-ranking__reason">{summary}</p>
            </div>
            <span className="compare-ranking__score" aria-label={`Punteggio ${score ?? "non disponibile"} su 10`}>
              <span className="compare-ranking__score-value">
                {score === null || score === undefined ? "—" : score}
              </span>
              <small className="compare-ranking__score-suffix">/10</small>
            </span>
            {onRemove ? (
              <button
                type="button"
                className="compare-ranking__remove"
                onClick={() => onRemove(tool.slug)}
                aria-label={`Rimuovi ${tool.name} dal confronto`}
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
