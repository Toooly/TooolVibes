# TooolVibes Interaction & Motion Audit — AGENT 4 Report

**Scope:** Read-only audit of the interaction & motion layer across the entire Next.js 15.5 / React 19 / Tailwind v4 / shadcn base-nova frontend.
**Date:** 2026-07-21
**Auditor:** AGENT 4 (GUI Interaction Expert)

---

## A. INTERACTION SYSTEM MAP

The app has a **layered but partially fragmented** interaction architecture. Four distinct subsystems coexist without a single shared contract:

| Layer | What it is | Key files |
|-------|-----------|-----------|
| **Overlay Primitives** | 8 UI primitives wrapping 5 underlying libs | `components/ui/dialog.tsx`, `drawer.tsx`, `sheet.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`, `command.tsx`, `sonner.tsx` |
| **Custom Overlays** | Hand-rolled modals, search panels, mobile menus outside primitives | `site-header-v2.tsx`, `badge-unlock-modal.tsx`, `level-up-modal.tsx`, `gate-modal.tsx`, `intro-cinematic.tsx` |
| **Motion / Animation** | 4 competing animation subsystems | `motion/react` (~32 files), GSAP (setup only), `tw-animate-css` (CSS data-open/data-closed), custom CSS keyframes |
| **Feedback Layer** | Sound, haptics (visual), confetti, toasts, number animations | `sound.ts`, `interaction-sound-layer-v2.tsx`, `canvas-confetti`, `@number-flow/react`, `sonner` |
| **Scroll System** | Lenis smooth scroll + GSAP ticker + ScrollTrigger + CSS view-timeline | `lenis-provider.tsx`, `globals.css` |
| **State Layer** | Tailwind data-attributes + Base UI state props + custom React state | Spread across all `components/ui/*` |

**Critical finding:** The overlay layer is **not unified**. The app uses `@base-ui/react` for Dialog/Sheet/Popover/Tooltip/Dropdown/Accordion/Select/Tabs, `vaul` for Drawer, `cmdk` for Command palette, and `sonner` for toasts. But then `site-header-v2.tsx` implements its **own focus trap, backdrop isolation, and mobile menu** from scratch with `motion/react`, bypassing every primitive. Two gamification modals (`badge-unlock-modal`, `level-up-modal`) use raw `fixed inset-0 z-50` divs instead of the Dialog primitive.

---

## B. OVERLAY MATRIX

