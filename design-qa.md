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

final result: ready for Cloudflare deploy

