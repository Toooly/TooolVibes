"use client";

import { type CSSProperties, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Columns3, Scale, Sparkles, Trophy } from "lucide-react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { MIN_COMPARE_TOOLS, useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import type { CompareObjective } from "@/lib/compare/compare-objective";
import {
  celebrateArenaFight,
  getBattleVerdict,
  normalise,
  withBattleScores,
  withObjectiveScores,
  type NormalisedTool,
} from "./tool-battle-shared";
import { CompareObjectiveSelector } from "./compare-objective-selector";
import { CompareDecisionPanel } from "./compare-decision-panel";
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
          <Scale className="size-4" aria-hidden="true" />
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
        <span>
          {tool.categoryLabel} · {tool.editorialScore.toFixed(1)}/10 editoriale
        </span>
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
        <span>
          {tool.objectiveScore ?? tool.battleScore}/100 ·{" "}
          {tool.editorialScore.toFixed(1)}/10 editoriale
        </span>
        {tool.objectiveDelta != null && tool.objectiveDelta !== 0 ? (
          <span className="desktop-compare__objective-delta">
            {tool.objectiveDelta > 0 ? "+" : ""}
            {tool.objectiveDelta} obiettivo
          </span>
        ) : null}
      </div>
    </article>
  );
}

export function DesktopCompareView({
  tools: catalogTools,
  objective = null,
  onObjectiveChange,
  objectiveEnabled = true,
  decisionEnabled = true,
}: {
  tools: ToolPublicView[];
  /** Obiettivo attivo condiviso con la vista mobile (B34); null = neutro. */
  objective?: CompareObjective | null;
  onObjectiveChange?: (objective: CompareObjective | null) => void;
  /** Flag B34: OFF nasconde il selettore e riproduce il contratto base B33. */
  objectiveEnabled?: boolean;
  /** Flag B35: OFF nasconde il pannello decisione e chiude il flow al verdetto. */
  decisionEnabled?: boolean;
}) {
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const [battleState, setBattleState] = useState<"idle" | "fighting" | "result">("idle");
  const reducedMotion = useReducedMotion();
  // B34: con il flag OFF l'obiettivo è sempre neutro (contratto base B33).
  const activeObjective = objectiveEnabled ? objective : null;

  const tools = useMemo(
    () => withObjectiveScores(withBattleScores(normalise(catalogTools, compareSlugs)), activeObjective),
    [catalogTools, compareSlugs, activeObjective],
  );

  const verdict = useMemo(
    () => (tools.length >= MIN_COMPARE_TOOLS ? getBattleVerdict(tools, activeObjective) : null),
    [tools, activeObjective],
  );
  // B34: ordine della classifica identico al verdetto canonico (parity mobile).
  const sorted = useMemo(
    () => (verdict ? verdict.scores.map((entry) => entry.tool) : tools),
    [verdict, tools],
  );
  const winner = verdict?.winner;
  const duelTools = sorted.slice(0, 2);

  function handleFight() {
    if (battleState === "fighting" || tools.length < MIN_COMPARE_TOOLS) return;
    setBattleState("fighting");
    window.setTimeout(() => {
      setBattleState("result");
      if (!reducedMotion && winner) {
        void celebrateArenaFight(winner);
      }
    }, 900);
  }

  if (tools.length < MIN_COMPARE_TOOLS) {
    const hasCandidate = tools.length === 1;
    return (
      <div className="compare-onboarding-shell">
        <section className="compare-onboarding" aria-labelledby="compare-onboarding-title">
          <span className="compare-onboarding__icon" aria-hidden="true">
            <Columns3 />
          </span>
          <p className="compare-onboarding__eyebrow">
            {hasCandidate ? "Primo candidato pronto" : "La matrice è vuota"}
          </p>
          <h2 id="compare-onboarding-title">
            {hasCandidate
              ? "Serve ancora un candidato."
              : "Costruisci un confronto che porti a una scelta."}
          </h2>
          <p className="compare-onboarding__lede">
            {hasCandidate
              ? `${tools[0].name} è già nel confronto. Aggiungi un altro tool per leggere differenze, punti forti e compromessi.`
              : "Seleziona da due a cinque tool dal catalogo: li ordineremo per evidenze, caso d’uso e aderenza al tuo obiettivo."}
          </p>
          <Link href="/archivio" className="compare-onboarding__cta">
            {hasCandidate ? "Aggiungi un candidato" : "Scegli i tool"}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <div className="compare-onboarding__signals" aria-label="Cosa otterrai">
            <span><strong>Confronto</strong> fianco a fianco</span>
            <span><strong>Verdetto</strong> spiegato</span>
            <span><strong>Decisione</strong> salvabile</span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <section className="desktop-compare" aria-label="Confronto desktop">
      {objectiveEnabled && onObjectiveChange ? (
        <CompareObjectiveSelector
          objective={activeObjective}
          onObjectiveChange={onObjectiveChange}
          idPrefix="desktop"
        />
      ) : null}

      <div className="desktop-compare__matrix-panel desktop-compare__matrix-panel--full">
        <DiffMatrix tools={sorted} objective={activeObjective} />
      </div>

      <div className="desktop-compare__arena">
        <header className="desktop-compare__hud">
          <div>
            <p className="desktop-compare__eyebrow">Verdetto guidato</p>
            <h2 className="desktop-compare__title">Chiudi la decisione</h2>
          </div>
          <span className="desktop-compare__status" aria-live="polite" aria-atomic="true">
            {battleState === "idle" && "Pronto"}
            {battleState === "fighting" && "Analisi..."}
            {battleState === "result" && winner && `Scelta: ${winner.name}`}
          </span>
        </header>

        <div className="desktop-compare__arena-layout">
          <div className="desktop-compare__battle-zone">
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
                <Scale className="size-5" aria-hidden="true" />
                {battleState === "fighting" ? "Analisi..." : battleState === "result" ? "Ricalcola" : "Calcola il verdetto"}
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
                    <span>{winner.name} è la scelta consigliata</span>
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

          <aside className="desktop-compare__scoreboard" aria-label="Classifica confronto">
            {sorted.map((tool, i) => {
              const isWinner = i === 0;
              const displayScore = tool.objectiveScore ?? tool.battleScore;
              const topScore = winner ? winner.objectiveScore ?? winner.battleScore : displayScore;
              const diff = isWinner ? 0 : Math.max(topScore - displayScore, 0);
              return (
                <div key={tool.slug} className="desktop-compare__score-row" data-winner={isWinner}>
                  <span className="desktop-compare__rank">#{i + 1}</span>
                  <span className="desktop-compare__name">{tool.name}</span>
                  <span className="desktop-compare__score">{displayScore}</span>
                  {tool.objectiveDelta != null && tool.objectiveDelta !== 0 ? (
                    <span className="desktop-compare__objective-delta">
                      {tool.objectiveDelta > 0 ? "+" : ""}
                      {tool.objectiveDelta}
                    </span>
                  ) : null}
                  {!isWinner && <span className="desktop-compare__diff">-{diff}</span>}
                </div>
              );
            })}
          </aside>
        </div>
      </div>

      {/* B35 / FLOW-604: dopo il verdetto il confronto si chiude in una
          decisione riapribile con contesto, con ritorno ai Salvati. */}
      {battleState === "result" ? (
        <CompareDecisionPanel
          tools={sorted}
          objective={activeObjective}
          enabled={decisionEnabled}
          idPrefix="desktop"
        />
      ) : null}

    </section>
  );
}
