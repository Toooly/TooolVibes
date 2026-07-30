# Signal Progression — Production Rollout V1 (Phase 7A plan)

Status: **read-only plan**. No production mutations performed. Production
flags OFF. Production migrations not applied. No deployment triggered.

This document is the executable Phase 7B rollout plan. It must not be
executed without a separate, explicit Phase 7B instruction.

## Verified production baseline

| Field | Value |
|---|---|
| Repository | `Toooly/TooolVibes` |
| Certified pre-Phase-6 main | `bea950c9aa9f80ad4fa127bfe09f19fcce5d2fca` |
| Phase 6 + fix main | `11c611caaffd20458f3d2a5b199c43aa4e038b32` |
| Cloudflare Worker | `tooolvibes` |
| Worker account | `ffacd11bfafdca87d540a6c5fbe89120` |
| Compatibility date | `2026-04-25` |
| Compatibility flags | `["nodejs_compat"]` |
| Domain | `https://tooolvibes.eu` |
| Production Supabase | `https://pjyasxaebxvvmcjxvnno.supabase.co` |
| Service binding | `SECURITY_STATE` → `tooolvibes-security-state` |
| Production flags (current) | none of the Signal/Reward/Gamification flags set in `wrangler.jsonc` → **all defaults OFF** |
| Production migrations (observed) | **unknown without prod read access** — this environment has no production credentials and did not query production. The plan below treats all three Signal migrations as **pending**. |
| Production data (observed) | not observed; plan does not depend on row counts |

Backup / PITR: **not verified from this environment**. **Phase 7B must
confirm Supabase PITR is enabled and a fresh restore target exists in
the staging project before any production migration.**

## Migration status (local)

All three migrations are applied to local Supabase through Colima:

| File | Version | Local status |
|---|---|---|
| `20260730000001_signal_progression_backbone.sql` | `20260730000001` | applied |
| `20260730000002_signal_mission_projection.sql` | `20260730000002` | applied |
| `20260730000003_signal_achievements_v1.sql` | `20260730000003` | applied (replayed cleanly twice) |

Local fresh-path (`supabase db reset`) applies all three in order.
Local upgrade-path replay is idempotent (`ON_ERROR_STOP=1`, 0 errors).

## Code audit — release blockers

