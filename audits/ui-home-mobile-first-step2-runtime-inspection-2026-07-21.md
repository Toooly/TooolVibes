# UI HOME — Step 2 TRUE Runtime Mobile Inspection

**Date:** 2026-07-21
**Baseline:** `main @ e26f447` (tree ≡ `f5ea2d4` Phase 6)
**Method:** Playwright Chromium headless on real dev server
**Reference viewport:** 390 × 844 (iPhone 14)
**Inspections:** 360×800 · 375×812 · **390×844** · 430×932
**Dev server:** fresh `bun run dev` on port 3000 (stale PID 25652 on port 3100 was killed first)

---

## 1. Executive Summary

**The user-reported failure ("sono sparite un sacco di sezioni, non funziona più nulla come si deve") IS REPRODUCIBLE — but it is NOT a Phase 7 issue.**

The actual root cause was a **stale dev server** (PID 25652, Next.js 15.5.20, port 3100) that was returning HTTP 400 for every static asset (CSS + JS chunks) because it served stale build manifests from an older build. The browser error-trap then displayed "Qualcosa è andato storto" — exactly the symptom the user reported.

After killing the stale server and starting a fresh `bun run dev` on port 3000, **the Home page renders correctly with all expected sections** at all 4 mobile viewports. The issue is **operational** (dev server staleness), not **architectural**.

### Key findings

| Finding | Verdict |
|---------|---------|
| Home composition renders | ✅ YES (3 visible sections + footer + nav + header) |
| MobileHeroSolar (Discovery Stage) renders | ❌ NO (because threeD.enabled=true, showDiscoveryHero=false) |
| MobileSpotlight renders | ✅ YES (visible at y=66, h=1046) |
| NativePlacement renders | ✅ YES (visible, "SPAZIO PARTNER / PRENOTABILE" placeholder) |
| MobileMethodSteps renders | ✅ YES (visible at y=1393, h=1052) |
| SiteHeader renders | ✅ YES (sticky top, h=64) |
| SiteFooter renders | ✅ YES (visible at y=2542, h=1196) |
| MobileBottomNav renders | ✅ YES (visible at y=724, h=63) |
| All 4 viewports identical layout | ✅ YES (delta only in section widths/heights proportional to viewport) |
| Runtime errors | ❌ NONE (zero console errors at all 4 viewports) |

### What mobile users actually see

1. **Top of page (scrollY=0)**: Sticky header (64px) + Spotlight (1047px starting at y=66) covering entire first viewport. NO visible hero / NO visible CTA "Esplora i tool" / NO visible CTA "Guarda il Radar" at first viewport.
2. **Scroll position 600px**: Spotlight scrolls out (y=-534), NativePlacement becomes visible at y=513, Method starting to enter.
3. **Scroll position 1100px**: NativePlacement at y=13 (top of viewport), Method at y=293.
4. **Scroll position 1400px**: Method takes viewport (y=-7).
5. **Scroll position 2395px**: Footer enters (y=150).
6. **Scroll position 2897px**: Footer fills viewport (y=-352), page ends at 3741px.

**The Discovery Stage Hero (with the actual hero CTAs "Esplora i tool" / "Guarda il Radar") DOES NOT EXIST in the rendered mobile DOM** when `threeD.enabled=true`. Only the hidden `<section class="home-3d-hero">` exists with its own copy ("Curatela indipendente..."). The MobileHeroSolar component is imported but never rendered because `showDiscoveryHero = false`.

---

## 2. Environment

| Item | Status |
|------|--------|
| Branch | `main` |
| Commit | `e26f447` (working tree ≡ `f5ea2d4`) |
| `git status` | clean (only user untracked files + `.slim/`) |
| User untracked files | preserved |
| typecheck | PASS |
| vitest | 34/34 PASS |
| Dev server before fix | PID 25652, Next.js 15.5.20, port 3100 — STALE (400 errors on static assets) |
| Dev server after fix | `bun run dev` on port 3000 (PID 89106), `TOOOLVIBES_PUBLIC_GATE_ENABLED=false` |
| Dev server status | ✅ Ready in 1539ms, no errors |
| Gate flag | `TOOOLVIBES_PUBLIC_GATE_ENABLED=false` (env override) — needed to bypass waitlist |
| HTTP status on `/` | 200 (after fresh start, before: 200 but with broken assets) |
| Page size on `/` | 214,191 bytes (real composition) |

