import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  rankCompareScores,
  scoreToolForCompare,
  type CompareScoreResult,
  COMPARE_INSUFFICIENT_EVIDENCE_MESSAGE,
} from "@/lib/compare/compare-score";
import {
  COMPARE_OBJECTIVES,
  getObjectiveProfile,
  type CompareObjective,
} from "@/lib/compare/compare-objective";
import { getApprovedAssessmentBySlug } from "@/lib/data/editorial-assessments";
import {
  buildObjectiveRanking,
  computeObjectiveFitRaw,
  type ObjectiveFitResult,
  type ObjectiveVerdict,
} from "@/lib/compare/objective-fit";
import type { ApprovedEditorialAssessment } from "@/lib/data/editorial-assessments/types";

export type BattleObjective = CompareObjective;
export const BATTLE_OBJECTIVES: { key: BattleObjective; label: string }[] =
  COMPARE_OBJECTIVES.map(({ key, label }) => ({ key, label }));

export function hashColor(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue} 80% 55%)`;
}

export function getToolLogoUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    const domain = new URL(value).hostname.replace(/^www\./, "");
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(value)}&sz=64`;
  }
}

export type NormalisedTool = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  /**
   * Explicit 0-10 editorial score. Available when the canonical assessment
   * is supported OR when a complete scorecard is published.
   * Null only when the tool is genuinely unassessed.
   */
  score: number | null;
  editorialScore: number | null;
  battleScore: number | null;
  /** Display fit score (rounded to 1 decimal). Undefined when no objective. */
  objectiveScore?: number | null;
  /** Full-precision fit score. Used for ranking/tie. Undefined when no objective. */
  objectiveRawScore?: number | null;
  /** Canonical objective rank (shared for ties). Undefined when no objective. */
  objectiveRank?: number | null;
  objectiveDelta?: number | null;
  /** Per-dimension breakdown for factor bars. Empty when no objective. */
  weightedDimensions?: ObjectiveFitResult["weightedDimensions"];
  /** Contextual summary from the engine. */
  objectiveSummary?: string;
  /** Decisive factors from the engine. */
  decisiveFactors?: string[];
  /** Tradeoffs from the engine. */
  tradeoffs?: string[];
  compareScore: CompareScoreResult;
  accentFrom: string;
  accentTo: string;
  tldr: string;
  useCase: string;
  review: string;
  highlights: string[];
  useCases: string[];
  tags: string[];
  readingTime: string;
  url: string;
  logoUrl: string;
  isDirectory: boolean;
  useCasesCount: number;
};

/**
 * Re-attaches the canonical assessment result to each candidate. Equal
 * assessments share a rank; incomplete assessments have no rank. No slug,
 * name, or field coverage can decide an outcome.
 */
export function withBattleScores(tools: NormalisedTool[]): NormalisedTool[] {
  const rankedBySlug = new Map(
    rankCompareScores(tools.map((tool) => tool.compareScore)).map((result) => [
      result.slug,
      result,
    ]),
  );

  return tools.map((tool) => {
    const compareScore = rankedBySlug.get(tool.slug) ?? tool.compareScore;

    return {
      ...tool,
      compareScore,
      score: compareScore.total,
      battleScore: compareScore.total,
      editorialScore: compareScore.total,
    };
  });
}

export async function celebrateArenaFight(winner?: NormalisedTool) {
  // Only an explicit, supported verdict may trigger this optional feedback.
  void winner;
}

export function normalise(
  tools: ToolPublicView[],
  compareSlugs: string[],
): NormalisedTool[] {
  return compareSlugs.flatMap((slug) => {
    const tool = tools.find((item) => item.slug === slug);
    if (!tool) return [];

    const compareScore = scoreToolForCompare(tool.publicTool);
    const score = compareScore.total;
    const fallbackColor = hashColor(tool.name);
    const highlights = tool.highlights.length > 0
      ? tool.highlights.slice(0, 3)
      : tool.tags.slice(0, 3);

    return [{
      slug: tool.slug,
      name: tool.name,
      category: tool.category,
      categoryLabel: tool.categoryLabel,
      score,
      editorialScore: score,
      battleScore: score,
      compareScore,
      accentFrom: tool.accentFrom ?? fallbackColor,
      accentTo: tool.accentTo ?? fallbackColor,
      tldr: tool.tldr,
      useCase: tool.idealUseCase ?? tool.longDescription,
      review: tool.editorialReview ?? "",
      highlights,
      useCases: tool.useCases,
      tags: tool.tags,
      readingTime: tool.readingTime ?? "",
      url: tool.url,
      logoUrl: getToolLogoUrl(tool.domain || tool.externalUrl),
      isDirectory: tool.presentationKind === "directory",
      useCasesCount: tool.useCases.length,
    }];
  });
}

