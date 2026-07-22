# Cascade ownership and token foundation

Status: release contract (B20 / DS-301 / DS-302)

## Canonical cascade

`styles/release-entry.ts` is the only TypeScript entrypoint allowed to import global styles. Its order is intentional:

1. `app/globals.css`
   1. Tailwind, animation and shadcn foundations
   2. `styles/tokens.css`
   3. shared foundations: gamification, depth and account
   4. Figma implementation scope
   5. legacy global rules
2. `styles/vibes-3d-maestoso.css`
3. `styles/shell.css`
4. route owners: `home.css`, `catalog.css`, `compare.css`, `radar.css`, `tool-detail.css`
5. `styles/public-routes.css`

The Maestoso sheet remains before all canonical owners because the Home orbital geometry still consumes it. It must not receive ordinary UI additions. The shell and route sheets are the final owners; the former cross-route repaint sheet was removed in the definitive UI rebuild.

## Ownership map

| File | Owner | Consumers | Release rule |
|---|---|---|---|
| `styles/tokens.css` | Design system | every surface | only canonical token definitions; no component selectors |
| `app/globals.css` | Frontend platform | application shell and legacy routes | frozen for new component styling; blocker fixes require an owner comment |
| `styles/home.css` | Home discovery | `/` active V2 hero | home selectors only |
| `styles/catalog.css` | Directory | `/archivio` active catalog facade | catalog selectors only |
| `styles/gamification.css` | Engagement | mission/reward surfaces | gamification selectors only |
| `styles/radar.css` | Radar | `/radar` | Radar selectors only |
| `styles/compare.css` | Decision flow | `/compare` | Compare selectors only |
| `styles/depth-scene.css` | Experience layer | global depth scene | capability-gated effects only |
| `styles/account.css` | Account | account panel/routes | Account selectors only |
| `styles/figma-implementation.css` | Design system migration | `.tv-figma-theme`, design-system preview | scoped implementation; token definitions forbidden |
| `styles/vibes-3d-maestoso.css` | Orbital geometry legacy | Home orbit and dormant 3D components | frozen; loaded before canonical owners; no ordinary UI |
| `styles/shell.css` | Public shell | header, footer, mobile navigation, recovery states | final shared chrome owner |
| `styles/tool-detail.css` | Tool decision page | `/toools/[slug]` | tool-detail selectors only |
| `styles/public-routes.css` | Public route foundation | shared editorial and premium primitives | final shared surface contract; no feature-specific layouts |

## Change policy

- New UI styles live next to their owned component or in the owning feature sheet.
- Do not append generic selectors to `app/globals.css` or the frozen Maestoso sheet.
- New `!important` declarations are blocked by `npm run check:styles`; reduce existing debt instead.
- A new hardcoded color, spacing, radius, elevation, motion or z-index is not accepted in a core component. Add or reuse a semantic `--tv-*` token first.
- Token removal requires repository-wide usage proof and visual snapshots at supported viewports.
- Cascade-order changes require build, E2E smoke and visual matrix review.

## Token adoption matrix

| Family | Canonical tokens | Legacy compatibility | Migration owner |
|---|---|---|---|
| Color | `--tv-bg-*`, `--tv-surface-*`, `--tv-ink-*`, `--tv-accent-*`, `--tv-status-*` | `--background`, `--surface`, `--foreground`, feature palettes | B23-B24, then vertical slices |
| Typography | `--tv-font-*`, `--tv-text-*` | route-specific font families and arbitrary sizes | B21 |
| Spacing | `--tv-space-*` | Tailwind/arbitrary values | component owner during adoption |
| Radius | `--tv-radius-*` | `--radius-*`, arbitrary rounded values | B23-B24 |
| Elevation | `--tv-elevation-*` | route-local shadows/glows | B23-B24 |
| Motion | `--tv-motion-*`, `--tv-ease-*` | local durations/easings | B26/B63 |
| Layer | `--tv-z-*` | `--z-*`, numeric utilities | B22 |

## Contrast contract

The automated contract checks these release-safe pairs:

| Foreground | Background | Minimum |
|---|---|---:|
| `--tv-ink-primary` | `--tv-bg-base` | 4.5:1 |
| `--tv-ink-secondary` | `--tv-bg-base` | 4.5:1 |
| `--tv-ink-muted-aa` | `--tv-bg-base` | 4.5:1 |
| white | `--tv-accent-aa` | 4.5:1 |
| `--tv-focus-ring` | `--tv-bg-base` | 3:1 |

`--tv-ink-muted` and `--tv-accent-primary` remain compatibility values and are not approved for new small operational text. B62 owns complete route-level contrast migration.
