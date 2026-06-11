"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { getOrCreateGameProfile } from "@/lib/gamification/actions";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";

export function useGameProfile() {
  const setProfile = useGameProgressStore((s) => s.setProfile);
  const profile = useGameProgressStore((s) => s.profile);

  const query = useQuery({
    queryKey: ["game-profile"],
    queryFn: getOrCreateGameProfile,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) setProfile(query.data);
  }, [query.data, setProfile]);

  return {
    profile,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
