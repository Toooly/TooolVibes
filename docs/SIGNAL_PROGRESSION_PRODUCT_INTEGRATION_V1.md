# Signal Progression Product Integration V1 (Phase 5)

## Purpose

Wire authenticated meaningful product actions to the Phase 4 Signal Progression backbone and present server-owned progress in Account.

## Trust boundary

| Actor | May |
|-------|-----|
| Client | Send `{ eventType, context, clientIdempotencyKey }` only |
| Server | Decide SP, level, mission completion, reward tier/copy, caps |
| Guest | Local save/compare/motion only — no SP, missions, badges |

Never import `lib/signal-progression/rules.ts` into client bundles.

## Instrumented actions

| Action | Event | Surface owner |
|--------|-------|---------------|
| First / repeated tool save | `tool_saved_first_time` / `tool_saved` | `SignalProductBridge` rising-edge on workspace saved set |
| Tool unsave | `tool_unsaved` (0 SP) | same |
| Explicit compare decision | `comparison_completed` | `CompareDecisionPanel` |
| Collection step visible | `collection_progressed` | `CollectionSignalTracker` |
| Collection open | `collection_opened` | `CollectionSignalTracker` |
| Usable Radar view | `radar_returned` (daily) | `radar-experience` |
| Profile context fields | `profile_completed` after server verify | Account hub + `profile-context` API |

## Deliberately not rewarded

- Ordinary clicks / hover
- Compare tray membership alone
- Raw collection page load without step visibility
- Radar error/loading shells
- Guest actions
- Rapid refresh farming (server caps/dedupe)

## Missions (onboarding)

1. `save_first_tool` ← `tool_saved_first_time`
2. `complete_first_comparison` ← `comparison_completed`
3. `explore_first_collection` ← `collection_progressed`
4. `return_to_radar` ← `radar_returned`
5. `complete_profile_context` ← `profile_completed` (requires `signal_user_context`)

Mission completion is once-only via `signal_mission_completions` + `complete_signal_mission` RPC.

## Levels (V1)

| Level | Title | Min SP |
|------:|-------|-------:|
| 1 | Esploratore | 0 |
| 2 | Selezionatore | 150 |
| 3 | Curatore | 400 |
| 4 | Stratega | 900 |
| 5 | Cartografo | 1800 |

Derived from `game_profiles.xp` (SP balance). Legacy `calculate_level` remains storage curve for `game_profiles.level`; Signal UI uses `calculate_signal_level` / TS model.

## Account Progress Hub

- Flag: `TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED` (default OFF) + reward backbone
- API: `GET /api/signal-progression/hub` and `GET /api/signal-progression/progress`
- Component: `AccountSignalProgressSection` (legacy arcade `AccountGamificationSection` stays OFF)

## Preferences sync

- Local Phase 3 key `tv.reward-prefs.v1` is fallback
- Authenticated remote: `signal_reward_preferences` via preferences API
- Conflict: remote wins on successful fetch; local write-through on toggle

## Feature flags (production defaults OFF)

- `TOOOLVIBES_GAMIFICATION_ENABLED`
- `TOOOLVIBES_REWARD_BACKBONE_ENABLED`
- `TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED`
- `TOOOLVIBES_REWARD_RUNTIME_ENABLED`
- `TOOOLVIBES_REWARD_DELIVERY_ENABLED`
- `TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED`

Flags OFF ⇒ no event writes, no progression reads, no mission UI, no reward polling.

## Local activation

```bash
# .env.local (local only)
TOOOLVIBES_GAMIFICATION_ENABLED=true
TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED=true
TOOOLVIBES_REWARD_BACKBONE_ENABLED=true
TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED=true
TOOOLVIBES_REWARD_RUNTIME_ENABLED=true
TOOOLVIBES_REWARD_DELIVERY_ENABLED=true
TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED=true
```

Apply migration `20260730000002_signal_mission_projection.sql` to **local** Supabase only.

## Production activation prerequisites

