import { z } from "@/lib/validation/zod";
import { SIGNAL_FOCUS_AREAS, SIGNAL_PRIMARY_GOALS } from "@/lib/signal-progression/profile-context";

export const signalHubMissionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  order: z.number().int(),
  rewardSp: z.number().int().nonnegative(),
  status: z.enum(["completed", "current", "upcoming"]),
  completedAt: z.string().nullable(),
});

export const signalHubGrantSchema = z.object({
  grantId: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  tier: z.string(),
  displayDelta: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export const signalHubPreferencesSchema = z.object({
  reduceRewardAnimations: z.boolean(),
  muteRewardSounds: z.boolean(),
  quietMode: z.boolean(),
  suppressAutomaticAchievements: z.boolean(),
});

export const signalProgressHubSchema = z.object({
  balance: z.number().int().nonnegative(),
  level: z.number().int().min(1).max(5),
  levelTitle: z.string(),
  nextLevel: z.number().int().nullable(),
  nextThreshold: z.number().int().nullable(),
  progressInLevel: z.number().min(0).max(1),
  explanation: z.string(),
  missions: z.array(signalHubMissionSchema),
  recentGrants: z.array(signalHubGrantSchema),
  earnedBadgeCodes: z.array(z.string()),
  profileContextComplete: z.boolean(),
  profileContext: z
    .object({
      focusArea: z.enum(SIGNAL_FOCUS_AREAS),
      primaryGoal: z.enum(SIGNAL_PRIMARY_GOALS),
      completedAt: z.string().nullable(),
    })
    .nullable(),
  preferences: signalHubPreferencesSchema.nullable(),
  rulesVersion: z.string(),
});

export type SignalProgressHub = z.infer<typeof signalProgressHubSchema>;
export type SignalHubMission = z.infer<typeof signalHubMissionSchema>;
