"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Columns3, X, Scale, TrendingUp } from "lucide-react";

import { useToolWorkspaceStore, MIN_COMPARE_TOOLS } from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  getCompareObjectiveLabel,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import { cn } from "@/lib/utils";
import { playTooolvibesSound } from "@/lib/config/sound";
import {
  buildCanonicalObjectiveRanking,
  celebrateArenaFight,
  normalise,
  withBattleScores,
  getBattleVerdict,
  type NormalisedTool,
  type BattleVerdict,
} from "./tool-battle-shared";
import { CompareObjectiveSelector } from "./compare-objective-selector";
import { CompareDecisionPanel } from "./compare-decision-panel";
import { ToolFighter } from "./tool-fighter";
import { CompareTrendList } from "./compare-trend-list";

type MobileCompareViewProps = {
  tools: ToolPublicView[];
  /** Obiettivo attivo condiviso con la vista desktop (B34); null = neutro. */
  objective?: CompareObjective | null;
  onObjectiveChange?: (objective: CompareObjective | null) => void;
  /** Flag B34: OFF nasconde il selettore e riproduce il contratto base B33. */
  objectiveEnabled?: boolean;
  /** Flag B35: OFF nasconde il pannello decisione e chiude il flow al verdetto. */
  decisionEnabled?: boolean;
};

type BattleState = "idle" | "fighting" | "result";

function formatEditorialScore(score: number | null, compact = false) {
  if (score === null) return compact ? "—" : "Valutazione editoriale in preparazione";
  return compact ? `${score}/10` : `${score}/10 editoriale`;
}

/* ---------- sub-components ---------- */

function CompactToolCard({
  tool,
  rank,
  isWinner,
  onRemove,
}: {
  tool: NormalisedTool;
  rank?: number;
  isWinner?: boolean;
  onRemove: () => void;
}) {
  return (
    <article
      className={cn(
        "mobile-compare-arena__compact-card",
        isWinner && "mobile-compare-arena__compact-card--winner",
      )}
      style={{ "--arena-a": tool.accentFrom, "--arena-b": tool.accentTo } as React.CSSProperties}
    >
      <div className="mobile-compare-arena__compact-card-main">
        {rank ? (
          <span className="mobile-compare-arena__compact-rank">#{rank}</span>
        ) : null}
        <span className="mobile-compare-arena__compact-visual">
          <ToolFighter tool={tool} variant="micro" />
        </span>
        <div className="mobile-compare-arena__compact-info">
          <span className="mobile-compare-arena__compact-cat">
            {tool.categoryLabel} · {formatEditorialScore(tool.editorialScore, true)}
          </span>
          <h3 className="mobile-compare-arena__compact-name">{tool.name}</h3>
          <p className="mobile-compare-arena__compact-tldr">{tool.tldr}</p>
        </div>
        <div className="mobile-compare-arena__compact-score">
          <span>{tool.battleScore ?? "—"}</span>
          {tool.battleScore !== null ? <small>/10</small> : null}
        </div>
      </div>

      <div className="mobile-compare-arena__compact-actions">
        <Link href={`/toools/${tool.slug}`} className="mobile-compare-arena__compact-link">
          Apri scheda
        </Link>
        <button
          type="button"
          onClick={onRemove}
          className="mobile-compare-arena__compact-link mobile-compare-arena__compact-link--muted"
        >
          <X className="size-3.5" />
          Rimuovi
        </button>
      </div>
    </article>
  );
}

