# TooolVibes — Gamification Design Spec

**Date:** 2026-06-08  
**Scope:** Radar & Arena (Compare)  
**Approach:** Evolve existing scaffold (Zustand + GameMissionPanel + XState reward machine)  
**Persistence:** Supabase first, localStorage preview-only for anonymous users  
**Responsive:** Mobile + Desktop

---

## 1. Summary

TooolVibes already owns a lightweight gamification scaffold: a Zustand store for XP, reusable `GameMissionPanel` components, canvas confetti, synthesized UI sounds, and Howler for reward SFX. This spec turns that scaffold into a real game layer centered on two pages:

- **Radar** — a daily discovery game with rotating missions, hidden tools, and prediction markets.
- **Arena** — a simulated battle engine where tools fight each other using real directory data.

The goal is to make the site feel like a game users want to return to every day without changing core navigation or desktop behavior.

---

## 2. Goals

- Give logged-in users a reason to open Radar and Arena every day.
- Reward exploration, comparison, and curation with XP, levels, and badges.
- Keep mechanics modular so features can ship incrementally.
- Reuse existing stack: Next.js 15, React 19, TypeScript, Tailwind, Supabase, Zustand, Motion, XState, Sonner, canvas-confetti, Howler.

## 3. Non-Goals

- Real-time PvP multiplayer (out of scope; future if needed).
- Blockchain/NFT rewards.
- Paid battle passes or IAP in this phase.
- Changing the existing marketing pages or directory UX.

---

## 4. User Game Loop

```
Open site
   │
   ▼
┌─────────────────┐
│ GameProfileBar  │ ← level, XP, streak, vibes
└─────────────────┘
   │
   ├──► Radar Daily Scan ──► missions ──► XP ──► level up ──► unlocks
   │
   ├──► Arena Battles ──► simulated fights ──► wins ──► badges
   │
   └──► Collection ──► discover tools ──► complete sets ──► badges
```

Daily engagement drivers:

1. **Daily missions** reset at 00:00 UTC.
2. **Streak** increments after any game action; resets after 48h inactivity.
3. **Predictions** resolve after 24h, creating a reason to come back tomorrow.
4. **New badges** unlock silently and surprise the user with a modal + confetti.

---

## 5. Progression System

### 5.1 XP & Levels

- Each level `n` requires `levelXp(n) = 100 + (n - 1) * 115` XP from the previous level.
- `level` is computed by iterating: starting at `xp = cumulativeXp`, subtract `levelXp(n)` until remaining XP is less than the next level cost.
- Example: 0 XP = Lvl 1; 100 XP = Lvl 2; 315 XP = Lvl 3; 645 XP = Lvl 4.
- Level-up triggers a fullscreen modal with `levelUp` sound + confetti burst.
- The atomic Postgres function `record_game_interaction(p_user_id, p_xp_delta)` performs the XP/level/streak update to avoid race conditions.

### 5.2 XP Sources

| Action | XP |
|--------|----|
| Complete a Radar mission | 20–100 |
| Win an Arena battle | 40 + streak bonus |
| Correct Radar prediction | 80 |
| Close prediction (±1 rank) | 20 |
| Discover a new tool | 5 |
| Unlock a badge | 50–200 |
| 7-day streak bonus | 150 |
| First battle ever | 50 |

### 5.3 Streak Rules

- Streak increases once per calendar day after the user completes any mission or battle.
- If `last_interaction_at` is older than 48h, streak resets to 1 (not 0; coming back is already rewarded).
- Streak bonus: +5% XP per battle per each 7-day streak block, capped at +25%.

### 5.4 Soft Currency: Vibes

- Earned in smaller amounts than XP (e.g., 1–5 per action).
- Used for cosmetic customization later (themes, avatar badges, card skins).
- Stored in `game_profiles.vibes`.

---

## 6. Data Model (Supabase)

### 6.1 `game_profiles`

