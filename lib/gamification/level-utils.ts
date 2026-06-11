export function xpForNextLevel(currentLevel: number): number {
  return 100 + (currentLevel - 1) * 115;
}

export function xpToReachLevel(targetLevel: number): number {
  let total = 0;
  for (let level = 1; level < targetLevel; level += 1) {
    total += xpForNextLevel(level);
  }
  return total;
}

export function calculateLevel(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level += 1;
  }
  return level;
}

export function xpProgressInLevel(totalXp: number): { current: number; needed: number } {
  const level = calculateLevel(totalXp);
  const levelStart = xpToReachLevel(level);
  const needed = xpForNextLevel(level);
  return {
    current: totalXp - levelStart,
    needed,
  };
}
