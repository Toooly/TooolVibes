# Tool Detail — Legacy Layer Map (2026-07-25)

**Scope**: per-section audit of every React component, CSS class, stylesheet,
fixed/sticky surface and z-index that affects the rendered `/toools/[slug]`
route. This is the inventory that drives the clean reset.

**Convention used in this doc**:
- **GEN** = generation label (V0 legacy / V1 first round / V2 / V3 / V4 / GLOBAL)
- **KEEP** = still required after the clean reset
- **DROP** = safe to remove (or scope out of `/toools/[slug]`)
- **ADAPT** = needs a new wrapper before reuse

---

## 0. Route tree (root → leaf)

```
ROUTE /toools/[slug]
│
├── app/layout.tsx                                  [GEN: GLOBAL]
│   ├── next/font setup: Anton, Fraunces, Inter
│   ├── <RootProviders>                            [components/app/root-providers.tsx, GEN: GLOBAL]
│   │   ├── QueryClientProvider
│   │   ├── ExperienceReleaseProvider
│   │   ├── GamificationReleaseProvider + GamificationClientModes
│   │   ├── PublicToolCatalogProvider
│   │   ├── TooltipProvider
│   │   ├── OverlayProvider
│   │   ├── Toaster (sonner)
│   │   ├── MotionObserver
│   │   ├── GlobalCommandPalette       [components/app/global-command-palette.tsx]
│   │   ├── GlobalExperienceLayer       [components/app/global-experience-layer.tsx]
│   │   ├── InteractionSoundLayerV2     [components/app/interaction-sound-layer-v2.tsx]
│   │   ├── MusicAmbienceLayer          [components/app/music-ambience-layer.tsx]
│   │   ├── RouteTransitionLoader       [components/app/route-transition-loader.tsx]
│   │   ├── GameEffectsLayer            [components/gamification/game-effects-layer.tsx]
│   │   └── {children} = MarketingLayout
│   ├── <GamificationShell>            [components/gamification/gamification-shell.tsx]
│   └── {children}
│
├── app/(marketing)/layout.tsx                     [GEN: GLOBAL shell]
│   ├── <OrbitalProvider>             [components/app/orbital-system/orbital-context.tsx]
│   ├── <AccountProvider>              [components/account/account-provider.tsx]
│   ├── <DiscoveryPersistenceProvider> [components/discovery/canonical-discovery-persistence-provider.tsx]
│   ├── <CommandBar>                   [GEN: V4 shell]  fixed/sticky, z=50
│   ├── <MobileTopBar>                 [GEN: V4 shell]  sticky, z=50
│   ├── <main class="relative z-10 pt-[...] pb-mobile-nav xl:...">
│   │   ├── <PageTransition>           [components/app/page-transition.tsx]
│   │   │   └── {children} = ToolDetailPage
│   │   └── <SiteFooterV2>            [components/layout/site-footer-v2.tsx] (after main, but visually below content)
│   └── <MobileBottomNav>             [GEN: V4 shell]  fixed, z=40
│
└── app/(marketing)/toools/[slug]/page.tsx         [GEN: V4 — committed 2d4551d, NOT ACCEPTED]
    └── <div className="td4-shell">
        ├── <section className="td4-identity">         — A. Identity
        │   ├── <nav className="td4-identity__breadcrumb">
        │   ├── <div className="td4-identity__row">     — avatar + chips
        │   ├── <h1 className="td4-identity__name">     — BLINK
        │   ├── <p className="td4-identity__deck">
        │   ├── <ToolDetailCtaBar>                      [components/tool-detail/tool-detail-cta-bar.tsx] (client)
        │   │   ├── external CTA (.td4-cta--primary)
        │   │   ├── affiliate note (.td4-affiliate-note)
        │   │   ├── save icon (.td4-icon-btn)
        │   │   ├── compare icon (.td4-icon-btn)
        │   │   ├── rank chip (.td4-compare-rank) + suffix (.td4-compare-rank__suffix)
        │   │   └── shortcut CTA (.td4-cta--secondary)
        │   └── <dl className="td4-identity__meta">     — date / reading / domain / tags
        ├── <aside className="td4-score">              — B. Score
        │   ├── header / kicker / badge / value / bar
        │   ├── <ul className="td4-score__dimensions"> — 4 derived dimensions
        │   └── note (non-benchmark disclaimer)
        ├── <nav className="td4-decision-nav">         — D. In-page nav (sticky ≥1024)
        ├── <section id="td4-rationale" className="td4-rationale">  — C. Rationale (4 cards)
        ├── <section id="td4-product" className="td4-product">      — E. Product info (8 dt/dd rows)
        ├── <section id="td4-signal" className="td4-signal">         — F. Signal (honest empty)
        └── <section id="td4-alternatives" className="td4-alternatives">  — G. Alternatives (warm ivory)
            ├── heading + lede + compare link
            └── <div className="td4-alternatives__grid">
                └── <div className="td4-alternative"> x3
                    ├── <div className="td4-alternative__why">  (deterministic "Perché" caption)
                    └── <ArchiveV4ToolCard tool={alt} density="comfortable" />  [REUSE — flagged]
```

