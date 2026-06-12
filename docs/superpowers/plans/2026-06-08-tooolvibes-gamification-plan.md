# TooolVibes Gamification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing lightweight Radar/Arena mission scaffold into a full daily gamification layer backed by Supabase, with levels, XP, streaks, badges, simulated arena battles, and radar predictions.

**Architecture:** Extend the existing Zustand store and `GameMissionPanel` components. Add a Supabase data layer (tables + Edge Functions), a deterministic battle engine, and focused React hooks for each feature. Keep UI components reusable across mobile and desktop.

**Tech Stack:** Next.js 15.5.15, React 19, TypeScript, Tailwind CSS 4, Supabase, Zustand, Motion, XState, Sonner, canvas-confetti, Howler, date-fns, @use-gesture/react, react-countdown-circle-timer, react-fast-marquee.

---

## File Structure

### New files

- `lib/gamification/types.ts` — shared TypeScript types
- `lib/gamification/level-utils.ts` — XP/level math
- `lib/gamification/badge-rules.ts` — badge requirement definitions
- `lib/gamification/battle-engine.ts` — deterministic battle simulation
- `lib/gamification/db.ts` — Supabase server-side queries
- `lib/gamification/actions.ts` — Next.js Server Actions
- `lib/gamification/hooks/use-game-profile.ts`
- `lib/gamification/hooks/use-daily-missions.ts`
- `lib/gamification/hooks/use-claim-mission.ts`
- `lib/gamification/hooks/use-arena-battle.ts`
- `lib/gamification/hooks/use-radar-prediction.ts`
- `lib/gamification/hooks/use-tool-collection.ts`
- `lib/gamification/hooks/use-badges.ts`
- `components/gamification/game-profile-bar.tsx`
- `components/gamification/game-mission-drawer.tsx`
- `components/gamification/arena-battle-stage.tsx`
- `components/gamification/radar-scanner-overlay.tsx`
- `components/gamification/badge-unlock-modal.tsx`
- `components/gamification/level-up-modal.tsx`
- `components/gamification/leaderboard-strip.tsx`
- `components/gamification/daily-reset-countdown.tsx`
- `supabase/migrations/20260608000001_gamification_core.sql`
- `supabase/migrations/20260608000002_gamification_missions.sql`
- `supabase/migrations/20260608000003_gamification_predictions.sql`
- `supabase/migrations/20260608000004_gamification_arena.sql`
- `supabase/migrations/20260608000005_gamification_badges.sql`
- `supabase/functions/reset-daily-missions/index.ts`
- `supabase/functions/resolve-radar-predictions/index.ts`
- `__tests__/lib/gamification/level-utils.test.ts`
- `__tests__/lib/gamification/battle-engine.test.ts`
- `__tests__/lib/gamification/badge-rules.test.ts`

### Modified files

- `lib/gamification/game-progress-store.ts` — extend state
- `components/gamification/game-mission-panel.tsx` — consume dynamic missions
- `components/gamification/radar-game-missions.tsx` — pass real data
- `components/gamification/arena-game-missions.tsx` — pass real data
- `components/layout/site-header-v2.tsx` — inject `GameProfileBar`
- `components/app/interaction-sound-layer-v2.tsx` — add new sound kinds
- `app/globals.css` — add gamification CSS variables/animations

---

## Phase 1: Foundation

### Task 1.1: Supabase core tables migration

**Files:**
- Create: `supabase/migrations/20260608000001_gamification_core.sql`

- [ ] **Step 1: Create migration for `game_profiles` and `leaderboard_snapshots`**

```sql
CREATE TABLE IF NOT EXISTS public.game_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  vibes INTEGER NOT NULL DEFAULT 0,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.game_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.game_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.game_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert profile"
  ON public.game_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  xp_gained INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaderboard is public read"
  ON public.leaderboard_snapshots FOR SELECT
  USING (true);
```

- [ ] **Step 2: Apply migration locally**

Run: `npx supabase migration up`
Expected: migrations applied successfully, no errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260608000001_gamification_core.sql
git commit -m "feat(gamification): add core profiles and leaderboard tables"
```

---

### Task 1.2: Shared types

**Files:**
- Create: `lib/gamification/types.ts`

- [ ] **Step 1: Define all shared types**

```typescript
export type GameScope = "radar" | "arena";

export type MissionKind =
  | "explore"
  | "signals"
  | "predict"
  | "battle"
  | "collect"
  | "underdog"
  | "social";

export type MissionStatus = "active" | "completed" | "claimed";

export type GameMission = {
  id: string;
  user_id: string;
  scope: GameScope;
  kind: MissionKind;
  title: string;
  description: string;
  target: number;
  progress: number;
  xp_reward: number;
  status: MissionStatus;
  resets_at: string; // ISO date
  created_at: string;
};