### Operational fix needed
The stale PID 25652 dev server was producing the user-reported failure. **Fresh dev server resolves it.** This is documented as finding **OP-1**.

---

## 3. Viewport results

### 3.1 390 × 844 (reference)

| Metric | Value |
|--------|-------|
| scrollHeight (documentElement) | 3741 |
| scrollHeight (body) | 3741 |
| window.innerHeight | 844 |
| window.innerWidth | 390 |
| Page title | "TooolVibes | Tool AI, SaaS, no-code e vibe coding \| TooolVibes" |
| First viewport text | "Salta al contenuto / TOOOLVIBES / TOOL DELLA SETTIMANA / Blink / Vibe coding / builder app AI · In evidenza / AI app builder che trasforma un'idea in un'app funzionante in pochi minuti." |
| Console errors | 0 |
| Console warnings | 1 (image sizes prop warning, cosmetic) |

### 3.2 430 × 932

| Metric | Value |
|--------|-------|
| scrollHeight | 3689 |
| scrollHeight (body) | 3689 |
| window.innerHeight | 932 |
| window.innerWidth | 430 |
| First viewport text | identical to 390 |
| Console errors | 0 |

### 3.3 375 × 812

| Metric | Value |
|--------|-------|
| scrollHeight | 3740 |
| scrollHeight (body) | 3740 |
| window.innerHeight | 812 |
| window.innerWidth | 375 |
| First viewport text | identical to 390 |
| Console errors | 0 |

### 3.4 360 × 800

| Metric | Value |
|--------|-------|
| scrollHeight | 3738 |
| scrollHeight (body) | 3738 |
| window.innerHeight | 800 |
| window.innerWidth | 360 |
| First viewport text | identical to 390 |
| Console errors | 0 |

**All 4 viewports render the SAME content with the SAME text content. Only widths differ.**

---

## 4. Full page metrics

| Viewport | scrollHeight | Sections rendered |
|----------|-------------:|-------------------|
| 390×844 | 3741 | 5 (Home3DHero hidden + Spotlight + NativePlacement + Method + Footer) |
| 430×932 | 3689 | 5 (same composition) |
| 375×812 | 3740 | 5 |
| 360×800 | 3738 | 5 |

### Section vertical layout (390×844 reference)

| Y range | Section | Height |
|---------|---------|-------:|
| 0–64 | `<header class="site-header-v2">` (sticky/fixed) | 64 |
| 0–0 | `<section class="home-3d-hero">` (display:none) | 0 |
| 66–1112 | `<section class="v-spotlight-section">` | 1046 |
| 1112–1393 | `<section class="page-shell sm:hidden">` (NativePlacement) | 281 |
| 1393–2445 | `<section class="v-method-section">` | 1052 |
| 2542–3738 | `<footer class="site-footer-v2">` | 1196 |
| 724–787 | `<nav class="site-mobile-footer-nav">` (fixed, h=63) | 63 |

**Note:** Y values are at scroll=0. Footer at y=2542 (not 2445) — there is **a ~97px gap** between end of method (y=2445) and start of footer (y=2542). This gap is the bottom of `<main>` with `pb-mobile-nav` applied (~6.25rem ≈ 100px).

---

## 5. Section runtime matrix (390×844 reference)

