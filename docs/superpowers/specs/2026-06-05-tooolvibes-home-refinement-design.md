# TooolVibes Home UI/UX Refinement — Design Spec

**Date:** 2026-06-05  
**Scope:** Home desktop + mobile, Catalogo, Radar, Suggerisci. Rifinitura UI/UX, NO backend/auth/API changes.  
**Status:** Approved

---

## 1. Goals

- Transform the Home from a sequence of separated "blocks" into a single, continuous, premium narrative experience.
- Keep all existing 3D graphics (`SiteUniverseBackground`, orbital systems, black hole, planets, starfield).
- Fix overlaps between 3D elements and content (text, cards, buttons) in Catalogo.
- Restore graphical coherence to Radar and Suggerisci pages.
- Ensure mobile feels native, not just a compressed desktop.

## 2. Non-Goals

- No new backend endpoints, no auth changes, no API modifications.
- No new route definitions.
- No removal of existing 3D layers or identity.
- No complete rebuild.

## 3. State of the World (Current Issues)

| # | Issue | Location |
|---|-------|----------|
| 1 | Home stages are oversized (`min-h-[85svh]`) with redundant vertical gaps (`space-y-6` + `pt-16 pb-20`), creating separated blocks. | `vibe-home-v2.tsx` |
| 2 | `overflow-x-clip` on stages clips orbital nodes and badges that extend past horizontal bounds. | `vibe-home-v2.tsx`, `globals.css` |
| 3 | Orbital nodes (`z-index: 9`) render above HUD text (`z-index: 8`), reducing readability. | `globals.css` |
| 4 | `supportingTools` prop is computed in `page.tsx` but never consumed in `vibe-home-v2.tsx`. | `page.tsx` → `vibe-home-v2.tsx` |
| 5 | `hero-section.tsx` exists but is dead code (never imported). | `components/home/hero-section.tsx` |
| 6 | `BlackHole` is not rendered on `/` (only planets + stars), leaving the orbital center visually empty. | `site-universe-background.tsx` |
| 7 | Catalog controls are fixed at `z-40`; global `OrbitalLayer` badges can reach `z-60` and potentially overlap. | `floating-catalog-view.tsx`, `OrbitalLayer` |
| 8 | Radar has duplicated desktop/mobile code with divergent copy and broken accents (`e` instead of `è`). | `product-hunt/page.tsx`, `desktop-vibe-radar.tsx` |
| 9 | Suggerisci has two completely different forms: mobile uses Premium design system; desktop uses legacy custom CSS. | `request-tool-form.tsx`, `desktop-vibe-wishlist.tsx` |
| 10 | Mobile experience inherits desktop orbital densities and fixed controls that feel cramped. | Multiple |

## 4. Design — Home Desktop

### 4.1 Continuous Experience

- **Wrapper:** Remove `space-y-6` from the outer `div` in `vibe-home-v2.tsx`.
- **Stage heights:**
  - Hero: keep `min-h-[calc(85svh-4rem)]` as the visual anchor.
  - All other stages: reduce to `min-h-[60svh]` (or `auto` with generous padding `py-16 md:py-20`) so sections flow into one another.
- **Overflow:** Remove `overflow-x-clip` from `.home-orbit-stage` in `globals.css`. Replace with `overflow-visible` so orbital nodes and badges are never clipped. If horizontal scroll appears, add `overflow-x-hidden` only on the outer `main` container.
- **Background continuity:** Add a subtle shared gradient class (e.g., `home-flow-gradient`) that applies a continuous radial background across all stages instead of resetting to flat color each section.

### 4.2 Hero Section

**Copy:**
- Title: *“Scegli tool validi senza attraversare il rumore.”*
- Subtitle: *“TooolVibes seleziona, organizza e aggiorna i migliori strumenti AI e SaaS. Nessuna lista infinita: solo quelli che fanno davvero la differenza.”*

**Layout:**
- Title + subtitle centered (or left-aligned on very wide screens).
- Two CTAs below: primary *“Esplora il catalogo”* (`/archivio`), secondary *“Scopri il Radar”* (`/product-hunt`).
- **Featured card:** prominent card for `weeklyTool` (name, tagline, category, link).
- **Supporting grid:** 3–4 smaller cards for `featuredDirectoryTools` (excluding weeklyTool). Each card shows icon, name, one-line description.

**Floating elements:**
- 3–5 decorative badge-like shapes (generic tool icons or TooolVibes logo-mark) positioned absolutely at safe margins (top-right, bottom-left).
- All decorative floats: `pointer-events: none; z-index: 1`.
- No floats may overlay text or CTA buttons.

### 4.3 Second Block — “Scegli la tua prossima rotta”

**Layout:** 3 large rectangular cards, side-by-side on desktop (`grid-cols-3`), stacked on mobile.

**Card specs:**
- `min-h-[320px]` on desktop, `min-h-[240px]` on mobile.
- Border: subtle gradient (`border-gradient-to-br from-[#6a3cff]/30 to-transparent`).
- Content: large icon/title, 2-line description, CTA link with arrow.
- Hover: `translateY(-4px)`, increased shadow, border brightens.

