export const SKILL_LEVEL_KEYS = ["beginner", "intermediate", "expert"] as const;

export type SkillLevelKey = (typeof SKILL_LEVEL_KEYS)[number];

export function isSkillLevelKey(value: string | null | undefined): value is SkillLevelKey {
  return value === "beginner" || value === "intermediate" || value === "expert";
}

export function skillLevelLabel(
  level: string | null | undefined,
  levelLabel: string | null | undefined,
): string | null {
  if (!isSkillLevelKey(level)) return null;
  if (!levelLabel || levelLabel === "In evidenza") return null;
  return levelLabel;
}