| Component | Underlying Lib | Animation Lib | Backdrop | Z-Index | Duration | Mobile Behavior | Usage Count (files) |
|-----------|---------------|---------------|----------|---------|----------|-----------------|---------------------|
| **Dialog** | `@base-ui/react/dialog` | `tw-animate-css` (`data-open:animate-in`, `fade-in-0`, `zoom-in-95`) | `bg-[rgba(9,13,28,0.52)]` | `var(--tv-z-overlay)` | `duration-100` | Same on all breakpoints | 6 files (`command.tsx`, `gate-modal.tsx`, `site-header-v2.tsx`, etc.) |
| **Drawer** | `vaul` | `tw-animate-css` (`data-open:animate-in`, `fade-in-0`) | Same color as Dialog | `var(--tv-z-overlay)` | No explicit duration class | Bottom sheet on mobile, configurable direction | 4 files (`tool-discovery-app.tsx`, `game-mission-drawer.tsx`, etc.) |
| **Sheet** | `@base-ui/react/dialog` | CSS transitions (`transition-opacity duration-150`, `data-ending-style:opacity-0`) | `bg-[rgba(9,13,28,0.22)]` — **lighter than Dialog** | `var(--tv-z-overlay)` | `duration-150` opacity + `duration-200` translate | Side panel (right default), `w-3/4` sm:max-w-sm | 5 files (`game-mission-drawer.tsx` desktop, `mobile-shortlist-board.tsx`, etc.) |
| **Popover** | `@base-ui/react/popover` | `tw-animate-css` + `duration-100` | None (floating only) | `var(--tv-z-floating)` | `duration-100` | Same | 3 files (`orbiting-badge.tsx`, `tool-preview-popover.tsx`) |
| **DropdownMenu** | `@base-ui/react/menu` | `tw-animate-css` + `duration-100` | None | `var(--tv-z-floating)` | `duration-100` | Same | 1 file (only primitive itself; actual usage not found in audit but likely in admin/header) |
| **Tooltip** | `@base-ui/react/tooltip` | `tw-animate-css` + `duration-100` | None | `var(--tv-z-floating)` | `duration-100` | Same | 3 files (`root-providers.tsx` wraps app, `tooltip.tsx` primitive) |
| **CommandDialog** | `cmdk` inside **Dialog** | Inherits Dialog animation | Inherits Dialog backdrop | `var(--tv-z-modal)` | Inherits `duration-100` | Same | 2 files (`global-command-palette.tsx`, `command.tsx`) |
| **Sonner (Toast)** | `sonner` | Built-in + custom CSS | None | `var(--tv-z-toast)` | Toast duration: **6500ms** | Same | Global in `root-providers.tsx` |
| **SiteHeaderV2 Search** | **Custom** (`motion/react`) | `motion.div` spring (stiffness 300, damping 25) | `bg-[rgba(18,13,47,0.5)] backdrop-blur-sm` | `var(--tv-z-overlay)` | Spring physics | Mobile: bottom sheet style (`items-end`), Desktop: top centered | 1 file (`site-header-v2.tsx`) |
| **SiteHeaderV2 Mobile Menu** | **Custom** (`motion/react`) | `motion.nav` spring + staggered link reveals | `bg-[rgba(6,6,14,0.55)]` | `var(--tv-z-overlay)` | Spring physics | Right-side panel, 300px / 85vw | 1 file (`site-header-v2.tsx`) |
| **BadgeUnlockModal** | **Custom raw div** | `motion/react` (AnimatePresence) | `bg-black/60 backdrop-blur-sm` | **z-50** (hardcoded) | Spring (stiffness 240, damping 14) | Centered modal | 1 file (`badge-unlock-modal.tsx`) |
| **LevelUpModal** | **Custom raw div** | `motion/react` (AnimatePresence) | `bg-black/60 backdrop-blur-sm` | **z-50** (hardcoded) | Spring (stiffness 240, damping 14) | Centered modal | 1 file (`level-up-modal.tsx`) |
| **GateModal** | **Custom raw div** | Not inspected in detail | None visible | **z-[100]** (hardcoded) | Unknown | Centered | 1 file (`coming-soon/gate-modal.tsx`) |
| **IntroCinematic** | **Custom raw div** | `motion/react` | Unknown | **z-[100]** (hardcoded) | `duration-0.4` | Fullscreen | 1 file (`intro-cinematic.tsx`) |

### Overlay Coherence Issues

1. **Backdrop opacity inconsistency:** Dialog uses `rgba(9,13,28,0.52)`, Sheet uses `0.22` (much lighter), SiteHeaderV2 search uses `rgba(18,13,47,0.5)`, mobile menu uses `rgba(6,6,14,0.55)`. Four different backdrop formulas for the same conceptual layer.
2. **Z-index fragmentation:** Most primitives use `var(--tv-z-overlay)` (80), but gamification modals hardcode `z-50`, gate modal uses `z-[100]`, intro cinematic uses `z-[100]`. The token scale (`base:0 → sticky:10 → nav:50 → overlay:80 → modal:90 → floating:100 → toast:110 → effects:120`) is good, but **not enforced** outside `components/ui/`.
3. **Scroll lock inconsistency:** Base UI primitives handle scroll lock internally. Vaul handles it for Drawer. But the **custom SiteHeaderV2 overlays** manually set `inert` and `aria-hidden` on sibling DOM branches via `isolateModalBackground()` — a clever but bespoke solution that could break if portal containers change.
4. **Focus trap duplication:** SiteHeaderV2 reimplements focus trapping, Tab cycling, and Escape handling from scratch. This duplicates Base UI's built-in behavior.
5. **No "Drawer on mobile, Dialog on desktop" pattern** found except in `GameMissionDrawer` which uses **Drawer on mobile / Sheet on desktop** — this is the only responsive overlay split in the app.