export function DiffMatrix({
  tools,
  objective = null,
  verdict: suppliedVerdict = null,
  mobile = false,
}: {
  tools: NormalisedTool[];
  /** B34: obiettivo attivo; orienta verdetto e lettura della matrice. */
  objective?: CompareObjective | null;
  /** Pre-computed canonical verdict (no re-sort inside DiffMatrix). */
  verdict?: BattleVerdict | null;
  /** Mobile renders the same canonical data as a criterion-first accordion. */
  mobile?: boolean;
}) {
  const cellsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isSyncing = useRef(false);
  const headWrapRef = useRef<HTMLDivElement | null>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const el = headWrapRef.current;
    if (!el) return;
    const check = () => setCanScroll(el.scrollWidth > el.clientWidth);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [tools.length]);

  if (tools.length < MIN_COMPARE_TOOLS) return null;

  const verdict = suppliedVerdict ?? getBattleVerdict(tools, objective);
  const winner = verdict.winner;
  const rankBySlug = new Map(verdict.scores.map(({ tool, rank }) => [tool.slug, rank]));
  const scoreBySlug = new Map(verdict.scores.map(({ tool, score }) => [tool.slug, score]));
  const scores = verdict.scores
    .map(({ score }) => score)
    .filter((score): score is number => score !== null);
  const maxScore = scores.length > 0 ? Math.max(...scores) : null;

  if (mobile) {
    return <MobileFactorAccordion tools={tools} objective={objective} verdict={verdict} />;
  }

  const handleScroll = (index: number) => {
    if (isSyncing.current) return;
    const source = cellsRef.current[index];
    if (!source) return;
    isSyncing.current = true;
    cellsRef.current.forEach((el, i) => {
      if (el && i !== index) {
        el.scrollLeft = source.scrollLeft;
      }
    });
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  const rows = [
    {
      id: "verdict",
      label: "Sintesi della valutazione",
      helper: "sintesi della valutazione",
      render: (t: NormalisedTool) => {
        const rank = rankBySlug.get(t.slug) ?? null;
        const isWinner = t.slug === winner?.slug;
        // Summary comes from the canonical engine (per-tool, per-objective).
        const engineSummary = t.objectiveSummary ?? "";
        const fitScore = t.objectiveScore ?? null;
        // Use the engine summary when available; otherwise fall back to copy
        // reserved for genuinely insufficient data.
        const contextualSummary = engineSummary || (
          verdict.state === "insufficient_evidence"
            ? "Una valutazione editoriale è ancora in preparazione"
            : "Confronta con le tue priorità"
        );
        return (
          <div
            className="mobile-compare-arena__matrix-verdict-card"
            data-winner={isWinner}
          >
            <span className="mobile-compare-arena__matrix-rank">
              {rank === null ? "—" : `#${rank}`}
            </span>
            <strong>{contextualSummary}</strong>
            <small>
              {fitScore !== null
                ? `Fit obiettivo: ${fitScore}/10`
                : "La scelta non viene dedotta da completezza dei campi o parole chiave."}
            </small>
          </div>
        );
      },
      winnerSlugs: winner ? [winner.slug] : [],
    },
    {
      id: "score",
      label: "Valutazione editoriale",
      helper: "punteggio su 10",
      render: (t: NormalisedTool, isWinner: boolean) => {
        const score = scoreBySlug.get(t.slug) ?? t.battleScore;
        const fitScore = t.objectiveScore ?? null;
        const fitRank = t.objectiveRank ?? null;
        const canVisualizeScore = score !== null && maxScore !== null;
        return (
          <div className="mobile-compare-arena__matrix-score-card">
            <div className="mobile-compare-arena__matrix-score-head">
              <strong>{score === null ? "—" : `${score}/10`}</strong>
              <small>
                {score === null
                  ? "Valutazione editoriale in preparazione"
                  : isWinner
                    ? "Più adatto per questo obiettivo"
                    : "Punteggio TooolVibes"}
              </small>
            </div>
            {fitScore !== null ? (
              <div className="mobile-compare-arena__fit-block" aria-label={`Fit obiettivo ${fitScore} su 10`}>
                <small className="mobile-compare-arena__fit-note">
                  Fit “{objective ? getCompareObjectiveLabel(objective) : "obiettivo"}”: {fitScore}/10
                  {fitRank !== null ? ` · rank ${fitRank}` : ""}
                </small>
              </div>
            ) : null}
            {canVisualizeScore ? (
              <div className="mobile-compare-arena__matrix-bar">
                <span
                  className={cn(isWinner && "is-winner")}
                  style={{ width: String(maxScore === 0 ? 0 : (score / maxScore) * 100) + "%" }}
                />
              </div>
            ) : null}
          </div>
        );
      },
      winnerSlugs: winner ? [winner.slug] : [],
    },
    {
      id: "factor-bars",
      label: "Fattori per l'obiettivo",
      helper: "dimensioni e pesi",
      render: (t: NormalisedTool) => {
        const dims = t.weightedDimensions ?? [];
        if (dims.length === 0) {
          return (
            <div className="mobile-compare-arena__matrix-evidence">
              <small>Seleziona un obiettivo per vedere il peso dei fattori.</small>
            </div>
          );
        }
        return (
          <div className="compare-factor-bars" aria-label={`Fattori per ${t.name}`}>
            {dims.map((dim) => (
              <div key={dim.key} className="compare-factor-bar">
                <div className="compare-factor-bar__head">
                  <span className="compare-factor-bar__label">{dim.label}</span>
                  <span className="compare-factor-bar__value">
                    {dim.value}/5 · peso {Math.round(dim.weight * 100)}%
                  </span>
                </div>
                <div
                  className="compare-factor-bar__track"
                  role="meter"
                  aria-label={`${dim.label}: valore ${dim.value} su 5, peso ${Math.round(dim.weight * 100)} percento`}
                  aria-valuenow={dim.value}
                  aria-valuemin={1}
                  aria-valuemax={5}
                >
                  <span
                    className="compare-factor-bar__fill"
                    data-primary={dim.isPrimary}
                    style={{ width: `${(dim.value / 5) * 100}%` }}
                  />
                </div>
                <div className="compare-factor-bar__weight">
                  <span className="compare-factor-bar__weight-fill" style={{ width: `${Math.min(dim.weight * 100, 100)}%` }} />
                  contributo {dim.contribution.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        );
      },
      winnerSlugs: [] as string[],
    },
    {
      id: "category",
      label: "Ambito principale",
      helper: "dove si posiziona",
      render: (t: NormalisedTool) => (
        <div className="mobile-compare-arena__matrix-evidence">
          <span className="mobile-compare-arena__matrix-badge">{t.categoryLabel}</span>
          <small>Il confronto va letto dentro questa categoria.</small>
        </div>
      ),
      winnerSlugs: [] as string[],
    },
    {
      id: "use-cases",
      label: "Casi d'uso",
      helper: "scenari analizzati",
      render: (t: NormalisedTool) => (
        <div className="mobile-compare-arena__matrix-evidence">
          {t.useCases.length ? (
            <>
              {t.useCases.slice(0, 2).map((useCase) => (
                <span key={useCase}>{useCase}</span>
              ))}
              <small>{t.useCases.length} scenari analizzati</small>
            </>
          ) : (
            <small>Da valutare con altri dati.</small>
          )}
        </div>
      ),
      winnerSlugs: [] as string[],
    },
    {
      id: "strengths",
      label: "Punti di forza",
      helper: "dove emerge",
      render: (t: NormalisedTool) => (
        <div
          title={t.highlights.join(" - ")}
          className="mobile-compare-arena__matrix-evidence"
        >
          {t.highlights.length ? (
            <>
              {t.highlights.slice(0, 2).map((highlight) => (
                <span key={highlight}>{highlight}</span>
              ))}
              <small>{t.highlights.length} punti di forza</small>
            </>
          ) : (
            <small>Punti di forza non ancora pubblicati.</small>
          )}
        </div>
      ),
      winnerSlugs: [] as string[],
    },
    {
      id: "ideal-use",
      label: "Quando sceglierlo",
      helper: "decisione pratica",
      render: (t: NormalisedTool) => (
        <span title={t.useCase} className="mobile-compare-arena__matrix-long mobile-compare-arena__matrix-long--decision">
          {t.useCase || t.tldr}
        </span>
      ),
      winnerSlugs: [] as string[],
    },
    {
      id: "editor-note",
      label: "Nota decisiva",
      helper: "perché pesa",
      render: (t: NormalisedTool) => (
        <span title={t.review} className="mobile-compare-arena__matrix-long mobile-compare-arena__matrix-long--decision">
          {t.review || t.tldr}
        </span>
      ),
      winnerSlugs: [] as string[],
    },
    {
      id: "reading-time",
      label: "Tempo di analisi",
      helper: "tempo scheda",
      render: (t: NormalisedTool) => (
        <span className="mobile-compare-arena__matrix-time">
          <strong>{t.readingTime}</strong>
          <small>impegno di analisi</small>
        </span>
      ),
      winnerSlugs: [] as string[],
    },
  ];

  return (
    <section className="mobile-compare-arena__matrix" data-count={tools.length}>
      <div className="mobile-compare-arena__matrix-header">
        <Scale className="size-4" />
        <div>
          <span>Cosa confrontare</span>
          <small>Una lettura decisionale, non una tabella piatta.</small>
        </div>
      </div>

      <div className="mobile-compare-arena__matrix-head" aria-hidden="true">
        <div className="mobile-compare-arena__matrix-axis mobile-compare-arena__matrix-axis--head">
          <span>Fattore</span>
          <small>cosa leggere</small>
        </div>
        <div
          className="mobile-compare-arena__matrix-scroll-wrap"
          tabIndex={0}
          aria-label="Tool confrontati"
          ref={(el) => {
            headWrapRef.current = el;
            cellsRef.current[rows.length] = el;
          }}
          onScroll={() => handleScroll(rows.length)}
        >
          {canScroll && (
            <div className="mobile-compare-arena__matrix-scroll-hint" aria-hidden="true">
              <ArrowRight size={14} />
            </div>
          )}
          <div className="mobile-compare-arena__matrix-cells">
            {tools.map((tool) => (
              <div
                key={tool.slug}
                className="mobile-compare-arena__matrix-cell mobile-compare-arena__matrix-cell--head"
                style={{ "--arena-a": tool.accentFrom, "--arena-b": tool.accentTo } as CSSProperties}
              >
                <span className="mobile-compare-arena__matrix-tool">{tool.name}</span>
                <span className="mobile-compare-arena__matrix-tool-score">
                  {rankBySlug.get(tool.slug) === null || scoreBySlug.get(tool.slug) === null
                    ? "Valutazione editoriale in preparazione"
                    : `#${rankBySlug.get(tool.slug)} · ${scoreBySlug.get(tool.slug)}/10`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mobile-compare-arena__matrix-grid">
        {rows.map((row, rowIndex) => (
          <div key={row.id} className="mobile-compare-arena__matrix-row">
            <div className="mobile-compare-arena__matrix-axis">
              <span>{row.label}</span>
              <small>{row.helper}</small>
            </div>
            <div
              className="mobile-compare-arena__matrix-scroll-wrap"
              tabIndex={0}
              aria-label={"Valori: " + row.label}
              ref={(el) => {
                cellsRef.current[rowIndex] = el;
              }}
              onScroll={() => handleScroll(rowIndex)}
            >
              {canScroll && (
                <div className="mobile-compare-arena__matrix-scroll-hint" aria-hidden="true">
                  <ArrowRight size={14} />
                </div>
              )}
              <div className="mobile-compare-arena__matrix-cells">
                {tools.map((tool) => {
                  const isWinner = row.winnerSlugs.includes(tool.slug);
                  return (
                    <div
                      key={tool.slug}
                      className={cn(
                        "mobile-compare-arena__matrix-cell",
                        isWinner && "is-winner",
                      )}
                      style={{ "--arena-a": tool.accentFrom, "--arena-b": tool.accentTo } as CSSProperties}
                    >
                      <span className="mobile-compare-arena__matrix-value">{row.render(tool, isWinner)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MobileResultStage({
  tools,
  verdict,
  battleState,
  onFight,
  objectiveLabel,
}: {
  tools: NormalisedTool[];
  verdict: BattleVerdict | null;
  battleState: BattleState;
  onFight: () => void;
  objectiveLabel?: string | null;
}) {
  if (!verdict) return null;

  const winner = verdict.winner;
  const runnerUp = winner
    ? (verdict.scores.find(
        ({ tool, score }) => tool.slug !== winner.slug && score !== null,
      ) ?? null)
    : null;
  const winnerRaw = winner?.objectiveRawScore ?? winner?.battleScore ?? null;
  const runnerUpRaw = runnerUp
    ? (verdict.scores.find(({ tool }) => tool.slug === runnerUp.tool.slug)?.tool
        .objectiveRawScore ?? runnerUp.score)
    : null;
  const gap =
    winnerRaw !== null && runnerUpRaw !== null ? winnerRaw - runnerUpRaw : null;
  const verdictEyebrow =
    verdict.state === "editorial_lead" && winner
      ? "Più adatto per questo obiettivo"
      : verdict.state === "tie"
        ? "Risultato equilibrato"
        : verdict.state === "user_preference_required"
          ? "Confronto orientato alla priorità"
          : verdict.state === "insufficient_evidence"
            ? "Confronto da completare"
            : "Esito comparativo";
  const verdictTitle = winner
    ? winner.name
    : verdict.state === "tie"
      ? "Nessun vincitore netto"
      : verdict.state === "insufficient_evidence"
        ? "Valutazione editoriale in preparazione"
        : "Nessun vincitore automatico";
  const verdictBody = winner
    ? "Ottiene il risultato più solido sui criteri disponibili. Leggi le motivazioni prima di decidere."
    : verdict.state === "tie"
      ? "Le valutazioni sono troppo vicine per indicare una scelta unica. La differenza dipende soprattutto dal tuo caso d'uso."
      : verdict.state === "insufficient_evidence"
        ? "L'esito sarà disponibile quando tutti i tool selezionati avranno una valutazione editoriale verificata."
        : "Il risultato considera le valutazioni editoriali e il contesto dei tool selezionati.";
  const winnerScore = winner
    ? (verdict.scores.find(({ tool }) => tool.slug === winner.slug)?.score ??
      winner.battleScore)
    : null;
  const isFighting = battleState === "fighting";

  return (
    <section
      className="mobile-result-stage"
      aria-label="Esito del confronto"
      aria-busy={isFighting}
    >
      <header className="mobile-result-stage__header">
        <span className="mobile-result-stage__eyebrow">{verdictEyebrow}</span>
        <span className="mobile-result-stage__mode">
          {objectiveLabel ?? `Generale · ${tools.length} tool`}
        </span>
      </header>

      {isFighting ? (
        <div
          className="mobile-result-stage__loading"
          role="status"
          aria-live="polite"
        >
          <span className="mobile-result-stage__spinner" aria-hidden="true" />
          Analisi in corso…
        </div>
      ) : (
        <>
          <div className="mobile-result-stage__winner">
            <span className="mobile-result-stage__winner-rank">
              {winner?.objectiveRank ?? winner?.compareScore.rank ?? "—"}
            </span>
            <strong className="mobile-result-stage__winner-name">
              {verdictTitle}
            </strong>
            {winnerScore !== null ? (
              <span className="mobile-result-stage__winner-score">
                <span>{winnerScore}</span>
                <small>/10</small>
              </span>
            ) : null}
          </div>
          <p className="mobile-result-stage__body">{verdictBody}</p>
          {runnerUp && gap !== null && gap > 0 ? (
            <span className="mobile-result-stage__gap">
              +{gap.toFixed(1)} punti rispetto a {runnerUp.tool.name}
            </span>
          ) : null}
          <ul className="mobile-result-stage__reasons">
            {verdict.reasons.slice(0, 3).map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </>
      )}

      <div
        className="mobile-compare-arena__action-area"
        data-state={battleState}
      >
        <button
          type="button"
          className="mobile-compare-arena__fight-btn"
          disabled={isFighting}
          onClick={onFight}
        >
          <span className="mobile-compare-arena__fight-icon" aria-hidden="true">
            <Scale className="size-5" />
          </span>
          <span className="mobile-compare-arena__fight-copy">
            <strong>
              {battleState === "result"
                ? "Ricalcola l'esito"
                : isFighting
                  ? "Analisi in corso…"
                  : "Analizza il confronto"}
            </strong>
            <small>leggi le differenze verificabili</small>
          </span>
        </button>
      </div>
    </section>
  );
}

function MobileRankingList({
  tools,
  winner,
  onRemove,
}: {
  tools: NormalisedTool[];
  winner: NormalisedTool | null;
  onRemove: (slug: string) => void;
}) {
  return (
    <ol className="mobile-compare-ranking">
      {tools.map((tool, index) => {
        const isWinner = winner?.slug === tool.slug;
        const rank = tool.objectiveRank ?? tool.compareScore.rank ?? index + 1;
        return (
          <li
            key={tool.slug}
            className={cn(
              "mobile-compare-ranking__item",
              isWinner && "mobile-compare-ranking__item--winner",
            )}
          >
            <span className="mobile-compare-ranking__pos">#{rank}</span>
            <span className="mobile-compare-ranking__info">
              <strong className="mobile-compare-ranking__name">
                {tool.name}
              </strong>
              <small className="mobile-compare-ranking__reason">
                {tool.objectiveSummary || tool.tldr}
              </small>
            </span>
            <span className="mobile-compare-ranking__score">
              <span>{tool.battleScore ?? "—"}</span>
              <small>/10</small>
            </span>
            <button
              type="button"
              className="mobile-compare-ranking__remove"
              onClick={() => onRemove(tool.slug)}
              aria-label={`Rimuovi ${tool.name} dal confronto`}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function MobileFactorAccordion({
  tools,
  objective,
  verdict,
}: {
  tools: NormalisedTool[];
  objective: CompareObjective | null;
  verdict: BattleVerdict;
}) {
  const [openFactor, setOpenFactor] = useState<string | null>(null);
  const factors = Array.from(
    new Map(
      tools
        .flatMap((tool) => tool.weightedDimensions ?? [])
        .map((dimension) => [dimension.key, dimension.label]),
    ),
  );

  if (factors.length === 0) {
    return (
      <p className="mobile-factor-accordion__empty">
        Seleziona un obiettivo per vedere il peso dei fattori.
      </p>
    );
  }

  return (
    <div
      className="mobile-factor-accordion"
      aria-label={`Fattori per ${objective ? getCompareObjectiveLabel(objective) : "il confronto"}`}
    >
      {factors.map(([key, label], index) => {
        const isOpen =
          openFactor === key || (openFactor === null && index === 0);
        const contentId = `mobile-factor-${key}`;
        return (
          <section key={key} className="mobile-factor-accordion__section">
            <button
              type="button"
              className="mobile-factor-accordion__summary"
              onClick={() => setOpenFactor(isOpen ? "" : key)}
              aria-expanded={isOpen}
              aria-controls={contentId}
            >
              <span>{label}</span>
              <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? (
              <div id={contentId} className="mobile-factor-accordion__content">
                {tools.map((tool) => {
                  const dimension = tool.weightedDimensions?.find(
                    (item) => item.key === key,
                  );
                  if (!dimension) return null;
                  return (
                    <div
                      key={tool.slug}
                      className="mobile-factor-accordion__tool-row"
                      data-winner={verdict.winner?.slug === tool.slug}
                    >
                      <span className="mobile-factor-accordion__tool-name">
                        {tool.name}
                      </span>
                      <span className="mobile-factor-accordion__tool-value">
                        {dimension.value}/5
                      </span>
                      <span
                        className="mobile-factor-accordion__tool-bar"
                        role="meter"
                        aria-valuenow={dimension.value}
                        aria-valuemin={1}
                        aria-valuemax={5}
                        aria-label={`${tool.name}: ${dimension.label}, valore ${dimension.value} su 5, peso ${Math.round(dimension.weight * 100)}%, contributo ${dimension.contribution.toFixed(2)}`}
                      >
                        <span
                          className="mobile-factor-accordion__tool-bar-fill"
                          style={
                            {
                              width: `${(dimension.value / 5) * 100}%`,
                              "--arena-a": tool.accentFrom,
                            } as CSSProperties
                          }
                        />
                      </span>
                      <span className="mobile-factor-accordion__tool-contrib">
                        contrib {dimension.contribution.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

function MobileToolDetails({ tools }: { tools: NormalisedTool[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(
    tools[0]?.slug ?? null,
  );

  return (
    <div className="mobile-tool-details">
      {tools.map((tool) => {
        const isOpen = openSlug === tool.slug;
        const contentId = `mobile-tool-details-${tool.slug}`;
        const detailRows = [
          ["Ambito principale", tool.categoryLabel],
          [
            "Casi d'uso",
            tool.useCases.length
              ? tool.useCases.join(" · ")
              : "Da valutare con altri dati.",
          ],
          [
            "Punti di forza",
            tool.highlights.length
              ? tool.highlights.join(" · ")
              : "Non ancora pubblicati.",
          ],
          ["Quando sceglierlo", tool.useCase || tool.tldr],
          ["Nota decisiva", tool.review || tool.tldr],
          ["Tempo di analisi", tool.readingTime],
        ];
        return (
          <section key={tool.slug} className="mobile-tool-details__card">
            <button
              type="button"
              className="mobile-tool-details__summary"
              onClick={() => setOpenSlug(isOpen ? null : tool.slug)}
              aria-expanded={isOpen}
              aria-controls={contentId}
            >
              <span>{tool.name}</span>
              <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
            </button>
            {isOpen ? (
              <div id={contentId} className="mobile-tool-details__content">
                {detailRows.map(([label, value]) => (
                  <div key={label} className="mobile-tool-details__row">
                    <span className="mobile-tool-details__label">{label}</span>
                    <span className="mobile-tool-details__value">{value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}

/* ---------- main ---------- */

export function MobileCompareView({
  tools: catalogTools,
  objective = null,
  onObjectiveChange,
  objectiveEnabled = true,
  decisionEnabled = true,
}: MobileCompareViewProps) {
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const toggleCompare = useToolWorkspaceStore((s) => s.toggleCompare);
  const [battleState, setBattleState] = useState<BattleState>("idle");
  const fightTimerRefs = useRef<number[]>([]);
  const fightLockedRef = useRef(false);
  // B34: con il flag OFF l'obiettivo è sempre neutro (contratto base B33).
  const activeObjective = objectiveEnabled ? objective : null;
  const compareKey = `${compareSlugs.join("|")}::${activeObjective ?? "neutral"}`;

  function clearFightTimers() {
    fightTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    fightTimerRefs.current = [];
  }

  function queueFightTimer(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    fightTimerRefs.current.push(timer);
  }

  const ranking = useMemo(
    () => buildCanonicalObjectiveRanking(withBattleScores(normalise(catalogTools, compareSlugs)), activeObjective),
    [catalogTools, compareSlugs, activeObjective],
  );
  const tools = ranking.orderedTools;
  const canonicalVerdict = ranking.objectiveVerdict;

  const verdict = useMemo(
    () => (tools.length >= 2 ? getBattleVerdict(tools, activeObjective, null, canonicalVerdict) : null),
    [tools, activeObjective, canonicalVerdict],
  );

  useEffect(() => {
    clearFightTimers();
    fightLockedRef.current = false;
    setBattleState("idle");
  }, [compareKey]);

  useEffect(() => {
    return () => {
      clearFightTimers();
    };
  }, []);

  if (tools.length === 0) {
    return (
      <div className="mobile-compare-arena mobile-compare-arena--onboarding">
        <div className="mobile-compare-arena__empty">
          <div className="mobile-compare-arena__empty-icon">
            <Columns3 className="size-10" />
          </div>
          <h2>Nessun candidato nel confronto.</h2>
          <p>Aggiungi {MIN_COMPARE_TOOLS} o pi&ugrave; tool dal catalogo per far emergere le differenze vere.</p>
          <Link href="/archivio" className="mobile-compare-arena__cta">
            Scegli i tool
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  if (tools.length === 1) {
    return (
      <div className="mobile-compare-arena mobile-compare-arena--onboarding">
        <CompactToolCard tool={tools[0]} onRemove={() => toggleCompare(tools[0].slug)} />
        <div className="mobile-compare-arena__partial">
          <p className="mobile-compare-arena__partial-label">Confronto parziale</p>
          <p>{tools[0].name} è già nel confronto. Aggiungi un altro profilo per vedere le differenze.</p>
          <Link href="/archivio" className="mobile-compare-arena__cta">
            Aggiungi candidato
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  // The input order is retained unless a supported editorial assessment gives
  // candidates shared ranks; no slug or field-completeness ordering is used.
  const sorted = verdict ? verdict.scores.map((entry) => entry.tool) : tools;
  const activeVerdict = verdict!;
  const winner = activeVerdict.winner;
  const isRevealed = battleState === "result";

  function handleFight() {
    if (battleState === "fighting" || fightLockedRef.current) return;
    fightLockedRef.current = true;
    clearFightTimers();
    setBattleState("fighting");
    queueFightTimer(() => {
      setBattleState("result");
      if (activeVerdict.winner) {
        playTooolvibesSound("battleWin");
        void celebrateArenaFight(activeVerdict.winner);
      }
      fightLockedRef.current = false;
    }, 600);
  }

  return (
    <div className="mobile-compare-arena">
      {objectiveEnabled && onObjectiveChange ? (
        <CompareObjectiveSelector
          objective={activeObjective}
          onObjectiveChange={onObjectiveChange}
          idPrefix="mobile"
        />
      ) : null}

      <MobileResultStage
        tools={sorted}
        verdict={activeVerdict}
        battleState={battleState}
        onFight={handleFight}
        objectiveLabel={
          activeObjective ? getCompareObjectiveLabel(activeObjective) : null
        }
      />

      <section aria-label="Classifica">
        <div className="mobile-compare-section-header">
          <TrendingUp className="size-4" aria-hidden="true" />
          <span>Classifica</span>
        </div>
        <MobileRankingList
          tools={sorted}
          winner={winner}
          onRemove={(slug) => toggleCompare(slug)}
        />
      </section>

      <section aria-label="Fattori decisivi">
        <div className="mobile-compare-section-header">
          <Scale className="size-4" aria-hidden="true" />
          <span>Fattori decisivi</span>
        </div>
        <DiffMatrix
          tools={sorted}
          objective={activeObjective}
          verdict={activeVerdict}
          mobile={true}
        />
      </section>

      <section aria-label="Dettaglio per tool">
        <div className="mobile-compare-section-header">
          <Columns3 className="size-4" aria-hidden="true" />
          <span>Dettaglio per tool</span>
        </div>
        <MobileToolDetails tools={sorted} />
      </section>

      {isRevealed ? (
        <CompareDecisionPanel
          tools={sorted}
          objective={activeObjective}
          enabled={decisionEnabled}
          idPrefix="mobile"
        />
      ) : null}

      <div className="mobile-compare-arena__trend">
        <CompareTrendList />
      </div>
    </div>
  );
}
