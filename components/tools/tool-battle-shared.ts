import type { ToolPublicView } from "@/lib/data/tool-public-view";
import { computeEditorialScore } from "@/lib/data/editorial-score";
import {
  rankCompareScores,
  scoreToolForCompare,
  type CompareScoreResult,
} from "@/lib/compare/compare-score";
import {
  COMPARE_OBJECTIVE_KEYWORDS,
  COMPARE_OBJECTIVE_MAX_DELTA,
  COMPARE_OBJECTIVE_POINTS_PER_HIT,
  COMPARE_OBJECTIVE_SOURCE_WEIGHTS,
  COMPARE_OBJECTIVES,
  type CompareObjective,
} from "@/lib/compare/compare-objective";

// B34 / FLOW-603: la configurazione degli obiettivi vive in
// `lib/compare/compare-objective`; qui restano i re-export per non
// rompere gli import esistenti dei consumer dell'adapter.
export type BattleObjective = CompareObjective;
export const BATTLE_OBJECTIVES: { key: BattleObjective; label: string }[] =
  COMPARE_OBJECTIVES.map(({ key, label }) => ({ key, label }));

export function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h % 360);
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
  score: number;
  editorialScore: number;
  battleScore: number;
  objectiveScore?: number;
  objectiveDelta?: number;
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
 * Ranking deterministico (B33): riusa il comparatore canonico del
 * motore `lib/compare/compare-score` (totale, copertura, slug).
 * Nessun offset su indice/hash: l'ordine di input non cambia il
 * punteggio né il rank di ciascun candidato.
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
    };
  });
}

export async function celebrateArenaFight(winner?: NormalisedTool) {
  const { default: confetti } = await import("canvas-confetti");

  const colors = winner
    ? [winner.accentFrom, winner.accentTo, "#f3bf4c"]
    : ["#6a3cff", "#39d2f6", "#f3bf4c"];

  confetti({
    colors,
    disableForReducedMotion: true,
    origin: { y: 0.62 },
    particleCount: 18,
    scalar: 0.6,
    spread: 38,
    startVelocity: 18,
    gravity: 1.2,
    ticks: 100,
  });
}

export function normalise(
  tools: ToolPublicView[],
  compareSlugs: string[],
): NormalisedTool[] {
  return compareSlugs.flatMap((slug) => {
    const tool = tools.find((item) => item.slug === slug);
    if (!tool) return [];

    const isDirectory = tool.presentationKind === "directory";
    // B33: il punteggio deriva solo dai campi canonici ToolPublic
    // (score/evidence/useCases/taxonomy) con provenance dichiarata;
    // livello, featured e hash di presentazione non partecipano piu`.
    const compareScore = scoreToolForCompare(tool.publicTool);
    const editorialScore = computeEditorialScore(tool).value;
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
      editorialScore,
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
      isDirectory,
      useCasesCount: tool.useCases.length,
    }];
  });
}

// B34: keyword map e pesi delle sorgenti arrivano dal config canonico
// `lib/compare/compare-objective` (condiviso con il selettore UI).
const OBJECTIVE_KEYWORDS = COMPARE_OBJECTIVE_KEYWORDS;

const OBJECTIVE_SOURCE_LABELS: Record<string, string> = {
  highlights: "i punti di forza evidenziati",
  useCases: "i casi d'uso pratici",
  tags: "i tag del catalogo",
  category: "la categoria",
};

type ObjectiveMatch = {
  rawScore: number;
  topSource: string | null;
  topKeyword: string | null;
};

function getObjectiveMatch(tool: NormalisedTool, objective: BattleObjective): ObjectiveMatch {
  const keywords = OBJECTIVE_KEYWORDS[objective];
  const sourceItems: Record<string, string[]> = {
    highlights: tool.highlights,
    useCases: tool.useCases,
    tags: tool.tags,
    category: [tool.category, tool.categoryLabel].filter(Boolean),
  };
  const sources: { key: string; items: string[]; weight: number }[] =
    COMPARE_OBJECTIVE_SOURCE_WEIGHTS.map((source) => ({
      key: source.key,
      items: sourceItems[source.key],
      weight: source.weight,
    }));

  let rawScore = 0;
  const sourceScores = new Map<string, number>();
  const keywordHits = new Map<string, number>();

  for (const source of sources) {
    sourceScores.set(source.key, 0);
    for (const item of source.items) {
      const text = String(item).toLowerCase();
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          rawScore += source.weight;
          sourceScores.set(source.key, (sourceScores.get(source.key) ?? 0) + source.weight);
          keywordHits.set(keyword, (keywordHits.get(keyword) ?? 0) + 1);
        }
      }
    }
  }

  const topSource =
    [...sourceScores.entries()].filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topKeyword =
    [...keywordHits.entries()].filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return { rawScore, topSource, topKeyword };
}

export function getObjectiveScore(tool: NormalisedTool, objective: BattleObjective): number {
  const { rawScore } = getObjectiveMatch(tool, objective);
  return Math.min(COMPARE_OBJECTIVE_MAX_DELTA, rawScore * COMPARE_OBJECTIVE_POINTS_PER_HIT);
}