---

## 1. Per-section inventory

### A. Identity Command Surface (`.td4-identity`)
- **React owner**: `app/(marketing)/toools/[slug]/page.tsx` (server component)
- **Interactive child**: `components/tool-detail/tool-detail-cta-bar.tsx` (client)
- **CSS file**: `styles/tool-detail-v4.css`
- **Class namespace**: `.td4-identity*`, `.td4-chip*`, `.td4-cta--*`, `.td4-icon-btn`, `.td4-compare-rank*`
- **GEN**: V4 (current rebuild)
- **Fixed/sticky**: none in section; scan animation infinite (14s)
- **z-index**: none declared on identity itself; uses `var(--tv-z-content, 1)` on inner
- **Inherited global styles**: `var(--tv-accent-*)`, `var(--tv-radius-*)`, `var(--tv-space-*)`, `var(--tv-font-family-display)`, `var(--tv-weight-*)`, `var(--tv-text-*)`
- **Reused archive styles**: NONE
- **KEEP** — the new owner for identity is the right surface, but the global layout still imposes the page padding/margins via `tv-gutter-*` tokens

### B. Score Instrument (`.td4-score`)
- **React owner**: `app/(marketing)/toools/[slug]/page.tsx`
- **CSS file**: `styles/tool-detail-v4.css`
- **Class namespace**: `.td4-score*`
- **GEN**: V4
- **Fixed/sticky**: none
- **z-index**: none declared
- **Inherited global styles**: tokens as above
- **KEEP** — gold accent belongs to the score surface only (no other element in the route uses gold accents today)

### C. Editorial Rationale (`.td4-rationale`)
- **React owner**: `app/(marketing)/toools/[slug]/page.tsx`
- **CSS file**: `styles/tool-detail-v4.css`
- **GEN**: V4
- **KEEP**

### D. Decision Navigation (`.td4-decision-nav`)
- **React owner**: `app/(marketing)/toools/[slug]/page.tsx`
- **CSS file**: `styles/tool-detail-v4.css`
- **Position**: `position: sticky` only at `min-width: 1024px`; on mobile/tablet it is inline (regression-resilient: never collides with bottom nav)
- **z-index**: 5 (declared locally, **not** using `--tv-z-sticky` token — minor inconsistency)
- **GEN**: V4
- **KEEP**, but unify the z-index onto the canonical token in the next pass

### E. Product Information (`.td4-product`)
- **React owner**: `app/(marketing)/toools/[slug]/page.tsx`
- **CSS file**: `styles/tool-detail-v4.css`
- **GEN**: V4
- **KEEP**

### F. Signal Module (`.td4-signal`)
- **React owner**: `app/(marketing)/toools/[slug]/page.tsx`
- **CSS file**: `styles/tool-detail-v4.css`
- **GEN**: V4
- **KEEP** — honest empty state; no fabricated PH data

