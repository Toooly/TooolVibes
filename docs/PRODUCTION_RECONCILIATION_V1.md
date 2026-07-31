# Supabase Production Reconciliation V1 — Phase 7B

Status: local proof green. **Production execution paused** until the
backup / PITR gate is satisfied and the operator explicitly approves the
bootstrap migration. No production writes have been performed.

## Verified production inventory (2026-07-31, project `pjyasxaebxvvmcjxvnno`)

| Object kind | Count | Notes |
|---|---|---|
| Public tables | 11 | collection_safe_align_events, collection_tool_slots, collection_transition_reviews, collections, kb_chunks, tool_requests, tools, viewer_profiles, viewer_tool_states, viewer_workspaces, waitlist |
| Public functions (user-defined) | 3 | set_updated_at, match_kb_chunks, rls_auto_enable |
| Extensions | 2 | vector 0.8.0, pg_stat_statements 1.11 |
| Migration ledger | 0 | supabase_migrations schema absent; no CLI-tracked migrations |
| FORCE RLS | FALSE on every table | confirmed |
| kb_chunks rows | 2,435 | out-of-band Dashboard table |

## Migration-equivalence matrix (high level)

The repo contains 44 migrations spanning 0001..0023 + the 2026-phase series.
The verified production represents a STRICT SUBSET of the repo's intended
schema:

- **Present in production** (22 migrations contributed): 0001-0021 (with
  the omission of 0023 / 0024-equivalents / 0019 / 0022 which production
  does not have), 20260621000002 (partially - viewer_workspace authenticated
  policies NOT applied), 20260705000000 (tool_requests expansion),
  20260716000002 (waitlist, but in pre-harden state).
  - The Phase 7B bootstrap `20260731130000_signal_bootstrap_v1.sql`
    records ONLY itself in the production ledger. No previous migration
    version is falsified.
- **Absent in production**: editorial_articles, affiliate_links,
  affiliate_requests, all legacy gamification (game_profiles,
  game_missions, arena_*, badges, user_badges, tool_collections,
  hidden_signal_claims, leaderboard_snapshots), all Signal Progression
  (signal_*, signal_mission_completions, signal_user_context).
- **Out-of-band (Dashboard-created)**: kb_chunks, match_kb_chunks,
  rls_auto_enable.

## Signal dependency audit

The three Phase 4-6 Signal migrations (`20260730000001/2/3`) cannot be
replayed against production because they depend on:

| Required object | Used by | Production state |
|---|---|---|
| public.game_profiles | accept_signal_engagement, complete_signal_mission, award_signal_badge | ABSENT |
| public.calculate_level(integer) | accept_signal_engagement, award_signal_badge | ABSENT |
| public.badges | award_signal_badge, get_signal_progress_hub | ABSENT |
| public.user_badges | award_signal_badge, get_signal_progress_hub | ABSENT |
| viewer_workspaces.workspace_state | evaluate_signal_achievements (stack_builder evidence) | ABSENT (column) |

## Durable migration ledger (Blocker 2)

The verified production database has no `supabase_migrations` schema.
The Phase 7B bootstrap creates the schema and the standard
`schema_migrations(version text, name text, statements text[], inserted_at timestamptz)`
table (the Supabase CLI-compatible structure), but does NOT pre-insert
itself into the ledger -- the Supabase CLI `db push` records the version
after apply. This avoids a duplicate-key collision with the CLI's
ledger writer.

After production execution, the operator verifies the ledger with:

```sql
select version, name, inserted_at
from supabase_migrations.schema_migrations
where version = '20260731130000';
```

A single row is the expected outcome.

## Selected strategy: additive production-safe Signal bootstrap

A single additive migration `20260731130000_signal_bootstrap_v1.sql` that:

1. Creates the minimum required legacy-compatible dependency chain
   (game_profiles + calculate_level + badges + user_badges) with
   FORCE RLS where required by the Phase 4-6 trust boundary.
   - `game_profiles` exposes authenticated SELECT-own + service_role ALL +
     defensive `No client-side progression writes` policy that denies
     anon/authenticated every mutation. Authenticated
     INSERT/UPDATE/DELETE are also revoked at the table-privilege level.
     The trust boundary matches the local production-shape proof (S13).