| Column | Type | Notes |
|--------|------|-------|
| `user_id` | uuid PK | references auth.users |
| `xp` | int | cumulative |
| `level` | int | denormalized, updated by triggers |
| `vibes` | int | soft currency |
| `streak_days` | int | current streak |
| `last_interaction_at` | timestamptz | for streak logic |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**RLS:** all tables with `user_id` enforce `auth.uid() = user_id` for SELECT/INSERT/UPDATE. Service role only for scheduled Edge Functions.

### 6.2 `game_missions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `scope` | text | `radar` or `arena` |
| `kind` | text | `explore`, `predict`, `battle`, `collect`, `social` |
| `title` | text | UI label |
| `description` | text | UI hint |
| `target` | int | completion threshold |
| `progress` | int | current progress |
| `xp_reward` | int | |
| `status` | text | `active`, `completed`, `claimed` |
| `resets_at` | date | daily reset |
| `created_at` | timestamptz | |

Constraint: one `(user_id, scope, kind, resets_at)` active row per kind.

### 6.3 `game_mission_claims`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `mission_id` | uuid FK | |
| `xp_awarded` | int | |
| `claimed_at` | timestamptz | |

Prevents double-claim via FK + unique on `(user_id, mission_id)`.

### 6.4 `arena_battles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `mode` | text | `1v1`, `royale`, `bracket` |
| `tool_slugs` | text[] | participants |
| `winner_slug` | text | |
| `score_snapshot` | jsonb | per-tool computed scores |
| `battle_log` | jsonb | turn-by-turn events |
| `created_at` | timestamptz | |

### 6.5 `radar_predictions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `tool_slug` | text | predicted winner |
| `context_date` | date | day of prediction |
| `predicted_at` | timestamptz | |
| `resolved_at` | timestamptz | |
| `actual_rank_change` | int | computed next day |
| `xp_awarded` | int | |
| `status` | text | `pending`, `won`, `close`, `lost` |

### 6.6 `tool_collections`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `tool_slug` | text | |
| `discovered_at` | timestamptz | first open/vote/save |
| `category_tags` | text[] | denormalized for set completion |

### 6.7 `badges`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `code` | text unique | `first_scan`, `arena_veteran`, etc. |
| `name` | text | |
| `description` | text | |
| `icon` | text | Lucide icon name or Rive asset id |
| `requirement_type` | text | `missions_completed`, `battles_won`, `predictions_correct`, `tools_collected`, `streak_days`, `custom` |
| `requirement_value` | int | threshold |
| `xp_bonus` | int | |

### 6.8 `user_badges`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `badge_id` | uuid FK | |
| `awarded_at` | timestamptz | |

Unique `(user_id, badge_id)`.

### 6.9 `leaderboard_snapshots`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK | |
| `week_start` | date | |
| `xp_gained` | int | |
| `rank` | int | computed weekly |

---

## 7. Radar Game Mechanics

### 7.1 Daily Missions (3 per day)

Generated at 00:00 UTC by a scheduled Supabase Edge Function (`reset_daily_missions`) triggered via CRON every day at 00:05 UTC (5-minute buffer).

1. **Explore** — Open N tools you have never opened before.  
   Example: "Esplora 3 tool del futuro".

2. **Signals** — Interact (vote, save, or comment) with M tools currently in the Radar spotlight.  
   Example: "Lascia un segnale su 2 tool in ascesa".

3. **Prediction** — Pick one tool among three that will climb the most in the next 24h.  
   Example: "Quale tool salirà di più domani?".

### 7.2 Hidden Tool

- One random tool per day is flagged as the "Hidden Signal".
- It appears in the Radar with a subtle shimmer/aura.
- Discovering it grants +25 XP and a small confetti burst.

### 7.3 Prediction Resolution

- Nightly Edge Function `resolve_radar_predictions()`:
  - Compares each pending prediction to the actual rank change of the tool.
  - Awards `won` (+80 XP), `close` ±1 rank (+20 XP), or `lost` (0 XP).
  - Sends a Sonner toast or email digest (future) the next time the user visits.

