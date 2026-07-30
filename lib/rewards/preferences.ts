import { z } from "@/lib/validation/zod";

export const REWARD_PREFERENCES_STORAGE_KEY = "tv.reward-prefs.v1";

export const rewardPreferencesSchema = z.object({
  version: z.literal(1),
  reduceRewardAnimations: z.boolean(),
  muteRewardSounds: z.boolean(),
  suppressAutomaticAchievements: z.boolean(),
  quietMode: z.boolean(),
  suppressMajorCelebrations: z.boolean().default(false),
});

export type RewardPreferences = z.infer<typeof rewardPreferencesSchema>;

export const DEFAULT_REWARD_PREFERENCES: RewardPreferences = Object.freeze({
  version: 1,
  reduceRewardAnimations: false,
  muteRewardSounds: false,
  suppressAutomaticAchievements: false,
  quietMode: false,
  suppressMajorCelebrations: false,
});

export function parseRewardPreferences(input: unknown): RewardPreferences {
  const parsed = rewardPreferencesSchema.safeParse(input);
  if (!parsed.success) {
    return { ...DEFAULT_REWARD_PREFERENCES };
  }
  return parsed.data;
}

/** SSR-safe: returns defaults when window/localStorage unavailable. */
export function readRewardPreferences(): RewardPreferences {
  if (typeof window === "undefined") {
    return { ...DEFAULT_REWARD_PREFERENCES };
  }
  try {
    const raw = window.localStorage.getItem(REWARD_PREFERENCES_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_REWARD_PREFERENCES };
    return parseRewardPreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_REWARD_PREFERENCES };
  }
}

export function writeRewardPreferences(
  prefs: RewardPreferences,
): RewardPreferences {
  const next = parseRewardPreferences(prefs);
  if (typeof window === "undefined") return next;
  try {
    window.localStorage.setItem(
      REWARD_PREFERENCES_STORAGE_KEY,
      JSON.stringify(next),
    );
  } catch {
    // quota / private mode — keep in-memory only
  }
  return next;
}

export function mergeRewardPreferences(
  patch: Partial<Omit<RewardPreferences, "version">>,
  current: RewardPreferences = readRewardPreferences(),
): RewardPreferences {
  return writeRewardPreferences({
    ...current,
    ...patch,
    version: 1,
  });
}
