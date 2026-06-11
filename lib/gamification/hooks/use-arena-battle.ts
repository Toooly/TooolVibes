"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { checkAndAwardBadges, createArenaBattle } from "@/lib/gamification/actions";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import type { BattleTool } from "@/lib/gamification/battle-engine";
import type { ArenaBattleMode } from "@/lib/gamification/types";

export function useArenaBattle() {
  const queryClient = useQueryClient();
  const setPendingBadge = useGameProgressStore((s) => s.setPendingBadge);

  return useMutation({
    mutationFn: ({
      mode,
      tools,
    }: {
      mode: ArenaBattleMode;
      tools: BattleTool[];
    }) => createArenaBattle(mode, tools.map((tool) => tool.slug)),
    onSuccess: async () => {
      toast.success("Battaglia conclusa");
      queryClient.invalidateQueries({ queryKey: ["game-missions"] });
      queryClient.invalidateQueries({ queryKey: ["game-profile"] });

      const awarded = await checkAndAwardBadges();
      if (awarded.length > 0) {
        setPendingBadge(awarded[0].badge);
      }
    },
    onError: () => {
      toast.error("Errore durante la battaglia");
    },
  });
}