---

## C. STATE COVERAGE TABLE

Sampled 20 most-used interactive components. Checked for: **Hover (H)**, **Active/Pressed (A)**, **Focus-visible / Ring (F)**, **Selected (S)**, **Disabled (D)**, **Loading (L)**.

| Component | H | A | F | S | D | L | Grade | Notes |
|-----------|---|---|---|---|---|---|-------|-------|
| **Button** (ui/button.tsx) | ✅ (premium-button CSS) | ⚠️ (only via `active:scale-95` in some consumers) | ✅ (`focus-visible:ring-3 ring-ring/50`) | ✅ (`aria-expanded` for outline/ghost) | ✅ (`disabled:opacity-50`) | ✅ (`loading` prop + `Loader2` spin) | A- | Active state missing in CVA; relies on global CSS `.premium-button:active` |
| **ButtonLink** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | C | No focus ring, no active, no disabled. Just a styled Link. |
| **Input** | ❌ | ❌ | ✅ (`focus-visible:ring-3`) | ❌ | ✅ (`disabled:opacity-50`) | ❌ | B | No hover state. No loading. |
| **Textarea** | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | B | Same as Input. |
| **Select** | ❌ | ❌ | ✅ (`focus-visible:ring-3`) | ❌ | ✅ (`data-disabled`) | ❌ | B | No hover on trigger. No loading. |
| **Chip** | ✅ (`hover:border-*`) | ✅ (`data-[pressed]`) | ✅ (`focus-visible:ring-3`) | ✅ (`data-pressed`) | ✅ (`disabled:opacity-50`) | ❌ | A- | Best coverage. Missing loading state. |
| **TabsTrigger** | ✅ (`hover:text-foreground`) | ✅ (`data-active:after:opacity-100`) | ✅ (`focus-visible:ring-[3px]`) | ✅ (`data-active`) | ✅ (`disabled:opacity-50`, `aria-disabled`) | ❌ | A- | Missing loading. |
| **AccordionTrigger** | ✅ (`hover:underline`) | ✅ (`group-aria-expanded:rotate-180` on icon) | ✅ (`focus-visible:ring-3`) | ✅ (`aria-expanded`) | ✅ (`aria-disabled`) | ❌ | B+ | Missing loading. |
| **Card** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | F | Zero interactive states. It's a passive container. If cards are clickable, consumers must add states. |
| **DropdownMenuItem** | ⚠️ (uses `focus:bg-accent` as hover proxy) | ❌ | ✅ (focus styling) | ✅ (`data-popup-open:bg-accent` on subtrigger) | ✅ (`data-disabled`) | ❌ | B | No explicit hover — menus rely on focus-follows-mouse. No active/pressed. |
| **CommandItem** | ❌ | ❌ | ❌ | ✅ (`data-selected:bg-white/10`) | ✅ (`data-disabled`) | ❌ | C | **No focus-visible ring** — critical accessibility gap in command palette. |
| **DialogClose** (in Dialog/Sheet) | ✅ (inherits Button) | ❌ | ✅ (inherits Button) | ❌ | ❌ | ❌ | B | Inherits Button states but no active/loading. |
| **TooltipTrigger** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | D | No visual states at all. Trigger is invisible wrapper. |
| **Carousel Prev/Next** | ✅ (inherits Button) | ❌ | ✅ (inherits Button) | ❌ | ❌ | ❌ | B | Inherits Button. No active/loading. |
| **ShortlistToggle** | ✅ (`hover:-translate-y-0.5`) | ✅ (`is-fresh` class) | ❌ | ✅ (`aria-pressed`, `is-active`) | ❌ | ❌ | C+ | **No focus-visible ring** on a critical action button. |
| **CompareToggle** | ✅ (`hover:-translate-y-0.5`) | ✅ (`is-fresh` class) | ❌ | ✅ (`aria-pressed`, `is-active`) | ❌ | ❌ | C+ | **No focus-visible ring**. |
| **SiteHeaderV2 NavLink** | ✅ (`group-hover:scale-105` on logo) | ❌ | ❌ | ✅ (`is-active` class, `aria-current`) | ❌ | ❌ | C | Custom nav link with no focus ring. |
| **MobileBottomNav Link** | ✅ (`hover:bg-white/72`) | ✅ (`active:scale-95`) | ✅ (`focus-visible:ring-2`) | ✅ (`is-active`) | ❌ | ❌ | B+ | Good coverage for a consumer component. |
| **Badge** | ❌ | ❌ | ✅ (`focus-visible:ring-[3px]`) | ❌ | ❌ | ❌ | D | No hover, no active, no disabled. Static label. |
| **Skeleton** | N/A | N/A | N/A | N/A | N/A | N/A | N/A | `animate-pulse bg-muted`. Used in `tool-card-skeleton.tsx`. |

