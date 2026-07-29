# Motion System V1 — Canonical Foundation

Phase 1 of **TooolVibes Motion & Gamification OS**.  
Implements ownership, tokens, presets and reduced-motion only.  
Does **not** implement Signal Points, missions, achievements, confetti or grants.

## North star

**Responsive Editorial Signal System**

Motion communicates hierarchy, cause and effect, selection, state change and continuity.  
It must not become decorative noise, layout-shifting hover, perpetual parallax, or gaming chrome on the public editorial product.

## Library ownership

| Concern | Owner | Phase 1 status |
|---------|--------|----------------|
| Component state, presence, layout microinteractions | `motion` / `motion/react` | Active |
| Chrome hover, focus, pressed, simple CSS transitions | CSS tokens (`styles/tokens.css`) | Active |
| Complex signature multi-step timelines | GSAP | **Not used in production UI this phase** |
| Numeric progression | NumberFlow | **Future only** |
| Rare Tier 3 particles | canvas-confetti | **Future only** |
| Reward / celebration machines | XState | **Future only** |
| Optional smooth scroll | Lenis | Existing; disabled under reduced-motion |

Do not add another animation library.

## Source-of-truth strategy

1. **CSS** (`styles/tokens.css`) owns runtime chrome values (`--tv-duration-*`, `--tv-easing-*`, `--tv-motion-*`).
2. **TypeScript** (`lib/motion/tokens.ts`) mirrors the same numbers/curves for JS and Motion consumers.
3. **Contract tests** fail if TS and CSS drift.

Do not invent a third value system.

## Token table

| Semantic | CSS | TS (`MOTION_DURATION_MS`) | ms |
|----------|-----|---------------------------|-----|
| Instant | `--tv-duration-instant` | `instant` | 80 |
| Fast | `--tv-duration-fast` | `fast` | 120 |
| Base | `--tv-duration-base` | `base` | 180 |
| Standard chrome | `--tv-duration-slow` / `--tv-motion-base` | `standard` | 240 |
| Route | `--tv-duration-route` / `--tv-motion-route` | `route` | 280 |
| Deliberate | `--tv-duration-cinematic` | `deliberate` | 360 |
| Reward | `--tv-duration-reward` / `--tv-motion-reward` | `reward` | 480 |
| Stagger step | `--tv-duration-stagger-step` | `staggerStep` | 40 |
| Epic | `--tv-duration-epic` | `epic` | 720 |

Easing: `--tv-easing-standard`, `emphasis`, `decelerate`, `accelerate`, `spring-gentle`, `spring-smooth`, `spring-snappy`, `spring-bouncy` (reward only → `MOTION_EASING.springReward`).

## Preset table (`lib/motion/presets.ts`)

| Preset | Use | Properties |
|--------|-----|------------|
| `fadeInPreset` | Simple appear | opacity |
| `revealPreset` | Editorial enter | opacity, y |
| `pressPreset` | Tap/press | scale |
| `selectPreset` | Selected settle | scale, opacity |
| `routeTransitionPreset` | Route shell | opacity, y |
| `listItemPreset` | List enter/exit | opacity, y |
| `drawerPreset` | Sheet/drawer | opacity, y |
| `rewardSettlePreset` | Future rewards only | opacity, scale |

All presets accept `{ preferReducedMotion }` and collapse optional motion.

## Reduced-motion contract

Module: `lib/motion/reduced-motion.ts`  
Hook: `lib/hooks/use-reduced-motion.ts` (SSR snapshot `false`, then client sync — **no DOM structure fork**).

| Feature | Full motion | Reduced |
|---------|-------------|---------|
| Optional durations | token values | `0` |
| Stagger | step token | disabled |
| Transform reveals | small y/scale | opacity only or instant |
| MotionObserver choreography | on | off (`data-motion-ready=false`) |
| Route loader presentation | mobile only | off |
| Lenis / complex scroll | allowed if enabled | off |
| Confetti / epic loops | future | never |

## Allowed animation properties

- `opacity`
- `transform` / Motion `x`, `y`, `scale`
- limited `filter` on overlays only (no large blur)

## Forbidden behaviours