| Concern | Finding | Severity |
|---|---|---|
| Client computes SP | **None.** `lib/signal-progression/client.ts` does not compute, derive, or display earned SP — it only renders server-issued envelopes. | informational |
| Achievement eligibility client-side | **None.** No `evaluateBadges` / `isEligible` / `canEvaluate` is called from `components/`. Server-only RPC `evaluate_signal_achievements` owns eligibility. | informational |
| Mission progress client-side | **None.** `complete_signal_mission` runs only on the server (`service_role`). | informational |
| Badge ownership client-insert | **Blocked.** `badges` has public read; `user_badges` `WITH CHECK (false)` on INSERT for authenticated; full DML only `service_role`. `INSERT INTO user_badges` from a user-scoped client returns `permission denied`. | informational |
| Level advancement | **Server-calculated.** `evaluate_signal_achievements` and `calculate_signal_level` compute crossings server-side. `accept_signal_engagement` and mission projection are the only authoritative SP-changing paths. | informational |
| Grant immutability | **Immutable.** `signal_reward_grants` has no UPDATE/DELETE policy for authenticated; ledger is append-only. Acknowledgement RPC updates `signal_reward_deliveries.status` only, never grants. | informational |
| Duplicate event → at most one grant | **Enforced.** `UNIQUE(user_id, dedupe_key)` on events; `UNIQUE(engagement_event_id)` on grants. Verified live: 10 concurrent identical events collapse to 1 event / 1 grant (Phase 5). Replay returns `duplicate` and writes nothing new. | informational |
| Duplicate achievement evaluation → one badge | **Enforced.** `UNIQUE(user_id, badge_id)` on `user_badges`; `award_signal_badge` returns `awarded:false` on existing ownership. Verified in live integration test (`signal-achievements-live.test.ts`). | informational |
| Cross-user RLS | **Intact.** Verified live: user B sees own badge set only; cannot read A's rows; cannot insert into `user_badges`; cannot call `evaluate_signal_achievements` as authenticated (revoked, service_role only). | informational |
| Service-role secret in client bundle | **No leak.** `grep -r SUPABASE_SERVICE_ROLE_KEY .next/static/` returns 0 matches. Service-role key is referenced only in `lib/supabase/env.ts` (`server-only`). Admin client used only in API routes / server service. | informational |
| Feature flags default OFF | **Verified.** `.env.example` documents all ten Signal/Reward/Gamification flags at `=0`. Production `wrangler.jsonc` sets none. Default resolution path: `parseBooleanFlag(undefined, def)` → `def.defaultEnabled` (always `false` for these features). | informational |
| Legacy Arcade/Vibe Rush/Predictions | **OFF.** `TOOOLVIBES_GAMIFICATION_ENABLED=0`; per-surface modes (`TOOOLVIBES_GAME_*_MODE=0`). No production change. | informational |
| Confetti lazy + Tier 3 only | **Yes.** `canvas-confetti` is dynamically imported in `components/rewards/milestone-reveal.tsx` only; chunk `1708` (10.5 kB) loads only on a valid Tier 3 milestone. Host gates fire only when `activePresentation === "full"`. | informational |
| Reduced motion / quiet suppress milestone | **Yes.** `evaluateAchievementsForUser` and machine downgrade to static when reduced motion, quiet mode, or `suppressMajorCelebrations` is set. Unit-tested in `machine-milestone.test.ts`. | informational |
| Milestone cap 1/day | **Yes.** `REWARD_PRESENTATION_CAPS.milestonePerDay = 1`; machine treats additional same-day milestones as static. Unit-tested. | informational |
| Guests no fake progression | **Yes.** `SignalDeliveryBridge` and `RewardAuthBridge` short-circuit when `status !== "authenticated"`. Guest Account surfaces use approved copy-only previews. | informational |
| Account Hub fails safely | **Yes.** Hub is gated by `signalProgressUi` + `badges` Phase 6 cabinet. Missing hub returns a clean "Caricamento" / empty state. | informational |
| Reward failure never breaks primary action | **Yes.** `evaluateAchievementsForUser` catches and warns (`[signal-achievements] evaluate failed/threw` with safe code/operation), returning `[]`. The save / compare / collection path never throws. | informational |
| **Production flag accidentally enabled** | **No.** Production `wrangler.jsonc` vars do not include any Signal/Reward/Gamification flag. | informational |
| **Migration already partially applied in production** | **Unknown from this environment.** Plan treats all three migrations as pending. Phase 7B must read `supabase_migrations.schema_migrations` (or equivalent) against the production DB before applying anything. If `20260730000001` is already present, **stop and reconcile** before proceeding. | high (gating check) |
| **Backup / PITR** | **Unverified.** Phase 7B must confirm Supabase PITR or daily backup with a fresh restore target in staging before any migration. | high (gating check) |

No `blocker` findings were identified in the code.

## Final local certification (sequentially run)

