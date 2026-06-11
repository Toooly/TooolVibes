"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createArenaBattle } from "@/lib/gamification/actions";
import type { ArenaBattleMode } from "@/lib/gamification/types";

export function useArenaBattle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      mode,
      tools,
    }: {
      mode: ArenaBattleMode;
      tools: { slug: string; votes: number; trend7d: number; comments: number; completeness: number }[];
    }) => createArenaBattle(mode, tools),
    onSuccess: () => {
      toast.success("Battaglia conclusa");
      queryClient.invalidateQueries({ queryKey: ["game-missions"] });
      queryClient.invalidateQueries({ queryKey: ["game-profile"] });
    },
  });
}
