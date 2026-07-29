# Reward Runtime V1 — Client presentation layer

Phase 3 of **TooolVibes Motion & Gamification OS**.

## Trust boundary

| Actor | May decide |
|-------|------------|
| Browser / UI handlers | Never XP, eligibility, rarity, balance, grants |
| Future backend | Grant envelopes after verifying events |
| This runtime | Queue, present, dismiss **verified** envelopes only |

`enqueueVerifiedEnvelope` accepts a full envelope object. Phase 4 will feed it exclusively from server responses. Product actions (save/compare/etc.) are **not** wired in Phase 3.

## Envelope contract

See `lib/rewards/contracts.ts` (`rewardEnvelopeSchema`).

Required presentation fields: `grantId`, `eventId`, `tier`, `code`, `title`, `description`, `createdAt`, `accessibilityAnnouncement`, `rulesVersion`.

Optional trusted display: `displayDelta`, `resultingBalance`, `levelLabel`, `iconId`, `badgeId`, `priority`, `expiresAt`.

Malformed envelopes are rejected without crashing.

## Tiers

| Tier | Host behaviour |
|------|----------------|
| `interaction` | Not hosted (Tier 0 product motion only) |
| `micro` | Non-modal toast ≤1.8s |
| `achievement` | Controlled dialog, Escape/dismiss |
| `milestone` | Reserved (Tier 3) — not presented |

## Machine states

`idle → queueing → presenting → settling|dismissed → queueing`

Also: `paused`, `error` (reserved), global `AUTH_LOST` clears private queue.

Owned by XState (`lib/rewards/machine.ts`).

## Queue rules

- Dedupe by `grantId`
- Max queue 12
- Priority desc, then older first
- Session settled set prevents replay
- Expired discarded
- Caps: micro 10/hour, achievement 5/day automatic

## Preferences (local only)

Key: `tv.reward-prefs.v1`

- `reduceRewardAnimations`
- `muteRewardSounds`
- `suppressAutomaticAchievements`
- `quietMode`

No progression data. SSR-safe defaults. Schema-validated.

## Feature flags

| Flag | Default | Role |
|------|---------|------|
| `TOOOLVIBES_REWARD_RUNTIME_ENABLED` | **false** | Client host + machine |
| `TOOOLVIBES_GAMIFICATION_ENABLED` | false | Legacy game kill switch |
| `TOOOLVIBES_REWARD_BACKBONE_ENABLED` | false | Server grant RPCs (Phase 4+) |
| Surface modes (missions, arena, …) | OFF | Legacy surfaces |

Runtime flag does **not** activate Arena, Vibe Rush, missions FAB, or confetti.

## Accessibility

- Micro: `role="status"` + `aria-live="polite"`
- Achievement: `role="dialog"` + focus to dismiss + restore
- Escape dismisses achievement
- Text duplicates visual meaning
- Reduced motion: no scale/spark; same copy

## Legacy reconciliation

| Owner | Decision |
|-------|----------|
| `lib/gamification/**` actions/RPCs | **Defer** — Phase 4 secure grants |
| `game-progress-store` local XP | **Keep isolated** — do not use |
| `components/gamification/*` modals/confetti | **Keep behind legacy flags** — do not mount |
| `game-mission-panel` XState burst | **Legacy** — not the canonical machine |
| `lib/motion/*` | **Reuse** for presentation motion |
| Sound toggles | **Reuse** later for reward mute (Phase 3: mute pref stored) |

## What remains impossible until Phase 4

- Real Signal Points
- Server eligibility
- Wiring save/compare/collection events
- Persistent progress / Account cabinet
- Tier 3 confetti milestones

## Test harness

Unit fixtures: `lib/rewards/test-fixtures.ts`  
No public demo route. No production mock buttons.

## Phase 4 backbone integration

Server APIs under `/api/signal-progression/*` issue envelopes matching this contract.
`SignalDeliveryBridge` may enqueue pending envelopes when delivery flags are enabled.
Product actions remain unwired until a later phase.
