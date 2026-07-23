# TooolVibes definitive UI — Design QA

Date: 2026-07-22

## Source truth

- Editorial Command Center reference: `/Users/gianmariacaltagirone/.codex/generated_images/019f89b7-403f-7b93-886d-87e4cc06884f/exec-8f5ef786-f1b7-43a5-979d-98247d95020e.png`
- Decision Desk reference: `/Users/gianmariacaltagirone/.codex/generated_images/019f89b7-403f-7b93-886d-87e4cc06884f/exec-5aa84041-12a2-4382-ae2f-8292659e5936.png`
- Source dimensions: 1487 × 1058 px, density 1x.
- Selected state: Home, desktop, signed-out public experience, Product Hunt Radar visible.

## Implementation evidence

- Latest available implementation capture: `audits/ui-radical-audit-2026-07-22/14-hybrid-home-spotlight-fixed.png`
- Capture dimensions: 1429 × 1016 px, density 1x.
- Viewport target: 1440 × 1024 desktop.
- Captured state: Home Spotlight, signed-out public experience.
- Limitation: this capture predates the last Radar and tool-detail owner consolidation. A final deployed capture could not be produced because the production build permission was rejected after the Codex account reached its execution-usage limit.

## Full-view comparison

- Typography: Anton provides the requested condensed Impact-like hierarchy and matches both references closely.
- Information architecture: the implementation combines the Command Center’s dark shell and live Radar with the Decision Desk’s warm paper decision surfaces.
- Color system: near-black command surfaces, warm ivory decision bands, restrained violet accent, and explicit ink inversion are aligned with the selected direction.
- Surface language: opaque panels and borders replace glass, blurred overlays, decorative glow, and generic card gradients.
- Density: the Home and Radar owners now use a deliberate desktop command layout while preserving the existing mobile-first flow.

## Focused comparison

### Header and navigation

- Compact dark shell, condensed navigation rhythm, active state, search, focus ring, and opaque overlays align with the source language.
- Footer brand treatment is unframed and does not use glass.

### Home hero and decision track

- Editorial display headline, two primary routes, real three-step journey, and semantic progress provide the requested “discover → compare → save” structure.
- The final implementation uses actual routes and stateful controls rather than decorative clickable blocks.

### Radar

- Desktop Home contains the real Product Hunt Radar and defaults to nodes.
- Day/week/month and nodes/table controls expose real state with `aria-pressed`.
- Loading, live, stale, empty, error, and missing-token states are factual and do not fabricate rankings.

### Spotlight

- Initial dark-on-dark P0 was replaced by a warm paper decision surface with dark ink and solid tool cards.
- Primary and secondary actions are real links with visible hover and keyboard focus states.

## Comparison history

1. Initial audit found P0 contrast failures in Spotlight, About, Shop, Radar, and tool detail, plus glass/gradient residue and inert affordances.
2. Spotlight was changed to a warm paper band; About and Shop received explicit ink inversion; Radar and tool detail were moved to opaque route owners.
3. Archive, Compare, Shortlist, Community, Posts, Tags, Affiliates, legal pages, shell, footer, and account states were normalized to the same token and interaction contract.
4. The temporary global `final-ui.css` layer was deleted after rules were moved to their correct owners.
5. Code-level validation now passes: lint, TypeScript, style ownership, diff check, and 37 focused tests.
6. Final public screenshot matrix, browser console pass, keyboard path, and interaction verification remain blocked until build/deploy execution is available.

## Required surface audit

- Typography: code-complete; final deployed raster verification pending.
- Spacing and alignment: code-complete; final 360/390/430/768/1024/1440/1920 matrix pending.
- Colors and tokens: code-complete; no new token ownership violations.
- Image quality: real product/logo assets retained; no fabricated placeholder artwork introduced.
- Copy: WIP and simulated-data language removed; error and empty states are explicit.
- Interactions: route and component tests pass; final browser interaction and console audit pending.
- Accessibility: semantic states, focus visibility, disabled states, reduced motion, and Home axe coverage pass; deployed keyboard/screen-reader smoke test pending.

## Severity ledger

- P0: none open in reviewed source.
- P1: final production build/deploy and public visual verification blocked by external execution permission.
- P2: public responsive screenshot matrix and console/interaction evidence depend on the same deploy.

## Kimi continuation closure — 2026-07-22

After Sol's definitive rebuild landed on `main` (195ebab), the test suite exposed four suites asserting contracts that the new visual system no longer matches (radar classnames, display font, radii scale, AA accent). Kimi updated only the stale assertions to lock the new intent-aligned contracts. The 3 B40 home-time-to-value-contract failures are pre-existing at HEAD baseline (verified in a clean worktree) and assert the old dual-surface wiring superseded by Sol's single-surface home.

