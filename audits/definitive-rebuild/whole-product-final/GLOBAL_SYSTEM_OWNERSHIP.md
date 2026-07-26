# Definitive TooolVibes visual system and ownership

## Binding direction

The implementation is derived from the route concepts in `concepts/` and the
existing functional owner trees. Generated concepts are visual references for
composition, hierarchy, density, typography, colour and responsive behaviour;
they are not data or copy sources.

The implementation must never introduce tools, scores, collection slots,
Product Hunt items, account capabilities or decision-memory features that are
not provided by the existing product contracts.

## Visual grammar

| Primitive | Product meaning | Use |
| --- | --- | --- |
| WAVE | movement through the decision journey | section continuity, candidate paths |
| SIGNAL | factual/live state | Radar and data availability |
| TRACE | comparison and chronology | dividers, difference rows, progress |
| ORBIT | discovery field | Radar instrument and focused discovery |
| NODE | selected candidate | active, saved and compared states |
| PULSE | current user/system action | short feedback only |
| SCAN | loading or live acquisition | Radar and search loading |
| LOCK | resolved or unavailable state | final decision, premium and factual pause |

No primitive is decorative filler. Continuous animation is limited to two
elements per viewport and is disabled by reduced-motion preferences.

## Colour and typography lock

- Command Center canvas: canonical opaque near-black surface tokens.
- Decision Desk: canonical warm-ivory inverted surface token.
- Primary action: `--tv-accent-brand` / solid ultraviolet.
- Live or factual system state: `--tv-accent-cyan`.
- Ranking, winner or recognition only: `--tv-accent-gold`.
- Error only: canonical danger tokens.
- Monumental display and navigation emphasis: `--tv-font-family-display`
  (Anton).
- Editorial statements and verdicts: `--tv-font-family-editorial`
  (Fraunces).
- Body, facts, metadata and controls: `--tv-font-family-ui` (Inter).
- Body floor: 14px; control floor: 13px; metadata floor: 12px.
- Touch target floor: 44px.

## Geometry, spacing and motion

- Canonical radii: 4 / 8 / 12 / 14 / 16px; pill only for status or segmented
  controls.
- Canonical spacing is the existing 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 /
  96px scale.
- Solid surfaces take precedence over translucency or blur.
- Motion uses the existing 80 / 120 / 180 / 240 / 360 / 720ms scale and must
  communicate state, selection, scanning or transition.

## Responsive layout bands

| Width | Contract |
| --- | --- |
| 360–429 | narrow mobile, one-column, compact disclosure, safe fixed surfaces |
| 430–767 | wide mobile, more horizontal room, still mobile composition |
| 768–819 | narrow tablet, intentional one-column or hybrid |
| 820–1023 | tablet, controlled two-column where useful |
| 1024–1179 | wide tablet / compact laptop, route-specific hybrid |
| 1180–1279 | compact desktop layout with mobile shell still active |
| 1280+ | full desktop Command Bar and desktop route architecture |

## Fixed-surface contract

1. Page content: `--tv-z-content`
2. Route sticky navigation: `--tv-z-sticky`
3. Desktop/mobile navigation: `--tv-z-nav`
4. Compare tray and overlay backplanes: `--tv-z-overlay`
5. Dialogs and sheets: `--tv-z-modal`
6. Floating controls: `--tv-z-floating`
7. Toasts: `--tv-z-toast`
8. Non-interactive effects: `--tv-z-effects`
9. Skip link only: `--tv-z-skip`

Mobile routes consume `--tv-bottom-nav-total`; routes with comparison consume
`--tv-tray-height`. No route may hard-code a competing fixed bottom offset.

## Owner map

| Surface | Sole visual owner |
| --- | --- |
| Global tokens | `styles/tokens.css` |
| Desktop shell | `components/layout/command-bar.tsx` + `styles/command-bar.css` |
| Mobile top shell | `components/layout/mobile-top-bar.tsx` + `styles/mobile-top-bar.css` |
| Mobile bottom shell | `components/layout/mobile-bottom-nav.tsx` + `styles/mobile-bottom-nav.css` |
| Footer and general public secondary routes | `styles/shell.css` and `styles/public-routes.css` |
| Home | `components/home/definitive-home.tsx` + `styles/definitive-home.css` |
| Archive | `components/archive/definitive-archive.tsx` + `styles/archive-v4.css` |
| Tool Detail | `components/tool-detail-final/**` + `styles/tool-detail-final.css` |
| Radar | `components/radar/**`, `components/desktop/desktop-vibe-radar.tsx` + `styles/radar.css` |
| Compare | `components/tools/tool-battle-view.tsx` and its desktop/mobile owners + `styles/compare.css` |
| Saved | `components/tools/mobile-shortlist-board.tsx` / `shortlist-board.tsx` + route stylesheet |
| Collections index | `components/collections/mobile-collections-view.tsx` + existing collection styles |
| Collection detail | `app/(marketing)/collections/[slug]/page.tsx` + existing collection-detail namespace |
| Account | `components/account/**` + `styles/account.css` |
| Search / overlays | `components/app/global-command-palette.tsx` + shared `components/ui/**` owners |
| Error / not-found | `components/app/error-recovery-view.tsx`, `app/not-found.tsx` + public route styles |

## Visible-copy lock

Broad editorial copy remains unchanged. Allowed changes are limited to factual
unavailable text, accessibility labels, concise interaction labels and
terminology consistency. The canonical navigation vocabulary is:

`Home / Catalogo / Radar / Confronto / Salvati`

The primary journey remains:

`Scopri → Confronta → Salva`

## Concept deviations that are intentional

- Concept-generated scores are ignored; canonical runtime scores win, including
  Blink `8.4`.
- Concept-generated tool or collection names are ignored.
- Concept-generated Product Hunt nodes and metrics are ignored.
- Concept-generated notes, chronology, billing, preference or account features
  are implemented only when an existing contract already supports them.
- The concepts may show fewer results for legibility; the implementation uses
  real progressive disclosure and preserves complete access to the dataset.

