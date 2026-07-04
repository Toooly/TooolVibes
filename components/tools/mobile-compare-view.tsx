"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Columns3, Trophy, X, Scale, Info, Sparkles } from "lucide-react";

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
  type NormalisedTool,
} from "./tool-battle-shared";
import { ToolFighter } from "./tool-fighter";

type MobileCompareViewProps = {
  directoryTools: DirectoryTool[];
  legacyTools: ToolRecord[];
};


/* ---------- sub-components ---------- */

function ChampionCard({
  tool,
  onRemove,
}: {
  tool: NormalisedTool;
  onRemove: () => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showInfo) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowInfo(false);
    };

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (tooltipRef.current && !tooltipRef.current.contains(target)) {
        setShowInfo(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [showInfo]);

  return (
    <article
      className="mobile-compare-arena__champion"
      style={
        {
          "--arena-a": tool.accentFrom,
          "--arena-b": tool.accentTo,
          "--compare-score-angle": `${tool.battleScore * 3.6}deg`,
        } as CSSProperties
      }
    >
      <div className="mobile-compare-arena__champion-glow" />
      <div className="mobile-compare-arena__champion-inner">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mobile-compare-arena__champion-badge">
                <Trophy className="size-3.5" />
                Candidato #1
              </span>
              <span className="mobile-compare-arena__cat">{tool.categoryLabel}</span>
            </div>
            <h2 className="mobile-compare-arena__champion-name">{tool.name}</h2>
            <p className="mobile-compare-arena__champion-tldr">{tool.tldr}</p>
          </div>
          <div className="mobile-compare-arena__score-wrap">
            <div className="mobile-compare-arena__score">
              <span>{tool.battleScore}</span>
              <small>/100</small>
            </div>
            <button
              type="button"
              aria-label="Come è calcolato il punteggio"
              aria-expanded={showInfo}
              aria-controls="champion-info-tooltip"
              onClick={() => setShowInfo((v) => !v)}
              className="mobile-compare-arena__info"
            >
              <Info className="size-3.5" />
            </button>
            {showInfo && (
              <div
                id="champion-info-tooltip"
                ref={tooltipRef}
                role="tooltip"
                className="mobile-compare-arena__tooltip"
              >
                Il punteggio combina valutazione editoriale, categoria e segnali del tool per evitare pareggi poco utili.
              </div>
            )}
          </div>
        </div>

        <div className="mobile-compare-arena__metrics">
          <div>
            <span>Uso</span>
            <strong>{tool.useCasesCount}</strong>
          </div>
          <div>
            <span>Tag</span>
            <strong>{tool.highlights.length}</strong>
          </div>
          <div>
            <span>Tempo</span>
            <strong>{tool.readingTime}</strong>
          </div>
        </div>

        <div className="mobile-compare-arena__champion-actions">
          <Link
            href={`/toools/${tool.slug}`}
            className="mobile-compare-arena__btn mobile-compare-arena__btn--primary"
          >
            Apri scheda
          </Link>
          <button
            type="button"
            onClick={onRemove}
            className="mobile-compare-arena__btn mobile-compare-arena__btn--ghost"
          >
            <X className="size-4" />
            Rimuovi
          </button>
        </div>
      </div>
    </article>
  );
}

function ChallengerCard({
  tool,
  rank,
  diff,
  onRemove,
}: {
  tool: NormalisedTool;
  rank: number;
  diff: number;
  onRemove: () => void;
}) {
  return (
    <article
      className="mobile-compare-arena__challenger"
      style={
        {
          "--arena-a": tool.accentFrom,
          "--arena-b": tool.accentTo,
        } as CSSProperties
      }
    >
      <div className="flex items-start gap-3">
        <div className="mobile-compare-arena__challenger-rank">#{rank}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mobile-compare-arena__cat">{tool.categoryLabel}</span>
            {diff !== 0 && (
              <span className="mobile-compare-arena__diff">
                {diff > 0 ? "+" : ""}
                {diff} vs #1
              </span>
            )}
          </div>
          <h3 className="mobile-compare-arena__challenger-name">{tool.name}</h3>
          <p className="mobile-compare-arena__challenger-tldr">{tool.tldr}</p>
        </div>
        <div className="mobile-compare-arena__score mobile-compare-arena__score--sm">
          <span>{tool.battleScore}</span>
        </div>
      </div>

      <div className="mobile-compare-arena__challenger-bar">
        <span
          style={{
            width: `${Math.max(20, tool.battleScore)}%`,
            background: `linear-gradient(90deg,${tool.accentFrom},${tool.accentTo})`,
          }}
        />
      </div>

      <div className="mobile-compare-arena__challenger-actions">
        <Link href={`/toools/${tool.slug}`} className="mobile-compare-arena__link">
          Apri scheda
        </Link>
        <button type="button" onClick={onRemove} className="mobile-compare-arena__link mobile-compare-arena__link--muted">
          Rimuovi
        </button>
      </div>
    </article>
  );
}