/** The canonical objective-fit result for the current selection. */
export type CanonicalObjectiveRanking = {
  objective: CompareObjective | null;
  objectiveLabel: string | null;
  /** Tools in canonical objective order (fit desc). Input array is not mutated. */
  orderedTools: NormalisedTool[];
  /** Ranked fit results keyed by slug. */
  fitBySlug: Map<string, ObjectiveFitResult>;
  /** The engine verdict (winner/tie/incomplete). */
  objectiveVerdict: ObjectiveVerdict | null;
  /** Whether an objective is active. */
  hasObjective: boolean;
};

/**
 * Builds the canonical objective ranking for a set of tools. This is the
 * single source of truth consumed by desktop, mobile, Arena, sidebar and the
 * decision workspace. No component re-sorts or recomputes independently.
 */
export function buildCanonicalObjectiveRanking(
  tools: NormalisedTool[],
  objective: BattleObjective | null,
  assessments?: Map<string, ApprovedEditorialAssessment>,
): CanonicalObjectiveRanking {
  const profile = getObjectiveProfile(objective);

  // No objective → neutral (base score ordering).
  if (!profile) {
    return {
      objective: null,
      objectiveLabel: null,
      orderedTools: tools,
      fitBySlug: new Map(),
      objectiveVerdict: null,
      hasObjective: false,
    };
  }

  // Collect assessments for the selected tools.
  const assessmentMap = new Map<string, ApprovedEditorialAssessment>();
  for (const tool of tools) {
    const assessment = assessments?.get(tool.slug) ?? getApprovedAssessmentBySlug(tool.slug);
    if (assessment) assessmentMap.set(tool.slug, assessment);
  }

  const summary = buildObjectiveRanking(assessmentMap, profile);

  // Merge fit results back onto the tools. Ranked (assessed) tools come in
  // canonical fit order; unassessed tools are preserved at the end with
  // undefined objective fields so the UI can still render their fallback.
  const fitBySlug = new Map(summary.rankedTools.map((r) => [r.slug, r]));
  const ranked = summary.rankedTools
    .map((fit) => {
      const tool = tools.find((t) => t.slug === fit.slug);
      if (!tool) return null;
      const baseScore = tool.battleScore;
      const delta =
        baseScore !== null && baseScore !== undefined
          ? Math.round((fit.displayScore - baseScore) * 10) / 10
          : 0;
      return {
        ...tool,
        objectiveScore: fit.displayScore,
        objectiveRawScore: fit.rawScore,
        objectiveRank: fit.rank,
        objectiveDelta: delta,
        weightedDimensions: fit.weightedDimensions,
        objectiveSummary: fit.summary,
        decisiveFactors: fit.decisiveFactors,
        tradeoffs: fit.tradeoffs,
      };
    })
    .filter((ts): ts is NonNullable<typeof ts> => ts !== null);

  const rankedSlugs = new Set(ranked.map((t) => t.slug));
  const unassessed = tools
    .filter((t) => !rankedSlugs.has(t.slug))
    .map((t) => ({
      ...t,
      objectiveScore: undefined,
      objectiveRawScore: undefined,
      objectiveRank: undefined,
      objectiveDelta: undefined,
      weightedDimensions: undefined,
      objectiveSummary: undefined,
      decisiveFactors: undefined,
      tradeoffs: undefined,
    }));

  const merged = [...ranked, ...unassessed];

  return {
    objective,
    objectiveLabel: summary.objectiveLabel,
    orderedTools: merged,
    fitBySlug,
    objectiveVerdict: summary.verdict,
    hasObjective: true,
  };
}

