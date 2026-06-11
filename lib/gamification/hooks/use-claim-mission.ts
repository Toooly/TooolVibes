"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { claimMission } from "@/lib/gamification/actions";

export function useClaimMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: claimMission,
    onSuccess: (profile) => {
      toast.success("Ricompensa riscattata", {
        description: `Ora hai ${profile.xp} XP`,
      });
      queryClient.invalidateQueries({ queryKey: ["game-missions"] });
      queryClient.invalidateQueries({ queryKey: ["game-profile"] });
    },
    onError: () => {
      toast.error("Errore", { description: "Non è stato possibile riscattare la ricompensa" });
    },
  });
}
