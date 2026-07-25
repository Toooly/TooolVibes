# Tool Detail — DOM & CSS Ownership Graph (2026-07-25)

A flat, per-element view of the route. Each row answers:
**"who renders this, who styles it, which generation is it, and is it still required?"**

---

## 1. DOM tree (rendered `/toools/blink`)

### 1.1 Document / shell
| Element | Owner component | Stylesheet | GEN | Required |
|---|---|---|---|---|
| `<html>` | `app/layout.tsx` | `app/globals.css`, font CSS vars | GLOBAL | KEEP |
| `<body>` | `app/layout.tsx` | `app/globals.css` | GLOBAL | KEEP |
| `<GamificationShell>` | `components/gamification/gamification-shell.tsx` | `styles/gamification.css` | GLOBAL | KEEP |
| `<div class="marketing-shell relative isolate overflow-x-clip">` | `app/(marketing)/layout.tsx` | `app/globals.css`, `styles/shell.css` | V4 shell | KEEP |
| `<OrbitalProvider>` (no consumer in this route) | `components/app/orbital-system/orbital-context.tsx` | (none direct) | V2-era | KEEP for other routes; the Tool Detail page does not register any section with it |
| `<AccountProvider>` | `components/account/account-provider.tsx` | `styles/account.css` | GLOBAL | KEEP |
| `<DiscoveryPersistenceProvider>` | `components/discovery/canonical-discovery-persistence-provider.tsx` | (none direct) | GLOBAL | KEEP |
| `<CommandBar>` (sticky, z=50) | `components/layout/command-bar.tsx` | `styles/command-bar.css` | V4 shell | KEEP (≥1280) |
| `<MobileTopBar>` (sticky, z=50) | `components/layout/mobile-top-bar.tsx` | `styles/mobile-top-bar.css` | V4 shell | KEEP (<1280) |
| `<main class="relative z-10 pt-[tv-header-height-mobile] pb-mobile-nav xl:pt-[tv-header-height] xl:pb-0">` | `app/(marketing)/layout.tsx` | `styles/shell.css` (resolves tokens) | V4 shell | KEEP |
| `<PageTransition>` | `components/app/page-transition.tsx` | (none direct) | V2-era | KEEP |
| `<SiteFooterV2>` | `components/layout/site-footer-v2.tsx` | (its own styles) | V4 shell | KEEP |
| `<MobileBottomNav>` (fixed, z=40) | `components/layout/mobile-bottom-nav.tsx` | `styles/mobile-bottom-nav.css` | V4 shell | KEEP |