### G. Alternatives Decision Desk (`.td4-alternatives`)
- **React owner**: `app/(marketing)/toools/[slug]/page.tsx`
- **Reused component**: `ArchiveV4ToolCard` (`components/archive/archive-v4-tool-card.tsx`)
- **CSS file**: `styles/tool-detail-v4.css` (parent container) + `styles/archive-v4.css` (card anatomy) + **ad hoc overrides** (`.td4-alternatives .ar4-card { ... }` block, ~70 lines)
- **GEN**: V4 (parent) + ArchiveV4 (card) — **mixed generation**
- **PROBLEM**: the `.ar4-card` anatomy was designed for the dark Archive grid; forcing it onto an ivory surface requires per-property overrides. This is the visual legacy seam the user is reacting to.
- **KEEP** conceptually, but the card needs an **alternatives-specific adaptation** (see proposed tree in `PROPOSED_CLEAN_TREE.md`).

---

## 2. Layout wrappers affecting the route

| Layer | File | GEN | Notes |
|---|---|---|---|
| `app/layout.tsx` | root | GLOBAL | Sets up fonts (Anton/Fraunces/Inter), root providers, GamificationShell |
| `app/(marketing)/layout.tsx` | marketing | GLOBAL | Hosts CommandBar / MobileTopBar / MobileBottomNav / SiteFooterV2 / PageTransition / OrbitalProvider |
| `OrbitalProvider` | `components/app/orbital-system/orbital-context.tsx` | V2-era, still wired but not used by Tool Detail | The page does NOT call `PageOrbitShell` / `SectionOrbitProvider`, so the provider is dead weight on this route. Provider itself stays (other routes use it) but the route gets no value from it. |
| `PageTransition` | `components/app/page-transition.tsx` | V2-era | Wraps the page in a transition; not Tool-Detail-specific |
| `SiteFooterV2` | `components/layout/site-footer-v2.tsx` | V4 shell | OK to keep |
| `MobileBottomNav` | `components/layout/mobile-bottom-nav.tsx` | V4 shell | fixed, z=40 — see fixed-surface contract |
| `MobileTopBar` | `components/layout/mobile-top-bar.tsx` | V4 shell | sticky, z=50 |
| `CommandBar` | `components/layout/command-bar.tsx` | V4 shell | sticky, z=50, hidden <1280 |
| `AccountProvider` | `components/account/account-provider.tsx` | GLOBAL | KEEP |
| `DiscoveryPersistenceProvider` | `components/discovery/canonical-discovery-persistence-provider.tsx` | GLOBAL | KEEP |

---

## 3. Components and stylesheets that DO NOT match `/toools/[slug]` (legacy / orphaned)

| Item | Type | Why orphaned | Action |
|---|---|---|---|
| `styles/tool-detail.css` (649 lines) | full stylesheet | Defines `.tool-detail-hero`, `.tool-detail-breadcrumb`, `.tool-detail-facts`, `.tool-detail-profile-panel`, `.tool-detail-editorial-card`, `.tool-detail-related`, `.tool-detail-main-cta`, `.tool-detail-secondary-cta`, `.internal-tool-page`, etc. None of these classes are emitted by the current page (verified by grep across `app/(marketing)/toools/[slug]/page.tsx` and `components/tool-detail/`). Still imported via `app/globals.css`. | **DROP from globals.css import line** — keep file on disk during reset, remove import, then delete file. |
| `components/directory/directory-tool-card.tsx` + `directory-tool-glyph.tsx` | component | Previously used by the legacy page; not imported anywhere in the new page. | **DROP from any future imports** (verify zero imports before removal). |
| `NativePlacement` (legacy) | component | Not used by current page. | Keep on disk; not in current page tree. |
| `PageOrbitShell` / `SectionOrbitProvider` | component | The page does not import them. The shell layer still mounts `OrbitalProvider` but no consumer. | Provider stays for other routes; Tool Detail stays out. |
| `.premium-button*` | CSS | Re-mapped by `styles/shell.css` lines 813-851. None of `.premium-button-primary`, `.premium-button-secondary`, etc. are emitted by `/toools/[slug]` (the page uses `.td4-cta--primary` / `.td4-cta--secondary`). | The shell mappings become inert for this route; flag for removal in the reset. |

