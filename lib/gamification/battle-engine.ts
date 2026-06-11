import type { ArenaBattleMode, BattleTurn } from "@/lib/gamification/types";

export type BattleInput = {
  mode: ArenaBattleMode;
  toolSlugs: string[];
  scoreSnapshot: Record<string, number>;
};

export type BattleResult = {
  winner_slug: string;
  battle_log: BattleTurn[];
};

const REASONS: BattleTurn["reason"][] = [
  "votes",
  "trend",
  "comments",
  "completeness",
  "surprise",
];

function createSeed(
  toolSlugs: readonly string[],
  scoreSnapshot: Record<string, number>,
): number {
  const parts = toolSlugs
    .slice()
    .sort()
    .map((slug) => `${slug}:${scoreSnapshot[slug] ?? 0}`);
  const str = parts.join("|");
  let hash = 2166136261;
  for (let index = 0; index < str.length; index += 1) {
    hash ^= str.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

type Fighter = {
  slug: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
};

function createFighter(
  slug: string,
  scoreSnapshot: Record<string, number>,
): Fighter {
  const score = scoreSnapshot[slug] ?? 50;
  const maxHp = Math.max(1, Math.round(score * 1.5));
  return {
    slug,
    hp: maxHp,
    maxHp,
    attack: Math.max(1, score),
    defense: Math.max(1, Math.round(score * 0.6)),
  };
}

function calculateDamage(
  attacker: Fighter,
  defender: Fighter,
  rng: () => number,
): number {
  const variance = 0.8 + rng() * 0.4;
  const raw = (attacker.attack - defender.defense * 0.5) * variance;
  return Math.max(1, Math.round(raw));
}

function seedOrder(a: Fighter, b: Fighter): number {
  return b.attack - a.attack || a.slug.localeCompare(b.slug);
}

function runDuel(
  fighters: Fighter[],
  rng: () => number,
  startingTurn: number,
): { log: BattleTurn[]; winner: Fighter } {
  const ordered = fighters.slice().sort(seedOrder);
  const [first, second] = ordered;
  const log: BattleTurn[] = [];
  let turn = startingTurn;

  while (first.hp > 0 && second.hp > 0) {
    const attacker = turn % 2 === 1 ? first : second;
    const defender = attacker === first ? second : first;
    const damage = calculateDamage(attacker, defender, rng);
    defender.hp -= damage;
    log.push({
      turn,
      attacker: attacker.slug,
      defender: defender.slug,
      damage,
      reason: REASONS[(turn - 1) % REASONS.length],
    });
    turn += 1;
  }

  const winner = first.hp > 0 ? first : second;
  return { log, winner };
}

function simulate1v1(fighters: Fighter[], rng: () => number): BattleTurn[] {
  return runDuel(fighters, rng, 1).log;
}

function simulateRoyale(
  fighters: Fighter[],
  rng: () => number,
): BattleTurn[] {
  const log: BattleTurn[] = [];
  let turn = 1;
  let aliveCount = fighters.filter((f) => f.hp > 0).length;

  while (aliveCount > 1) {
    const alive = fighters
      .filter((f) => f.hp > 0)
      .slice()
      .sort(seedOrder);

    for (const attacker of alive) {
      if (attacker.hp <= 0) continue;

      const targets = alive.filter(
        (target) => target.slug !== attacker.slug && target.hp > 0,
      );
      if (targets.length === 0) break;

      const defender = targets
        .slice()
        .sort((a, b) => a.hp - b.hp || a.slug.localeCompare(b.slug))[0];
      const damage = calculateDamage(attacker, defender, rng);
      defender.hp -= damage;
      log.push({
        turn,
        attacker: attacker.slug,
        defender: defender.slug,
        damage,
        reason: REASONS[(turn - 1) % REASONS.length],
      });
      turn += 1;

      aliveCount = fighters.filter((f) => f.hp > 0).length;
      if (aliveCount <= 1) break;
    }
  }

  return log;
}

function simulateBracket(
  fighters: Fighter[],
  rng: () => number,
): BattleTurn[] {
  const log: BattleTurn[] = [];
  let turn = 1;
  let round = fighters.slice().sort(seedOrder);

  while (round.length > 1) {
    const nextRound: Fighter[] = [];

    for (let index = 0; index < round.length; index += 2) {
      if (index + 1 >= round.length) {
        nextRound.push(round[index]);
        continue;
      }

      const a = { ...round[index], hp: round[index].maxHp };
      const b = { ...round[index + 1], hp: round[index + 1].maxHp };
      const { log: duelLog, winner } = runDuel([a, b], rng, turn);
      log.push(...duelLog);
      turn = (duelLog.at(-1)?.turn ?? turn - 1) + 1;
      nextRound.push({ ...winner, hp: winner.maxHp });
    }

    round = nextRound;
  }

  return log;
}

export function simulateBattle(input: BattleInput): BattleResult {
  const { mode, toolSlugs, scoreSnapshot } = input;

  if (toolSlugs.length === 0) {
    throw new Error("At least one tool is required");
  }

  if (mode === "1v1" && toolSlugs.length !== 2) {
    throw new Error("1v1 mode requires exactly 2 tools");
  }

  if (mode !== "1v1" && toolSlugs.length < 2) {
    throw new Error(`${mode} mode requires at least 2 tools`);
  }

  const fighters = toolSlugs.map((slug) => createFighter(slug, scoreSnapshot));
  const rng = mulberry32(createSeed(toolSlugs, scoreSnapshot));

  let log: BattleTurn[];
  switch (mode) {
    case "1v1":
      log = simulate1v1(fighters, rng);
      break;
    case "royale":
      log = simulateRoyale(fighters, rng);
      break;
    case "bracket":
      log = simulateBracket(fighters, rng);
      break;
    default:
      throw new Error(`Unsupported battle mode: ${mode}`);
  }

  const alive = fighters
    .filter((f) => f.hp > 0)
    .sort((a, b) => a.slug.localeCompare(b.slug));
  const winner = alive[0];

  if (!winner) {
    throw new Error("Battle ended without a winner");
  }

  return {
    winner_slug: winner.slug,
    battle_log: log,
  };
}
