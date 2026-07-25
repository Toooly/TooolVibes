# Tool Detail — Handoff to Visual Implementer

**Status**: TOOL DETAIL CLEAN BASELINE — FROZEN FOR VISUAL MOCKUPS.
**Date**: 2026-07-25
**Source of truth**: this file, plus `audits/definitive-rebuild/tool-detail-clean-reset/`.

---

## Current branch and HEAD

- **Branch**: `main`
- **HEAD**: `1f5081b` (pushed to `origin/main`)
- **Working tree**: clean (only unrelated user-stash artifacts remain untracked; do not touch them)

The next implementation phase must branch from this HEAD.

---

## Final component tree

```
ToolDetailFinalPage                       (server, components/tool-detail-final/tool-detail-final-page.tsx)
├── ToolDetailHeroFinal                   (A. Identity + Action Surface, 7fr)
│   └── ToolDetailActionSurface           (A.2 client, 44×44 Save / Compare / CTA)
├── ToolDetailScoreFinal                  (B. Score Instrument, 5fr)
├── ToolDetailDecisionNavFinal            (D. In-page nav, sticky ≥1024)
├── ToolDetailEditorialFinal              (C. Editorial Rationale, 4 cards 2×2)
├── ToolDetailInformationFinal            (E. Product Information, 8 dt/dd)
├── ToolDetailSignalFinal                 (F. Trend/Signal, honest empty state)
├── ToolDetailAlternativesFinal           (G. Decision Desk)
│   └── AlternativeDecisionCard           (3 cards, ivory surface, .td-final-alt-*)
└── ToolDetailFooterFinal                 (route-level end marker)
```

Owner file paths (all under `components/tool-detail-final/`):
- `tool-detail-final-page.tsx`
- `tool-detail-hero.tsx`
- `tool-detail-score.tsx`
- `tool-detail-editorial.tsx`
- `tool-detail-decision-nav.tsx`
- `tool-detail-information.tsx`
- `tool-detail-signal.tsx`
- `tool-detail-alternatives.tsx`
- `tool-detail-action-surface.tsx`
- `tool-detail-footer.tsx`
- `alternative-decision-card.tsx`

Route re-export: `app/(marketing)/toools/[slug]/page.tsx` (≤30 lines, only imports `ToolDetailFinalPage` and `dynamic = "force-static"`).

---

## Final stylesheet ownership

**Allowed to affect `/toools/[slug]`** (intentional):
- `app/globals.css` — base, z-index tokens, `--tv-bottom-nav-total`, `--tv-tray-height`, scroll-padding-top
- `styles/tokens.css` — canonical design tokens
- `styles/shell.css` — shell-level surfaces only (top bar, footer)
- `styles/tool-detail-final.css` — sole route stylesheet (31.8 KB)
- Shared button primitives from `components/ui/premium.tsx` and `components/ui/button.tsx`

**Mechanically forbidden in route CSS** (enforced by `__tests__/tool-detail/clean-baseline.test.ts`):
- `.td4-*` (interim V4 namespace)
- `.tool-detail-*` (legacy namespace)
- `.ar4-card*` (Archive card grammar)
- `.premium-button-*` (in route page)
- `.internal-tool-page` (legacy wrapper)
- `.internal-page` (legacy wrapper)

**Mechanically forbidden in route page import**:
- `ArchiveV4ToolCard`, `DirectoryToolCard`, `DirectoryToolGlyph`
- `PageOrbitShell`, `SectionOrbitProvider`, `ToolDetailCtaBar`
- patterns `premium-button` and `premium-button-{primary|secondary|subtle|outline|glow|premium|dark|ghost|link|danger}`

**Z-index contract** (use ONLY `--tv-z-*` tokens; no literal `z-index: N` in route CSS):
```
--tv-z-backplane = -10
--tv-z-base      =  0
--tv-z-content   =  1
--tv-z-elevated  =  5
--tv-z-sticky    = 10
--tv-z-nav       = 50
--tv-z-overlay   = 80
--tv-z-modal     = 90
--tv-z-floating  = 100
--tv-z-toast     = 110
--tv-z-effects   = 120
--tv-z-skip      = 9999
```

