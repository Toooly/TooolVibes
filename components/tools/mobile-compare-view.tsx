"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Columns3, Swords, Trophy, X, Zap, Scale, Info } from "lucide-react";

import { useToolWorkspaceStore, MAX_COMPARE_TOOLS } from "@/lib/stores/tool-workspace-store";
import type { DirectoryTool, DirectoryToolLevel } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

type MobileCompareViewProps = {
  directoryTools: DirectoryTool[];
  legacyTools: ToolRecord[];
};

/* ---------- utils directory ---------- */
const levelScoreBase: Record<DirectoryToolLevel, number> = {
  featured: 91,
  beginner: 72,
  intermediate: 82,
  expert: 87,
};

function dirScore(t: DirectoryTool) {
  return Math.min(
    98,
    levelScoreBase[t.level] +
      (t.toolOfWeek ? 4 : 0) +
      (t.featured ? 2 : 0) +
      Math.min(t.highlights.length, 3),
  );
}

/* ---------- legacy normalisation ---------- */
function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h % 360);
  return `hsl(${hue} 80% 55%)`;
}

function legacyScore(t: ToolRecord): number {
  return Math.min(95, 70 + (t.is_featured ? 10 : 0) + Math.min(t.tags?.length ?? 0, 5) * 2);
}

async function celebrateArenaFight() {
  const { default: confetti } = await import("canvas-confetti");

  confetti({
    colors: ["#6a3cff", "#39d2f6", "#f3bf4c", "#ffffff"],
    disableForReducedMotion: true,
    origin: { y: 0.62 },
    particleCount: 72,
    scalar: 0.82,
    spread: 66,
  });
}

type NormalisedTool = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  score: number;
  accentFrom: string;
  accentTo: string;
  tldr: string;
  useCase: string;
  review: string;
  highlights: string[];
  readingTime: string;
  url: string;
  isDirectory: boolean;
  useCasesCount: number;
};

function normalise(
  directoryTools: DirectoryTool[],
  legacyTools: ToolRecord[],
  compareSlugs: string[],
): NormalisedTool[] {
  const out: NormalisedTool[] = [];
  for (const slug of compareSlugs) {
    const d = directoryTools.find((t) => t.slug === slug);
    if (d) {
      out.push({
        slug: d.slug,
        name: d.name,
        category: d.category,
        categoryLabel: d.categoryLabel,
        score: dirScore(d),
        accentFrom: d.accentFrom,
        accentTo: d.accentTo,
        tldr: d.tldr,
        useCase: d.idealUseCase,
        review: d.editorialReview,
        highlights: d.highlights,
        readingTime: d.readingTime,
        url: d.url,
        isDirectory: true,
        useCasesCount: d.useCases.length,
      });
      continue;
    }
    const l = legacyTools.find((t) => t.slug === slug);
    if (l) {
      const c = hashColor(l.name);
      out.push({
        slug: l.slug,
        name: l.name,
        category: l.category ?? "Tool",
        categoryLabel: l.category ?? "Tool",
        score: legacyScore(l),
        accentFrom: c,
        accentTo: c,
        tldr: l.short_description_it ?? l.description_it ?? "Nessun riassunto disponibile.",
        useCase: l.description_it ?? "",
        review: l.editorial_note ?? "",
        highlights: l.tags?.slice(0, 3) ?? [],
        readingTime: "2 min",
        url: l.website_url ?? "",
        isDirectory: false,
        useCasesCount: 0,
      });
    }
  }
  return out;
}

/* ---------- sub-components ---------- */

function ArenaHeader({ count }: { count: number }) {
  return (
    <header className="mobile-compare-arena__header">
      <div className="mobile-compare-arena__badge">
        <Swords className="size-5" />
        <span>Arena</span>
      </div>
      <h1>Il punto in cui i candidati smettono di somigliarsi.</h1>
      <p>Metti i tool uno accanto all&apos;altro e fai emergere il distacco vero.</p>
      <div className="mobile-compare-arena__dots">
        {Array.from({ length: MAX_COMPARE_TOOLS }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "mobile-compare-arena__dot",
              i < count && "is-active",
            )}
          />
        ))}
      </div>
    </header>
  );
}

