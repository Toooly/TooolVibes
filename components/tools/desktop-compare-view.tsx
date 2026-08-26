"use client";

import { useMemo, useState } from "react";

import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import {
  MIN_COMPARE_TOOLS,
  useToolWorkspaceStore,
} from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import type { CompareObjective } from "@/lib/compare/compare-objective";
import {
  buildCanonicalObjectiveRanking,
  celebrateArenaFight,
  getBattleVerdict,
  normalise,
  withBattleScores,
} from "./tool-battle-shared";
import { CompareObjectiveSelector } from "./compare-objective-selector";
import { CompareDecisionPanel } from "./compare-decision-panel";
import { CompareBattleStage } from "./compare-battle-stage";
import { CompareVerdictCard } from "./compare-verdict-card";
import { CompareRanking } from "./compare-ranking";
import { CompareFactorMatrix } from "./compare-factor-matrix";
import { CompareEditorialDetails } from "./compare-editorial-details";
import {
  CompareWorkbenchEmpty,
  CompareWorkbenchIdentity,
  CompareWorkbenchPrep,
} from "./compare-workbench-chrome";

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
  const toggleCompare = useToolWorkspaceStore((s) => s.toggleCompare);
  const clearCompare = useToolWorkspaceStore((s) => s.clearCompare);
  const [battleState, setBattleState] = useState<"idle" | "fighting" | "result">(
    "idle",
  );
  const reducedMotion = useReducedMotion();
  // B34: con il flag OFF l'obiettivo è sempre neutro (contratto base B33).
  const activeObjective = objectiveEnabled ? objective : null;

  const ranking = useMemo(
    () =>
      buildCanonicalObjectiveRanking(
        withBattleScores(normalise(catalogTools, compareSlugs)),
        activeObjective,
      ),
    [catalogTools, compareSlugs, activeObjective],
  );
  const tools = ranking.orderedTools;
  const canonicalVerdict = ranking.objectiveVerdict;

  const verdict = useMemo(
    () =>
      tools.length >= MIN_COMPARE_TOOLS
        ? getBattleVerdict(tools, activeObjective, null, canonicalVerdict)
        : null,
    [tools, activeObjective, canonicalVerdict],
  );

  // Candidate order is retained unless an explicit editorial assessment gives
  // them a shared rank; no hidden tie-break is applied.
  const sorted = useMemo(
    () => (verdict ? verdict.scores.map((entry) => entry.tool) : tools),
    [verdict, tools],
  );
  const winner = verdict?.winner ?? null;

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

  if (tools.length === 0) {
    return (
      <div className="compare-onboarding-shell">
        <CompareWorkbenchEmpty />
      </div>
    );
  }

  if (tools.length === 1) {
    return (
      <div className="compare-onboarding-shell">
        <CompareWorkbenchPrep
          tool={tools[0]}
          onRemove={toggleCompare}
          onClear={clearCompare}
        />
      </div>
    );
  }

  const isRevealed = battleState === "result";
  const objectiveLabel = ranking.objectiveLabel ?? null;

  return (
    <section className="desktop-compare" aria-label="Confronto desktop">
      <CompareWorkbenchIdentity
        tools={sorted}
        onRemove={toggleCompare}
        onClear={clearCompare}
        decisionEnabled={decisionEnabled}
        layoutMode="desktop"
      />

      {objectiveEnabled && onObjectiveChange ? (
        <CompareObjectiveSelector
          objective={activeObjective}
          onObjectiveChange={onObjectiveChange}
          idPrefix="desktop"
        />
      ) : null}

      <CompareBattleStage
        tools={sorted}
        verdict={verdict}
        battleState={battleState}
        onFight={handleFight}
        objectiveLabel={objectiveLabel}
        layoutMode="desktop"
      />

      <CompareRanking
        tools={sorted}
        winner={winner}
        onRemove={(slug) => toggleCompare(slug)}
        layoutMode="desktop"
      />

      {isRevealed && verdict ? (
        <CompareVerdictCard
          verdict={verdict}
          winner={winner}
          objectiveLabel={objectiveLabel}
          layoutMode="desktop"
        />
      ) : null}

      <CompareFactorMatrix
        tools={sorted}
        objective={activeObjective}
        verdict={verdict}
        layoutMode="desktop"
      />

      <CompareEditorialDetails tools={sorted} layoutMode="desktop" />

      <CompareDecisionPanel
        tools={sorted}
        objective={activeObjective}
        enabled={decisionEnabled}
        idPrefix="desktop"
      />
    </section>
  );
}
