import type { ToolPublicView } from "@/lib/data/tool-public-view";

type CatalogScoreLevel = "featured" | "beginner" | "intermediate" | "expert";

function isCatalogScoreLevel(value: string | null): value is CatalogScoreLevel {
  return value === "featured" || value === "beginner" || value === "intermediate" || value === "expert";
}

export const levelScoreBase: Record<CatalogScoreLevel, number> = {
  featured: 91,
  beginner: 72,
  intermediate: 82,
  expert: 87,
};

export function dirScore(t: ToolPublicView) {
  const levelBase =
    isCatalogScoreLevel(t.level)
      ? levelScoreBase[t.level]
      : 70;

  return Math.min(
    98,
    levelBase +
      (t.toolOfWeek ? 4 : 0) +
      (t.featured ? 2 : 0) +
      Math.min(t.highlights.length, 3),
  );
}

export function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h % 360);
  return `hsl(${hue} 80% 55%)`;
}

export function legacyScore(t: ToolPublicView): number {
  return Math.min(95, 70 + (t.featured ? 10 : 0) + Math.min(t.tags.length, 5) * 2);
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

export function stableScoreOffset(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return (hash % 13) - 6;
}

export type BattleObjective =
  | "save-time"
  | "quality"
  | "save-money"
  | "learn-fast"
  | "collaborate"
  | "scale"
  | "experiment";

export const BATTLE_OBJECTIVES: { key: BattleObjective; label: string }[] = [
  { key: "save-time", label: "Risparmiare tempo" },
  { key: "quality", label: "Aumentare qualità" },
  { key: "save-money", label: "Ridurre costi" },
  { key: "learn-fast", label: "Imparare velocemente" },
  { key: "collaborate", label: "Collaborare" },
  { key: "scale", label: "Scalare" },
  { key: "experiment", label: "Sperimentare" },
];

export type NormalisedTool = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  score: number;
  battleScore: number;
  objectiveScore?: number;
  objectiveDelta?: number;
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

export function withBattleScores(tools: NormalisedTool[]): NormalisedTool[] {
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
    const score = isDirectory ? dirScore(tool) : legacyScore(tool);
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
      battleScore: score,
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
}const OBJECTIVE_KEYWORDS: Record<BattleObjective, string[]> = {
  "save-time": [
    "automation",
    "automazione",
    "productivity",
    "produttività",
    "no-code",
    "low-code",
    "workflow",
    "save time",
    "risparmiare tempo",
    "faster",
    "quick",
    "rapid",
    "velocizza",
    "ai writing",
    "ai image",
    "ai video",
    "generate fast",
    "veloce",
  ],
  quality: [
    "design",
    "video",
    "polish",
    "professional",
    "high quality",
    "high-quality",
    "refined",
    "pixel-perfect",
    "creative",
    "craft",
    "visuals",
    "production",
    "qualità",
    "professionale",
  ],
  "save-money": [
    "free",
    "freemium",
    "open source",
    "affordable",
    "cheap",
    "low cost",
    "cost-effective",
    "budget",
    "gratis",
    "senza costi",
    "economico",
    "risparmiare",
  ],
  "learn-fast": [
    "beginner",
    "intuitive",
    "intuitivo",
    "easy",
    "facile",
    "simple",
    "template",
    "tutorial",
    "onboarding",
    "gentle",
    "low learning curve",
    "impara velocemente",
  ],
  collaborate: [
    "team",
    "collaboration",
    "collaborazione",
    "collaborare",
    "share",
    "condividi",
    "feedback",
    "comment",
    "workspace",
    "customer support",
    "comunicazione",
  ],
  scale: [
    "expert",
    "enterprise",
    "scalability",
    "scalabilità",
    "scalare",
    "api",
    "integration",
    "enterprise-grade",
    "growth",
    "infra",
    "performante",
    "grandi volumi",
  ],
  experiment: [
    "vibe-coding",
    "ai-app-builder",
    "prototype",
    "prototipo",
    "beta",
    "experiment",
    "test",
    "hackathon",
    "try",
    "playful",
    "sandbox",
    "new tech",
    "sperimentare",
  ],
};

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
  const sources: { key: string; items: string[]; weight: number }[] = [
    { key: "highlights", items: tool.highlights, weight: 1.5 },
    { key: "useCases", items: tool.useCases, weight: 1 },
    { key: "tags", items: tool.tags, weight: 0.75 },
    { key: "category", items: [tool.category, tool.categoryLabel].filter(Boolean), weight: 0.5 },
  ];

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
  return Math.min(15, rawScore * 2.5);
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
    const objectiveScore = Math.max(62, Math.min(99, tool.battleScore + delta));
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
  const sorted = [...tools].sort(
    (a, b) => (b.objectiveScore ?? b.battleScore) - (a.objectiveScore ?? a.battleScore),
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

      const baseSorted = [...tools].sort((a, b) => b.battleScore - a.battleScore);
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

  return {
    winner,
    scores,
    reasons: reasons.slice(0, 3),
    label,
  };
}
