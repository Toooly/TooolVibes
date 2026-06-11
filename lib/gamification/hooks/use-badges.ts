"use client";

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { checkAndAwardBadges } from "@/lib/gamification/actions";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import type { UserBadge } from "@/lib/gamification/types";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";

async function fetchUserBadges(): Promise<UserBadge[]> {
  const supabase = getBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("user_badges")
    .select("*, badge:badges(*)")
    .order("awarded_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as UserBadge[];
}

export function useBadges() {
  const queryClient = useQueryClient();
  const savedSlugs = useToolWorkspaceStore((state) => state.savedSlugs);
  const setBadges = useGameProgressStore((state) => state.setBadges);
  const addBadge = useGameProgressStore((state) => state.addBadge);
  const setPendingBadge = useGameProgressStore((state) => state.setPendingBadge);
  const storeBadges = useGameProgressStore((state) => state.badges);

  const query = useQuery({
    queryKey: ["user-badges"],
    queryFn: fetchUserBadges,
    staleTime: 30_000,
  });

  const badges = query.data ?? storeBadges;

  useEffect(() => {
    if (query.data) setBadges(query.data);
  }, [query.data, setBadges]);

  const checkMutation = useMutation<UserBadge[], Error, void>({
    mutationFn: () => checkAndAwardBadges(savedSlugs.length),
    onSuccess: (awarded) => {
      if (awarded.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["user-badges"] });
        queryClient.invalidateQueries({ queryKey: ["game-profile"] });

        awarded.forEach((userBadge) => {
          addBadge(userBadge);
        });

        setPendingBadge(awarded[0].badge);
      }
    },
  });

  return {
    badges,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    checkBadges: checkMutation.mutateAsync,
    isChecking: checkMutation.isPending,
  };
}
