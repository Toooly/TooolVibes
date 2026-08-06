import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { calculateLevel } from "@/lib/gamification/level-utils";
import type { Badge, GameMission, GameProfile, UserBadge } from "@/lib/gamification/types";

type GameProgressState = {
  claimedRewards: Record<string, number>;
  totalXp: number;
  profile: GameProfile | null;
  missions: GameMission[];
  badges: UserBadge[];
  pendingBadge: Badge | null;
  pendingLevelUp: number | null;
  setProfile: (profile: GameProfile) => void;
  setMissions: (missions: GameMission[]) => void;
  setBadges: (badges: UserBadge[]) => void;
  addBadge: (badge: UserBadge) => void;
  setPendingBadge: (badge: Badge | null) => void;
  setPendingLevelUp: (level: number | null) => void;
  claimReward: (rewardId: string, xp: number) => { didClaim: boolean; totalXp: number };
};

export const useGameProgressStore = create<GameProgressState>()(
  persist(
    (set, get) => ({
      claimedRewards: {},
      totalXp: 0,
      profile: null,
      missions: [],
      badges: [],
      pendingBadge: null,
      pendingLevelUp: null,
      setProfile: (profile) => set({ profile }),
      setMissions: (missions) => set({ missions }),
      setBadges: (badges) => set({ badges }),
      addBadge: (badge) => set({ badges: [...get().badges, badge] }),
      setPendingBadge: (pendingBadge) => set({ pendingBadge }),
      setPendingLevelUp: (pendingLevelUp) => set({ pendingLevelUp }),
      claimReward: (rewardId, xp) => {
        const current = get();
        if (current.claimedRewards[rewardId] !== undefined) {
          return { didClaim: false, totalXp: current.totalXp };
        }
        const nextTotal = current.totalXp + xp;
        const nextProfile = current.profile
          ? { ...current.profile, xp: nextTotal, level: calculateLevel(nextTotal) }
          : null;
        set((state) => ({
          claimedRewards: { ...state.claimedRewards, [rewardId]: xp },
          totalXp: nextTotal,
          profile: nextProfile,
        }));
        return { didClaim: true, totalXp: nextTotal };
      },
    }),
    {
      name: "tooolvibes-game-progress",
      storage: createJSONStorage(() => localStorage),
      // Celebration/modal triggers are event-driven session state, never persisted.
      partialize: (state) => ({
        claimedRewards: state.claimedRewards,
        totalXp: state.totalXp,
        profile: state.profile,
        missions: state.missions,
        badges: state.badges,
      }),
      version: 3,
      migrate: (persistedState: unknown, version: number) => {
        const state = (persistedState ?? {}) as Record<string, unknown>;
        const base = {
          claimedRewards: (state.claimedRewards as Record<string, number>) ?? {},
          totalXp: (state.totalXp as number) ?? 0,
        };

        if (version === 1) {
          return {
            ...base,
            profile: null,
            missions: [],
            badges: [],
          } as unknown as GameProgressState;
        }

        return {
          ...base,
          profile: (state.profile as GameProfile | null) ?? null,
          missions: (state.missions as GameMission[]) ?? [],
          badges: (state.badges as UserBadge[]) ?? [],
        } as unknown as GameProgressState;
      },
    }
  )
);
