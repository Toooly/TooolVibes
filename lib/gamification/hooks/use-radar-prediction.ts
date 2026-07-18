"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { checkAndAwardBadges, createRadarPrediction } from "@/lib/gamification/actions";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import { useGamificationSurface } from "@/lib/gamification/release-context";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import type { RadarPrediction } from "@/lib/gamification/types";
// Modulo puro condiviso con la edge function resolver (B36 / FLOW-606):
// la data contesto è sempre UTC e identica tra client e resolver.
import { getUtcContextDate } from "@/supabase/functions/_shared/radar-prediction-resolver";

async function fetchPrediction(contextDate: string): Promise<RadarPrediction | null> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("radar_predictions")
    .select("*")
    .eq("context_date", contextDate)
    .maybeSingle();

  if (error) throw error;
  return data as RadarPrediction | null;
}

export function useRadarPrediction() {
  const queryClient = useQueryClient();
  const setPendingBadge = useGameProgressStore((s) => s.setPendingBadge);
  // Gate B04: la query resta inattiva con superficie OFF e la mutation è
  // consentita solo in REWARDED (lo stesso assert esiste lato server action).
  const predictionSurface = useGamificationSurface("prediction");
  const contextDate = getUtcContextDate(new Date());

  const query = useQuery({
    queryKey: ["radar-prediction", contextDate],
    queryFn: () => fetchPrediction(contextDate),
    enabled: predictionSurface.surfaceEnabled,
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: createRadarPrediction,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["radar-prediction"] });
      queryClient.invalidateQueries({ queryKey: ["game-profile"] });

      const awarded = await checkAndAwardBadges("prediction");
      if (awarded.length > 0) {
        setPendingBadge(awarded[0].badge);
      }
    },
  });

  const createPrediction = (toolSlug: string) => {
    if (!predictionSurface.persistentRewardsEnabled) return;
    mutation.mutate(toolSlug);
  };

  return {
    prediction: query.data,
    isLoading: predictionSurface.surfaceEnabled && query.isLoading,
    createPrediction,
    isCreating: mutation.isPending,
    contextDate,
  };
}