---

## 4. Reused components that need explicit alternatives-specific adaptation

`components/archive/archive-v4-tool-card.tsx` is rendered inside the Tool Detail
page **only** in section G (Alternatives Decision Desk). It brings with it:

- `.ar4-card`, `.ar4-card__top`, `.ar4-card__avatar`, `.ar4-card__name`, `.ar4-card__name-link`, `.ar4-card__category`, `.ar4-card__status`, `.ar4-card__promoted-status`, `.ar4-card__tier-pill`, `.ar4-card__desc`, `.ar4-card__metrics`, `.ar4-card__level`, `.ar4-card__score`, `.ar4-card__votes`, `.ar4-card__actions`, `.ar4-card__open`, `.ar4-card__toggles`, `.ar4-card__rank`, `.ar4-card__saved-flag`, `.ar4-card__ribbon`

All of these are emitted into the page DOM when the alternatives section renders. The current implementation applies a per-property override block in `styles/tool-detail-v4.css` (`.td4-alternatives .ar4-card { ... }` ~70 lines) to re-paint them on the ivory surface. **This is the user-flagged "incomplete adaptation"**: the override is partial, fragile, and visually inconsistent (the card carries a mix of dark and ivory semantics in the same DOM tree).

**Reset decision**: create `components/tool-detail/alternative-decision-card.tsx` that owns its own DOM and classes (`.alt-card*`) on the ivory surface, and stop importing `ArchiveV4ToolCard` from this route.

---

## 5. Fixed / sticky surfaces in the route tree

| Surface | File | z-index | bottom offset | top offset | Owner |
|---|---|---|---|---|---|
| `MobileBottomNav` | `components/layout/mobile-bottom-nav.tsx` | 40 (own) | 0 (+ safe-area + 6px) | — | V4 shell |
| `MobileTopBar` | `components/layout/mobile-top-bar.tsx` | 50 | — | 0 (sticky) | V4 shell |
| `CommandBar` | `components/layout/command-bar.tsx` | 50 | — | 0 (sticky, ≥1280 only) | V4 shell |
| `.td4-decision-nav` | `styles/tool-detail-v4.css` | 5 | — | sticky from ≥1024 | V4 (this route) |
| `td4-identity::before` scan | `styles/tool-detail-v4.css` | — | — | — | V4 (decorative, infinite 14s) |
| `td4-score__bar-fill` | `styles/tool-detail-v4.css` | — | — | — | V4 (one-shot 720ms) |

**Conflicts found**:
- `.td4-decision-nav` uses local `z-index: 5` instead of `var(--tv-z-sticky)` (=10) — minor inconsistency, not visually broken today because no other sticky surface lives in that band, but a future competing sticky element would slide under it.
- `MobileBottomNav` declares its own `z-index: 40` and the `td4-shell` has `padding-bottom: calc(7rem + env(safe-area-inset-bottom, 0))` on `max-width: 767px` — works but is a *global shell + per-route padding* coupling rather than a single owner.
- No content surface declares a bottom `0` assumption, so the stacking contract is currently sound; the problem is **how many actors know about the bottom**, not the actual pixels.

---

## 6. CSS files in the route's effective cascade (verified by import chain)