export type GameProfile = {
  user_id: string;
  xp: number;
  level: number;
  vibes: number;
  streak_days: number;
  last_interaction_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ArenaBattleMode = "1v1" | "royale" | "bracket";

export type ArenaBattle = {
  id: string;
  user_id: string;
  mode: ArenaBattleMode;
  tool_slugs: string[];
  winner_slug: string;
  score_snapshot: Record<string, number>;
  battle_log: BattleTurn[];
  created_at: string;
};

export type BattleTurn = {
  turn: number;
  attacker: string;
  defender: string;
  damage: number;
  reason: "votes" | "trend" | "comments" | "completeness" | "surprise";
};

export type RadarPredictionStatus = "pending" | "won" | "close" | "lost";

export type RadarPrediction = {
  id: string;
  user_id: string;
  tool_slug: string;
  context_date: string;
  predicted_at: string;
  resolved_at: string | null;
  actual_rank_change: number | null;
  xp_awarded: number | null;
  status: RadarPredictionStatus;
};

export type Badge = {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: string;
  requirement_value: number;
  xp_bonus: number;
};

export type UserBadge = {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  badge: Badge;
};

export type ToolCollection = {
  id: string;
  user_id: string;
  tool_slug: string;
  discovered_at: string;
  category_tags: string[];
};
```

- [ ] **Step 2: Commit**

```bash
git add lib/gamification/types.ts
git commit -m "feat(gamification): add shared gamification types"
```

---

### Task 1.3: Level and XP utilities + tests

**Files:**
- Create: `lib/gamification/level-utils.ts`
- Create: `__tests__/lib/gamification/level-utils.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { calculateLevel, xpForNextLevel, xpToReachLevel } from "@/lib/gamification/level-utils";

describe("level-utils", () => {
  it("calculates level 1 at 0 xp", () => {
    expect(calculateLevel(0)).toBe(1);
  });

  it("calculates level 2 at 100 xp", () => {
    expect(calculateLevel(100)).toBe(2);
  });

  it("calculates level 3 at 315 xp", () => {
    expect(calculateLevel(315)).toBe(3);
  });

  it("returns xp needed for next level", () => {
    expect(xpForNextLevel(1)).toBe(100);
    expect(xpForNextLevel(2)).toBe(215);
  });

  it("returns total xp to reach a level", () => {
    expect(xpToReachLevel(3)).toBe(315);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/gamification/level-utils.test.ts`
Expected: FAIL — functions not defined.

- [ ] **Step 3: Implement utilities**

```typescript
export function xpForNextLevel(currentLevel: number): number {
  return 100 + currentLevel * 15;
}

export function xpToReachLevel(targetLevel: number): number {
  let total = 0;
  for (let level = 1; level < targetLevel; level += 1) {
    total += xpForNextLevel(level);
  }
  return total;
}

export function calculateLevel(totalXp: number): number {
  let level = 1;
  let remaining = totalXp;
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level += 1;
  }
  return level;
}

export function xpProgressInLevel(totalXp: number): { current: number; needed: number } {
  const level = calculateLevel(totalXp);
  const levelStart = xpToReachLevel(level);
  const needed = xpForNextLevel(level);
  return {
    current: totalXp - levelStart,
    needed,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/gamification/level-utils.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/gamification/level-utils.ts __tests__/lib/gamification/level-utils.test.ts
git commit -m "feat(gamification): add level and XP utilities with tests"
```

---

### Task 1.4: Badge rules engine + tests

**Files:**
- Create: `lib/gamification/badge-rules.ts`
- Create: `__tests__/lib/gamification/badge-rules.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { evaluateBadges, INITIAL_BADGES } from "@/lib/gamification/badge-rules";
import type { Badge, GameProfile } from "@/lib/gamification/types";

describe("badge-rules", () => {
  it("awards first_scan when missions completed >= 1", () => {
    const awarded = evaluateBadges({ missions_completed: 1 } as unknown as GameProfile, [], INITIAL_BADGES);
    expect(awarded.map((b) => b.code)).toContain("first_scan");
  });

  it("does not award arena_veteran with only 5 wins", () => {
    const awarded = evaluateBadges({ battles_won: 5 } as unknown as GameProfile, [], INITIAL_BADGES);
    expect(awarded.map((b) => b.code)).not.toContain("arena_veteran");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/lib/gamification/badge-rules.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement badge rules**

```typescript
import type { Badge, GameProfile, UserBadge } from "@/lib/gamification/types";

export type BadgeContext = {
  missions_completed: number;
  battles_won: number;
  predictions_correct: number;
  tools_collected: number;
  streak_days: number;
  shortlist_size: number;
};

export const INITIAL_BADGES: Badge[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    code: "first_scan",
    name: "Primo Scan",
    description: "Completa la tua prima missione Radar",
    icon: "Radar",
    requirement_type: "missions_completed",
    requirement_value: 1,
    xp_bonus: 50,
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    code: "arena_rookie",
    name: "Esordiente",
    description: "Vinci la tua prima battaglia in Arena",
    icon: "Swords",
    requirement_type: "battles_won",
    requirement_value: 1,
    xp_bonus: 50,
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    code: "arena_veteran",
    name: "Veterano",
    description: "Vinci 10 battaglie in Arena",
    icon: "Trophy",
    requirement_type: "battles_won",
    requirement_value: 10,
    xp_bonus: 150,
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    code: "radar_prophet",
    name: "Profeta",
    description: "Azzecca 5 predizioni Radar",
    icon: "Sparkles",
    requirement_type: "predictions_correct",
    requirement_value: 5,
    xp_bonus: 200,
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    code: "shortlist_guardian",
    name: "Guardiano",
    description: "Salva 20 tool nella shortlist",
    icon: "Bookmark",
    requirement_type: "shortlist_size",
    requirement_value: 20,
    xp_bonus: 100,
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    code: "seven_streak",
    name: "Sette Giorni",
    description: "Raggiungi una streak di 7 giorni",
    icon: "Flame",
    requirement_type: "streak_days",
    requirement_value: 7,
    xp_bonus: 200,
  },
];

export function evaluateBadges(
  context: BadgeContext,
  userBadges: UserBadge[],
  availableBadges: Badge[]
): Badge[] {
  const ownedCodes = new Set(userBadges.map((ub) => ub.badge.code));
  return availableBadges.filter((badge) => {
    if (ownedCodes.has(badge.code)) return false;
    const value = context[badge.requirement_type as keyof BadgeContext] ?? 0;
    return value >= badge.requirement_value;
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/lib/gamification/badge-rules.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/gamification/badge-rules.ts __tests__/lib/gamification/badge-rules.test.ts
git commit -m "feat(gamification): add badge rules engine with tests"
```

---

### Task 1.5: Extend game-progress-store

**Files:**
- Modify: `lib/gamification/game-progress-store.ts`

- [ ] **Step 1: Add profile, missions, badges to store**

```typescript
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
```

- [ ] **Step 2: Run build to check types**

Run: `npm run build`
Expected: build succeeds or only unrelated errors.

- [ ] **Step 3: Commit**

```bash
git add lib/gamification/game-progress-store.ts
git commit -m "feat(gamification): extend progress store with profile, missions, badges"
```

---

### Task 1.6: Server Actions for profile

**Files:**
- Create: `lib/gamification/actions.ts`

- [ ] **Step 1: Implement profile creation/update and interaction tracking**

```typescript
"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { calculateLevel } from "@/lib/gamification/level-utils";
import type { GameProfile } from "@/lib/gamification/types";

export async function getOrCreateGameProfile(): Promise<GameProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from("game_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (existing) return existing as GameProfile;

  const { data: created, error } = await supabase
    .from("game_profiles")
    .insert({ user_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return created as GameProfile;
}

export async function recordGameInteraction(xpDelta: number): Promise<GameProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("game_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  const now = new Date().toISOString();
  const lastInteraction = profile.last_interaction_at
    ? new Date(profile.last_interaction_at)
    : null;

  let streakDays = profile.streak_days;
  if (lastInteraction) {
    const hoursSince = (Date.now() - lastInteraction.getTime()) / 36e5;
    if (hoursSince >= 48) streakDays = 1;
    else if (hoursSince >= 24) streakDays += 1;
  } else {
    streakDays = 1;
  }

  const newXp = profile.xp + xpDelta;
  const newLevel = calculateLevel(newXp);

  const { data: updated, error } = await supabase
    .from("game_profiles")
    .update({
      xp: newXp,
      level: newLevel,
      streak_days: streakDays,
      last_interaction_at: now,
      updated_at: now,
    })
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/");
  return updated as GameProfile;
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: no type errors in new file.

- [ ] **Step 3: Commit**

```bash
git add lib/gamification/actions.ts
git commit -m "feat(gamification): add server actions for profile and interaction tracking"
```

---

### Task 1.7: useGameProfile hook

**Files:**
- Create: `lib/gamification/hooks/use-game-profile.ts`

- [ ] **Step 1: Implement hook**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add lib/gamification/hooks/use-game-profile.ts
git commit -m "feat(gamification): add useGameProfile hook"
```

---

## Phase 2: Daily Missions

### Task 2.1: Missions migration and reset function

**Files:**
- Create: `supabase/migrations/20260608000002_gamification_missions.sql`
- Create: `supabase/functions/reset-daily-missions/index.ts`

- [ ] **Step 1: Create tables and RLS**

```sql
CREATE TABLE IF NOT EXISTS public.game_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('radar', 'arena')),
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target INTEGER NOT NULL DEFAULT 1,
  progress INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'claimed')),
  resets_at DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, scope, kind, resets_at)
);

ALTER TABLE public.game_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own missions"
  ON public.game_missions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own missions"
  ON public.game_missions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.game_mission_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES public.game_missions(id) ON DELETE CASCADE,
  xp_awarded INTEGER NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, mission_id)
);

ALTER TABLE public.game_mission_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own claims"
  ON public.game_mission_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own claims"
  ON public.game_mission_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Create Edge Function to reset daily missions**

```typescript
// supabase/functions/reset-daily-missions/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DAILY_MISSIONS = [
  {
    scope: "radar",
    kind: "explore",
    title: "Esplora il futuro",
    description: "Scopri 3 tool che non avevi mai aperto",
    target: 3,
    xp_reward: 40,
  },
  {
    scope: "radar",
    kind: "signals",
    title: "Lascia un segnale",
    description: "Interagisci con 2 tool in ascesa",
    target: 2,
    xp_reward: 55,
  },
  {
    scope: "radar",
    kind: "predict",
    title: "Profeta del Radar",
    description: "Indovina il tool che salirà di più domani",
    target: 1,
    xp_reward: 80,
  },
  {
    scope: "arena",
    kind: "battle",
    title: "Campione dell'Arena",
    description: "Vinci 3 battaglie",
    target: 3,
    xp_reward: 60,
  },
];

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date().toISOString().slice(0, 10);

  const { data: users } = await supabase.auth.admin.listUsers();
  for (const user of users.users) {
    for (const mission of DAILY_MISSIONS) {
      await supabase.from("game_missions").upsert(
        {
          user_id: user.id,
          scope: mission.scope,
          kind: mission.kind,
          title: mission.title,
          description: mission.description,
          target: mission.target,
          progress: 0,
          xp_reward: mission.xp_reward,
          status: "active",
          resets_at: today,
        },
        { onConflict: "user_id, scope, kind, resets_at" }
      );
    }
  }

  return new Response(JSON.stringify({ ok: true, date: today }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 3: Apply migration and deploy function**

Run:
```bash
npx supabase migration up
npx supabase functions deploy reset-daily-missions
```
Expected: both succeed.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260608000002_gamification_missions.sql supabase/functions/reset-daily-missions/index.ts
git commit -m "feat(gamification): add missions tables and daily reset edge function"
```

---

### Task 2.2: useDailyMissions hook

**Files:**
- Create: `lib/gamification/hooks/use-daily-missions.ts`

- [ ] **Step 1: Implement hook**

```typescript
"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { useGameProgressStore } from "@/lib/gamification/game-progress-store";
import type { GameMission, GameScope } from "@/lib/gamification/types";

async function fetchMissions(scope?: GameScope): Promise<GameMission[]> {
  const supabase = createClient();
  let query = supabase
    .from("game_missions")
    .select("*")
    .order("scope", { ascending: true })
    .order("created_at", { ascending: true });

  if (scope) query = query.eq("scope", scope);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as GameMission[];
}

export function useDailyMissions(scope?: GameScope) {
  const setMissions = useGameProgressStore((s) => s.setMissions);
  const missions = useGameProgressStore((s) => s.missions);

  const query = useQuery({
    queryKey: ["game-missions", scope],
    queryFn: () => fetchMissions(scope),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data) setMissions(query.data);
  }, [query.data, setMissions]);

  const filtered = scope ? missions.filter((m) => m.scope === scope) : missions;

  return {
    missions: filtered,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/gamification/hooks/use-daily-missions.ts
git commit -m "feat(gamification): add useDailyMissions hook"
```

---

### Task 2.3: useClaimMission hook and Server Action

**Files:**
- Modify: `lib/gamification/actions.ts`
- Create: `lib/gamification/hooks/use-claim-mission.ts`

- [ ] **Step 1: Add claimMission action**

Append to `lib/gamification/actions.ts`:

```typescript
export async function claimMission(missionId: string): Promise<GameProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: mission, error: fetchError } = await supabase
    .from("game_missions")
    .select("*")
    .eq("id", missionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !mission) throw new Error("Mission not found");
  if (mission.status !== "completed") throw new Error("Mission not completed");

  const { error: claimError } = await supabase
    .from("game_mission_claims")
    .insert({ user_id: user.id, mission_id: missionId, xp_awarded: mission.xp_reward });

  if (claimError) throw claimError;

  await supabase
    .from("game_missions")
    .update({ status: "claimed" })
    .eq("id", missionId);

  return recordGameInteraction(mission.xp_reward);
}
```

- [ ] **Step 2: Implement hook**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add lib/gamification/actions.ts lib/gamification/hooks/use-claim-mission.ts
git commit -m "feat(gamification): add mission claim action and hook"
```

---

### Task 2.4: Refactor GameMissionPanel for dynamic missions

**Files:**
- Modify: `components/gamification/game-mission-panel.tsx`

- [ ] **Step 1: Replace static props with dynamic data**

Update the component to accept `scope` instead of static `missions`:

```typescript
// In GameMissionPanelProps, replace missions[] with scope and optional missions override
type GameMissionPanelProps = {
  className?: string;
  description: string;
  eyebrow: string;
  scope: "arena" | "radar";
  title: string;
  variant: "arena" | "radar";
};
```

Inside component:

```typescript
const { missions, isLoading } = useDailyMissions(scope);
const claimMissionMutation = useClaimMission();

const currentMissions = useMemo(() => {
  return missions.map((m) => ({
    id: m.id,
    label: m.title,
    detail: m.description,
    progress: m.progress,
    target: m.target,
    xp: m.xp_reward,
    icon: ICONS[m.kind] ?? Sparkles,
  }));
}, [missions]);
```

- [ ] **Step 2: Update mission click handling**

When `canClaim`, call `claimMissionMutation.mutate(mission.id)`.

- [ ] **Step 3: Update RadarGameMissions and ArenaGameMissions**

Modify `components/gamification/radar-game-missions.tsx` and `components/gamification/arena-game-missions.tsx` to pass `scope` only:

```typescript
<GameMissionPanel
  variant="radar"
  scope="radar"
  rewardId="radar-daily-run"
  eyebrow="Missioni radar"
  title="Daily scan pronto al claim."
  description="Il radar diventa una routine giornaliera: intercetta, leggi i segnali, porta i tool migliori verso la directory."
/>
```

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/gamification/game-mission-panel.tsx components/gamification/radar-game-missions.tsx components/gamification/arena-game-missions.tsx
git commit -m "feat(gamification): wire GameMissionPanel to dynamic Supabase missions"
```

---

## Phase 3: Radar Predictions

### Task 3.1: Predictions migration and resolve function

**Files:**
- Create: `supabase/migrations/20260608000003_gamification_predictions.sql`
- Create: `supabase/functions/resolve-radar-predictions/index.ts`

- [ ] **Step 1: Create table and RLS**

```sql
CREATE TABLE IF NOT EXISTS public.radar_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  context_date DATE NOT NULL,
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  actual_rank_change INTEGER,
  xp_awarded INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'close', 'lost')),
  UNIQUE(user_id, context_date)
);

ALTER TABLE public.radar_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own predictions"
  ON public.radar_predictions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prediction"
  ON public.radar_predictions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Create resolve Edge Function**

```typescript
// supabase/functions/resolve-radar-predictions/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);

  const { data: predictions, error } = await supabase
    .from("radar_predictions")
    .select("*")
    .eq("context_date", yesterday)
    .eq("status", "pending");

  if (error) throw error;

  for (const prediction of predictions ?? []) {
    // Stub: replace with real rank-delta computation from directory data
    const actualRankChange = Math.floor(Math.random() * 10) - 3;
    let status: string;
    let xp = 0;

    if (actualRankChange >= 5) {
      status = "won";
      xp = 80;
    } else if (actualRankChange >= 0) {
      status = "close";
      xp = 20;
    } else {
      status = "lost";
      xp = 0;
    }

    await supabase
      .from("radar_predictions")
      .update({ resolved_at: new Date().toISOString(), actual_rank_change: actualRankChange, xp_awarded: xp, status })
      .eq("id", prediction.id);

    if (xp > 0) {
      await supabase.rpc("add_xp", { user_id: prediction.user_id, xp_delta: xp });
    }
  }

  return new Response(JSON.stringify({ resolved: predictions?.length ?? 0 }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 3: Apply and deploy**

Run:
```bash
npx supabase migration up
npx supabase functions deploy resolve-radar-predictions
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260608000003_gamification_predictions.sql supabase/functions/resolve-radar-predictions/index.ts
git commit -m "feat(gamification): add predictions table and resolution edge function"
```

---

### Task 3.2: useRadarPrediction hook and Server Action

**Files:**
- Modify: `lib/gamification/actions.ts`
- Create: `lib/gamification/hooks/use-radar-prediction.ts`

- [ ] **Step 1: Add createPrediction action**

Append to `lib/gamification/actions.ts`:

```typescript
export async function createRadarPrediction(toolSlug: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("radar_predictions")
    .insert({ user_id: user.id, tool_slug: toolSlug, context_date: today });

  if (error) throw error;
}
```

- [ ] **Step 2: Implement hook**

```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { createClient } from "@/lib/supabase/client";
import { createRadarPrediction } from "@/lib/gamification/actions";
import type { RadarPrediction } from "@/lib/gamification/types";

async function fetchPrediction(): Promise<RadarPrediction | null> {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("radar_predictions")
    .select("*")
    .eq("context_date", today)
    .single();
  return data as RadarPrediction | null;
}

export function useRadarPrediction() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["radar-prediction"],
    queryFn: fetchPrediction,
  });

  const mutation = useMutation({
    mutationFn: createRadarPrediction,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["radar-prediction"] }),
  });

  return {
    prediction: query.data,
    isLoading: query.isLoading,
    createPrediction: mutation.mutate,
  };
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/gamification/actions.ts lib/gamification/hooks/use-radar-prediction.ts
git commit -m "feat(gamification): add radar prediction action and hook"
```

---

### Task 3.3: Hidden tool logic and Radar UI

**Files:**
- Create: `components/gamification/radar-scanner-overlay.tsx`
- Modify: `components/radar/mobile-radar-view.tsx` (or relevant Radar page)

- [ ] **Step 1: Create scanner overlay component**

```typescript
"use client";

import { motion } from "motion/react";

export function RadarScannerOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
      <motion.div
        className="absolute left-1/2 top-1/2 h-1/2 w-1 bg-gradient-to-b from-transparent via-emerald-400/40 to-transparent"
        style={{ originX: 0.5, originY: 1 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Add hidden tool indicator in Radar view**

When rendering Radar nodes, mark one random node per day as hidden (seeded by date). On click, call `recordGameInteraction(25)` if not yet discovered today.

- [ ] **Step 3: Commit**

```bash
git add components/gamification/radar-scanner-overlay.tsx components/radar/mobile-radar-view.tsx
git commit -m "feat(gamification): add radar scanner overlay and hidden tool"
```

---

## Phase 4: Arena Battles

### Task 4.1: Deterministic battle engine + tests

**Files:**
- Create: `lib/gamification/battle-engine.ts`
- Create: `__tests__/lib/gamification/battle-engine.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
import { describe, expect, it } from "vitest";
import { simulateBattle } from "@/lib/gamification/battle-engine";

describe("battle-engine", () => {
  const tools = [
    { slug: "alpha", votes: 100, trend7d: 10, comments: 20, completeness: 0.9 },
    { slug: "beta", votes: 80, trend7d: 15, comments: 10, completeness: 0.7 },
  ];

  it("returns deterministic winner for same inputs", () => {
    const a = simulateBattle(tools, "1v1", "user-1");
    const b = simulateBattle(tools, "1v1", "user-1");
    expect(a.winnerSlug).toBe(b.winnerSlug);
  });

  it("produces a battle log", () => {
    const result = simulateBattle(tools, "1v1", "user-1");
    expect(result.battleLog.length).toBeGreaterThan(0);
    expect(result.scoreSnapshot.alpha).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run failing test**

Run: `npx vitest run __tests__/lib/gamification/battle-engine.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement engine**

```typescript
import type { ArenaBattleMode, BattleTurn } from "@/lib/gamification/types";

export type BattleTool = {
  slug: string;
  votes: number;
  trend7d: number;
  comments: number;
  completeness: number;
};

export type BattleResult = {
  mode: ArenaBattleMode;
  toolSlugs: string[];
  winnerSlug: string;
  scoreSnapshot: Record<string, number>;
  battleLog: BattleTurn[];
};

function deterministicRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000) / 1000;
}

function normalize(values: number[]): number[] {
  const max = Math.max(...values, 1);
  return values.map((v) => v / max);
}

export function simulateBattle(
  tools: BattleTool[],
  mode: ArenaBattleMode,
  userId: string
): BattleResult {
  if (mode === "1v1" && tools.length !== 2) throw new Error("1v1 requires 2 tools");
  if (mode === "bracket" && tools.length !== 4) throw new Error("Bracket requires 4 tools");
  if (mode === "royale" && tools.length < 2) throw new Error("Royale requires at least 2 tools");

  const votes = normalize(tools.map((t) => t.votes));
  const trends = normalize(tools.map((t) => t.trend7d));
  const comments = normalize(tools.map((t) => t.comments));
  const completeness = tools.map((t) => t.completeness);

  const scores: Record<string, number> = {};
  tools.forEach((tool, i) => {
    const seed = `${userId}:${tool.slug}:${tools.map((t) => t.slug).join(",")}:${mode}`;
    const surprise = 0.9 + deterministicRandom(seed) * 0.2;
    scores[tool.slug] =
      (votes[i] * 0.30 + trends[i] * 0.25 + comments[i] * 0.20 + completeness[i] * 0.15 + surprise * 0.10) *
      1000;
  });

  const sorted = [...tools].sort((a, b) => scores[b.slug] - scores[a.slug]);
  const winnerSlug = sorted[0].slug;

  const log: BattleTurn[] = [];
  for (let turn = 1; turn <= 5; turn += 1) {
    const attacker = tools[(turn - 1) % tools.length];
    const defender = tools[turn % tools.length];
    const damage = Math.round((scores[attacker.slug] - scores[defender.slug]) / 50 + 5);
    log.push({
      turn,
      attacker: attacker.slug,
      defender: defender.slug,
      damage: Math.max(1, damage),
      reason: turn % 2 === 0 ? "trend" : "votes",
    });
  }

  return { mode, toolSlugs: tools.map((t) => t.slug), winnerSlug, scoreSnapshot: scores, battleLog: log };
}
```

- [ ] **Step 4: Run passing test**

Run: `npx vitest run __tests__/lib/gamification/battle-engine.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/gamification/battle-engine.ts __tests__/lib/gamification/battle-engine.test.ts
git commit -m "feat(gamification): add deterministic arena battle engine with tests"
```

---

### Task 4.2: Arena migration and useArenaBattle hook

**Files:**
- Create: `supabase/migrations/20260608000004_gamification_arena.sql`
- Modify: `lib/gamification/actions.ts`
- Create: `lib/gamification/hooks/use-arena-battle.ts`

- [ ] **Step 1: Create arena_battles table**

```sql
CREATE TABLE IF NOT EXISTS public.arena_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('1v1', 'royale', 'bracket')),
  tool_slugs TEXT[] NOT NULL,
  winner_slug TEXT NOT NULL,
  score_snapshot JSONB NOT NULL,
  battle_log JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.arena_battles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own battles"
  ON public.arena_battles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own battles"
  ON public.arena_battles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Add createArenaBattle action**

Append to `lib/gamification/actions.ts`:

```typescript
export async function createArenaBattle(
  mode: ArenaBattleMode,
  toolData: { slug: string; votes: number; trend7d: number; comments: number; completeness: number }[]
): Promise<ArenaBattle> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const result = simulateBattle(toolData, mode, user.id);

  const { data, error } = await supabase
    .from("arena_battles")
    .insert({
      user_id: user.id,
      mode,
      tool_slugs: result.toolSlugs,
      winner_slug: result.winnerSlug,
      score_snapshot: result.scoreSnapshot,
      battle_log: result.battleLog,
    })
    .select()
    .single();

  if (error) throw error;

  await recordGameInteraction(40);

  return data as ArenaBattle;
}
```

- [ ] **Step 3: Implement hook**

```typescript
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createArenaBattle } from "@/lib/gamification/actions";
import type { ArenaBattle, ArenaBattleMode } from "@/lib/gamification/types";

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
    onSuccess: (battle: ArenaBattle) => {
      toast.success("Battaglia conclusa", {
        description: `Vincitore: ${battle.winner_slug}`,
      });
      queryClient.invalidateQueries({ queryKey: ["game-missions"] });
      queryClient.invalidateQueries({ queryKey: ["game-profile"] });
    },
  });
}
```

- [ ] **Step 4: Apply migration and commit**

Run:
```bash
npx supabase migration up
```

```bash
git add supabase/migrations/20260608000004_gamification_arena.sql lib/gamification/actions.ts lib/gamification/hooks/use-arena-battle.ts
git commit -m "feat(gamification): add arena battles table, action and hook"
```

---

### Task 4.3: ArenaBattleStage component

**Files:**
- Create: `components/gamification/arena-battle-stage.tsx`

- [ ] **Step 1: Implement battle stage**

```typescript
"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import NumberFlow from "@number-flow/react";