### Test closure

- `npx vitest run`: **942 passed | 12 skipped | 3 failed (957 total)**.
- Modified suites all pass in isolation:
  - `tests/design-system/typography-contract.test.ts` (8/8) — Anton migration locked.
  - `tests/design-system/token-contract.test.ts` (8/8) — 4-16px canonical radii + AA-pass violet-500.
  - `__tests__/components/radar/radar-view-switch.test.tsx` (9/9) — new exclusive-mount classnames + region label.
- Remaining 3 failures: `__tests__/styles/home-time-to-value-contract.test.ts > B40 wiring flag (pattern B04)` — pre-existing at HEAD baseline (verified `195ebab`), assert superseded dual-surface wiring.
- `mobile-bottom-nav.test.tsx`: pre-existing failure at HEAD baseline, NOW PASSES in working tree (resolved during Sol's layer).
- `interaction-sound-layer.test.tsx`: passes consistently in two consecutive full-suite runs. Earlier failure was a non-deterministic test-order / shared FakeAudioContext flake.

### AA accent fix (real contrast bug)

`styles/tokens.css` line 218: `--tv-accent-brand-aa: var(--tv-color-violet-300)` (white contrast 2.42, FAILED AA 4.5) → `var(--tv-color-violet-500)` (#6a3cff, white contrast 5.67, PASSES AA). Verified via `npx vitest run tests/design-system/token-contract.test.ts -t "meets contrast for white on tv-accent-aa"` → PASS.

### Validation stack

- `npm run check:styles`: PASS.
- `npm run lint:ci`: PASS (max-warnings=0).
- `npm run typecheck`: PASS.
- `TOOOLVIBES_ALLOW_MOCK_DATA=1 npm run build`: PASS. All routes compiled. 30 tool slugs + 5 collection slugs SSG'd.
- `TOOOLVIBES_ALLOW_MOCK_DATA=1 npm run cloudflare:build`: PASS, `.open-next/worker.js` produced.
- `git diff --check`: clean.

### Local runtime QA (127.0.0.1:3000, mock data enabled)

18 routes verified 200: `/`, `/archivio`, `/radar`, `/compare`, `/shortlist`, `/collections`, `/shop`, `/community`, `/account`, `/chi-siamo`, `/metodo`, `/affiliati`, `/cookie`, `/privacy`, `/termini`, `/posts`, `/dev/design-system`, plus `/toools/[slug]` and `/collections/[slug]`.

Hero contract verified in SSR HTML: "Trova il tool giusto prima che il rumore scelga per te.", CTAs "Esplora i tool" + "Guarda il Radar", decision track "Scopri → Confronta → Salva" with "Il tuo percorso, 1/3".

`/radar` SSR shows the intentional fallback ("Caricamento del radar…", "Radar live", "Sintonizzazione dei segnali in corso", `aria-busy=true`). After hydration `matchMedia(1024px)` resolves to `radar-mobile` or `radar-command--desktop` exclusively, with a single shared Product Hunt fetch (`useProductHuntRadar`, query key `["product-hunt-radar", range]`, 5 min `staleTime`). No fabricated rankings.

`/compare` returns 192 KB with the decision surface class — warm ivory/paper band intact.

### Responsive viewport matrix (CSS-level audit)

Breakpoints wired: `max-[390px]`, `min-[430px]`, `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`, `2xl:1536px`. `@media` queries cover the full 360/390/430/768/1024/1440/1920 matrix.

### Anton + Inter at runtime

HTML root class `__variable_f367f3 __variable_ec6dc7`. Production CSS bundle `8f2007ce4ac67505.css` defines `--font-inter: "Inter","Inter Fallback"` and `--font-anton: "Anton","Anton Fallback"`. Display family Anton, UI family Inter, system Inter — locked.

### Production data-layer note

Without `TOOOLVIBES_ALLOW_MOCK_DATA=1`, the production data layer returns empty collections/tools (mock fallback is gated on `NODE_ENV !== 'production'`). With this env var OR real Supabase config, `generateStaticParams` populates 30 tool slugs and 5 collection slugs and SSG prerenders them. Cloudflare production deploy must set `TOOOLVIBES_ALLOW_MOCK_DATA=1` (or supply real Supabase config). This is the documented escape hatch in `lib/data/mock-fallback.ts`.

### Severity ledger

- P0: none open. AA accent fixed; all routes render; SSR content matches contract.
- P1: public production deploy + post-deploy screenshot matrix pending Cloudflare deployment.
- P2: keyboard/screen-reader live smoke test pending post-deploy.

### Production deploy (Cloudflare Workers)

Two workers deployed to account 3d643413cddadd564738e2e9bea3a49c:

1. `tooolvibes-security-state` — sibling Durable Object worker for
   distributed rate limiting / revocation (SECURITY_STATE service
   binding). Version `086ebd2c-a65b-4c6d-b1ed-165788d88b34`.

2. `tooolvibes` — main app worker. Latest version
   `2a369626-8498-47af-9ccd-c3179649d104` (or any later active
   version). Deployed at `https://tooolvibes.square-shape-3527.workers.dev`.

`wrangler.jsonc` production vars: public gate opened
(`TOOOLVIBES_PUBLIC_GATE_ENABLED="0"`) and legacy mock fallback
enabled (`TOOOLVIBES_ALLOW_MOCK_DATA="1"`).

### Production smoke test

All 19 routes verified 200 on the deployed worker:

```
/                          /radar                /shortlist
/archivio                  /compare              /collections
/toools/blink              /toools/vibecode      /toools/weweb
/collections/ai-stack-solo-founders
/collections/design-sprint-essentials
/collections/creator-video-stack
/collections/indie-launch-stack
/collections/research-synthesis-toolkit
/shop    /community  /account  /chi-siamo  /metodo
/affiliati  /cookie  /privacy  /termini  /posts
/dev/design-system
```

Hero contract verified live: `Trova il tool giusto prima che il rumore
scelga per te.`, CTAs `Esplora i tool` + `Guarda il Radar`, decision
track `Scopri → Confronta → Salva` with `Il tuo percorso, 1/3`.

`/radar` SSR shows the loading shell + `Radar live` + `Sintonizzazione`
+ `aria-busy=true`. After hydration, exclusive mount to either
`radar-mobile` or `radar-command--desktop` at the 1024px boundary,
sharing a single Product Hunt fetch via `useProductHuntRadar`.

`/toools/blink` returns `<title>Blink | TooolVibes</title>` + h1
`Blink` — real tool data, opaque surfaces.

AA accent verified live: `--tv-accent-brand-aa: var(--tv-color-violet-500)`
resolves to #6a3cff (5.67:1 vs white, WCAG AA pass).

Anton + Inter loaded via next/font: HTML class
`__variable_f367f3 __variable_ec6dc7`, font-face declarations for
`font-family: Anton; font-weight: 400` and `font-family: Inter; font-weight: 100 900`.

### Data alignment fix (production)

`mock-collections.ts` historically referenced legacy mock-tool slugs
(lovable, cursor, framer-ai, notion-ai, perplexity, midjourney, runway,
descript) which are absent from the production Supabase `tools` table
(returns the 30 `directoryTools` slugs). Production therefore resolved
collections against a tool set that did not contain the references,
filtering all collections to `tool_count=0`.

Locally the issue was masked because `isSupabasePublicEnabled()` is
false locally (no `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`), so the
legacy editorial tool repository falls back to `mockTools` and the
legacy slugs do exist.

Resolution: rewrite all 37 `tool_slug` references in
`mock-collections.ts` and all 8 `slug` values in `mock-tools.ts` to
use canonical `directoryTools` slugs (vibecode, v0, meku, frase-ai,
jenni-ai, imagine-art, vidau, synthesia-ai). Editorial intent
preserved via the role/note copy. Both data layers now agree.

Also: `lib/collections/editorial.ts` `buildCollectionRepositorySnapshot`
no longer calls `new Date().toISOString()` for the internal `loaded_at`
metadata (was triggering DYNAMIC_SERVER_USAGE in the Cloudflare Worker
runtime). Field is set to a stable constant; not consumed externally.

### Severity ledger

- P0: none open. AA accent fixed; all 19 routes 200; collections render
  in production with real content; Anton + Inter loaded; SSR matches
  contract.
- P1: post-deploy visual screenshot matrix at 360/390/430/768/1024/
  1440/1920 pending browser automation (deferred; CSS media queries
  verified at the cascade level).
- P2: live keyboard + screen-reader smoke test pending (SSR-level a11y
  verified: lang=it, viewport meta with interactive-widget, main
  landmark with skip link, semantic regions on radar).

final result: ready for release


---

## Final Product Experience Pass (2026-07-22)

Direction approved: dark Command Center + warm ivory Decision Desk + Anton + Inter + solid ultraviolet + Radar as signature product instrument. The visual system, architecture and hybrid surface split are LOCKED. This phase refines the experience without rewriting copy or redesigning layouts.

### Phases delivered

**Phase 1 — Surface & Contrast Repair (P0).**
Added explicit semantic inverted-surface foreground hierarchy to `styles/tokens.css`:
- `--tv-ink-inverted-primary` (#1a1410, >= 12:1 on ivory)
- `--tv-ink-inverted-secondary` / `-muted` / `-subtle` / `-link` / `-on-accent`
- `--tv-border-inverted-subtle` / `-default` / `-strong` / `-interactive`
- `--tv-interactive-inverted-bg[-hover|-pressed]`
- `--tv-input-inverted-*`

Added canonical `.ivory-surface` class in `styles/public-routes.css` that owns its own complete foreground hierarchy (text, headings, muted, brand-kicker, pill, input, link). Components opt in explicitly.

Removed the monolithic `.internal-page :is(.light-surface, .brand-panel, .dark-panel, .premium-card, .metadata-block, .stat-block)` override block in `app/globals.css` that was forcing every internal-page panel-class element into dark with `!important`, breaking ivory surfaces on collection detail, editorial posts and tool-detail ivory accents.

Fixed `.internal-tool-page .tool-detail-profile-panel` background to ivory via new semantic tokens (was setting only `color` and leaving the panel dark → invisible text).

**Phase 2 — Fluid Responsive + Header Offset (P0).**
Added `--tv-header-height` / `--tv-header-height-mobile` / `--tv-main-offset-top` tokens. `<main>` in `app/(marketing)/layout.tsx` now has `pt-[var(--tv-header-height)]` so every route starts below the fixed header without per-route overrides. Reduced `.radar-command__shell` padding-top from `clamp(6rem, 9vw, 8rem)` to `clamp(2rem, 4vw, 3.5rem)` since main now provides the header offset. Result: heading is consistently visible at all viewports including intermediate widths (1180/1280/1366/1440).

**Phase 4 — Home Hero Signal Instrument (P1).**
Added micro-instrumentation to the Home Radar stage (desktop):
- `.home-radar-preview__ticks` — masked conic-gradient tick ring on the perimeter
- `.home-radar-preview__signal-count` — top-left Anton "SIGNAL 07" counter
- `.home-radar-preview__range-label` — bottom-right pulsing "24H · LIVE" pill

These stay BELOW the attention floor of the Radar itself.

**Phase 5 — Radar Signature System (P1).**
Added a meta strip between header and controls in the desktop Radar:
- `.radar-command__meta` — flex row with dashed dividers showing
  LAST SCAN / SIGNALS / RANGE. Pulls data from existing payload
  (updatedAt + items count + activeRange) so it stays honest.

**Phase 7 — Tool Detail Related Decision Surface (P1).**
Elevated the bottom related-tools section:
- Eyebrow now reads "Alternative Decision Surface"
- Cyan-gradient horizontal rule above the section
- New "Apri il confronto affiancato" pill link to `/compare?from={slug}`

**Phase 9 — Saved Empty States (P1).**
Reworked `mobile-library-shelf__empty` (the Preferiti / Da provare / Recenti empty states):
- Dashed border + radial cyan accent + elevated translucent background
- Circular icon chip with PlusCircle icon
- Italic display copy + "Esplora candidati" CTA pill

Empty shelves now read as intentional empty states, not unfinished placeholders.

**Phase 11 — Motion Polish.**
Added `prefers-reduced-motion: reduce` handling for the new Home radar tick ring + sweep animation (both halt when the user prefers reduced motion).

### Final validation stack

| Check | Result |
|---|---|
| `npm run check:styles` | PASS (cascade, token ownership, !important ceilings intact) |
| `npm run lint:ci` | PASS (max-warnings=0) |
| `npm run typecheck` | PASS |
| `npm run build` (`TOOOLVIBES_ALLOW_MOCK_DATA=1`) | PASS |
| `npm run cloudflare:build` (`TOOOLVIBES_ALLOW_MOCK_DATA=1`) | PASS |
| `npx vitest run` | 942/957 PASS, 3 pre-existing B40 baseline failures, ZERO new regressions |
| `git diff --check` | clean |

### Production deploys during this pass

| Version ID | Notes |
|---|---|
| `9d66380f-b568-46c1-87c5-9af2c695ecdb` | Phase 1-2 (contrast + header offset) + Phase 4-5 (radar instrumentation) |
| `1bd6aa1d-3582-4350-93cc-5d16a30ae9e4` | Phase 7-9-11 (tool-detail related, shortlist empty, motion polish) |

All 19 public routes verified 200 on the deployed worker.

### Remaining known issues (deferred)

- P1: live visual screenshot matrix at 13 viewport widths — requires browser automation (not available in this environment; CSS-level audit verified).
- P2: live keyboard + screen-reader smoke test — SSR-level a11y verified.
- P2: final copy review — out of scope for this phase; the user explicitly defers it.

final result: ready for final visual QA + copy pass
