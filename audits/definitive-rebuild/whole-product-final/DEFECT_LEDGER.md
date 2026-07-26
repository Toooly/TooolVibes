# Defect and closure ledger

## Closed in this reconstruction

| Area | Defect | Closure |
| --- | --- | --- |
| Global shell | desktop search was decorative | bound to the real command palette |
| Global shell | mobile search had no product action | opens the command palette |
| Global shell | sound/music controls did not expose reliable state changes | functional toggles with accessible labels |
| Mobile navigation | inconsistent order and non-canonical destinations | Home, Catalogo, Radar, Salvati, Confronto |
| Fixed surfaces | bottom navigation remained visible under search | overlay suppression and entrance-animation cancellation |
| Hydration | page transition could produce server/client entrance divergence | initial transition disabled on hydration |
| Home | duplicated/ad-hoc score logic and simulated score bars | canonical editorial score and factual winner facts |
| Archive | URL query/group/level were not restored into the client owner | complete initial-state binding |
| Archive/tablet | filter chips could shrink or clip | non-shrinking 44px controls and controlled wrapping |
| Compare | battle score and editorial score were visually conflated | both retain their own explicit scale |
| Saved | suggestion form competed with the primary empty/populated state | collapsed native disclosure |
| Collections | generic cards were too tall inside collection slots | compact collection card variant |
| Account | wide layout lacked decision context | functional form plus contextual desktop split |
| Typography | metadata and generated labels fell below the 12px floor | token and local owner corrections |
| Intro | cinematic could mount outside Home | route-scoped mount contract |
| Cloudflare runtime | full minification broke the generated dynamic middleware manifest loader | deterministic OpenNext post-build compatibility patch with fail-loud guard |
| Collection Detail | on-demand static fallback produced `DYNAMIC_SERVER_USAGE` and a production 500 | explicit dynamic route rendering |
| Production capacity | automatic prefetch from archive cards and fixed navigation exhausted Worker request limits | prefetch disabled on high-fan-out SSR links; direct clicks unchanged |
| Visual evidence | full-page mobile capture cropped the emulated viewport and mimicked a UI overflow | evidence recaptured as faithful viewport screenshots and re-inspected |

## Remaining non-product conditions

- The full unit suite has 24 inherited expectation failures across seven legacy
  groups. The final run collected 1,014 tests and introduced no new failure
  group; one prior typography-floor failure is now fixed. Details are in
  `VALIDATION_LEDGER.md`.
- Wrangler reports one duplicate-object-key warning inside generated OpenNext
  bundle code. It is non-blocking and absent from application source.
- Chromium reports the existing `THREE.Clock` deprecation warning and zero
  console errors.
- The custom domain `tooolvibes.eu` is owned by a different Cloudflare
  zone/account context and is not currently routed to the verified Worker URL.
  This is external release configuration, not an unresolved product/UI defect.

No unresolved defect was found in the reconstructed public journey during the
final responsive, interaction, keyboard or visual passes.
