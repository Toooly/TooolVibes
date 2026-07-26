# TooolVibes Desktop UI Audit Report

**Scope:** Next.js 15 App Router, Tailwind 4, desktop viewport (≥1024px) and intermediate (768–1280px).  
**Method:** Read-only code analysis of `app/` and `components/`.  
**Date:** 2026-07-21

---

## 1. DESKTOP ARCHITECTURE VERDICT

- **No single container primitive.** The closest thing is `.page-shell` (`max-w-[84rem]` ≈ 1344px) used in marketing pages, but the active header/footer cap at `max-w-[1440px]`, admin locks to `max-w-[1440px]`, and text blocks scatter across `max-w-[42rem]`, `[44rem]`, `[40rem]`, etc. The result is a ragged content band with no consistent reading measure or alignment across routes. (`app/globals.css:393`, `components/layout/site-header-v2.tsx:301`, `components/layout/site-footer-v2.tsx:45`, `app/(admin)/admin/(protected)/layout.tsx:33`)
- **Home and Collections are “stretched mobile.”** The default home render path (`VibeHomeV2`) mounts `MobileHeroSolar`, `MobileSpotlight`, and `MobileMethodSteps`; the collections page delegates entirely to `MobileCollectionsView`. On a 1440px monitor these routes remain single-column, centered, with 400–600 px of empty lateral space and no desktop-specific grid or sidebar. (`app/(marketing)/page.tsx`, `components/home/vibe-home-v2.tsx`, `app/(marketing)/collections/page.tsx`, `components/collections/mobile-collections-view.tsx`)
- **`components/desktop/` is mostly a graveyard.** Only `DesktopVibeRadar` (plus `DesktopRadarNodes` and `DesktopRadarTable`) is dynamically imported by `/radar`. The remaining six files (`DesktopVibeArchive`, `DesktopVibeCompare`, `DesktopVibeWishlist`, `DesktopCompareCanvas`, `DesktopDepthScene`, `DesktopRadarCanvas`) are never imported anywhere in the app, yet they still pull ~3 000 lines of dead CSS rules into `globals.css`. (`components/radar/radar-view-switch.tsx`, `components/desktop/desktop-vibe-radar.tsx`, `components/desktop/desktop-vibe-archive.tsx`, `components/desktop/desktop-vibe-compare.tsx`, `components/desktop/desktop-vibe-wishlist.tsx`, `components/desktop/desktop-radar-canvas.tsx`, `components/desktop/desktop-compare-canvas.tsx`, `components/desktop/desktop-depth-scene.tsx`)
- **Tablet/small-laptop breakpoints are skipped everywhere.** Key layouts—tool detail, directory hero, collections card, about page, affiliate page—jump straight from `sm:` or default to `lg:`/`xl:` with no `md:` step. That leaves the 768–1023 px range (and often 1024–1279 px) with either a single column or an oversized mobile layout. (`app/(marketing)/toools/[slug]/page.tsx:170`, `components/directory/directory-hero.tsx:21`, `components/collections/collection-card.tsx:70`, `app/(marketing)/affiliati/page.tsx:38`)
- **Hover is the only interaction state on marketing surfaces.** Cards, stat chips, footer links, and header nav items all rely on `hover:` for lift, shadow, and color changes, with no corresponding `active:` or `focus-visible:` classes. Touch users on hybrid devices get zero press feedback. (`components/directory/directory-hero.tsx:53`, `components/layout/site-footer-v2.tsx`, `components/directory/tool-discovery-app.tsx:193`, `components/home/hero-section.tsx`)

---

## 2. CONTAINER / MAX-WIDTH TABLE

