"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import type { GameMission, GameScope } from "@/lib/gamification/types";

async function fetchMissions(scope?: GameScope): Promise<GameMission[]> {
  const supabase = getBrowserSupabaseClient();
  let query = supabase
    .from("game_missions")
    .select("*")
    .order("scope", { ascending: true })
    .order("created_at", { ascending: true });

  if (scope) query = query.eq("scope", scope);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as GameMission[];
}

export function useDailyMissions(scope?: GameScope) {
  const setMissions = useGameProgressStore((s) => s.setMissions);
  const missions = useGameProgressStore((s) => s.missions);

  const query = useQuery({
    queryKey: ["game-missions", scope],
    queryFn: () => fetchMissions(scope),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data) setMissions(query.data);
  }, [query.data, setMissions]);

  const filtered = scope ? missions.filter((m) => m.scope === scope) : missions;

  return {
    missions: filtered,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
