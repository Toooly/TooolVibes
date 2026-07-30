# Signal Achievements and Rewards V1 — Phase 6

Status: implemented and verified locally (2026-07-30). Production flags OFF.
Production migrations NOT applied. No deployment.

This document is the canonical reference for the Phase 6 achievement
catalogue, the badge language, the Account badge cabinet, Tier 1–3 reward
presentations and the ethical contract that governs all of them.

## North star

Signal Progression recognises **competence and useful exploration**:

- meaningful discovery (first save, curated collection journey)
- completed comparison (first verdict, five comparisons)
- curated organisation (five distinct saved tools)
- useful return (Radar on three distinct days)
- profile activation (server-verified context)
- demonstrated product understanding (levels, Cartografo)

It must never reward raw clicks, repeated toggling, idle time, refreshes,
daily attendance or chance. No punitive streaks, no progress loss, no fake
scarcity, no countdowns, no shame copy, no social comparison.

## Canonical V1 achievement catalogue

Ownership is persisted in `user_badges` (definition rows in `badges`,
`family = 'signal_v1'`). Eligibility is evaluated exclusively by the
`evaluate_signal_achievements` RPC (SECURITY DEFINER, service_role only)
against authoritative server state. The client never determines eligibility,
rarity, completion, SP bonuses, badge ownership or level advancement.

| Code | Public name | Trigger (server evidence) | Presentation | SP bonus |
|------|-------------|---------------------------|--------------|----------|
| `first_signal` | Prima traccia | first accepted `tool_saved_first_time` | merged into `save_first_tool` mission envelope (`badgeId`) | 0 |
| `first_verdict` | Primo verdetto | first accepted `comparison_completed` | merged into `complete_first_comparison` | 0 |
| `pathfinder` | Apri pista | first accepted `collection_progressed` | merged into `explore_first_collection` | 0 |
| `profile_set` | Contesto pronto | `signal_user_context.completed_at` set | merged into `complete_profile_context` | 0 |
| `stack_builder` | Stack iniziale | ≥ 5 distinct slugs in `viewer_workspaces.workspace_state.saved.slugs` | dedicated Tier 2 envelope | 30 |
| `radar_return` | Ritorno al segnale | ≥ 3 distinct `context.date` of `radar_returned` (no streak) | dedicated Tier 2 envelope | 25 |
| `curator_mark` | Segno del curatore | distinct steps ≥ authoritative `collection_tool_slots` count for one collection | dedicated Tier 2 envelope | 40 |
| `strategist` | Decisione ferma | ≥ 5 accepted distinct `comparison_completed` (dedupe per set hash) | dedicated Tier 2 envelope | 50 |
| `cartographer` | Cartografo | `calculate_signal_level(xp) = 5` | dedicated Tier 3 envelope | 0 |

SP bonuses ride the global 120 SP/UTC-day cap like every other grant.
Merged achievements deliberately grant **no** SP: the underlying action
already produced its event + mission envelopes, so ownership is persisted
without duplicate celebration or duplicate points.

`deep_read` is **deferred**: the repository has no trustworthy server-side
evidence of meaningful reading (`analysis_read` is a click event; dwell time
would be client-controlled). It will not be implemented until eligibility
can be proven without weakening the trust boundary.

## Server-owned eligibility projection

`evaluate_signal_achievements(p_user_id, p_daily_sp_cap, p_rules_version)`:

- runs after every accepted engagement event and after mission projection
  inside `acceptSignalEngagement` (every authoritative SP-changing path);
- locks `game_profiles` (`FOR UPDATE`), evaluates the whole catalogue,
  inserts `user_badges` with `ON CONFLICT DO NOTHING` (once-only);
- writes synthetic `achievement_unlocked` / `level_advanced` evidence events
  with once-only dedupe keys (`achv:<code>`, `level_adv:L<n>`);
- writes grants (unique per engagement event) + pending deliveries only for
  dedicated envelopes, and returns only **newly earned** envelopes;
- is idempotent and concurrency-safe by unique constraints;
- is callable by `service_role` only; failure never breaks the primary
  product action (the service layer degrades to zero envelopes).

### Level advancement

Ladder: 0 / 150 / 400 / 900 / 1800 SP → Esploratore, Selezionatore,
Curatore, Stratega, Cartografo. The server detects threshold crossings
during the same evaluation pass and emits a once-only `level_advanced`
envelope per reached level with **zero SP**. Tier mapping: L2/L3 →
`achievement` (Tier 2), L4/L5 → `milestone` (Tier 3). Levels recognise
accumulated useful behaviour; they never represent user worth and never
lock product features.

