# Session Notes — Mobile Fixes & Visual Refinement

> Chat session summary: mobile debugging, global diagonal X removal, SSR crash fixes, performance tuning, and UI refinement.

---

## 1. Global Diagonal "X" Background Removal

**Problem:** A visible diagonal X pattern appeared across all mobile pages due to gradient overlays.

**Root cause:**
- `--gradient-shell` CSS variable contained `linear-gradient(118deg, ...)` and `linear-gradient(64deg, ...)`
- Many `@media (max-width: 767px)` blocks had their own diagonal line gradients

**Fix:**
- Stripped `--gradient-shell` to only horizontal/vertical repeating lines and vertical color fade
- Scrubbed all mobile-only CSS blocks of diagonal gradients via automated script + manual verification

**File:** `app/globals.css`

---

## 2. SSR Crash Fix — `orbital-layer.tsx`

**Problem:** All marketing pages showed blank content on first load / navigation. Cloudflare Workers threw `ReferenceError: window is not defined` during RSC payload generation.

**Root cause:** Line 611 accessed `window.innerWidth / window.innerHeight` during React render without a guard.

**Fix:**
```tsx
// Before:
if (pos.x < -80 || pos.x > window.innerWidth + 80 || ...) { return null; }

// After:
if (typeof window !== 'undefined' && (pos.x < -80 || pos.x > window.innerWidth + 80 || ...)) { return null; }
```

**File:** `components/app/orbital-system/orbital-layer.tsx`

---

## 3. Page Transition Deadlock Fix — `page-transition.tsx`

**Problem:** Client-side navigation rendered blank pages. Next.js App Router + `AnimatePresence mode="wait"` race condition prevented new page mount.

**Fix:** Removed `AnimatePresence` wrapper entirely. Replaced with simple `motion.div` fade-in:

```tsx
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
```

**File:** `components/app/page-transition.tsx`

---

## 4. Radar Mobile — Empty State & Fetch Robustness

**Problem:** Radar mobile sometimes showed no data on first open.

**Fix:**
- Added `visibilitychange` event listener to re-fetch Product Hunt data when tab becomes visible after being hidden
- Enlarged radar nodes and labels for touch targets
- Added `MobileRadarSections` component rendering trending cards + watchlist rows below the canvas

**File:** `components/radar/mobile-radar-view.tsx`

---

## 5. Performance Tuning

### WebGL Background (`site-universe-background.tsx`)
- **Before:** `frameloop="always"` — continuous RAF rendering on every page
- **After:** `frameloop="demand"` on low-end / mobile devices (detected via `getPerformanceProfile()`)
- Reduced particle count and planet count for reduced profile

**File:** `components/app/site-universe-background.tsx`

### Mobile Catalog Header Blur
- **Before:** `backdrop-filter: blur(20px)`
- **After:** `backdrop-filter: blur(12px)`

**File:** `app/globals.css` (`.mobile-catalog-view__header`)

---

## 6. Mobile UI Refinement (Esplora / Radar / Salvati)

### Esplora (`mobile-catalog-view.tsx`)
- Added `CategoryGuide` with animated scroll hint arrow
- Added step indicator: "Esplora → Filtra → Scopri"
- `whileInView` reveal animation on tool cards
- Fixed sticky header `z-index` to 60

### Radar (`mobile-radar-view.tsx`)
- Added `MobileRadarSections`: trending/hot sections with real Product Hunt data
- Bottom sheet with day / week / month tabs
- No fake data — uses actual Product Hunt GraphQL API at `/api/product-hunt`

### Salvati (`mobile-shortlist-board.tsx`)
- Transformed from Kanban board to horizontal library shelves
- New components: `MobileLibraryShelf`, `LibraryBook` (vertical book-style cards with spine), `MobileLibraryEmpty` with animated ghost books
- Uses real data from `useToolWorkspaceStore` + `useDiscoverySnapshot`

---

## 7. Build Verification

- `npm run build` passes with **zero errors**
- Only pre-existing lint warnings remain (unused vars, `<img>` elements)
- Desktop functionality untouched — all changes are mobile-only or SSR-safety fixes

---

## Files Modified in This Session

| File | Change |
|------|--------|
| `app/globals.css` | Removed diagonal X gradients, reduced blur, added mobile library/radar styles |
| `components/app/orbital-system/orbital-layer.tsx` | Added `typeof window` guard |
| `components/app/page-transition.tsx` | Removed `AnimatePresence mode="wait"`, simplified fade-in |
| `components/app/site-universe-background.tsx` | `frameloop="demand"` for reduced profile |
| `components/radar/mobile-radar-view.tsx` | Visibility re-fetch, enlarged nodes, new sections |
| `components/tools/mobile-shortlist-board.tsx` | Library shelf layout, book cards |
| `components/directory/mobile-catalog-view.tsx` | Category guide, step indicator, card reveal |

---

## 7. Deep Mobile Refinement — Radar, Cards, Floating Layer, Compare/Arena

**Date:** 2026-06-08

### 7.1 Z-Index & Layering Fix

**Problem:** Radar/Shortlist sheets rendered under bottom nav (z-45) and site header (z-50). Radar open-list button hidden behind bottom nav. Arena footer conflicted with header. Catalog header floated above site header.

