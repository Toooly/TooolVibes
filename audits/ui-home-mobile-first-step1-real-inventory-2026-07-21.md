# UI HOME — Step 1 Real Inventory

**Date:** 2026-07-21
**Baseline:** `main @ e26f447` (tree ≡ `f5ea2d4` Phase 6)
**Scope:** ONLY `/` Home route — read-only via `git show`
**Method:** NO checkout, NO cherry-pick, NO code edits. Read every component that the Home page actually renders, then list every rendered DOM section with its source file and mobile-state contract.

---

## 1. Goal of Step 1

Build a precise map of what the Home page actually puts on the wire. From this map, Step 2 will inspect the running app at 4 mobile widths (390 reference + 430/375/360). Step 3 will define the rebuilt Home, Step 4 will rebuild it mobile-first. CONTENT PRESERVATION IS SACRED — nothing in this inventory may be silently dropped.

---

## 2. Files the Home page actually touches

Read from `f5ea2d4` (read-only via `git show`):

| File | Lines | Role | Renders at runtime? |
|------|------:|------|---------------------|
| `app/(marketing)/page.tsx` | 74 | Server entry, gate check, data fetch, composition root | yes |
| `app/(marketing)/layout.tsx` | — | Marketing shell wrapper (SiteHeader, main, SiteFooter, MobileBottomNav) | yes |
| `components/home/vibe-home-v2.tsx` | 113 | Client wrapper composes MobileHeroSolar + MobileSpotlight + NativePlacement + MobileMethodSteps | yes |
| `components/home/mobile-hero-solar.tsx` | 144 | Discovery stage hero with orbital + grid fallback | conditional on `showDiscoveryHero` (= !threeD.enabled) |
| `components/home/mobile-spotlight.tsx` | 148 | Tool della settimana podium | yes (if focusTool exists) |
| `components/home/mobile-method-steps.tsx` | 82 | 3 step cards: Scopri · Confronta · Salva | yes |
| `components/home/scroll-reveal.tsx` | 126 | Animation wrapper | utility, not directly rendered by Home |
| `components/home/hero-section.tsx` | 153 | Desktop hero | NOT used by Home (orphan candidate) |
| `components/home/mobile-marketing-hero.tsx` | 179 | Marketing hero | NOT used by Home (orphan candidate) |
| `components/home/tilt-card.tsx` | 48 | Tilt primitive | NOT used by Home (orphan candidate) |
| `components/home/floating-section-anchor.tsx` | 94 | Anchor nav | NOT used by Home (orphan candidate) |
| `components/3d-maestoso/home-3d-hero.tsx` | 99 | 3D hero (WebGL Canvas) | conditional on `threeD.enabled`, **hidden on mobile via CSS** |
| `styles/home.css` | 254 | Token-driven home styles | yes (loaded via globals.css → release-entry.ts) |

**Findings:**
- 4 orphan components confirmed: `hero-section.tsx`, `mobile-marketing-hero.tsx`, `tilt-card.tsx`, `floating-section-anchor.tsx`. None imported by Home. **Step 9 cleanup candidate** (delete only after Step 8 cross-route audit).
- `scroll-reveal.tsx` exists but is not imported by vibe-home-v2.tsx — used by other routes.

---

## 3. Conditional rendering tree

### Gate (root)
```
if (!isGateOpen) return <ComingSoonPage />;
```
- Default for fresh visitor: Coming Soon page (unless `releaseFeatures.publicGate.enabled` AND valid gate cookie).
- Returns `<ComingSoonPage />` instead of Home composition.

### Main composition (gate open)
```tsx
<>
  {releaseFeatures.threeD.enabled && (
    <Home3DHero tools={tools} weeklyTool={spotlightTool} />
  )}
  <VibeHomeV2
    tools={tools}
    weeklyTool={spotlightTool}
    supportingTools={supportingTools.slice(0, 4)}
    layout={homeLayout}                         /* "legacy" | "time-to-value" */
    showDiscoveryHero={!releaseFeatures.threeD.enabled}
  />
</>
```

### VibeHomeV2 inner
```tsx
<div className="vibe-home-mobile-origin[--ttv] relative">
  {showDiscoveryHero && <MobileHeroSolar routes={solarRoutes} compact={isTimeToValue} />}
  {focusTool && <MobileSpotlight tool={focusTool} supportingTools={supportingTools} />}
  <section className="page-shell sm:hidden">
    <NativePlacement placementKey="home-featured-tool" variant="compact" />
  </section>
  <MobileMethodSteps steps={methodSteps} />
</div>
```