| Section | MOUNTED | DOM NODE | DISPLAY | VISIBILITY | OPACITY | RECT (w × h) | TOP | BOTTOM | REACHABLE | OVERLAPPED | CLIPPED | Z-INDEX |
|---------|---------|----------|---------|-----------|---------|--------------|-----|--------|-----------|------------|---------|---------|
| SiteHeader (`<header>`) | YES | YES | block | visible | 1 | 390×64 | 0 | 64 | yes (sticky) | no | no | fixed (top) |
| MainEl (`#main-content`) | YES | YES | block | visible | 1 | 390×2479 | 66 | 2545 | yes | no | no | z-10 |
| Home3DHero (`<section.home-3d-hero>`) | YES | YES | **none** | visible | 1 | 0×0 | 0 | 0 | NO (display:none) | no | no | n/a |
| MobileHeroSolar (`#v-discovery-stage`) | **NO** | **NO** | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a | n/a |
| MobileSpotlight (`<section.v-spotlight-section>`) | YES | YES | block | visible | 1 | 390×1046 | 66 | 1112 | yes (scroll) | no | no | n/a |
| NativePlacement (`<section.page-shell.sm:hidden>`) | YES | YES | block | visible | 1 | 390×281 | 1112 | 1393 | yes (scroll) | no | no | n/a |
| MobileMethodSteps (`<section.v-method-section>`) | YES | YES | block | visible | 1 | 390×1052 | 1393 | 2445 | yes (scroll) | no | no | z-10 |
| SiteFooter (`<footer.site-footer-v2>`) | YES | YES | block | visible | 1 | 390×1196 | 2542 | 3738 | yes (scroll) | no | no | mt-auto |
| MobileBottomNav (`<nav.site-mobile-footer-nav>`) | YES | YES | block | visible | 1 | 363×63 | 768 | 831 | yes (sticky) | no | no | fixed z-nav |

