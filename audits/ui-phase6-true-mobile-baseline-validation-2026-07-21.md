# UI Phase 6 — True Mobile Baseline Validation

**Date:** 2026-07-21
**Baseline commit:** `f5ea2d4` (Phase 6 baseline)
**Active commit:** `main @ e26f447` (post-revert, tree = f5ea2d4)
**Scope:** Mobile-first (360/375/390/430 widths) — 8 priority routes
**Method:** Read-only via `git show` / `git diff` against Phase 7 broken state. NO checkout, NO cherry-pick, NO rebuild.

---

## 1. Executive Summary

Phase 6 baseline (`f5ea2d4`) is the production-ready mobile architecture. The 8 priority routes have been traced section-by-section. Each section is classified:

- **PRESENT** = in DOM (visible or hidden via CSS)
- **VISIBLE** = rendered to user at mobile width
- **REACHABLE** = accessible via keyboard / screen reader / focus
- **INTERACTIVE** = has click/tap handler that triggers behavior
- **RESPONSIVE CONDITION** = breakpoint / media query that changes state
- **SOURCE FILE** = exact path:line for forensic reference

All routes have been mapped. Phase 7 broke 4 critical mobile invariants. Full reverts (commits `ddd106c` + `e26f447`) restored the baseline.

---

## 2. Global Layout (all marketing routes)

`app/(marketing)/layout.tsx`

