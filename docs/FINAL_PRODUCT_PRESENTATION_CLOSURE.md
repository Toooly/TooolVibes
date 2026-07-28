# Final Product Presentation Closure — 2026-07-28

## Recovery Context

This branch inherits and completes interrupted Codex work. The original session
modified the local working tree without committing, pushing, or deploying.
A backup patch was not preserved on disk; all changes were recovered from the
dirty working tree on `main`.

Branch: `recovery/final-product-presentation-closure-2026-07-28`  
Created from: `main` (uncommitted work preserved)

---

## Inherited Codex Changes — Classification

### Kept (Valid & Complete)

| File | Change | Status |
|------|--------|--------|
| `app/layout.tsx` | Font import: `{ Anton, Manrope }` replaces `{ Anton, Fraunces, Inter }` | KEPT |
| `styles/tokens.css` | `--tv-font-family-ui`: Inter→Manrope; `--tv-font-family-system`: Inter→Manrope; removed `--tv-font-family-editorial`; removed glass tokens (`--tv-glass-*`); removed `--tv-surface-translucent`; added `--tv-surface-inverted-*`; removed `--font-manrope`/`--font-rubik` aliases | KEPT |
| `styles/archive-v4.css` | Font-family: `--tv-font-mono`→`--tv-font-family-ui` or `--tv-font-family-mono`; `.ar4-ivory__title`: Fraunces→Manrope | KEPT |
| `styles/definitive-home.css` | `.def-cockpit__title`: Fraunces italic→Anton (monumental display); `.def-editorial__title`: Fraunces→Manrope; font family references migrated | KEPT |
| `styles/compare.css` | Font-family references migrated to semantic tokens | KEPT |
| `styles/mobile-bottom-nav.css` | Font-family references migrated | KEPT |
| `styles/mobile-top-bar.css` | Font-family references migrated | KEPT |
| `styles/command-bar.css` | Font-family reference migrated | KEPT |
| `styles/partner-placements.css` | Font-family reference migrated | KEPT |
| `styles/public-routes.css` | Glass→surface token migration | KEPT |
| `styles/radar.css` | Font-family references migrated | KEPT |
| `styles/shell.css` | Glass→surface token migration | KEPT |
| `styles/account.css` | `.account-journey-step`: glass→opaque surface; backdrop-filter removed | KEPT |
| `components/directory/canonical-tool-card.tsx` | Removed `backdrop-blur-sm` from score badge | KEPT |
| `components/editorial/editorial-post-card.tsx` | Surface token migration (rgba→`--tv-surface-inverted-raised`) | KEPT |
| `components/ui/section-header.tsx` | Font-family logic: h1→Anton, others→Manrope | KEPT |
| `components/collections/collection-card.tsx` | Surface migration + plural fixes ("1 aperto"/"Il tool è visibile") | KEPT |
| `components/collections/mobile-collections-view.tsx` | Plural fix ("1 raccolta"/"N raccolte") | KEPT |
| `components/tools/mobile-shortlist-board.tsx` | Plural fix ("1 salvato, ordinato") | KEPT |
| `components/tools/unified-compare-board.tsx` | Surface migration + copy fix ("più chiara") | KEPT |
| `components/home/definitive-home.tsx` | Dynamic tool count in Cockpit; "Apri Radar" label; editorial copy changes; podium subtitle update | KEPT |
| `lib/radar/radar-ui-model.ts` | Truthful Radar state language for live/stale/empty/unavailable/missing-token/error with UTC date precision | KEPT |
| `lib/radar/product-hunt-contract.ts` | `formatUtcTimeLabel`: now includes day/month/year | KEPT |
| `lib/monetization/placements.ts` | Stricter `isPublicMonetizationPlacement`: requires name, category, valid URL, editorialReason, title, ctaLabel | KEPT |
| `next.config.ts` | Guard `initOpenNextCloudflareForDev` behind `NODE_ENV === "development"` | KEPT |
| `app/(marketing)/posts/page.tsx` | Posts page restructured with semantic tokens | KEPT |
| `app/(marketing)/collections/[slug]/page.tsx` | Plural fixes, surface tokens, boundary summary alignment | KEPT |
| `app/(marketing)/collections/collections.css` | Surface token migration | KEPT |
| `app/(marketing)/shortlist/shortlist.css` | Definitive shortlist surface composition | KEPT |
| `app/globals.css` | Minor surface/contrast adjustments | KEPT |
| `components/archive/definitive-archive.tsx` | Plural fix in promoted toggle | KEPT |
| `components/collections/collection-slot-card.tsx` | ToolCard→CanonicalToolCard; surface token migration | KEPT |

