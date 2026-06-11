import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Badge, GameMission, GameProfile, UserBadge } from "@/lib/gamification/types";

type GameProgressState = {
  claimedRewards: Record<string, number>;
  totalXp: number;
  profile: GameProfile | null;
  missions: GameMission[];
  badges: UserBadge[];
  pendingBadge: Badge | null;
  setProfile: (profile: GameProfile) => void;
  setMissions: (missions: GameMission[]) => void;
  setBadges: (badges: UserBadge[]) => void;
  addBadge: (badge: UserBadge) => void;
  setPendingBadge: (badge: Badge | null) => void;
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
      setProfile: (profile) => set({ profile }),
      setMissions: (missions) => set({ missions }),
      setBadges: (badges) => set({ badges }),
      addBadge: (badge) => set({ badges: [...get().badges, badge] }),
      setPendingBadge: (pendingBadge) => set({ pendingBadge }),
      claimReward: (rewardId, xp) => {
        const current = get();
        if (current.claimedRewards[rewardId] !== undefined) {
          return { didClaim: false, totalXp: current.totalXp };
        }
        const nextTotal = current.totalXp + xp;
        set((state) => ({
          claimedRewards: { ...state.claimedRewards, [rewardId]: xp },
          totalXp: nextTotal,
        }));
        return { didClaim: true, totalXp: nextTotal };
      },
    }),
    {
      name: "tooolvibes-game-progress",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>;
        return {
          ...state,
          profile: null,
          missions: [],
          badges: [],
          pendingBadge: null,
        };
      },
    }
  )
);