| Tailwind class | Occurrences | Primary locations |
|---|---|---|
| `max-w-none` | 23 | Headings & card titles across collections, posts, tools, compare |
| `max-w-[42rem]` | 14 | Body copy blocks in tool detail, posts, admin forms, about |
| `max-w-[40rem]` | 8 | Tags page, tool detail CTA area, collections hero |
| `max-w-[34rem]` | 7 | Loading skeletons, shortlist, about page subheads |
| `max-w-md` | 6 | Auth callback, error recovery, admin login |
| `max-w-[44rem]` | 6 | Admin forms, posts page, account hero |
| `max-w-3xl` | 6 | Legal pages (privacy, terms, cookie), 3D heroes |
| `max-w-xl` | 5 | 3D hero subtitles, error recovery, compare board |
| `max-w-sm` | 5 | Dialogs, gamification modals, gate modal |
| `max-w-[1440px]` | 5 | Header v2 shell, footer v2 shell, admin layout shell |
| `max-w-[84rem]` | 1 | `.page-shell` primitive (`globals.css`) |
| `max-w-[72rem]` | 1 | Radar table wrapper (`desktop-vibe-radar.tsx`) |
| `max-w-[48rem]` | 3 | Community page, product-hunt rankings, shop page |
| `max-w-[36rem]` | 3 | Loading skeletons, directory weekly spotlight |

**Verdict:** There is no canonical container. The `page-shell` (84rem) is the most frequent outer boundary, but it is overridden or bypassed by per-section arbitrary widths on nearly every route.

---

## 3. PER-ROUTE DESKTOP LAYOUT NOTES

| Route | Desktop structure (≥1024px) | Stretched mobile? / Wasted space? |
|---|---|---|
| **/** (home) | `VibeHomeV2` renders `MobileHeroSolar` (`max-w-sm`), `MobileSpotlight`, `MobileMethodSteps` (`max-w-6xl`). If 3D is enabled, `HeroSection` adds a `max-w-[1440px]` hero band. | **Yes.** Default home is a single centered column with ~500 px side voids at 1440px. No multi-column exploitation. |
| **/archivio** | `MobileCatalogView` inside `FloatingCatalogView`. Directory hero uses `xl:grid-cols-[0.98fr_25rem]` (no `md:`). Tool grid is `md:grid-cols-2 xl:grid-cols-3`. Filter sidebar is `lg:grid-cols-[20rem_1fr]`. | Partial. Tablet (768–1023) gets single-column catalog; desktop gets sidebar + 3-col grid, but the hero mini-visual only appears at `xl:` (≥1280). |
| **/toools/[slug]** | Hero: `lg:grid-cols-[1.05fr_18rem]` with metadata sidebar. Editorial: `lg:grid-cols-[1fr_1fr]`. Related tools: `md:grid-cols-2 xl:grid-cols-3`. | No. Clear two-column split on desktop. However, no `md:` step means the switch is abrupt at 1024px. |
| **/compare** | `ToolBattleView` swaps to `DesktopCompareView` at 768px. Compare board grid: `sm:grid-cols-2 lg:grid-cols-3`. | No dedicated desktop layout file; the swap is binary. Desktop workspace is functional but the boundary is hard. |
| **/radar** | `RadarViewSwitch` swaps to `DesktopVibeRadar` at 1024px. Stage is centered; table view capped at `max-w-[72rem]`. | No. Desktop is a contained stage, not full-bleed. The 3D canvas fills the stage area. |
| **/posts** | Hero uses `lg:col-span-8` / `lg:col-span-4` (12-col implicit grid). Post cards: `md:grid-cols-2 xl:grid-cols-3`. | No. Asymmetric editorial layout with dense sidebar on desktop. |
| **/account** | `AccountGate` → `AccountPanel` / `AuthPage`. Single column, `max-w-[22ch]` headings, `max-w-[44rem]` body, inside `page-shell`. | **Yes.** No sidebar or grid; pure centered single column. |
| **/collections** | `MobileCollectionsView` drives the entire page. Custom CSS classes (`mobile-collections__list-grid`) with no responsive grid breakpoint. | **Yes.** Full-bleed single column at all widths; the hero card and list stack vertically with no desktop grid. |

---

## 4. ISSUE LISTS

### DESKTOP CRITICAL [P1]