### 7.4 Radar Orbit UX

- Tools are rendered as orbiting planets (reusing existing 3D/2D orbit system).
- Size = votes, color = category, ring thickness = trend.
- Tap/long-press on mobile reveals quick actions: Save, Compare, Vote.
- A pulsing "Daily Scan" CTA floats near the center.

---

## 8. Arena Game Mechanics

### 8.1 Battle Modes

1. **1v1** — Two tools, one winner. Fast, 5–8 seconds.
2. **Royal Rumble** — Up to 4 tools, last tool standing.
3. **Bracket** — Exactly 4 tools, semifinal + final.

### 8.2 Score Algorithm

Each tool gets a battle score computed from real directory data:

```
score = (
  normalizedVotes * 0.30 +
  normalizedTrend7d * 0.25 +
  normalizedComments * 0.20 +
  completenessScore * 0.15 +
  surpriseFactor * 0.10
) * 1000
```

- `surpriseFactor` is a pseudo-random multiplier between 0.90 and 1.10 seeded by `sha256(user_id + tool_slugs.join(',') + mode)` so the same battle always produces the same result.
- The algorithm is deterministic per battle so a replay shows the same result.
- Future: user cards/abilities can skew the formula.

### 8.3 Battle Log

Stored as JSONB:

```json
[
  { "turn": 1, "attacker": "notion", "defender": "figma", "damage": 12, "reason": "votes" },
  { "turn": 2, "attacker": "figma", "defender": "notion", "damage": 8, "reason": "trend" }
]
```

### 8.4 Battle Stage UI

- Two or more tool cards face each other.
- Animated health bars using Motion + NumberFlow.
- Hit effects (screen shake, particle burst, sound `battleHit`).
- Winner card scales up, loser dims; confetti if the user predicted/picked the winner.
- "Battle Again" and "Share Result" CTAs.

### 8.5 Arena Missions

- Win 3 battles today.
- Win a Royal Rumble.
- Win with an underdog (lower score entering battle).
- Build a shortlist of at least 5 contenders.

---

## 9. Badges & Collection

### 9.1 Discovery Collection

- Every tool the user opens, votes, saves, or compares is marked as "discovered".
- Collection view groups tools by category and completion percentage.
- Completing a category set (e.g., 10 AI tools) unlocks a category badge.

### 9.2 Badge Examples

| Code | Requirement | XP Bonus |
|------|-------------|----------|
| `first_scan` | Complete first Radar daily scan | 50 |
| `arena_rookie` | Win first battle | 50 |
| `arena_veteran` | Win 10 battles | 150 |
| `radar_prophet` | 5 correct predictions | 200 |
| `category_master_ai` | Collect 10 AI tools | 100 |
| `shortlist_guardian` | Save 20 tools | 100 |
| `night_owl` | Play after midnight local time | 75 |
| `seven_streak` | Reach 7-day streak | 200 |

### 9.3 Badge Unlock Flow

1. Any game action triggers `check_and_award_badges(user_id)`.
2. New badge rows are inserted into `user_badges`.
3. Client receives the new badge via realtime or next fetch.
4. Modal `BadgeUnlockModal` appears with Rive/Lottie animation, sound `badgeUnlock`, confetti.

---

## 10. UI/UX Components

### 10.1 New Components

- `GameProfileBar` — persistent micro-bar in site header (level, XP to next level, streak flame).
- `GameMissionDrawer` — bottom sheet (mobile) / side panel (desktop) with active missions.
- `ArenaBattleStage` — full battle scene.
- `RadarScannerOverlay` — scan-line animation over Radar.
- `BadgeUnlockModal` — celebratory modal.
- `LevelUpModal` — fullscreen level-up celebration.
- `LeaderboardStrip` — top 3 users of the week ticker.
- `DailyResetCountdown` — countdown to next missions.

### 10.2 Animations & Feedback

