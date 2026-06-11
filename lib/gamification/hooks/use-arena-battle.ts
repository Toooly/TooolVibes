"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { createArenaBattle } from "@/lib/gamification/actions";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { ArenaBattle, ArenaBattleMode } from "@/lib/gamification/types";

async function fetchBattles(): Promise<ArenaBattle[]> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("arena_battles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ArenaBattle[];
}

export function useArenaBattle() {
  const queryClient = useQueryClient();
  const [lastBattle, setLastBattle] = useState<ArenaBattle | null>(null);

  const query = useQuery({
    queryKey: ["arena-battles"],
    queryFn: fetchBattles,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({
      mode,
      toolSlugs,
      scoreSnapshot,
    }: {
      mode: ArenaBattleMode;
      toolSlugs: string[];
      scoreSnapshot: Record<string, number>;
    }) => createArenaBattle(mode, toolSlugs, scoreSnapshot),
    onSuccess: (data) => {
      setLastBattle(data);
      queryClient.invalidateQueries({ queryKey: ["arena-battles"] });
      queryClient.invalidateQueries({ queryKey: ["game-profile"] });
    },
  });

  return {
    battles: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    lastBattle,
    createBattle: mutation.mutate,
    isCreating: mutation.isPending,
    clearLastBattle: () => setLastBattle(null),
  };
}
