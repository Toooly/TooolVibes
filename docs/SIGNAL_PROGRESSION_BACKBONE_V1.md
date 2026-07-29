# Signal Progression Backbone V1

## Purpose

Server-verified progression ledger for authenticated users. The browser reports
actions; the server (this backbone) decides every Signal Point (SP) reward.

## Trust boundary

| Layer | Role |
|-------|------|
| Browser | May only send `{ eventType, context }` — never SP, XP or tiers |
| API (`app/api/signal-progression/`) | JWT verify → validate payload → call RPC |
| Database RPC (`accept_signal_engagement`) | Validate params → dedupe → check daily cap → atomic INSERT event + grant + delivery |
| `game_profiles.xp` | Running SP balance (column name `xp` maps to "Signal Points") |

## Environment

- **Project**: `tooolvibes-local` (Supabase local dev)
- **DB**: `postgresql://postgres:postgres@127.0.0.1:54322/postgres`
- **API**: `http://127.0.0.1:54321`
- **Classification**: LOCAL / DISPOSABLE — never production

## Schema

### signal_engagement_events
Append-only, immutable after insert. `UNIQUE (user_id, dedupe_key)`.

### signal_reward_grants
Immutable SP ledger. `UNIQUE (engagement_event_id)` — at most one grant per event.

### signal_reward_deliveries
Presentation state. `status ∈ { pending, delivered, acknowledged, dismissed }`.

### signal_reward_preferences
Server-replicated user prefs for reward presentation (future sync).

## RLS matrix

| Role | Events | Grants | Deliveries | Prefs | RPCs |
|------|--------|--------|------------|-------|------|
| anon | — | — | — | — | — |
| authenticated | SELECT self | SELECT self | SELECT self | SELECT self | `acknowledge_signal_reward` only |
| service_role | ALL | ALL | ALL | ALL | ALL |

No authenticated INSERT/UPDATE/DELETE on ledger tables.

## RPCs

| Function | Role | Security |
|----------|------|----------|
| `accept_signal_engagement` | service_role | SECURITY DEFINER, search_path '' |
| `list_pending_signal_rewards` | service_role | SECURITY DEFINER, search_path '' |
| `acknowledge_signal_reward` | authenticated | SECURITY DEFINER, search_path '', FOR UPDATE scoped to auth.uid() |
| `calculate_level` | authenticated | Existing legacy (unchanged) |

## Concurrency

- `ON CONFLICT (user_id, dedupe_key) DO NOTHING` on event INSERT → single canonical insert
- `UNIQUE (engagement_event_id)` on grants → at most one grant
- `SELECT ... FOR UPDATE` on game_profiles → serializes per-user balance writes
- Live test: 10 concurrent identical events → **1 event, 1 grant** (proved 2026-07-30)

## Daily cap

- Global: 120 SP per UTC day (`date_trunc('day', timezone('utc', now()))`)
- Event-specific daily caps per rule (e.g. 3 saves/day)
- Event-specific cooldowns (e.g. radar_returned 86400s)
- Once-only events deduped globally (e.g. `tool_saved_first_time`)

## Defects found & fixed

| Defect | Fix | Commit |
|--------|-----|--------|
| Concurrent INSERT race without ON CONFLICT | Added `ON CONFLICT (user_id, dedupe_key) DO NOTHING` with re-SELECT fallback | `fix(db): close live signal progression defects` |

## Rollback

```bash
# Flags OFF — no application writes reach the DB
TOOOLVIBES_REWARD_BACKBONE_ENABLED=0
TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED=0
TOOOLVIBES_REWARD_DELIVERY_ENABLED=0
```

No data deletion needed. Tables remain but are not written to.