### 1.2 Tool Detail page
| Element | Owner component | Stylesheet | GEN | Required |
|---|---|---|---|---|
| `<div class="td4-shell">` | `app/(marketing)/toools/[slug]/page.tsx` | `styles/tool-detail-v4.css` | V4 | RENAME to `.td-final-shell` |
| `<section class="td4-identity">` | page.tsx | tool-detail-v4.css | V4 | RENAME to `.td-final-identity` |
| `<nav class="td4-identity__breadcrumb">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<div class="td4-identity__row">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-identity__avatar">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<img>` (favicon) | page.tsx | (none) | V4 | KEEP |
| `<div class="td4-identity__chips">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-chip td4-chip--category">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-chip td4-chip--level">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-chip td4-chip--toolOfWeek">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-chip td4-chip--featured">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<h1 class="td4-identity__name">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<p class="td4-identity__deck">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| **`<ToolDetailCtaBar>` (client)** | `components/tool-detail/tool-detail-cta-bar.tsx` | tool-detail-v4.css | V4 | RENAME component to `ToolDetailFinalCtaBar`; classes to `.td-final-*` |
| `<a class="td4-cta--primary">` | ToolDetailCtaBar | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-affiliate-note">` | ToolDetailCtaBar | tool-detail-v4.css | V4 | RENAME |
| `<button class="td4-icon-btn">` (save) | ToolDetailCtaBar | tool-detail-v4.css | V4 | RENAME |
| `<button class="td4-icon-btn">` (compare) | ToolDetailCtaBar | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-compare-rank">` | ToolDetailCtaBar | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-compare-rank__suffix">` | ToolDetailCtaBar | tool-detail-v4.css | V4 | RENAME |
| `<Link class="td4-cta--secondary">` | ToolDetailCtaBar | tool-detail-v4.css | V4 | RENAME |
| `<dl class="td4-identity__meta">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<aside class="td4-score">` | page.tsx | tool-detail-v4.css | V4 | RENAME to `.td-final-score` |
| `<div class="td4-score__header">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-score__kicker">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-score__badge">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<div class="td4-score__value">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-score__number">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-score__denom">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<div class="td4-score__bar">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-score__bar-fill">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<ul class="td4-score__dimensions">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<li class="td4-score__dim">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-score__dim-label">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<span class="td4-score__dim-value">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<p class="td4-score__note">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<nav class="td4-decision-nav">` | page.tsx | tool-detail-v4.css | V4 | RENAME; unify z-index onto `--tv-z-sticky` |
| `<a class="td4-decision-nav__link">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<section class="td4-rationale">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<p class="td4-section-eyebrow">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<h2 class="td4-section-title">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<div class="td4-rationale__grid">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<article class="td4-rationale__card">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<article class="td4-rationale__card td4-rationale__card--cautions">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<section class="td4-product">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<dl class="td4-product__grid">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<div class="td4-product__row">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<dt>` / `<dd>` | page.tsx | tool-detail-v4.css | V4 | KEEP (semantic) |
| `<section class="td4-signal">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<p class="td4-signal__empty">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<section class="td4-alternatives">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<p class="td4-alternatives__eyebrow">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<h2 class="td4-alternatives__title">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<p class="td4-alternatives__lede">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<div class="td4-alternatives__heading-row">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<Link class="td4-alternatives__compare-link">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<div class="td4-alternatives__grid">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<div class="td4-alternative">` (x3) | page.tsx | tool-detail-v4.css | V4 | RENAME |
| `<div class="td4-alternative__why">` | page.tsx | tool-detail-v4.css | V4 | RENAME |
| **`<ArchiveV4ToolCard tool={alt} density="comfortable">`** (x3) | `components/archive/archive-v4-tool-card.tsx` | `styles/archive-v4.css` | Archive v4 | **REPLACE with `AlternativeDecisionCard`** in reset |
| `<article class="ar4-card">` (x3) | ArchiveV4ToolCard | archive-v4.css + td4 overrides | Archive v4 | REPLACE in reset |
| `.ar4-card__top` ... `.ar4-card__ribbon` | ArchiveV4ToolCard | archive-v4.css + td4 overrides | Archive v4 | REPLACE in reset |

---

## 2. CSS ownership graph

The cascade reaches `/toools/[slug]` in this order (top of file is closest to source order, but specificity / layer order rules apply):

```
app/globals.css
  ├── @import styles/tokens.css                       [GLOBAL — variables only]
  ├── @import styles/gamification.css                  [GLOBAL — shell hooks]
  ├── @import styles/depth-scene.css                   [GLOBAL — no /toools/blink rules]
  ├── @import styles/account.css                       [GLOBAL — account chip]
  ├── @import styles/figma-implementation.css          [GLOBAL — .premium-button* legacy]
  ├── @import styles/command-bar.css                   [V4 shell — CommandBar]
  ├── @import styles/mobile-top-bar.css                [V4 shell — MobileTopBar]
  ├── @import styles/mobile-bottom-nav.css             [V4 shell — MobileBottomNav]
  ├── @import styles/definitive-home.css               [Home v4 — .home-* selectors; no direct /toools/blink rules]
  └── @import styles/tool-detail-v4.css                [Tool Detail V4 — .td4-*]
  │   ├── @import styles/archive-v4.css ? (NO — archive-v4 is imported separately)
  │   └── @layer components:                         (overrides for premium-button on .td4-shell)
  │       └── @media (...) : ...                      (responsive bands)
  └── styles/archive-v4.css                            [Archive v4 — .ar4-card — only emitted when ArchiveV4ToolCard is rendered]
  └── styles/shell.css                                 [GLOBAL shell — has .tool-detail-* legacy selectors that no current page emits]
  └── styles/buttons.css                               [GLOBAL buttons]
  └── styles/compare.css                               [Compare / tray]
  └── styles/account.css / etc.                        [GLOBAL]
  └── styles/legacy / styles/home.css / etc.           [legacy but imported]
