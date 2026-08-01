import type { ToolPublicView } from "@/lib/data/tool-public-view";
import {
  rankCompareScores,
  scoreToolForCompare,
  type CompareScoreResult,
} from "@/lib/compare/compare-score";
import {
  COMPARE_OBJECTIVES,
  type CompareObjective,
} from "@/lib/compare/compare-objective";

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
  /** Explicit editorial assessment only; null means not yet assessable. */
  score: number | null;
  editorialScore: number | null;
  battleScore: number | null;
  objectiveScore?: number | null;
  objectiveDelta?: number | null;
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

/**
 * Kept as a compatible export. Priorities remain useful filters/readers, but
 * they no longer turn keywords, evidence, use cases, or taxonomy into a score.
 */
export function getObjectiveScore(
  _tool: NormalisedTool,
  _objective: BattleObjective,
): null {
  void _tool;
  void _objective;
  return null;
}

/** Priorities must not alter a canonical editorial assessment. */
export function withObjectiveScores(
  tools: NormalisedTool[],
  _objective: BattleObjective | null,
): NormalisedTool[] {
  void _objective;
  return tools.map((tool) => ({
    ...tool,
    objectiveScore: undefined,
    objectiveDelta: undefined,
  }));
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

function hasSupportedAssessment(
  tool: NormalisedTool,
): tool is NormalisedTool & { battleScore: number } {
  return tool.compareScore.assessment.state === "supported" && typeof tool.battleScore === "number";
}

function createVerdict(
  state: BattleVerdictState,
  scores: BattleVerdict["scores"],
  reasons: string[],
  winner: NormalisedTool | null = null,
): BattleVerdict {
  const labels: Record<BattleVerdictState, string> = {
    insufficient_evidence: "Dati insufficienti per un verdetto",
    tie: "Nessun vincitore automatico",
    user_preference_required: "La priorità richiede una scelta personale",
    editorial_lead: "Valutazione editoriale supportata",
    personal_verdict: "Verdetto personale",
  };

  return { state, winner, scores, reasons, label: labels[state] };
}

/**
 * Resolves only explicit outcomes. It never chooses a candidate from equal or
 * incomplete assessments, and an objective never becomes a proxy score.
 */
export function getBattleVerdict(
  tools: NormalisedTool[],
  objective: BattleObjective | null = null,
  personalVerdict: PersonalBattleVerdict | null = null,
): BattleVerdict {
  const scores = getScores(tools);
  const personalWinner = personalVerdict
    ? tools.find((tool) => tool.slug === personalVerdict.winnerSlug) ?? null
    : null;

  if (personalWinner) {
    return createVerdict(
      "personal_verdict",
      scores,
      [
        `${personalWinner.name} è la tua scelta personale.${personalVerdict?.reason ? ` ${personalVerdict.reason}` : ""}`,
        "La scelta personale resta distinta da un verdetto editoriale automatico.",
      ],
      personalWinner,
    );
  }

  const unsupported = tools.filter((tool) => !hasSupportedAssessment(tool));
  if (tools.length === 0 || unsupported.length > 0) {
    const pending = unsupported
      .map((tool) => `${tool.name}: ${tool.compareScore.assessment.missing.join(", ")}`)
      .join("; ");
    return createVerdict("insufficient_evidence", scores, [
      "Nessun vincitore automatico: ogni candidato deve avere una valutazione editoriale completa e verificata.",
      pending
        ? `Valutazioni ancora incomplete: ${pending}.`
        : "Aggiungi almeno due valutazioni editoriali complete per confrontarle.",
    ]);
  }

  const supported = tools.filter(hasSupportedAssessment);
  const highestScore = Math.max(...supported.map((tool) => tool.battleScore));
  const leaders = supported.filter((tool) => tool.battleScore === highestScore);

  if (leaders.length !== 1) {
    return createVerdict("tie", scores, [
      "Nessun vincitore automatico: le valutazioni editoriali più alte sono equivalenti.",
      "La scelta dipende dalle tue priorità, dai limiti verificati e dal contesto d'uso.",
    ]);
  }

  const objectiveLabel = objective
    ? BATTLE_OBJECTIVES.find((item) => item.key === objective)?.label ?? "la priorità selezionata"
    : null;
  if (objectiveLabel) {
    return createVerdict("user_preference_required", scores, [
      `Hai selezionato ${objectiveLabel}: confronta i casi d'uso e i limiti verificati rispetto al tuo contesto.`,
      "Una priorità personale non assegna da sola un vincitore automatico.",
    ]);
  }

  const winner = leaders[0];
  return createVerdict(
    "editorial_lead",
    scores,
    [
      `${winner.name} ha la valutazione editoriale esplicita più alta tra i candidati completamente verificati.`,
      "Questo vantaggio non deriva da quantità di prove, casi d'uso, tag o completezza dei campi.",
    ],
    winner,
  );
}