### Repaired

| File | Issue | Fix |
|------|-------|-----|
| `__tests__/components/radar/radar-experience.test.tsx` | Tests expected old short UTC format (`08:05 UTC`), but `formatUtcTimeLabel` now includes the date | Updated regex patterns to match `28 lug 2026 · 08:05 UTC` (2 occurrences) |

### Codex Claim Verification

| Claim | Status |
|-------|--------|
| "public P0 fixes implemented" | CONFIRMED — all 8 P0 areas addressed |
| "42/42 targeted tests passed" | PARTIAL — radar experience tests (2) failed due to format mismatch; fixed |
| "TypeScript and lint passed" | CONFIRMED |
| "no local preview completed" | UNVERIFIABLE — no evidence of preview |
| "no commit, push or deployment" | CONFIRMED |
| "`account.css` modified" | CONFIRMED — journey step glass removal |
| "`next.config.ts` modified" | CONFIRMED — dev guard for OpenNext init |
| "`tooolvibes-next-font-mocks.cjs` rejected" | CONFIRMED — no reference exists; mock was unnecessary |

---

## Typography Result

| Role | Font | Source |
|------|------|--------|
| Monumental display | Anton (400) | `next/font/google` |
| Public UI, body, navigation, card, metadata, secondary headings | Manrope (variable) | `next/font/google` |
| Functional technical values | System monospace | `--tv-font-family-mono` |
| **REMOVED** | Fraunces | — |
| **REMOVED** | Inter | — |

All font-family consumers use semantic tokens (`--tv-font-family-ui`, `--tv-font-family-display`, `--tv-font-family-mono`). No consumer references generated font variable names (`--font-anton`, `--font-manrope`) directly outside `styles/tokens.css`.

---

## Glass Consumers Removed

| Location | Before | After |
|----------|--------|-------|
| Account journey steps | `rgba(255,255,255,0.04)` + `backdrop-filter: blur(4px)` | `var(--tv-surface-elevated)` |
| Shell mobile links | `var(--tv-glass-bg)` / `--tv-glass-bg-subtle` | `var(--tv-surface-elevated)` / `var(--tv-surface-raised)` |
| Public routes dark panels | `var(--tv-glass-bg-subtle)` | `var(--tv-surface-raised)` |
| Tokens | `--tv-glass-*` variables | Removed (blur=0, mapped to surface tokens) |
| Canonical tool card | `backdrop-blur-sm` | Removed |
| Collections slot/stat blocks | `rgba(255,255,255,0.76-0.78)` | `var(--tv-surface-inverted-raised)` |
| Compare cards | `rgba(255,255,255,0.9)` | `var(--tv-surface-inverted-raised)` |

---

## Active Exceptions

| Surface | Reason | Status |
|---------|--------|--------|
| Account page dark panels | Dark Command Center theme; legitimate dark-surface design | INTENTIONAL |
| Legacy compatibility aliases in `styles/tokens.css` | Needed until full route migration | KEPT |
| ESLint `ignoreDuringBuilds: true` in `next.config.ts` | Pre-existing lint debt (tracked in `audits/ui-cleanup-phase-0-baseline.md`) | PRE-EXISTING |
| TypeScript `ignoreBuildErrors: true` in `next.config.ts` | Pre-existing | PRE-EXISTING |
| `--surface-*` legacy compat aliases | Needed for unmigrated routes | KEPT |