```

---

## 3. Style files that affect `/toools/[slug]` (with their effective selectors on this route)

Verified by searching for selectors in the route's effective DOM. ✅ = rule matches; ❌ = dead; ⚠ = matches and is a "scope leak" risk (e.g. global `.home-*` rule that incidentally matches a `td4-*` class fragment).

| File | Effective on /toools/[slug] | Notes |
|---|---|---|
| `styles/tokens.css` | ✅ variables only | defines `--tv-accent-*`, `--tv-radius-*`, `--tv-space-*`, `--tv-text-*`, `--tv-z-*`, `--tv-header-height*` — all consumed |
| `styles/gamification.css` | ✅ via `.marketing-shell` wrapper | might style inherited elements indirectly |
| `styles/definitive-home.css` | ⚠ check `.home-*` for collisions | currently no `td4-*` collision found, but the namespace is fragile |
| `styles/tool-detail-v4.css` | ✅ primary | 68 `.td4-*` classes, all live |
| `styles/archive-v4.css` | ✅ ONLY for `.ar4-card` instances inside alternatives | 14+ selectors all become live the moment a single `ArchiveV4ToolCard` mounts |
| `styles/shell.css` | ❌ legacy `.tool-detail-*` selectors are dead on this route | `.premium-button*` mappings also dead on this route |
| `styles/tool-detail.css` | ❌ fully dead on this route | every class it defines is absent from the current page DOM |
| `styles/command-bar.css` | ✅ via CommandBar | z=50 sticky ≥1280 |
| `styles/mobile-top-bar.css` | ✅ via MobileTopBar | z=50 sticky <1280 |
| `styles/mobile-bottom-nav.css` | ✅ via MobileBottomNav | z=40 fixed |
| `styles/buttons.css` | ❌ no button on this route uses `.premium-button*` | dead on this route (KEEP globally) |
| `styles/compare.css` | ⚠ if ArchiveV4ToolCard mounts, tray CSS becomes live in the cascade even if no tray shown | isolate via alternatives-specific wrapper |
| `styles/figma-implementation.css` | ❌ `.premium-button*` mapping is dead on this route | KEEP globally, no /toools/blink rules |
| `styles/account.css` / `styles/depth-scene.css` | ⚠ no direct /toools/blink selectors | KEEP globally |

---

## 4. Duplicate selectors and conflicts found

| Selector | Defined in | Used by | Conflict |
|---|---|---|---|
| `.premium-button-primary` | `styles/buttons.css`, `styles/figma-implementation.css`, `styles/shell.css:828-837` | legacy V1 page (NOT current) | No consumer on `/toools/[slug]` after reset — safe to keep global, no impact on route |
| `.premium-button-secondary` | same 3 files | legacy V1 | same |
| `.tool-detail-main-cta` / `.tool-detail-secondary-cta` / `.tool-detail-editorial-card` / `.tool-detail-meta-block` | `styles/tool-detail.css` (V1) + `styles/shell.css:800-851` (V4 shell mapping) | none on this route | dead, KEEP only on disk; remove from cascade |
| `.internal-tool-page` / `.internal-page` | `styles/tool-detail.css` | `app/(marketing)/posts/[slug]/page.tsx`, `app/(marketing)/collections/[slug]/page.tsx` only | dead on `/toools/[slug]` |
| `.ar4-card` … `.ar4-card__ribbon` | `styles/archive-v4.css` | Archive page, alternatives section | scoped by `.td4-alternatives .ar4-card { ... }` overrides — leaky |
| `.home-*` (definitive-home.css) | global | only emitted by Home page | no current leak on /toools/blink but namespace is fragile; verify after rename |
| `z-index: 5` (local) on `.td4-decision-nav` | `styles/tool-detail-v4.css:688` | this route | should be `var(--tv-z-sticky)` (=10) for consistency with the token system; flagged as a minor inconsistency, not a visible bug today |
| `z-index: 41` on `.ar4-tray` | `styles/archive-v4.css:863` | archive page tray (visible if alternatives wrapper still has a tray) | already explicit; OK |
| `z-index: 40` on `.mobile-bottom-shell` | `styles/mobile-bottom-nav.css:15` | V4 shell | explicit, OK |
| `z-index: 50` on `.mobile-top-bar` / `.command-bar` | mobile-top-bar.css:14, command-bar.css:20 | V4 shell | explicit, OK |

---

## 5. Sticky/fixed surface interaction map

```
[ main content scroll ]
       │
       ▼ (z=10  main, z=5  td4-decision-nav, z=1 td4-identity-inner)
       │
   ┌───┴────────────────────────────┐
   │  page content (sections)       │
   │                                │
   │  (z=50  sticky  top)            │  ← MobileTopBar / CommandBar
   │  (z=10  sticky  top, ≥1024)    │  ← .td4-decision-nav (currently 5)
   │                                │
   │  (no z, no position) content   │
   │                                │
   │  (z=40  fixed  bottom)         │  ← MobileBottomNav
   │  (z=41  fixed  bottom)         │  ← ArchiveV4 tray (only if user has >0 compare)
   │                                │
   └────────────────────────────────┘
