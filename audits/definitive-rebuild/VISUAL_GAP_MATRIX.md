# Visual Gap Matrix — Definitive UI Reconstruction (ACTIVE)

**Status:** DEFINITIVE UI RECONSTRUCTION — ACTIVE
**Previous verdict:** FINAL UI ACCEPTANCE PASS — **REVOKED BY USER VISUAL REVIEW**
**Date:** 2026-07-24
**Reviewer:** User (visual inspection of deployed production)

## Summary

The previous acceptance pass relied on typography, contrast, and
route-availability checks. The actual visual layout architecture
remains substantially similar to the prior version: same column
grids, same section flow, same component anatomy, same Radar as
a "panel with renamed nodes".

The definitive mockups require **architectural** changes that
the previous work did not deliver:

- Different **section composition** (e.g., home as a Command
  Center with control-bar identity, not a "hero + radar side
  panel" split)
- Different **column / grid architecture** (e.g., hero with a
  single dominant column + brand language, not a 50/50 split
  with text-only left half)
- **Rebuilt component anatomy** (e.g., Radar as a true circular
  instrument with orbital geometry, not a card with concentric
  arcs)
- New **hierarchy and proportions** (e.g., a much larger
  signature instrument that owns the viewport, not a 480px box
  next to a 700px text block)
- Different **mobile flow** (e.g., vertical scroll with a Radar
  that uses the full mobile width, not a 280px box with stacked
  components)
- New **signature instrument** (Radar — present in mockup as a
  large circle, not a rectangular panel)
- **Replaced navigation architecture** (e.g., command bar with
  working search and active-route marker, not a tab strip)

## Per-route gap table

| ROUTE | TARGET STRUCTURE (per mockup) | CURRENT STRUCTURE | MAJOR VISIBLE DIFFERENCE | COMPONENT OWNER | REBUILD ACTION | STATUS |
|---|---|---|---|---|---|---|
| GLOBAL SHELL | Definitive command bar (sticky, with active route marker, integrated search, signal-icon CTAs, decorative orbital geometry around the brand mark). Mobile top bar with logo + search trigger + hamburger. Mobile bottom nav with iconography + labels + active marker. Footer: editorial columns with brand language. | 5-tab pill nav, small logo, search icon, sound/music icons, "Accedi / Registrati" pill. No active route marker, no command-bar identity, no signal-icon CTAs. | (1) Header is a tab strip, not a command bar. (2) No active-route state. (3) No decorative geometry around the brand mark. (4) No working command bar. | `components/layout/site-header-v2.tsx`, `mobile-bottom-nav.tsx`, `app/(marketing)/layout.tsx` | Rebuild header from scratch as a sticky command bar with signal brand language, integrated search, active route marker, decorative orbital geometry. Rebuild mobile top bar + bottom nav as touch-first control surfaces. Rebuild footer. | NOT STARTED |
| HOME | Command Center composition: large brand-language hero with editorial typography + brand glyph as visual anchor (not just text), signature Radar instrument that owns the viewport, Tool of the Week as editorial feature with new card anatomy, horizontal Podium with 3 distinct tool cards, journey strip with 3 steps, ivory decision band, decorative brand geometry (dual waves, orbital arcs). | 50/50 split: left = text hero (Fraunces italic H1) + 2 CTAs + journey strip; right = rectangular Radar panel (480px) with empty state. No Tool of the Week visible above fold. No Podium visible above fold. No brand glyph / visual anchor. No decorative geometry. | (1) Hero composition is text-only, no brand visual anchor. (2) Radar is a small side panel, not a signature instrument. (3) No editorial feature above the fold. (4) No Podium / horizontal composition. (5) No decorative brand language. | `app/(marketing)/page.tsx` → `VibeHomeV2` + `MobileHeroSolar` + `HomeRadarPreview` + `MobileSpotlight` | Rebuild Home architecture: single dominant hero column with brand glyph as visual anchor, signature Radar as full-width circular instrument, editorial feature cards, horizontal Podium, decorative geometry, working mobile flow. | NOT STARTED |
| ARCHIVE / CATALOG | Editorial catalog: large ANTON H1 with brand kicker, search as a prominent input with keyboard hint, statistics band, horizontal objective territories with arrows, new tool-card anatomy (image, score badge, level, save, compare, expand), comparison tray as a sticky bottom drawer, mobile as a vertical scroll with stacked cards. | 50/50 split: left = ANTON H1 + subtitle; right = search + meta. Below: 4-column category grid + 4-column "Tool pronti da valutare" grid. No tool card visible above fold (after category map). No comparison tray. | (1) H1 dominates left side, no right-side meta column. (2) Category grid is 4-column, not 2-column with hero. (3) No tool cards above fold. (4) No comparison tray. (5) No mobile-first card anatomy. | `app/(marketing)/archivio/page.tsx` → `FloatingCatalogView` + `mobile-catalog-view.tsx` + `canonical-tool-card.tsx` | Rebuild catalog composition: new H1 + meta + stats layout, new tool-card anatomy with score/level/save/compare inline, new comparison tray, new mobile vertical scroll with stacked cards. | NOT STARTED |
| TOOL DETAIL | Editorial detail page: identity hero with brand glyph, large name, breadcrumb, score panel (large 9.x/10) with editorial metrics, action buttons, tabbed section (overview / editoriale / fonti / alternative), alternative cards, mobile as vertical scroll. | 2-column: left = breadcrumb + 3 pills + ANTON name + body + 3 mini-sections + nota editoriale; right = score panel + cream "Profilo rapido" card + Categoria + Punti forti. No tabs. No alternative cards above fold. | (1) Right column has 4 stacked cards, not a single integrated score panel + actions. (2) No tabbed section. (3) No alternative cards. (4) No brand glyph. | `app/(marketing)/toools/[slug]/page.tsx` | Rebuild detail composition: identity hero with brand glyph, integrated score panel + actions, tabbed content, alternative cards grid, vertical mobile flow. | NOT STARTED |
| FULL RADAR | Large signature instrument: full-width circular Radar with real signal nodes at even clock positions, central disc with brand mark, scan + lock state animations, period + view controls, ranking side panel, table view. | Massive ANTON H1 ("RADAR") + period/view toggles + a small (~480px) empty concentric circle at the bottom of the viewport, with no real signal nodes, no central disc, no ranking side panel, no table view visible above fold. | (1) Radar is a tiny empty concentric circle at bottom, not a full-width signature instrument. (2) No real signal nodes. (3) No central disc with brand mark. (4) No ranking side panel. (5) No table view. | `app/(marketing)/radar/page.tsx` → `DesktopVibeRadar` + `desktop-radar-nodes.tsx` | Rebuild Radar: full-width circular instrument with real signal nodes (or honest empty state inside the instrument), central disc, scan/lock animations, ranking side panel, table view. | NOT STARTED |
| COMPARE | Decision workspace: winner panel, candidate strip (3-4 tool cards), decision matrix with semantic highlighting, action bar, mobile as vertical decision flow. | Massive ANTON H1 + 3 numbered steps + a small empty card at the bottom. No winner panel. No candidate strip. No decision matrix. | (1) No winner panel. (2) No candidate strip. (3) No decision matrix. (4) No action bar. | `app/(marketing)/compare/page.tsx` → `tool-battle-page.tsx` | Rebuild Compare: winner panel, candidate strip, decision matrix, action bar, mobile decision flow. | NOT STARTED |
| SAVED / SHORTLIST | Saved library: metrics (N tool salvati), tabs (Tutti / Confronto / Recenti), saved items as cards, comparison-ready state, empty state with onboarding, community suggestion panel, mobile library. | Single editorial h2 + 1 status pill + 3 quick-start chips + "DA PROVARE PER INIZIARE" yellow accent. No metrics. No tabs. No saved items above fold. | (1) No metrics. (2) No tabs. (3) No saved items. (4) No community suggestion. | `app/(marketing)/shortlist/page.tsx` → `mobile-shortlist-board.tsx` | Rebuild Saved: metrics, tabs, items, comparison-ready, empty state, community panel, mobile library. | NOT STARTED |
| METODO | Method page: large H1, 3 numbered steps, dark decision band, footer. | ANTON H1 + body + 3-step layout. Mostly text-driven. | (1) Limited composition. (2) No dark band. | `app/(marketing)/metodo/page.tsx` | Method is OK as-is (compact, not a priority route). | DEFERRED |
| COLLECTIONS | Editorial collection index: large ANTON H1, curated grid with cover images, kicker pills. | Already editorial with cover images. | Minor — already close to target. | `app/(marketing)/collections/page.tsx` | Minor alignment. | DEFERRED |
| COLLECTION DETAIL | Editorial collection detail: cover image, kicker, large title, rationale, included tools with role/note, alternative collections, mobile. | Already editorial. | Minor — already close to target. | `app/(marketing)/collections/[slug]/page.tsx` | Minor alignment. | DEFERRED |
| ACCOUNT | Auth surface. | Clean. | OK. | `app/(marketing)/account/page.tsx` | No change. | DEFERRED |
| COMMUNITY / SHOP / ABOUT / POSTS / LEGAL | Secondary routes. | Not in scope. | N/A. | N/A | Defer. | DEFERRED |

## Decorative brand system (must be used meaningfully)

The logo and brand mark provide reusable primitives:

- Dual waves
- Signal traces
- Orbital arcs
- Nodes (with states: idle / pulse / scan / lock)
- Scan lines
- Pulse marks
- Connecting paths

These must appear as **structural elements** in the new architecture,
not as random decoration. Example: the Radar's orbital geometry is
built from these primitives. The Home brand glyph anchors the hero.
The command bar's active-route marker uses a pulse mark.

## Motion (must be visible in running app)

- Radar scan line sweeps on a loop
- Node acquisition: idle → pulse → solid (lock)
- Command-bar active route: pulse on the active icon
- Filter selection: scale + color shift
- Promoted card: subtle elevation lift
- Save success: pulse + check mark
- Comparison winner: scale + cyan ring
- Podium entrance: staggered fade-in

All motion must respect `prefers-reduced-motion`.

## Visible-delta rule (binding for completion)

Each priority route must contain **at least 3 major visible
architectural changes**. A major change is one of:

- Different section composition
- Different column/grid architecture
- Rebuilt component anatomy
- New hierarchy and proportions
- Different mobile flow
- New signature instrument
- Replaced navigation architecture

Examples that **do not count**: font swap, border color, opacity,
glow, padding, H1 color, pulse, contrast fix, empty-state
sentence. These are cosmetic.

## Reference implementation rule (binding)

The definitive mockups are **implementation specifications**.
MATCHED means the rendered result reproduces composition, hierarchy,
proportions, visual rhythm, component anatomy, decorative language,
and responsive translation. Text and real data may differ; layout
and visual logic may not be ignored.
