# Signal Progression — Meaningful Actions V1 (Phase 5)

## Purpose

Wire real product actions to the Phase 4 server ledger, project onboarding
missions server-side, and expose an authenticated Progress Hub.

## Trust boundary

| Layer | Role |
|-------|------|
| `SignalProductBridge` + `createSignalProgressionClient` | Emit `{ eventType, context }` when authenticated + writes flag ON |
| API | JWT + validate + accept |
| `accept_signal_engagement` / `complete_signal_mission` | SP grants, caps, dedupe |
| Hub read model | Display only — no client SP math |

Guests never receive fake progress (token missing → skip).

## Product wiring

| Surface | Mechanism | Event |
|---------|-----------|-------|
| Save / unsave | `SignalProductBridge` watches `savedSlugs` | `tool_saved_first_time` → `tool_saved` / `tool_unsaved` |
| Compare decision | `CompareDecisionPanel` → `recordComparisonCompleted` | `comparison_completed` + `setHash` |
| Collection | `CollectionSignalTracker` visibility steps | `collection_opened`, `collection_progressed` |
| Radar usable | `RadarExperience` live/fixture/stale + items | `radar_returned` |
| Profile context | Account hub form → `PUT profile-context` | server issues `profile_completed` when fields valid |

## Missions

Catalog in `lib/signal-progression/missions.ts`. Completions stored in
`signal_mission_completions` via `complete_signal_mission` after accepted
engagement events. Not legacy `game_missions` arcade dailies.

## Level V1 (display)

Thresholds cumulative SP: 0 / 150 / 400 / 900 / 1800  
Titles: Esploratore → Selezionatore → Curatore → Stratega → Cartografo  

`game_profiles.level` still uses legacy `calculate_level` inside grant RPC.
Hub displays Signal V1 titles from SP balance (`calculateSignalLevel`).

## Flags (default OFF)

- `TOOOLVIBES_GAMIFICATION_ENABLED`
- `TOOOLVIBES_REWARD_BACKBONE_ENABLED`
- `TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED`
- `TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED`
- `TOOOLVIBES_REWARD_RUNTIME_ENABLED` / `TOOOLVIBES_REWARD_DELIVERY_ENABLED`

## APIs

| Method | Path |
|--------|------|
| POST | `/api/signal-progression/events` |
| GET | `/api/signal-progression/pending` |
| POST | `/api/signal-progression/acknowledge` |
| GET | `/api/signal-progression/hub` |
| PUT | `/api/signal-progression/profile-context` |
| GET/PUT | `/api/signal-progression/preferences` |

## Migration (local only)

`supabase/migrations/20260730000002_signal_mission_projection.sql`

- `signal_mission_completions`, `signal_user_context`
- RPCs: `complete_signal_mission`, `upsert_signal_user_context`,
  `get_signal_progress_hub`, `upsert_signal_reward_preferences`

## Local enable (never prod defaults)

```bash
TOOOLVIBES_GAMIFICATION_ENABLED=1
TOOOLVIBES_REWARD_BACKBONE_ENABLED=1
TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED=1
TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED=1
```