**Fixed-surface order** (top → bottom in stacking):
1. CONTENT
2. STICKY DETAIL NAVIGATION (`--tv-z-sticky`)
3. TOOL ACTION SURFACE (`--tv-z-content`)
4. COMPARISON TRAY (`--tv-z-overlay`)
5. MOBILE BOTTOM NAVIGATION (`--tv-z-nav`)
6. SAFE AREA (env `safe-area-inset-*`)

**Required CSS custom properties** (published at runtime, consumed by route):
- `--tv-bottom-nav-total` (set by `MobileBottomNav`, collapsed to 0 on ≥1280)
- `--tv-tray-height` (set by `ArchiveV4CompareTray`, 0 hidden / 80px mobile visible / 0 desktop corner-dock)

`scroll-padding-top` is set on `<html>` in `app/globals.css` (mobile + ≥1280 breakpoints).

---

## Functional contracts that must not change

| Contract | Source of truth | Value |
| --- | --- | --- |
| Canonical Blink score | `lib/data/editorial-score.ts` | `8.4` ("Solido") |
| Editorial score formula | `computeEditorialScore({ name, toolOfWeek })` | range [6.8, 9.5], +0.6 toolOfWeek bonus, deterministic jitter step 0.5 |
| Compare minimum | `lib/discovery/workspace-constants.ts` | `MIN_COMPARE_TOOLS = 2` |
| Compare maximum | `lib/discovery/workspace-constants.ts` | `MAX_COMPARE_TOOLS = 5` |
| Save / Compare store | `useToolWorkspaceStore` | localStorage key `tooolvibes:workspace:v1` |
| External CTA | `tool.externalUrl` or `tool.affiliateUrl` | `Prova Blink` label comes from `tool.ctaLabel` |
| Real metadata | `ToolPublicView` from `lib/data/tool-public-view.ts` | no fabrication; radar data is bound to `useProductHuntRadar` |
| SEO | `generateMetadata` in `tool-detail-final-page.tsx` | `title`, `description`, `openGraph` |
| Static params | `generateStaticParams` | iterates `getPublicToolViews()` |
| Structured data | route + lib helpers | preserved |
| 14-item mobile order | owner composition in `ToolDetailFinalPage` | identity, name, category, status, positioning, CTA, save/compare, score, rationale, use cases, limitations, info, alternatives, footer |
| Touch target minimum | CSS | 44×44 |
| Typography floor | CSS | body ≥14px, metadata 11–12px, nav labels 14px, CTA labels 13–14px |
| Calibration | per-route | Tool Detail: max 2 continuous loops above fold (tighter than other routes) |

---

## Files that must not be restored

**Removed from disk** (zero consumer verified):
- `styles/tool-detail.css` (649 lines, legacy V1)
- `styles/tool-detail-v4.css` (1130 lines, interim V4)
- `components/tool-detail/tool-detail-cta-bar.tsx` (interim V4 client)
- `components/tool-detail/` (empty directory)

**Removed from `app/globals.css`** (200+ lines, scoped to dead `.internal-tool-page` wrapper):
- `.internal-tool-page .tool-detail-hero-badge*`
- `.internal-tool-page .tool-detail-profile-*`
- `.internal-tool-page :is(.tool-detail-main-cta, .tool-detail-secondary-cta)*`
- `.internal-tool-page .tool-detail-meta-*`
- `.internal-tool-page :is(.tool-detail-highlight-badge, .tool-detail-tag-chip)*`
- `.internal-tool-page .tool-detail-sponsored-placement*`
- The two final `!important` color-fallback rules at `33962–33973`

**Removed from `styles/shell.css`**:
- `.tool-detail-editorial-card`
- `.tool-detail-meta-block`
- `.tool-detail-main-cta`
- `.tool-detail-secondary-cta`
- The `.premium-button*` mappings that targeted them

