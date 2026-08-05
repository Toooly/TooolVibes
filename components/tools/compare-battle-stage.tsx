"use client";

import { type CSSProperties } from "react";
import { Scale } from "lucide-react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import type { NormalisedTool, BattleVerdict } from "./tool-battle-shared";
import { ToolFighter } from "./tool-fighter";

type LayoutMode = "desktop" | "mobile";

type BattleState = "idle" | "fighting" | "result";

type CompareBattleStageProps = {
  tools: NormalisedTool[];
  verdict: BattleVerdict | null;
  battleState: BattleState;
  onFight: () => void;
  objectiveLabel?: string | null;
  layoutMode: LayoutMode;
};

function formatEditorialScore(score: number | null, compact?: boolean) {
  if (score === null) return compact ? "—" : "Valutazione editoriale in preparazione";
  return compact ? `${score}/10` : `${score}/10 editoriale`;
}

function DuelCard({
  tool,
  rank,
  isWinner,
  isFighting,
  layoutMode,
}: {
  tool: NormalisedTool;
  rank: number | null;
  isWinner: boolean;
  isFighting: boolean;
  layoutMode: LayoutMode;
}) {
  return (
    <article
      className="compare-battle-stage__duel-card"
      data-winner={isWinner}
      data-layout={layoutMode}
      style={
        {
          "--arena-a": tool.accentFrom,
          "--arena-b": tool.accentTo,
        } as CSSProperties
      }
    >
      <div className="compare-battle-stage__duel-rank">
        <Scale className="size-4" aria-hidden="true" />
        <span>{rank === null ? "—" : `#${rank}`}</span>
      </div>
      {tool.objectiveScore !== null && tool.objectiveScore !== undefined ? (
        <span
          className="compare-battle-stage__duel-fit"
          aria-label={`Fit obiettivo ${tool.objectiveScore} su 10`}
        >
          Fit {tool.objectiveScore}/10
        </span>
      ) : null}

      <ToolFighter
        tool={tool}
        variant="compact"
        isWinner={isWinner}
        isFighting={isFighting}
        layoutId={`battle-duel-${tool.slug}`}
      />

      <div className="compare-battle-stage__duel-copy">
        <h3 className="compare-battle-stage__duel-name">{tool.name}</h3>
        <span>
          {tool.categoryLabel} · {formatEditorialScore(tool.editorialScore)}
        </span>
        {tool.objectiveScore !== null && tool.objectiveScore !== undefined ? (
          <span className="compare-battle-stage__duel-basefit">
            Punteggio {tool.battleScore}/10
          </span>
        ) : null}
      </div>
    </article>
  );
}

function RosterCard({
  tool,
  rank,
  isWinner,
  isFighting,
  layoutMode,
}: {
  tool: NormalisedTool;
  rank: number | null;
  isWinner: boolean;
  isFighting: boolean;
  layoutMode: LayoutMode;
}) {
  return (
    <article
      className="compare-battle-stage__roster-card"
      data-winner={isWinner}
      data-layout={layoutMode}
      style={
        {
          "--arena-a": tool.accentFrom,
          "--arena-b": tool.accentTo,
        } as CSSProperties
      }
    >
      <span className="compare-battle-stage__roster-rank">
        {rank === null ? "—" : `#${rank}`}
      </span>
      <ToolFighter
        tool={tool}
        variant="micro"
        isWinner={isWinner}
        isFighting={isFighting}
        layoutId={`battle-roster-${tool.slug}`}
      />
      <div className="compare-battle-stage__roster-copy">
        <h3 className="compare-battle-stage__roster-name">{tool.name}</h3>
        <span>{formatEditorialScore(tool.editorialScore, true)}</span>
      </div>
    </article>
  );
}

function getRank(tool: NormalisedTool): number | null {
  return tool.objectiveRank ?? tool.compareScore.rank;
}

function getVerdictTitle(
  verdict: BattleVerdict,
  winner: NormalisedTool | null,
  objectiveLabel: string | null,
): string {
  if (winner) {
    return objectiveLabel
      ? `${winner.name} è più adatto per questo obiettivo`
      : `${winner.name} emerge dal confronto`;
  }
  if (verdict.state === "tie") return "Nessun distacco netto";
  if (verdict.state === "insufficient_evidence") {
    return "Una valutazione editoriale è ancora in preparazione";
  }
  return "Nessun vincitore automatico";
}

function getFightButtonLabel(battleState: BattleState): string {
  if (battleState === "fighting") return "Analisi in corso…";
  if (battleState === "result") return "Ricalcola l'esito";
  return "Analizza il confronto";
}

export function CompareBattleStage({
  tools,
  verdict,
  battleState,
  onFight,
  objectiveLabel = null,
  layoutMode,
}: CompareBattleStageProps) {
  const reducedMotion = useReducedMotion();

  if (tools.length < 2) {
    return null;
  }

  const winner = verdict?.winner ?? null;
  const duelTools = tools.slice(0, 2);
  const rosterTools = tools.slice(2);
  const isFighting = battleState === "fighting";
  const showResult = battleState === "result";

  return (
    <section
      className="compare-battle-stage"
      data-layout={layoutMode}
      data-state={battleState}
      aria-label="Arena del confronto"
      aria-busy={isFighting}
    >
      <header className="compare-battle-stage__hud">
        <div className="compare-battle-stage__hud-text">
          <p className="compare-battle-stage__eyebrow">Esito comparativo</p>
          <h2 className="compare-battle-stage__title">
            Quale tool emerge dal confronto?
          </h2>
          <p className="compare-battle-stage__lede">
            Il risultato considera le valutazioni editoriali e il contesto dei
            tool selezionati. Non indica un vincitore assoluto.
          </p>
        </div>
        <span
          className="compare-battle-stage__status"
          aria-live="polite"
          aria-atomic="true"
        >
          {battleState === "idle" && "Pronto"}
          {battleState === "fighting" && "Analisi in corso…"}
          {battleState === "result" &&
            (winner ? `Emerge: ${winner.name}` : verdict?.label)}
        </span>
      </header>

      <div className="compare-battle-stage__arena">
        <div className="compare-battle-stage__duel">
          {duelTools.map((tool) => (
            <DuelCard
              key={tool.slug}
              tool={tool}
              rank={getRank(tool)}
              isWinner={showResult && tool.slug === winner?.slug}
              isFighting={isFighting}
              layoutMode={layoutMode}
            />
          ))}
        </div>

        {rosterTools.length > 0 ? (
          <div
            className="compare-battle-stage__roster"
            aria-label="Altri candidati nel confronto"
          >
            {rosterTools.map((tool) => (
              <RosterCard
                key={tool.slug}
                tool={tool}
                rank={getRank(tool)}
                isWinner={showResult && tool.slug === winner?.slug}
                isFighting={isFighting}
                layoutMode={layoutMode}
              />
            ))}
          </div>
        ) : null}

        {isFighting && !reducedMotion ? (
          <div className="compare-battle-stage__flash" aria-hidden="true" />
        ) : null}

        {showResult ? (
          <div
            className="compare-battle-stage__result-badge"
            data-layout={layoutMode}
            aria-live="polite"
          >
            {getVerdictTitle(verdict!, winner, objectiveLabel)}
          </div>
        ) : null}
      </div>

      <div className="compare-battle-stage__actions">
        <button
          type="button"
          className="compare-battle-stage__fight-btn"
          disabled={isFighting}
          onClick={onFight}
          aria-label={getFightButtonLabel(battleState)}
        >
          <Scale className="size-5" aria-hidden="true" />
          {getFightButtonLabel(battleState)}
        </button>
      </div>
    </section>
  );
}