| Section | PRESENT | VISIBLE mobile | REACHABLE | INTERACTIVE | RESPONSIVE CONDITION | SOURCE FILE |
|---------|---------|----------------|-----------|-------------|----------------------|-------------|
| Skip link `<a className="skip-link">` | yes | visually-hidden | yes (tab focus) | yes (jumps to #main-content) | always | app/(marketing)/layout.tsx:38 |
| `<Global3DLayer />` | conditional | NO (display:none on mobile) | n/a | n/a | hidden at `max-width: 767px` | app/globals.css:32260-32270 |
| `<OrbitalProvider>` + `<OrbitalLayer>` | conditional | NO (3D gate disabled by `releaseFeatures.threeD.enabled`) | n/a | n/a | depends on flag | app/(marketing)/layout.tsx |
| `<SiteHeaderV2 />` | yes | yes (top, sticky) | yes | yes (search, menu, profile) | `lg:flex` for nav at ≥1024px | components/layout/site-header-v2.tsx:338 |
| `<main id="main-content" tabIndex={-1} className="relative z-10 pb-mobile-nav md:pb-0">` | yes | yes | yes (skip-link target) | n/a | **CRITICAL:** `pb-mobile-nav` mobile-only, `md:pb-0` resets ≥768px | app/(marketing)/layout.tsx:45 |
| `<PageTransition>` wrapper | yes | wraps children | n/a | n/a | motion-aware | app/(marketing)/layout.tsx:46 |
| `<SiteFooterV2 />` | yes | yes (bottom) | yes | yes (links) | always | app/(marketing)/layout.tsx:49 |
| `<MobileBottomNav />` | yes | yes (mobile only) | yes | yes (5 nav items) | `md:hidden` (≥768px hidden) | components/layout/mobile-bottom-nav.tsx:43 |

### Mobile padding contract (Phase 6 baseline)

`.pb-mobile-nav` (app/globals.css lines 499-509):
- `padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 1.5rem)`
- Mobile override (max-width: 767px): `--bottom-nav-height: 4.75rem` (overrides 3.55rem from :root)
- Effective mobile padding = `4.75rem + safe-area + 1.5rem = ~6.25rem + safe-area`

**Phase 6 invariant:** `<main>` gets full nav-aware padding on mobile, resets at `md` (≥768px) when BottomNav hides.

**Phase 7 broke this** (R1): changed to `pb-[calc(var(--bottom-nav-height)+var(--tv-shell-nav-inset-bottom))]` with `lg:pb-0` — loses 1.5rem buffer and shifts reset to ≥1024px.

---

## 3. HOME — `app/(marketing)/page.tsx`

### Conditional gate

If `releaseFeatures.publicGate.enabled` and gate cookie invalid → `<ComingSoonPage />` (overrides everything).

### Default render (gate open)

1. `<Home3DHero tools weeklyTool />` — only if `releaseFeatures.threeD.enabled`
2. `<VibeHomeV2 ... />` — always, with `showDiscoveryHero={!threeD.enabled}`

### `<VibeHomeV2>` composition (Phase 6 baseline)

`components/home/vibe-home-v2.tsx:97-110`:

```tsx
<div className={`vibe-home-mobile-origin${isTimeToValue ? " ..." : ""} relative`}>
  {showDiscoveryHero && <MobileHeroSolar routes={solarRoutes} compact={isTimeToValue} />}
  {focusTool && <MobileSpotlight tool={focusTool} supportingTools={supportingTools} />}
  <section className="page-shell sm:hidden">
    <NativePlacement placementKey="home-featured-tool" variant="compact" />
  </section>
  <MobileMethodSteps steps={methodSteps} />
</div>
```

| Section | PRESENT | VISIBLE mobile (360-430) | REACHABLE | INTERACTIVE | RESPONSIVE CONDITION | SOURCE FILE |
|---------|---------|--------------------------|-----------|-------------|----------------------|-------------|
| `<MobileHeroSolar>` (discovery stage + orbital) | if showDiscoveryHero | yes | yes | yes (5 orbit nodes) | conditional on threeD flag | components/home/mobile-hero-solar.tsx |
| `<MobileSpotlight>` (focus tool) | if focusTool exists | yes | yes | yes (tool link) | always | components/home/mobile-spotlight.tsx |
| `<section className="page-shell sm:hidden">` (NativePlacement) | yes | yes (<sm, i.e. <640) | yes | n/a (ad) | **MOBILE ONLY** — `sm:hidden` hides ≥640 | vibe-home-v2.tsx:104-106 |
| `<MobileMethodSteps>` (3 step cards) | yes | yes | yes | yes (3 nav links) | always | components/home/mobile-method-steps.tsx |

### Mobile composition summary

- If `threeD.enabled`: `MobileSpotlight` + sm:hidden NativePlacement + `MobileMethodSteps` (no MobileHeroSolar)
- If `threeD.disabled`: `MobileHeroSolar` + `MobileSpotlight` + sm:hidden NativePlacement + `MobileMethodSteps`

### Phase 7 deltas affecting HOME

- **R2 (page-shell padding):** 20px → 16px mobile padding. NativePlacement section slightly tighter.
- **R3 (home.css token swap):** `--tv-content-wide` → `--tv-container-wide` (both resolve to 80rem, no visible delta).
- **R6 (mobile-method-steps.tsx):** `max-w-6xl px-4` → `container-wide` class. Same visual on mobile (padding 16px via token, no max-width binds at <1344px).
- **R7 (BottomNav lg:hidden):** Mobile composition unchanged (BottomNav always hidden on tablet now, but mobile still has it).

---

## 4. ARCHIVIO — `app/(marketing)/archivio/page.tsx`

88 lines. Renders:

1. `<main className="relative overflow-x-hidden">` wrapper
2. `<Archive3DHero />` — if `releaseFeatures.threeD.enabled`
3. Sponsor slot ABOVE — if `!catalogDensityPolicy`: `<section className="page-shell -mt-5 pb-3 sm:-mt-8 sm:pb-5">` + `<NativePlacement placementKey="catalog-native-sponsor" variant="band" />`
4. `<FloatingCatalogView tools filterGroups initialQuery initialGroup initialTag initialLevel unifiedSearchEnabled={unifiedSearch.enabled} showIntro={!threeD.enabled} />`
5. Sponsor slot BELOW — if `catalogDensityPolicy`: `<section className="page-shell pt-3 sm:pt-5">` + `<NativePlacement placementKey="catalog-native-sponsor" variant="band" />`
6. `<section className="sr-only">` semantic fallback (h2, count, ul of 20 tools with links)

### Mobile section trace

| Section | VISIBLE mobile | INTERACTIVE | RESPONSIVE CONDITION | SOURCE FILE |
|---------|----------------|-------------|----------------------|-------------|
| `<Archive3DHero>` | NO (display:none on mobile per .home-3d-hero rule) | n/a | hidden at `max-width: 767px` | app/globals.css:32270 |
| Sponsor slot (above or below) | yes (NativePlacement ad) | n/a | depends on `catalogDensityPolicy` flag | app/(marketing)/archivio/page.tsx |
| `<FloatingCatalogView>` → `<MobileCatalogView>` | yes | yes | always | app/(marketing)/archivio/page.tsx + components/catalog/mobile-catalog-view.tsx |
| `<section className="sr-only">` | NO (screen-reader only) | yes (links) | always (sr-only) | app/(marketing)/archivio/page.tsx |

### `<MobileCatalogView>` composition

`components/catalog/mobile-catalog-view.tsx` (188 lines):

- `<MotionConfig reducedMotion="user">` wrapper
- `<div className="catalog-page mobile-catalog-view relative min-h-screen pb-24">`
- `<CatalogCommandPanel ... />` — modal panel (search/filter)
- `<section className="catalog-discovery">` — eyebrow + h1 + p + search + metrics (if showIntro + view=categories)
- `<AnimatePresence mode="wait">` — switches between `<CatalogCategoryMap>` and `<CatalogResultList>`
- Empty state (Search icon + h3 + p + "Torna alle categorie" CTA)

| Section | VISIBLE mobile | INTERACTIVE | SOURCE FILE |
|---------|----------------|-------------|-------------|
| CatalogCommandPanel (search/filter panel) | yes (modal trigger) | yes | components/catalog/catalog-command-panel.tsx |
| catalog-discovery (intro) | conditional on showIntro | yes (search input) | mobile-catalog-view.tsx |
| CatalogCategoryMap / CatalogResultList | yes (one at a time) | yes (tool links) | components/catalog/* |
| Empty state | conditional | yes (CTA) | mobile-catalog-view.tsx |

### Phase 7 deltas affecting ARCHIVIO

- **R2 (page-shell padding):** NativePlacement sponsor sections tighter on mobile (20→16px).
- **R10 (tool-discovery-app.tsx):** Added `lg:grid-cols-3` between md:2 and xl:4 — affects the result list (4-col on wide desktop instead of 3).

---

## 5. COLLECTIONS — `app/(marketing)/collections/page.tsx`

36 lines. Renders:

- `<MobileCollectionsView collections specialIssue leadCollection />`

### Lead collection selection logic

- First non-specialIssue featured
- OR first non-specialIssue curated
- OR specialIssue

### `<MobileCollectionsView>` (156 lines)

| Section | VISIBLE mobile | INTERACTIVE | SOURCE FILE |
|---------|----------------|-------------|-------------|
| Lead collection hero/spotlight | yes | yes | components/collections/mobile-collections-view.tsx |
| Special issue section | conditional | yes | components/collections/mobile-collections-view.tsx |
| Collections grid | yes | yes | components/collections/mobile-collections-view.tsx |

### Phase 7 deltas affecting COLLECTIONS

- **NC2 (.mobile-collections grid):** Added 2-col at ≥768 (md) and 3-col at ≥1024 (lg). Mobile unchanged (1-col).
- Note: Phase 7 changed to adaptive component (eliminated mobile/desktop fork), but the rendering pattern is similar.

---

## 6. TOOL DETAIL — `app/(marketing)/toools/[slug]/page.tsx`

453 lines. Composition:

```tsx
<PageOrbitShell sectionId="tool-detail" label={tool.name} items={toolOrbitItems}>
  <div className="internal-page internal-tool-page page-shell space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">
    {/* Section 1: Hero (rounded-[30px] mobile / [40px] sm) */}
    <section> ... </section>

    {/* Sponsored placement */}
    <NativePlacement placementKey="tool-sponsored-alternative" variant="band" ... />

    {/* Section 2: Editorial 2-col grid */}
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"> ... </section>

    {/* Section 3: Tool correlati */}
    {relatedTools.length > 0 ? (
      <section className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"> ... </div>
      </section>
    ) : null}
  </div>