| Step | Command / target | Result |
|---|---|---|
| Runtime | `npm run check:runtime` | Node 22.23.1 / npm 10.9.8 OK |
| Migration history | `npm run db:migrations:check` | passed |
| Database manifest | `npm run db:manifest:strict` | passed (issues empty) |
| Fresh full migration path | `npx supabase db reset` | applied all 3 Signal migrations cleanly |
| Upgrade path replay | apply 000003 over already-applied state | 0 errors (idempotent) |
| Live RLS integration | `signal-progression-live.test.ts` | 12 passed |
| Live concurrency integration | included in `signal-progression-live.test.ts` | passed |
| Live mission integration | included in `signal-progression-live.test.ts` | passed |
| Live achievement & badge integration | `signal-achievements-live.test.ts` | 10 passed |
| HTTP product flow | manual eval on `http://127.0.0.1:3000` | first_signal ownership persisted; cross-user isolation verified |
| TypeScript | `tsc --noEmit` | 0 errors |
| ESLint | `eslint . --max-warnings=0` | 0 errors, 0 warnings |
| Complete Vitest suite | `vitest run` | 1152 passed, 0 failed, 32 skipped (151 test files) |
| Responsive checker | `npm run check:responsive` against running production build | same as Phase 6 baseline (errors 7, h1 7, horizontalOverflow 0, textFloorFailures 59, consoleWarnings 11); no regression |
| Breakpoint continuity | covered by responsive checker | passed |
| Axe | 13 component test files run `axe.run()` | 0 critical / 0 serious violations across the suite |
| Computed contrast | 12 component test files assert contrast | passed |
| Next production build | `npm run build` | exit 0; shared First Load JS 102 kB; Account 19.2 kB / 379 kB |
| OpenNext/Cloudflare build | `npm run build:cloudflare` | exit 0; `Worker saved in .open-next/worker.js` |
| `git diff --check` | on clean tree | exit 0 |

Bundle baseline:
- Shared First Load JS: **102 kB** (matches Phase 5/6 baseline)
- Account route: 19.2 kB / 379 kB
- Confetti chunk `1708-…js`: **10.5 kB** (lazy, never loaded when milestone host unused)
- Milestone reveal chunk `913.…js`: **3.1 kB** (lazy)

## Production migration sequence (do NOT execute)

### Pre-flight gating (Phase 7B start)

1. Confirm Supabase PITR enabled and a current restore target exists in
   staging.
2. Read production `supabase_migrations.schema_migrations`. If any of
   `20260730000001`, `20260730000002`, `20260730000003` is already present
   in a partially-applied state, **stop and reconcile**.
3. Read production row counts on `public.game_profiles`,
   `public.badges`, `public.user_badges`, `public.signal_engagement_events`,
   `public.signal_reward_grants`, `public.signal_reward_deliveries`,
   `public.signal_reward_preferences`, `public.signal_mission_completions`,
   `public.signal_user_context`. Phase 6 migration `00003` adds
   additive columns to `public.badges` (with defaults) and to
   `public.signal_reward_preferences`; both default-fill existing rows.
4. Snapshot migration history: store the read of
   `supabase_migrations.schema_migrations` in the deployment runbook.

### Migration 1 of 3 — `20260730000001_signal_progression_backbone.sql`

- Creates ledger tables (`signal_engagement_events`,
  `signal_reward_grants`, `signal_reward_deliveries`,
  `signal_reward_preferences`) with RLS force-enabled and only
  `service_role` DML; authenticated users have SELECT on own rows.
- Creates `accept_signal_engagement`, `acknowledge_signal_reward`,
  `list_pending_signal_rewards` RPCs.
- Additive: empty schemas — no `IF NOT EXISTS` collisions on fresh prod.

### Halt criterion between 1 → 2

- Halt if any RPC call from a smoke user returns a 5xx.
- Halt if `signal_engagement_events` accepts an INSERT from the
  authenticated role (it must not; revoke is unconditional).

### Migration 2 of 3 — `20260730000002_signal_mission_projection.sql`

- Creates `signal_mission_completions`, `signal_user_context`,
  `complete_signal_mission`, `upsert_signal_user_context`,
  `get_signal_progress_hub`, `calculate_signal_level`.
- RLS on new tables, own-user SELECT, `service_role` all.

### Halt criterion between 2 → 3

