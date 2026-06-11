"use server";

import { revalidatePath } from "next/cache";

import {
  hashStringToFloat,
  simulateBattle,
} from "@/lib/gamification/battle-engine";
import type { BattleTool } from "@/lib/gamification/battle-engine";
import { evaluateBadges } from "@/lib/gamification/badge-rules";
import type {
  ArenaBattle,
  ArenaBattleMode,
  Badge,
  BadgeContext,
  GameProfile,
  RadarPrediction,
  UserBadge,
} from "@/lib/gamification/types";
import { getPublicPublishedToolsFromSupabase } from "@/lib/supabase/tool-repository";
import { createClient } from "@/lib/supabase/server";
import type { ToolRecord } from "@/lib/types/tool";

const MAX_XP_DELTA = 10_000;
const ARENA_BATTLE_XP_REWARD = 40;
const VALID_MODES: ArenaBattleMode[] = ["1v1", "royale", "bracket"];

const MODE_1V1_COUNT = 2;
const MODE_ROYALE_MIN = 2;
const MODE_ROYALE_MAX = 4;
const MODE_BRACKET_COUNT = 4;

function validateArenaBattleInput(
  mode: unknown,
  toolSlugs: unknown,
): { mode: ArenaBattleMode; toolSlugs: string[] } {
  if (typeof mode !== "string" || !VALID_MODES.includes(mode as ArenaBattleMode)) {
    throw new Error(`Invalid mode: ${mode}. Must be one of ${VALID_MODES.join(", ")}`);
  }
  const validatedMode = mode as ArenaBattleMode;

  if (!Array.isArray(toolSlugs)) {
    throw new Error("toolSlugs must be an array");
  }

  const normalizedSlugs = toolSlugs.map((slug) => {
    if (typeof slug !== "string" || !slug.trim()) {
      throw new Error("Each toolSlug must be a non-empty string");
    }
    return slug.trim();
  });

  if (normalizedSlugs.length === 0) {
    throw new Error("toolSlugs must not be empty");
  }

  const uniqueSlugs = new Set(normalizedSlugs);
  if (uniqueSlugs.size !== normalizedSlugs.length) {
    throw new Error("Duplicate toolSlugs are not allowed");
  }

  if (mode === "1v1" && normalizedSlugs.length !== MODE_1V1_COUNT) {
    throw new Error(`1v1 mode requires exactly ${MODE_1V1_COUNT} tools`);
  }
  if (
    mode === "royale" &&
    (normalizedSlugs.length < MODE_ROYALE_MIN || normalizedSlugs.length > MODE_ROYALE_MAX)
  ) {
    throw new Error(
      `royale mode requires ${MODE_ROYALE_MIN} to ${MODE_ROYALE_MAX} tools`,
    );
  }
  if (mode === "bracket" && normalizedSlugs.length !== MODE_BRACKET_COUNT) {
    throw new Error(`bracket mode requires exactly ${MODE_BRACKET_COUNT} tools`);
  }

  return { mode: validatedMode, toolSlugs: normalizedSlugs };
}

function buildBattleTool(tool: ToolRecord): BattleTool {
  // Tool stats are not stored in the database yet, so we derive deterministic
  // canonical values from the slug so battles cannot be manipulated client-side.
  return {
    slug: tool.slug,
    votes: Math.floor(50 + hashStringToFloat(`${tool.slug}:votes`) * 450),
    trend7d: Math.round((-20 + hashStringToFloat(`${tool.slug}:trend`) * 40) * 10) / 10,
    comments: Math.floor(hashStringToFloat(`${tool.slug}:comments`) * 100),
    completeness:
      Math.round((0.5 + hashStringToFloat(`${tool.slug}:completeness`) * 0.5) * 100) / 100,
  };
}

export async function getOrCreateGameProfile(): Promise<GameProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("game_profiles")
    .upsert({ user_id: user.id }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;
  return data as GameProfile;
}

