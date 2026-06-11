"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { GameProfile } from "@/lib/gamification/types";

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

  const { data: mission, error: fetchError } = await supabase
    .from("game_missions")
    .select("*")
    .eq("id", missionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !mission) throw new Error("Mission not found");
  if (mission.status !== "completed") throw new Error("Mission not completed");

  const { error: claimError } = await supabase
    .from("game_mission_claims")
    .insert({ user_id: user.id, mission_id: missionId, xp_awarded: mission.xp_reward });

  if (claimError) throw claimError;

  await supabase
    .from("game_missions")
    .update({ status: "claimed" })
    .eq("id", missionId);

  return recordGameInteraction(mission.xp_reward);
}