### State Coverage Gaps (quantified)

- **`focus-visible:`** found in 20 component files (good coverage in primitives, poor in consumers).
- **`disabled:`** found in 28 files (mostly primitives + admin forms).
- **`hover:`** found in 48 files (heavy in globals.css, uneven in components).
- **`active:`** found in 22 files (mostly admin pages, very few interactive components).
- **`data-[state=`** found in **only 1 file** (`tooltip.tsx`). The codebase largely avoids `data-[state=...]` in favor of `data-open`, `data-closed`, `data-active`, `data-pressed`, `aria-expanded`.

**Top gaps by UX impact:**
1. **CommandItem has no focus-visible ring** — keyboard users navigating the command palette cannot see their selection.
2. **ShortlistToggle / CompareToggle have no focus-visible ring** — these are primary actions on every tool card.
3. **Card primitive has zero interactive states** — if cards are clickable (and they are, via wrapping Links), the Card component itself provides no hover/focus feedback.
4. **ButtonLink has no focus ring or active state** — used for primary CTAs.
5. **TooltipTrigger is an invisible wrapper** — no hover/focus indicator on the trigger itself.

---

## D. MOTION INCOHERENCE REPORT

### Competing Systems

| System | Files Using It | What It Does | Verdict |
|--------|---------------|--------------|---------|
| **`motion` (v12, `motion/react`)** | ~32 files | Micro-interactions, page transitions, scroll reveals, gamification modals, orbital system, header animations, 3D hero entrances | **KEEP** — primary motion lib, well-used. |
| **`tw-animate-css`** | Dialog, Drawer, Sheet, Popover, DropdownMenu, Tooltip, Command, Button, Accordion, Select, Sonner | CSS-based enter/exit animations (`data-open:animate-in`, `fade-in-0`, `zoom-in-95`) | **KEEP** — good for primitives, but limited to fade/zoom/slide. |
| **GSAP + ScrollTrigger** | `lib/gsap-setup.ts`, `lenis-provider.tsx` | Registered but **no actual GSAP animations found in components** (only Lenis integration). The `intro-cinematic.tsx` has a `timeline` config object but it's plain JS, not GSAP Timeline. | **REMOVE or USE** — Currently dead weight. Either start using it for complex scroll scenes, or remove it and use `motion` + CSS `animation-timeline` instead. |
| **Lenis** | `lenis-provider.tsx` | Smooth scroll, integrated with GSAP ticker | **KEEP** — global smooth scroll is coherent. |
| **Custom CSS keyframes** | `globals.css` (massive file) | `animation-timeline: view()`, `animate-pulse`, `animate-compare-ping`, `animate-spin`, `animate-accordion-down/up`, section-stage, card-gravity, etc. | **REFINE** — Many animations live only in CSS. Some duplicate what `motion` does (e.g., fade-up). |
| **NumberFlow** | 12 gamification files + account | Number counting animations | **KEEP** — specific, coherent use. |
| **Confetti** | 7 files | Gamification celebrations | **KEEP** — contextual and appropriate. |
| **Marquee** | 1 file (`leaderboard-strip.tsx`) | Infinite scroll strip | **KEEP** — single use, fine. |

