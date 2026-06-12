"use client";

import { useQuery } from "@tanstack/react-query";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";

export type LeaderboardEntry = {
  user_id: string;
  week_start: string;
  xp_gained: number;
  rank: number | null;
};

function getWeekStart(date: Date): string {
  const current = new Date(date);
  const day = current.getUTCDay();
  const diff = current.getUTCDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), diff));
  return monday.toISOString().slice(0, 10);
}

async function fetchLeaderboard(weekStart: string): Promise<LeaderboardEntry[]> {
  const supabase = getBrowserSupabaseClient();

  const { data, error } = await supabase
    .from("leaderboard_snapshots")
    .select("user_id, week_start, xp_gained, rank")
    .eq("week_start", weekStart)
    .order("xp_gained", { ascending: false })
    .limit(10);

  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}

export function useLeaderboard() {
  const weekStart = getWeekStart(new Date());

  return useQuery({
    queryKey: ["leaderboard", weekStart],
    queryFn: () => fetchLeaderboard(weekStart),
    staleTime: 60_000,
  });
}
