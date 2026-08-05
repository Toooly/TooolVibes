"use client";

import { Sparkles } from "lucide-react";
import type { BattleVerdict, NormalisedTool } from "./tool-battle-shared";

type CompareVerdictCardProps = {
  verdict: BattleVerdict;
  winner: NormalisedTool | null;
  objectiveLabel?: string | null;
  layoutMode: "desktop" | "mobile";
};

function getWinnerHeadline(
  verdict: BattleVerdict,
  winner: NormalisedTool | null,
  objectiveLabel: string | null,
): string {
  if (verdict.state === "editorial_lead" && winner) {
    return objectiveLabel
      ? `${winner.name} è più adatto per questo obiettivo`
      : `${winner.name} emerge dal confronto`;
  }
  if (verdict.state === "personal_verdict" && winner) {
    return `${winner.name} è la tua scelta personale`;
  }
  if (verdict.state === "tie") return "Nessun distacco netto";
  if (verdict.state === "insufficient_evidence") {
    return "Valutazione editoriale in preparazione";
  }
  if (verdict.state === "user_preference_required") {
    return "Nessun vincitore automatico";
  }
  return verdict.label;
}

export function CompareVerdictCard({
  verdict,
  winner,
  objectiveLabel = null,
  layoutMode,
}: CompareVerdictCardProps) {
  const headline = getWinnerHeadline(verdict, winner, objectiveLabel);
  const showWinner =
    verdict.state === "editorial_lead" ||
    verdict.state === "personal_verdict";

  return (
    <article
      className="compare-verdict-card"
      data-layout={layoutMode}
      data-state={verdict.state}
      role="region"
      aria-label="Verdetto del confronto"
    >
      <header className="compare-verdict-card__header">
        <Sparkles className="size-4" aria-hidden="true" />
        <h3 className="compare-verdict-card__title">{headline}</h3>
      </header>

      {showWinner && winner ? (
        <p className="compare-verdict-card__winner">
          <strong>{winner.name}</strong>
          {winner.battleScore !== null && winner.battleScore !== undefined ? (
            <span className="compare-verdict-card__winner-score">
              {winner.battleScore}/10
            </span>
          ) : null}
        </p>
      ) : null}

      <span className="compare-verdict-card__label">{verdict.label}</span>

      <ul className="compare-verdict-card__reasons">
        {verdict.reasons.map((reason) => (
          <li key={reason} className="compare-verdict-card__reason">
            {reason}
          </li>
        ))}
      </ul>
    </article>
  );
}