### Ad-Hoc Duration / Easing Inventory

Sampled 50+ motion/transition prop usages. **No shared token scale** — every component invents its own numbers.

**Durations found:**
- `100ms` (tw-animate primitives)
- `120ms` / `130ms` (CSS transitions in globals.css)
- `150ms` (Sheet opacity)
- `200ms` (CSS transitions, Shortlist/Compare toggle)
- `250ms` (page transition)
- `300ms` (CSS)
- `420ms` (CSS)
- `500ms` (hero, floating anchor, 3D heroes, about, game mission panel)
- `540ms` / `560ms` (fresh timers for toggles)
- `620ms` (about, vibe tap)
- `700ms` (scroll reveal, account portal)
- `720ms` (motion observer fallback)
- `760ms`–`980ms` (route transition loader per-page)
- `1.4s` (Lenis scroll duration)
- `2s` (hero infinite loop)
- `4s` (radar scanner overlay loop)
- `6500ms` (toast duration)

**Easings found:**
- `[0.215, 0.61, 0.355, 1]` — used in ScrollReveal, HeroSection, FloatingSectionAnchor
- `[0.22, 1, 0.36, 1]` — used in 3D maestoso, ProductHunt, Directory, GameMissionPanel
- `[0.16, 1, 0.3, 1]` — used in AboutPage
- `easeOut` — generic
- `easeInOut` — page transition, hero loop
- `linear` — radar scanner
- Spring physics: `stiffness: 300, damping: 25/30` — SiteHeaderV2 search/menu
- Spring physics: `stiffness: 240, damping: 14` — gamification modals
- Lenis easing: `t => Math.min(1, 1.001 - Math.pow(2, -10 * t))` — exponential decay

**Grade: C+** — There are ~8 distinct duration/easing palettes with no central tokens. The app feels polished in individual sections but the timing rhythm changes as you navigate.

### Duplicated Animation Logic

1. **Fade-up entrance:** Implemented in `ScrollReveal` (motion), `MotionObserver` (IntersectionObserver + CSS classes), and CSS `animation-timeline: view()` in globals.css. Three systems for the same scroll-into-view effect.
2. **Scale-on-hover:** Buttons use `.premium-button` CSS classes. Cards do not use a shared hover scale. Mobile bottom nav uses `scale-110` on active. Site header uses `group-hover:scale-105`. No unified hover scale token.
3. **Spring modals:** SiteHeaderV2 search uses spring. Gamification modals use spring. But Dialog/Sheet/Drawer use CSS transitions. Three different modal entrance physics.
4. **Staggered reveals:** `ScrollReveal` has `StaggerContainer`. `MotionObserver` has `motion-stagger` CSS class with 52ms delay increments. SiteHeaderV2 mobile menu has inline `delay: i * 0.05`. Three stagger systems.

---

## E. MICROINTERACTION CATALOG

