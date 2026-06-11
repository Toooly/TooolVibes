"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { calculateLevel } from "@/lib/gamification/level-utils";
import type { GameProfile } from "@/lib/gamification/types";

export async function getOrCreateGameProfile(): Promise<GameProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("game_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existing) return existing as GameProfile;

  const { data: created, error } = await supabase
    .from("game_profiles")
    .insert({ user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return created as GameProfile;
}

export async function recordGameInteraction(xpDelta: number): Promise<GameProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("game_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const now = new Date().toISOString();
  const lastInteraction = profile.last_interaction_at
    ? new Date(profile.last_interaction_at)
    : null;

  let streakDays = profile.streak_days;
  if (lastInteraction) {
    const hoursSince = (Date.now() - lastInteraction.getTime()) / 36e5;
    if (hoursSince >= 48) streakDays = 1;
    else if (hoursSince >= 24) streakDays += 1;
  } else {
    streakDays = 1;
  }

  const newXp = profile.xp + xpDelta;
  const newLevel = calculateLevel(newXp);

  const { data: updated, error } = await supabase
    .from("game_profiles")
    .update({
      xp: newXp,
      level: newLevel,
      streak_days: streakDays,
      last_interaction_at: now,
      updated_at: now,
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/");
  return updated as GameProfile;
}