- Animated `height`, `width`, `top`, `left`, `margin`, `padding` for interaction polish
- Layout-shifting hover
- Perpetual loops without purpose
- Autoplay audio
- Persistent WebGL on chrome
- Confetti for normal interactions (save, filter, navigate)
- Client-decided Signal Points
- Fake progression for logged-out visitors
- New animation dependencies

## Accessibility

- Focus-visible must not rely on motion alone
- Keyboard activation gets the same Tier-0 feedback as pointer
- Celebrations (future) require `aria-live` text and Escape dismiss
- Reduced motion is first-class

## Performance

- Prefer CSS variables for chrome transitions
- Dynamic-import GSAP/confetti/NumberFlow only when a later phase needs them
- No permanent `requestAnimationFrame` loops in this foundation
- Route bundles must not grow for unused reward stacks

## Logged-out vs authenticated (motion)

| Audience | Motion |
|----------|--------|
| Logged-out | Full editorial microinteractions and route transitions |
| Authenticated | Same foundation; future reward presets only after server ack |

Gamification grants are **out of scope** for Phase 1.

## Micro-reward tiers (architecture only — not implemented)

| Tier | Intent |
|------|--------|
| T0 | Interaction confirmation (icon/state) |
| T1 | Micro reward (NumberFlow + light signal) |
| T2 | Achievement reveal |
| T3 | Rare milestone (confetti capped) |

## When to use what

| Situation | Tool |
|-----------|------|
| Button hover / Command Bar pressed | CSS tokens |
| Route shell crossfade | `routeTransitionPreset` + Motion |
| List add/remove | `listItemPreset` |
| Multi-second branded timeline | GSAP (later, route-local) |
| XP digits | NumberFlow (later) |
| Level-up rare burst | confetti (later, T3 only) |

## Migration rules for future route work

1. Import presets/tokens from `@/lib/motion` — do not hardcode `0.28` / random beziers.
2. Pass `preferReducedMotion` from `useReducedMotion()` into presets.
3. Do not redesign closed UI geometry while migrating motion ownership.
4. Leave legacy gamification animation utilities in place until a dedicated phase restyles them.
5. Never award SP from the client.

## Phase 1 migrated owners

- `components/ui/motion-observer.tsx`
- `components/app/page-transition.tsx`
- `components/app/route-transition-loader.tsx` (presentation gate)
- `styles/command-bar.css` (duration/easing vars)
- `lib/hooks/use-reduced-motion.ts`

## Remaining legacy owners (intentionally deferred)

- `components/home/scroll-reveal.tsx` (hardcoded durations — migrate in Phase 2)
- `styles/premium-motion.css`, route CSS flashes
- `components/gamification/**` motion (inactive flags; do not activate)
- GSAP setup / Lenis provider internals (RM already respected)

## Phase 2 — Public interaction system

Implemented without grants, SP, missions, confetti or migrations.

### Intensities

| Level | Duration | Uses |
|-------|----------|------|
| A | 80–180ms | save/compare fresh, chips, controls |
| B | 180–360ms | drawers, filter grid enter, route |
| C | ≤720ms | Podium entrance, compare verdict, score bar |

### GSAP

Not used in Phase 2. Signature moments use Motion + CSS tokens.

### Migrated owners (Phase 2)

- Command Bar / mobile nav markers → `layoutMarkerTransition`
- Command palette open → fade + 8px slide tokens
- Home Podium → one-shot `useOnceInView` + CSS stagger
- Archive filter grid → keyed list enter
- Radar live pulse → token duration + existing RM kill
- Compare verdict → `levelCTransition`
- Shortlist note sheet → Level B opacity/Y
- Posts reading progress → `scaleX` bar
- Tool Detail score bar → once-in-view `scaleX`
- ScrollReveal → foundation durations/RM
- Account auth tab marker → layout marker transition

## Reward runtime ownership (Phase 3)

Client reward presentation lives under `lib/rewards/*` and `components/rewards/*`.
See `docs/REWARD_RUNTIME_V1.md`. Motion presets remain the only animation source for reward UI.
Do not use confetti/GSAP/NumberFlow in the dormant host path.