**Cards:**
1. **Catalogo** — *Esplora l’archivio.* — Tutti i tool selezionati, filtrabili per categoria. → `/archivio`
2. **Collection** — *Collezioni tematiche.* — Selezione curata per esigenze specifiche. → `/collections`
3. **Radar Live** — *Radar & trend.* — I lanci più caldi e i segnali da non perdere. → `/product-hunt`

### 4.4 Discover / Compare / Shortlist — Compact

- Reduce vertical padding to `py-12 md:py-16`.
- 3-column grid on desktop, single column on mobile.
- Each block: icon (48px), title (h3), 2-line description.
- Descriptions:
  - **Discover:** *Scopri strumenti utili selezionati, non liste infinite.*
  - **Compare:** *Confronta alternative reali, non pubblicità.*
  - **Shortlist:** *Salva e costruisci la tua selezione operativa.*

### 4.5 Tool della Settimana / Editorial

- Section header: *“In orbita questa settimana”*.
- Grid: 2 large editorial cards + 3 smaller ones, or 3 equal cards.
- Each card: tool image/icon, name, one-line pitch, category badge.
- Badges: *“Weekly pick”*, *“Trending”*, *“From Product Hunt”*, *“Selected by TooolVibes”*.
- Product Hunt integration: if live data unavailable, render placeholder cards with `opacity-60` and badge *“Coming from Product Hunt”*.
- Decorative floating hints around the grid (`pointer-events: none`).

### 4.6 Beginner / Intermediate / Expert

Replaces the existing “Alternative reali in orbita” section.

**Layout:** 3 cards in a row (desktop), stack (mobile).

| Card | Color accent | Description | Floating examples |
|------|--------------|-------------|-------------------|
| Beginner | Emerald/teal | Per chi vuole partire veloce, scoprire tool semplici e trovare strumenti immediati. | Notion, Canva, Trello |
| Intermediate | Violet/brand | Per chi usa già tool AI/SaaS e vuole alternative migliori e workflow più efficienti. | Zapier, Copy.ai, Figma |
| Expert | Amber/orange | Per chi cerca tool avanzati, automazioni, API, stack professionali e soluzioni tecniche. | OpenAI API, n8n, LangChain |

- Each card has a subtle top-border accent matching its color.
- 2–3 micro-badges float around each card with real tool names (filtered from existing `tools` data by category tag).
- All floats: `pointer-events: none`.

### 4.7 Final Section — “Resta dentro l’orbita TooolVibes”

- Title: *Resta dentro l’orbita TooolVibes.*
- Subtitle: *Seguici, suggerisci un tool, entra nel circuito.*
- Actions (centered row of buttons, wrapping on mobile):
  - LinkedIn (placeholder `#`)
  - Community / Telegram (placeholder `#`)
  - Newsletter (placeholder `#`)
  - Email (`mailto:hello@tooolvibes.com`)
  - **Suggerisci il tuo tool** → `/wishlist`
- Button style: matches orbital floating button style (rounded-full, subtle gradient border).

## 5. Design — Home Mobile

- Hero: reduce to `min-h-[70svh]`; decrease title size; stack CTA buttons.
- Second block cards: full-width stack with `gap-4`.
- Discover/Compare/Shortlist: single column, compact.
- Editorial grid: 1 or 2 columns max.
- Beginner/Intermediate/Expert: stacked cards.
- Reduce number of decorative floating elements by ~50%.
- Ensure no text is covered by floats: floats positioned only at extreme edges (`left-[-1rem]`, `right-[-1rem]`) or hidden on mobile.
- All interactive targets: min `44×44px`.

## 6. Design — Catalogo

**Priority:** functionality first (readable tools, clickable cards, usable filters), 3D decorative second.

**Fixes:**
- Ensure fixed controls (search `top-20`, filters `top-36`) stay at `z-50`.
- Ensure orbital nodes inside catalog never exceed `z-30` inside the catalog context, so global `OrbitalLayer` (z-15) + catalog controls (z-50) maintain correct stacking.
- Add `overflow-x-hidden` on the catalog page root to prevent horizontal scroll from orbiting nodes.
- Verify `pointer-events` on 3D canvas remain `none`.
- Mobile: simplify orbital ring radii and node count; increase tap targets.

## 7. Design — Radar

- Unify copy between desktop (`desktop-vibe-radar.tsx`) and mobile (`product-hunt/page.tsx`). Source of truth: the desktop version’s narrative, but with correct accents.
- Correct accented characters: `è`, `più`, `profondità`.
- Apply standard page shell padding (`pb-14 pt-6`) to match other internal pages.
- Keep `hero-shell` dark text styling but ensure it does not conflict with `text-white` overrides.
- Ensure `PageOrbitShell` navigation orbits are clickable and scroll to `#rankings` correctly.

## 8. Design — Suggerisci