## Badge system

Small premium language on the reused `badges` table (extended additively):
canonical `code`, `name` (title), `description`, `a11y_description`,
`icon` (lucide icon id), `rarity` (`common` | `uncommon` | `rare` only),
`visual_intensity` (`quiet` | `standard` | `elevated`), `sort_order`,
`earnedAt` from `user_badges.awarded_at`. No legendary/mythic tiers, no
casino framing.

Legacy rows (`first_scan`, `arena_*`, `radar_prophet`, `shortlist_guardian`,
`seven_streak`) keep `family = 'legacy'`: they remain isolated behind the
legacy gamification flags and are never read by Signal surfaces. The legacy
client-side `evaluateBadges`/`checkAndAwardBadges` path is formally
deprecated (see below).

Migration also repaired table-level grants on the reused structures:
`badges` SELECT for anon/authenticated (public definitions), `user_badges`
SELECT for authenticated (own rows via RLS; INSERT still `WITH CHECK
(false)`), full DML for `service_role`, and `game_profiles` DML for
`service_role` (backend ledger access).

## Account badge cabinet

`components/account/panel/account-badge-cabinet-section.tsx`, rendered
inside the Account Signal Progress Hub and gated by
`TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED` (plus progress UI + backbone).

Structure:

1. **Earned markers** — only badges actually earned: icon, title, concise
   meaning, earned date, rarity as visible text (never colour-only).
2. **Current trajectory** — at most one or two truthful next milestones
   computed from server counters (`achievementProgress`): real counts such
   as `3/5`, no countdown, no urgency language.
3. **Quiet history** — the five most recent grants, bounded.
4. **Empty state** — explains what Signal Progression recognises and
   recommends exactly one useful next action. No manipulation.

There is deliberately **no grid of locked badges**.

## Reward tiers (Phase 6)

| Tier | Examples | Presentation |
|------|----------|--------------|
| 0 `interaction` | save/compare toggles | product motion only, no SP celebration |
| 1 `micro` | small SP grants | restrained toast ≤ 1.8s, NumberFlow, non-blocking |
| 2 `achievement` | badges, missions, L2/L3 | editorial dialog, badge line, Escape + focus restore, no confetti |
| 3 `milestone` | Stratega, Cartografo | coordinated short presentation: dialog-local confetti ≤ ~1.2s, NumberFlow, optional sound |

Tier 3 hard constraints (machine-enforced unless noted):

- `TOOOLVIBES_REWARD_MILESTONES_ENABLED` ON, else static Tier-2-style card;
- at most **1 automatic presentation per user per day** (`milestonePerDay`);
  additional valid milestones get the restrained static card and remain
  visible in Account history;
- never under reduced motion, quiet mode or `suppressMajorCelebrations`;
- never when `document.hidden` (checked at activation; the confetti effect
  re-checks before firing);
- confetti: dynamic `import("canvas-confetti")` on a dialog-local canvas,
  `disableForReducedMotion: true`, two waves ending within ≈1.2s, import
  failure degrades safely to the static card (tested);
- sound: optional, existing sound engine only (`levelUp` kind), respects
  mute + quiet mode + the audio release gate; never autoplay;
- the dialog content is the complete static accessible alternative
  (announcement text always present);
- no replay (session settled set + delivery acknowledgement).

## Neuromotivational refinements

Applied: progress visibility (hub counters, trajectory), goal gradient
(started milestones surface first), competence (achievements describe the
demonstrated skill), autonomy (preferences, manual dismissal), meaningful
completion (curated journey, explicit verdicts), recognition (badges with
meaning and date), continuity (quiet history, no streak pressure),
cause-and-effect clarity (every presentation says what happened and why).

Never used: punitive streaks, progress loss, fake scarcity, random reward
schedules, hidden probabilities, daily pressure, shame copy, urgency
countdowns, artificial social comparison, manipulative notifications,
reward bait for guests, vibration/haptics (out of scope for this phase).

## Guest / authenticated split

Guests keep the full premium product (motion, local save/compare, public
collections, Radar, editorial) and receive **no** fake SP, missions, badge
unlocks, XP or achievement popups. The Account guest state stays a
restrained, truthful preview ("Accedi per tracciare progressi reali").
Authenticated users get server-verified progression only; auth loss clears
the private reward queue immediately (`AUTH_LOST`).

## Preferences

Five preferences, local-first with server sync:

- `reduceRewardAnimations`, `muteRewardSounds`, `quietMode`,
  `suppressAutomaticAchievements` (Phase 5)
