"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Columns3, X, Scale, TrendingUp } from "lucide-react";

import { useToolWorkspaceStore, MAX_COMPARE_TOOLS, MIN_COMPARE_TOOLS } from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  getCompareObjectiveLabel,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { levelCTransition } from "@/lib/motion/transitions";
import { playTooolvibesSound } from "@/lib/config/sound";
import {
  celebrateArenaFight,
  normalise,
  withBattleScores,
  withObjectiveScores,
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

type BattleState = "idle" | "analyzing" | "charging" | "clash" | "result";

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
}: {
  tools: NormalisedTool[];
  /** B34: obiettivo attivo; orienta verdetto e lettura della matrice. */
  objective?: CompareObjective | null;
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

  const verdict = getBattleVerdict(tools, objective);
  const winner = verdict.winner;
  const rankBySlug = new Map(verdict.scores.map(({ tool, rank }) => [tool.slug, rank]));
  const scoreBySlug = new Map(verdict.scores.map(({ tool, score }) => [tool.slug, score]));
  const scores = verdict.scores
    .map(({ score }) => score)
    .filter((score): score is number => score !== null);
  const maxScore = scores.length > 0 ? Math.max(...scores) : null;

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
      label: "Verdetto editoriale",
      helper: "sintesi della valutazione",
      render: (t: NormalisedTool) => {
        const rank = rankBySlug.get(t.slug) ?? null;
        const isWinner = t.slug === winner?.slug;
        return (
          <div
            className="mobile-compare-arena__matrix-verdict-card"
            data-winner={isWinner}
          >
            <span className="mobile-compare-arena__matrix-rank">
              {rank === null ? "—" : `#${rank}`}
            </span>
            <strong>
              {isWinner
                ? "Emerge dal confronto"
                : verdict.state === "tie"
                  ? "Risultato equilibrato"
                  : verdict.state === "insufficient_evidence"
                    ? "Una valutazione editoriale è ancora in preparazione"
                    : "Confronta con le tue priorità"}
            </strong>
            <small>
              {isWinner
                ? "Vantaggio supportato dalla valutazione editoriale."
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
        const canVisualizeScore = score !== null && maxScore !== null;
        return (
          <div className="mobile-compare-arena__matrix-score-card">
            <div className="mobile-compare-arena__matrix-score-head">
              <strong>{score === null ? "—" : `${score}/10`}</strong>
              <small>
                {score === null
                  ? "Valutazione editoriale in preparazione"
                  : isWinner
                    ? "Più adatto in questo confronto"
                    : "Punteggio editoriale"}
              </small>
            </div>
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
      label: "Costo lettura",
      helper: "tempo scheda",
      render: (t: NormalisedTool) => (
        <span className="mobile-compare-arena__matrix-time">
          <strong>{t.readingTime}</strong>
          <small>impegno lettura</small>
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

function MobileArenaBattleStage({
  battleState,
  tools,
  verdict,
  objectiveLabel,
}: {
  battleState: BattleState;
  tools: NormalisedTool[];
  verdict: BattleVerdict;
  /** B34: etichetta dell'obiettivo attivo; null = modalità generale. */
  objectiveLabel?: string | null;
}) {
  const reducedMotion = useReducedMotion();
  const statusLabel =
    battleState === "idle"
      ? "Pronto"
      : battleState === "analyzing"
        ? "Analisi in corso…"
        : battleState === "charging"
          ? "Confronto in corso…"
          : battleState === "clash"
            ? "Sintesi…"
            : verdict.label;

  const isAnimating = battleState === "analyzing" || battleState === "charging" || battleState === "clash";
  const winner = verdict.winner;
  const runnerUp = winner
    ? verdict.scores.find(({ tool, score }) => tool.slug !== winner.slug && score !== null) ?? null
    : null;
  const gap =
    winner?.battleScore !== null && winner?.battleScore !== undefined && runnerUp?.score !== null && runnerUp?.score !== undefined
      ? winner.battleScore - runnerUp.score
      : null;

  // V2 verdict title based on state.
  const verdictEyebrow =
    verdict.state === "editorial_lead" && winner
      ? "Più adatto in questo confronto"
      : verdict.state === "tie"
        ? "Risultato equilibrato"
        : verdict.state === "user_preference_required"
          ? "Confronto orientato alla priorità"
          : verdict.state === "insufficient_evidence"
            ? "Confronto da completare"
            : "Verdetto comparativo";

  const verdictTitle = winner
    ? `${winner.name} emerge dal confronto`
    : verdict.state === "tie"
      ? "Nessun vincitore netto"
      : verdict.state === "insufficient_evidence"
        ? "Una valutazione editoriale è ancora in preparazione"
        : "Nessun vincitore automatico";

  const verdictBody = winner
    ? "Ottiene il risultato più solido sui criteri disponibili. Leggi le motivazioni prima di decidere."
    : verdict.state === "tie"
      ? "Le valutazioni sono troppo vicine per indicare una scelta unica. La differenza dipende soprattutto dal tuo caso d'uso."
      : verdict.state === "insufficient_evidence"
        ? "Il verdetto sarà disponibile quando tutti i tool selezionati avranno una valutazione editoriale verificata."
        : "Il risultato considera le valutazioni editoriali e il contesto dei tool selezionati.";

  return (
    <>
      <section
        className="mobile-compare-arena__stage"
        data-state={battleState}
        data-count={tools.length}
        aria-label="Verdetto del confronto"
      >
        <div className="mobile-compare-arena__bg" aria-hidden="true" />

        <header className="mobile-compare-arena__hud">
          <div className="mobile-compare-arena__title-wrap">
            <span className="mobile-compare-arena__eyebrow">Verdetto comparativo</span>
            <h2 className="mobile-compare-arena__title">Quale tool emerge dal confronto?</h2>
            <p className="mobile-compare-arena__lede">
              Il risultato considera le valutazioni editoriali e il contesto dei tool
              selezionati. Non indica un vincitore assoluto.
            </p>
          </div>
          <div className="mobile-compare-arena__hud-pills">
            <span className="mobile-compare-arena__mode">
              {objectiveLabel ?? "Generale"}
            </span>
            <span
              className={cn("mobile-compare-arena__status", `mobile-compare-arena__status--${battleState}`)}
              aria-live="polite"
              aria-atomic="true"
              aria-label={battleState === "result" ? `${statusLabel}: ${winner?.name ?? verdict.label}` : statusLabel}
            >
              {statusLabel}
            </span>
          </div>
        </header>

        {/* Fighter ring: solo durante l'animazione del clash. In stato result
            il ring è nascosto per non duplicare l'informazione del verdetto
            (winner name + score + motivazioni). */}
        {battleState !== "result" ? (
          <div
            className="mobile-compare-arena__ring"
            data-count={tools.length}
            data-clash={battleState === "clash"}
          >
            {tools.length <= 2 ? (
              <>
                <div className="mobile-compare-arena__fighter-side mobile-compare-arena__fighter-side--left">
                  <ToolFighter
                    tool={tools[0]}
                    variant="compact"
                    isWinner={false}
                    isFighting={battleState === "clash"}
                    isAnalyzing={battleState === "analyzing"}
                    isCharging={battleState === "charging"}
                    isClash={battleState === "clash"}
                    layoutId={isAnimating ? undefined : `fighter-${tools[0].slug}`}
                    style={{ "--charge-x": "20%" } as React.CSSProperties}
                  />
                </div>
                <div className="mobile-compare-arena__vs" aria-hidden="true">
                  <span>↔</span>
                </div>
                <div className="mobile-compare-arena__fighter-side mobile-compare-arena__fighter-side--right">
                  <ToolFighter
                    tool={tools[1]}
                    variant="compact"
                    isWinner={false}
                    isFighting={battleState === "clash"}
                    isAnalyzing={battleState === "analyzing"}
                    isCharging={battleState === "charging"}
                    isClash={battleState === "clash"}
                    layoutId={isAnimating ? undefined : `fighter-${tools[1].slug}`}
                    style={{ "--charge-x": "-20%" } as React.CSSProperties}
                  />
                </div>
              </>
            ) : (
              <>
                {tools.slice(0, MAX_COMPARE_TOOLS).map((tool, i) => (
                  <div
                    key={tool.slug}
                    className="mobile-compare-arena__fighter-slot"
                    data-index={i}
                  >
                    <ToolFighter
                      tool={tool}
                      variant="compact"
                      isWinner={false}
                      isFighting={battleState === "clash"}
                      isAnalyzing={battleState === "analyzing"}
                      isCharging={battleState === "charging"}
                      isClash={battleState === "clash"}
                      layoutId={isAnimating ? undefined : `fighter-${tool.slug}`}
                    />
                  </div>
                ))}
                <div className="mobile-compare-arena__vs" aria-hidden="true">
                  <span>↔</span>
                </div>
              </>
            )}

            {battleState === "clash" && !reducedMotion && (
              <div className="mobile-compare-arena__flash" aria-hidden="true" />
            )}
          </div>
        ) : null}
      </section>

      <AnimatePresence>
        {battleState === "result" && (
          <motion.div
            className="mobile-compare-arena__verdict"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={levelCTransition({ preferReducedMotion: reducedMotion })}
          >
            <div className="mobile-compare-arena__verdict-head">
              <div className="mobile-compare-arena__verdict-winner">
                <span className="mobile-compare-arena__verdict-rank">
                  {winner?.compareScore.rank === null || !winner ? "—" : `#${winner.compareScore.rank}`}
                </span>
                <div>
                  <span className="mobile-compare-arena__verdict-label">{verdictEyebrow}</span>
                  <h3 className="mobile-compare-arena__verdict-name">
                    {winner?.name ?? verdictTitle}
                  </h3>
                </div>
              </div>
              {winner?.battleScore !== null && winner?.battleScore !== undefined ? (
                <div className="mobile-compare-arena__verdict-score">
                  <span>{winner.battleScore}</span>
                  <small>/10</small>
                </div>
              ) : null}
            </div>

            <p className="mobile-compare-arena__verdict-body">{verdictBody}</p>

            {runnerUp && gap !== null && gap > 0 ? (
              <div className="mobile-compare-arena__verdict-gap">
                +{gap.toFixed(1)} punti rispetto a {runnerUp.tool.name}
              </div>
            ) : null}

            <ul className="mobile-compare-arena__verdict-reasons">
              {verdict.reasons.slice(0, 3).map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
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

  const tools = useMemo(
    () => withObjectiveScores(withBattleScores(normalise(catalogTools, compareSlugs)), activeObjective),
    [catalogTools, compareSlugs, activeObjective],
  );

  const verdict = useMemo(
    () => (tools.length >= 2 ? getBattleVerdict(tools, activeObjective) : null),
    [tools, activeObjective],
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
  const activeVerdict = verdict ?? getBattleVerdict(sorted, activeObjective);
  const winner = activeVerdict.winner;
  const isRevealed = battleState === "result";

  function handleFight() {
    if (
      (battleState !== "idle" && battleState !== "result") ||
      fightLockedRef.current
    ) {
      return;
    }
    fightLockedRef.current = true;
    clearFightTimers();

    setBattleState("analyzing");

    queueFightTimer(() => {
      setBattleState("charging");
    }, 300);

    queueFightTimer(() => {
      setBattleState("clash");
      playTooolvibesSound("battleHit");
      queueFightTimer(() => playTooolvibesSound("battleHit"), 180);
    }, 800);

    queueFightTimer(() => {
      setBattleState("result");
      if (activeVerdict.winner) {
        playTooolvibesSound("battleWin");
        void celebrateArenaFight(activeVerdict.winner);
      }
      fightLockedRef.current = false;
    }, 1150);
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

      {/* 2. Tool selezionati (sempre visibili, anche prima del verdetto). */}
      <div className="mobile-compare-arena__selected" aria-labelledby="mobile-compare-selected-title">
        <h2 id="mobile-compare-selected-title" className="sr-only">
          Tool selezionati
        </h2>
        <p className="mobile-compare-arena__selected-eyebrow" aria-hidden="true">
          <TrendingUp className="size-4" aria-hidden="true" />
          <span>Tool selezionati</span>
        </p>
        <ul className="mobile-compare-arena__selected-list">
          {sorted.map((tool) => (
            <li key={tool.slug}>
              <CompactToolCard
                tool={tool}
                rank={tool.compareScore.rank ?? undefined}
                isWinner={winner?.slug === tool.slug}
                onRemove={() => toggleCompare(tool.slug)}
              />
            </li>
          ))}
        </ul>
      </div>

      {/* 3-4. Verdetto + motivazioni (HUD + result panel). */}
      <MobileArenaBattleStage
        battleState={battleState}
        tools={sorted}
        verdict={activeVerdict}
        objectiveLabel={activeObjective ? getCompareObjectiveLabel(activeObjective) : null}
      />

      {/* 5. Differenze decisive (matrice). */}
      <DiffMatrix tools={sorted} objective={activeObjective} />

      {/* 6. CTA: ricalcola il verdetto o apri l'analisi. */}
      <div className="mobile-compare-arena__action-area" data-state={battleState}>
        <button
          type="button"
          className="mobile-compare-arena__fight-btn"
          disabled={battleState !== "idle" && battleState !== "result"}
          onClick={handleFight}
        >
          <span className="mobile-compare-arena__fight-icon" aria-hidden="true">
            <Scale className="size-5" />
          </span>
          <span className="mobile-compare-arena__fight-copy">
            <strong>
              {battleState === "result"
                ? "Ricalcola il verdetto"
                : battleState === "idle"
                  ? "Analizza il confronto"
                  : "Analisi in corso…"}
            </strong>
            <small>
              {battleState === "result"
                ? "leggi le differenze verificabili"
                : "leggi le differenze verificabili"}
            </small>
          </span>
        </button>
      </div>

      {/* B35 / FLOW-604: il confronto si chiude in una decisione
          riapribile con contesto, con ritorno ai Salvati. */}
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