function ChampionCard({
  tool,
  onRemove,
}: {
  tool: NormalisedTool;
  onRemove: () => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  return (
    <article
      className="mobile-compare-arena__champion"
      style={
        {
          "--arena-a": tool.accentFrom,
          "--arena-b": tool.accentTo,
          "--compare-score-angle": `${tool.score * 3.6}deg`,
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
              <span>{tool.score}</span>
              <small>/100</small>
            </div>
            <button
              type="button"
              aria-label="Come è calcolato il punteggio"
              onClick={() => setShowInfo((v) => !v)}
              className="mobile-compare-arena__info"
            >
              <Info className="size-3.5" />
            </button>
            {showInfo && (
              <div className="mobile-compare-arena__tooltip">
                Il punteggio è calcolato in base al livello del tool, alla visibilità in evidenza e al numero di punti di forza.
              </div>
            )}
          </div>
        </div>

        <div className="mobile-compare-arena__metrics">
          <div>
            <span>Fit</span>
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
            Scheda
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
          <span>{tool.score}</span>
        </div>
      </div>

      <div className="mobile-compare-arena__challenger-bar">
        <span
          style={{
            width: `${Math.max(20, tool.score)}%`,
            background: `linear-gradient(90deg,${tool.accentFrom},${tool.accentTo})`,
          }}
        />
      </div>

      <div className="mobile-compare-arena__challenger-actions">
        <Link href={`/toools/${tool.slug}`} className="mobile-compare-arena__link">
          Scheda
        </Link>
        <button type="button" onClick={onRemove} className="mobile-compare-arena__link mobile-compare-arena__link--muted">
          Rimuovi
        </button>
      </div>
    </article>
  );
}

function DiffMatrix({ tools }: { tools: NormalisedTool[] }) {
  const cellsRef = useRef<(HTMLDivElement | null)[]>([]);
  const isSyncing = useRef(false);
  if (tools.length < 2) return null;

  const maxScore = Math.max(...tools.map((t) => t.score), 1);

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

  const scoreMax = Math.max(...tools.map((t) => t.score));
  const fitMax = Math.max(...tools.map((t) => t.useCasesCount));
  const highlightsMax = Math.max(...tools.map((t) => t.highlights.length));

  const rows = [
    {
      label: "Categoria",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <span className={cn("mobile-compare-arena__matrix-badge", isWinner && "is-winner")}>
          {t.categoryLabel}
        </span>
      ),
      winnerIndices: [] as number[],
    },
    {
      label: "Punteggio",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <div className="mobile-compare-arena__matrix-bar">
          <span
            className={cn(isWinner && "is-winner")}
            style={{ width: `${(t.score / maxScore) * 100}%` }}
          />
          <strong>{t.score}</strong>
        </div>
      ),
      winnerIndices: tools.flatMap((t, i) => (t.score === scoreMax ? [i] : [])),
    },
    {
      label: "Fit",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <span className={cn(isWinner && "mobile-compare-arena__matrix-value--winner")}>
          {t.useCasesCount || "—"}
        </span>
      ),
      winnerIndices: tools.flatMap((t, i) => (t.useCasesCount === fitMax ? [i] : [])),
    },
    {
      label: "Highlights",
      render: (t: NormalisedTool, isWinner: boolean) => (
        <span className={cn(isWinner && "mobile-compare-arena__matrix-value--winner")}>
          {t.highlights.length}
        </span>
      ),
      winnerIndices: tools.flatMap((t, i) => (t.highlights.length === highlightsMax ? [i] : [])),
    },
    {
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
    <section className="mobile-compare-arena__matrix">
      <div className="mobile-compare-arena__matrix-header">
        <Scale className="size-4" />
        <span>Confronto caratteristiche</span>
      </div>

      <div className="mobile-compare-arena__matrix-head" aria-hidden="true">
        <div className="mobile-compare-arena__matrix-axis mobile-compare-arena__matrix-axis--head">
          Attributo
        </div>
        <div
          className="mobile-compare-arena__matrix-cells"
          ref={(el) => { cellsRef.current[rows.length] = el; }}
          onScroll={() => handleScroll(rows.length)}
        >
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

      <div className="mobile-compare-arena__matrix-grid">
        {rows.map((row, rowIndex) => (
          <div key={row.label} className="mobile-compare-arena__matrix-row">
            <div className="mobile-compare-arena__matrix-axis">{row.label}</div>
            <div
              className="mobile-compare-arena__matrix-cells"
              ref={(el) => { cellsRef.current[rowIndex] = el; }}
              onScroll={() => handleScroll(rowIndex)}
            >
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
        ))}
      </div>
    </section>
  );
}

type BattleState = "idle" | "fighting" | "result";

const FIGHTER_POSITIONS: Record<number, Array<{ x: number; y: number; align?: string }>> = {
  2: [
    { x: 18, y: 62 },
    { x: 82, y: 62 },
  ],
  3: [
    { x: 50, y: 24 },
    { x: 20, y: 74 },
    { x: 80, y: 74 },
  ],
  4: [
    { x: 22, y: 28 },
    { x: 78, y: 28 },
    { x: 22, y: 76 },
    { x: 78, y: 76 },
  ],
  5: [
    { x: 50, y: 18 },
    { x: 16, y: 50 },
    { x: 84, y: 50 },
    { x: 30, y: 82 },
    { x: 70, y: 82 },
  ],
};

function MobileArenaBattleStage({
  battleState,
  onFight,
  tools,
  winner,
}: {
  battleState: BattleState;
  onFight: () => void;
  tools: NormalisedTool[];
  winner: NormalisedTool;
}) {
  const modeLabel =
    tools.length === 2
      ? "Duel"
      : tools.length === 3
        ? "Tri-clash"
        : tools.length === 4
          ? "Corners"
          : "Vibe royale";

  const positions = FIGHTER_POSITIONS[tools.length] ?? FIGHTER_POSITIONS[2];
  const reducedMotion = useReducedMotion();

  return (
    <section
      className="mobile-compare-arena__battle-stage"
      data-count={Math.min(tools.length, 5)}
      data-state={battleState}
      aria-label="Arena fight"
    >
      <div className="mobile-compare-arena__battle-grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="mobile-compare-arena__battle-core">
        <span>{modeLabel}</span>
        <strong>
          {battleState === "fighting" ? "CLASH" : battleState === "result" ? "WINNER" : "READY"}
        </strong>
      </div>

      {battleState === "fighting" && (
        <div className="mobile-compare-arena__energy-lines" aria-hidden="true">
          {positions.map((pos, i) => {
            const angle = Math.atan2(50 - pos.y, 50 - pos.x) * (180 / Math.PI);
            return (
              <span
                key={i}
                className="mobile-compare-arena__energy-line"
                style={{ "--energy-angle": `${angle}deg`, left: `${pos.x}%`, top: `${pos.y}%` } as CSSProperties}
              />
            );
          })}
        </div>
      )}

      <div className="mobile-compare-arena__fighters">
        {tools.map((tool, index) => {
          const isWinner = battleState === "result" && tool.slug === winner.slug;
          const pos = positions[index] ?? positions[0];

          return (
            <motion.div
              key={tool.slug}
              className={cn("mobile-compare-arena__fighter", isWinner && "is-winner")}
              style={
                {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  "--arena-a": tool.accentFrom,
                  "--arena-b": tool.accentTo,
                  "--fighter-index": index,
                } as CSSProperties
              }
              animate={
                battleState === "fighting" && !reducedMotion
                  ? { scale: [1, 1.12, 0.98, 1.08, 1], rotate: [0, -5, 4, -2, 0] }
                  : { scale: isWinner ? 1.12 : 1, rotate: 0 }
              }
              transition={{ duration: battleState === "fighting" ? 0.82 : 0.28, repeat: battleState === "fighting" ? Infinity : 0 }}
            >
              <span className="mobile-compare-arena__fighter-orb">
                {tool.name.slice(0, 2).toUpperCase()}
              </span>
              <span className="mobile-compare-arena__fighter-name" title={tool.name}>
                {tool.name}
              </span>
              <small>{tool.score}</small>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {battleState === "result" ? (
          <motion.div
            className="mobile-compare-arena__battle-result"
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
          >
            <Trophy className="size-4" />
            <span>{winner.name} vince il round</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <button
        type="button"
        className="mobile-compare-arena__fight-button"
        disabled={battleState === "fighting"}
        onClick={onFight}
        data-sonic-action="battle"
      >
        <Swords className="size-5" />
        {battleState === "fighting" ? "Fighting..." : "FIGHT"}
      </button>
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
  const clearCompare = useToolWorkspaceStore((s) => s.clearCompare);
  const [battleState, setBattleState] = useState<BattleState>("idle");
  const fightTimerRef = useRef<number | null>(null);

  const tools = useMemo(
    () => normalise(directoryTools, legacyTools, compareSlugs),
    [directoryTools, legacyTools, compareSlugs],
  );

  useEffect(() => {
    setBattleState("idle");
  }, [compareSlugs]);

  useEffect(() => {
    return () => {
      if (fightTimerRef.current) clearTimeout(fightTimerRef.current);
    };
  }, [compareSlugs]);

  if (tools.length === 0) {
    return (
      <div className="mobile-compare-arena">
        <ArenaHeader count={0} />
        <div className="mobile-compare-arena__empty">
          <div className="mobile-compare-arena__empty-icon">
            <Columns3 className="size-10" />
          </div>
          <h2>Nessun candidato in arena.</h2>
          <p>
            Aggiungi 2 o pi&ugrave; tool dal catalogo per far emergere il distacco vero.
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
        <ArenaHeader count={1} />
        <ChampionCard tool={tools[0]} onRemove={() => toggleCompare(tools[0].slug)} />
        <div className="mobile-compare-arena__partial">
          <p className="mobile-compare-arena__partial-label">Compare parziale</p>
          <p>
            {tools[0].name} è già in arena. Aggiungi un altro profilo per vedere le differenze.
          </p>
          <Link href="/archivio" className="mobile-compare-arena__cta">
            Aggiungi sfidante
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    );
  }

  const sorted = [...tools].sort((a, b) => b.score - a.score);
  const lead = sorted[0];
  const rest = sorted.slice(1);

  function handleFight() {
    if (battleState === "fighting") return;
    setBattleState("fighting");
    fightTimerRef.current = window.setTimeout(() => {
      setBattleState("result");
      void celebrateArenaFight();
    }, 1450);
  }

  return (
    <div className="mobile-compare-arena">
      <ArenaHeader count={tools.length} />

      <MobileArenaBattleStage
        battleState={battleState}
        onFight={handleFight}
        tools={sorted.slice(0, MAX_COMPARE_TOOLS)}
        winner={lead}
      />

      <ChampionCard tool={lead} onRemove={() => toggleCompare(lead.slug)} />

      <div className="mobile-compare-arena__challengers">
        {rest.map((tool, i) => (
          <ChallengerCard
            key={tool.slug}
            tool={tool}
            rank={i + 2}
            diff={tool.score - lead.score}
            onRemove={() => toggleCompare(tool.slug)}
          />
        ))}
      </div>

      <DiffMatrix tools={sorted} />

      <div className="mobile-compare-arena__footer">
        <Link href="/archivio" className="mobile-compare-arena__footer-btn mobile-compare-arena__footer-btn--primary">
          <Zap className="size-4" />
          Aggiungi tool
        </Link>
        <button
          type="button"
          onClick={clearCompare}
          className="mobile-compare-arena__footer-btn mobile-compare-arena__footer-btn--ghost"
        >
          Svuota arena
        </button>
        <Link href="/shortlist" className="mobile-compare-arena__footer-btn mobile-compare-arena__footer-btn--secondary">
          Shortlist
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