```

**Problems**:
1. The decision nav uses `z-index: 5` instead of `--tv-z-sticky` (=10). It works because nothing else lives in that band on this route, but it is not a contract — a future topbar surface could land on top of it.
2. The padding-bottom on `td4-shell` (mobile) is computed against an external assumption about bottom nav height. That coupling is implicit.
3. ArchiveV4 tray (`z=41`) is owned by a different component family and reacts to the same user data as the new Tool Detail CTA. The two never collide because the CTA is inline and the tray is bottom-fixed, but the layering is governed by two unrelated z-index systems.

---

## 6. Data and store ownership (must NOT be removed)

| Concern | File | Owner |
|---|---|---|
| `computeEditorialScore` (canonical, 8.4 for Blink) | `lib/data/editorial-score.ts` | KEEP — single source of truth |
| `deriveTrend`, `deriveVotes`, `deriveScoreDimensions`, `buildAlternativeWhy` | `lib/data/tool-detail-derivation.ts` | KEEP (tests: 15 green) |
| Tool Public View | `lib/data/tool-public-view.ts` | KEEP |
| Save / Compare workspace store + MIN=2 / MAX=5 | `lib/stores/tool-workspace-store.ts`, `lib/discovery/workspace-constants.ts` | KEEP |
| `ShortlistToggle` / `CompareToggle` | `components/tools/` | KEEP (the CTA bar uses them via the store) |
| SEO (`generateMetadata`, `generateStaticParams`) | page.tsx | KEEP |

---

## 7. Verdict

The route tree is **a three-generation hybrid**. A clean reset must:

1. Remove the import of `styles/tool-detail.css` from `app/globals.css` and delete the file.
2. Remove the legacy `.tool-detail-*` and `.premium-button*` mappings from `styles/shell.css` that affect no current consumer.
3. Replace `ArchiveV4ToolCard` in the alternatives section with a new `components/tool-detail/alternative-decision-card.tsx` that owns its own `.alt-card*` namespace, dropping the cross-family override block.
4. Rename the new `td4-*` namespace to `td-final-*` and the page to `components/tool-detail/tool-detail-final-page.tsx` (or co-locate in a `tool-detail-final/` folder).
5. Unify the decision nav's z-index onto `var(--tv-z-sticky)`.
6. Establish a single fixed-surface stacking contract (see `FIXED_SURFACE_CONTRACT.md`).
7. Verify `styles/definitive-home.css` does not incidentally match any `td-final-*` class.
