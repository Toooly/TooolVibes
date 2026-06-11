"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { claimMission } from "@/lib/gamification/actions";
import type { GameProfile } from "@/lib/gamification/types";

export function useClaimMission() {
  const queryClient = useQueryClient();

  return useMutation<GameProfile, Error, string>({
    mutationFn: claimMission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["game-missions"] });
      queryClient.invalidateQueries({ queryKey: ["game-profile"] });
    },
  });
}