1. **Collections page is permanently mobile.** `MobileCollectionsView` has no responsive grid, no sidebar, and no max-width guard beyond `page-shell`. At 1440px+ it is a full-bleed single column wasting the entire viewport width.  
   _Files:_ `app/(marketing)/collections/page.tsx`, `components/collections/mobile-collections-view.tsx`

2. **Home page defaults to mobile components.** `VibeHomeV2` mounts `MobileHeroSolar` (`max-w-sm`), `MobileSpotlight`, and `MobileMethodSteps`. On desktop this produces a narrow centered ribbon with hundreds of pixels of empty space on each side.  
   _Files:_ `app/(marketing)/page.tsx`, `components/home/vibe-home-v2.tsx`, `components/home/mobile-hero-solar.tsx`, `components/home/mobile-method-steps.tsx`

3. **Dead desktop components bloat CSS.** Six files in `components/desktop/` (`DesktopVibeArchive`, `DesktopVibeCompare`, `DesktopVibeWishlist`, `DesktopRadarCanvas`, `DesktopCompareCanvas`, `DesktopDepthScene`) are never imported, yet `globals.css` contains ~3 000 lines of rules targeting their selectors.  
   _Files:_ `components/desktop/desktop-vibe-archive.tsx`, `components/desktop/desktop-vibe-compare.tsx`, `components/desktop/desktop-vibe-wishlist.tsx`, `components/desktop/desktop-radar-canvas.tsx`, `components/desktop/desktop-compare-canvas.tsx`, `components/desktop/desktop-depth-scene.tsx`, `app/globals.css`

### DESKTOP HIGH [P2]

4. **Tool detail jumps abruptly at 1024px.** The hero layout switches from single column to `lg:grid-cols-[1.05fr_18rem]` with no `md:` treatment. On a 768–1023px tablet the page remains a single full-width column, making the sidebar metadata (highlights, tags, CTA) stack below the fold.  
   _File:_ `app/(marketing)/toools/[slug]/page.tsx:170`

5. **Directory hero jumps at 1280px.** `directory-hero.tsx` uses `xl:grid-cols-[0.98fr_25rem]` with no `md:` or `lg:` step. Between 768–1279px the hero is a single column and the right-hand mini-visual (tool preview cards) is completely hidden (`xl:block`).  
   _File:_ `components/directory/directory-hero.tsx:21`

6. **Compare page has a hard 768px swap.** `ToolBattleView` mounts an entirely different component tree (`MobileCompareView` vs `DesktopCompareView`) based on `matchMedia("(min-width: 768px)")`. There is no shared skeleton, no transition, and no intermediate layout.  
   _File:_ `components/tools/tool-battle-view.tsx`

7. **Radar page has a hard 1024px swap.** `RadarViewSwitch` does the same at 1024px (`DesktopVibeRadar` vs `MobileRadarView`). The desktop tree includes a 3D canvas that is never pre-warmed for tablet users.  
   _File:_ `components/radar/radar-view-switch.tsx`

### DESKTOP MEDIUM [P2–P3]

8. **Container widths are inconsistent.** Outer shells use three different caps: `page-shell` = 84rem (~1344px), header/footer = 1440px, admin = 1440px. Text blocks inside marketing pages use arbitrary `max-w-[42rem]`, `[44rem]`, `[40rem]` with no alignment to a grid.  
   _Files:_ `app/globals.css:393`, `components/layout/site-header-v2.tsx:301`, `components/layout/site-footer-v2.tsx:45`, `app/(admin)/admin/(protected)/layout.tsx:33`

9. **Header v2 hides desktop nav until 1360px.** `site-header-v2.tsx` uses `min-[1360px]:flex` for the main nav and `min-[1360px]:flex` for the gamification bar. On a standard 1024–1359px laptop the hamburger menu and mobile search remain, even though there is ample horizontal space.  
   _File:_ `components/layout/site-header-v2.tsx:338`

