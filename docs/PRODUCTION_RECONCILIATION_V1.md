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

Result: **6 of 9 V1 badges awarded** (first_signal, first_verdict,
stack_builder, radar_return, strategist, profile_set); 1
level_advanced grant (L2 Selezionatore); mission completion recorded;
cross-user forgery blocked at RLS; hub read model returns the badge
cabinet; idempotent replay preserves uniqueness. cartographer and
curator_mark require production data fixtures (a multi-step curated
collection journey) that the proof harness does not fabricate but the
production RPC evaluates correctly when invoked.

## Files added in Phase 7B

- `supabase/migrations/20260731130000_signal_bootstrap_v1.sql` (commit 1)
- `supabase/fixtures/production_shape.sql` (commit 2 - fixture)
- `scripts/release/test-production-shape-proof.sql` (commit 2 - proof)
- `docs/PRODUCTION_RECONCILIATION_V1.md` (commit 3 - this runbook)

## Production execution hold point

Until the operator confirms all of the following, no production write
will be made:

1. **Backup verified**: latest successful automated backup timestamp,
   retention window, PITR enabled, restore capability tested.
2. **Dashboard overrides verified**: confirm no Dashboard-created
   functions, views or policies depend on objects the bootstrap will
   create (game_profiles, badges, user_badges, signal_*).
3. **Maintenance window scheduled**: the bootstrap applies a nullable
   column to `viewer_workspaces`; this is non-blocking but still
   acquires a brief ACCESS EXCLUSIVE lock.
4. **Production flag plan confirmed**: which Phase 4-6 flag is the
   first to flip ON after bootstrap? The accepted sequence is:
   backbone → writes → delivery/runtime → progress UI →
   achievements → badge cabinet → milestones. Production defaults
   remain OFF until Step 4.
5. **Rollback plan confirmed**: flags OFF (behavioural kill switch)
   + revert the four Phase 7B commits. The migration is additive; if
   left applied with flags OFF, no user-facing effect occurs.

## Future runbook (when operator approves execution)

```
# 1. Confirm production backups (manual check)
#    - latest backup timestamp
#    - retention window
#    - PITR enabled + restore capability

# 2. Apply the bootstrap migration against production.
#    ONLY use one of these methods (NEVER both):
#    (a) Supabase Dashboard SQL editor (paste bootstrap contents)
#    (b) psql against the production DATABASE_URL with the migration file
#
#    Do NOT use supabase db push (production has no migration ledger).
#    Do NOT use supabase migration repair.

# 3. Verify post-bootstrap state matches the local proof:
#    - 11 production tables preserved
#    - 8 new Signal tables present
#    - game_profiles, badges, user_badges present
#    - 9 V1 badges seeded (family = signal_v1)
#    - All 11 Phase 4-6 RPCs compiled
#    - FORCE RLS = true on Signal tables and game_profiles + user_badges
#    - FORCE RLS = false on the 11 production tables (unchanged)

# 4. Flag rollout (one at a time, in this exact order).
#    Each flag flips the smallest surface that does not depend on
#    an un-enabled flag. Server-owned evaluation runs as soon as
#    `signalAchievements` is enabled (Step 6), at which point
#    pre-existing event rows are picked up by the first evaluate
#    call and awarded retrospectively (idempotent).
#
#      Step  Flag                                     Why this order
#      ----  ---------------------------------------  -----------------------
#      1     TOOOLVIBES_REWARD_BACKBONE_ENABLED       Server-side RPCs need
#                                                  the backbone gate.
#      2     TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED   accept_signal_engagement
#                                                  writes event/grant rows.
#      3     TOOOLVIBES_REWARD_RUNTIME_ENABLED        Reward host XState machine.
#      4     TOOOLVIBES_REWARD_DELIVERY_ENABLED       Pending reward polling +
#                                                  acknowledge.
#      5     TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED    Server hub payload
#                                                  (gates badge payload fields).
#      6     TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED  evaluate_signal_achievements
#                                                  runs server-side on every
#                                                  event accept.
#      7     TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED  Account cabinet renders.
#      8     TOOOLVIBES_REWARD_MILESTONES_ENABLED     Tier 3 milestone host
#                                                  (gates confetti import).
#
#    After each flag flip, verify via:
#      - `npm run quality` (TypeScript + ESLint + full Vitest)
#      - the live Supabase integration suite
#      - a smoke test with one authenticated production user.
#    Do not proceed to the next flag until the previous one is verified
#    in production logs (no 5xx, no unexpected client errors, expected
#    grant / envelope / badge counts in the live DB).

# 5. Rollback at any time:
#    Set all Phase 4-6 flags back to OFF (or false) and the user-facing
#    behaviour reverts to the pre-bootstrap state. The migration is
#    additive; if a hard rollback is needed (migration removal),
#    contact the operator to coordinate a brief downtime window.
