"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { checkAndAwardBadges, createRadarPrediction } from "@/lib/gamification/actions";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { RadarPrediction } from "@/lib/gamification/types";

async function fetchPrediction(): Promise<RadarPrediction | null> {
  const supabase = getBrowserSupabaseClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("radar_predictions")
    .select("*")
    .eq("context_date", today)
    .maybeSingle();

  if (error) throw error;
  return data as RadarPrediction | null;
}

export function useRadarPrediction() {
  const queryClient = useQueryClient();
  const setPendingBadge = useGameProgressStore((s) => s.setPendingBadge);

  const query = useQuery({
    queryKey: ["radar-prediction"],
    queryFn: fetchPrediction,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: createRadarPrediction,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["radar-prediction"] });
      queryClient.invalidateQueries({ queryKey: ["game-profile"] });

      const awarded = await checkAndAwardBadges();
      if (awarded.length > 0) {
        setPendingBadge(awarded[0].badge);
      }
    },
  });

  return {
    prediction: query.data,
    isLoading: query.isLoading,
    createPrediction: mutation.mutate,
    isCreating: mutation.isPending,
  };
}
