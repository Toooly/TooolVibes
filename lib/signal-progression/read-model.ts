import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin-client";
import {
  type SignalHubMission,
  type SignalProgressHub,
  signalProgressHubSchema,
} from "@/lib/signal-progression/hub-contracts";
import { calculateSignalLevel } from "@/lib/signal-progression/levels";
import {
  SIGNAL_MISSION_RULES_VERSION,
  SIGNAL_ONBOARDING_MISSIONS,
  publicMissionCatalog,
} from "@/lib/signal-progression/missions";
import { SIGNAL_RULES_VERSION } from "@/lib/signal-progression/rules";
import type { SignalFocusArea, SignalPrimaryGoal } from "@/lib/signal-progression/profile-context";

const EXPLANATION =
  "I Signal Points riconoscono lavoro utile nello spazio: salvare, confrontare, decidere, costruire uno stack, rimandare con una data e riprendere. Non premiano click casuali.";

function buildMissions(
  completed: Array<{ missionId: string; completedAt: string }>,
): SignalHubMission[] {
  const done = new Map(
    completed.map((c) => [c.missionId, c.completedAt] as const),
  );
  const catalog = publicMissionCatalog();
  let currentAssigned = false;
  return catalog.map((m) => {
    const at = done.get(m.id) ?? null;
    if (at) {
      return {
        ...m,
        status: "completed" as const,
        completedAt: typeof at === "string" ? at : String(at),
      };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      return { ...m, status: "current" as const, completedAt: null };
    }
    return { ...m, status: "upcoming" as const, completedAt: null };
  });
}

export async function getSignalProgressHub(
  userId: string,
): Promise<SignalProgressHub | null> {
  try {
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("get_signal_progress_hub", {
      p_user_id: userId,
    });
    if (error || !data || typeof data !== "object") return null;

    const raw = data as Record<string, unknown>;
    const levelInfo = calculateSignalLevel(Number(raw.balance ?? 0));

    const completedRaw = Array.isArray(raw.completedMissions)
      ? (raw.completedMissions as Array<Record<string, unknown>>)
      : [];
    const completed = completedRaw.map((c) => ({
      missionId: String(c.missionId ?? ""),
      completedAt: String(c.completedAt ?? ""),
    }));

    const recentRaw = Array.isArray(raw.recentGrants)
      ? (raw.recentGrants as Array<Record<string, unknown>>)
      : [];
    const recentGrants = recentRaw.map((g) => ({
      grantId: String(g.grantId ?? ""),
      code: String(g.code ?? ""),
      title: String(g.title ?? ""),
      description: String(g.description ?? ""),
      tier: String(g.tier ?? "micro"),
      displayDelta: Number(g.displayDelta ?? 0),
      createdAt:
        typeof g.createdAt === "string"
          ? g.createdAt
          : new Date(String(g.createdAt ?? Date.now())).toISOString(),
    }));

    const badgeRaw = Array.isArray(raw.earnedBadgeCodes)
      ? (raw.earnedBadgeCodes as unknown[])
      : [];

    const badgesRaw = Array.isArray(raw.badges)
      ? (raw.badges as Array<Record<string, unknown>>)
      : [];
    const badges = badgesRaw.map((b) => ({
      code: String(b.code ?? ""),
      title: String(b.title ?? ""),
      description: String(b.description ?? ""),
      a11yDescription: String(b.a11yDescription ?? b.description ?? ""),
      iconId: String(b.iconId ?? "Bookmark"),
      rarity: (["common", "uncommon", "rare"].includes(String(b.rarity))
        ? String(b.rarity)
        : "common") as "common" | "uncommon" | "rare",
      visualIntensity: (["quiet", "standard", "elevated"].includes(
        String(b.visualIntensity),
      )
        ? String(b.visualIntensity)
        : "standard") as "quiet" | "standard" | "elevated",
      sortOrder: Number(b.sortOrder ?? 100),
      earnedAt:
        typeof b.earnedAt === "string"
          ? b.earnedAt
          : new Date(String(b.earnedAt ?? Date.now())).toISOString(),
    }));

    const progressRaw = raw.achievementProgress as Record<
      string,
      unknown
    > | null;

    const prefsRaw = raw.preferences as Record<string, unknown> | null;
    const ctxRaw = raw.profileContext as Record<string, unknown> | null;

    const hub: SignalProgressHub = {
      balance: levelInfo.balance,
      level: levelInfo.level,
      levelTitle: levelInfo.title,
      nextLevel: levelInfo.nextLevel,
      nextThreshold: levelInfo.nextThreshold,
      progressInLevel: levelInfo.progressInLevel,
      explanation: EXPLANATION,
      missions: buildMissions(completed),
      recentGrants,
      earnedBadgeCodes: badgeRaw.map(String).filter(Boolean),
      badges,
      achievementProgress: progressRaw
        ? {
            savedCount: Number(progressRaw.savedCount ?? 0),
            comparisonCount: Number(progressRaw.comparisonCount ?? 0),
            radarDays: Number(progressRaw.radarDays ?? 0),
            collectionJourneysCompleted: Number(
              progressRaw.collectionJourneysCompleted ?? 0,
            ),
            profileComplete: Boolean(progressRaw.profileComplete),
            level: Number(progressRaw.level ?? 1),
          }
        : null,
      profileContextComplete: Boolean(raw.profileContextComplete),
      profileContext: ctxRaw
        ? {
            focusArea: ctxRaw.focusArea as SignalFocusArea,
            primaryGoal: ctxRaw.primaryGoal as SignalPrimaryGoal,
            completedAt:
              ctxRaw.completedAt == null
                ? null
                : String(ctxRaw.completedAt),
          }
        : null,
      preferences: prefsRaw
        ? {
            reduceRewardAnimations: Boolean(prefsRaw.reduceRewardAnimations),
            muteRewardSounds: Boolean(prefsRaw.muteRewardSounds),
            quietMode: Boolean(prefsRaw.quietMode),
            suppressAutomaticAchievements: Boolean(
              prefsRaw.suppressAutomaticAchievements,
            ),
            suppressMajorCelebrations: Boolean(
              prefsRaw.suppressMajorCelebrations,
            ),
          }
        : null,
      rulesVersion: `${SIGNAL_RULES_VERSION}+${SIGNAL_MISSION_RULES_VERSION}`,
    };

    const parsed = signalProgressHubSchema.safeParse(hub);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export { SIGNAL_ONBOARDING_MISSIONS };
