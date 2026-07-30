/** Signal Progression V1 level model. Server derives; client displays hub payload only. */

export const SIGNAL_LEVEL_RULES_VERSION = "signal-levels-v1";
export const SIGNAL_LEVEL_MODEL_VERSION = SIGNAL_LEVEL_RULES_VERSION;

export type SignalLevelThreshold = {
  level: number;
  title: string;
  minSp: number;
};

export const SIGNAL_LEVEL_THRESHOLDS: readonly SignalLevelThreshold[] = [
  { level: 1, title: "Esploratore", minSp: 0 },
  { level: 2, title: "Selezionatore", minSp: 150 },
  { level: 3, title: "Curatore", minSp: 400 },
  { level: 4, title: "Stratega", minSp: 900 },
  { level: 5, title: "Cartografo", minSp: 1800 },
];

export type SignalLevelInfo = {
  level: number;
  title: string;
  balance: number;
  nextLevel: number | null;
  nextThreshold: number | null;
  progressInLevel: number;
  currentFloor: number;
};

export function calculateSignalLevel(sp: number): SignalLevelInfo {
  const balance = Math.max(0, Math.floor(Number.isFinite(sp) ? sp : 0));
  let current: SignalLevelThreshold = SIGNAL_LEVEL_THRESHOLDS[0];
  for (const row of SIGNAL_LEVEL_THRESHOLDS) {
    if (balance >= row.minSp) current = row;
  }
  const next =
    SIGNAL_LEVEL_THRESHOLDS.find((r) => r.level === current.level + 1) ?? null;
  if (!next) {
    return {
      level: current.level,
      title: current.title,
      balance,
      nextLevel: null,
      nextThreshold: null,
      progressInLevel: 1,
      currentFloor: current.minSp,
    };
  }
  const span = next.minSp - current.minSp;
  const progress =
    span <= 0 ? 1 : Math.min(1, Math.max(0, (balance - current.minSp) / span));
  return {
    level: current.level,
    title: current.title,
    balance,
    nextLevel: next.level,
    nextThreshold: next.minSp,
    progressInLevel: progress,
    currentFloor: current.minSp,
  };
}

export function signalLevelTitle(level: number): string {
  return (
    SIGNAL_LEVEL_THRESHOLDS.find((r) => r.level === level)?.title ??
    SIGNAL_LEVEL_THRESHOLDS[0].title
  );
}