### Focus tool resolution
```ts
const featuredTools = tools.filter(tool => tool.featured);
const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0] ?? null;
```
- May be `null` if `getPublicToolViews()` returns empty → Spotlight omitted silently.
- `getToolSpotlightView()` returns the weekly spotlight (manual curation).

### Solar routes (5 nodes)
1. Catalogo → /archivio (Compass, #6a3cff)
2. Radar → /radar (Radar, #39d2f6, badge "Ora")
3. Salvati → /shortlist (Bookmark, #f3bf4c)
4. Confronto → /compare (GitCompare, #10b981)
5. Tool scelto → /toools/{focusTool.slug} or /archivio (Sparkles, #ec4899)

### Method steps (3 cards)
1. Scopri → /archivio (Search, #6a3cff) "Parti da tool già curati"
2. Confronta → /compare (GitCompare, #39d2f6) "Confronta solo i candidati forti"
3. Salva → /shortlist (Bookmark, #f3bf4c) "Chiudi con una scelta rapida"

---

## 4. Section-by-section DOM map (mobile widths 360/375/390/430)

For each section: **PRESENT** (in DOM), **VISIBLE** (rendered to user at mobile width), **REACHABLE** (keyboard/SR/focus), **INTERACTIVE** (tap triggers behavior), **RESPONSIVE CONDITION** (breakpoint contract), **SOURCE FILE**.

### 4.1 Marketing shell (from layout.tsx)

| Section | PRESENT | VISIBLE mobile | REACHABLE | INTERACTIVE | RESPONSIVE CONDITION | SOURCE FILE |
|---------|---------|----------------|-----------|-------------|----------------------|-------------|
| `<a href="#main-content" className="skip-link">Salta al contenuto</a>` | yes | visually-hidden | yes (tab focus) | yes (anchor jump) | always | app/(marketing)/layout.tsx:36-38 |
| `<Global3DLayer />` | conditional (threeD) | NO (overlay layer, pointer-events-none) | n/a | n/a | depends on flag | components/3d-maestoso/global-3d-layer.tsx |
| `<OrbitalProvider>` + `<OrbitalLayer>` | conditional (threeD) | NO (orbital decorative layer) | n/a | n/a | depends on flag | components/app/orbital-system |
| `<SiteHeaderV2 />` | yes | yes (sticky top) | yes | yes (search overlay, hamburger menu, profile) | nav `min-[1360px]:flex`; hamburger `min-[1360px]:hidden`; GameProfileBar `min-[1360px]:flex` | components/layout/site-header-v2.tsx |
| `<main id="main-content" tabIndex={-1} className="relative z-10 pb-mobile-nav md:pb-0">` | yes | yes | yes (skip-link target) | n/a | `pb-mobile-nav` mobile (≈6.25rem incl. safe-area + 1.5rem buffer); `md:pb-0` resets ≥768 when BottomNav hides | app/(marketing)/layout.tsx:44 |
| `<PageTransition>` wrapper | yes | wraps children | n/a | n/a | motion-aware (MotionConfig reducedMotion=user) | components/app/page-transition.tsx |
| `<SiteFooterV2 />` | yes | yes (bottom) | yes | yes (link blocks) | always | components/layout/site-footer-v2.tsx |
| `<MobileBottomNav />` | yes | yes (mobile only) | yes | yes (5 nav items: Catalogo, Radar, Shortlist, Confronto, Profile) | `md:hidden` (≥768 hidden) | components/layout/mobile-bottom-nav.tsx:43 |

### 4.2 Home composition (from page.tsx + vibe-home-v2.tsx)

| Section | PRESENT | VISIBLE mobile (360-430) | REACHABLE | INTERACTIVE | RESPONSIVE CONDITION | SOURCE FILE |
|---------|---------|--------------------------|-----------|-------------|----------------------|-------------|
| `<Home3DHero>` (3D Canvas) | conditional (threeD) | NO (`max-width: 767px` → `display: none !important` per app/globals.css:32270) | n/a | n/a | hidden at `max-width: 767px` regardless of feature flag | components/3d-maestoso/home-3d-hero.tsx |
| `<MobileHeroSolar>` (discovery stage) | conditional on `showDiscoveryHero` (= !threeD.enabled) | yes | yes (5 orbit nodes + 5 grid nodes as fallback) | yes (each node = Link) | `compact` flag changes layout; `<900px` stacks copy + visual 1-col | components/home/mobile-hero-solar.tsx |
| - `.home-discovery-hero.v-discovery-stage--orbital` | yes | yes | yes | n/a | padding `clamp(6.75rem, 10vw, 8.5rem) var(--tv-space-6) clamp(4rem, 7vw, 6rem)` desktop; mobile override `calc(5.5rem + safe-area) var(--tv-space-4) var(--tv-space-12)` at ≤767px or `(hover: none)` | styles/home.css:2-19, 132-139 |
| - `.home-discovery-hero__layout` grid | yes | yes (1-col stacked ≤900px) | n/a | n/a | `grid-template-columns: minmax(19rem,0.82fr) minmax(28rem,1.18fr)` desktop; `1fr` ≤900px; gap `clamp(8,5vw,16)` desktop, `var(--tv-space-8)` mobile | styles/home.css:21-31, 142-149 |
| - `.home-discovery-hero__copy` (eyebrow + h1 + lede + actions + proof) | yes | yes | yes | yes (CTAs) | h1 `clamp(3.25rem, 5.6vw, 5.9rem)` desktop; `clamp(2.6rem, 12vw, 4rem)` ≤767; `max-width: 11ch` desktop, `14ch` ≤900, `12ch` ≤767 | styles/home.css:33-87, 156-164 |
| - `.home-discovery-hero__visual` (orbit shell) | yes | yes (orbit) | yes (5 nodes) | yes (5 links) | `--orbit-width: clamp(34rem, 46vw, 44rem)` desktop; `min(22rem, calc(100vw - 2rem))` ≤767 (square) | styles/home.css:90-93, 171-220 |
| - `.v-discovery-orbit-shell` (rings + brand + 5 orbit nodes) | yes | yes | yes | yes | rings + brand center; track animates orbit; node cards with icon + label | components/home/mobile-hero-solar.tsx:73-99 + styles/home.css |
| - `.v-discovery-orbit-node` (5 Link cards) | yes | yes | yes | yes | `min-width: 5.45rem; min-height: 3.05rem` mobile; column flex with icon + label | styles/home.css:181-220 |
| - `.v-discovery-grid` (grid fallback) | yes | NO on mobile (≤767) — replaced by orbit | yes | yes | `display: none` at `max-width: 767px, (hover: none)` | styles/home.css:226 |
| - `.v-discovery-grid-node` (5 cards) | NO mobile / YES desktop | n/a on mobile | yes | yes (5 links) | only visible when orbit is hidden | components/home/mobile-hero-solar.tsx:103-123 |
| - `.home-discovery-hero__cta--primary` "Esplora i tool" | yes | yes | yes | yes | `border-color: var(--tv-accent-primary)` linear-gradient bg | styles/home.css:62-66 |
| - `.home-discovery-hero__cta--secondary` "Guarda il Radar" | yes | yes | yes | yes | `background: var(--tv-surface-translucent)` | styles/home.css:68-70 |
| - `.home-discovery-hero__proof` "Scopri · Confronta · Salva" | yes | yes | yes | n/a | uppercase tracking-label text-muted | styles/home.css:73-81 |
| `<MobileSpotlight>` (podium + meta) | conditional on focusTool | yes (when 3D off, hero+spotlight both render; when 3D on, only spotlight renders here) | yes | yes (3 podium tools) | `v-spotlight-section`; `v-podium-step--mobile-link` visible mobile, `--desktop-static` visible desktop; ≤767 sets pod steps to compact | components/home/mobile-spotlight.tsx |
| - `.v-spotlight-stars` (decorative) | yes | yes (decorative, aria-hidden) | n/a | n/a | starfield background | mobile-spotlight.tsx + spotlight.css |
| - `.v-spotlight-header` (eyebrow + h2 + subtitle) | yes | yes | yes | n/a | editorial header | mobile-spotlight.tsx |
| - `.v-podium-step` (3 podium cards) | yes | yes | yes | yes (3 links to /toools/[slug]) | rank-1 / rank-2 / rank-3 with size variance; mobile-link visible mobile | mobile-spotlight.tsx + spotlight.css |
| - `.v-spotlight-podium-meta` (3 use-case pills) | yes | yes | yes | n/a | chips for "Quando serve" / "Pro" / "Contro" | mobile-spotlight.tsx |
| `<section className="page-shell sm:hidden">` (NativePlacement "home-featured-tool") | yes | yes (<640) | yes | n/a (ad) | `sm:hidden` hides ≥640 | components/home/vibe-home-v2.tsx:104-106 |
| `<MobileMethodSteps>` (3 cards) | yes | yes | yes | yes (3 links) | `max-w-6xl px-4 py-16 md:py-20` wrapper; grid stacks 1-col default | components/home/mobile-method-steps.tsx:28-79 |
| - `.v-method-section` (particle bg) | yes | yes (decorative, aria-hidden) | n/a | n/a | particle background | mobile-method-steps.tsx:28-31 |
| - `.v-method-header` (eyebrow + h2 + subtitle) | yes | yes | yes | n/a | centered text | mobile-method-steps.tsx:33-40 |
| - `.v-method-grid` (3 cards) | yes | yes | yes | yes (3 links "Esplora") | default 1-col; md/lg grid | mobile-method-steps.tsx:42-72 |
| - `.v-method-card` (3 numbered cards with icon + label + title + desc + link) | yes | yes | yes | yes (3 links) | `--step-color` CSS var per card; glow + inner + numbered top | mobile-method-steps.tsx:43-71 |

---

## 5. Content preservation ledger

Every piece of content rendered today. **None may disappear in Step 4.**

### 5.1 Discovery stage copy (MobileHeroSolar)
- Eyebrow: "Curatela indipendente · meno rumore, più segnale"
- H1: "Trova il tool giusto prima che il rumore scelga per te."
- Lede: "Esplora una selezione ragionata, confronta i candidati e costruisci uno stack che abbia davvero senso per il tuo lavoro."
- Primary CTA: "Esplora i tool" → /archivio
- Secondary CTA: "Guarda il Radar" → /radar
- Proof strip: "Scopri · Confronta · Salva"

### 5.2 Spotlight copy (MobileSpotlight)
- Eyebrow: "Tool della settimana" (Sparkles icon)
- H2: "Il tool che il team sta usando adesso"
- 3 podium tools: focus tool + 2 supporting tools
- Per tool: rank badge + favicon avatar + name + category

### 5.3 Method steps copy (MobileMethodSteps)
- Eyebrow: "Metodo"
- H2: "Scopri, confronta, salva"
- Subtitle: "Un percorso chiaro: scopri, confronta, decidi. Senza perdere tempo tra decine di schede uguali."
- 3 cards:
  1. Scopri · "Parti da tool già curati" · "Categorie leggibili, filtri utili e una selezione editoriale che tiene fuori il rumore." → /archivio
  2. Confronta · "Confronta solo i candidati forti" · "Porta avanti pochi tool alla volta e guarda differenze, livello e casi d'uso reali." → /compare
  3. Salva · "Chiudi con una scelta rapida" · "Salva, rivedi e trasforma la ricerca in una lista operativa pronta da provare." → /shortlist

### 5.4 NativePlacement
- `placementKey="home-featured-tool"`, `variant="compact"` — monetization, mobile-only (sm:hidden)

### 5.5 Hidden by default / mobile CSS overrides
- Home3DHero (`max-width: 767px` → `display: none !important`)
- v-discovery-grid (`max-width: 767px` → `display: none`)
- v-podium-step--desktop-static (mobile replaces with --mobile-link)
- NativePlacement section (sm:hidden)

---

## 6. Orphan components (audit-only)

| File | Lines | Imported by Home? | Decision for Step 9 |
|------|------:|-------------------|----------------------|
| `components/home/hero-section.tsx` | 153 | NO | **DO NOT DELETE** in this phase — may be used by /dev/design-system or other internal pages. Audit cross-route first. |
| `components/home/mobile-marketing-hero.tsx` | 179 | NO | **DO NOT DELETE** — same caveat. |
| `components/home/tilt-card.tsx` | 48 | NO | **DO NOT DELETE** — utility primitive. |
| `components/home/floating-section-anchor.tsx` | 94 | NO | **DO NOT DELETE** — feature-level nav anchor. |

**Orphan policy:** orphan audit is cross-route. Single-route confirmation is not enough. Flagged for Step 8 cross-route audit, not Step 9.

---

## 7. Phase 7 forensic note

Phase 7 (commit `9d26218`, reverted at `e26f447`) did not modify any file in the Home composition chain:
- `app/(marketing)/page.tsx` — UNCHANGED (no Phase 7 delta)
- `components/home/vibe-home-v2.tsx` — UNCHANGED
- `components/home/mobile-hero-solar.tsx` — UNCHANGED
- `components/home/mobile-spotlight.tsx` — UNCHANGED
- `components/home/mobile-method-steps.tsx` — UNCHANGED
- `components/home/scroll-reveal.tsx` — UNCHANGED
- `components/3d-maestoso/home-3d-hero.tsx` — UNCHANGED
- `styles/home.css` — Phase 7 changed line 21 (`--tv-content-wide` → `--tv-container-wide`, both resolve to 80rem, ZERO visual delta) and added `≥1280px` media query expanding hero grid columns. **Phase 7 home.css changes had NO visual impact on mobile.**

Conclusion: **Phase 7 did not break the Home mobile experience.** The Phase 7 visual regressions reported were on shell (nav), page-shell padding (20→16px on all routes including Home), and tablet-only hero grid expansion. Home composition itself is intact at `f5ea2d4` baseline.

---

## 8. Style ownership (current state)

### Token-driven (good)
- All home.css spacing, colors, radii, typography use `--tv-*` tokens.
- Hero copy: `clamp(3.25rem, 5.6vw, 5.9rem)` (token-driven fluid).
- Spacing: `clamp(6.75rem, 10vw, 8.5rem)`, `clamp(var(--tv-space-8), 5vw, var(--tv-space-16))`, `var(--tv-space-4..16)`.

### Hex literals (acceptable — design system uses brand hex)
- `vibe-home-v2.tsx` defines `solarRoutes` and `methodSteps` with hardcoded hex per item (`#6a3cff`, `#39d2f6`, `#f3bf4c`, `#10b981`, `#ec4899`). These are item-specific accent colors, not surface tokens. Acceptable.
- `mobile-spotlight.tsx`: hardcoded `accentFrom: "#6a3cff"` fallback only when tool has no accent set.

### Responsive approach (current)
- Tailwind utility classes for breakpoints (`md:`, `lg:`).
- `clamp()` for fluid spacing and type.
- 3 home.css media queries (≤380, ≤767, ≤900) — all token-aligned.

---

## 9. Current mobile pain points (hypotheses, to verify in Step 2)

These are NOT confirmed — they are the audit-stage hypotheses that Step 2 must visually verify.

| Hypothesis | Source |
|-----------|--------|
| H1: Hero h1 may overflow at 360 width (max-w-12ch with 2.6rem font = ~26rem available, 12ch at this size ≈ 15.6rem — should fit) | mobile-hero-solar.tsx + home.css |
| H2: Orbit shell at 360 width may crop bottom nodes (--orbit-width min(22rem, calc(100vw-2rem)) = ~21.4rem at 360) | home.css:171-180 |
| H3: Podium may be cramped at 360 with 3 cards inline | mobile-spotlight.tsx |
| H4: Method steps grid is 1-col on mobile — may leave too much vertical space on 390/430 | mobile-method-steps.tsx |
| H5: NativePlacement ad section may dominate viewport on small phones (variant="compact" should mitigate) | vibe-home-v2.tsx:104-106 |
| H6: BottomNav at 360 may overlap spotlight CTAs if safe-area not respected | layout.tsx pb-mobile-nav |

All hypotheses MUST be visually verified in Step 2 before any rebuild.

---

## 10. STEP 1 conclusion

The Home composition at `f5ea2d4` baseline renders 4 distinct user-facing sections on mobile (when `threeD.enabled = false`):
1. Discovery stage hero (eyebrow + h1 + lede + 2 CTAs + proof + orbital visual)
2. Tool della settimana spotlight (podium of 3 tools)
3. NativePlacement sponsor band (mobile-only)
4. Method (3 step cards)

When `threeD.enabled = true`: 3D hero would render on desktop but is hidden via CSS on mobile → mobile composition is identical (spotlight + steps + ad), discovery stage hero omitted.

**Content inventory is COMPLETE.** Step 2 may now proceed to runtime inspection at 4 mobile widths.

---

## 11. STOP applied per user policy

- ❌ NO code changes
- ❌ NO rebuild
- ❌ NO redesign
- ✅ Read-only inventory via `git show`
- ✅ Section-by-section DOM map delivered
- ✅ Content ledger complete (nothing dropped silently)