2. Additively extends `viewer_workspaces` with a nullable
   `workspace_state jsonb` column, the three CAS columns
   (`workspace_schema_version`, `revision`, `last_operation_id`), the
   `workspace_state_v1_is_valid()` validator, and the
   `sync_viewer_workspace_v1()` RPC (service_role only). This is the
   real save-action product path; production users' authenticated save
   actions will now populate workspace_state and unlock stack_builder
   through the actual application code path.
3. Creates the Phase 4-6 Signal tables (8 tables), all Phase 4-6 RPCs
   (accept_signal_engagement, complete_signal_mission,
   upsert_signal_user_context, calculate_signal_level,
   award_signal_badge, evaluate_signal_achievements,
   get_signal_progress_hub, upsert_signal_reward_preferences,
   acknowledge_signal_reward, list_pending_signal_rewards) verbatim
   from the repo migrations.
4. Seeds the 9 canonical V1 achievement badges
   (family = `signal_v1`).
5. Applies Phase 4-6 RLS contract (FORCE RLS, WITH CHECK false on
   user_badges inserts, authenticated read own, service_role all).
6. Does NOT touch any of the 11 production tables (other than the
   additive nullable column on `viewer_workspaces`).
7. Does NOT install the legacy gamification surfaces (arena_*,
   game_missions, hidden_signal_claims, leaderboard_snapshots,
   tool_collections, etc.).
8. Does NOT create editorial_articles, affiliate_links, or
   affiliate_requests (production intentionally lacks these).
9. Does NOT write any migration-history rows (production has no
   supabase_migrations schema).

The bootstrap is fully additive, idempotent (`create table if not
exists`, `drop policy if exists` + recreate, `create or replace
function`), and survives `supabase db reset` cleanly.

## Local proof

Run `scripts/release/test-production-shape-proof.sql` against a
throwaway `pgvector/pgvector:pg17` container, after applying the
`supabase/fixtures/production_shape.sql` fixture (which reproduces
the verified production surface exactly, including the kb_chunks stub,
the auth schema stub, and the waitlist pre-harden state).

Result: **all 9 V1 badges awarded** (first_signal, first_verdict,
pathfinder, profile_set, stack_builder, radar_return, curator_mark,
strategist, cartographer), plus 4 level_advanced grants (Selezionatore,
Curatore, Stratega, Cartografo) and 1 mission completion. The proof
contains 13 scenarios:

  - S1: first_signal ownership persisted (merged into save_first_tool mission)
  - S1 idempotent replay preserves uniqueness
  - S2: first_verdict (merged) + strategist (5 distinct comparisons)
  - S3: stack_builder via the real workspace_state product path
  - S4: radar_return (3 distinct days, no streak, no consecutive rule)
  - S5: profile_set (server-verified context completion)
  - S5b: pathfinder (1 collection_progressed event, merged presentation)
  - S6: level advancement L2 Selezionatore
  - S7: cross-user badge forgery blocked at RLS (WITH CHECK false)
  - S8: pathfinder ownership persistence verified
  - S9: curator_mark from a real 3-slot collection journey (curator-journey)
       with 3 distinct collection_progressed steps, authoritative slot count
  - S10: cartographer from 30 real tool_saved events through the
        accept_signal_engagement RPC (balance 2000 SP, no direct
        game_profiles UPDATE; real server-owned progression path)
  - S11: 10 concurrent evaluate_signal_achievements calls leave
        cartographer ownership count unchanged (idempotent, no duplicate
        SP grant)
  - S12: product-path workspace sync via sync_viewer_workspace_v1 RPC
        populates viewer_workspaces.workspace_state, which then unlocks
        stack_builder without manual fixture injection
  - S13: game_profiles trust boundary (authenticated SELECT own only,
        no authenticated INSERT/UPDATE/DELETE/TRUNCATE table privileges,
        defensive No-client-side-progression-writes policy, service_role
        can mutate progression, cartographer achievable through service_role
        RPCs)