| Interaction | File(s) | Implementation | Coherence Grade |
|-------------|---------|----------------|-----------------|
| **Wishlist toggle (heart)** | `shortlist-toggle.tsx` | `hover:-translate-y-0.5`, `transition-all duration-200`, fill toggle on SVG, `is-fresh` glow timer (540ms), `data-sonic-action="save"` | **B+** |
| **Compare toggle** | `compare-toggle.tsx` | Same as wishlist but with count badge, `is-ready` state when ≥2 items, `data-sonic-action="compare"` | **B+** |
| **Add-to-shortlist (command palette)** | `global-command-palette.tsx` | `toast.success()` + `playTooolvibesSound(saved ? "success" : "update")` | **A** |
| **Copy link** | Not found in audit | — | **N/A** |
| **Toast triggers** | `global-command-palette.tsx`, `tool-discovery-app.tsx`, etc. | `sonner` toasts with custom icons, 6500ms duration, close button, `playTooolvibesSound("toast")` | **A** |
| **Gamification: Badge unlock** | `badge-unlock-modal.tsx` | `canvas-confetti` (3 bursts) + synthesized Howler WAV + `NumberFlow` + `motion` spring entrance | **A** |
| **Gamification: Level up** | `level-up-modal.tsx` | `canvas-confetti` (3 bursts) + `playGameSound("levelUp")` + `NumberFlow` + `motion` spring | **A** |
| **Gamification: Battle** | `arena-battle-stage.tsx`, `tool-battle-shared.ts` | Confetti on win, sound on hit/start/win | **A** |
| **Number animations** | `gamer-hud.tsx`, `level-up-modal.tsx`, `badge-unlock-toast.tsx`, `leaderboard-strip.tsx`, `game-profile-bar.tsx`, `radar-console.tsx` | `@number-flow/react` for XP, level, streak, rankings | **A** |
| **Card hover effects** | `canonical-tool-card.tsx` | **None in component.** Hover effects likely live in CSS globals or are missing. | **D** |
| **Button hover effects** | `button.tsx` + `globals.css` | `.premium-button-*` classes handle gradient shifts, glow, lift. Coherent across primary/premium/outline/ghost. | **A-** |
| **Mobile bottom nav** | `mobile-bottom-nav.tsx` | `active:scale-95`, active icon `scale-110`, hover `bg-white/72`, badge `animate-compare-ping`, `inert` when overlay open | **A-** |
| **Command palette open** | `global-command-palette.tsx` | `motion` spring in `CommandDialog` (inherited from Dialog primitive) + `playTooolvibesSound("search")` | **A** |
| **Site header search** | `site-header-v2.tsx` | `motion` spring (stiffness 300, damping 25), backdrop blur, input autoFocus | **A-** |
| **Site header mobile menu** | `site-header-v2.tsx` | `motion` spring + staggered link reveals (`delay: i * 0.05`), slide from right | **A-** |
| **Route transition loader** | `route-transition-loader.tsx` | Mobile-only progress bar, per-route color themes and durations (720ms–980ms), sound dispatch | **B+** |
| **Custom cursor** | `custom-cursor.tsx` | rAF trail effect with skew/scale based on velocity, hover/click state detection, disabled on touch | **B** |
| **Scroll reveal** | `scroll-reveal.tsx`, `motion-observer.tsx` | `motion` useInView + IntersectionObserver CSS classes. Competing systems. | **C+** |
| **Sound feedback** | `sound.ts`, `interaction-sound-layer-v2.tsx` | 29 sound kinds, DOM event mapping, `data-sonic-action` attributes, global mute flag | **A** |
| **Hover sound** | `sound-mapping.ts` | `HOVER_SELECTOR` maps classes to `hover` sound kind | **B+** |

**Overall Microinteraction Coherence Grade: B+**

The app has **excellent** feedback in the gamification layer and good sound design. But the **card layer is silent and static** — no hover lift, no scale, no glow on the most frequently interacted element (tool cards). The Shortlist/Compare toggles have nice micro-interactions but lack focus rings. The custom cursor is a nice touch but may conflict with native cursor expectations on some OSs.

---

## F. TOP 10 INTERACTION ROOT PROBLEMS