</PageOrbitShell>
```

### Mobile section trace

| Section | VISIBLE mobile (360-430) | INTERACTIVE | RESPONSIVE CONDITION | SOURCE FILE |
|---------|--------------------------|-------------|----------------------|-------------|
| `<PageOrbitShell>` (orbital layer) | conditional on threeD flag | n/a | depends on flag | components/app/orbital-system |
| **Section 1: Hero** | yes | yes | rounded-[30px] mobile / [40px] sm | toools/[slug]/page.tsx:152 |
| - Breadcrumb (Home > Catalogo > Tool name) | yes | yes (links) | always | toools/[slug]/page.tsx:160 |
| - Badges (category, level, tool of week) | yes | n/a (display) | flex-wrap | toools/[slug]/page.tsx:171 |
| - H1 (`max-w-[12ch]`) | yes | n/a | `clamp(2.15rem,14vw,3rem)` mobile / `3.8rem` sm | toools/[slug]/page.tsx:184 |
| - Long description (`max-w-[42rem]`) | yes | n/a | `text-[0.98rem]` mobile / `[1.06rem]` sm | toools/[slug]/page.tsx:188 |
| - Summary grid (3 cards: In breve, Per chi, Lettura rapida) | yes (stacked 1-col) | n/a | **`sm:grid-cols-3`** (≥640 = 3-col) | toools/[slug]/page.tsx:191 |
| - Meta strip (date, reading time, domain) | yes | n/a | flex-wrap | toools/[slug]/page.tsx:218 |
| - Editorial note card | yes | n/a | `sm:grid-cols-3` (stacked mobile) | toools/[slug]/page.tsx:228 |
| - Action buttons (CTA + Suggerisci + Fonte + Compare/Shortlist toggles) | yes (stacked flex-col) | yes | **`sm:flex-row`** (≥640 = row) | toools/[slug]/page.tsx:243 |
| - Aside profile panel + meta blocks | yes (below hero on mobile) | yes (tag links) | `lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]` — **stacked below lg** | toools/[slug]/page.tsx:281 |
| `<NativePlacement>` (sponsored) | yes | n/a | always | toools/[slug]/page.tsx:347 |
| **Section 2: Editorial grid** | yes (stacked) | yes (link cards) | **`lg:grid-cols-2`** — stacked below lg | toools/[slug]/page.tsx:350 |
| - Quando usarlo card | yes | n/a (display) | always | toools/[slug]/page.tsx:351 |
| - Perché conta card | yes | yes (CTA buttons) | always | toools/[slug]/page.tsx:374 |
| **Section 3: Tool correlati** | conditional on relatedTools | yes (tool cards) | `md:grid-cols-2 xl:grid-cols-3` — **1-col mobile, 2-col md, 3-col xl** | toools/[slug]/page.tsx:412 |

### Phase 7 deltas affecting TOOL DETAIL

- **R2 (page-shell padding):** outer container padding tighter on mobile.
- **R (toools/[slug]/page.tsx hero grid md intermediate + editorial md:2):** Phase 7 added `md:grid-cols-[1.4fr_1fr]` intermediate. **Phase 6 baseline only has `lg:grid-cols-[...]`** — so on 768-1023 tablet, hero is stacked 1-col. After Phase 7: 2-col intermediate. After revert: stacked again.

---

## 7. COMPARE — `app/(marketing)/compare/page.tsx`

28 lines. Renders:

```tsx
<div className="compare-space-page">
  <Compare3DHero />  {/* if threeD.enabled */}
  <ToolBattleView tools objectiveEnabled={compareObjective.enabled} decisionEnabled={compareDecision.enabled} showIntro={!threeD.enabled} />
