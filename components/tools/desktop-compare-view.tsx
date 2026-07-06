"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Swords, Sparkles, Trophy } from "lucide-react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";
import {
  celebrateArenaFight,
  getBattleVerdict,
  normalise,
  withBattleScores,
  type NormalisedTool,
} from "./tool-battle-shared";
import { ToolFighter } from "./tool-fighter";
import { DiffMatrix } from "./mobile-compare-view";

function DesktopDuelCard({
  tool,
  rank,
  isWinner,
  isFighting,
}: {
  tool: NormalisedTool;
  rank: number;
  isWinner: boolean;
  isFighting: boolean;
}) {
  return (
    <article
      className="desktop-compare__duel-card"
      data-winner={isWinner}
      style={{ "--arena-a": tool.accentFrom, "--arena-b": tool.accentTo } as CSSProperties}
    >
      <div className="desktop-compare__duel-rank">
        {rank === 1 ? (
          <Trophy className="size-4" aria-hidden="true" />
        ) : (
          <Swords className="size-4" aria-hidden="true" />
        )}
        <span>#{rank}</span>
      </div>

      <ToolFighter
        tool={tool}
        variant="compact"
        isWinner={isWinner}
        isFighting={isFighting}
        layoutId={`desktop-fighter-${tool.slug}`}
      />

      <div className="desktop-compare__duel-copy">
        <strong>{tool.name}</strong>
        <span>{tool.categoryLabel}</span>
      </div>
    </article>
  );
}

function DesktopRosterCard({
  tool,
  rank,
  isWinner,
  isFighting,
}: {
  tool: NormalisedTool;
  rank: number;
  isWinner: boolean;
  isFighting: boolean;
}) {
  return (
    <article
      className="desktop-compare__roster-card"
      data-winner={isWinner}
      style={{ "--arena-a": tool.accentFrom, "--arena-b": tool.accentTo } as CSSProperties}
    >
      <span className="desktop-compare__roster-rank">#{rank}</span>
      <ToolFighter
        tool={tool}
        variant="micro"
        isWinner={isWinner}
        isFighting={isFighting}
        layoutId={`desktop-roster-${tool.slug}`}
      />
      <div className="desktop-compare__roster-copy">
        <strong>{tool.name}</strong>
        <span>{tool.battleScore}/100</span>
      </div>
    </article>
  );
}

export function DesktopCompareView({
  directoryTools,
  legacyTools,
}: {
  directoryTools: DirectoryTool[];
  legacyTools: ToolRecord[];
}) {
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const [battleState, setBattleState] = useState<"idle" | "fighting" | "result">("idle");
  const reducedMotion = useReducedMotion();

  const tools = useMemo(
    () => withBattleScores(normalise(directoryTools, legacyTools, compareSlugs)),
    [directoryTools, legacyTools, compareSlugs],
  );

  const sorted = useMemo(() => [...tools].sort((a, b) => b.battleScore - a.battleScore), [tools]);
  const verdict = useMemo(() => (tools.length >= 2 ? getBattleVerdict(tools) : null), [tools]);
  const winner = verdict?.winner;
  const duelTools = sorted.slice(0, 2);

  function handleFight() {
    if (battleState === "fighting" || tools.length < 2) return;
    setBattleState("fighting");
    window.setTimeout(() => {
      setBattleState("result");
      if (!reducedMotion && winner) {
        void celebrateArenaFight(winner);
      }
    }, 900);
  }

  if (tools.length < 2) {
    return (
      <div className="desktop-compare desktop-compare--empty">
        <p className="text-slate-300">Aggiungi almeno 2 tool per iniziare un confronto.</p>
      </div>
    );
  }

  return (
    <section className="desktop-compare" aria-label="Confronto desktop">
      <div className="desktop-compare__arena">
        <header className="desktop-compare__hud">
          <div>
            <p className="desktop-compare__eyebrow">Arena confronto</p>
            <h2 className="desktop-compare__title">Scontro guidato</h2>
          </div>
          <span className="desktop-compare__status" aria-live="polite" aria-atomic="true">
            {battleState === "idle" && "Pronti"}
            {battleState === "fighting" && "Scontro..."}
            {battleState === "result" && winner && `Vincitore: ${winner.name}`}
          </span>
        </header>

        <div className="desktop-compare__ring">
          <div className="desktop-compare__duel">
            {duelTools.map((tool, i) => (
              <DesktopDuelCard
                key={tool.slug}
                tool={tool}
                rank={i + 1}
                isWinner={battleState === "result" && tool.slug === winner?.slug}
                isFighting={battleState === "fighting"}
              />
            ))}
          </div>

          {sorted.length > 2 ? (
            <div className="desktop-compare__roster" aria-label="Altri candidati nel confronto">
              {sorted.slice(2).map((tool, i) => (
                <DesktopRosterCard
                  key={tool.slug}
                  tool={tool}
                  rank={i + 3}
                  isWinner={battleState === "result" && tool.slug === winner?.slug}
                  isFighting={battleState === "fighting"}
                />
              ))}
            </div>
          ) : null}

          {battleState === "fighting" && !reducedMotion && (
            <div className="desktop-compare__flash" aria-hidden="true" />
          )}
        </div>

        <div className="desktop-compare__actions">
          <button
            type="button"
            className="desktop-compare__fight-btn"
            disabled={battleState === "fighting"}
            onClick={handleFight}
          >
            <Swords className="size-5" aria-hidden="true" />
            {battleState === "fighting" ? "In corso..." : battleState === "result" ? "Nuovo scontro" : "Combatti"}
          </button>
        </div>

        <AnimatePresence>
          {battleState === "result" && verdict && winner && (
            <motion.div
              className="desktop-compare__verdict"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={reducedMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
            >
              <div className="desktop-compare__verdict-title">
                <Sparkles className="size-4" aria-hidden="true" />
                <span>{winner.name} vince il confronto</span>
              </div>
              <span className="desktop-compare__verdict-label">{verdict.label}</span>
              <ul className="desktop-compare__verdict-reasons">
                {verdict.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="desktop-compare__sidebar">
        <div className="desktop-compare__scoreboard" aria-label="Classifica confronto">
          {sorted.map((tool, i) => {
            const isWinner = i === 0;
            const diff = isWinner ? 0 : (winner?.battleScore ?? tool.battleScore) - tool.battleScore;
            return (
              <div key={tool.slug} className="desktop-compare__score-row" data-winner={isWinner}>
                <span className="desktop-compare__rank">#{i + 1}</span>
                <span className="desktop-compare__name">{tool.name}</span>
                <span className="desktop-compare__score">{tool.battleScore}</span>
                {!isWinner && <span className="desktop-compare__diff">-{diff}</span>}
              </div>
            );
          })}
        </div>

        <div className="desktop-compare__matrix-panel">
          <DiffMatrix tools={sorted} />
        </div>
      </div>
    </section>
  );
}
