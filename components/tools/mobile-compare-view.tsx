"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Columns3, Swords, Trophy, X, Zap, Info, Sparkles } from "lucide-react";

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
  battleScore: number;
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

function SnapCompareBoard({ tools }: { tools: NormalisedTool[] }) {
  const rows = [
    { key: "category", label: "Categoria", render: (t: NormalisedTool) => t.categoryLabel },
    { key: "tldr", label: "TL;DR", render: (t: NormalisedTool) => t.tldr },
    { key: "useCase", label: "Uso ideale", render: (t: NormalisedTool) => t.useCase },
    { key: "review", label: "Nota editoriale", render: (t: NormalisedTool) => t.review || t.tldr },
    { key: "highlights", label: "Highlights", render: (t: NormalisedTool) => t.highlights.slice(0, 3).join(" · ") || "—" },
    { key: "readingTime", label: "Tempo lettura", render: (t: NormalisedTool) => t.readingTime },
  ];

  return (
    <section className="compare-board" aria-label="Confronto tool">
      <div className="compare-board__row compare-board__row--head">
        <div className="compare-board__label" />
        <div className="compare-board__track">
          {tools.map((tool) => (
            <div key={tool.slug} className="compare-board__cell compare-board__cell--head">
              <strong>{tool.name}</strong>
              <span>{tool.categoryLabel}</span>
            </div>
          ))}
        </div>
      </div>
      {rows.map((row) => (
        <div key={row.key} className="compare-board__row">
          <div className="compare-board__label">{row.label}</div>
          <div className="compare-board__track">
            {tools.map((tool) => (
              <article key={tool.slug} className="compare-board__cell">
                {row.render(tool)}
              </article>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function stableScoreOffset(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return (hash % 13) - 6;
}

function withBattleScores(tools: NormalisedTool[]): NormalisedTool[] {
  const ranked = tools
    .map((tool, index) => ({
      index,
      tool,
      raw: tool.score + stableScoreOffset(`${tool.slug}:${tool.category}:${index}`),
    }))
    .sort((a, b) => b.raw - a.raw || a.tool.name.localeCompare(b.tool.name));

  const battleBySlug = new Map<string, number>();
  ranked.forEach(({ tool, raw }, rank) => {
    const score = Math.max(62, Math.min(99, Math.round(raw - rank * 2.25)));
    battleBySlug.set(tool.slug, score);
  });

  return tools.map((tool) => ({
    ...tool,
    battleScore: battleBySlug.get(tool.slug) ?? tool.score,
  }));
}

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
        battleScore: dirScore(d),
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
        battleScore: legacyScore(l),
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
              onClick={() => setShowInfo((v) => !v)}
              className="mobile-compare-arena__info"
            >
              <Info className="size-3.5" />
            </button>
            {showInfo && (
              <div className="mobile-compare-arena__tooltip">
                Il battle power combina punteggio editoriale, categoria e segnali del tool per evitare pareggi finti in arena.
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

type BattleState = "idle" | "fighting" | "result";

const FIGHTER_POSITIONS: Record<number, Array<{ x: number; y: number; align?: string }>> = {
  2: [
    { x: 24, y: 52 },
    { x: 76, y: 52 },
  ],
  3: [
    { x: 50, y: 20 },
    { x: 22, y: 59 },
    { x: 78, y: 59 },
  ],
  4: [
    { x: 24, y: 23 },
    { x: 76, y: 23 },
    { x: 24, y: 61 },
    { x: 76, y: 61 },
  ],
  5: [
    { x: 50, y: 18 },
    { x: 18, y: 44 },
    { x: 82, y: 44 },
    { x: 30, y: 64 },
    { x: 70, y: 64 },
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
  const isResolved = battleState === "result";

  return (
    <section
      className="mobile-compare-arena__battle-stage"
      data-count={Math.min(tools.length, 5)}
      data-state={battleState}
      aria-label="Arena fight"
    >
      <div className="mobile-compare-arena__battle-backdrop" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="mobile-compare-arena__battle-grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="mobile-compare-arena__battle-floor" aria-hidden="true">
        <span />
        <span />
      </div>

      <div className="mobile-compare-arena__battle-core">
        <span>{modeLabel}</span>
        <strong>
          {battleState === "fighting" ? "CLASH" : battleState === "result" ? "VICTORY" : "READY"}
        </strong>
      </div>

      <div className="mobile-compare-arena__impact-burst" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} style={{ "--burst-index": i } as CSSProperties} />
        ))}
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
          const isDefeated = isResolved && !isWinner;
          const pos = positions[index] ?? positions[0];
          const clashX = (50 - pos.x) * 0.32;
          const clashY = (50 - pos.y) * 0.24;
          const side = index % 2 === 0 ? 1 : -1;

          return (
            <motion.div
              key={tool.slug}
              className={cn(
                "mobile-compare-arena__fighter",
                isWinner && "is-winner",
                isDefeated && "is-defeated",
              )}
              style={
                {
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  "--arena-a": tool.accentFrom,
                  "--arena-b": tool.accentTo,
                  "--fighter-index": index,
                  "--fighter-rank": index + 1,
                } as CSSProperties
              }
              animate={
                battleState === "fighting" && !reducedMotion
                  ? {
                      scale: [1, 1.16, 0.94, 1.2, 1],
                      rotate: [0, side * -9, side * 10, side * -4, 0],
                      rotateX: [0, 9, -7, 0],
                      rotateY: [0, side * -18, side * 16, 0],
                      x: [0, clashX, clashX * -0.22, clashX * 0.82, 0],
                      y: [0, clashY, -8, clashY * 0.48, 0],
                    }
                  : {
                      scale: isWinner ? 1.22 : isDefeated ? 0.84 : 1,
                      rotate: isDefeated ? side * 13 : isWinner ? side * -3 : 0,
                      rotateX: isWinner ? -8 : isDefeated ? 12 : 0,
                      rotateY: isWinner ? side * 10 : isDefeated ? side * -14 : 0,
                      y: isWinner ? -18 : isDefeated ? 22 : 0,
                    }
              }
              transition={{
                duration: battleState === "fighting" ? 0.76 : 0.36,
                ease: battleState === "fighting" ? "easeInOut" : "easeOut",
                repeat: battleState === "fighting" ? Infinity : 0,
              }}
            >
              <span className="mobile-compare-arena__fighter-orb">
                <span className="mobile-compare-arena__fighter-face">
                  {tool.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="mobile-compare-arena__fighter-sword" aria-hidden="true" />
              </span>
              <span className="mobile-compare-arena__fighter-name" title={tool.name}>
                {tool.name}
              </span>
              <small>{isWinner ? "Champion" : isDefeated ? "KO" : `Power ${tool.battleScore}`}</small>
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {battleState === "result" ? (
          <motion.div
            className="mobile-compare-arena__battle-result"
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: [0.92, 1.05, 1] }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
          >
            <Sparkles className="size-5" />
            <span className="mobile-compare-arena__battle-result-kicker">Round clear</span>
            <strong>{winner.name}</strong>
            <span>vince il confronto</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {battleState !== "result" ? (
        <button
          type="button"
          className="mobile-compare-arena__fight-button"
          disabled={battleState === "fighting"}
          onPointerDown={(event) => {
            event.preventDefault();
            onFight();
          }}
          onClick={onFight}
          data-sonic-action="battle"
          data-state={battleState}
        >
          <span className="mobile-compare-arena__fight-aura" aria-hidden="true" />
          <span className="mobile-compare-arena__fight-icon">
            <Swords className="size-5" />
          </span>
          <span className="mobile-compare-arena__fight-copy">
            <strong>{battleState === "fighting" ? "CLASH" : "FIGHT"}</strong>
            <small>{battleState === "fighting" ? "Combo in corso" : "Avvia il duello"}</small>
          </span>
          <span className="mobile-compare-arena__fight-charge" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
      ) : null}
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
  const resultTimerRef = useRef<number | null>(null);
  const fightLockedRef = useRef(false);
  const compareKey = compareSlugs.join("|");

  const tools = useMemo(
    () => withBattleScores(normalise(directoryTools, legacyTools, compareSlugs)),
    [directoryTools, legacyTools, compareSlugs],
  );

  useEffect(() => {
    if (fightTimerRef.current) clearTimeout(fightTimerRef.current);
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    fightLockedRef.current = false;
    setBattleState("idle");
  }, [compareKey]);

  useEffect(() => {
    return () => {
      if (fightTimerRef.current) clearTimeout(fightTimerRef.current);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    };
  }, []);

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

  const sorted = [...tools].sort((a, b) => b.battleScore - a.battleScore);
  const lead = sorted[0];

  function handleFight() {
    if (battleState === "fighting" || fightLockedRef.current) return;
    fightLockedRef.current = true;
    if (fightTimerRef.current) clearTimeout(fightTimerRef.current);
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    setBattleState("fighting");
    fightTimerRef.current = window.setTimeout(() => {
      setBattleState("result");
      void celebrateArenaFight();
      resultTimerRef.current = window.setTimeout(() => {
        fightLockedRef.current = false;
        setBattleState("idle");
      }, 3200);
    }, 1650);
  }

  return (
    <div className="mobile-compare-arena">
      <ArenaHeader count={tools.length} />

      <SnapCompareBoard tools={sorted} />

      <MobileArenaBattleStage
        battleState={battleState}
        onFight={handleFight}
        tools={sorted.slice(0, MAX_COMPARE_TOOLS)}
        winner={lead}
      />

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
