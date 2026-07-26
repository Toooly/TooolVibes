# UI Fragmentation Master Map — TOOOLVIBES PRE-UI-REBUILD AUDIT

**Date:** 2026-07-21
**Branch:** `main` @ `fc67ecc` (stable baseline)
**Purpose:** Map the visual/component fragmentation that exists BEFORE the upcoming UI rebuild
**Status:** Diagnostic only — no rebuild attempted

---

## 1. Executive Summary

TooolVibes frontend currently contains **multiple coexisting visual families**. They share files, components, and styles but speak different visual languages. This is normal for a product that has evolved over years. The upcoming rebuild MUST converge these into a single canonical system.

**Key metric:** 11 CSS files (368 KB unminified) + 26 folders of components + 25+ visual idioms + 4 distinct eras.

---

## 2. NUMBER OF VISUAL FAMILIES

**Distinct families detected: 8**

| # | Family | Source | Era | Tokens? |
|---|--------|--------|-----|---------|
| F1 | Shadcn/ui baseline | `components/ui/*.tsx` | Mid-era (current canonical primitives) | ✅ partial |
| F2 | Figma handoff | `styles/figma-final-polish.css`, `styles/figma-implementation.css` (45KB combined) | FigSpec era | ✅ heavy (`!important` everywhere) |
| F3 | 3D Maestoso / Vibes | `styles/vibes-3d-maestoso.css` (164KB), `components/3d-maestoso/*` | Premium-immersive | ⚠️ partial |
| F4 | Mobile-first catalog | `styles/catalog.css`, `components/directory/*` | Catalog era | ⚠️ minimal |
| F5 | Gamification energy | `styles/gamification.css`, `components/gamification/*` | Engagement era | ⚠️ partial |
| F6 | Editorial premium | `styles/home.css` + premium panels | Editorial era | ✅ token-aligned |
| F7 | Admin / panel | `styles/account.css`, `styles/depth-scene.css`, `components/account/*` | Workspace era | ⚠️ partial |
| F8 | Radar / signals | `styles/radar.css`, `components/radar/*`, `components/product-hunt/*` | Real-time era | ⚠️ partial |

---

## 3. Design Eras Timeline

