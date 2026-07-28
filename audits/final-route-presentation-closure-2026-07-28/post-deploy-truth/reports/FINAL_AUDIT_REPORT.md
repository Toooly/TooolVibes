# Production Audit Report: https://tooolvibes.eu

**Date:** 2026-07-28T19:14:40Z  
**Worker Version:** 5e048104-487a-4ed3-9d77-8a3e0acd6a91  
**Method:** Real Chromium via agent-browser (Bun), read-only, no local source inspection  
**Viewports:** 390×844 (mobile), 1024×768 (tablet), 1440×1000 (desktop)  
**Routes Audited:** Home, Archive, Radar, Compare, Shortlist, Collection, Posts, Affiliati, Account, Tool

---

## Truth Table

| Route | Viewport | Status | Actual URL | H1 Count | Body Font | Issues |
|-------|----------|--------|------------|----------|-----------|--------|
| Home | mobile | OK | / | 1 | Manrope | None |
| Home | tablet | OK | / | 1 | Manrope | None |
| Home | desktop | OK | / | 1 | Manrope | None |
| Archive | mobile | OK | /archivio | 1 | Manrope | None |
| Archive | tablet | OK | /archivio | 1 | Manrope | None |
| Archive | desktop | OK | /archivio | 1 | Manrope | None |
| Radar | mobile | OK | /radar | 1 | Manrope | None |
| Radar | tablet | OK | /radar | 1 | Manrope | None |
| Radar | desktop | OK | /radar | 1 | Manrope | None |
| Compare | mobile | OK | /compare | 1 | Manrope | None |
| Compare | tablet | OK | /compare | 1 | Manrope | None |
| Compare | desktop | OK | /compare | 1 | Manrope | None |
| Shortlist | mobile | OK | /shortlist | 1 | Manrope | Form visible initially |
| Shortlist | tablet | OK | /shortlist | 1 | Manrope | Form visible initially |
| Shortlist | desktop | OK | /shortlist | 1 | Manrope | Form visible initially |
| Collection | mobile | DEFECT | /collections/research-synthesis-toolkit | 1 | Manrope | RSC render errors |
| Collection | tablet | DEFECT | /collections/research-synthesis-toolkit | 1 | Manrope | RSC render errors |
| Collection | desktop | DEFECT | /collections/research-synthesis-toolkit | 1 | Manrope | RSC render errors |
| Posts | mobile | OK | /posts | 1 | Manrope | None |
| Posts | tablet | OK | /posts | 1 | Manrope | None |
| Posts | desktop | OK | /posts | 1 | Manrope | None |
| Affiliati | mobile | OK | /affiliati | 1 | Manrope | None |
| Affiliati | tablet | OK | /affiliati | 1 | Manrope | None |
| Affiliati | desktop | OK | /affiliati | 1 | Manrope | None |
| Account | mobile | OK | /account | 1 | Manrope | THREE.Clock warning |
| Account | tablet | OK | /account | 1 | Manrope | THREE.Clock warning |
| Account | desktop | OK | /account | 1 | Manrope | THREE.Clock warning |
| Tool | mobile | OK | /toools/blink | 1 | Manrope | None |
| Tool | tablet | OK | /toools/blink | 1 | Manrope | None |
| Tool | desktop | OK | /toools/blink | 1 | Manrope | None |

---

## Confirmed Real Issues

### 1. Collection Detail — Server Components Render Errors (all viewports)
- **Console:** `CollectionSlotCard render error` with digest `1735090731`
- **Count:** 4 errors + 4 warnings (mobile), 8+8 (tablet), 12+12 (desktop)
- **Impact:** Leaked serialized React JSON visible in DOM containing `"404"` badge text
- **Evidence:** `screenshots/Collection-*-final.png`, console logs in JSON