export async function recordGameInteraction(xpDelta: number): Promise<GameProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (
    !Number.isInteger(xpDelta) ||
    xpDelta < 0 ||
    xpDelta > MAX_XP_DELTA
  ) {
    throw new Error(`Invalid xpDelta: ${xpDelta}`);
  }

  const { data, error } = await supabase.rpc("record_game_interaction", {
    p_user_id: user.id,
    p_xp_delta: xpDelta,
  });

  if (error) throw error;
  if (!data) throw new Error("Profile not found");

  revalidatePath("/");
  return data as GameProfile;
}

export async function claimMission(missionId: string): Promise<GameProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase.rpc("claim_mission", {
    p_mission_id: missionId,
    p_user_id: user.id,
  });

  if (error) throw error;
  if (!data) throw new Error("Profile not found");

  revalidatePath("/");
  return data as GameProfile;
}

function validateToolSlug(toolSlug: string): string {
  const normalized = toolSlug.trim();
  if (!normalized || normalized.length > 100) {
    throw new Error("Invalid toolSlug");
  }
  return normalized;
}

export async function createRadarPrediction(toolSlug: string): Promise<RadarPrediction> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const normalizedSlug = validateToolSlug(toolSlug);
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing, error: selectError } = await supabase
    .from("radar_predictions")
    .select("*")
    .eq("user_id", user.id)
    .eq("context_date", today)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return existing as RadarPrediction;

  const { data, error } = await supabase
    .from("radar_predictions")
    .insert({ user_id: user.id, tool_slug: normalizedSlug, context_date: today })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/");
  return data as RadarPrediction;
}

function validateCandidateSlugs(slugs: unknown): string[] {
  if (!Array.isArray(slugs) || slugs.length === 0) {
    throw new Error("candidateSlugs must be a non-empty array");
  }
  return slugs.map((slug) => {
    if (typeof slug !== "string" || !slug.trim()) {
      throw new Error("Each candidateSlug must be a non-empty string");
    }
    return slug.trim();
  });
}

function computeExpectedHiddenSignal(
  contextDate: string,
  candidateSlugs: string[],
): string {
  if (candidateSlugs.length === 0) {
    throw new Error("candidateSlugs must not be empty");
  }
  const index = Math.floor(hashStringToFloat(contextDate) * candidateSlugs.length);
  const expected = candidateSlugs[index];
  if (!expected) {
    throw new Error("Failed to compute expected hidden signal");
  }
  return expected;
}

export async function claimHiddenSignal(
  contextDate: string,
  toolSlug: string,
  candidateSlugs: unknown,
): Promise<GameProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(contextDate)) {
    throw new Error("Invalid contextDate");
  }

  const normalizedSlug = validateToolSlug(toolSlug);
  const normalizedCandidates = validateCandidateSlugs(candidateSlugs);
  const expectedSlug = computeExpectedHiddenSignal(contextDate, normalizedCandidates);

  const { data, error } = await supabase.rpc("claim_hidden_signal", {
    p_user_id: user.id,
    p_context_date: contextDate,
    p_tool_slug: normalizedSlug,
    p_expected_slug: expectedSlug,
  });

  if (error) throw error;
  if (!data) throw new Error("Profile not found");

  revalidatePath("/");
  return data as GameProfile;
}

export async function createArenaBattle(
  rawMode: unknown,
  rawToolSlugs: unknown,
): Promise<ArenaBattle> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { mode, toolSlugs } = validateArenaBattleInput(rawMode, rawToolSlugs);

  const publishedTools = await getPublicPublishedToolsFromSupabase();
  const toolBySlug = new Map(publishedTools.map((tool) => [tool.slug, tool]));

  const tools: BattleTool[] = [];
  for (const slug of toolSlugs) {
    const tool = toolBySlug.get(slug);
    if (!tool) {
      throw new Error(`Tool not found: ${slug}`);
    }
    tools.push(buildBattleTool(tool));
  }

  const result = simulateBattle(tools, mode, user.id);

  const { data, error } = await supabase
    .from("arena_battles")
    .insert({
      user_id: user.id,
      mode,
      tool_slugs: result.toolSlugs,
      winner_slug: result.winnerSlug,
      score_snapshot: result.scoreSnapshot,
      battle_log: result.battleLog,
    })
    .select()
    .single();

  if (error) {
    throw new Error("Failed to save arena battle");
  }

  await recordGameInteraction(ARENA_BATTLE_XP_REWARD);

  return data as ArenaBattle;
}