---

## Contrast Fixes

- All `rgba(255,255,255,X)` translucent white panels on public routes replaced with opaque `--tv-surface-*` tokens
- No dark text on dark surfaces detected in public presentation
- No light text on light surfaces detected in public presentation
- Score badge on canonical tool card: backdrop-blur removed; uses `--tv-bg-base` which guarantees contrast on `--tv-bg-canvas`

---

## Radar States

| State | Status Label | Source Label |
|-------|-------------|--------------|
| live | LIVE | `Dati live Product Hunt · aggiornati il DD mmm YYYY · HH:MM UTC` |
| stale | ULTIMA SYNC | `Ultima classifica reale Product Hunt · DD mmm YYYY · HH:MM UTC` |
| fixture | QA FIXTURE | `Fixture QA locale · dati simulati · DD mmm YYYY · HH:MM UTC` |
| empty | NESSUN SEGNALE | Context-aware (stale/QA/verified) with date |
| missing-token | IN PAUSA | `Feed Product Hunt non configurato` |
| error | OFFLINE | `Feed Product Hunt temporaneamente non disponibile` |
| loading | CONNESSIONE | `Connessione al feed Product Hunt` |

All states expose truthful, non-fabricated copy. `canRetry` is true for error, stale, and empty states.

---

## Partner Visibility

The `isPublicMonetizationPlacement` guard now requires **all** of:
- `visible === true`
- `status === "ready"`
- Non-empty `partner.name`
- Non-empty `partner.category`
- Valid HTTPS/HTTP `partner.href`
- Non-empty `editorialReason`
- Non-empty `title`
- Non-empty `ctaLabel`

Since all placements in the current inventory have `status: "reserved"` or `"planned"` (none are `"ready"`), **all partner placements are hidden from public routes**. No empty "Prenotabile" placeholders render.

---

## Tests

- 976 passed, 10 skipped (RLS), 1 pre-existing failure (`runtime-contract.test.ts`)
- 2 tests fixed: radar experience format mismatch
- New: `tests/monetization/public-placement-guard.test.ts` (7 tests)
- Typography contract tests verified: only Manrope + Anton loaded; no Fraunces/Inter consumers
- Token contract tests verified: no circular references; no legacy font-variable consumers

---

## Build Results

| Build | Status |
|-------|--------|
| TypeScript (`tsc --noEmit`) | PASS |
| ESLint (`--max-warnings=0`) | PASS |
| Style ownership | PASS |
| Next.js production build | PASS |
| OpenNext/Cloudflare build | PASS |
| Whitespace/diff check | PASS |

---

## Remaining Work

The following are explicitly **out of scope** for this closure:

1. Full Shortlist redesign
2. Collections visual redesign
3. Posts page redesign
4. Affiliati page redesign
5. Account page full migration (partial glass removal done; rest is intentional dark theme)
6. Pre-existing `runtime-contract.test.ts` failure (npm preinstall entrypoint)
7. ESLint `react/no-unescaped-entities` debt (tracked in `audits/ui-cleanup-phase-0-baseline.md`)
8. Legacy `--surface-*` compatibility alias sunsetting

---

## Visual Validation

Screenshots stored under `audits/final-product-presentation-closure-2026-07-28/screenshots/`.

Routes inspected:
- Home (`/`)
- Archive (`/archivio`)
- Tool Detail (`/toools/[slug]`)
- Radar (`/radar`)
- Compare (`/compare`)
- Shortlist (`/shortlist`)
- Collections (`/collections`)
- Collection Detail (`/collections/[slug]`)
- Posts (`/posts`)
- Affiliati (`/affiliati`)
- Account (`/account`)

Breakpoints: 390px, 1024px, 1440px.
