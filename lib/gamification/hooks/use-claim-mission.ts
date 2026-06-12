"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { checkAndAwardBadges, claimMission } from "@/lib/gamification/actions";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import type { GameProfile } from "@/lib/gamification/types";

export function useClaimMission() {
  const queryClient = useQueryClient();
  const setPendingBadge = useGameProgressStore((s) => s.setPendingBadge);

  return useMutation<GameProfile, Error, string>({
    mutationFn: claimMission,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["game-missions"] });
      queryClient.invalidateQueries({ queryKey: ["game-profile"] });

      const awarded = await checkAndAwardBadges();
      if (awarded.length > 0) {
        setPendingBadge(awarded[0].badge);
      }
    },
  });
}