- **Unify form styling:** replace the legacy desktop custom form (`desktop-vibe-wishlist.tsx`) with the Premium design system used by mobile (`PremiumPanel`, `PremiumButton`, `PremiumBadge`, `FieldError`).
- **Preserve logic:** do not change submit handlers, validation rules, API calls, or success/error flows.
- **Layout:** two-column on desktop (hero left, form right), single column on mobile.
- **Form fields:** Name, Email, Tool Name, Category, Message (optional), Link.
- **Toast:** ensure `motion-toast` confirmation appears on both breakpoints.
- **Spacing:** `gap-4 sm:gap-6`, generous padding inside `PremiumPanel`.

## 9. Global CSS & Layout Rules

- **z-index hierarchy (new):**
  - 3D canvas: `z-0`, `pointer-events: none`
  - Background gradients: `z-1`
  - Orbital decorative layers: `z-5` to `z-10`
  - Content / HUD / text: `z-20` (with `pointer-events: auto` where interactive)
  - Fixed controls (search, nav): `z-40` to `z-50`
  - Modals / toasts: `z-60` to `z-70`
- **Overflow:**
  - Outer `main`: `overflow-x-hidden`.
  - Individual stages: `overflow-visible` (allow nodes to breathe).
- **Pointer-events:**
  - All 3D and decorative orbital elements: `none`.
  - Only clickable nodes and buttons: `auto`.

## 10. Data Sources

| Data | Source | Usage |
|------|--------|-------|
| Tool del giorno | `weeklyTool` (from page.tsx) | Hero featured card |
| Tool consigliati | `featuredDirectoryTools` (from page.tsx) | Hero supporting grid |
| Beginner/Intermediate/Expert examples | `tools` array, filtered by category tag | Floating micro-badges around level cards |
| Product Hunt | Placeholder / existing integration | Editorial badges |

No new backend queries.

## 11. Component Inventory

### Modified
- `vibe-home-v2.tsx` — restructure stages, new sections, reduced heights.
- `page.tsx` (marketing) — pass `supportingTools` correctly or remove dead prop.
- `floating-catalog-view.tsx` — z-index fixes, overflow control.
- `product-hunt/page.tsx` — unified copy, standard padding.
- `desktop-vibe-radar.tsx` — copy fixes.
- `wishlist/page.tsx` — standard padding; on desktop, replace the legacy inline form with `<RequestToolForm>` to eliminate duplication.
- `desktop-vibe-wishlist.tsx` — deprecate or remove the legacy custom form markup; use `<RequestToolForm>` inside the desktop layout instead.
- `request-tool-form.tsx` — ensure it renders correctly in both mobile (single column) and desktop (two-column layout wrapper) contexts; confirm toast appears on both breakpoints.
- `globals.css` — orbital z-index, overflow, spacing, gradient continuity.
- `site-universe-background.tsx` — consider restoring `BlackHole` on `/` (optional, if visually beneficial).

### Potentially Removed / Deprecated
- `hero-section.tsx` — if confirmed completely unused, can be deleted or left as-is (out of scope).

## 12. Testing Checklist

### Home Desktop
- [ ] Hero is catchy and clear.
- [ ] Home feels like one continuous scroll, not separate blocks.
- [ ] Sections flow together without excessive gaps.
- [ ] Cards are uniform and readable.
- [ ] 3D elements integrate, not distract.
- [ ] No text or button is covered by orbital nodes.
- [ ] Floating decorative elements do not block clicks.

### Home Mobile
- [ ] Layout feels native (not squashed desktop).
- [ ] No overlaps between text and decorative floats.
- [ ] Cards are readable.
- [ ] Buttons are easily tappable.
- [ ] No horizontal scroll.

### Catalogo
- [ ] Tools are not overlapped by 3D.
- [ ] Cards are readable and clickable.
- [ ] Search and filters are usable.
- [ ] 3D is visible but not invasive.

### Radar
- [ ] Graphics restored, layout premium.
- [ ] Coherent with rest of site.
- [ ] Accented characters render correctly.

### Suggerisci
- [ ] Graphics restored.
- [ ] Form is readable and well-spaced.
- [ ] Submit logic intact.
- [ ] Toast confirmation works.

### Functional
- [ ] All links work.
- [ ] All buttons are interactive.
- [ ] Hover states present.
- [ ] Search works.
- [ ] Form submits correctly.
- [ ] Routes unchanged.
- [ ] Build passes (`npm run build`).
- [ ] No critical console errors.

## 13. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Removing `overflow-x-clip` causes unexpected horizontal scroll on mobile. | Apply `overflow-x-hidden` only on the outer `main` container; keep stages `overflow-visible`. Test on 320px width. |
| Changing z-index hierarchy breaks modals or global OrbitalLayer badges. | Audit every `z-index` in `globals.css` before change; test modals and toasts after. |
| Unifying Suggerisci form to Premium design system breaks desktop submit/sounds. | Migrate JSX/classes only; preserve all event handlers, state logic, and `playTooolvibesSound` calls exactly. |
| Reducing stage heights makes orbital animations look cramped. | Adjust `inset` and `ringRadii` proportionally in CSS; test visually at each breakpoint. |
| Adding BlackHole to `/` clashes with existing orbital center nodes. | Make optional behind a prop/flag; test visually before committing. |

---

**Next Step:** Implementation plan via `writing-plans` skill.
