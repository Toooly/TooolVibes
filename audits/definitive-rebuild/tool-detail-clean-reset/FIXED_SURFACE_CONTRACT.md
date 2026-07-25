# Tool Detail — Fixed-Surface Stacking Contract (2026-07-25)

**Purpose**: codify the canonical order of fixed / sticky surfaces on
`/toools/[slug]` and on every other route that uses the same shell. The
route is paused visually; this contract can be enforced in the reset
without waiting for the binding mockups.

---

## 1. Canonical stacking order (top of stack = last)

```
+--------------------------------------------------+
| safe-area-inset-top                              |
|  ┌────────────────────────────────────────────┐  |
|  │ MobileTopBar    z=50  sticky top   (<1280)  │  |
|  │ CommandBar      z=50  sticky top   (≥1280)  │  |
|  │ (mutually exclusive)                        │  |
|  └────────────────────────────────────────────┘  |
|  ┌────────────────────────────────────────────┐  |
|  │ main content (z=1)                          │  |
|  │   optional: Tool Detail decision nav        │  |
|  │     z = var(--tv-z-sticky) = 10             │  |
|  │     sticky top from ≥1024                   │  |
|  │   optional: Tool Detail action surface     │  |
|  │     (inline, not fixed/sticky in v4)        │  |
|  │     z = content                            │  |
|  │   optional: Comparison Tray                 │  |
|  │     z = var(--tv-z-floating) = 100          │  |
|  │     fixed bottom (mobile + desktop ≥1280)   │  |
|  │     hidden when compareCount == 0           │  |
|  │   MobileBottomNav                            │  |
|  │     z = var(--tv-z-nav) = 50                │  |
|  │     fixed bottom (<1280)                    │  |
|  └────────────────────────────────────────────┘  |
| safe-area-inset-bottom                           |
+--------------------------------------------------+
```

### 1.1 Z-index tokens (canonical)

| Token | Value | Owner |
|---|---|---|
| `--tv-z-backplane` | -10 | background layers |
| `--tv-z-base` | 0 | content baseline |
| `--tv-z-content` | 1 | main content |
| `--tv-z-elevated` | 5 | hover / focus states |
| `--tv-z-sticky` | 10 | sticky in-page nav |
| `--tv-z-nav` | 50 | top sticky / bottom fixed shells |
| `--tv-z-overlay` | 80 | search sheet, mobile menu |
| `--tv-z-floating` | 100 | comparison tray (pinned) |
| `--tv-z-modal` | 90 | modals |
| `--tv-z-toast` | 110 | toasts |
| `--tv-z-effects` | 120 | custom cursor, sound, ambience |
| `--tv-z-skip` | 9999 | a11y skip link |

Every layer on this route must consume one of these tokens. No layer
may declare a local `z-index: N` value. The current V4 work has
two violations:

| Local z-index | Where | Token to use |
|---|---|---|
| `z-index: 5` | `.td4-decision-nav` (tool-detail-v4.css:688) | `var(--tv-z-sticky)` (=10) |
| `z-index: 41` | `.ar4-tray` (archive-v4.css:863) | `var(--tv-z-floating)` (=100) |

---

## 2. Per-layer contract

| Layer | Owner file | Position | top offset | bottom offset | z-index | Mobile | Tablet | Desktop |
|---|---|---|---|---|---|---|---|---|
| MobileTopBar | `components/layout/mobile-top-bar.tsx` | sticky | 0 | — | `--tv-z-nav` | visible, height 56px | visible | hidden ≥1280 |
| CommandBar | `components/layout/command-bar.tsx` | sticky | 0 | — | `--tv-z-nav` | hidden <1280 | hidden <1280 | visible ≥1280, height 84px |
| Tool Detail decision nav | `.td-final-decision-nav` | sticky | max(0.5rem, topbar-height) | — | `--tv-z-sticky` | hidden (inline) | hidden (inline) | visible from ≥1024 |
| Tool Detail action surface | inline in identity | static | — | — | content (1) | inline | inline | inline |
| Comparison Tray | `.ar4-tray` → `.td-final-tray` | fixed | — | `calc(<bottom-nav-height> + env(safe-area-inset-bottom))` on mobile, `auto` on ≥1280 | `--tv-z-floating` | pinned, hidden when count==0 | pinned | pinned corner, hidden when count==0 |
| MobileBottomNav | `components/layout/mobile-bottom-nav.tsx` | fixed | — | 0 (+ env(safe-area-inset-bottom) + 6px) | `--tv-z-nav` | visible <1280 | visible <1280 | hidden ≥1280 |
| Safe area | n/a | reserved | env(safe-area-inset-top) | env(safe-area-inset-bottom) | n/a | reserved | reserved | reserved |

---

## 3. Single owner per surface

