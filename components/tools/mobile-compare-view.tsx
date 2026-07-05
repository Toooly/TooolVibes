"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Columns3, X, Scale, Sparkles, Swords, TrendingUp } from "lucide-react";

import { useToolWorkspaceStore, MAX_COMPARE_TOOLS } from "@/lib/stores/tool-workspace-store";
import { type DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { playTooolvibesSound } from "@/lib/config/sound";
import {
  celebrateArenaFight,
  normalise,
  withBattleScores,
  withObjectiveScores,
  getBattleVerdict,
  BATTLE_OBJECTIVES,
  type NormalisedTool,
  type BattleVerdict,
  type BattleObjective,
} from "./tool-battle-shared";
import { ToolFighter } from "./tool-fighter";
import { CompareTrendList } from "./compare-trend-list";

type MobileCompareViewProps = {
  directoryTools: DirectoryTool[];
  legacyTools: ToolRecord[];
};

type BattleState = "idle" | "analyzing" | "charging" | "clash" | "result";

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
          <span className="mobile-compare-arena__compact-cat">{tool.categoryLabel}</span>
          <h3 className="mobile-compare-arena__compact-name">{tool.name}</h3>
          <p className="mobile-compare-arena__compact-tldr">{tool.tldr}</p>
        </div>
        <div className="mobile-compare-arena__compact-score">
          <span>{tool.objectiveScore ?? tool.battleScore}</span>
          <small>/100</small>
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

export function DiffMatrix({ tools }: { tools: NormalisedTool[] }) {
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

  if (tools.length < 2) return null;

  const scores = tools.map((t) => t.objectiveScore ?? t.battleScore);
  const maxScore = Math.max(...scores, 1);

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

  const scoreMax = Math.max(...scores);
  const fitMax = Math.max(...tools.map((t) => t.useCasesCount));
  const highlightsMax = Math.max(...tools.map((t) => t.highlights.length));

  const rows = [
    {
      id: "category",
      label: "Categoria",
      render: (t: NormalisedTool) => (
        <span className="mobile-compare-arena__matrix-badge">{t.categoryLabel}</span>
      ),
      winnerIndices: [] as number[],
    },
    {
      id: "score",
      label: "Punteggio",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <div className="mobile-compare-arena__matrix-bar">
          <span
            className={cn(isWinner && "is-winner")}
            style={{ width: `${((t.objectiveScore ?? t.battleScore) / maxScore) * 100}%` }}
          />
          <strong>{t.objectiveScore ?? t.battleScore}</strong>
        </div>
      ),
      winnerIndices: tools.flatMap((t, i) => (t.battleScore === scoreMax ? [i] : [])),
    },
    {
      id: "use-count",
      label: "Uso",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <span className={cn(isWinner && "mobile-compare-arena__matrix-value--winner")}>
          {t.useCasesCount || "—"}
        </span>
      ),
      winnerIndices: tools.flatMap((t, i) => (t.useCasesCount === fitMax ? [i] : [])),
    },
    {
      id: "ideal-use",
      label: "Uso ideale",
      render: (t: NormalisedTool) => (
        <span title={t.useCase} className="mobile-compare-arena__matrix-long">
          {t.useCase || t.tldr}
        </span>
      ),
      winnerIndices: [] as number[],
    },
    {
      id: "highlights-list",
      label: "Punti forti",
      render: (t: NormalisedTool) => (
        <span title={t.highlights.join(" · ")} className="mobile-compare-arena__matrix-long">
          {t.highlights.length ? (
            <>
              {t.highlights.slice(0, 2).join(" · ")}
              <span className="mobile-compare-arena__matrix-count">({t.highlights.length})</span>
            </>
          ) : (
            "Da valutare"
          )}
        </span>
      ),
      winnerIndices: tools.flatMap((t, i) => (t.highlights.length === highlightsMax ? [i] : [])),
    },
    {
      id: "editor-note",
      label: "Nota editoriale",
      render: (t: NormalisedTool) => (
        <span title={t.review} className="mobile-compare-arena__matrix-long">
          {t.review || t.tldr}
        </span>
      ),
      winnerIndices: [] as number[],
    },
    {
      id: "reading-time",
      label: "Tempo",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <span className={cn(isWinner && "mobile-compare-arena__matrix-value--winner")}>
          {t.readingTime}
        </span>
      ),
      winnerIndices: [] as number[],
    },
  ];

  return (
    <section className="mobile-compare-arena__matrix" data-count={tools.length}>
      <div className="mobile-compare-arena__matrix-header">
        <Scale className="size-4" />
        <span>Confronto caratteristiche</span>
      </div>

      <div className="mobile-compare-arena__matrix-head" aria-hidden="true">
        <div className="mobile-compare-arena__matrix-axis mobile-compare-arena__matrix-axis--head">
          Attributo
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
                style={{ "--arena-a": tool.accentFrom, "--arena-b": tool.accentTo } as React.CSSProperties}
              >
                <span className="mobile-compare-arena__matrix-tool">{tool.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mobile-compare-arena__matrix-grid">
        {rows.map((row, rowIndex) => (
          <div key={row.id} className="mobile-compare-arena__matrix-row">
            <div className="mobile-compare-arena__matrix-axis">{row.label}</div>
            <div
              className="mobile-compare-arena__matrix-scroll-wrap"
              tabIndex={0}
              aria-label={`Valori: ${row.label}`}
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
                {tools.map((tool, toolIndex) => {
                  const isWinner = row.winnerIndices.includes(toolIndex);
                  return (
                    <div
                      key={tool.slug}
                      className={cn(
                        "mobile-compare-arena__matrix-cell",
                        isWinner && "is-winner",
                      )}
                      style={{ "--arena-a": tool.accentFrom, "--arena-b": tool.accentTo } as React.CSSProperties}
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
  objective,
  onObjectiveChange,
}: {
  battleState: BattleState;
  tools: NormalisedTool[];
  verdict: BattleVerdict;
  objective: BattleObjective | null;
  onObjectiveChange: (objective: BattleObjective | null) => void;
}) {
  const reducedMotion = useReducedMotion();
  const statusLabel =
    battleState === "idle"
      ? "Pronti"
      : battleState === "analyzing"
        ? "Analisi obiettivo…"
        : battleState === "charging"
          ? "Carica…"
          : battleState === "clash"
            ? "Scontro…"
            : "Vincitore";

  const isAnimating = battleState === "analyzing" || battleState === "charging" || battleState === "clash";

  return (
    <>
      <section
        className="mobile-compare-arena__stage"
        data-state={battleState}
        data-count={tools.length}
        aria-label="Area di confronto"
      >
        <div className="mobile-compare-arena__bg" aria-hidden="true" />

        <header className="mobile-compare-arena__hud">
          <div className="mobile-compare-arena__title-wrap">
            <span className="mobile-compare-arena__eyebrow">Tool Battle</span>
            <h2 className="mobile-compare-arena__title">Arena</h2>
          </div>
          <span
            className={cn("mobile-compare-arena__status", `mobile-compare-arena__status--${battleState}`)}
            aria-live="polite"
            aria-atomic="true"
            aria-label={battleState === "result" ? `${statusLabel}: ${verdict.winner.name}` : statusLabel}
          >
            {statusLabel}
          </span>
        </header>

        <div className="mobile-compare-arena__objectives" role="group" aria-label="Obiettivo">
          <button
            type="button"
            className={cn("mobile-compare-arena__chip", objective === null && "is-active")}
            onClick={() => onObjectiveChange(null)}
          >
            Generale
          </button>
          {BATTLE_OBJECTIVES.map((obj) => (
            <button
              key={obj.key}
              type="button"
              className={cn("mobile-compare-arena__chip", objective === obj.key && "is-active")}
              onClick={() => onObjectiveChange(obj.key)}
            >
              {obj.label}
            </button>
          ))}
        </div>

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
                  isWinner={battleState === "result" && tools[0].slug === verdict.winner.slug}
                  isDefeated={battleState === "result" && tools[0].slug !== verdict.winner.slug}
                  isFighting={battleState === "clash"}
                  isAnalyzing={battleState === "analyzing"}
                  isCharging={battleState === "charging"}
                  isClash={battleState === "clash"}
                  layoutId={isAnimating ? undefined : `fighter-${tools[0].slug}`}
                  style={{ "--charge-x": "20%" } as React.CSSProperties}
                />
              </div>
              <div className="mobile-compare-arena__vs" aria-hidden="true">
                <span>VS</span>
              </div>
              <div className="mobile-compare-arena__fighter-side mobile-compare-arena__fighter-side--right">
                <ToolFighter
                  tool={tools[1]}
                  variant="compact"
                  isWinner={battleState === "result" && tools[1].slug === verdict.winner.slug}
                  isDefeated={battleState === "result" && tools[1].slug !== verdict.winner.slug}
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
                    isWinner={battleState === "result" && tool.slug === verdict.winner.slug}
                    isDefeated={battleState === "result" && tool.slug !== verdict.winner.slug}
                    isFighting={battleState === "clash"}
                    isAnalyzing={battleState === "analyzing"}
                    isCharging={battleState === "charging"}
                    isClash={battleState === "clash"}
                    layoutId={isAnimating ? undefined : `fighter-${tool.slug}`}
                  />
                </div>
              ))}
              <div className="mobile-compare-arena__vs" aria-hidden="true">
                <span>VS</span>
              </div>
            </>
          )}

          {battleState === "clash" && !reducedMotion && (
            <div className="mobile-compare-arena__flash" aria-hidden="true" />
          )}
        </div>
      </section>

      <AnimatePresence>
        {battleState === "result" && (
          <motion.div
            className="mobile-compare-arena__verdict"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
          >
            <div className="mobile-compare-arena__verdict-head">
              <div className="mobile-compare-arena__verdict-winner">
                <span className="mobile-compare-arena__verdict-rank">#1</span>
                <div>
                  <span className="mobile-compare-arena__verdict-label">{verdict.label}</span>
                  <h3 className="mobile-compare-arena__verdict-name">
                    <Sparkles className="size-4" />
                    {verdict.winner.name}
                  </h3>
                </div>
              </div>
              <div className="mobile-compare-arena__verdict-score">
                <span>{verdict.winner.objectiveScore ?? verdict.winner.battleScore}</span>
                <small>/100</small>
              </div>
            </div>

            {verdict.scores[1] && (
              <div className="mobile-compare-arena__verdict-gap">
                +{(verdict.winner.objectiveScore ?? verdict.winner.battleScore) - verdict.scores[1].score} punti rispetto a {verdict.scores[1].tool.name}
              </div>
            )}

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
  directoryTools,
  legacyTools,
}: MobileCompareViewProps) {
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const toggleCompare = useToolWorkspaceStore((s) => s.toggleCompare);
  const [battleState, setBattleState] = useState<BattleState>("idle");
  const [objective, setObjective] = useState<BattleObjective | null>(null);
  const fightTimerRefs = useRef<number[]>([]);
  const fightLockedRef = useRef(false);
  const compareKey = compareSlugs.join("|");

  function clearFightTimers() {
    fightTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    fightTimerRefs.current = [];
  }

  function queueFightTimer(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    fightTimerRefs.current.push(timer);
  }

  const tools = useMemo(
    () => withObjectiveScores(withBattleScores(normalise(directoryTools, legacyTools, compareSlugs)), objective),
    [directoryTools, legacyTools, compareSlugs, objective],
  );

  const verdict = useMemo(() => getBattleVerdict(tools, objective), [tools, objective]);

  useEffect(() => {
    clearFightTimers();
    fightLockedRef.current = false;
    setBattleState("idle");
  }, [compareKey, objective]);

  useEffect(() => {
    return () => {
      clearFightTimers();
    };
  }, []);

  if (tools.length === 0) {
    return (
      <div className="mobile-compare-arena">
        <div className="mobile-compare-arena__empty">
          <div className="mobile-compare-arena__empty-icon">
            <Columns3 className="size-10" />
          </div>
          <h2>Nessun candidato nel confronto.</h2>
          <p>Aggiungi 2 o pi&ugrave; tool dal catalogo per far emergere le differenze vere.</p>
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
      <div className="mobile-compare-arena">
        <CompactToolCard tool={tools[0]} onRemove={() => toggleCompare(tools[0].slug)} />
        <div className="mobile-compare-arena__partial">
          <p className="mobile-compare-arena__partial-label">Confronto parziale</p>
          <p>{tools[0].name} è già nel confronto. Aggiungi un altro profilo per vedere le differenze.</p>
          <Link href="/archivio" className="mobile-compare-arena__cta">
            Aggiungi sfidante
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...tools].sort((a, b) => (b.objectiveScore ?? b.battleScore) - (a.objectiveScore ?? a.battleScore));
  const rest = sorted.slice(1);
  const isRevealed = battleState === "result";

  function handleFight() {
    if (battleState !== "idle" || fightLockedRef.current) return;
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
      playTooolvibesSound("battleWin");
      void celebrateArenaFight(sorted[0]);
      fightLockedRef.current = false;
    }, 1150);
  }

  return (
    <div className="mobile-compare-arena">
      <MobileArenaBattleStage
        battleState={battleState}
        tools={sorted}
        verdict={verdict}
        objective={objective}
        onObjectiveChange={setObjective}
      />

      {isRevealed ? (
        <>
          <div className="mobile-compare-arena__champions">
            <CompactToolCard
              tool={sorted[0]}
              rank={1}
              isWinner
              onRemove={() => toggleCompare(sorted[0].slug)}
            />

            <div className="mobile-compare-arena__challengers">
              {rest.map((tool, i) => (
                <CompactToolCard
                  key={tool.slug}
                  tool={tool}
                  rank={i + 2}
                  onRemove={() => toggleCompare(tool.slug)}
                />
              ))}
            </div>
          </div>

          <DiffMatrix tools={sorted} />

          <div className="mobile-compare-arena__trend">
            <CompareTrendList />
          </div>
        </>
      ) : (
        <div className="mobile-compare-arena__mystery">
          <div className="mobile-compare-arena__mystery-head">
            <TrendingUp className="size-4" />
            <span>Candidati pronti allo scontro</span>
          </div>
          <div className="mobile-compare-arena__mystery-list">
            {tools.map((tool) => (
              <CompactToolCard
                key={tool.slug}
                tool={tool}
                onRemove={() => toggleCompare(tool.slug)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mobile-compare-arena__action-area" data-state={battleState}>
        <button
          type="button"
          className="mobile-compare-arena__fight-btn"
          disabled={battleState !== "idle" && battleState !== "result"}
          onClick={handleFight}
        >
          <span className="mobile-compare-arena__fight-icon" aria-hidden="true">
            <Swords className="size-5" />
          </span>
          <span className="mobile-compare-arena__fight-copy">
            <strong>{battleState === "result" ? "Nuovo scontro" : battleState === "idle" ? "Combatti" : "In corso…"}</strong>
            <small>{battleState === "result" ? "rilancia il ring" : "scopri chi domina"}</small>
          </span>
        </button>
      </div>
    </div>
  );
}