**Fix:**
- `.mobile-radar-view__sheet` → `z-index: 55`
- `.mobile-shortlist-board__sheet` → `z-index: 55`
- `.mobile-radar-view__open-list` → `z-index: 44` (sotto nav, sopra content)
- `.mobile-compare-arena__footer` → `z-index: 48` (sotto header 50)
- `.mobile-catalog-view__header` → `z-index: 45` (sotto header 50)

**File:** `app/globals.css`

### 7.2 Radar Mobile — Ordered Layout

**Problem:** 8 nodes overlapped, labels clipped by circular stage, no text-overflow.

**Fix:**
- Reduced max nodes from 8 → 6
- Increased minimum radius ratio from 0.22 → 0.30
- Reduced max node size from 88px → 84px
- Added `max-width`, `overflow: hidden`, `text-overflow: ellipsis` to node label small text
- Sheet and open-list button z-index fixed

**File:** `components/radar/mobile-radar-view.tsx`, `app/globals.css`

### 7.3 Floating Elements Under Cards — Controlled Overlay State

**Problem:** When tool cards, sheets, or modals were open, orbital nodes and floating UI kept rendering behind, disturbing readability and tap targets.

**Fix:**
- Created shared Zustand store `mobile-ui-store.ts` with `isOverlayOpen` flag
- `orbital-layer.tsx` reads flag and sets `opacity: 0` with 300ms transition when overlay is open
- `mobile-bottom-nav.tsx` hides with `opacity-0 pointer-events-none` when overlay is open
- `site-header-v2.tsx` sets overlay open when mobile menu or search overlay is active
- `mobile-radar-view.tsx` sets overlay open when bottom sheet is open
- Click-outside handler in orbital-layer now ignores taps on `nav`, `header`, `[role="dialog"]`, `[role="button"]`, `.mobile-bottom-motion`, sheets

**Files:**
- `lib/stores/mobile-ui-store.ts` (new)
- `components/app/orbital-system/orbital-layer.tsx`
- `components/layout/mobile-bottom-nav.tsx`
- `components/layout/site-header-v2.tsx`
- `components/radar/mobile-radar-view.tsx`

### 7.4 Compare/Arena Toggle — Restored on Mobile

**Problem:** Mobile catalog cards, shortlist books, and tool detail page had no way to add tools to compare or shortlist.

**Fix:**
- `MobileToolCard` in `mobile-catalog-view.tsx`: added `CompareToggle` and `ShortlistToggle` in `mode="icon"` positioned absolute top-right
- `LibraryBook` in `mobile-shortlist-board.tsx`: added `CompareToggle mode="icon"` next to remove button
- Tool detail page `toools/[slug]/page.tsx`: added `CompareToggle compact` and `ShortlistToggle compact` in action row
- Shortlist page now wrapped in `PageOrbitShell` on mobile too, providing orbital context and safe zones

**Files:**
- `components/directory/mobile-catalog-view.tsx`
- `components/tools/mobile-shortlist-board.tsx`
- `app/(marketing)/toools/[slug]/page.tsx`
- `app/(marketing)/shortlist/page.tsx`

### 7.5 Safe Area & Sheet Padding

**Fix:**
- `.mobile-radar-view__sheet-body` padding-bottom now includes `env(safe-area-inset-bottom)`
- `.mobile-shortlist-board__sheet` padding-bottom now includes `env(safe-area-inset-bottom)`

**File:** `app/globals.css`

### 7.6 Build Verification

- `npm run build` passes with **zero errors**
- Only pre-existing lint warnings remain
- Desktop functionality untouched — all UI changes are mobile-only or overlay-state fixes

---

## Files Modified in This Session

| File | Change |
|------|--------|
| `app/globals.css` | Removed diagonal X gradients, reduced blur, added mobile library/radar styles, z-index fixes, safe-area padding, radar label ellipsis |
| `components/app/orbital-system/orbital-layer.tsx` | Added `typeof window` guard, mobile overlay opacity control, click-outside nav/button exclusion |
| `components/app/page-transition.tsx` | Removed `AnimatePresence mode="wait"`, simplified fade-in |
| `components/app/site-universe-background.tsx` | `frameloop="demand"` for reduced profile |
| `components/radar/mobile-radar-view.tsx` | Visibility re-fetch, enlarged nodes, new sections, reduced to 6 nodes, radius fix, overlay sync, z-index classes |
| `components/tools/mobile-shortlist-board.tsx` | Library shelf layout, book cards, CompareToggle added |
| `components/directory/mobile-catalog-view.tsx` | Category guide, step indicator, card reveal, CompareToggle + ShortlistToggle on cards |
| `lib/stores/mobile-ui-store.ts` | New shared overlay state store |
| `components/layout/mobile-bottom-nav.tsx` | Hide on overlay open |
| `components/layout/site-header-v2.tsx` | Sync menu/search overlay state to mobile UI store |
| `app/(marketing)/toools/[slug]/page.tsx` | Added CompareToggle + ShortlistToggle in action row |
| `app/(marketing)/shortlist/page.tsx` | Wrapped MobileShortlistBoard in PageOrbitShell |

---

## Known Risks / Left for Future

- `orbital-layer.tsx` still runs a continuous RAF physics engine — only WebGL was paused
- Radar canvas still runs 2D RAF animation
- Heavy `blur()` filters remain in some mobile sections (only catalog header was reduced)
- `mobile-shortlist-board.tsx` library layout may need scroll-snap polish on very small screens
