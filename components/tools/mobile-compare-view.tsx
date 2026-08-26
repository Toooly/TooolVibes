"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  getCompareObjectiveLabel,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import { playTooolvibesSound } from "@/lib/config/sound";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
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
import { CompareTrendList } from "./compare-trend-list";
import {
  CompareWorkbenchEmpty,
  CompareWorkbenchIdentity,
  CompareWorkbenchPrep,
} from "./compare-workbench-chrome";

/**
 * Backwards-compatible re-export. Existing imports from
 * `mobile-compare-view.tsx` (notably `__tests__/components/tools/mobile-compare-view.test.tsx`)
 * keep working unchanged.
 */
export { DiffMatrix } from "./compare-factor-matrix";

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

export function MobileCompareView({
  tools: catalogTools,
  objective = null,
  onObjectiveChange,
  objectiveEnabled = true,
  decisionEnabled = true,
}: MobileCompareViewProps) {
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const toggleCompare = useToolWorkspaceStore((s) => s.toggleCompare);
  const clearCompare = useToolWorkspaceStore((s) => s.clearCompare);
  const [battleState, setBattleState] = useState<BattleState>("idle");
  const reducedMotion = useReducedMotion();
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
      tools.length >= 2
        ? getBattleVerdict(tools, activeObjective, null, canonicalVerdict)
        : null,
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
        <CompareWorkbenchEmpty />
      </div>
    );
  }

  if (tools.length === 1) {
    return (
      <div className="mobile-compare-arena mobile-compare-arena--onboarding">
        <CompareWorkbenchPrep
          tool={tools[0]}
          onRemove={toggleCompare}
          onClear={clearCompare}
        />
      </div>
    );
  }

  // The input order is retained unless a supported editorial assessment gives
  // candidates shared ranks; no slug or field-completeness ordering is used.
  const sorted = verdict ? verdict.scores.map((entry) => entry.tool) : tools;
  const activeVerdict = verdict!;
  const winner = activeVerdict.winner;
  const isRevealed = battleState === "result";
  const objectiveLabel = ranking.objectiveLabel
    ? ranking.objectiveLabel
    : activeObjective
      ? getCompareObjectiveLabel(activeObjective)
      : null;

  function handleFight() {
    if (battleState === "fighting" || fightLockedRef.current) return;
    fightLockedRef.current = true;
    clearFightTimers();
    setBattleState("fighting");
    queueFightTimer(() => {
      setBattleState("result");
      if (!reducedMotion && activeVerdict.winner) {
        playTooolvibesSound("battleWin");
        void celebrateArenaFight(activeVerdict.winner);
      }
      fightLockedRef.current = false;
    }, 600);
  }

  return (
    <div className="mobile-compare-arena">
      <CompareWorkbenchIdentity
        tools={sorted}
        onRemove={toggleCompare}
        onClear={clearCompare}
        decisionEnabled={decisionEnabled}
        layoutMode="mobile"
      />

      {objectiveEnabled && onObjectiveChange ? (
        <CompareObjectiveSelector
          objective={activeObjective}
          onObjectiveChange={onObjectiveChange}
          idPrefix="mobile"
        />
      ) : null}

      <CompareBattleStage
        tools={sorted}
        verdict={activeVerdict}
        battleState={battleState}
        onFight={handleFight}
        objectiveLabel={objectiveLabel}
        layoutMode="mobile"
      />

      <CompareRanking
        tools={sorted}
        winner={winner}
        onRemove={(slug) => toggleCompare(slug)}
        layoutMode="mobile"
      />

      {isRevealed ? (
        <CompareVerdictCard
          verdict={activeVerdict}
          winner={winner}
          objectiveLabel={objectiveLabel}
          layoutMode="mobile"
        />
      ) : null}

      <CompareFactorMatrix
        tools={sorted}
        objective={activeObjective}
        verdict={activeVerdict}
        layoutMode="mobile"
      />

      <CompareEditorialDetails tools={sorted} layoutMode="mobile" />

      <CompareDecisionPanel
        tools={sorted}
        objective={activeObjective}
        enabled={decisionEnabled}
        idPrefix="mobile"
      />

      <div className="mobile-compare-arena__trend">
        <CompareTrendList />
      </div>
    </div>
  );
}