- `suppressMajorCelebrations` (Phase 6) — forces static milestone cards

Conflict strategy (unchanged): local preference applies before fetch;
authenticated server preference wins after successful fetch; explicit
current-session changes apply immediately; failed sync never reverts the
visible choice; retry is bounded and idempotent. No identity data in local
storage (key `tv.reward-prefs.v1`, schema-versioned, legacy payloads parse
with the new field defaulting to `false`).

## Feature flags

All production defaults OFF (`.env.example`):

| Flag | Independent guarantee when OFF |
|------|--------------------------------|
| `TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED` | no evaluation calls, no achievement envelopes, hub without badge payloads |
| `TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED` | no cabinet UI (also requires progress UI + backbone) |
| `TOOOLVIBES_REWARD_MILESTONES_ENABLED` | no Tier 3 module/confetti chunk; milestones render as static cards |

Existing flags (backbone, writes, runtime, delivery, progress UI,
gamification kill switch) keep their semantics; every Phase 6 gate also
requires the reward backbone, and the gamification kill switch disables all.

## Telemetry

No analytics platform was introduced. Phase 6 emits no new tracking: the
delivery/acknowledgement ledger (`signal_reward_deliveries`) is the
privacy-safe record of presentations and dismissals. If a future phase
needs product analytics, it must register a minimal, failure-isolated
handler behind an explicit owner — never raw notes, emails or page content.

## Local verification procedure

```bash
# 1. Local Supabase (Colima) running; flags ON locally only
TOOOLVIBES_GAMIFICATION_ENABLED=true
TOOOLVIBES_REWARD_BACKBONE_ENABLED=true
TOOOLVIBES_SIGNAL_EVENT_WRITES_ENABLED=true
TOOOLVIBES_REWARD_RUNTIME_ENABLED=true
TOOOLVIBES_REWARD_DELIVERY_ENABLED=true
TOOOLVIBES_SIGNAL_PROGRESS_UI_ENABLED=true
TOOOLVIBES_SIGNAL_ACHIEVEMENTS_ENABLED=true
TOOOLVIBES_SIGNAL_BADGE_CABINET_ENABLED=true
TOOOLVIBES_REWARD_MILESTONES_ENABLED=true

# 2. Live integration (10 Phase 6 tests + 12 Phase 5 tests)
TOOOLVIBES_RUN_SIGNAL_INTEGRATION_TESTS=1 \
TOOOLVIBES_SIGNAL_TEST_DB_URL=http://127.0.0.1:54321 \
TOOOLVIBES_SIGNAL_TEST_ANON_KEY=<anon> \
TOOOLVIBES_SIGNAL_TEST_SERVICE_KEY=<service> \
npx vitest run __tests__/integration/signal-achievements-live.test.ts \
                __tests__/integration/signal-progression-live.test.ts
```

Verified scenarios: first save (ownership + merged presentation + no
duplicate SP), first comparison (once-only per set), five-tool shortlist
(authoritative workspace, three-tool fraud rejected), collection journey
(pathfinder → curator only at real completion), Radar (three distinct
non-consecutive days, same-day replay deduped), profile context, level
advancement (once-only per level, zero SP, milestone from Stratega,
Cartografo badge), cross-user isolation (read/evaluate/ack/insert), hub
read model, preference round-trip.

## Production prerequisites

1. Apply `20260730000003_signal_achievements_v1.sql` to production (never
   done in this phase).
2. Enable flags gradually: achievements → cabinet → milestones, only after
   backbone/writes/delivery/runtime/progress UI are live.
3. Re-run the live integration suite against a staging clone.

## Rollback

- Flags OFF (behavioural kill switch, independently tested).
- Revert the four Phase 6 commits.
- The migration is additive (nullable/defaulted columns, seeded rows, new
  functions, grants): leaving it applied is harmless with flags OFF.

## Deferred legacy items

- Legacy arcade badge UI (`badge-unlock-modal`, `badge-unlock-toast`,
  `level-up-modal`) stays isolated behind legacy flags; not restyled, not
  activated.
- Legacy client-side badge evaluation (`lib/gamification/badge-rules.ts`,
  `checkAndAwardBadges`) is deprecated: superseded by server-owned
  evaluation. Kept for legacy surfaces while flags are off; deletion is a
  Phase 7+ decision with usage evidence.
- Arena / predictions / Vibe Rush / leaderboard / hidden signal remain
  OFF and untouched.
- `deep_read` achievement deferred (see catalogue).
