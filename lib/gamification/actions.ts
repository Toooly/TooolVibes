"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { GameProfile, RadarPrediction } from "@/lib/gamification/types";

const MAX_XP_DELTA = 10_000;

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

export async function claimHiddenSignal(
  contextDate: string,
  toolSlug: string,
): Promise<GameProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(contextDate)) {
    throw new Error("Invalid contextDate");
  }

  const normalizedSlug = validateToolSlug(toolSlug);

  const { data, error } = await supabase.rpc("claim_hidden_signal", {
    p_user_id: user.id,
    p_context_date: contextDate,
    p_tool_slug: normalizedSlug,
  });

  if (error) throw error;
  if (!data) throw new Error("Profile not found");

  revalidatePath("/");
  return data as GameProfile;
}