1. Review + apply migration to production via approved release path
2. Enable flags gradually: backbone → writes → delivery/runtime → UI
3. Monitor grant rates and error budgets
4. Keep legacy game surfaces OFF

## Rollback

1. Disable flags (instant)
2. Do not drop tables
3. Client becomes inert; product actions continue without rewards

## Failure behaviour

- Save/compare succeed even if reward API fails
- Hub shows restrained unavailable state on read failure
- No infinite retries; client idempotency set bounds duplicate posts

Also see `docs/SIGNAL_PROGRESSION_MEANINGFUL_ACTIONS_V1.md` for the committed wiring map.

---

## Phase 5 Technical Closure — 30 July 2026

### Final commit
`64ed166` — `fix(signal): close Phase 5 integration defects`

### Final test count
- **Vitest suite**: 1099 passed, 0 failed, 22 skipped
- **Test files**: 143 passed, 2 skipped (integration files requiring env vars)
- **Signal-focused tests**: 82 passed (16 files)
- **Reward runtime tests**: 21 passed (5 files)
- **Gamification tests**: 30 passed (5 files)
- **Account tests (incl. Axe)**: 91 passed (7 files)
- **Core primitives Axe tests**: 22 passed, 0 accessibility violations

### Local Supabase result
- Supabase project: `tooolvibes-local` (explicitly local/disposable)
- All migrations applied clean through `20260730000002_signal_mission_projection.sql`
- Live integration tests: 14 passed (RLS, atomic writes, concurrency dedup, cross-user isolation, tool_unsaved=0 SP)
- No production database access

### Axe result
- Core primitives: 0 critical, 0 serious violations
- Account state matrix: 0 violations (axe-core on auth variant, warning/success tones)
- Fixed: `id`/`htmlFor` on select elements, `aria-label` on mission cards, `aria-label` on preference toggle buttons

### Responsive result
- Breakpoint continuity verified: `sm:` variants present across all new components
- No horizontal overflow or clipped UI in the built output
- Mobile safe-area handled via existing layout shell conventions
- All account panel components correctly marked `"use client"`

### OpenNext result
- Next.js production build: compiled successfully
- OpenNext/Cloudflare build: worker saved, build complete

### Bundle impact
- First Load JS shared by all: 102 kB
- New Signal API routes: `events` (226 B), `hub` (226 B), `pending` (226 B), `preferences` (226 B), `profile-context` (226 B), `acknowledge` (226 B)
- Account route bundle: included in `/account` page with Signal Progress Hub component
- No new chunk splits

### Flags-off behaviour (verified)
- `TOOOLVIBES_GAMIFICATION_ENABLED=false` → all Signal APIs return disabled/404
- Core product pages (archivio, compare, radar, home) return 200
- Guest and authenticated core actions work normally
- No progression writes, no pending-reward polling, no mission UI
- No reward presentation

### Local flags-on flow (verified via integration + unit tests)
1. Authenticated user save → `accept_signal_engagement` → event + grant + delivery atomically
2. `tool_unsaved` → 0 SP (correct)
3. RLS: user isolation verified (user A cannot read B's grants)
4. Concurrency: 10 concurrent identical events → 1 DB row
5. Acknowledge: user A acknowledges own reward; user B blocked
6. Reward machine: envelope presentation, DISMISS non-replay, AUTH_LOST clears state
7. Preference sync: remote wins on fetch, local write-through on toggle

### Phase 6 closure (2026-07-30, local)

Achievements, badges, the Account badge cabinet and Tier 1–3 milestone
presentations are implemented and verified locally — canonical reference:
`docs/SIGNAL_ACHIEVEMENTS_AND_REWARDS_V1.md`. Production flags remain OFF;
production migrations are not applied; no deployment occurred.

### Remaining Phase 7 scope
- Leaderboard surface
- Arena battle mode
- Vibe Rush game mode
- Hidden Signal discovery game
- `deep_read` achievement (deferred: no trustworthy server evidence)
- Production flag rollout
- Production Supabase migration