| CSS file | Owner | Affects /toools/[slug]? | Action |
|---|---|---|---|
| `app/globals.css` | GLOBAL | YES (imports the rest of the chain) | KEEP |
| `styles/tokens.css` | GLOBAL | YES (variables only) | KEEP |
| `styles/gamification.css` | GLOBAL | YES — applies shell overrides for components inside the marketing shell | KEEP but no Tool-Detail-specific rules |
| `styles/depth-scene.css` | GLOBAL | YES (no specific selectors for tool-detail) | KEEP |
| `styles/account.css` | GLOBAL | YES (account provider chip) | KEEP |
| `styles/figma-implementation.css` | GLOBAL | YES — contains `.premium-button*` legacy mappings still in cascade | DROP the `.premium-button*` definitions (no consumer on this route after reset) |
| `styles/command-bar.css` | V4 shell | YES (CommandBar at z=50) | KEEP |
| `styles/mobile-top-bar.css` | V4 shell | YES (MobileTopBar) | KEEP |
| `styles/mobile-bottom-nav.css` | V4 shell | YES (MobileBottomNav at z=40) | KEEP |
| `styles/definitive-home.css` | Home v4 | YES — but rules are scoped to `.home-*` selectors. Some may match unintended elements in this route. | AUDIT every `.home-*` selector that could leak |
| `styles/tool-detail-v4.css` | V4 (this route) | YES | KEEP, but rename to `.td-final-*` per the rebuild boundary |
| `styles/tool-detail.css` | V1 legacy | YES (imported by globals) but no matching classes in current page DOM | REMOVE IMPORT from globals, then delete file |
| `styles/archive-v4.css` | Archive v4 | YES — provides the `.ar4-card` anatomy for the alternatives section | KEEP on disk, but stop emitting those classes from `/toools/[slug]` (alternatives use a new wrapper) |
| `styles/shell.css` | V4 shell | YES — has legacy `.tool-detail-main-cta` / `.tool-detail-secondary-cta` mappings (lines 818-845) and `.tool-detail-editorial-card` / `.tool-detail-meta-block` (lines 800-801) | REMOVE the legacy `tool-detail-*` selectors from `shell.css` — no consumer |
| `styles/buttons.css` | GLOBAL | YES (button system, no specific tool-detail rules) | KEEP |
| `styles/compare.css` | Compare | YES — `.ar4-tray` rules used by ArchiveV4ToolCard | KEEP if alternatives still use the tray |
| `styles/mobile-bottom-nav.css` (z=40) and `tool-detail-v4.css` z-indices | mixed | see §5 | unify in reset |

---

## 7. Duplicated / dead rules in the v4 cascade

- `styles/tool-detail-v4.css` defines `.td4-affiliate-note` and `.td4-compare-rank__suffix` — used by `components/tool-detail/tool-detail-cta-bar.tsx`. The CTA bar also had inline `fontSize: 0.7rem` violations that were fixed by adding these classes. The CTA bar still has the inline `style={{ color: "var(--tv-accent-cyan)" }}` on a `<Link>` inside the rationale copy — minor, but should be moved to a class for hygiene.
- `styles/shell.css` contains a block at lines 800-851 that maps `.tool-detail-editorial-card`, `.tool-detail-meta-block`, `.premium-button*` etc. under `.marketing-shell :is(...)`. After reset, none of those classes will be emitted by the route — those rules become dead weight in the cascade.
- `styles/definitive-home.css` may carry `.home-*` selectors that incidentally match `td4-*` class fragments (e.g. a `.home-shell` rule could collide with the rendered `class` attribute). No concrete collision found in the current v4 build, but the new `.td-final-*` namespace must be checked against every global selector.

---

## 8. Bottom-line verdict

The current v4 surface *functions* but the route tree carries three independent generations of visual code that all leak into `/toools/[slug]`:

1. **V0/V1 legacy** (`styles/tool-detail.css` + shell legacy mappings in `shell.css`) — 100% dead on this route
2. **V3 ArchiveV4 components + CSS** — the only consumer in this route is the alternatives section, where it requires ~70 lines of override to look right on ivory
3. **V4 Tool Detail** (`td4-*`) — the new owner, but inherits the page-level concerns of bottom nav padding and a non-canonical z-index on the decision nav

A clean reset removes (1) outright, isolates (2) behind an alternatives-specific adapter component, and renames (3) to `.td-final-*` for unambiguous ownership.