- Motion for all transitions, drawer open/close, card flips, health bars.
- `canvas-confetti` for wins, claims, level-ups, badge unlocks.
- `NumberFlow` for XP counters and streak numbers.
- `@use-gesture/react` for drag-to-battle on mobile.
- `react-countdown-circle-timer` for mission timers.
- `react-fast-marquee` for live event tickers.
- Synthesized sounds extended with: `battleStart`, `battleHit`, `battleWin`, `badgeUnlock`, `levelUp`, `predictionLock`.

---

## 11. Hooks & API Layer

### 11.1 React Hooks

| Hook | Responsibility |
|------|----------------|
| `useGameProfile()` | Fetch/update profile, streak, level |
| `useDailyMissions(scope?)` | Today's missions for Radar or Arena |
| `useClaimMission(missionId)` | Completes + awards XP, confetti, sound |
| `useArenaBattle()` | Creates battle, runs simulation, saves result |
| `useRadarPrediction()` | Creates a prediction for today |
| `useToolCollection()` | Discovered tools and completion stats |
| `useBadges()` | Badges + newly unlocked ones |
| `useLeaderboard(weekStart?)` | Weekly top users |

### 11.2 Supabase Edge Functions / RPC

- `reset_daily_missions(user_id)` — idempotent daily reset.
- `resolve_radar_predictions()` — nightly batch resolution.
- `check_and_award_badges(user_id)` — evaluates badge rules.
- `recalculate_level(user_id)` — updates `game_profiles.level`.
- `record_game_interaction(p_user_id, p_xp_delta)` — atomic XP/level/streak update.

### 11.3 Client State

- Keep existing Zustand store `game-progress-store.ts` and extend it with:
  - `profile`, `missions`, `badges`, `pendingActions`.
  - Optimistic UI for mission progress.
  - Queue for offline actions (future enhancement).

---

## 12. Edge Cases & Error Handling

- **Anonymous user** — sees a preview of the game bar with "Login to save your progress". LocalStorage is not used for progress persistence in this Supabase-first approach.
- **Double claim** — DB unique constraint + client-side guard.
- **Prediction after midnight** — client blocks new predictions if `context_date` has already changed.
- **Tool removed after battle** — battle log keeps snapshot; UI shows "tool removed" badge.
- **Race condition on mission progress** — use Supabase `increment` RPC, not read-modify-write.
- **Reduced motion** — all confetti and shake effects respect `prefers-reduced-motion`.

---

## 13. Testing Strategy

- Unit tests for battle score algorithm with deterministic seeds.
- Unit tests for level/streak math.
- Integration tests for daily mission reset RPC.
- Visual regression for GameProfileBar and BadgeUnlockModal.
- Manual QA checklist for mobile drag gestures and desktop hover states.

---

## 14. Future Ideas (Not in First Phase)

- Real-time multiplayer duels.
- User-created tournaments.
- "Power cards" that alter battle outcomes.
- Vibes shop for themes and card skins.
- Email/Sonner digests for prediction results.

---

## 15. Appendix: Packages

### Already installed

`motion`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `zustand`, `@tanstack/react-query`, `xstate`, `@xstate/react`, `zod`, `@number-flow/react`, `canvas-confetti`, `howler`, `sonner`, `three`, `@react-three/*`, `gsap`.

### Installed for this spec

`date-fns`, `@use-gesture/react`, `react-countdown-circle-timer`, `react-fast-marquee`.

### Optional future packages

- `@rive-app/react-canvas` for animated badges (evaluate React 19 compatibility first).
- `lottie-react` as a fallback for badge animations.
- `partykit` if real-time multiplayer is ever added.

---

## 16. Migration Notes

1. Run Supabase migrations to create the 9 new tables.
2. Seed `badges` table with initial badge definitions.
3. Backfill `tool_collections` for existing logged-in users based on their shortlist/votes history (optional).
4. Schedule nightly Edge Function `resolve_radar_predictions` and `reset_daily_missions`.
5. Update existing `GameMissionPanel` props to consume dynamic missions from Supabase instead of static arrays.
