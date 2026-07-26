# TooolVibes definitive whole-product route inventory

Generated mechanically from `app/**/page.tsx`, the public sitemap, and the
global shell destinations on 2026-07-26.

## Primary decision journey

| Status | Route | Current owner | Required final coverage |
| --- | --- | --- | --- |
| [x] | `/` | `components/home/definitive-home.tsx` | Home, Radar preview, Tool of the Week, podium, method |
| [x] | `/archivio` | `components/archive/definitive-archive.tsx` | Catalog, search, filters, promoted tools, result list, compare tray |
| [x] | `/toools/[slug]` | `components/tool-detail-final/tool-detail-final-page.tsx` | Identity, score, verdict, intelligence, signal, alternatives |
| [x] | `/radar` | `components/radar/radar-view-switch.tsx` | Live Product Hunt binding and factual unavailable state |
| [x] | `/compare` | `components/tools/tool-battle-view.tsx` | Empty, one-candidate, ready, maximum, removal and mobile navigation |
| [x] | `/shortlist` | `components/tools/mobile-shortlist-board.tsx` | Empty and populated Saved library, compare activation, suggestions |
| [x] | `/collections` | `components/collections/mobile-collections-view.tsx` | Collections index, featured issue, standard collection cards |
| [x] | `/collections/[slug]` | `app/(marketing)/collections/[slug]/page.tsx` | Collection rationale, slots, premium/locked states, next step |
| [x] | `/account` | `components/account/account-gate.tsx` | Guest/auth/unavailable states and authenticated workspace |

## Public editorial and company routes

| Status | Route | Purpose |
| --- | --- | --- |
| [x] | `/posts` | Editorial index |
| [x] | `/posts/[slug]` | Editorial article detail |
| [x] | `/tags` | Tag and category discovery |
| [x] | `/metodo` | Product method |
| [x] | `/chi-siamo` | About |
| [x] | `/community` | Community |
| [x] | `/shop` | Shop |
| [x] | `/affiliati` | Affiliate programme |
| [x] | `/cookie` | Cookie policy |
| [x] | `/privacy` | Privacy policy |
| [x] | `/termini` | Terms |

## Redirects and entry states

| Status | Route | Contract |
| --- | --- | --- |
| [x] | `/wishlist` | Permanent product alias to `/shortlist` |
| [x] | `/product-hunt` | Permanent product alias to `/radar` |
| [x] | `/auth/callback` | Authentication callback feedback |
| [x] | `not-found` | Product-family 404 state |
| [x] | `error` / `global-error` | Recoverable and fatal error states |
| [x] | gated `/` | Coming-soon page and access dialog when public gate is enabled |

## Global user-visible surfaces

| Status | Surface | Current owner |
| --- | --- | --- |
| [x] | Desktop Command Bar | `components/layout/command-bar.tsx` |
| [x] | Mobile Top Bar | `components/layout/mobile-top-bar.tsx` |
| [x] | Mobile Bottom Navigation | `components/layout/mobile-bottom-nav.tsx` |
| [x] | Footer | `components/layout/site-footer-v2.tsx` |
| [x] | Search / command palette | `components/app/global-command-palette.tsx` |
| [x] | Compare tray | `components/archive/archive-v4-compare-tray.tsx` |
| [x] | Dialogs, drawers and sheets | `components/ui/dialog.tsx`, `drawer.tsx`, `sheet.tsx` |
| [x] | Toast and success feedback | `components/ui/sonner.tsx` |
| [x] | Route transition and loading | route `loading.tsx` files and `components/app/route-transition-loader.tsx` |
| [x] | Intro / welcome state | `components/3d-maestoso/intro-cinematic.tsx` |
| [x] | Empty, unavailable and failure grammar | Route owners plus `components/app/error-recovery-view.tsx` |

## Dynamic route families

- Tool detail is generated from the canonical public tool source.
- Collection detail is generated from the canonical bundled collection source.
- Editorial detail is generated from the published article source.
- Dynamic variants are validated with representative records plus their
  unavailable/not-found paths; no fabricated records are introduced.

## Intentionally excluded from public UI closure

- `/admin/**`: authenticated operator interface, not a public user-facing route.
- `/dev/**`: development-only design-system and error fixtures.
- `/(internal)/visual-lab/**`: untracked prototype material; it is not a
  production owner and will not be deployed.
- `/api/**`, `robots.txt`, and `sitemap.xml`: contracts are validated but they
  are not visual routes.
