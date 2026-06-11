import type { ArenaBattleMode, BattleTurn } from "@/lib/gamification/types";

export type BattleTool = {
  slug: string;
  votes: number;
  trend7d: number;
  comments: number;
  completeness: number;
};

export type BattleResult = {
  mode: ArenaBattleMode;
  toolSlugs: string[];
  winnerSlug: string;
  scoreSnapshot: Record<string, number>;
  battleLog: BattleTurn[];
};

const REASONS: BattleTurn["reason"][] = [
  "votes",
  "trend",
  "comments",
  "completeness",
  "surprise",
];

function hashStringToFloat(input: string): number {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function computeSurpriseFactor(
  tool: BattleTool,
  allSlugs: string[],
  mode: ArenaBattleMode,
  userId: string,
): number {
  const seed = `${userId}${tool.slug}${allSlugs.join(",")}${mode}`;
  const raw = hashStringToFloat(seed);
  return 0.9 + raw * 0.2;
}

function normalize(values: number[]): number[] {
  const max = Math.max(...values);
  if (max === 0) return values.map(() => 0);
  return values.map((value) => value / max);
}

function generateBattleLog(
  tools: BattleTool[],
  scoreSnapshot: Record<string, number>,
): BattleTurn[] {
  const slugs = tools.map((tool) => tool.slug);

  return Array.from({ length: 5 }, (_, index) => {
    const turn = index + 1;
    const attacker = slugs[index % slugs.length];
    const defender = slugs[(index + 1) % slugs.length];
    const reason = REASONS[index % REASONS.length];
    const attackerScore = scoreSnapshot[attacker] ?? 0;
    const defenderScore = scoreSnapshot[defender] ?? 0;
    const damage = Math.max(
      1,
      Math.round(Math.abs(attackerScore - defenderScore) / 20 + 10 + turn * 2),
    );

    return { turn, attacker, defender, damage, reason };
  });
}

export function simulateBattle(
  tools: BattleTool[],
  mode: ArenaBattleMode,
  userId: string,
): BattleResult {
  if (mode === "1v1" && tools.length !== 2) {
    throw new Error("1v1 mode requires exactly 2 tools");
  }
  if (mode === "royale" && (tools.length < 2 || tools.length > 4)) {
    throw new Error("royale mode requires 2 to 4 tools");
  }
  if (mode === "bracket" && tools.length !== 4) {
    throw new Error("bracket mode requires exactly 4 tools");
  }

  const allSlugs = tools.map((tool) => tool.slug);
  const normalizedVotes = normalize(tools.map((tool) => tool.votes));
  const normalizedTrend7d = normalize(tools.map((tool) => tool.trend7d));
  const normalizedComments = normalize(tools.map((tool) => tool.comments));

  const scoreSnapshot: Record<string, number> = {};

  tools.forEach((tool, index) => {
    const surpriseFactor = computeSurpriseFactor(tool, allSlugs, mode, userId);
    const score =
      (normalizedVotes[index] * 0.3 +
        normalizedTrend7d[index] * 0.25 +
        normalizedComments[index] * 0.2 +
        tool.completeness * 0.15 +
        surpriseFactor * 0.1) *
      1000;
    scoreSnapshot[tool.slug] = score;
  });

  const ranked = tools
    .slice()
    .sort((a, b) => scoreSnapshot[b.slug] - scoreSnapshot[a.slug]);
  const winnerSlug = ranked[0].slug;

  const battleLog = generateBattleLog(tools, scoreSnapshot);

  return {
    mode,
    toolSlugs: allSlugs,
    winnerSlug,
    scoreSnapshot,
    battleLog,
  };
}