### 1. Custom overlays bypass the primitive layer — accessibility & consistency debt
**Impact:** HIGH  
**Where:** `site-header-v2.tsx` (search + mobile menu), `badge-unlock-modal.tsx`, `level-up-modal.tsx`, `gate-modal.tsx`, `intro-cinematic.tsx`  
**Problem:** Five major overlays reimplement backdrop, focus trap, scroll lock, and z-index from scratch instead of using `Dialog`/`Sheet` primitives. The header's `isolateModalBackground()` is fragile and duplicates Base UI behavior. Gamification modals hardcode `z-50` and ignore the token scale.  
**Recommendation:** **Migrate all custom modals to the Dialog primitive**. For gamification celebrations, wrap `AnimatePresence` + `motion` inside `DialogContent` with `showCloseButton={false}`. For the header search, use `Dialog` with a custom `DialogContent` className instead of a raw `motion.div`. This unifies backdrop opacity, z-index, focus trapping, and scroll locking.

### 2. Command palette items lack focus-visible rings
**Impact:** HIGH (accessibility)  
**Where:** `components/ui/command.tsx` — `CommandItem` className  
**Problem:** `CommandItem` uses `data-selected:bg-white/10` for selection but has **no `focus-visible:` or `focus:` ring**. Keyboard navigation in the command palette is invisible.  
**Recommendation:** Add `focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:bg-white/10` to `CommandItem`'s className. Ensure `data-selected` and focus styles are visually identical.

### 3. Tool card actions (Shortlist/Compare) lack focus-visible rings
**Impact:** HIGH (accessibility)  
**Where:** `shortlist-toggle.tsx`, `compare-toggle.tsx`  
**Problem:** These buttons are on every tool card and are primary actions. They have `hover:-translate-y-0.5` but **no focus ring**. Keyboard users cannot see which card action is focused.  
**Recommendation:** Add `focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none` to both toggle buttons. Also add `focus-visible:-translate-y-0.5` so keyboard users get the same lift as mouse users.

### 4. No unified motion token scale — timing feels inconsistent across pages
**Impact:** MEDIUM-HIGH  
**Where:** Global  
**Problem:** Durations range from 100ms to 980ms with no naming convention. Easings include `[0.215, 0.61, 0.355, 1]`, `[0.22, 1, 0.36, 1]`, `[0.16, 1, 0.3, 1]`, `easeOut`, `easeInOut`, and spring physics. The user feels different "physics" on the home hero vs. the 3D archive hero vs. the product hunt page vs. the about page.  
**Recommendation:** Create a `motion-tokens.ts` (or Tailwind theme extension) with:
- `duration-fast: 150ms`, `duration-base: 250ms`, `duration-slow: 500ms`, `duration-celebration: 800ms`
- `ease-smooth: [0.22, 1, 0.36, 1]` (most common), `ease-bounce: [0.16, 1, 0.3, 1]`, `ease-out: [0.215, 0.61, 0.355, 1]`
- `spring-default: { stiffness: 300, damping: 25 }`
Audit all files and map literals to tokens.

### 5. Loading.tsx files do not use the Skeleton primitive — per-page improvisation
**Impact:** MEDIUM  
**Where:** `app/(marketing)/*/loading.tsx` (6 files)  
**Problem:** Every loading state uses custom `skeleton-block` divs with hardcoded heights and rounded corners. The `components/ui/skeleton.tsx` primitive (`animate-pulse bg-muted`) is **not used** in any loading file. The `tool-card-skeleton.tsx` is used, but page shells are bespoke.  
**Recommendation:** Create a `PageShellSkeleton` component that mirrors the actual `page-shell` layout using the `<Skeleton>` primitive. Standardize loading states so they feel like one language, not 6 different wireframes.

### 6. Card primitive has zero interactive states — consumers must DIY
**Impact:** MEDIUM  
**Where:** `components/ui/card.tsx`, `canonical-tool-card.tsx`  
**Problem:** `Card` is a passive `div` with no hover, focus, or active states. `CanonicalToolCard` also lacks hover effects. Since cards are the primary discovery surface, the lack of hover feedback makes the app feel static.  
**Recommendation:** Add an `interactive` prop to `Card` that applies `transition-all duration-200 hover:shadow-premium hover:-translate-y-0.5 focus-visible:ring-2`. Use it in `CanonicalToolCard` when the card wraps a link.

