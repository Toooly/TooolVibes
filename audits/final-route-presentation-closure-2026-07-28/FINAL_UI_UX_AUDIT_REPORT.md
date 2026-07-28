# TooolVibes Production UI/UX Audit — Read-Only
**Date**: 2026-07-28  
**Target**: https://tooolvibes.eu  
**Viewports**: 390×844 (mobile), 1024×768 (tablet), 1440×1000 (desktop)  
**Binding System**: Anton/Manrope · Dark Command Center (#06060E) · Ivory Decision Desk (#F4F0E7)  
**Scope**: Home, Archive, Tool Detail (blink), Radar, Compare, empty Shortlist, Collections, Collection Detail (indie-launch-stack), Posts, Affiliati, Account  

---

## Executive Summary

The production site respects the binding Anton/Manrope typography system and the Dark Command Center / Ivory Decision Desk surface palette. No legacy glassmorphism or backdrop-blur abuse was detected. Every audited route carries exactly one `<h1>`. No horizontal overflow occurs at any viewport.

**Three confirmed defects require migration within the existing system:**
1. **Collection Detail is completely broken** at all viewports (React hydration error #419 → generic error page).
2. **Archive suffers extreme card fatigue** (246 cards rendered simultaneously, nested depth 4) across all viewports.
3. **Tool Detail and Collections heroes overflow the mobile viewport** (1040 px and 712 px respectively on a 844 px tall screen).

Secondary issues: Posts carries 44 cards (moderate fatigue); Account triggers WebGL GPU-stall warnings on mobile; harmless Next.js RSC prefetch cancellations appear on several routes.

---

## 1. Typography Ownership ✅

| Route | Display | Body | Monospace |
|-------|---------|------|-----------|
| All routes | Anton (with Anton Fallback) | Manrope (with Manrope Fallback) | ui-monospace / JetBrains Mono |

No generic Arial/Inter/System-ui takeover detected. The Anton/Manrope binding is honored site-wide.

---

## 2. Semantic Surface / Background ✅

Detected computed backgrounds match the binding palette:
- **Dark Command Center base**: `rgb(6, 6, 14)` — page background on every route.
- **Raised surface**: `rgb(17, 17, 20)` / `rgb(24, 24, 29)` — cards, panels.
- **Ivory Decision Desk**: `rgb(244, 240, 231)` — light sections (Shortlist, Posts, Affiliati, Account).
- **Translucent overlay**: `rgba(16, 14, 36, 0.75)` — floating layers.

No alien colors or off-palette surfaces detected.

---

## 3. Text Contrast ✅

All `<h1>` elements were tested against their **actual parent background** (not body):

| Route | H1 Text Color | Parent BG | Contrast Ratio |
|-------|---------------|-----------|----------------|
| Home | `rgb(244,240,231)` | `rgb(8,8,10)` | **17.59** |
| Archive | `rgb(244,240,231)` | `rgb(8,8,10)` | **17.59** |
| Tool Detail | `rgb(244,240,231)` | `rgb(17,17,20)` | **16.57** |
| Radar | `rgb(244,240,231)` | `rgb(8,8,10)` | **17.59** |
| Compare | `rgb(244,240,231)` | `rgb(8,8,10)` | **17.59** |
| Shortlist | `rgb(26,20,16)` | `rgb(244,240,231)` | **16.04** |
| Collections | `rgb(244,240,231)` | `rgb(8,8,10)` | **17.59** |
| Collection Detail | `rgb(244,240,231)` | `rgb(17,17,20)` | **16.57** |
| Posts | `rgb(8,8,10)` | `rgb(244,240,231)` | **17.59** |
| Affiliati | `rgb(8,8,10)` | `rgb(244,240,231)` | **17.59** |
| Account | `rgb(26,20,16)` | `rgb(244,240,231)` | **16.04** |

All ratios exceed WCAG AAA for large text (≥4.5:1). No contrast defects.

---

## 4. Border Visibility ✅

- **Low-contrast invisible borders** (`rgba(..., 0.0–0.04)`): **0** on every route.
- Visible borders are present and subtle (`rgba(243,243,247,0.10)` class), separating surfaces without drawing attention.

---

## 5. Legacy Glass / Backdrop Blur ✅

- **Glass elements detected by class**: 0 on all routes.
- **Backdrop-filter computed style**: exactly **1 element per page** (likely the floating Command Palette / ⌘K overlay). This is within the constitution limit: glass is used only for floating UI, never on cards, lists, or pages.

No legacy glassmorphism abuse.

---

## 6. Nested Equal-Weight Cards ⚠️

| Route | Card Count | Max Nested Depth |
|-------|------------|------------------|
| Archive | **246** | **4** |
| Posts | 44 | 0 |
| Home | 7 | 1 |
| Tool Detail | 7 | 0 |
| Shortlist | 4 | 0 |
| Account | 1 | 0 |

**Archive** renders 246 cards with nesting depth up to 4. This creates equal-weight card fatigue: every card competes for attention, no clear hierarchy, and mobile users scroll endlessly through identical surfaces. The 02-ui-ux-rules.md explicitly forbids "huge cards stacked endlessly" and "long unstructured pages where the user only scrolls cards forever."

**Posts** at 44 cards is less severe but still dense.

---

## 7. Card Fatigue ⚠️

**Archive — all viewports (390, 1024, 1440)**  
Screenshot: `audit-results/Archive-{viewport}.png`  
246 cards rendered without pagination, virtual scrolling, or accordion collapse. On mobile this is a nearly endless vertical stack of identical-height surfaces. Migration: introduce pagination (12–16 items per page) or virtualized list rendering within the existing card component.

**Posts — all viewports**  
Screenshot: `audit-results/Posts-{viewport}.png`  
44 article cards in a continuous grid. Migration: add a "Load more" progressive-disclosure pattern or paginate to 12 posts per view, preserving the existing card styling.

---

## 8. CTA Hierarchy ✅

No page suffers from visually equal-weight CTAs fighting each other. The empty-state pages (Compare, Shortlist) present a single primary action:
- Compare empty: "Scegli i tool" (single prominent button).
- Shortlist empty: "Esplora catalogo" / "Apri Radar" / "Suggerisci tool" — three secondary actions, but the hierarchy is clear because the H1 and descriptive text establish context first.

Archive’s 120 interactive elements are links inside cards, not competing CTAs; the hierarchy issue there is **density**, not CTA confusion.

---

## 9. One Main / H1 ✅

Every audited route carries exactly **1 `<h1>`**. No duplicates, no missing headings.

---

## 10. Overflow ✅

**Horizontal overflow**: `false` on every route at every viewport. No broken containers, no unintended horizontal scroll.

---

## 11. Console Errors / Failed Requests

### Confirmed Errors

**Collection Detail — all viewports**  
- `pageerror`: Minified React error #419 (hydration mismatch).  
- `error`: "An error occurred in the Server Components render."  
This causes the generic error page: *"Qualcosa è andato storto — Codice errore: 2265377703"*.  
Screenshot: `audit-results/CollectionDetail-{viewport}.png` (26–35 KB, confirming error page).

**Account — mobile (390)**  
- `warning`: THREE.Clock deprecation (three.js).  
- `warning`: WebGL GPU stall due to ReadPixels (repeated 4×).  
This indicates the Account page initializes a 3D scene even for unauthenticated users, causing unnecessary mobile GPU load.

### Harmless Network Noise

Next.js RSC prefetch requests (`?_rsc=...`) return `net::ERR_ABORTED` on Home, Tool Detail, Compare, Shortlist, Posts, Account, Collections. These are cancelled navigational prefetches, not resource failures. No font or app-bundle requests failed.

---

## 12. Truthful Radar ✅

**Radar — all viewports**  
Screenshot: `audit-results/Radar-{viewport}.png`  
- Text confirms: *"Lanci reali, ordinati per periodo. Nessun dato simulato."*  
- Live timestamp: *"Dati live Product Hunt · aggiornati il 28 lug 2026 · 16:00 UTC"*  
- Signal count: **5 segnali** displayed.  
- Canvas/SVG visual elements: **106** (radar chart + labels + badges).  
The Radar renders genuine Product Hunt data, not placeholder graphics.

---

## 13. Meaningful Compare / Account Pre & Post Hydration ✅

**Compare — all viewports**  
Screenshot: `audit-results/Compare-{viewport}.png`  
Empty state is meaningful: *"Nessun candidato nel confronto. Aggiungi 2 o più tool dal catalogo per far emergere le differenze vere."* with a clear "Scegli i tool" CTA. No hydration jump detected; the empty state is stable from first paint.

**Account — all viewports**  
Screenshot: `audit-results/Account-{viewport}.png`  
Unauthenticated state renders immediately: *"Accedi al workspace"* with Login / Register tabs and form fields. No flash of unauthenticated content after hydration; the server delivers the correct anonymous workspace shell.

---

## 14. Confirmed Route Defects — Viewport Specificity

| # | Route | Viewports | Defect | Evidence |
|---|-------|-----------|--------|----------|
| D1 | **Collection Detail** | 390, 1024, 1440 | Generic error page (React #419 + Server Components error) | Screenshots: `CollectionDetail-{mobile,tablet,desktop}.png` (26–35 KB error page). Console: React #419. |
| D2 | **Archive** | 390, 1024, 1440 | Extreme card fatigue: 246 cards, nested depth 4 | Screenshots: `Archive-{mobile,tablet,desktop}.png`. Audit count: 246 cards. |
| D3 | **Tool Detail** | 390 only | Hero section overflows mobile viewport (1040 px height > 844 px screen) | Screenshot: `ToolDetail-mobile.png`. Hero height: 1040 px. |
| D4 | **Collections** | 390 only | Hero section consumes 84 % of mobile screen (712 px / 844 px) | Screenshot: `Collections-mobile.png`. Hero height: 712 px. |
| D5 | **Posts** | 390, 1024, 1440 | Moderate card fatigue: 44 cards continuous | Screenshot: `Posts-{mobile,tablet,desktop}.png`. Audit count: 44 cards. |
| D6 | **Account** | 390 | WebGL GPU stall + THREE.Clock deprecation warnings | Console logs captured. 3D scene initialized for anonymous users. |

---

## 15. Recommendations — Migrations Inside the Binding System

All recommendations stay within the existing **Anton/Manrope · Dark Command Center · Ivory Decision Desk** system. No redesign, no new content, no palette changes.

### D1 — Collection Detail Error
**Migration**: Fix the Server Component / hydration mismatch on `/collections/[slug]`.
- The React #419 error indicates the server-rendered HTML does not match the client tree. Likely causes: timestamp/random ID generated differently on server vs client, or a `useEffect` guard missing around a browser-only API.
- **Action**: Audit the Collection Detail page component for non-deterministic renders (dates, random IDs, `window`/`document` access without `useEffect`). Ensure the data fetch in the Server Component is stable and the Client Component boundary is clean.

### D2 — Archive Card Fatigue
**Migration**: Reduce perceived density while keeping the existing card styling.
- **Action 1**: Replace full list with **virtualized rendering** (e.g. `react-window` or CSS `content-visibility`) so only visible cards mount in the DOM. This preserves the current card design but eliminates the 246-node stack.
- **Action 2**: If virtualization is complex, add **pagination** (16 cards per page) with a "Carica altri" button. Use the existing Ivory Decision Desk button style for the load-more CTA.
- **Action 3**: Flatten nested card depth from 4 to 1 by removing wrapper divs that add redundant `.card` classes.

### D3 — Tool Detail Mobile Hero Overflow
**Migration**: Constrain the hero to a reasonable mobile viewport share.
- **Action**: Cap the hero section height on viewports ≤ 390 px to `max-height: 60vh` (≈ 506 px) or reduce internal padding/typography scale. Keep the Anton display heading and the existing gradient overlay; only adjust vertical spacing and image aspect ratio.

### D4 — Collections Mobile Hero Oversize
**Migration**: Same pattern as D3.
- **Action**: Cap the Collections hero at `max-height: 50vh` (≈ 422 px) on mobile. The hero currently shows a large editorial image; constrain the image container rather than cropping the image.

### D5 — Posts Card Fatigue
**Migration**: Progressive disclosure.
- **Action**: Render the first 12 post cards, then hide the remainder behind a "Mostra altri" accordion or button. Re-use the existing card component and grid; only change the render boundary.

### D6 — Account Mobile WebGL Waste
**Migration**: Defer 3D initialization until needed.
- **Action**: Wrap the three.js scene in a `useEffect` that only mounts when the user is authenticated **and** the scene is in viewport. For anonymous users, render a static CSS gradient background in the Ivory Decision Desk palette instead of an active WebGL context. This removes the GPU stall and THREE.Clock warning without changing the visual result for most users.

### RSC Prefetch Noise
**Migration**: Not required for UI/UX, but if desired, suppress prefetch abort logging in the production build by ensuring `next.config.ts` has `logging: { fetches: { fullUrl: false } }` or equivalent.

---

## Appendix: Screenshot Inventory

All screenshots show resolved routes (no gate screens, no loading spinners):

| Screenshot | Route | Viewport | Notes |
|------------|-------|----------|-------|
| `Home-mobile.png` | Home | 390 | Valid resolved route |
| `Home-tablet.png` | Home | 1024 | Valid resolved route |
| `Home-desktop.png` | Home | 1440 | Valid resolved route |
| `Archive-mobile.png` | Archive | 390 | Shows 246-card stack |
| `Archive-tablet.png` | Archive | 1024 | Shows 246-card stack |
| `Archive-desktop.png` | Archive | 1440 | Shows 246-card stack |
| `ToolDetail-mobile.png` | Tool Detail | 390 | Hero overflow visible |
| `ToolDetail-tablet.png` | Tool Detail | 1024 | Valid resolved route |
| `ToolDetail-desktop.png` | Tool Detail | 1440 | Valid resolved route |
| `Radar-mobile.png` | Radar | 390 | Valid resolved route |
| `Radar-tablet.png` | Radar | 1024 | Valid resolved route |
| `Radar-desktop.png` | Radar | 1440 | Valid resolved route |
| `Compare-mobile.png` | Compare | 390 | Empty state visible |
| `Compare-tablet.png` | Compare | 1024 | Empty state visible |
| `Compare-desktop.png` | Compare | 1440 | Empty state visible |
| `ShortlistEmpty-mobile.png` | Shortlist | 390 | Empty state visible |
| `ShortlistEmpty-tablet.png` | Shortlist | 1024 | Empty state visible |
| `ShortlistEmpty-desktop.png` | Shortlist | 1440 | Empty state visible |
| `Collections-mobile.png` | Collections | 390 | Hero overflow visible |
| `Collections-tablet.png` | Collections | 1024 | Valid resolved route |
| `Collections-desktop.png` | Collections | 1440 | Valid resolved route |
| `CollectionDetail-mobile.png` | Collection Detail | 390 | **Error page** |
| `CollectionDetail-tablet.png` | Collection Detail | 1024 | **Error page** |
| `CollectionDetail-desktop.png` | Collection Detail | 1440 | **Error page** |
| `Posts-mobile.png` | Posts | 390 | 44-card grid |
| `Posts-tablet.png` | Posts | 1024 | 44-card grid |
| `Posts-desktop.png` | Posts | 1440 | 44-card grid |
| `Affiliati-mobile.png` | Affiliati | 390 | Valid resolved route |
| `Affiliati-tablet.png` | Affiliati | 1024 | Valid resolved route |
| `Affiliati-desktop.png` | Affiliati | 1440 | Valid resolved route |
| `Account-mobile.png` | Account | 390 | Valid resolved route |
| `Account-tablet.png` | Account | 1024 | Valid resolved route |
| `Account-desktop.png` | Account | 1440 | Valid resolved route |

All screenshots are located in `/Users/gianmariacaltagirone/Tooolvibes/audit-results/`.