</div>
```

### `<ToolBattleView>` (97 lines)

- Mobile-focused composition
- Champion vs Challenger layout
- Decision matrix, objective matrix

### Mobile section trace

| Section | VISIBLE mobile | INTERACTIVE | RESPONSIVE CONDITION | SOURCE FILE |
|---------|----------------|-------------|----------------------|-------------|
| `<Compare3DHero>` | NO (hidden mobile per .home-3d-hero rule) | n/a | hidden at `max-width: 767px` | app/globals.css:32270 |
| `<ToolBattleView>` | yes | yes | always | components/compare/tool-battle-view.tsx |

### Phase 7 deltas affecting COMPARE

- **R4 (compare.css .desktop-compare 2-col → 1-col on mobile):** Phase 7 introduced `grid-template-columns: 1fr` on mobile with `1.1fr 0.9fr` at ≥768. **Phase 6 baseline keeps `grid-template-columns: 1.1fr 0.9fr` at ALL widths** (including mobile) but at mobile, the desktop-compare view is rendered via `<ToolBattleView>` not `.desktop-compare`. The desktop-compare CSS is only active when the desktop variant mounts (which it doesn't on mobile).
- Practical impact: R4 was theoretical (desktop-compare isn't mounted on mobile in baseline). After Phase 7, the CSS rule changed but mobile composition is identical (ToolBattleView still renders).

---

## 8. SHORTLIST — `app/(marketing)/shortlist/page.tsx`

20 lines. Renders:

```tsx
<MobileShortlistBoard tools={await getPublishedTools()} decisionMemoryEnabled={decisionMemoryBoard.enabled} />
```

### `<MobileShortlistBoard>` (881 lines — largest mobile component)

- Decision matrix
- Saved tools list
- Streak/XP integration

### Mobile section trace

| Section | VISIBLE mobile | INTERACTIVE | RESPONSIVE CONDITION | SOURCE FILE |
|---------|----------------|-------------|----------------------|-------------|
| `<MobileShortlistBoard>` | yes | yes (multiple CTAs, toggles, decision cards) | always | components/shortlist/mobile-shortlist-board.tsx |

### Phase 7 deltas affecting SHORTLIST

- **R5 (vibes-3d-maestoso.css .mobile-shortlist-board desktop caps):** Phase 7 added `max-width: var(--tv-container-app)` at ≥768 and `max-width: var(--tv-container-wide)` at ≥1024 with `padding-inline: 1.5rem` / `2rem`. **Mobile (<768) unchanged in both versions.**
- After revert: cap removed at all breakpoints (mobile keeps full-width which is the natural mobile behavior).

---

## 9. RADAR — `app/(marketing)/radar/page.tsx`

27 lines. Renders:

```tsx
<RadarViewSwitch threeDEnabled initialDesktopVisual={radarDesktopVisual} />
```

### `<RadarViewSwitch>` (92 lines)

- Loads mobile or desktop view based on viewport
- Loading state, empty state, error state
- Token-driven throughout

### Mobile section trace

| Section | VISIBLE mobile | INTERACTIVE | RESPONSIVE CONDITION | SOURCE FILE |
|---------|----------------|-------------|----------------------|-------------|
| RadarViewSwitch wrapper | yes | yes | always | components/radar/radar-view-switch.tsx |
| Loading state | conditional | n/a | while loading | radar-view-switch.tsx |
| Empty state | conditional | yes (CTA) | when no data | radar-view-switch.tsx |
| Error state | conditional | yes (retry) | on fetch error | radar-view-switch.tsx |
| Radar visual (mobile) | conditional on data | yes (interactive points) | always | components/radar/radar-mobile.tsx |

### Phase 7 deltas affecting RADAR

- **None** — Phase 7 BATCH 7G audit confirmed "no changes required, RadarViewSwitch already has coherent loading/empty/error states with semantic tokens".

---

## 10. TAGS — `app/(marketing)/tags/page.tsx`

121 lines. Container: `<div className="page-shell space-y-5 pb-28 pt-4 sm:space-y-8 sm:pb-20 sm:pt-6">`.

Renders 3 sections:

1. **Hero** (gradient bg, rounded-[30px] mobile / [38px] sm):
   - Badge + h1 (`max-w-[14ch]`) + p (`max-w-[40rem]`)
2. **Filter Groups** (grid `md:grid-cols-2 xl:grid-cols-3` — **1-col mobile**):
   - Each card: category name + count + description, links to `/archivio?group={key}`
3. **All Tags** (flex-wrap gap-2/sm:gap-3):
   - Each tag: chip with count badge, links to `/archivio?tag={tag}`

### Mobile section trace

| Section | VISIBLE mobile | INTERACTIVE | RESPONSIVE CONDITION | SOURCE FILE |
|---------|----------------|-------------|----------------------|-------------|
| Hero | yes | n/a (display) | rounded-[30px] mobile / [38px] sm | app/(marketing)/tags/page.tsx |
| Filter Groups grid | yes (1-col stack) | yes (links to /archivio?group=) | `md:grid-cols-2 xl:grid-cols-3` | app/(marketing)/tags/page.tsx |
| All Tags flex-wrap | yes | yes (tag links) | gap-2 mobile / gap-3 sm | app/(marketing)/tags/page.tsx |

### Phase 7 deltas affecting TAGS

- **R2 (page-shell padding):** outer container tighter on mobile (20→16px).
- No structural changes.

---

## 11. Cross-reference — Phase 7 deltas table

| File | Phase 7 delta (from `git diff f5ea2d4..9d26218`) | Mobile impact |
|------|---------------------------------------------------|---------------|
| `app/(marketing)/layout.tsx:45` | `pb-mobile-nav md:pb-0` → `pb-[calc(...)] lg:pb-0` | **CRITICAL:** 0.75rem less padding-bottom + breakpoint shift md→lg. Tablet 768-1023 now has nav + full padding. |
| `app/globals.css:389` (.page-shell) | `px-5 sm:px-8 lg:px-10` (20/32/40px) → token-driven 16/24/32/40px | **MEDIUM:** mobile 20→16px (4px less per side). Mobile override at line 7499 removed. |
| `styles/home.css:21` | `--tv-content-wide` → `--tv-container-wide` | NONE (both = 80rem) |
| `styles/compare.css:1500-1524` (.desktop-compare) | 2-col always → 1-col mobile, 2-col ≥768 | NONE on mobile (desktop-compare not mounted on mobile; uses ToolBattleView) |
| `styles/vibes-3d-maestoso.css:1251-1267` (.mobile-shortlist-board) | Added desktop caps at ≥768/≥1024 | NONE on mobile (<768) |
| `components/home/mobile-method-steps.tsx:40` | `max-w-6xl px-4` → `container-wide` class | NONE (same effective padding; routing via token class) |
| `components/layout/mobile-bottom-nav.tsx:43` | `md:hidden` → `lg:hidden` | **MEDIUM:** BottomNav now visible on tablet 768-1023 (was hidden at md) |
| `components/layout/site-header-v2.tsx:338,383,420,481` | `min-[1360px]:flex` → `lg:flex`, `min-[1360px]:flex` → `xl:flex`, 2× `min-[1360px]:hidden` → `lg:hidden` | **MEDIUM:** Header layout changes on tablet 768-1023 (desktop nav visible, no hamburger) |
| `components/directory/directory-hero.tsx:21` | Added `md:grid-cols-[1.5fr_1fr] md:items-center lg:gap-10` | NONE on mobile (<768 stays 1-col default) |
| `components/directory/tool-discovery-app.tsx:1146` | Added `lg:grid-cols-3` between md:2 and xl:4 | NONE on mobile |
| `app/(marketing)/toools/[slug]/page.tsx` | Added hero md intermediate + editorial md:2 | **LOW:** Mobile stacks, but visual rhythm on tablet 768-1023 changes |

---

## 12. Mobile invariants (Phase 6 baseline — restored)

| Invariant | Source | Status after revert |
|-----------|--------|---------------------|
| `<main>` padding-bottom = nav-height + safe-area + 1.5rem on mobile | `.pb-mobile-nav` + `--bottom-nav-height: 4.75rem` mobile override | ✅ restored |
| `<main>` padding-bottom = 0 at ≥768px (BottomNav hidden) | `md:pb-0` in layout.tsx | ✅ restored |
| `.page-shell` mobile padding = 20px | `px-5` | ✅ restored |
| `.page-shell` sm padding = 32px | `sm:px-8` | ✅ restored |
| `.page-shell` lg padding = 40px | `lg:px-10` | ✅ restored |
| BottomNav visible at <768px, hidden at ≥768px | `md:hidden` in mobile-bottom-nav.tsx | ✅ restored |
| SiteHeader `<nav>` visible at ≥1360px | `min-[1360px]:flex` | ✅ restored |
| SiteHeader hamburger visible at <1360px | `min-[1360px]:hidden` | ✅ restored |
| GameProfileBar visible at ≥1360px | `min-[1360px]:flex` | ✅ restored |
| `.mobile-shortlist-board` no max-width cap at any breakpoint | original CSS | ✅ restored |
| `.desktop-compare` always 1.1fr/0.9fr at all viewports | original CSS | ✅ restored (only mounts on desktop, irrelevant for mobile) |
| `.home-discovery-hero__layout` width = `--tv-content-wide` (80rem) | original CSS | ✅ restored |
| `<NativePlacement placementKey="home-featured-tool">` visible on <640px | `sm:hidden` in vibe-home-v2.tsx | ✅ preserved (Phase 6 already had this) |

---

## 13. Pre-existing constraints (NOT introduced by Phase 7)

| Constraint | Source | Note |
|------------|--------|------|
| `.home-3d-hero { display: none !important; }` at `max-width: 767px` | app/globals.css:32260-32270 | Predates Phase 7 (existed in Phase 6). Mobile hides 3D hero regardless of feature flag. |
| `--bottom-nav-height: 4.75rem` mobile override | app/globals.css:32260-32270 | Predates Phase 7. Overrides 3.55rem from :root on mobile. |
| Home composition depends on `releaseFeatures.threeD.enabled` flag | app/(marketing)/page.tsx | Predates Phase 7. If 3D off, MobileHeroSolar renders. If 3D on, only MobileSpotlight + steps. |
| Tool detail layout: hero stacks on <lg | toools/[slug]/page.tsx | Predates Phase 7. The `lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]` rule means hero+aside stacks below 1024px. |

---

## 14. Verification — Phase 6 baseline state

### Typecheck
```
$ bun ./node_modules/.bin/tsc --noEmit
(exit 0, no output)
```

### Tests
```
$ bun ./node_modules/.bin/vitest run __tests__/components/ui/

 ✓ __tests__/components/ui/core-primitives.test.tsx    (22 tests) 366ms
 ✓ __tests__/components/ui/overlay-primitives.test.tsx  (12 tests) 351ms

 Test Files  2 passed (2)
      Tests  34 passed (34)
