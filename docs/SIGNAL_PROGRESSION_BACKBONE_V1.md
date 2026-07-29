# Signal Progression Backbone V1

Phase 4 secure server-side progression layer. **Not active in production** (flags OFF).

## Trust boundary

| Actor | Authority |
|-------|-----------|
| Browser | May report event type + minimal context |
| API | Authenticates JWT, validates schema, calls service RPC |
| Database RPC | Atomic event + optional SP grant + delivery row |
| Client reward runtime (Phase 3) | Presents **server envelopes only** |

Never accepted from clients: `xpDelta`, `spDelta`, `points`, `newBalance`, `newLevel`, `rewardTier`, body `userId`.

## Legacy reconciliation

| Asset | Decision |
|-------|----------|
| `game_profiles.xp` | **Reuse** as Signal Points balance (documented mapping) |
| `game_profiles` SELECT own | Keep |
| `record_game_interaction` | **Isolate** legacy service-only; new path uses `accept_signal_engagement` |
| missions/badges/arena tables | **Isolate** behind legacy flags |
| Phase 3 `lib/rewards/*` | **Reuse** envelope contract + host |

## Database model

Migration: `20260730000001_signal_progression_backbone.sql`

- `signal_engagement_events` — append-only, unique `(user_id, dedupe_key)`
- `signal_reward_grants` — immutable SP ledger, 1:1 event when awarded
- `signal_reward_deliveries` — pending/acknowledged/dismissed (not ledger mutation)
- `signal_reward_preferences` — authenticated prefs table (sync later)

## Atomic RPC

`accept_signal_engagement(...)` — **service_role only**

1. Validate identity (JWT match if present)
2. Dedupe by key → return existing envelope
3. Ensure profile
4. Apply global daily SP cap (default 120)
5. Insert event
6. If SP > 0: update `game_profiles.xp/level`, insert grant + pending delivery
7. Return presentation-safe JSON envelope

`acknowledge_signal_reward` — authenticated, own grants only  
`list_pending_signal_rewards` — service_role after JWT resolution

## Event allowlist

See `lib/signal-progression/rules.ts` (server-only). Includes save/compare/read/collection/radar/profile plus reserved mission/achievement/level types with 0 SP until later phases.

## API

| Method | Path | Flags required |
|--------|------|----------------|
| POST | `/api/signal-progression/events` | backbone + signalEventWrites |
| GET | `/api/signal-progression/pending` | backbone + delivery + runtime |
| POST | `/api/signal-progression/acknowledge` | backbone + delivery + runtime |

Flags OFF → 404, no writes.

## Feature flags (all default OFF)

- `TOOOLVIBES_REWARD_BACKBONE_ENABLED` (existing, via gamification kill switch)
- `TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED`
- `TOOOLVIBES_REWARD_DELIVERY_ENABLED`
- `TOOOLVIBES_REWARD_RUNTIME_ENABLED` (Phase 3 host)

## Phase 3 bridge

`SignalDeliveryBridge` mounts only when all delivery flags are ON. Pulls pending envelopes once per authenticated session into `enqueueVerifiedEnvelope`. No product action wiring.

## Anti-farming

- Unique dedupe constraints
- Once-only rules in rule registry
- Per-event daily caps (application-level, enforced by dedupe keys + daily event design)
- Global daily SP cap in RPC
- No SP for unsaves
- Rate limit on ingest API
- Strict context allowlists
- Concurrent safety via unique constraint + transaction

## Production activation (future)

1. Apply migration to staging/prod  
2. Enable backbone + event writes in staging  
3. Wire Phase 5 product actions  
4. Enable delivery + runtime  
5. Monitor caps and errors  

## Rollback

Disable flags. Do not drop tables. Legacy `record_game_interaction` remains unused by new APIs.