function MysteryRoster({
  tools,
  onRemove,
}: {
  tools: NormalisedTool[];
  onRemove: (slug: string) => void;
}) {
  return (
    <section className="mobile-compare-arena__mystery-roster" aria-label="Candidati in attesa del fight">
      {tools.map((tool, index) => (
        <article
          key={tool.slug}
          className="mobile-compare-arena__mystery-card"
          style={
            {
              "--arena-a": tool.accentFrom,
              "--arena-b": tool.accentTo,
              "--mystery-delay": `${index * 120}ms`,
            } as CSSProperties
          }
        >
          <div className="mobile-compare-arena__mystery-rank" aria-label="Posizione nascosta">
            ?
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mobile-compare-arena__cat">{tool.categoryLabel}</span>
              <span className="mobile-compare-arena__mystery-chip">Verdetto coperto</span>
            </div>
            <h3 className="mobile-compare-arena__challenger-name">{tool.name}</h3>
            <p className="mobile-compare-arena__challenger-tldr">{tool.tldr}</p>
          </div>
          <div className="mobile-compare-arena__score mobile-compare-arena__score--sm mobile-compare-arena__score--hidden">
            <span>?</span>
          </div>
          <div className="mobile-compare-arena__mystery-actions">
            <Link href={`/toools/${tool.slug}`} className="mobile-compare-arena__link">
              Apri scheda
            </Link>
            <button
              type="button"
              onClick={() => onRemove(tool.slug)}
              className="mobile-compare-arena__link mobile-compare-arena__link--muted"
            >
              Rimuovi
            </button>
          </div>
        </article>
      ))}
    </section>
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

  const maxScore = Math.max(...tools.map((t) => t.battleScore), 1);

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

  const scoreMax = Math.max(...tools.map((t) => t.battleScore));
  const fitMax = Math.max(...tools.map((t) => t.useCasesCount));
  const highlightsMax = Math.max(...tools.map((t) => t.highlights.length));

  const rows = [
    {
      id: "category",
      label: "Categoria",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <span className={cn("mobile-compare-arena__matrix-badge", isWinner && "is-winner")}>
          {t.categoryLabel}
        </span>
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
            style={{ width: `${(t.battleScore / maxScore) * 100}%` }}
          />
          <strong>{t.battleScore}</strong>
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
                style={{ "--arena-a": tool.accentFrom, "--arena-b": tool.accentTo } as CSSProperties}
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
              ref={(el) => { cellsRef.current[rowIndex] = el; }}
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

type BattleState = "idle" | "fighting" | "result";

function getFighterSlotStyle(count: number, index: number) {
  const positions: Record<number, Array<{ top: string; left: string }>> = {
    2: [
      { top: "45%", left: "28%" },
      { top: "45%", left: "72%" },
    ],
    3: [
      { top: "38%", left: "20%" },
      { top: "38%", left: "50%" },
      { top: "38%", left: "80%" },
    ],
    4: [
      { top: "34%", left: "22%" },
      { top: "34%", left: "48%" },
      { top: "34%", left: "74%" },
      { top: "68%", left: "50%" },
    ],
    5: [
      { top: "32%", left: "18%" },
      { top: "28%", left: "38%" },
      { top: "28%", left: "62%" },
      { top: "32%", left: "82%" },
      { top: "70%", left: "50%" },
    ],
  };
  return positions[count]?.[index] ?? { top: "50%", left: "50%" };
}

function MobileArenaBattleStage({
  battleState,
  tools,
  winner,
}: {
  battleState: BattleState;
  tools: NormalisedTool[];
  winner: NormalisedTool;
}) {
  const reducedMotion = useReducedMotion();

  return (
    <section className="mobile-compare-arena__stage" aria-label="Area di confronto">
      <div className="mobile-compare-arena__bg" aria-hidden="true" />

      <header className="mobile-compare-arena__hud">
        <h2 className="mobile-compare-arena__title">Arena</h2>
        <span
          className={cn("mobile-compare-arena__status", `mobile-compare-arena__status--${battleState}`)}
          aria-live="polite"
          aria-atomic="true"
        >
          {battleState === "idle" && "Pronti"}
          {battleState === "fighting" && "Scontro…"}
          {battleState === "result" && `Vincitore: ${winner.name}`}
        </span>
      </header>

      <div className="mobile-compare-arena__ring">
        {tools.map((tool, i) => (
          <div
            key={tool.slug}
            className="mobile-compare-arena__fighter-slot"
            style={getFighterSlotStyle(tools.length, i)}
          >
            <ToolFighter
              tool={tool}
              isWinner={battleState === "result" && tool.slug === winner.slug}
              isFighting={battleState === "fighting"}
              layoutId={`fighter-${tool.slug}`}
            />
          </div>
        ))}

        {battleState === "fighting" && !reducedMotion && (
          <div className="mobile-compare-arena__flash" aria-hidden="true" />
        )}
      </div>

      <AnimatePresence>
        {battleState === "result" && (
          <motion.div
            className="mobile-compare-arena__verdict"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
          >
            <Sparkles className="size-4" />
            <span>{winner.name} vince il confronto</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
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
  const fightTimerRef = useRef<number | null>(null);
  const fightSoundTimerRefs = useRef<number[]>([]);
  const fightLockedRef = useRef(false);
  const compareKey = compareSlugs.join("|");

  function clearFightSoundTimers() {
    fightSoundTimerRefs.current.forEach((timer) => window.clearTimeout(timer));
    fightSoundTimerRefs.current = [];
  }

  function queueFightSound(kind: "battleHit" | "battleWin", delay: number) {
    const timer = window.setTimeout(() => {
      playTooolvibesSound(kind);
    }, delay);
    fightSoundTimerRefs.current.push(timer);
  }

  const tools = useMemo(
    () => withBattleScores(normalise(directoryTools, legacyTools, compareSlugs)),
    [directoryTools, legacyTools, compareSlugs],
  );

  useEffect(() => {
    if (fightTimerRef.current) clearTimeout(fightTimerRef.current);
    clearFightSoundTimers();
    fightLockedRef.current = false;
    setBattleState("idle");
  }, [compareKey]);

  useEffect(() => {
    return () => {
      if (fightTimerRef.current) clearTimeout(fightTimerRef.current);
      clearFightSoundTimers();
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
          <p>
            Aggiungi 2 o pi&ugrave; tool dal catalogo per far emergere le differenze vere.
          </p>
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
        <ChampionCard tool={tools[0]} onRemove={() => toggleCompare(tools[0].slug)} />
        <div className="mobile-compare-arena__partial">
          <p className="mobile-compare-arena__partial-label">Confronto parziale</p>
          <p>
            {tools[0].name} è già nel confronto. Aggiungi un altro profilo per vedere le differenze.
          </p>
          <Link href="/archivio" className="mobile-compare-arena__cta">
            Aggiungi sfidante
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...tools].sort((a, b) => b.battleScore - a.battleScore);
  const lead = sorted[0];
  const rest = sorted.slice(1);
  const isRevealed = battleState === "result";
  const arenaTools = isRevealed ? sorted : tools;

  function handleFight() {
    if (battleState === "fighting" || fightLockedRef.current) return;
    fightLockedRef.current = true;
    if (fightTimerRef.current) clearTimeout(fightTimerRef.current);
    clearFightSoundTimers();
    setBattleState("fighting");
    playTooolvibesSound("battleHit");
    queueFightSound("battleHit", 460);
    queueFightSound("battleHit", 980);
    fightTimerRef.current = window.setTimeout(() => {
      setBattleState("result");
      playTooolvibesSound("battleWin");
      void celebrateArenaFight();
      fightLockedRef.current = false;
    }, 1650);
  }

  return (
    <div className="mobile-compare-arena">
      <MobileArenaBattleStage
        battleState={battleState}
        tools={arenaTools.slice(0, MAX_COMPARE_TOOLS)}
        winner={lead}
      />

      {isRevealed ? (
        <>
          <ChampionCard tool={lead} onRemove={() => toggleCompare(lead.slug)} />

          <div className="mobile-compare-arena__challengers">
            {rest.map((tool, i) => (
              <ChallengerCard
                key={tool.slug}
                tool={tool}
                rank={i + 2}
                diff={tool.battleScore - lead.battleScore}
                onRemove={() => toggleCompare(tool.slug)}
              />
            ))}
          </div>

          <DiffMatrix tools={sorted} />
        </>
      ) : (
        <MysteryRoster tools={tools} onRemove={(slug) => toggleCompare(slug)} />
      )}

      <footer className="mobile-compare-arena__footer">
        <button
          type="button"
          className="mobile-compare-arena__fight-btn mobile-compare-arena__fight-btn--footer"
          disabled={battleState === "fighting"}
          onClick={handleFight}
        >
          {battleState === "fighting" ? "In corso…" : battleState === "result" ? "Nuovo scontro" : "Combatti"}
        </button>
      </footer>
    </div>
  );
}