export function withObjectiveScores(
  tools: NormalisedTool[],
  objective: BattleObjective | null,
): NormalisedTool[] {
  if (!objective) {
    return tools.map((tool) => ({
      ...tool,
      objectiveScore: undefined,
      objectiveDelta: undefined,
    }));
  }

  const deltas = tools.map((tool) => Math.round(getObjectiveScore(tool, objective)));
  const hasAnyMatch = deltas.some((delta) => delta !== 0);

  if (!hasAnyMatch) {
    return tools.map((tool) => ({
      ...tool,
      objectiveScore: tool.battleScore,
      objectiveDelta: 0,
    }));
  }

  return tools.map((tool, index) => {
    const delta = deltas[index];
    const objectiveScore = Math.max(0, Math.min(100, tool.battleScore + delta));
    return { ...tool, objectiveScore, objectiveDelta: objectiveScore - tool.battleScore };
  });
}

export type BattleVerdict = {
  winner: NormalisedTool;
  scores: { tool: NormalisedTool; score: number; rank: number }[];
  reasons: string[];
  label: string;
};

export function getBattleVerdict(
  tools: NormalisedTool[],
  objective: BattleObjective | null = null,
): BattleVerdict {
  // Tie-break canonico (B33): punteggio, copertura dati, slug.
  // Il verdetto non dipende dall'ordine di input dei candidati.
  const sorted = [...tools].sort(
    (a, b) =>
      (b.objectiveScore ?? b.battleScore) - (a.objectiveScore ?? a.battleScore) ||
      b.compareScore.confidence.coverage - a.compareScore.confidence.coverage ||
      (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
  );
  const winner = sorted[0];
  const runnerUp = sorted[1];

  const scores = sorted.map((tool, index) => ({
    tool,
    score: tool.objectiveScore ?? tool.battleScore,
    rank: index + 1,
  }));

  const reasons: string[] = [];

  if (runnerUp) {
    const gap = (winner.objectiveScore ?? winner.battleScore) - (runnerUp.objectiveScore ?? runnerUp.battleScore);
    if (gap >= 8) {
      reasons.push(`${winner.name} vince con un margine di ${gap} punti su ${runnerUp.name}.`);
    } else if (gap >= 3) {
      reasons.push(`${winner.name} supera ${runnerUp.name} di ${gap} punti.`);
    } else {
      reasons.push(`${winner.name} vince per un margine ridotto: la scelta dipende dal caso d'uso.`);
    }
  }

  const winnerHighlights = winner.highlights.length;
  const avgHighlights = tools.reduce((sum, t) => sum + t.highlights.length, 0) / tools.length;
  if (winnerHighlights >= avgHighlights + 1) {
    reasons.push(`${winner.name} ha più punti di forza evidenziati rispetto agli altri.`);
  }

  const winnerUseCases = winner.useCasesCount;
  const avgUseCases = tools.reduce((sum, t) => sum + t.useCasesCount, 0) / tools.length;
  if (winnerUseCases >= avgUseCases + 1) {
    reasons.push(`${winner.name} copre più casi d'uso pratici nel catalogo.`);
  }

  if (reasons.length < 3) {
    reasons.push(`${winner.name} ha ottenuto il miglior punteggio nella combinazione di dimensioni confrontate.`);
  }

  const hasRealData =
    tools.some((t) => t.isDirectory) ||
    tools.some((t) => t.highlights.length > 0 || t.useCasesCount > 0);

  let label: BattleVerdict["label"] = "Verdetto basato sui dati disponibili";
  const objectiveLabel = objective ? BATTLE_OBJECTIVES.find((o) => o.key === objective)?.label : null;

  if (objective && objectiveLabel) {
    const hasObjectiveMatch = tools.some((t) => (t.objectiveDelta ?? 0) !== 0);
    if (hasObjectiveMatch) {
      label = `Verdetto orientato a ${objectiveLabel}`;
      const winnerMatch = getObjectiveMatch(winner, objective);
      if (winnerMatch.rawScore > 0 && winnerMatch.topSource) {
        reasons.unshift(`${winner.name} è il migliore per ${objectiveLabel} grazie a ${OBJECTIVE_SOURCE_LABELS[winnerMatch.topSource] ?? "i segnali raccolti"}.`);
      }

      const baseSorted = [...tools].sort(
        (a, b) =>
          b.battleScore - a.battleScore ||
          b.compareScore.confidence.coverage - a.compareScore.confidence.coverage ||
          (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0),
      );
      const baseWinner = baseSorted[0];
      if (baseWinner && baseWinner.slug !== winner.slug) {
        reasons.unshift(`Con l'obiettivo ${objectiveLabel}, ${winner.name} supera ${baseWinner.name}.`);
      }
    } else {
      reasons.unshift(`Nessun dato specifico per ${objectiveLabel}: il verdetto si basa sul punteggio generale.`);
    }
  } else if (hasRealData && tools.every((t) => t.isDirectory)) {
    label = "Verdetto editoriale";
  } else if (hasRealData && tools.some((t) => t.isDirectory)) {
    label = "Verdetto tecnico";
  }

  // B33 / FLOW-602: l'assenza di dati riduce la confidence e viene
  // dichiarata nel verdetto invece di produrre punteggi fantasma.
  const winnerConfidence = winner.compareScore.confidence;
  if (winnerConfidence.level !== "high") {
    const coveragePercent = Math.round(winnerConfidence.coverage * 100);
    reasons.unshift(
      `${winner.name} vince con confidence ${winnerConfidence.level === "medium" ? "media" : "bassa"}: copertura dati al ${coveragePercent}%, verdetto da confermare sulla scheda del tool.`,
    );
  }

  if (
    label === "Verdetto basato sui dati disponibili" &&
    tools.every((t) => t.compareScore.confidence.level === "low")
  ) {
    label = "Verdetto provvisorio: dati insufficienti";
  }

  return {
    winner,
    scores,
    reasons: reasons.slice(0, 3),
    label,
  };
}