All scenarios are reproducible in a disposable `pgvector/pgvector:pg17`
container with `psql -v ON_ERROR_STOP=1 < /tmp/fixture.sql && < /tmp/bootstrap.sql && < /tmp/proof.sql`. The same harness executes cleanly against the
local Supabase (`supabase db reset` then `psql < /tmp/proof.sql`) once
test auth.users are seeded; the local proof does not require the
fixture because the production-shape schema already exists in local
after the 45 migrations are applied.

## Files added in Phase 7B

- `supabase/migrations/20260731130000_signal_bootstrap_v1.sql` (commit 1)
- `supabase/fixtures/production_shape.sql` (commit 2 - fixture)
- `scripts/release/test-production-shape-proof.sql` (commit 2 - proof)
- `docs/PRODUCTION_RECONCILIATION_V1.md` (commit 3 - this runbook)

## Authoritative production execution method

The sole approved production execution method is the project-scoped
Supabase Management API `apply_migration` tool:

  - Tool: `apply_migration`
  - Project ref: `pjyasxaebxvvmcjxvnno`
  - Migration name: `signal_bootstrap_v1`
  - Query: the complete reviewed contents of
    `supabase/migrations/20260731130000_signal_bootstrap_v1.sql`

The Management `apply_migration` operation owns:

  - the migration transaction (atomic apply or rollback on failure);
  - the `supabase_migrations.schema_migrations` table creation;
  - the migration-history row insertion;
  - the ledger's authoritative version stamping.

DO NOT use:

  - Dashboard SQL Editor;
  - raw psql;
  - `supabase db push` (production has no migration ledger);
  - `migration repair`;
  - manual INSERT into `schema_migrations`.

Production MCP is currently read-only. The future execution phase must
require a separate, explicitly authorised write-capable, project-scoped
connection only for the single `apply_migration` call. After apply,
the operator verifies through read-only tools (MCP `list_tables`,
`list_extensions`, `execute_sql` with read-only role):

  - exactly one new migration-history row exists;
  - its `name` is `signal_bootstrap_v1`;
  - its `version` is the value assigned by the Management migration
    endpoint (the version chosen by Management, not the file's
    timestamp name);
  - no historical repository migrations are falsified in the ledger;
  - all expected schema objects exist (game_profiles, badges,
    user_badges, the 6 signal_* tables, all 11 Phase 4-6 RPCs, the
    9 V1 badge rows, the workspace_state + sync RPC infrastructure).

The recommended production verification query:

```sql
select version, name, inserted_at
from supabase_migrations.schema_migrations
order by inserted_at desc
limit 5;
```

## Local proof vs. future Management API execution

The local proof (commands in "Local proof" section below) certifies:

  1. The bootstrap SQL contains no manual `supabase_migrations` DDL.
  2. Local Supabase `db reset` records the migration normally via the
     Supabase CLI (45 entries after reset, including the new bootstrap).
  3. The application schema after the bootstrap matches the local
     proof result exactly (verified by the 13-scenario proof).
  4. The bootstrap SQL is repeatable against the production-shaped
     disposable fixture (idempotent re-apply produces no errors).
  5. The production execution documentation delegates the ledger
     exclusively to the Management API `apply_migration` operation.

The local proof does NOT fabricate Management API results. It proves
that the bootstrap SQL itself is correct and that the local CLI's
`db reset` records it; the Management API in production is a separate
transport whose outcome must be verified post-apply via read-only
tools as documented above.

## Production execution hold point

Until the operator confirms all of the following, no production write
will be made:

1. **Backup verified**: latest successful automated backup timestamp,
   retention window, PITR enabled, restore capability tested.
2. **Dashboard overrides verified**: confirm no Dashboard-created
   functions, views or policies depend on objects the bootstrap will
   create (game_profiles, badges, user_badges, signal_*, sync_viewer_workspace_v1).
3. **Maintenance window scheduled**: the bootstrap applies nullable
   columns and CHECK constraints to `viewer_workspaces`; this is
   non-blocking but acquires brief ACCESS EXCLUSIVE locks.
4. **Production flag plan confirmed**: the corrected rollout order
   below (Blocker 2 closure).
5. **Rollback plan confirmed**: four-tier rollback (see below).

