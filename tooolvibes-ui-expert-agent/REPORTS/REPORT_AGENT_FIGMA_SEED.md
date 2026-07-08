# REPORT_AGENT_FIGMA_SEED

Seed iniziale per creare il file Figma TooolVibes UI System.

## Pages

1. `00 Cover and Principles`
2. `01 Tokens`
3. `02 Primitives`
4. `03 Discovery System`
5. `04 Tool Detail and Trust`
6. `05 Compare and Shortlist`
7. `06 Editorial and Monetization`
8. `99 Reference - Experience and 3D`

## Token draft

| Token group | Suggested names |
|---|---|
| Color surface | `surface/base`, `surface/raised`, `surface/inverse`, `surface/tint` |
| Color text | `text/strong`, `text/body`, `text/muted`, `text/inverse` |
| Color accent | `accent/primary`, `accent/primary-hover`, `accent/subtle` |
| Color status | `status/success`, `status/warning`, `status/danger`, `status/info` |
| Radius | `radius/sm`, `radius/md`, `radius/lg`, `radius/pill` |
| Shadow | `shadow/none`, `shadow/sm`, `shadow/md`, `shadow/focus` |
| Type | `display/page`, `title/section`, `title/card`, `body/default`, `label`, `caption` |
| Space | `space/1` to `space/8`, plus layout gutters mobile/desktop |

## Component seed

- `Button`: primary, secondary, ghost, destructive; sizes default/touch/icon.
- `Input`: default, search, error, disabled, with icon.
- `Badge`: neutral, source, affiliate, sponsored, verified, warning.
- `ToolCard`: default, compact, scan/mobile, saved, compared.
- `TrustBlock`: source, reviewed date, reviewer, affiliate disclosure.
- `CompareBoard`: desktop table, mobile two-tool cards, empty state.
- `Header`: desktop nav, mobile menu, search overlay.
- `MobileBottomNav`: default, active, badge.
- `NativePlacement`: sponsor/partner with disclosure.

## Naming rules

- Component variants must map to code variants where stable.
- One-off 3D visuals go to `Reference`, not tokens.
- Avoid token names based on color mood like `neon`, `magic`, `glow` unless kept in reference-only layer.
