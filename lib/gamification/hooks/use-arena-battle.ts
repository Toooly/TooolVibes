"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createArenaBattle } from "@/lib/gamification/actions";
import type { BattleTool } from "@/lib/gamification/battle-engine";
import type { ArenaBattleMode } from "@/lib/gamification/types";

export function useArenaBattle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mode,
      tools,
    }: {
      mode: ArenaBattleMode;
      tools: BattleTool[];
    }) => createArenaBattle(mode, tools.map((tool) => tool.slug)),
    onSuccess: () => {
      toast.success("Battaglia conclusa");
      queryClient.invalidateQueries({ queryKey: ["game-missions"] });
      queryClient.invalidateQueries({ queryKey: ["game-profile"] });
    },
    onError: () => {
      toast.error("Errore durante la battaglia");
    },
  });
}
