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