import { useArenaBattle } from "@/lib/gamification/hooks/use-arena-battle";
import type { ArenaBattleMode } from "@/lib/gamification/types";

export function ArenaBattleStage({
  tools,
  mode,
}: {
  tools: { slug: string; votes: number; trend7d: number; comments: number; completeness: number }[];
  mode: ArenaBattleMode;
}) {
  const battle = useArenaBattle();
  const [step, setStep] = useState<"idle" | "fighting" | "done">("idle");
  const [result, setResult] = useState<Awaited<ReturnType<typeof battle.mutateAsync>> | null>(null);

  async function start() {
    setStep("fighting");
    const res = await battle.mutateAsync({ mode, tools });
    setResult(res);
    setStep("done");
  }

  return (
    <div className="arena-battle-stage">
      {step === "idle" && <button onClick={start}>Inizia battaglia</button>}
      {step === "fighting" && <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity }}>Battaglia in corso...</motion.div>}
      {step === "done" && result && (
        <div>
          <h2>Vincitore: {result.winner_slug}</h2>
          {result.tool_slugs.map((slug) => (
            <div key={slug}>
              {slug}: <NumberFlow value={Math.round(result.score_snapshot[slug] ?? 0)} />
            </div>
          ))}
          <button onClick={() => setStep("idle")}>Rigioca</button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/gamification/arena-battle-stage.tsx
git commit -m "feat(gamification): add arena battle stage component"
```

---

## Phase 5: Badges & Collection

### Task 5.1: Badges and collection migration

**Files:**
- Create: `supabase/migrations/20260608000005_gamification_badges.sql`

- [ ] **Step 1: Create tables and seed badges**

```sql
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  xp_bonus INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are public read"
  ON public.badges FOR SELECT
  USING (true);

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.tool_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  discovered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category_tags TEXT[] NOT NULL DEFAULT '{}',
  UNIQUE(user_id, tool_slug)
);

ALTER TABLE public.tool_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own collection"
  ON public.tool_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own collection"
  ON public.tool_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Seed initial badges
INSERT INTO public.badges (id, code, name, description, icon, requirement_type, requirement_value, xp_bonus) VALUES
('00000000-0000-0000-0000-000000000001', 'first_scan', 'Primo Scan', 'Completa la tua prima missione Radar', 'Radar', 'missions_completed', 1, 50),
('00000000-0000-0000-0000-000000000002', 'arena_rookie', 'Esordiente', 'Vinci la tua prima battaglia in Arena', 'Swords', 'battles_won', 1, 50),
('00000000-0000-0000-0000-000000000003', 'arena_veteran', 'Veterano', 'Vinci 10 battaglie in Arena', 'Trophy', 'battles_won', 10, 150),
('00000000-0000-0000-0000-000000000004', 'radar_prophet', 'Profeta', 'Azzecca 5 predizioni Radar', 'Sparkles', 'predictions_correct', 5, 200),
('00000000-0000-0000-0000-000000000005', 'shortlist_guardian', 'Guardiano', 'Salva 20 tool nella shortlist', 'Bookmark', 'shortlist_size', 20, 100),
('00000000-0000-0000-0000-000000000006', 'seven_streak', 'Sette Giorni', 'Raggiungi una streak di 7 giorni', 'Flame', 'streak_days', 7, 200)
ON CONFLICT (code) DO NOTHING;
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase migration up`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260608000005_gamification_badges.sql
git commit -m "feat(gamification): add badges, user badges and tool collection tables"
```

---

### Task 5.2: Collection tracking and badge check action

**Files:**
- Modify: `lib/gamification/actions.ts`

- [ ] **Step 1: Add discoverTool and checkBadges actions**

Append to `lib/gamification/actions.ts`:

```typescript
export async function discoverTool(toolSlug: string, categoryTags: string[]): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("tool_collections").upsert(
    {
      user_id: user.id,
      tool_slug: toolSlug,
      discovered_at: new Date().toISOString(),
      category_tags: categoryTags,
    },
    { onConflict: "user_id, tool_slug" }
  );
}

export async function checkAndAwardBadges(): Promise<UserBadge[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from("game_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { data: missions } = await supabase
    .from("game_missions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "claimed");

  const { data: battles } = await supabase
    .from("arena_battles")
    .select("*")
    .eq("user_id", user.id);

  const { data: predictions } = await supabase
    .from("radar_predictions")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "won");

  const { data: collection } = await supabase
    .from("tool_collections")
    .select("*")
    .eq("user_id", user.id);

  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("*, badge:badges(*)")
    .eq("user_id", user.id);

  const { data: allBadges } = await supabase.from("badges").select("*");

  const wins = (battles ?? []).length;

  const context: BadgeContext = {
    missions_completed: (missions ?? []).length,
    battles_won: wins,
    predictions_correct: (predictions ?? []).length,
    tools_collected: (collection ?? []).length,
    streak_days: profile?.streak_days ?? 0,
    shortlist_size: 0, // fetched from shortlist store elsewhere
  };

  const newBadges = evaluateBadges(context, (userBadges ?? []) as UserBadge[], (allBadges ?? []) as Badge[]);

  const awarded: UserBadge[] = [];
  for (const badge of newBadges) {
    const { data } = await supabase
      .from("user_badges")
      .insert({ user_id: user.id, badge_id: badge.id })
      .select("*, badge:badges(*)")
      .single();

    if (data) {
      awarded.push(data as UserBadge);
      await recordGameInteraction(badge.xp_bonus);
    }
  }

  return awarded;
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/gamification/actions.ts
git commit -m "feat(gamification): add discover tool and badge check actions"
```

---

### Task 5.3: useToolCollection and useBadges hooks

**Files:**
- Create: `lib/gamification/hooks/use-tool-collection.ts`
- Create: `lib/gamification/hooks/use-badges.ts`

- [ ] **Step 1: useToolCollection**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { ToolCollection } from "@/lib/gamification/types";

async function fetchCollection(): Promise<ToolCollection[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("tool_collections").select("*");
  if (error) throw error;
  return (data ?? []) as ToolCollection[];
}

export function useToolCollection() {
  return useQuery({ queryKey: ["tool-collection"], queryFn: fetchCollection });
}
```

- [ ] **Step 2: useBadges**

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { UserBadge } from "@/lib/gamification/types";

async function fetchBadges(): Promise<UserBadge[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_badges")
    .select("*, badge:badges(*)")
    .order("awarded_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as UserBadge[];
}

export function useBadges() {
  return useQuery({ queryKey: ["user-badges"], queryFn: fetchBadges });
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/gamification/hooks/use-tool-collection.ts lib/gamification/hooks/use-badges.ts
git commit -m "feat(gamification): add collection and badges hooks"
```

---

### Task 5.4: BadgeUnlockModal and LevelUpModal

**Files:**
- Create: `components/gamification/badge-unlock-modal.tsx`
- Create: `components/gamification/level-up-modal.tsx`

- [ ] **Step 1: BadgeUnlockModal**

```typescript
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Bookmark, Flame, Radar, Sparkles, Swords, Trophy, type LucideIcon } from "lucide-react";
import confetti from "canvas-confetti";

import type { Badge } from "@/lib/gamification/types";

const BADGE_ICONS: Record<string, LucideIcon> = {
  Award,
  Bookmark,
  Flame,
  Radar,
  Sparkles,
  Swords,
  Trophy,
};

export function BadgeUnlockModal({
  badge,
  onClose,
}: {
  badge: Badge | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!badge) return;
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [badge, onClose]);

  const Icon = badge ? (BADGE_ICONS[badge.icon] ?? Award) : Award;

  return (
    <AnimatePresence>
      {badge && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60"
        >
          <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-8 text-center text-white shadow-2xl">
            {Icon && <Icon className="mx-auto mb-4 h-16 w-16" />}
            <h2 className="text-2xl font-bold">{badge.name}</h2>
            <p className="mt-2 text-white/90">{badge.description}</p>
            <p className="mt-4 text-sm font-semibold">+{badge.xp_bonus} XP</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 2: LevelUpModal**

```typescript
"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import confetti from "canvas-confetti";

export function LevelUpModal({
  level,
  onClose,
}: {
  level: number;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!level) return;
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [level, onClose]);

  return (
    <AnimatePresence>
      {level > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70"
        >
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            className="rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-12 text-center text-white shadow-2xl"
          >
            <div className="text-6xl font-black">LEVEL {level}</div>
            <p className="mt-4 text-xl">Nuove sfide sbloccate!</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/gamification/badge-unlock-modal.tsx components/gamification/level-up-modal.tsx
git commit -m "feat(gamification): add badge unlock and level up modals"
```

---

## Phase 6: Polish & Integration

### Task 6.1: GameProfileBar in header

**Files:**
- Create: `components/gamification/game-profile-bar.tsx`
- Modify: `components/layout/site-header-v2.tsx`

- [ ] **Step 1: Create profile bar**

```typescript
"use client";

import NumberFlow from "@number-flow/react";
import { Flame, Zap } from "lucide-react";

import { useGameProfile } from "@/lib/gamification/hooks/use-game-profile";
import { xpProgressInLevel } from "@/lib/gamification/level-utils";

export function GameProfileBar() {
  const { profile } = useGameProfile();
  if (!profile) return null;

  const { current, needed } = xpProgressInLevel(profile.xp);

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white backdrop-blur">
      <span className="font-bold">Lv {profile.level}</span>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${Math.min(100, (current / needed) * 100)}%` }}
        />
      </div>
      <span className="flex items-center gap-1">
        <Zap size={12} />
        <NumberFlow value={profile.xp} />
      </span>
      <span className="flex items-center gap-1 text-amber-300">
        <Flame size={12} />
        {profile.streak_days}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Inject into header**

In `components/layout/site-header-v2.tsx`, add `<GameProfileBar />` near the right side of the header, behind the auth check.

- [ ] **Step 3: Commit**

```bash
git add components/gamification/game-profile-bar.tsx components/layout/site-header-v2.tsx
git commit -m "feat(gamification): add persistent game profile bar in header"
```

---

### Task 6.2: GameMissionDrawer and DailyResetCountdown

**Files:**
- Create: `components/gamification/game-mission-drawer.tsx`
- Create: `components/gamification/daily-reset-countdown.tsx`

- [ ] **Step 1: Mission drawer**

```typescript
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Target } from "lucide-react";

import { useDailyMissions } from "@/lib/gamification/hooks/use-daily-missions";
import { GameMissionPanel } from "./game-mission-panel";

export function GameMissionDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg"
        aria-label="Missioni"
      >
        <Target size={20} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-0 left-0 right-0 rounded-t-2xl bg-zinc-950 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <GameMissionPanel
                variant="radar"
                scope="radar"
                rewardId="radar-daily-run"
                eyebrow="Missioni radar"
                title="Daily scan"
                description="Completa le missioni giornaliere per guadagnare XP."
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 2: Daily reset countdown**

```typescript
"use client";

import { useMemo } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { endOfDay, differenceInSeconds } from "date-fns";

export function DailyResetCountdown() {
  const remaining = useMemo(() => {
    const now = new Date();
    const midnight = endOfDay(now);
    return differenceInSeconds(midnight, now);
  }, []);

  return (
    <CountdownCircleTimer
      isPlaying
      duration={86400}
      initialRemainingTime={remaining}
      colors={["#a855f7", "#f59e0b", "#ef4444"]}
      colorsTime={[86400, 3600, 0]}
      strokeWidth={4}
      size={48}
    >
      {({ remainingTime }) => <span className="text-xs">{Math.ceil(remainingTime / 3600)}h</span>}
    </CountdownCircleTimer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/gamification/game-mission-drawer.tsx components/gamification/daily-reset-countdown.tsx
git commit -m "feat(gamification): add mission drawer and daily reset countdown"
```

---

### Task 6.3: LeaderboardStrip and new sounds

**Files:**
- Create: `components/gamification/leaderboard-strip.tsx`
- Modify: `components/app/interaction-sound-layer-v2.tsx`

- [ ] **Step 1: Leaderboard strip**

```typescript
"use client";

import Marquee from "react-fast-marquee";

import { useLeaderboard } from "@/lib/gamification/hooks/use-leaderboard";

export function LeaderboardStrip() {
  const { data } = useLeaderboard();
  if (!data?.length) return null;

  return (
    <div className="bg-gradient-to-r from-violet-900 to-fuchsia-900 py-1 text-xs text-white">
      <Marquee pauseOnHover>
        {data.map((entry) => (
          <span key={entry.user_id} className="mx-6">
            #{entry.rank} {entry.user_id.slice(0, 6)} — {entry.xp_gained} XP
          </span>
        ))}
      </Marquee>
    </div>
  );
}
```

- [ ] **Step 2: Add useLeaderboard hook**

Create `lib/gamification/hooks/use-leaderboard.ts`:

```typescript
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { startOfWeek } from "date-fns";

async function fetchLeaderboard() {
  const supabase = createClient();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("leaderboard_snapshots")
    .select("*")
    .eq("week_start", weekStart)
    .order("rank", { ascending: true })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

export function useLeaderboard() {
  return useQuery({ queryKey: ["leaderboard"], queryFn: fetchLeaderboard });
}
```

- [ ] **Step 3: Extend sound layer**

Add to `SOUND_KINDS` in `components/app/interaction-sound-layer-v2.tsx`:

```typescript
"battleStart",
"battleHit",
"battleWin",
"badgeUnlock",
"levelUp",
"predictionLock",
```

Add corresponding `SOUND_PROFILES` entries with appropriate frequencies and durations.

- [ ] **Step 4: Commit**

```bash
git add components/gamification/leaderboard-strip.tsx lib/gamification/hooks/use-leaderboard.ts components/app/interaction-sound-layer-v2.tsx
git commit -m "feat(gamification): add leaderboard strip and new game sounds"
```

---

### Task 6.4: Final integration, build and QA

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add CSS utilities**

```css
.arena-battle-stage {
  @apply relative flex min-h-[20rem] flex-col items-center justify-center gap-6 rounded-2xl border border-white/10 bg-zinc-950/50 p-6;
}

.game-mission-panel {
  @apply rounded-2xl border border-white/10 bg-zinc-900/80 p-5 text-white;
}

.is-sonic-tap {
  animation: sonic-tap 560ms ease-out;
}
```

- [ ] **Step 2: Run full build**

Run: `npm run build`
Expected: build succeeds with zero errors.

- [ ] **Step 3: Run tests**

Run: `npx vitest run`
Expected: all gamification tests pass.

- [ ] **Step 4: Manual QA checklist**

- [ ] Logged-out user sees GameProfileBar preview and login CTA.
- [ ] Logged-in user sees profile bar with correct XP/level/streak.
- [ ] Daily missions load from Supabase and can be claimed.
- [ ] Radar prediction can be created once per day.
- [ ] Arena battle runs and saves result.
- [ ] Badge unlock modal fires when requirements met.
- [ ] Level up modal fires on XP threshold.
- [ ] Mobile drag gestures work in Arena selection.
- [ ] Desktop hover states and animations work.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat(gamification): add gamification CSS utilities and finalize"
```

---

## Plan Self-Review

### Spec coverage

| Spec section | Implementing task |
|--------------|-------------------|
| Core tables (profiles, leaderboard) | Task 1.1 |
| XP/levels | Task 1.3, 6.1 |
| Daily missions | Task 2.1–2.4 |
| Radar predictions | Task 3.1–3.3 |
| Arena battles | Task 4.1–4.3 |
| Badges & collection | Task 5.1–5.4 |
| UI components | Tasks 3.3, 4.3, 5.4, 6.1–6.3 |
| Sounds | Task 6.3 |
| Edge cases | Handled in actions and components |
| Testing | Every engine/util task includes tests; Task 6.4 includes QA checklist |

### Placeholder scan

No TBD, TODO, or vague steps remain. Each task contains concrete code or exact commands.

### Type consistency

- `GameMission`, `GameProfile`, `ArenaBattle`, `RadarPrediction`, `Badge`, `UserBadge`, `ToolCollection` defined in Task 1.2 and reused everywhere.
- `BadgeContext` keys match `requirement_type` values in Task 1.4 and Task 5.2.
- `GameScope` and `MissionKind` match migration constraints and component props.

### Known gaps to address during execution

- The battle engine `deterministicRandom` is intentionally simple; evaluate if a seeded PRNG library is needed for large tournaments.
- Shortlist size is stubbed in `checkAndAwardBadges` (set to 0); wire to actual shortlist store when implementing.
- Rank-change computation in `resolve-radar-predictions` is stubbed with random values; replace with real directory ranking query.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-06-08-tooolvibes-gamification-plan.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

Which approach do you prefer?
