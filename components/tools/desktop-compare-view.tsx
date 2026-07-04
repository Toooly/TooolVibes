"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { celebrateArenaFight, normalise, withBattleScores } from "./tool-battle-shared";
import { ToolFighter } from "./tool-fighter";
import { DiffMatrix } from "./mobile-compare-view";

function getDesktopFighterSlotStyle(count: number, index: number) {
  const positions: Record<number, Array<{ top: string; left: string }>> = {
    2: [
      { top: "55%", left: "25%" },
      { top: "55%", left: "75%" },
    ],
    3: [
      { top: "40%", left: "20%" },
      { top: "40%", left: "50%" },
      { top: "40%", left: "80%" },
    ],
    4: [
      { top: "35%", left: "20%" },
      { top: "35%", left: "45%" },
      { top: "35%", left: "70%" },
      { top: "65%", left: "35%" },
    ],
    5: [
      { top: "35%", left: "15%" },
      { top: "30%", left: "38%" },
      { top: "30%", left: "62%" },
      { top: "35%", left: "85%" },
      { top: "70%", left: "50%" },
    ],
  };
  return positions[count]?.[index] ?? { top: "50%", left: "50%" };
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
  const winner = sorted[0];

  function handleFight() {
    if (battleState === "fighting" || tools.length < 2) return;
    setBattleState("fighting");
    window.setTimeout(() => {
      setBattleState("result");
      if (!reducedMotion) {
        void celebrateArenaFight();
      }
    }, 1200);
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
          <h2 className="desktop-compare__title">Arena</h2>
          <span className="desktop-compare__status" aria-live="polite" aria-atomic="true">
            {battleState === "idle" && "Pronti"}
            {battleState === "fighting" && "Scontro…"}
            {battleState === "result" && `Vincitore: ${winner.name}`}
          </span>
        </header>

        <div className="desktop-compare__ring">
          {tools.map((tool, i) => (
            <div
              key={tool.slug}
              className="desktop-compare__fighter-slot"
              style={getDesktopFighterSlotStyle(tools.length, i)}
            >
              <ToolFighter
                tool={tool}
                isWinner={battleState === "result" && tool.slug === winner.slug}
                isFighting={battleState === "fighting"}
                layoutId={`desktop-fighter-${tool.slug}`}
              />
            </div>
          ))}

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
            {battleState === "fighting" ? "In corso…" : battleState === "result" ? "Nuovo scontro" : "Combatti"}
          </button>
        </div>

        <AnimatePresence>
          {battleState === "result" && (
            <motion.div
              className="desktop-compare__verdict"
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
      </div>

      <div className="desktop-compare__sidebar">
        <div className="desktop-compare__scoreboard">
          {sorted.map((tool, i) => {
            const isWinner = i === 0;
            const diff = isWinner ? 0 : winner.battleScore - tool.battleScore;
            return (
              <div
                key={tool.slug}
                className="desktop-compare__score-row"
                data-winner={isWinner}
              >
                <span className="desktop-compare__rank">#{i + 1}</span>
                <span className="desktop-compare__name">{tool.name}</span>
                <span className="desktop-compare__score">{tool.battleScore}</span>
                {!isWinner && <span className="desktop-compare__diff">-{diff}</span>}
              </div>
            );
          })}
        </div>

        <DiffMatrix tools={sorted} />
      </div>
    </section>
  );
}