/** Backwards-compatible: attaches display fit scores (no ranking). */
export function getObjectiveScore(
  tool: NormalisedTool,
  objective: BattleObjective,
): number | null {
  const profile = getObjectiveProfile(objective);
  if (!profile) return null;
  const assessment = getApprovedAssessmentBySlug(tool.slug);
  if (!assessment) return null;
  return computeObjectiveFitRaw(assessment, profile);
}

/**
 * Applies objective fit scores to each tool in canonical order. This is the
 * single canonical path used by all surfaces. Base assessment scores are
 * never modified.
 */
export function withObjectiveScores(
  tools: NormalisedTool[],
  objective: BattleObjective | null,
  assessments?: Map<string, ApprovedEditorialAssessment>,
): NormalisedTool[] {
  return buildCanonicalObjectiveRanking(tools, objective, assessments).orderedTools;
}

export type BattleVerdictState =
  | "insufficient_evidence"
  | "tie"
  | "user_preference_required"
  | "editorial_lead"
  | "personal_verdict";

export type PersonalBattleVerdict = {
  winnerSlug: string;
  reason?: string;
};

export type BattleVerdict = {
  state: BattleVerdictState;
  winner: NormalisedTool | null;
  scores: { tool: NormalisedTool; score: number | null; rank: number | null }[];
  reasons: string[];
  label: string;
};

function getScores(tools: NormalisedTool[]): BattleVerdict["scores"] {
  return tools.map((tool) => ({
    tool,
    score: tool.battleScore,
    rank: tool.compareScore.rank,
  }));
}

function hasAssessableScore(
  tool: NormalisedTool,
): tool is NormalisedTool & { battleScore: number } {
  return (
    tool.compareScore.assessment.state === "verified" &&
    typeof tool.battleScore === "number"
  );
}

function createVerdict(
  state: BattleVerdictState,
  scores: BattleVerdict["scores"],
  reasons: string[],
  winner: NormalisedTool | null = null,
  labelOverride?: string,
): BattleVerdict {
  const labels: Record<BattleVerdictState, string> = {
    insufficient_evidence: "Valutazione editoriale in preparazione",
    tie: "Risultato equilibrato",
    user_preference_required: "La priorità richiede una scelta personale",
    editorial_lead: "Valutazione editoriale supportata",
    personal_verdict: "Scelta personale",
  };

  return {
    state,
    winner,
    scores,
    reasons,
    label: labelOverride ?? labels[state],
  };
}

/**
 * Resolves only explicit outcomes. When an objective is active and a
 * canonical verdict is supplied, it is consumed directly (no re-sort,
 * no re-computation). When no canonical verdict is given, it falls back
 * to the canonical base-score comparison.
 */