**Must not be reintroduced**:
- `ArchiveV4ToolCard` inside the main detail flow (only in Archive v4 route)
- `DirectoryToolCard`, `DirectoryToolGlyph` in Tool Detail
- `PageOrbitShell`, `SectionOrbitProvider` in Tool Detail
- `internal-page` / `internal-tool-page` wrappers
- `td4-*` interim namespace
- `tool-detail-v4.css` interim stylesheet
- `premium-button-primary` (and variants) as class names in the route page
- Any literal `z-index: <number>` in route CSS (use `--tv-z-*` tokens)
- Any `!important` in route CSS (0 declared)

---

## Current validation baseline

| Check | Result | Notes |
| --- | --- | --- |
| `bun run typecheck` | PASSED | |
| `bun run check:styles` | PASSED | cascade, token ownership, !important ceilings intact |
| `bun run build` | PASSED | `/toools/[slug]` 2.35 kB / 187 kB First Load JS |
| `bun run cloudflare:build` | PASSED | OpenNext bundle generated |
| `bun run cloudflare:deploy` | PASSED | Version `ff81a271-38c4-451f-9318-03aaac67de26` |
| `__tests__/tool-detail/clean-baseline.test.ts` | 18/18 | |
| `__tests__/lib/data/editorial-score.test.ts` | 8/8 | |
| `__tests__/lib/data/tool-detail-derivation.test.ts` | 15/15 | |
| `bun run test:unit` (full) | 643 ✅ / 25 ❌ (baseline) / 12 skipped | baseline failures pre-existing, not introduced by clean baseline |
| `bun run lint:ci` | 9 baseline warnings | all in FROZEN routes (Home V4, Archive V4, shell); 0 from new code |
| `git diff --check` | PASSED | no whitespace conflicts |

**Baseline test failures** (do not attempt to fix unless explicitly authorized; they are in Home V4, Archive V4, shell, or the zod baseline):
- 17 `vibe-home-v2.test.tsx` (QueryClient context)
- 2 `typography-contract.test.ts`
- 1 `catalog-density-policy-contract.test.ts`
- 1 `token-contract.test.ts`
- 3 `home-time-to-value-contract.test.ts`
- 1 `runtime-contract.test.ts`
- 1 `tool-cms-publication-contract.test.ts` (z.config baseline in `lib/validation/zod.ts`)

**Style ownership ceilings** (must not grow):
- `hexHardcodedTotal`: 2369
- `radiusArbitraryTotal`: 915
- `breakpointsCustomUnique`: 36
- `motionDurationsArbitrary`: 13

---

## Production URL and deployment

- **URL**: https://tooolvibes.square-shape-3527.workers.dev
- **Route under audit**: `https://tooolvibes.square-shape-3527.workers.dev/toools/blink`
- **Cloudflare Version ID**: `ff81a271-38c4-451f-9318-03aaac67de26`
- **Smoke test**: HTTP 200 in ~1s
- **DOM check** (post-deploy, 3 viewports): 70 `.td-final-*` classes, 0 legacy classes, 229 total unique classes

---

## Instructions for resuming from the five binding mockups

**Five binding mockups** (user will provide):
1. Tool Detail desktop 1440
2. Tool Detail mobile 390
3. Tool Detail tablet 768 / 1024
4. Alternatives Decision Desk
5. Interaction and fixed-surface system

**Resumption protocol**:

1. **Wait** for all five mockups. Do not start coding until all five are present and explicitly approved as binding.

2. **Branch** from `1f5081b` (current HEAD). Do not branch from anything older.

3. **Working protocol** (one section at a time, max 1–3 files per step):
   - inspect the current implementation of the targeted section
   - propose the diff (text or screenshot mock)
   - wait for explicit user approval
   - implement, run validation, screenshot at the relevant viewport
   - commit atomically (one commit per logical change)