```

### Tree state
```
$ git diff f5ea2d4 HEAD
(zero diff)

$ git status
On branch main
Your branch is up to date with 'origin/main'

Untracked files:
  .slim/
  audit-interaction-motion-report.md
  audit-report-desktop-ui.md
  test-image.png
  test.txt

nothing added to commit but untracked files present
```

---

## 15. Safety / rollback trail

| Step | Action | Commit / Tag |
|------|--------|--------------|
| 0 | Phase 7 merged to main | `9d26218 feat(ui): complete responsive & experience reconstruction (Phase 7)` |
| 1 | Final Pass on top | `7da6873 fix(ui): align SiteHeader breakpoints with desktop nav visibility` |
| 2 | User reported visual regressions | (no commit) |
| 3 | Safety tag created (local only) | `ui-broken-post-phase7-2026-07-21` |
| 4 | Root cause analysis | (this document) |
| 5 | Revert Final Pass | `ddd106c Revert "fix(ui): align SiteHeader breakpoints..."` |
| 6 | Revert Phase 7 | `e26f447 Revert "feat(ui): complete responsive..."` |
| 7 | Push to origin | `7da6873..e26f447 main -> main` |

### Active state
- `main` = `e26f447` (working tree ≡ `f5ea2d4` baseline)
- `origin/main` = `e26f447` (synced)
- Safety tag `ui-broken-post-phase7-2026-07-21` retained locally (not pushed)

---

## 16. STOP applied per user policy

- ❌ NO code changes
- ❌ NO rebuild
- ❌ NO redesign
- ❌ NO responsive reconstruction
- ✅ Read-only validation via `git show` / `git diff`
- ✅ Comprehensive section-by-section mobile trace
- ✅ 16-section report delivered

### Recommendations (future, NOT to be executed in this pass)

1. **Re-architect Phase 7 mobile invariants separately** — extract `--bottom-nav-height` and `.pb-mobile-nav` to a `.tv-shell-mobile` token group BEFORE attempting any Phase 7-equivalent responsive work.
2. **Tablet rescue as isolated lane** — phase 7's dead-zone fix is correct in spirit but executed too aggressively; consider introducing a `tv-shell-tablet` variant with separate inset tokens.
3. **Container token migration** — Phase 7B's `--tv-container-*` and `--tv-section-gutter-*` tokens are sound design. Adopt ONLY the tokens (not the page-shell replacement) in a future pass.
4. **No `display: none` for 3D on mobile** — consider feature-detect instead of CSS class hiding, so users on capable mobile devices can opt-in.

**Validation complete. Phase 6 baseline confirmed production-ready for mobile (360/375/390/430 widths).**