10. **Footer grid is unbalanced at 768–1023px.** `site-footer-v2.tsx` uses `md:grid-cols-2 lg:grid-cols-4`. At 768–1023px the first column (brand blurb + social icons) shares a 2-column row with the “Esplora” links, creating a lopsided density gap before the 4-column desktop layout kicks in.  
   _File:_ `components/layout/site-footer-v2.tsx:46`

### DESKTOP POLISH [P3]

11. **Hover-only interaction states.** Marketing cards (`directory-hero.tsx` stat chips, `tool-discovery-app.tsx` filter chips), footer links, and CTA buttons rely exclusively on `hover:` for visual feedback. No `active:` or `focus-visible:` classes are present, so touch/hybrid users see no press state.  
   _Files:_ `components/directory/directory-hero.tsx:53`, `components/directory/tool-discovery-app.tsx:193`, `components/layout/site-footer-v2.tsx`, `components/home/hero-section.tsx`

12. **No 1728px+ breakpoint in active layout.** The `2xl:` breakpoint is only used in the legacy `site-header.tsx`. The active marketing layout (`site-header-v2`, `page-shell`, footer) provides no spacing, font, or grid adjustments for ultra-wide monitors.  
   _File:_ `components/layout/site-header-v2.tsx`

13. **Marketing backplane gradient has a fixed height.** `.marketing-shell__backplane` sets `height: 36rem` and absolute positioning. On ultra-wide monitors the gradient may not cover the full content width, producing a visible hard edge where the backplane ends.  
   _File:_ `app/globals.css` (`.marketing-shell__backplane`)

---

## 5. INTERMEDIATE VIEWPORT GAPS (top 10)

The following components jump from mobile/default straight to `lg:` or `xl:` without an `md:` step, leaving the 768–1023 px (and sometimes 1024–1279 px) range with no tailored layout.

| # | File & line | Missing step | What happens at 768–1023 px |
|---|---|---|---|
| 1 | `app/(marketing)/affiliati/page.tsx:38` | `lg:grid-cols-[0.92fr_22rem]` | Single column; partner CTA and form stack vertically |
| 2 | `app/(marketing)/community/page.tsx:48` | `lg:grid-cols-[1fr_20rem]` | Single column; community stats and description stack |
| 3 | `app/(marketing)/shop/page.tsx:37` | `lg:grid-cols-[0.94fr_20rem]` | Single column; shop hero and product list stack |
| 4 | `app/(marketing)/toools/[slug]/page.tsx:170` | `lg:grid-cols-[1.05fr_18rem]` | Single column; tool metadata sidebar drops below fold |
| 5 | `app/(marketing)/toools/[slug]/page.tsx:360` | `lg:grid-cols-[1fr_1fr]` | Single column; use-cases and editorial blocks stack |
| 6 | `components/directory/directory-hero.tsx:21` | `xl:grid-cols-[0.98fr_25rem]` | Single column; right-hand mini-visual hidden until 1280px |
| 7 | `components/directory/directory-weekly-spotlight.tsx:34` | `xl:grid-cols-[1.18fr_21rem]` | Single column; spotlight sidebar hidden until 1280px |
| 8 | `components/directory/home-catalog-preview.tsx:26` | `lg:grid-cols-[0.86fr_1.14fr]` | Single column; catalog preview image/text stack |
| 9 | `components/about/about-page.tsx:219` | `lg:grid-cols-[0.88fr_24rem]` | Single column; about hero image and copy stack |
| 10 | `components/collections/collection-card.tsx:70` | `lg:grid-cols-[1.05fr_0.95fr]` | Card internal layout stays single column until 1024px |

*Additional instances:* `components/tools/tool-card.tsx:95` (`lg:grid-cols-[1.05fr_0.95fr]`), `components/tools/shortlist-board.tsx:174` (`lg:grid-cols-[1.45fr_0.85fr]`), `components/layout/site-footer.tsx:21` (`lg:grid-cols-[0.88fr_18rem]`).

---

*End of report.*