4. **Per-step validation** (must pass before any commit):
   - `bun run typecheck`
   - `bun run check:styles` (cascade / tokens / !important ceilings)
   - `bunx vitest run __tests__/tool-detail/clean-baseline.test.ts` (must stay 18/18)
   - `bunx vitest run __tests__/lib/data/editorial-score.test.ts` (must stay 8/8)
   - `bun run build` (no new route bloat beyond the documented ceilings)
   - visual review at the relevant viewport (full + fold)

5. **Preservation rules during visual implementation**:
   - Keep the `ToolDetailFinalPage` orchestrator and the 11 owner components as the single owner tree.
   - Keep the `.td-final-*` (and `.td-final-alt-*`) namespace.
   - Keep `styles/tool-detail-final.css` as the sole route stylesheet.
   - Keep `--tv-z-*` tokens, `--tv-bottom-nav-total`, `--tv-tray-height`, scroll-padding-top.
   - Keep the 14-item mobile order.
   - Keep Blink score `8.4`, Save, Compare MIN=2/MAX=5, external CTA, real data, SEO, structured data.
   - Do not re-introduce any of the "Files that must not be restored" list above.
   - Do not touch Home V4, Archive V4, Full Radar, Compare route, Saved route, or global product copy.

6. **Visual parity gate** (mandatory before any commit):
   - No functional content disappeared.
   - No visual section is broken.
   - No raw HTML styling appears.
   - No footer or navigation regressed.
   - No mobile overlap exists.
   - All actions remain usable.
   - Differences are limited to the change being implemented (no incidental drift).

7. **Atomic commit convention**:
   - `refactor(tool-detail): ...` for section-level changes
   - `fix(tool-detail): ...` for defect fixes
   - `style(tool-detail): ...` for visual-only tweaks
   - `test(tool-detail): ...` for test additions
   - `docs(qa): ...` for evidence commits
   - Always include `[MiniMax]` suffix when Mavis is the operator.

8. **Deployment**:
   - `bun run cloudflare:build && bun run cloudflare:deploy`
   - After deploy, re-screenshot the targeted viewport at production and compare to the binding mockup.
   - Document the new Cloudflare Version ID in the commit message.

9. **Stop conditions** (do not pass without explicit user go-ahead):
   - Any change to the canonical score formula.
   - Any change to the Compare MIN/MAX constants.
   - Any re-introduction of a removed file from the "Files that must not be restored" list.
   - Any change to Home V4, Archive V4, or other FROZEN routes.
   - Any modification of the `.td-final-*` namespace prefix.
   - Any addition of new radius values, breakpoints, or motion durations beyond the documented ceilings.

---

**Source documents** (do not modify):
- `audits/definitive-rebuild/tool-detail-clean-reset/README.md`
- `audits/definitive-rebuild/tool-detail-clean-reset/LEGACY_LAYER_MAP.md`
- `audits/definitive-rebuild/tool-detail-clean-reset/DOM_OWNERSHIP_GRAPH.md`
- `audits/definitive-rebuild/tool-detail-clean-reset/PROPOSED_CLEAN_TREE.md`
- `audits/definitive-rebuild/tool-detail-clean-reset/FIXED_SURFACE_CONTRACT.md`
- `audits/definitive-rebuild/tool-detail-clean-reset/FILES_SAFE_TO_REMOVE.md`
- `audits/definitive-rebuild/tool-detail-clean-baseline/REPORT.md`

**Visual evidence** (do not modify):
- `audits/definitive-rebuild/tool-detail-clean-baseline/before/` (18 PNG, 9 viewports × {full, fold})
- `audits/definitive-rebuild/tool-detail-clean-baseline/after-final/` (18 PNG, post-cleanup)
- `audits/definitive-rebuild/tool-detail-clean-baseline/prod-final/` (6 PNG, production)
- `audits/definitive-rebuild/tool-detail-clean-baseline/boards/` (10 PIL panels)

---

TOOL DETAIL CLEAN BASELINE — FROZEN FOR VISUAL MOCKUPS.