**Notable:**
- MobileHeroSolar is **NOT MOUNTED** in DOM. Per inventory, this is because `showDiscoveryHero = !threeD.enabled = false`. The component is imported but never rendered.
- Home3DHero IS mounted but `display: none` due to CSS `@media (max-width: 767px) { .home-3d-hero { display: none !important; } }` (app/globals.css:32270).
- MainEl height is 2479 (includes Home3DHero's reserved `min-h-[60vh]` slot even though invisible).
- Footer starts at y=2542 (NOT 2445) — there is a 97px gap between end of Method and start of Footer. This gap is `<main>`'s `pb-mobile-nav` (~100px = nav-height + safe-area + 1.5rem buffer).
- MobileBottomNav (363×63) sits at y=768 (which is `windowH 844 - bottomNavH 63 - safe-area ~13 = 768`). The last byte of footer (y=3738) is BELOW the BottomNav — last 63px of footer hidden behind BottomNav.

---

## 6. Conditional rendering forensics

### 6.1 Gate (root)

```ts
if (!isGateOpen) return <ComingSoonPage />;
```

| Condition | Value | Source |
|-----------|-------|--------|
| `releaseFeatures.publicGate.enabled` | false (env override) | env: `TOOOLVIBES_PUBLIC_GATE_ENABLED=false` |
| `gateCookie` | undefined | no cookie sent |
| `verifyGateToken` | not called | gate disabled → short-circuit |
| `isGateOpen` | true | resolves to true via `!releaseFeatures.publicGate.enabled` |
| Result | `<ComingSoonPage />` skipped | Home composition renders |

**With default env (`TOOOLVIBES_PUBLIC_GATE_ENABLED` unset):** `defaultEnabled: true` → `publicGate.enabled = true` → no valid gate cookie → `<ComingSoonPage />` renders → user sees the waitlist, not the Home.

**This is the default production state.** Fresh visitors with no gate cookie see `<ComingSoonPage />`, not the Home composition.

### 6.2 Home composition

```tsx
{releaseFeatures.threeD.enabled && <Home3DHero tools={tools} weeklyTool={spotlightTool} />}
<VibeHomeV2 ... showDiscoveryHero={!releaseFeatures.threeD.enabled} />
```

| Condition | Value | Source |
|-----------|-------|--------|
| `releaseFeatures.threeD.enabled` | true (env default or true flag) | lib/config/release-features.ts |
| Home3DHero | RENDERED | condition true |
| VibeHomeV2 `showDiscoveryHero` | false | `!true = false` |
| Result | Home3DHero + VibeHomeV2(without discovery hero) | matches DOM reality |

### 6.3 Inside VibeHomeV2

```tsx
{showDiscoveryHero && <MobileHeroSolar ... />}  // false → NOT rendered
{focusTool && <MobileSpotlight ... />}            // focusTool exists → rendered
<section className="page-shell sm:hidden">        // always rendered
  <NativePlacement placementKey="home-featured-tool" variant="compact" />
</section>
<MobileMethodSteps ... />                          // always rendered
```

| Condition | Value | Result |
|-----------|-------|--------|
| `showDiscoveryHero` | false | MobileHeroSolar NOT mounted |
| `focusTool` | exists (Blink) | MobileSpotlight mounted |
| `supportingTools` | 4 tools | available for podium |
| `NativePlacement placementKey="home-featured-tool"` | rendered | "SPAZIO PARTNER / PRENOTABILE" placeholder visible on mobile (<640px) |
| `MobileMethodSteps` | always | 3 cards rendered |

### 6.4 Focus tool resolution

```ts
const featuredTools = tools.filter(tool => tool.featured);
const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0] ?? null;
```

At runtime: focus tool = "Blink" (Vibe coding / builder app AI · In evidenza).

### 6.5 The discovery-hero text appears in the HIDDEN section

The text "Curatela indipendente · meno rumore, più segnale / Trova il tool giusto prima che il rumore scelga per te." appears in **Home3DHero** (the hidden section), NOT in MobileHeroSolar (which doesn't exist). So:

- If `threeD.enabled = false`: MobileHeroSolar IS rendered with same copy → user sees it
- If `threeD.enabled = true`: MobileHeroSolar is NOT rendered, Home3DHero (with same copy) is hidden via CSS → **user sees NEITHER hero**

**This is the real problem the user is reporting**: when 3D is enabled (the default), mobile users do NOT see the discovery stage hero.

---

## 7. Visibility forensics

### 7.1 Per-section visibility chain

#### SiteHeader
- Wrapper: `position: fixed; top: 0; left: 0; right: 0`
- Inner shell: `transition-all duration-500 is-elevate`
- Visible: YES at all viewports, sticky/fixed top
- Total height: 64px
- Backdrop blur applied

#### MainEl (`<main id="main-content" tabIndex={-1} className="relative z-10 pb-mobile-nav md:pb-0">`)
- position: relative; z-index: 10
- padding-bottom: 100px (≈6.25rem from `.pb-mobile-nav` mobile rule)
- Contains: Home3DHero (hidden) + Spotlight + NativePlacement + Method

#### Home3DHero (`<section.home-3d-hero ...>`)
- `<div className="relative z-10 mx-auto max-w-4xl px-4 text-center">` content with eyebrow/h1/lede/CTAs
- All content has motion props `initial={{opacity:0}}` and renders with inline style `opacity: 1`
- BUT: parent `<section>` has `display: none` at ≤767px (app/globals.css:32260-32270)
- Conclusion: **Section exists, content rendered, but hidden by CSS rule on mobile**
- Not reachable by keyboard, not in tab order, not announced to screen reader (display:none removes from accessibility tree)

#### MobileHeroSolar (`#v-discovery-stage`)
- **NOT IN DOM** (component never instantiated)
- Reason: `showDiscoveryHero = false` when `threeD.enabled = true`

#### MobileSpotlight
- Wraps with `<section class="v-spotlight-section">`
- Starfield background (decorative)
- Renders 3 podium tools (Blink, VibeCode, third)
- Renders 3 meta pills per tool (case d'uso, pro, contro)
- Height 1046px on 390 — large section

#### NativePlacement (`<section.page-shell.sm:hidden>`)
- Contains `<aside class="native-placement ...">`
- Text: "SPAZIO PARTNER / PRENOTABILE / Uno slot per tool che meritano una prova vera..."
- This is a placeholder (no active sponsor)
- Height 281px on 390
- Visible only at <640px (`sm:hidden`)

#### MobileMethodSteps (`<section.v-method-section>`)
- Particle background (decorative)
- Header: "METODO / Scopri, confronta, salva / Un percorso chiaro..."
- 3 cards: Scopri → /archivio, Confronta → /compare, Salva → /shortlist
- Height 1052px on 390

#### SiteFooter (`<footer.site-footer-v2>`)
- "TOOOLVIBES / Il sistema per scoprire tool AI..."
- 1196px height (large footer with link grid + newsletter form)

#### MobileBottomNav
- Fixed at bottom (y=768 on 390×844 = `windowH 844 - navH 63 - safe-area ~13 = 768`)
- Width: 363 (centered with margin 14px each side)
- 5 items: Home / Catalogo / Radar / Salvati / Confronto
- Visible at all viewports ≤767 (`md:hidden`)

### 7.2 No display:none / visibility:hidden / opacity:0 issues found

All visible sections report `display: block; visibility: visible; opacity: 1` consistently.

The Home3DHero is hidden by CSS rule, NOT by motion state.

---

## 8. Motion / reveal results

### 8.1 Home3DHero motion (hidden section)

Components inside use motion/react:
```tsx
<motion.p initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{delay:0.2, duration:0.6}}>
  Curatela indipendente...
</motion.p>
```

At runtime inspection: all motion props have resolved to `opacity: 1; transform: none` (inline styles confirmed). Motion completed successfully.

### 8.2 MobileSpotlight

- Renders without motion fade-in (no `initial` props observed in section)
- Starfield background: pure CSS animation

### 8.3 MobileMethodSteps

- Renders without motion fade-in
- Particles: pure CSS animation

### 8.4 NativePlacement

- No motion (simple card)

### 8.5 Conclusion

No sections are stuck in motion state. All motion-dependent elements either completed their entrance animation or don't use motion.

---

## 9. Scroll reachability

### 9.1 Full scroll simulation (390×844)

| ScrollY | Visible sections |
|--------:|------------------|
| 0 | HEADER + SPOTLIGHT |
| 600 | HEADER + SPOTLIGHT(scrolling out) + NATIVEPLACEMENT + METHOD |
| 1100 | HEADER + NATIVEPLACEMENT(top) + METHOD(visible) |
| 1400 | HEADER + METHOD(visible) |
| 2395 | HEADER + METHOD(scrolling out) + FOOTER(entering) |
| 2897 | HEADER + FOOTER(visible) |
| 3741 | END (bottom of footer) |

**All sections reachable.** Page scrolls smoothly. No scroll lock.

### 9.2 Nested scroll

**None found.** Single scroll on document. Fixed elements (header + bottom-nav) scroll with viewport but stay in position via `position: fixed`.

### 9.3 Fixed layers vs gesture interception

- Header at `position: fixed; top: 0` — pointer events flow to header (clicks on search/menu)
- BottomNav at `position: fixed; bottom: 0` — pointer events flow to nav (clicks on 5 items)
- Body content scrolls under both. No interception observed.

### 9.4 BottomNav overlap with footer

- BottomNav at y=768 (390×844 viewport)
- Footer extends from y=2542 to y=3738 in document coordinates
- Last ~63px of footer (y=3675-3738 in doc = y=830-893 in viewport when scrolled to bottom) hidden behind BottomNav
- User can still scroll past this — bottom nav stays fixed
- This is **expected behavior** for mobile bottom-nav pattern

### 9.5 Main padding vs BottomNav

- `<main>` has `pb-mobile-nav` = 100px on mobile
- BottomNav = 63px + safe-area ~13px
- Buffer = 100 - 76 = ~24px — adequate

---

## 10. Header / BottomNav results

### 10.1 SiteHeader

- Position: `fixed; top: 0; left: 0; right: 0`
- Height: 64px
- Inner: `<div class="site-header-v2__shell ...">`
- Behavior: `transition-all duration-500 is-elevate` — header adds elevation when scrolled
- Content: "TOOOLVIBES" logo + mobile search trigger + hamburger menu + (≥1360) desktop nav + (≥1360) GameProfileBar

### 10.2 MobileBottomNav

- Position: `fixed; bottom: 0`
- Class: `site-mobile-footer-nav fixed z-[var(--tv-z-nav)] mx-auto w-auto max-w-[25rem]`
- Width: 363px (390vp) — centered with 14px margin each side
- max-width: 25rem (400px) — constrains wider viewports
- Height: 63px (4 nav items grid)
- z-index: var(--tv-z-nav)
- Visibility: `md:hidden` (≥768px hidden)

### 10.3 Safe-area + pb-mobile-nav

- CSS rule app/globals.css line 499-509:
  ```css
  .pb-mobile-nav {
    padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 1.5rem);
  }
  ```
- Mobile override (max-width: 767px): `--bottom-nav-height: 4.75rem`
- Total: 4.75rem + safe-area + 1.5rem = ~6.25rem + safe-area ≈ 100px on iOS

### 10.4 Main padding vs last content

- Last content (footer bottom): y=3738
- BottomNav top: y=768 (in viewport) → effectively y=3738 in document when scrolled to bottom
- **No overlap of main content with BottomNav** because pb-mobile-nav adds 100px buffer

---

## 11. 3D gating results

### 11.1 Home3DHero CSS rule

```css
/* app/globals.css line 32260-32270 */
@media (max-width: 767px) {
  :root {
    --bottom-nav-height: 4.75rem;
  }
  .home-3d-hero { display: none !important; }
}
```

### 11.2 Effect on mobile

- `<section class="home-3d-hero ...">` has `display: none` at viewport ≤767
- Width 0, height 0
- NOT in accessibility tree
- NOT in tab order
- BUT: section still consumes a CSS Grid/flex slot? **NO** — `display: none` removes from layout entirely
- BUT: VibesReactor (3D WebGL) is also gated by JS check `setReactorEnabled(media.matches)` where `media = (min-width: 768px)`. So at ≤767, reactor is never mounted → no WebGL canvas → no perf cost.

### 11.3 Conditional branches verified

- MobileSpotlight, NativePlacement, MobileMethodSteps are siblings of Home3DHero in `<main>`
- Home3DHero's `display: none` does NOT affect siblings (verified by sibling positions in DOM)
- MobileHeroSolar's absence is NOT caused by 3D hiding — it's caused by `showDiscoveryHero = false` (VibeHomeV2 conditional)

### 11.4 Wrapper / parent dimensions

- `<main>` total height: 2479px (includes invisible Home3DHero `min-h-[60vh]` slot — but display:none means it takes 0px)
- After `display: none`, Home3DHero contributes 0 height
- So `<main>` height = Spotlight (1046) + NativePlacement (281) + Method (1052) + gaps = ~2379
- Matches measured 2479 (small gap)

**No anomalies.** 3D gating is clean.

---

## 12. Data vs UI classification

| Section | Status | Category |
|---------|--------|----------|
| SiteHeader | Visible | UI PRESENT (always renders if shell renders) |
| SiteFooter | Visible | UI PRESENT |
| MobileBottomNav | Visible | UI PRESENT (md:hidden so ≥768 invisible — but mobile = visible) |
| MobileSpotlight | Visible | DATA DEPENDENT (`focusTool` must exist; tools must be loaded) |
| NativePlacement | Visible (placeholder text) | UI PRESENT (component renders even without active placement) |
| MobileMethodSteps | Visible | UI PRESENT (data hardcoded in vibe-home-v2.tsx) |
| MobileHeroSolar | NOT MOUNTED | **CONDITIONAL RENDERING** — depends on `showDiscoveryHero = !threeD.enabled` |
| Home3DHero | Mounted but display:none | EXPECTED RESPONSIVE BEHAVIOR (CSS rule) |
| Hero CTAs ("Esplora i tool", "Guarda il Radar") | NOT VISIBLE | CONSEQUENCE OF MobileHeroSolar NOT MOUNTED — not data-related, but conditional |
| Coming Soon waitlist | VISIBLE only when gate closed | CONDITIONAL (default behavior with `publicGate.enabled = true`) |

### Root cause classification

| Symptom | Category | Trigger |
|---------|----------|---------|
| User sees Coming Soon instead of Home | CONDITIONAL | `releaseFeatures.publicGate.enabled = true` AND no valid gate cookie |
| User sees "Qualcosa è andato storto" error page | RUNTIME ERROR (transient) | Stale dev server returning 400 on CSS/JS chunks (now resolved) |
| Mobile users don't see Discovery Stage hero | CONDITIONAL RENDERING | `releaseFeatures.threeD.enabled = true` → `showDiscoveryHero = false` → MobileHeroSolar not mounted |
| MobileHeroSolar copy same as Home3DHero copy | DESIGN INTENT | Both heroes reuse the same eyebrow/h1 copy; only one is shown per state |

---

## 13. Interaction smoke (390×844)

### 13.1 Tap test results

| Element | Clickable | Navigates | Obscured | Pointer events | Runtime error |
|---------|-----------|-----------|----------|----------------|---------------|
| Logo (TOOOLVIBES) in header | YES | n/a (no link) | no | yes | no |
| Hamburger menu in header | YES | n/a (opens menu) | no | yes | no |
| Spotlight "Blink" podium card | YES | /toools/blink | no | yes | no |
| NativePlacement card | YES | n/a (placeholder) | no | yes | no |
| Method card "Scopri" | YES | /archivio | no | yes | no |
| Method card "Confronta" | YES | /compare | no | yes | no |
| Method card "Salva" | YES | /shortlist | no | yes | no |
| Footer link blocks | YES | various | no | yes | no |
| BottomNav "Home" | YES | / | no | yes | no |
| BottomNav "Catalogo" | YES | /archivio | no | yes | no |
| BottomNav "Radar" | YES | /radar | no | yes | no |
| BottomNav "Salvati" | YES | /shortlist | no | yes | no |
| BottomNav "Confronto" | YES | /compare | no | yes | no |

**All 13+ interactive elements register clicks and navigate correctly.** No pointer-events:none observed. No obscured elements.

---

## 14. REPRODUCED FAILURES

### FAILURE 1 — Stale dev server produces "Qualcosa è andato storto" error page
- **Severity:** CRITICAL (user-reported)
- **Reproducible:** YES (was reproducible with stale PID 25652 on port 3100)
- **Root cause:** Stale dev server returning 400 on `_next/static/css/*` and `_next/static/chunks/*` paths
- **Fix:** Kill stale process, start fresh `bun run dev` on port 3000
- **Status:** RESOLVED via fresh dev server
- **NOT a Phase 7 regression:** Phase 7 didn't touch the build manifest; this is operational staleness

### FAILURE 2 — Mobile users do NOT see the Discovery Stage hero copy
- **Severity:** HIGH (real UX gap)
- **Reproducible:** YES (at all 4 mobile viewports when `threeD.enabled=true`)
- **Root cause:** `showDiscoveryHero = !threeD.enabled = false` → MobileHeroSolar NOT rendered
- **Symptom:** The mobile hero copy "Curatela indipendente / Trova il tool giusto / Esplora una selezione ragionata / Esplora i tool / Guarda il Radar" is INVISIBLE on mobile
- **Workaround:** The hidden Home3DHero contains the SAME copy. When `threeD.enabled=false`, MobileHeroSolar IS rendered (matches Home3DHero copy exactly).
- **Decision needed:** Either (a) always render MobileHeroSolar (regardless of threeD), or (b) document that mobile users see Spotlight as their first section.

### FAILURE 3 — Coming Soon waitlist replaces Home for fresh visitors
- **Severity:** MEDIUM (default production state)
- **Reproducible:** YES (env default = publicGate.enabled=true, no cookie sent)
- **Root cause:** Gate cookie not present + publicGate.enabled=true → `<ComingSoonPage />`
- **Fix:** Either (a) set TOOOLVIBES_PUBLIC_GATE_ENABLED=false, (b) provide valid gate cookie
- **NOT a Phase 7 regression:** Phase 7 didn't modify the gate logic.

---

## 15. NON-REPRODUCED FAILURES

| Hypothesized failure | Status |
|---------------------|--------|
| Spotlight overlaps with header | NOT REPRODUCED (spotlight starts at y=66, header ends at y=64) |
| NativePlacement overflows viewport | NOT REPRODUCED (281px tall, well within viewport) |
| Method grid breaks on mobile | NOT REPRODUCED (1052px tall, well-formed) |
| Footer covers BottomNav permanently | NOT REPRODUCED (Footer scrolls past; BottomNav stays fixed; pb-mobile-nav adds buffer) |
| Hero h1 text overflows at 360 | NOT APPLICABLE (MobileHeroSolar not rendered) |
| Orbit shell crops bottom nodes | NOT APPLICABLE (MobileHeroSolar not rendered) |
| Podium cards cramped at 360 | NOT REPRODUCED (1046px height accommodates 3 cards) |
| NativePlacement dominates viewport | NOT REPRODUCED (281px = ~33% of 844 viewport, not dominating) |
| BottomNav overlap with spotlight CTAs | NOT REPRODUCED (pb-mobile-nav adds 100px buffer) |
| Z-index conflict | NOT REPRODUCED (no overlapping z-indexed elements observed) |
| Pages have hardcoded tokens missing | NOT REPRODUCED (CSS loads correctly, all tokens present) |

---

## 16. Root cause hypotheses

### H1 — User reported mobile failure → dev server staleness, not Phase 7
- **Status:** CONFIRMED
- **Evidence:** Stale PID 25652 returned 400 on all static assets; fresh server returns 200 on all assets
- **Implication:** The "completamente rotta" report was caused by an operational issue (dev server not restarted after a build hash change)

### H2 — Mobile hero missing → conditional rendering, not data
- **Status:** CONFIRMED
- **Evidence:** `showDiscoveryHero = false` when `threeD.enabled = true`; MobileHeroSolar component imported but never instantiated
- **Implication:** Mobile users with `threeD.enabled=true` see Spotlight first, NOT the discovery stage hero
- **User impact:** No primary CTA visible above-the-fold; users must scroll 1046px to find any CTA

### H3 — Coming Soon replaces Home → default gate state
- **Status:** CONFIRMED
- **Evidence:** `publicGate.enabled = true` (env default) + no gate cookie → `<ComingSoonPage />`
- **Implication:** Fresh visitors see waitlist, not Home, until they set the gate cookie
- **Production behavior:** Waitlist IS the intended default for fresh traffic; the user was likely viewing through a gate cookie OR the gate flag was disabled for them

---

## 17. EXACT RECOMMENDED FIX SCOPE

### MUST FIX (real bugs)

#### FIX-1: Mobile hero conditional (Failure 2)
**File:** `components/home/vibe-home-v2.tsx:103`

Current:
```tsx
{showDiscoveryHero && <MobileHeroSolar routes={solarRoutes} compact={isTimeToValue} />}
```

Recommendation:
- **Option A:** Always render MobileHeroSolar (delete the conditional)
- **Option B:** Only when threeD DISABLED: `if (!threeD.enabled)` — keeps current behavior but documents intent
- **Option C:** Always render MobileHeroSolar AND keep Home3DHero (mobile users see both — hero + spotlight)

**Recommended:** Option C (always render MobileHeroSolar regardless of threeD, drop the conditional). Rationale: the hero copy is essential for above-the-fold CTA visibility. Home3DHero is already hidden on mobile via CSS, so no visual conflict.

#### FIX-2: Dev server operational discipline (Failure 1)
- **Action:** Document that PID 25652 on port 3100 is stale; ensure fresh `bun run dev` after any build hash change
- **NOT a code fix:** This is operational

### SHOULD DOCUMENT (intentional behavior)

#### DOC-1: Coming Soon as default
- Document that `releaseFeatures.publicGate.enabled = true` is the intended default
- Document that fresh visitors see the waitlist (this is correct production behavior)
- Document the override mechanism (`TOOOLVIBES_PUBLIC_GATE_ENABLED=false` env)

#### DOC-2: 3D vs Mobile hero split
- Document that Home3DHero is for desktop (≥768), MobileHeroSolar was intended for mobile
- Document the discrepancy: currently MobileHeroSolar only renders when threeD is DISABLED, leaving mobile users without primary CTA when threeD is enabled

### NO FIX NEEDED

- SiteHeader, SiteFooter, MobileBottomNav: all work correctly
- MobileSpotlight, NativePlacement, MobileMethodSteps: all work correctly
- Scroll behavior, fixed positioning, z-index: all correct
- Responsive layout across 360/375/390/430: all correct
- Typecheck + tests: PASS

---

## 18. STOP applied per user policy

- ❌ NO code changes
- ❌ NO rebuild
- ❌ NO redesign
- ❌ NO tablet/desktop reconstruction
- ✅ Read-only runtime inspection via Playwright
- ✅ All 4 mobile viewports captured
- ✅ DOM forensics complete
- ✅ Conditional rendering root causes identified
- ✅ User-reported failure root-caused (stale dev server, not Phase 7)
- ✅ Real mobile composition verified at runtime

### Working tree
- Only screenshot artifacts added (audits/home-runtime-step2-2026-07-21/*.png)
- No code edits
- Dev server now on port 3000 (was on port 3100, then 3000)

### Next-step readiness
The Step 3 decision (rebuild vs leave as-is) now has concrete evidence:
- **Leave as-is:** The architecture is sound. Failure 2 (mobile hero missing) is a one-line conditional fix. Failure 1 was operational (now resolved).
- **Rebuild:** Not justified. All sections work, all interactions work, all 4 mobile widths render correctly.

**Recommendation:** Apply FIX-1 (one-line change in vibe-home-v2.tsx) to restore the mobile hero. Then proceed to Tablet/Desktop expansion per Step 6/7 of the original plan.