- Halt if `get_signal_progress_hub` from an authenticated smoke user
  returns an envelope it should not (e.g. leaks another user's data).
- Halt if `upsert_signal_user_context` from an authenticated smoke user
  fails to write `completed_at`.

### Migration 3 of 3 — `20260730000003_signal_achievements_v1.sql`

- Additive: alters `public.badges` (`family`, `rarity`,
  `a11y_description`, `visual_intensity`, `sort_order`) and
  `public.signal_reward_preferences` (`suppress_major_celebrations`).
  All defaults satisfy existing rows.
- Seeds nine `signal_v1` badge rows (`on conflict (code) do nothing`).
- Creates `award_signal_badge`, `evaluate_signal_achievements` (both
  service_role-only), replaces `get_signal_progress_hub`,
  `upsert_signal_reward_preferences` (drops old 4-arg signature, adds
  5th).
- Grants `badges` SELECT to anon/authenticated; `user_badges` SELECT
  to authenticated (RLS still owns/insert blocked); full DML to
  `service_role`; `game_profiles` DML to `service_role`.

### Halt criterion after 3

- Halt if any `user_badges` SELECT from a non-owner returns a row.
- Halt if `award_signal_badge` can be called from the authenticated
  role.

### Rollback-by-flags (no SQL rollback)

The three migrations are **additive** (new tables, new columns with
defaults, new rows with idempotent insert, new functions, only the
`upsert_signal_reward_preferences` 4-arg form is dropped in `00003` —
its previous callers are replaced in the same migration). With every
Signal/Reward flag OFF (production default), the new schema is
inert. **SQL rollback is not necessary; flags-OFF containment is the
safer rollback.** A SQL rollback would still be possible via
`drop function / drop table` if required, but is not recommended and
is not pre-planned here.

## Code deployment order

The current `main` already contains all Phase 6 commits plus the
gate-fix (`11c611c`). Production currently runs an older revision
(commit hash unknown from this environment). The safest order is:

### **Option A — Deploy compatible code with flags OFF, then migrate**

Rationale:
- The application on `main` calls `evaluate_signal_achievements`,
  `award_signal_badge`, `get_signal_progress_hub` (new return shape
  with `badges`/`achievementProgress`/`suppressMajorCelebrations`),
  and the new 5-arg `upsert_signal_reward_preferences`.
- With every Signal flag OFF, none of these new functions is invoked:
  the events route returns 404 (gated by `canWriteSignalEvents`), the
  hub route returns 404 (gated by `canReadSignalProgressionUi`), the
  preferences route returns 404 (gated by `canReadSignalProgressionUi`),
  and the client never opens the Achievement/Milestone host (gate
  required for both).
- **The old schema in production (pre-migration) cannot satisfy the
  new code**: the routes ARE 404-gated, so no RPC call is made. The
  Account client reads the hub via `getSignalProgressHub` (server-side,
  service-role) only when `canReadSignalProgressionUi` is true —
  which it is not. So the new hub RPC is not invoked either.
- **Net:** with flags OFF, the new code is a strict superset of the
  old code in terms of API surface used. Migration then makes the new
  functions available for staged activation.

This is the recommended order: **deploy, then migrate**.

Option B (migrate first, then deploy) would also be safe with flags
OFF — the new functions would exist but no client would call them.
However, the production Worker would still call the old hub route
shape until the new code deploys; the migration only adds columns,
so old hub code reading `signal_reward_preferences` would still see
the four pre-existing columns and ignore the new one. Option A is
preferred because it places the code change first (which is the
riskiest part) and gives more time to detect any regression before
the schema changes land.

## Staged feature-flag rollout

Flags (all default OFF; `TOOOLVIBES_GAMIFICATION_ENABLED` is the kill
switch that disables every Signal/Reward gate simultaneously; legacy
`TOOOLVIBES_GAME_*_MODE` flags remain OFF throughout).

### Stage 0 — Deploy + migrate, every Signal flag OFF

- Flags: only the long-existing prod defaults; all Signal flags
  explicit `=0` if set.
- Expected network: **no change** to the public request surface; the
  new Worker is identical in behaviour with flags OFF.
- Expected DB writes: **none** beyond the migration artefacts.
- Smoke: hit `/`, `/account`, `/toools/<slug>`, `/collections/<slug>`,
  `/radar`, `/compare`; confirm no 4xx regressions.
- Metrics: Cloudflare Worker error rate, API 4xx/5xx.
- Rollback trigger: any 4xx/5xx anomaly on a public route.
- Rollback action: rollback the Worker to the previous version
  (`wrangler rollback --version <prev>`). Migration is additive and
  inert with flags OFF — leave in place.
- Minimum observation: **24 hours** of stable prod traffic.

### Stage 1 — Reward backbone ON (writes OFF, delivery OFF, UI OFF)

- Flags:
  - `TOOOLVIBES_GAMIFICATION_ENABLED=1`
  - `TOOOLVIBES_REWARD_BACKBONE_ENABLED=1`
  - every other Signal flag `=0`.
- Expected network: **no client-side change** (no UI gating opens new
  flows). Backend may receive /api/signal-progression/* requests from
  any code path that pre-flags back the routes; the per-route
  `canWriteSignalEvents`/`canReadSignalProgressionUi`/`canDeliverSignalRewards`
  gates keep the APIs 404 until their subordinate flag flips.
- Expected DB writes: **none** (events still gated off).
- Smoke: hit every Signal API route (`/api/signal-progression/{events,hub,acknowledge,pending,preferences,profile-context}`)
  without a token; all must return `404 { error: "disabled" }`.
- Metrics: Worker error rate; supabase RPC invocations (expect 0 new).
- Rollback trigger: any 404 misclassification or anomalous DB RPC.
- Rollback action: flip `TOOOLVIBES_REWARD_BACKBONE_ENABLED=0`
  (with `TOOOLVIBES_GAMIFICATION_ENABLED=0` as the upper-level kill
  switch).
- Minimum observation: **1 hour**.

### Stage 2 — Event writes ON (delivery + runtime still OFF)

- Flags:
  - adds `TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED=1`.
- Expected network: events route now accepts 401 (no token) and 200
  (with a valid authenticated token + payload). Client does NOT call
  the events route in production yet because `SignalProductBridge`
  reads the same client flag snapshot and skips emission until
  `eventWritesEnabled` AND `status === "authenticated"`. To force a
  smoke write, use the production QA account below.
- Expected DB writes: `signal_engagement_events` rows for the QA
  account's first save + first comparison.
- Smoke: production QA account signs in via magic link, saves one
  tool, completes one comparison; verify the events landed via
  `signal_engagement_events` and the grants landed via
  `signal_reward_grants` (both must show rows for the QA user only).
- Metrics: Worker 4xx/5xx on the events route; events/sec.
- Rollback trigger: any duplicate-grant anomaly (compare
  `signal_reward_grants.sp_delta` for the QA account against
  expected: 40 for first save, 15 for first comparison, 20+25 for
  mission grants); or any cross-user visibility leak.
- Rollback action: flip `TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED=0`
  (then `TOOOLVIBES_REWARD_BACKBONE_ENABLED=0` if needed).
- Minimum observation: **2 hours**.

### Stage 3 — Reward runtime + delivery + Progress Hub ON

- Flags:
  - `TOOOLVIBES_REWARD_RUNTIME_ENABLED=1`
  - `TOOOLVIBES_REWARD_DELIVERY_ENABLED=1`
  - `TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED=1`
- Expected network: client opens the reward runtime host
  (`RewardRuntimeProvider`), the delivery bridge starts polling
  `/api/signal-progression/pending` at most once on mount/visibility
  change, and the Account hub starts fetching
  `/api/signal-progression/hub` + `/api/signal-progression/preferences`.
- Expected DB writes: `signal_reward_deliveries` rows transition
  `pending` → `delivered` → `acknowledged|dismissed`; no new grants.
- Smoke: production QA account — first save triggers a Tier 1
  micro-toast (≤1.8s) and the mission achievement Tier 2 dialog;
  Account hub shows Esploratore level, missions, recent grants,
  preferences; dismiss the dialog → delivery status `acknowledged`.
- Metrics: polling frequency, dialog render time, micro-toast
  duration, ESM chunk load size for `RewardHost` (dynamic, no shared
  bundle growth).
- Rollback trigger: dialog renders without focus-trap, no escape,
  no reduced-motion respect, or polling continues after the bridge
  is unmounted; or hub shows another user's data.
- Rollback action: flip `TOOOLVIBES_REWARD_RUNTIME_ENABLED=0` (which
  gates the host and the bridge). UI remains inert.
- Minimum observation: **4 hours**.

### Stage 4 — Achievements + badge cabinet ON (milestones OFF)

- Flags:
  - `TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED=1`
  - `TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED=1`
- Expected network: Account hub now carries `badges` (array) and
  `achievementProgress` (server counters). Badge cabinet renders on
  the Account route. Server begins running
  `evaluate_signal_achievements` after every accepted event.
- Expected DB writes: `user_badges` rows (Phase 6, once-only);
  potentially new `signal_reward_grants` rows for dedicated-envelope
  achievements (stack_builder 30, radar_return 25, curator_mark 40,
  strategist 50); `level_advanced` grants (sp 0) when thresholds
  cross.
- Smoke: production QA account — verify `first_signal` is owned
  after the first save; verify the cabinet shows earned badges with
  truthful text rarity (never colour-only); verify the trajectory
  section shows at most two truthful next-milestones; verify the
  quiet history is bounded (5 most recent); verify the empty state
  if the account has zero achievements (note: this stage is unlikely
  with a prior Stage 2 save — use a fresh QA account if needed).
- Metrics: `evaluate_signal_achievements` errors (alert on any
  spike), `user_badges` insert rate (alert on anomalous
  per-user-per-day), `signal_achievements evaluate failed/threw`
  Cloudflare Worker logs.
- Rollback trigger: any spike in `user_badges` rate outside expected
  per-user cap, any cross-user visibility, or evaluate RPC errors.
- Rollback action: flip `TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED=0`
  to stop server evaluation. Cabinet (UI) remains visible without
  progress updates.
- Minimum observation: **24 hours**.

### Stage 5 — Rare milestone presentation ON

- Flags:
  - `TOOOLVIBES_REWARD_MILESTONES_ENABLED=1`
- Expected network: on a valid full milestone (level 4 Stratega or
  level 5 Cartografo), the client dynamically loads the
  `milestone-reveal` chunk (913, 3.1 kB) and the `canvas-confetti`
  chunk (1708, 10.5 kB). Dialog is modal, role=dialog, aria-modal,
  focus-trap, Escape dismiss, ≤~1.2s confetti.
- Expected DB writes: zero (the milestone envelope was already
  emitted in Stage 4 — this stage only changes presentation).
- Smoke: production QA account — manually trigger an SP boost
  (e.g. update `game_profiles.xp` via service-role admin to cross
  1800) to verify the Cartografo milestone dialog renders the full
  presentation once, then a second time same day falls back to the
  static card; verify reduced-motion + quiet mode fall back to
  static; verify confetti does not render when the document is
  hidden; verify muted sounds stay muted.
- Metrics: chunk load frequency (must be near-zero for typical
  traffic — milestones are rare), confetti chunk load latency,
  dialog dismiss latency, MilestoneReveal error rate.
- Rollback trigger: confetti fires more than once/day per user,
  dialog has no focus restoration, confetti does not respect
  reduced-motion.
- Rollback action: flip `TOOOLVIBES_REWARD_MILESTONES_ENABLED=0`.
  Milestone envelopes continue to be issued (Stage 4) but render as
  the static achievement-style card.
- Minimum observation: **7 days** (rare event — needs volume to
  confirm).

### Canary limitation

The current flag system does NOT scope by user. There is no internal
canary-account flag. The rollout stages above are **global**. The
production QA account (defined below) is the only account that
should be exercised while flags are partially ON. If a canary
rollout per account is desired, that requires an extension to the
flag registry (e.g. `TOOOLVIBES_SIGNAL_CANARY_USER_IDS`) — **not part
of Phase 7A scope** and must be added in a later phase if needed.

## Production QA account

Use a single dedicated controlled QA account only if it already
exists or can be created through the **normal application flow**
(the magic-link signup at `/account`). If neither applies, defer
the per-account verification to a later phase.

- The QA account must NOT be a real customer account.
- The QA account must NOT be used to pollute analytics (do not enable
  Reward sounds or use the account outside smoke-test scenarios).
- The QA account must be cleaned up after Stage 5 stabilisation: drop
  `signal_engagement_events`, `signal_reward_grants`,
  `signal_reward_deliveries`, `signal_mission_completions`,
  `user_badges`, `signal_reward_preferences`, `signal_user_context`
  rows for the QA user_id; reset `game_profiles.xp = 0` for that
  user_id; and (optionally) delete the auth user via `auth.admin.deleteUser`.
- The QA account is NOT to be retained as a long-lived fixture.

Cleanup SQL is **not provided** in this document because it is
production-mutating; it must be authorised explicitly in Phase 7B.

## Observability

Cloudflare Worker observability (`wrangler.jsonc`) is enabled. The
following signals are watched at each stage:

| Stage | Signals |
|---|---|
| 0 | Worker error rate, public route 4xx/5xx, `db:manifest:strict` |
| 1 | `/api/signal-progression/*` 404 vs other, Worker error rate |
| 2 | `signal_engagement_events` insert rate per minute, `signal_reward_grants` rate, events route 4xx/5xx, Cloudflare Worker `[signal-achievements] evaluate failed/threw` lines |
| 3 | `signal_reward_deliveries` pending→delivered→acknowledged transitions, micro-toast and Achievement dialog render/dismiss latencies, polling frequency, ESM chunk load size for the reward host |
| 4 | `user_badges` insert rate per minute (alert on anomalous spike), `evaluate_signal_achievements` error rate, achievement dispatch rate |
| 5 | `confetti` chunk load frequency and latency, MilestoneReveal error rate, dialog dismiss latency, suppressed-to-static fallback rate |

What must never be logged: JWTs, email addresses, raw profile
context, service-role credentials, Supabase anon keys in error
contexts.

Existing surfaces: `lib/rewards/telemetry.ts` (registered-handler
pattern, no-op in production unless an explicit consumer subscribes;
the repository intentionally does not introduce a new analytics
vendor).

## Performance budget (release baseline)

| Metric | Baseline | Stop threshold |
|---|---|---|
| Shared First Load JS | 102 kB | ≥ +2 kB without justification |
| Account route bundle | 19.2 kB / 379 kB | ≥ +5 kB / +20 kB |
| Confetti chunk (lazy) | 10.5 kB | not in shared bundle |
| Milestone chunk (lazy) | 3.1 kB | not in shared bundle |
| `/api/signal-progression/hub` request count | depends on Account visits | unexpected polling > 1/min while idle |
| `/api/signal-progression/events` request count | depends on actions | repeated identical events from one user/session |
| CLS | 0 (verified by responsive checker) | > 0.05 |
| Critical / serious Axe | 0 | any new violation on a tracked surface |
| API 5xx rate | baseline (Stage 0) | sustained > 1% over 5 min |

Repeated event writes (same `dedupe_key` from one user) trigger
the unique constraint and return `duplicate` — already verified
non-mutating. A spike in the rate of *successful* writes from one
user/session indicates a client bug; that is a stop condition.

## Stop conditions

Stop the rollout immediately (flip the offending flag to 0, or roll
back the Worker) if:

- Cross-user data appears in any `/api/signal-progression/*` response.
- `signal_reward_grants` accumulates more than expected per-action
  SP for any user (the canonical amounts are 5/8/10/15/25/30/40/50
  per event type; mission grants 15/20/25; level grants 0; see
  `lib/signal-progression/rules.ts` and the Phase 6 migration).
- `user_badges` insert rate spikes outside expected per-user-per-day
  (≤9 per user per day, the V1 catalogue size).
- `evaluate_signal_achievements` errors spike.
- Confetti fires more than once/day per user.
- Any auth-loss / sign-out does not clear the local reward queue
  (`AUTH_LOST` XState transition).
- Production flags are unexpectedly enabled.
- Another agent modifies `main` mid-rollout.
- Public smoke routes regress in 4xx/5xx or layout.

## Rollback

Prefer immediate flags-OFF containment over application rollback.

### Individual feature flag

Set the flag to `0` in `wrangler.jsonc` and redeploy. The new Worker
honours the env on next request; allow ≤1 minute for the change to
propagate globally.

### All Signal flags

Set `TOOOLVIBES_GAMIFICATION_ENABLED=0` (the kill switch). Every
Signal/Reward gate returns false. All API routes return 404. The
Client reward runtime is inert. The Account Progress Hub falls back
to its gated-off rendering.

### Cloudflare Worker version

`wrangler rollback --version <previous-version-id>`. Use the
Cloudflare dashboard or API to discover the previous successful
deployment if needed.

### Application deployment

`opennextjs-cloudflare deploy` will overwrite the live Worker. Avoid
unless flags-OFF containment is insufficient.

### Failed migration stage

Phase 7B halts between stages; no SQL rollback is planned. With
flags OFF the new schema is inert. If a SQL rollback is forced, it
must be staged separately and is NOT pre-planned here.

### Reward delivery failure

Flip `TOOOLVIBES_REWARD_DELIVERY_ENABLED=0`. Pending deliveries
remain pending; the next time the delivery bridge is enabled they
will re-surface. The client machine keeps no perpetual queue when
auth is lost (verified in unit tests).

### Duplicate-grant anomaly

Flip `TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED=0`. Investigate the
RPC trace; identify the action that bypassed dedupe; fix forward.
All grants are immutable; a compensating SP adjustment is a
separate Phase 7B+ task.

### Cross-user data exposure

Immediate stop. Set every Signal flag to 0. Roll the Worker back.
Treat the leak as a P0 incident; do NOT continue rollout until the
RLS gap is patched and verified locally AND in a fresh production
test.

### Client bundle regression

If shared First Load JS regresses materially without justification,
revert the build commit. The OpenNext build is reproducible from
the source tree.

## Production validation checklist (Phase 7B executor)

- [ ] Pre-flight: PITR verified; no partial migration present.
- [ ] Stage 0 deploy + migration executed; 24h observation clean.
- [ ] Stage 1: backbone ON, no API surface change; 1h observation clean.
- [ ] Stage 2: writes ON, QA account first save + comparison verified
  via `signal_engagement_events` / `signal_reward_grants`; 2h
  observation clean.
- [ ] Stage 3: runtime + delivery + UI ON, dialog render verified for
  the QA account; 4h observation clean.
- [ ] Stage 4: achievements + cabinet ON, `user_badges` ownership
  verified for the QA account; 24h observation clean.
- [ ] Stage 5: milestones ON, Cartografo dialog renders with confetti
  chunk loaded; static fallback verified for reduced motion, quiet
  mode, and second same-day milestone; 7d observation clean.
- [ ] Final state: all Signal/Reward flags remain at the value each
  stage requires (most end at ON); legacy flags remain OFF.
- [ ] Cleanup: QA account rows removed or rotated per the cleanup
  rule above.

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Engineering owner |  |  |  |
| Security owner |  |  |  |
| Product owner |  |  |  |
| Operations owner |  |  |  |
