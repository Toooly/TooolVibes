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

const VALID_MODES: ArenaBattleMode[] = ["1v1", "royale", "bracket"];

const REASONS: BattleTurn["reason"][] = [
  "votes",
  "trend",
  "comments",
  "completeness",
  "surprise",
];

// Battle score weights
const VOTES_WEIGHT = 0.3;
const TREND_WEIGHT = 0.25;
const COMMENTS_WEIGHT = 0.2;
const COMPLETENESS_WEIGHT = 0.15;
const SURPRISE_WEIGHT = 0.1;

// Surprise factor range
const SURPRISE_MIN = 0.9;
const SURPRISE_MAX = 1.1;

// Score scaling
const SCORE_MULTIPLIER = 1000;

// Battle log generation
const LOG_LENGTH = 5;
const DAMAGE_BASE = 10;
const DAMAGE_DIVISOR = 20;
const DAMAGE_TURN_MULTIPLIER = 2;

// Mode participant counts
const MODE_1V1_COUNT = 2;
const MODE_ROYALE_MIN = 2;
const MODE_ROYALE_MAX = 4;
const MODE_BRACKET_COUNT = 4;

// FNV-1a hash constants
const HASH_OFFSET = 2166136261;
const HASH_PRIME = 16777619;
const HASH_MAX = 4294967296;

export function hashStringToFloat(input: string): number {
  let hash = HASH_OFFSET;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, HASH_PRIME);
  }
  return (hash >>> 0) / HASH_MAX;
}

function computeSurpriseFactor(
  tool: BattleTool,
  allSlugs: string[],
  mode: ArenaBattleMode,
  userId: string,
): number {
  const seed = `${userId}${tool.slug}${allSlugs.join(",")}${mode}`;
  const raw = hashStringToFloat(seed);
  return SURPRISE_MIN + raw * (SURPRISE_MAX - SURPRISE_MIN);
}

function normalize(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  if (range === 0) return values.map(() => 0);
  return values.map((value) => (value - min) / range);
}

function generateBattleLog(
  tools: BattleTool[],
  scoreSnapshot: Record<string, number>,
): BattleTurn[] {
  const slugs = tools.map((tool) => tool.slug);

  return Array.from({ length: LOG_LENGTH }, (_, index) => {
    const turn = index + 1;
    const attacker = slugs[index % slugs.length];
    const defender = slugs[(index + 1) % slugs.length];
    const reason = REASONS[index % REASONS.length];
    const attackerScore = scoreSnapshot[attacker] ?? 0;
    const defenderScore = scoreSnapshot[defender] ?? 0;
    const damage = Math.max(
      1,
      Math.round(
        Math.abs(attackerScore - defenderScore) / DAMAGE_DIVISOR +
          DAMAGE_BASE +
          turn * DAMAGE_TURN_MULTIPLIER,
      ),
    );

    return { turn, attacker, defender, damage, reason };
  });
}

function validateModeAndToolCount(
  mode: ArenaBattleMode,
  toolCount: number,
): void {
  if (!VALID_MODES.includes(mode)) {
    throw new Error(`Invalid mode: ${mode}`);
  }
  if (mode === "1v1" && toolCount !== MODE_1V1_COUNT) {
    throw new Error(`1v1 mode requires exactly ${MODE_1V1_COUNT} tools`);
  }
  if (mode === "royale" && (toolCount < MODE_ROYALE_MIN || toolCount > MODE_ROYALE_MAX)) {
    throw new Error(
      `royale mode requires ${MODE_ROYALE_MIN} to ${MODE_ROYALE_MAX} tools`,
    );
  }
  if (mode === "bracket" && toolCount !== MODE_BRACKET_COUNT) {
    throw new Error(`bracket mode requires exactly ${MODE_BRACKET_COUNT} tools`);
  }
}

export function simulateBattle(
  tools: BattleTool[],
  mode: ArenaBattleMode,
  userId: string,
): BattleResult {
  validateModeAndToolCount(mode, tools.length);

  const allSlugs = tools.map((tool) => tool.slug);
  const uniqueSlugs = new Set(allSlugs);
  if (uniqueSlugs.size !== allSlugs.length) {
    throw new Error("Duplicate tool slugs are not allowed");
  }
  const normalizedVotes = normalize(tools.map((tool) => tool.votes));
  const normalizedTrend7d = normalize(tools.map((tool) => tool.trend7d));
  const normalizedComments = normalize(tools.map((tool) => tool.comments));

  const scoreSnapshot: Record<string, number> = {};

  tools.forEach((tool, index) => {
    const surpriseFactor = computeSurpriseFactor(tool, allSlugs, mode, userId);
    const score =
      (normalizedVotes[index] * VOTES_WEIGHT +
        normalizedTrend7d[index] * TREND_WEIGHT +
        normalizedComments[index] * COMMENTS_WEIGHT +
        tool.completeness * COMPLETENESS_WEIGHT +
        surpriseFactor * SURPRISE_WEIGHT) *
      SCORE_MULTIPLIER;
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