const MAX_CATEGORY_TAGS = 50;

function validateCategoryTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((tag) => (typeof tag === "string" ? tag.trim() : ""))
    .filter((tag) => tag.length > 0 && tag.length <= 64)
    .slice(0, MAX_CATEGORY_TAGS);
}

export async function discoverTool(
  toolSlug: string,
  categoryTags?: unknown,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const normalizedSlug = validateToolSlug(toolSlug);
  const tags = validateCategoryTags(categoryTags);

  const { data: existing, error: selectError } = await supabase
    .from("tool_collections")
    .select("*")
    .eq("user_id", user.id)
    .eq("tool_slug", normalizedSlug)
    .maybeSingle();

  if (selectError) throw selectError;
  if (existing) return;

  const { error } = await supabase
    .from("tool_collections")
    .insert({ user_id: user.id, tool_slug: normalizedSlug, category_tags: tags });

  if (error) throw error;

  revalidatePath("/");
}

export async function checkAndAwardBadges(): Promise<UserBadge[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const [
    profileResult,
    badgesResult,
    userBadgesResult,
    missionsResult,
    battlesResult,
    predictionsResult,
    collectionResult,
  ] = await Promise.all([
    supabase.from("game_profiles").select("*").eq("user_id", user.id).single(),
    supabase.from("badges").select("*"),
    supabase
      .from("user_badges")
      .select("*, badge:badges(*)")
      .eq("user_id", user.id),
    supabase
      .from("game_mission_claims")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase.from("arena_battles").select("id").eq("user_id", user.id),
    supabase
      .from("radar_predictions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "won"),
    supabase
      .from("tool_collections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (profileResult.error) throw profileResult.error;
  const profile = profileResult.data as GameProfile;

  if (badgesResult.error) throw badgesResult.error;
  const availableBadges = (badgesResult.data ?? []) as Badge[];

  const context: BadgeContext = {
    missions_completed: missionsResult.count ?? 0,
    battles_played: (battlesResult.data ?? []).length,
    predictions_correct: predictionsResult.count ?? 0,
    tools_collected: collectionResult.count ?? 0,
    streak_days: profile.streak_days,
  };

  const userBadges = (userBadgesResult.data ?? []) as UserBadge[];
  const newlyAwardedBadges = evaluateBadges(context, userBadges, availableBadges);

  if (newlyAwardedBadges.length === 0) {
    return [];
  }

  const newBadgeIds = newlyAwardedBadges.map((badge) => badge.id);

  const { data: insertedIds, error: rpcError } = await supabase.rpc(
    "award_badges",
    {
      p_user_id: user.id,
      p_badge_ids: newBadgeIds,
    },
  );

  if (rpcError) throw rpcError;

  const awardedIds = (insertedIds ?? []) as string[];
  if (awardedIds.length === 0) {
    return [];
  }

  const { data: awardedRows, error: selectError } = await supabase
    .from("user_badges")
    .select("*, badge:badges(*)")
    .eq("user_id", user.id)
    .in("badge_id", awardedIds)
    .returns<UserBadge[]>();

  if (selectError) throw selectError;

  const awardedBadges = (awardedRows ?? []) as UserBadge[];
  const totalXp = awardedBadges.reduce((sum, ub) => sum + ub.badge.xp_bonus, 0);
  if (totalXp > 0) {
    await recordGameInteraction(totalXp);
  }

  revalidatePath("/");
  return awardedBadges;
}