## Flag rollout (corrected for effective-backbone gating)

`TOOOLVIBES_REWARD_BACKBONE_ENABLED` alone is NOT enough. The
effective backbone is:

```ts
rewardBackboneEnabled = gamificationEnabled && configuredRewardBackboneEnabled
```

So Stage 1 must flip the master gamification flag AND the backbone
together. The master gamification flag is a kill switch: when OFF, no
legacy surface can become enabled regardless of its own mode env var.
No legacy gamification surface (missions, arena, prediction, leaderboard,
hidden_signal, vibe_rush) may become enabled.

Rollout sequence:

| Step | Flag | Why this order |
|------|------|----------------|
| 1a | `TOOOLVIBES_GAMIFICATION_ENABLED=1` | Master kill switch ON (required) |
| 1b | `TOOOLVIBES_REWARD_BACKBONE_ENABLED=1` | Effective backbone becomes true |
| 2 | `TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED=1` | accept_signal_engagement writes events/grants |
| 3 | `TOOOLVIBES_REWARD_RUNTIME_ENABLED=1` | Reward host XState machine |
| 4 | `TOOOLVIBES_REWARD_DELIVERY_ENABLED=1` | Pending reward polling + acknowledge |
| 5 | `TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED=1` | Server hub payload (gates badge fields) |
| 6 | `TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED=1` | evaluate_signal_achievements runs server-side on every event accept |
| 7 | `TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED=1` | Account cabinet renders |
| 8 | `TOOOLVIBES_REWARD_MILESTONES_ENABLED=1` | Tier 3 milestone host (gates confetti import) |

Explicitly absent or OFF throughout the rollout:

- `TOOOLVIBES_GAMIFICATION_PERSISTENCE_ENABLED`
- `TOOOLVIBES_GAME_MISSIONS_MODE`
- `TOOOLVIBES_GAME_HIDDEN_SIGNAL_MODE`
- `TOOOLVIBES_GAME_ARENA_MODE`
- `TOOOLVIBES_GAME_PREDICTION_MODE`
- `TOOOLVIBES_GAME_LEADERBOARD_MODE`
- `TOOOLVIBES_GAME_VIBE_RUSH_MODE`

The config-level test (Section "Certifications") proves:
- backbone flag ON + master OFF -> effective backbone false;
- master ON + backbone ON -> effective backbone true;
- every legacy surface remains OFF;
- every Signal gate remains inactive until its subordinate flag is enabled.

## Rollback contract (four tiers)

1. **Feature rollback (instantaneous)**:
   - set `TOOOLVIBES_GAMIFICATION_ENABLED=0`;
   - this disables all Signal capabilities immediately (master kill
     switch forces every legacy and Signal surface to OFF);
   - zero product-visible behaviour change after the kill switch
     takes effect.

2. **Worker rollback (instantaneous)**:
   - restore Cloudflare Worker version
     `f6549246-be8b-41df-9261-7ee702146347`
     (the certified Phase 6 closure Worker, the last release
     deployed to 100% traffic before the Phase 7B preparation);
   - use `wrangler rollback f6549246-be8b-41df-9261-7ee702146347`
     or `wrangler rollback b5d3a4b8-8a87-4ace-b6b3-0039e6928d0f`
     (alternate known-good).

3. **Database containment**:
   - leave the additive schema in place with flags OFF;
   - the bootstrap is purely additive: no existing production tables,
     rows, policies, or grants are modified;
   - the new schema objects (game_profiles, badges, user_badges,
     signal_*, workspace_state column, sync RPC infrastructure) sit
     inert and consume only disk;
   - zero user-visible behaviour as long as the flags remain OFF.

4. **Hard schema rollback (separately reviewed procedure required)**:
   - Git revert + Worker rollback do NOT remove database objects;
   - a hard schema rollback requires:
     * a separately reviewed reverse migration (Phase 8 work);
     * a maintenance window with downtime;
     * the operator's explicit authorisation;
   - contact the operator before initiating a hard schema rollback;
   - document any reverse migration in `docs/SIGNAL_REVERSE_MIGRATION_V1.md`
     (not yet authored).
