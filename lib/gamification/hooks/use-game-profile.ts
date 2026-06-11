"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import { getOrCreateGameProfile } from "@/lib/gamification/actions";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";

export function useGameProfile() {
  const setProfile = useGameProgressStore((s) => s.setProfile);
  const setPendingLevelUp = useGameProgressStore((s) => s.setPendingLevelUp);
  const profile = useGameProgressStore((s) => s.profile);
  const previousLevelRef = useRef<number | null>(null);

  const query = useQuery({
    queryKey: ["game-profile"],
    queryFn: getOrCreateGameProfile,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      const previousLevel = previousLevelRef.current;
      if (
        previousLevel !== null &&
        query.data.level > previousLevel
      ) {
        setPendingLevelUp(query.data.level);
      }
      previousLevelRef.current = query.data.level;
      setProfile(query.data);
    }
  }, [query.data, setProfile, setPendingLevelUp]);

  return {
    profile,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
