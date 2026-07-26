# Final visual closure — 2026-07-26

## Scope

Browser QA covers the nine release routes:

1. Home
2. Archive
3. Tool detail
4. Radar
5. Compare
6. Saved
7. Collections
8. Collection detail
9. Account

The final local matrix contains one accepted screenshot per route at:

- 1440 × 1000
- 1280 × 800
- 1024 × 768
- 768 × 1024
- 430 × 932
- 390 × 844
- 375 × 667

All 63 final captures were taken from the optimized Next.js production build.
Every measured viewport had zero horizontal overflow. The canonical five-item
bottom navigation was visible below 1280px on every marketing route, with a
12px label floor and no label collision at 375px.

## Combined visual review

- [`qa/comparison-desktop-1440.png`](qa/comparison-desktop-1440.png) places the
  production baseline and final local Home, Radar, Collection Detail and
  Account states side by side.
- [`qa/comparison-mobile-390.png`](qa/comparison-mobile-390.png) repeats the
  same comparison at the narrow mobile viewport.

## Runtime states

- Radar uses only the Product Hunt feed. When the local production runtime has
  no Product Hunt configuration, the captured state is the explicit paused
  state; no signals, votes or rankings are fabricated.
- Collection screenshots use the repository's existing local collection
  records solely to exercise the public collection layouts during visual QA.
- Account screenshots exercise the real signed-out and unavailable-auth
  states; no authentication result is simulated.

## Validation

- `bun run check:styles`: passed
- `bun run typecheck`: passed
- `bun run lint`: passed
- Focused UI, route, collection, typography and ownership tests: 79 passed
- Full Vitest suite: 984 passed, 12 skipped, 22 pre-existing legacy-contract
  failures across four files (17 missing QueryClient test harness, three
  retired Home B40 expectations, one npm-only runtime invocation and one
  retired catalog sponsor-order expectation)
- `next build`: passed
- `bun run build:cloudflare`: passed, including the mandatory OpenNext worker
  manifest patch
- Browser smoke: no runtime errors; command palette opens the direct tool route
  and closes with Escape

The only browser warning left is the upstream `THREE.Clock` deprecation emitted
by the existing Three.js stack. It does not affect rendering or interaction.