| Surface | Owner | Can be moved by? |
|---|---|---|
| Top sticky | `app/(marketing)/layout.tsx` (selects MobileTopBar OR CommandBar) | NO (route files only consume) |
| Tool Detail decision nav | the new `components/tool-detail/tool-detail-final-decision-nav.tsx` (client) | NO outside this file |
| Tool Detail action surface | the new `components/tool-detail/tool-detail-final-cta-bar.tsx` (client) | NO outside this file |
| Comparison Tray | Archive/Compare route today; in the reset it lives behind a single owner that consumes the workspace store | NO outside the tray module |
| Bottom fixed nav | `components/layout/mobile-bottom-nav.tsx` (V4 shell) | NO outside the shell module |

**Rule**: no two fixed/sticky surfaces may independently assume `bottom: 0`.
The bottom-anchored layer is the bottom nav; the tray must compute its
offset from the bottom nav's known height (or use the existing
`.ar4-tray` rule that already does this).

---

## 4. Bottom padding contract (replaces the implicit coupling)

Today, `styles/tool-detail-v4.css` carries:

```css
@media (max-width: 767px) {
  .td4-shell {
    padding-bottom: calc(7rem + env(safe-area-inset-bottom, 0));
  }
}
```

This 7rem value is a hand-tuned approximation of "bottom nav height
(≈3.55rem) + tray (≈5rem when visible) + safe-area". The approximation
breaks the moment any of those three changes.

**Contract**:
- `td-final-shell` (the new class) does NOT set `padding-bottom` for the bottom nav.
- The bottom nav is owned by the shell and reserves its own height via
  `--tv-bottom-nav-height: 3.55rem` and a public CSS custom property
  `--tv-bottom-nav-total: calc(var(--tv-bottom-nav-height) + env(safe-area-inset-bottom, 0px))`.
- The Comparison Tray, when visible, adds `--tv-tray-height` (≈5rem)
  on mobile / `auto` on desktop.
- The route consumes both via `padding-bottom: calc(var(--tv-bottom-nav-total) + var(--tv-tray-height, 0px))`.
- When the tray is hidden, `--tv-tray-height: 0px` is set on `<html>` by
  the tray module so the route doesn't need to know.

---

## 5. Scroll-padding

For sticky in-page anchors to work, the scroll container needs
`scroll-padding-top` equal to the topbar height:

```
:root { scroll-padding-top: calc(var(--tv-header-height-mobile) + 0.5rem); }
@media (min-width: 1280px) {
  :root { scroll-padding-top: calc(var(--tv-header-height) + 0.5rem); }
}
```

This was missing on the v4 build. The decision nav links `#td4-rationale` /
`#td4-product` / `#td4-signal` / `#td4-alternatives` should land below the
topbar cleanly. Fix this in the reset.

---

## 6. Reduced motion

The new page must respect `prefers-reduced-motion: reduce`:

- The 14s scan on `.td-final-identity` (inherited from v4) is killed by
  `@media (prefers-reduced-motion: reduce) { ... animation: none; }`.
- The 720ms bar-fill entrance (already a one-shot) is killed too.
- Sticky positioning is preserved (sticky ≠ animation).
- The bottom nav badge pop (in `styles/mobile-bottom-nav.css`) is killed.

The reset must re-verify the reduced-motion contract for the new
namespace.

---

## 7. Test contract

Add (or extend) a Playwright test that verifies, on the new page:

1. `MobileBottomNav` is visible at 360×800, hidden at 1440×900.
2. `MobileTopBar` is visible at 360×800, hidden at 1440×900.
3. `CommandBar` is hidden at 360×800, visible at 1440×900.
4. `Comparison Tray` is hidden when `compareCount == 0`, visible at
   `compareCount >= 1`, capped at `compareCount == 5`.
5. The decision nav becomes sticky at viewport ≥ 1024 and is in-flow
   below that.
6. Clicking a decision-nav link scrolls so the target section header
   is fully visible (not hidden under the topbar).
7. The route has no element with `position: fixed` or
   `position: sticky` outside the layers listed in §2.

---

## 8. Files that must change to enforce this contract

| File | Change |
|---|---|
| `styles/tokens.css` | add `--tv-bottom-nav-total`, `--tv-tray-height`; document `--tv-z-sticky` |
| `app/globals.css` | add the `scroll-padding-top` rule from §5 |
| `components/layout/mobile-bottom-nav.tsx` | declare `--tv-bottom-nav-total` on `html` when mounted |
| `components/archive/archive-v4-compare-tray.tsx` (or new tray owner) | declare `--tv-tray-height: 0/5rem` on `html` based on count |
| `styles/tool-detail-v4.css` (deleted) → `styles/tool-detail-final.css` | remove the 7rem approximation; consume the new tokens |
| `app/(marketing)/toools/[slug]/page.tsx` (replaced) | the new page reads `--tv-bottom-nav-total` + `--tv-tray-height` for `padding-bottom` |

The new owner sets up the contract, the other actors fill in their
values via CSS custom properties on `<html>`, and the route is the
consumer — not the negotiator.