| Era | Approx Period | Characteristics | Surviving Files |
|-----|---------------|-----------------|-----------------|
| **Era 0** (Bootstrap) | pre-2024 | Default CSS, no tokens | none |
| **Era 1** (Early Marketing) | 2024-mid | Tailwind defaults, hex literals | some account.css, gamification.css |
| **Era 2** (Figma Handoff) | 2024-Q4 | `tv-figma-theme` wrapper, heavy `!important`, premium-button | figma-*.css |
| **Era 3** (3D Maestoso) | 2024-Q4 / 2025 | VibesReactor, editorial discovery, premium sections | vibes-3d-maestoso.css, 3d-maestoso/* |
| **Era 4** (Catalog refactor) | 2025 | Mobile catalog view, command panel | catalog.css, directory/* |
| **Era 5** (Token foundation)** | 2025-Q4 / 2026-Q1 | `--tv-*` tokens, semantic aliases | tokens.css (411 tokens) |
| **Era 6** (Phase 5-6 primitive migration)** | 2026 | Badge/Chip/Select/Overlay tokenization | ui/* components updated |
| **Era 7** (Phase 7 — REVERTED)** | 2026-07 | Dead-zone fix, container tokens (BAD: broke 4 invariants) | reverted at e26f447 |

---

## 4. Component Atlas (212 components across 26 folders)

### Canonical primitives (KEEP)
- **button**, **input**, **textarea**, **select** — Phase 5 migrated
- **badge**, **chip** — Phase 6 migrated
- **dialog**, **sheet**, **drawer**, **popover**, **dropdown-menu**, **tooltip** — Phase 6 migrated
- **card**, **premium-panel**, **premium-section** — coexist for different surface tiers
- **switch**, **accordion**, **tabs**, **carousel**, **skeleton** — unmigrated, basic shadcn
- **motion-observer** — utility
- **chip** — Phase 6 variant system

### HERO components (multiple competing implementations)
| Hero | File | Status |
|------|------|--------|
| `<Home3DHero>` | `components/3d-maestoso/home-3d-hero.tsx` | 3D canvas hero (hidden mobile) |
| `<MobileHeroSolar>` | `components/home/mobile-hero-solar.tsx` | Mobile discovery (FIX-1) |
| `<VibeHomeV2>` | `components/home/vibe-home-v2.tsx` | Wrapper |
| `<MobileMarketingHero>` | `components/home/mobile-marketing-hero.tsx` | **ORPHAN** (unused) |
| `<HeroSection>` | `components/home/hero-section.tsx` | **ORPHAN** (unused) |
| `<TiltCard>` | `components/home/tilt-card.tsx` | **ORPHAN** (utility, unused in home) |
| `<FloatingSectionAnchor>` | `components/home/floating-section-anchor.tsx` | **ORPHAN** |
| `<ScrollReveal>` | `components/home/scroll-reveal.tsx` | Utility used outside home |

**Verdict:** 4 ORPHAN files in `components/home/`. Need cross-route audit before deletion.

### CARDS (highest fragmentation)
| Card | File | Owner | Used By |
|------|------|-------|---------|
| **DirectoryToolCard** | `components/directory/directory-tool-card.tsx` | Directory | /archivio, /toools/[slug] |
| **MobileToolCard** | `components/catalog/mobile-tool-card.tsx` | Catalog | /archivio (mobile) |
| **DirectoryToolGlyph** | `components/directory/directory-tool-glyph.tsx` | Directory | Tool detail |
| **CollectionCard** | `components/collections/collection-card.tsx` (assumed) | Collections | /collections |
| **ShopProductCard** | inferred | Shop | /shop |
| **AffiliateCard** | inferred | Affiliates | /affiliati |
| **CommunityCard** | inferred | Community | /community |
| **RadarCard** | inferred | Radar | /radar |
| **ShortlistCard** | inferred | Shortlist | /shortlist |
| **MethodCard** | inferred | Method | /metodo |
| **PremiumCard / PremiumPanel** | `components/ui/premium.tsx` | UI | account, etc |
| **EditorialCard** (Figure) | inferred | Editorial | (orphan feature?) |
| **Card** (shadcn) | `components/ui/card.tsx` | UI | everywhere |

**Verdict:** 10+ distinct card implementations. Best current: **DirectoryToolCard** (Phase 6 migrated, token-aligned). Worst current: **PremiumPanel** (`!important` heavy, Figma era spec).

### HEADERS
- **SiteHeaderV2** (only) — fixed, sticky, 594 lines
- **SiteFooterV2** (only) — 1196px tall, footer blocks pattern

### BADGES / CHIPS
- **Badge** (Phase 6: 18 status-soft tokens)
- **Chip** (Phase 6: 7 variants)
- **Pill**-style: ad-hoc, hardcoded hex in many components

### MODALS / DRAWERS / SHEETS
- **Dialog**, **Sheet**, **Drawer**, **Popover**, **DropdownMenu**, **Tooltip** (all Phase 6)
- **Command** (un-migrated, shadcn-default)
- **Sonner** (toaster — also un-migrated)

### EMPTY / LOADING STATES
- ✅ **Radar** (RadarViewSwitch has coherent loading/empty/error)
- ✅ **Shortlist** (empty state with CTA)
- ⚠️ **Compare** — needs audit (uses `desktop-compare` vs `mobile-matrix`?)
- ⚠️ **Catalog** — MobileCatalogView has empty state
- ⚠️ **Account** — LOADING state hangs 2.7s (FIXED by commit fc67ecc)

### NAVIGATION
- **SiteHeaderV2** (`min-[1360px]:flex`, custom breakpoints)
- **MobileBottomNav** (5 items, fixed, `md:hidden`)
- **OrbitalLayer** (3D overlay, decorative)
- **FloatingSectionAnchor** (orphan)

---

## 5. Folder-by-folder Map

| Folder | Component count | Token alignment | Family |
|--------|----------------|-------------------|--------|
| `components/ui/` | 26 | Mixed (14 tokenized via Phase 5-6, 12 untokenized) | F1 + F2 |
| `components/3d-maestoso/` | 16 | Mostly hex literals | F3 (Maestoso) |
| `components/desktop/` | 9 | Hex-heavy | F8 + F3 |
| `components/gamification/` | 19 | Mixed | F5 |
| `components/home/` | 9 (4 orphans) | Token-aligned | F6 |
| `components/account/` | 16 | Heavy rgba literals | F7 |
| `components/directory/` | 23 | Mixed | F4 |
| `components/tools/` | 20 | ? | mixed |
| `components/layout/` | 5 (Header + BottomNav + Footer + 3D providers) | token-aligned | mixed |
| `components/radar/` | 3 | mixed | F8 |
| `components/monetization/` | 1 | ? | F2 (ad slots) |
| `components/app/` | 22 | mixed | core utilities |
| `components/admin/` | 11 (out of scope) | mixed | F1 |

---

## 6. Route-by-route Visual Family

| Route | Primary family | Secondary families |
|-------|---------------|---------------------|
| `/` | F6 (Editorial premium) | F3 (3D hidden) |
| `/archivio` | F4 (Catalog) | F1 (cards) |
| `/collections` | F4 + custom | F1 |
| `/toools/[slug]` | F6 (editorial) | F1 (cards/badges), F2 (cta buttons) |
| `/compare` | F8 (Compare specific) | F2 (premium buttons) |
| `/shortlist` | F3 (Vibes 3D) | F1 (cards) |
| `/radar` | F8 (Radar) | F3 |
| `/tags` | F1 (grid + chips) | – |
| `/wishlist` | redirect → `/shortlist#wishlist` | F3 |
| `/shop` | F2 (cards) | F1 |
| `/community` | F1 (cards + feed) | F5 |
| `/posts`, `/posts/[slug]` | F6 (editorial) | F1 |
| `/metodo` | F6 (numbered method) | F1 |
| `/chi-siamo` | F6 (editorial) | F2 (premium buttons) |
| `/account` | F7 (Workspace) | F1 |
| `/affiliati` | F6 (editorial) | F2 |

---

## 7. Card Fragmentation

**Distinct card types found: ~10**
- DirectoryToolCard (current best)
- MobileToolCard
- CollectionCard
- ShopProductCard
- AffiliateCard
- CommunityCard
- RadarCard
- ShortlistCard
- MethodCard
- PremiumPanel/PremiumSection

Each has potentially different:
- Border radius (28px / 30px / 32px)
- Padding (16px / 20px / 24px)
- Background (white/82 / rgba variants / gradient)
- Hover behavior (lift / glow / scale)

**Future consolidation target:** 3-4 card primitives max:
- `Card` (default surface)
- `PremiumPanel` (highlighted premium)
- `EditorialCard` (long-form)

---

## 8. Navigation Fragmentation

- 3 nav components: SiteHeaderV2, MobileBottomNav, OrbitalLayer
- Header breakpoints: `min-[430px]`, `min-[1360px]` (custom)
- BottomNav: `md:hidden` (Tailwind default)
- 3D Overlay: pointer-events-none

**Future consolidation target:** 2 nav primitives max:
- `SiteHeader` (responsive)
- `BottomNav` (responsive)

---

## 9. Typography Fragmentation

- 9 semantic roles in tokens (hero, display, heading, title, subtitle, body, body-sm, label, eyebrow, caption)
- 3 component implementations: SectionHeader (canonical), SectionHeading (feature-local), SurfaceIntro (feature-specific)
- Phase 6 fixed inheritance via `var(--tv-font-display)` etc.

**Future action:** Consolidate SectionHeader as sole interface, deprecate the other two.

---

## 10. Surface Fragmentation

| Tier | Token | Usage |
|------|-------|-------|
| tier-1 | `--tv-surface-tier-1` | Background |
| tier-2 | `--tv-surface-tier-2` | Card default (`--tv-card-bg = var(--tv-surface-tier-2)`) |
| tier-3 | `--tv-surface-tier-3` | Premium panels |
| tier-4 | `--tv-surface-tier-4` | Highlight |

**Fragmentation issue:** many components still use `--surface-brand-panel-bg`, `--surface-metadata-bg` (legacy radial-gradient prefixes) defined in `app/globals.css:60-100`.

**Future action:** Consolidate legacy surface variables into `--tv-surface-tier-*`.

---

## 11. Interaction Fragmentation

| Pattern | Variants observed |
|---------|-------------------|
| **Hover lift** | `translateY(-2px)`, `translateY(-4px)`, `-translate-y-0.5`, `lift-1`, `lift-2` |
| **Hover scale** | `scale-95`, `scale-[0.98]`, `scale-[1.02]` |
| **Focus ring** | 2px / 3px / 5px variations in `!important` overrides |
| **Press feedback** | `active:scale-95`, `data-[pressed]` |

**Future action:** Single canonical hover/focus/press pattern applied across all interactive elements.

---

## 12. Motion Fragmentation

- 5 motion semantic levels in tokens (instant 80ms → cinematic 720ms)
- 8 easings
- BUT: many components use literal `duration-300`, `duration-700`, `transition-all duration-500`
- **Cross-route inconsistency** — components in same visual family use different durations

**Future action:** Audit + replace literals with token references.

---

## 13. CSS Ownership Map

| Family | Primary CSS | Override source | Future consolidation |
|--------|------------|-----------------|----------------------|
| F1 (shadcn primitives) | tailwind utility | `figma-final-polish.css` (`!important`) | remove `!important` |
| F2 (Figma) | `figma-final-polish.css`, `figma-implementation.css` (45KB) | multiple | merge into tokens |
| F3 (Maestoso) | `vibes-3d-maestoso.css` (164KB) | radial-gradients + per-component | split by domain |
| F4 (Catalog) | `catalog.css` (8KB) | `directory/*` components | merge |
| F5 (Gamification) | `gamification.css` (17KB) | per-component | audit |
| F6 (Editorial) | `home.css` (6KB) + per-component | minimal | keep |
| F7 (Workspace) | `account.css` (16KB), `depth-scene.css` (11KB) | mixed | audit |
| F8 (Radar) | `radar.css` (18KB) | per-component | audit |

**Total CSS:** 367.7 KB unminified, ~30-40% can likely be eliminated in rebuild.

---

## 14. Best Current References (KEEP)

| Component / Pattern | Why | Used by |
|---------------------|-----|---------|
| **DirectoryToolCard** | Token-aligned, responsive, Phase 6 migrated | /archivio, /toools/[slug] |
| **MobileBottomNav** | Compact, focused, accessible | all mobile routes |
| **MobileHeroSolar** | Editorial premium pattern, FIX-1 verified | / |
| **RadarViewSwitch** | Has empty/loading/error states documented | /radar |
| **VibeHomeV2** | Composes correctly (post FIX-1) | / |
| **SectionHeader** (canonical) | Clean semantic structure | premium sections |
| **tokens.css** | 411 tokens, 100% coverage | global |
| **`var(--tv-motion-*)`** tokens | Semantic motion levels | – |

---

## 15. Components to KEEP

26 primitives: button, input, textarea, select, badge, chip, dialog, sheet, drawer, popover, dropdown-menu, tooltip, card, premium-panel, premium-section, motion-observer, switch, accordion, tabs, carousel, skeleton, sonner, command, separator, etc.
+ SiteHeaderV2, SiteFooterV2, MobileBottomNav
+ DirectoryToolCard (canonical tool card)
+ MobileHeroSolar, MobileSpotlight, MobileMethodSteps, MobileCatalogView (mobile catalog)

---

## 16. Components to REBUILD

| Target | Reason |
|--------|--------|
| **All card variants** (10+ types) | Consolidate into 3-4 canonical |
| **Header breakpoints** | Replace `min-[1360px]` with Tailwind `xl` |
| **Figma-era premium buttons** | Remove `!important` overrides |
| **Surface gradient variables** (`--surface-brand-panel-bg` etc.) | Migrate to `--tv-surface-tier-*` |

---

## 17. Components to CONSOLIDATE

| Multiple → One |
|----------------|
| HeroSection + MobileMarketingHero + Home3DHero + MobileHeroSolar → 2 heroes max (mobile + desktop) |
| TiltCard + FloatingSectionAnchor + scroll-reveal → 1 motion utility |
| DirectoryToolGlyph + MobileToolCard → single tool card primitive |
| SectionHeader (canonical) + SectionHeading + SurfaceIntro → SectionHeader only |

---

## 18. Components to DEPRECATE

After migration succeeds, the following can be safely deleted:
- `components/home/tilt-card.tsx` (orphan, unused)
- `components/home/floating-section-anchor.tsx` (orphan, unused)
- `components/home/hero-section.tsx` (orphan, used by what?)
- `components/home/mobile-marketing-hero.tsx` (orphan, used by what?)
- `components/home/mobile-marketing-hero.tsx` (orphan)
- Legacy `--surface-*` gradient aliases in `app/globals.css:60-100`

---

## 19. Future UI Rebuild Priority

| Priority | Task | Estimated scope |
|----------|------|-----------------|
| P0 (CRITICAL) | Card consolidation (1 canonical) | 10 components → 1 |
| P0 | Remove `!important` overrides | 45KB CSS savings |
| P1 (HIGH) | Hero consolidation (mobile + desktop) | 4 components → 2 |
| P1 | Surface tier consolidation | global migration |
| P2 (MEDIUM) | Typography consolidation | 3 → 1 component |
| P2 | Motion literal → token audit | cross-route |
| P3 (LOW) | Delete orphans | 4 files |
| P3 | CSS file merge by family | 11 → 4-5 files |

---

## 20. Recommended Rebuild Order

1. **Establish canonical token contract** (Phase 4 already in place; expand `tv-*` for all surface/motion/radius)
2. **One canonical Card primitive** + 1 alternative (PremiumPanel)
3. **One canonical Hero primitive per viewport** (mobile, desktop)
4. **Migrate all card-shadowed components** to canonical Card
5. **Migrate all hero-shadowed components** to canonical Hero
6. **Migrate all surface variables** to `--tv-surface-tier-*`
7. **Remove `!important` overrides**
8. **Delete orphans** (after cross-route audit)
9. **Final CSS bundle reduction**
10. **Visual regression suite** (Playwright screenshot diff)

---

**This map is the foundation for the upcoming UI rebuild phase.**

After this map is reviewed and approved, we can begin Phase 8 (UI Rebuild) with confidence that we are converging on a single canonical system rather than adding another layer of inconsistency.