export function getBattleVerdict(
  tools: NormalisedTool[],
  objective: BattleObjective | null = null,
  personalVerdict: PersonalBattleVerdict | null = null,
  canonicalVerdict?: ObjectiveVerdict | null,
): BattleVerdict {
  const personalWinner = personalVerdict
    ? tools.find((tool) => tool.slug === personalVerdict.winnerSlug) ?? null
    : null;

  if (personalWinner) {
    return createVerdict(
      "personal_verdict",
      getScores(tools),
      [
        `${personalWinner.name} e la tua scelta personale.${personalVerdict?.reason ? ` ${personalVerdict.reason}` : ""}`,
        "La scelta personale resta distinta da un esito automatico.",
      ],
      personalWinner,
    );
  }

  const unassessed = tools.filter((tool) => !hasAssessableScore(tool));
  if (tools.length === 0 || unassessed.length > 0) {
    const pendingNames = unassessed.map((tool) => tool.name).join(", ");
    return createVerdict("insufficient_evidence", getScores(tools), [
      COMPARE_INSUFFICIENT_EVIDENCE_MESSAGE,
      pendingNames
        ? `Una valutazione editoriale e ancora in preparazione per: ${pendingNames}.`
        : "Aggiungi almeno due tool con valutazione editoriale verificata per arrivare a una decisione.",
    ]);
  }

  const assessable = tools.filter(hasAssessableScore);
  const objectiveLabel = objective
    ? BATTLE_OBJECTIVES.find((item) => item.key === objective)?.label ?? null
    : null;

  // When an objective is active, consume the canonical engine verdict.
  if (objectiveLabel) {
    const withFit = assessable.filter((t) => typeof t.objectiveRawScore === "number");
    if (withFit.length === 0) {
      return createVerdict("tie", getScores(tools), [
        "Nessun dato di fit disponibile per questo obiettivo.",
      ]);
    }

    const usedVerdict = canonicalVerdict ?? null;

    const fitScores = withFit.map((t) => ({
      tool: t,
      score: t.objectiveScore ?? null,
      rank: t.objectiveRank ?? null,
    }));

    if (usedVerdict && usedVerdict.kind === "tie") {
      const tiedSlugs = new Set([usedVerdict.leader.slug, usedVerdict.runnerUp.slug]);
      const topNames = withFit
        .filter((t) => tiedSlugs.has(t.slug))
        .map((t) => t.name)
        .join(", ");
      return createVerdict("tie", fitScores, [
        `Obiettivo "${objectiveLabel}": nessun distacco netto tra ${topNames}.`,
        `La differenza di fit e inferiore alla soglia di parita (0.3/10).`,
        "La scelta dipende da trade-off specifici del tuo contesto.",
      ]);
    }

    if (usedVerdict && usedVerdict.kind === "winner") {
      const top = withFit.find((t) => t.slug === usedVerdict.leader.slug) ?? withFit[0];
      const second = withFit.find((t) => t.slug === usedVerdict.runnerUp?.slug);
      const gap = usedVerdict.gap;
      const winnerReasons = [
        `Obiettivo "${objectiveLabel}": ${top.name} e piu adatto per questo obiettivo (fit ${top.objectiveScore}/10).`,
        `Il vantaggio e determinato dalle dimensioni rilevanti per questo obiettivo, non dalla valutazione generale.`,
      ];
      if (second) {
        winnerReasons.push(
          `Distacco: +${gap.toFixed(1)} punti rispetto a ${second.name}.`,
        );
      }
      return createVerdict("editorial_lead", fitScores, winnerReasons, top);
    }

    if (usedVerdict && usedVerdict.kind === "incomplete") {
      return createVerdict("tie", fitScores, [
        usedVerdict.reason,
        "La scelta dipende da trade-off specifici del tuo contesto.",
      ]);
    }

    // Fallback: no canonical verdict supplied (backward compat).
    const top = withFit[0];
    const second = withFit[1];
    const gap = second
      ? (top.objectiveRawScore as number) - (second.objectiveRawScore as number)
      : Infinity;

    if (gap < 0.3 && withFit.length > 1) {
      const topNames = withFit
        .filter((t) => Math.abs((t.objectiveRawScore as number) - (top.objectiveRawScore as number)) < 0.3)
        .map((t) => t.name)
        .join(", ");
      return createVerdict("tie", fitScores, [
        `Obiettivo "${objectiveLabel}": nessun distacco netto tra ${topNames}.`,
        `La differenza di fit e inferiore alla soglia di parita (0.3/10).`,
        "La scelta dipende da trade-off specifici del tuo contesto.",
      ]);
    }

    const winnerReasons = [
      `Obiettivo "${objectiveLabel}": ${top.name} e piu adatto per questo obiettivo (fit ${top.objectiveScore}/10).`,
      `Il vantaggio e determinato dalle dimensioni rilevanti per questo obiettivo, non dalla valutazione generale.`,
    ];
    if (second) {
      winnerReasons.push(
        `Distacco: +${gap.toFixed(1)} punti rispetto a ${second.name}.`,
      );
    }

    return createVerdict("editorial_lead", fitScores, winnerReasons, top);
  }

  // No objective: use canonical base scores.
  const highestScore = Math.max(...assessable.map((tool) => tool.battleScore));
  const leaders = assessable.filter((tool) => tool.battleScore === highestScore);

  if (leaders.length !== 1) {
    return createVerdict("tie", getScores(tools), [
      "Le valutazioni editoriali sono equivalenti: nessun vincitore automatico.",
      "La scelta dipende dalle tue priorita, dai limiti verificati e dal contesto d'uso.",
    ]);
  }

  const winner = leaders[0];
  return createVerdict(
    "editorial_lead",
    getScores(tools),
    [
      `${winner.name} ha la valutazione editoriale esplicita piu alta tra i candidati verificati.`,
      "Questo vantaggio non deriva da quantita di prove, casi d'uso, tag o completezza dei campi.",
    ],
    winner,
  );
}