### 2. Account — THREE.Clock Deprecation Warnings (all viewports)
- **Console:** `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
- **Count:** 1 (mobile), 2 (tablet), 3 (desktop)
- **Impact:** Non-critical warning; indicates outdated Three.js usage
- **Evidence:** console logs in JSON

---

## Present in DOM but Correctly Hidden/Collapsed

_The inspected terms (`Spazio partner`, `Partner editoriale`, `Prenotabile`, `reserved`, `planned`) were **completely absent** from the DOM text of all ten routes. No nodes were found hidden, collapsed, or otherwise concealed — the content simply does not exist in the current production build._

---

## Actual Visible Defects

### 1. Collection Detail — Leaked JSON / "404" Badge in Visible DOM
- **Description:** The Server Components error boundary exposes internal serialized React payload as visible text. The string `"children":"404"` appears inside a className attribute in the DOM text, alongside other JSON-escaped component props.
- **Routes:** Collection (all viewports)
- **Is it a 404 page?** No — the H1 renders correctly as "Toolkit ricerca e sintesi" and the URL is `/collections/research-synthesis-toolkit`. The "404" is a leaked badge value, not a page-not-found state.
- **Screenshot:** `Collection-desktop-final.png` (close-up recommended)

---

## Radar State Sequence / Timing

### Radar Route

All viewports show identical behavior:

| Poll | Time | Terminal State | Loading | Retry | PH Requests |
|------|------|----------------|---------|-------|-------------|
| 1 | ~20ms | `live` | false | false | 0 |
| 2 | ~1580ms | `live` | false | false | 0 |
| 3 | ~3140ms | `live` | false | false | 0 |
| 4 | ~4710ms | `live` | false | false | 0 |
| 5 | ~6280ms | `live` | false | false | 0 |
| 6 | ~7840ms | `live` | false | false | 0 |

- **Terminal state:** `live` immediately on first poll
- **Generic loading:** None detected (no skeletons, no aria-busy)
- **Fixtures/fabricated data:** No evidence — data appears real
- **Retry visible:** No retry button or link found
- **Product Hunt requests:** None captured in `performance.getEntriesByType('resource')` (data likely delivered via RSC or alternate endpoint)

### Home Preview (Radar widget on Home)

- **data-state nodes:** 3 elements, all `live`
- **Visible copy:** "Feed Product Hunt · dati non simulati", "Segnali da verificare, non hype da inseguire", LIVE badge
- **Data:** Real vote counts visible — Prefactor (465), Cekura (305), Lottie Creator 2.0 (260), Hardbook (165), EasyCircuit (152)
- **Status:** Healthy, live, no loading state

---

## Partner Visibility / Accessibility

**Result:** Zero occurrences across all 10 routes.

Search terms: `Spazio partner`, `Partner editoriale`, `Prenotabile`, `reserved`, `planned`

- **Home:** Not present
- **Archive:** Not present
- **Radar:** Not present
- **Compare:** Not present
- **Shortlist:** Not present
- **Collection:** Not present
- **Posts:** Not present
- **Affiliati:** Not present
- **Account:** Not present
- **Tool:** Not present

---

## Shortlist Initial Hierarchy

### Clean Browser Context (localStorage cleared)

All viewports show identical structure:

- **Saved tools:** 0 — main text reads "Nessun tool salvato, per ora"
- **Recommendation entries:** 4 article/card elements present (likely empty-state placeholders or structural UI)
- **Archive primary link:** Present
- **Radar secondary link:** Present
- **Suggest trigger:** "Suggerisci un tool" button visible (`display: flex`)
- **Full request form:** **Visible and layout-occupying from initial load**
  - `display: block`
  - Height: ~1677px
  - Contains 12 fields including "Company website", "Utente", etc.
  - Text visible: "Consiglia un tool che usi davvero. Se lo usi e ti ha convinto, lascia il contesto..."
- **Tab reachability:** All form fields are in the normal tab order (no `tabindex="-1"` or `aria-hidden` detected on the form)
- **Modal/disclosure behavior:** The form is not inside a `<details>` or modal overlay; it is openly rendered in the page flow. Pressing Escape does not collapse it.

**Note:** The form being fully visible on initial load may be intentional design, but it contradicts the expectation of a collapsed/disclosed state.

---

## Affiliati Disclosure / Honeypot

### Default State (closed)

- **`<details>` elements:** 1
  - `open: false`
  - Summary text: "Aggiungi canali di promozione e profili socialApri"
- **Secondary social fields:** Hidden inside closed `<details>`
  - Not layout-occupying (details closed)
  - Not tab-reachable until opened

### Opened State (scripted open)

- **Fields become visible:** Yes
- **Honeypot fields:** 2 detected
  - `type="hidden"` OR `display: none` / `visibility: hidden` / `opacity: 0`
  - `tabIndex` not set (defaults to non-focusable)
  - `aria-hidden` not explicitly set
- **Company Website controls:** 1 input, `name="companyWebsite"`, `type="text"`
  - No duplicate controls detected
  - Label association: not explicitly verified via `for` attribute in this audit

---

## Compare — Initial vs Settled

### Mobile
- **Initial copy:** "Nessun candidato nel confronto. Aggiungi 2 o più tool..."
- **Settled copy:** Same (no shift detected)
- **Slots:** 5
- **Actions:** "Scegli i tool"

### Tablet / Desktop
- **Initial copy:** "La matrice è vuota. Costruisci un confronto che porti a una scelta..."
- **Settled copy:** Same (no shift detected)
- **Slots:** 8
- **Actions:** "Scegli i tool", "Confronto fianco a fianco", "Verdetto spiegato", "Decisione salvabile"

**Preparation state:** None detected. The page renders its final empty-state immediately.

---

## Account — Initial vs Settled

### All Viewports
- **Initial route identity:** `/account` — loads successfully
- **Settled auth structure:** Guest/unauthenticated context
  - H1: "Accedi al workspace"
  - Buttons: "Accedi", "Registrati", "Admin", "Accedi con email"
  - Inputs: 1 (email field)
  - No session cookies or authenticated UI detected
- **Duration:** ~2–3 seconds to fully settle (networkidle + 2s wait)

---

## Computed Fonts

### Body / UI
- **All routes, all viewports:** `Manrope, "Manrope Fallback", Manrope, "Segoe UI", sans-serif`
- **Status:** Correct per design intent

### H1 (Monumental)
- **Home, Archive, Radar, Compare, Collection, Posts, Tool:** `Anton, "Anton Fallback", Impact, "Arial Narrow", sans-serif`
- **Shortlist, Affiliati, Account:** `Manrope` (no Anton)
- **Status:** Anton used where intentional; Manrope on utility pages — acceptable

### Visible Text Scan
- **Fraunces:** Not detected on any route
- **Inter:** Not detected on any route
- **Other visible fonts:** `ui-monospace, "SF Mono", "JetBrains Mono", monospace` (code elements, occasional)

---

## Glass / Contrast / Surface Findings

### Backdrop-Filter (Legacy Glass)
- **Result:** **Zero elements** across all 30 route+viewport combinations
- **Status:** No legacy glass effects present

### Near-White Alpha Background Cards
- **Home:** 6 elements (likely decorative surface cards)
- **Radar:** 10 elements
- **Shortlist:** 10–11 elements
- **Collection:** 3 elements
- **Posts:** 3 elements
- **Tool:** 2 elements
- **Assessment:** These are intentional translucent white surfaces, not accidental collisions. No contrast failures detected in this automated pass.

### Background Gradients
- **Home:** 6
- **Archive:** 31 (likely tool-card gradient overlays)
- **Radar:** 1
- **Shortlist:** 2–3
- **Collection:** 6
- **Posts:** 43 (likely post cover gradients)
- **Tool:** 2
- **Assessment:** All gradients appear intentional and decorative. No accidental mixed surfaces or old gradient-radius-glow artifacts detected.

---

## Evidence Paths

### Screenshots (Final, Full-Page)
- `screenshots/Home-mobile-final.png`
- `screenshots/Home-tablet-final.png`
- `screenshots/Home-desktop-final.png`
- `screenshots/Archive-mobile-final.png`
- `screenshots/Archive-tablet-final.png`
- `screenshots/Archive-desktop-final.png`
- `screenshots/Radar-mobile-final.png`
- `screenshots/Radar-tablet-final.png`
- `screenshots/Radar-desktop-final.png`
- `screenshots/Compare-mobile-final.png`
- `screenshots/Compare-tablet-final.png`
- `screenshots/Compare-desktop-final.png`
- `screenshots/Shortlist-mobile-final.png`
- `screenshots/Shortlist-tablet-final.png`
- `screenshots/Shortlist-desktop-final.png`
- `screenshots/Collection-mobile-final.png`
- `screenshots/Collection-tablet-final.png`
- `screenshots/Collection-desktop-final.png`
- `screenshots/Posts-mobile-final.png`
- `screenshots/Posts-tablet-final.png`
- `screenshots/Posts-desktop-final.png`
- `screenshots/Affiliati-mobile-final.png`
- `screenshots/Affiliati-tablet-final.png`
- `screenshots/Affiliati-desktop-final.png`
- `screenshots/Account-mobile-final.png`
- `screenshots/Account-tablet-final.png`
- `screenshots/Account-desktop-final.png`
- `screenshots/Tool-mobile-final.png`
- `screenshots/Tool-tablet-final.png`
- `screenshots/Tool-desktop-final.png`

### Early-State Screenshots
- `screenshots/Radar-mobile-early.png`
- `screenshots/Radar-tablet-early.png`
- `screenshots/Radar-desktop-early.png`
- `screenshots/Compare-mobile-early.png`
- `screenshots/Compare-tablet-early.png`
- `screenshots/Compare-desktop-early.png`
- `screenshots/Account-mobile-early.png`
- `screenshots/Account-tablet-early.png`
- `screenshots/Account-desktop-early.png`

### Structured Data
- `json/audit-results.json` (full DOM, network, console, computed styles)
- `reports/FINAL_AUDIT_REPORT.md` (this document)

---

## Summary

| Category | Count | Details |
|----------|-------|---------|
| Routes audited | 10 | All requested routes resolved successfully |
| Viewports | 3 | 390×844, 1024×768, 1440×1000 |
| Screenshots captured | 39 | 30 final + 9 early-state |
| Confirmed real issues | 2 | Collection RSC errors, Account THREE.Clock warnings |
| Visible defects | 1 | Collection leaked JSON / "404" badge |
| Partner terms found | 0 | Absent from all routes |
| Backdrop-filter elements | 0 | No legacy glass |
| Horizontal overflow | 0 | None detected |
| Failed font requests | 0 | None detected |
| Radar terminal state | `live` | Immediate on all viewports + Home preview |

**No fixes applied. No source edited. No git changes. All evidence is read-only production truth.**