### 7. GSAP is imported but unused — dead code & bundle weight
**Impact:** MEDIUM  
**Where:** `lib/gsap-setup.ts`, `package.json`  
**Problem:** GSAP and ScrollTrigger are registered, integrated with Lenis ticker, but **no component actually uses GSAP animations** (the `intro-cinematic.tsx` "timeline" is a plain JS config object, not a GSAP timeline). This is ~50-100KB of unused JS.  
**Recommendation:** Either **remove GSAP** and rely on `motion` + CSS `animation-timeline` for scroll scenes, or **start using it** for at least one complex scroll-driven section (e.g., the 3D maestoso intro) to justify its presence. If removed, keep Lenis standalone (it does not need GSAP ticker).

### 8. Scroll reveal is implemented three different ways
**Impact:** MEDIUM  
**Where:** `scroll-reveal.tsx` (motion), `motion-observer.tsx` (IntersectionObserver + CSS), `globals.css` (`animation-timeline: view()`)  
**Problem:** Three systems animate elements as they enter the viewport. They use different thresholds, delays, and easing curves. This creates inconsistent "reveal" timing across pages.  
**Recommendation:** **Consolidate to one system**. Prefer `motion-observer.tsx` for global page reveals (it's lightweight and uses CSS classes) and `ScrollReveal` only for specific components that need staggered children. Remove the CSS `animation-timeline` fallback or align its timing with the JS systems.

### 9. Backdrop opacity inconsistency breaks spatial coherence
**Impact:** MEDIUM  
**Where:** Dialog (0.52), Sheet (0.22), SiteHeaderV2 search (0.5), SiteHeaderV2 menu (0.55), gamification modals (0.6)  
**Problem:** The user sees a different "dimming" intensity depending on which overlay opens. Sheet is noticeably lighter than Dialog, which feels like a bug.  
**Recommendation:** Define `--tv-backdrop-opacity: 0.52` and `--tv-backdrop-color: rgba(9,13,28)` in `tokens.css`. Force all overlays (primitives + custom) to use `bg-[rgba(9,13,28,var(--tv-backdrop-opacity))]`. Update Sheet and custom modals immediately.

### 10. Sound system is rich but not wired to all interactive surfaces
**Impact:** LOW-MEDIUM  
**Where:** `sound-mapping.ts`, `interaction-sound-layer-v2.tsx`  
**Problem:** 29 sound kinds exist, but many high-frequency interactions are silent: Card clicks, Tab switches, Carousel scrolls, and Input typing have no sound mapping. The `getSoundKind` mapper falls back to generic `tap` for most things.  
**Recommendation:** Add `data-sonic-action` attributes to `TabsTrigger` (`tab`), `Carousel` controls (`carousel`), and `Card` links (`nav`). Map them in `sound-mapping.ts`. The infrastructure is there — it just needs broader coverage.

---

## Appendix: Quick Stats

- **Overlay primitives:** 8 components wrapping 5 libs
- **Custom overlays outside primitives:** 6 major implementations
- **Files using `motion/react`:** ~32
- **Files using GSAP directly:** 0 (besides setup)
- **Files using `lenis`:** 1
- **Files using `number-flow`:** 12
- **Files using `confetti`:** 7
- **Files using `howler`:** 3
- **Sound kinds defined:** 29
- **Loading.tsx files:** 6 (all bespoke, none use `<Skeleton>` primitive)
- **Focus-visible coverage:** 20 component files
- **Disabled coverage:** 28 files
- **Hover coverage:** 48 files
- **Active coverage:** 22 files
- **Data-[state= coverage:** 1 file (tooltip only)
- **Z-index token layers:** 8 (`base:0 → effects:120`)
- **Hardcoded z-index violations:** 5 (`z-50`, `z-[100]`, `z-[9998]`, `z-[15]`, `z-[var(--z-cursor)]`)
- **Custom createPortal usage:** 2 (`mobile-bottom-nav.tsx`, `site-header-v2.tsx` uses raw fixed divs)

---

*End of Audit*
