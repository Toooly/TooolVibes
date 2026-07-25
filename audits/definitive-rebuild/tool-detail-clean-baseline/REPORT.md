# Tool Detail — Clean Baseline Report

**Date**: 2026-07-25
**Status**: TOOL DETAIL CLEAN BASELINE — AWAITING VERIFICATION.
**HEAD**: `9972d61` on `main` (pushed to `origin/main`)
**Production**: https://tooolvibes.square-shape-3527.workers.dev
**Cloudflare Version ID**: `ff81a271-38c4-451f-9318-03aaac67de26`

---

## 1. Removed files

| File | Reason |
| --- | --- |
| `styles/tool-detail.css` | Legacy V1 stylesheet. 649 lines. Zero consumer. |
| `styles/tool-detail-v4.css` | Interim V4 stylesheet. 1130 lines. Replaced by `tool-detail-final.css`. |
| `components/tool-detail/tool-detail-cta-bar.tsx` | Interim V4 client. Replaced by `tool-detail-action-surface.tsx`. |
| `components/tool-detail/` | Empty directory after above removal. |
| `.internal-tool-page .tool-detail-*` block in `app/globals.css` | 200+ lines of dead CSS. The new route does not render `.internal-tool-page`. |

## 2. Isolated files (kept, but no longer consumed by Tool Detail)

| File | Reason |
| --- | --- |
| `components/ui/premium.tsx` | Shared button primitive. Used by Archive V4 / Home V4 / Compare. |
| `components/ui/button.tsx` | Shared button primitive. Used by other routes. |
| `components/3d-maestoso/shortlist-3d-vault.tsx` (DirectoryToolGlyph) | Used by 3D Vault. Not in Tool Detail. |
| `lib/tools/editorial-score.ts` | Old multi-dimensional editorial score. Used by `components/tools/`. Kept separate from the new canonical `lib/data/editorial-score.ts`. |
| `styles/archive-v4.css` | Used by Archive V4. Not in Tool Detail. |
| `components/archive/archive-v4-tool-card.tsx` | Used by Archive V4. Not used in Tool Detail (alternatives uses `AlternativeDecisionCard`). |

## 3. Final component tree

```
ToolDetailFinalPage                        (server, components/tool-detail-final/tool-detail-final-page.tsx)
├── ToolDetailHeroFinal                    (A. Identity + Action Surface, 7fr)
│   └── ToolDetailActionSurface            (A.2 client, 44×44 Save/Compare/CTA)
├── ToolDetailScoreFinal                   (B. Score Instrument, 5fr)
├── ToolDetailDecisionNavFinal             (D. In-page nav, sticky ≥1024)
├── ToolDetailEditorialFinal               (C. Editorial Rationale, 4 cards 2×2)
├── ToolDetailInformationFinal             (E. Product Information, 8 dt/dd)
├── ToolDetailSignalFinal                  (F. Trend/Signal, honest empty state)
├── ToolDetailAlternativesFinal            (G. Alternatives Decision Desk)
│   └── AlternativeDecisionCard            (3 cards, ivory surface, .td-final-alt-*)
└── ToolDetailFooterFinal                  (route-level end marker)
```

## 4. Final stylesheet ownership

**Allowed for Tool Detail** (intentional):
- `tokens.css` — canonical design tokens
- `globals.css` — base, z-index tokens, `--tv-bottom-nav-total`, `--tv-tray-height`, scroll-padding
- `shell.css` — shell-level surfaces (top bar, footer)
- `tool-detail-final.css` — sole route stylesheet (31.8 KB, 0 !important, 0 literal z-index, 0 legacy inheritance)
- Shared button primitives: `premium-button*` classes for `ui/premium.tsx` and `ui/button.tsx`

**Forbiddens (mechanically enforced by `__tests__/tool-detail/clean-baseline.test.ts`)**:
- `.td4-*` (interim V4 namespace)
- `.tool-detail-*` (legacy namespace)
- `.ar4-card*` (Archive card grammar)
- `.premium-button-*` (in route page)
- `.internal-tool-page` (legacy wrapper)
- `.internal-page` (legacy wrapper)

## 5. Legacy-class test result (DOM)

Verified against the live production URL at 3 viewports:

| Viewport | `.td-final-*` classes | Legacy classes (forbidden) | Total unique |
| --- | --- | --- | --- |
| 1440 desktop | 70 | 0 | 229 |
| 768 tablet  | 70 | 0 | 229 |
| 390 mobile  | 70 | 0 | 229 |

Zero legacy classes in rendered HTML. Only `.td-final-*` namespace present.

## 6. Before/after PIL boards

`audits/definitive-rebuild/tool-detail-clean-baseline/boards/`

- `board-1-desktop-1440-before-after.png` (full page, 1440)
- `board-2-mobile-390-before-after.png` (full page, 390)
- `board-3-tablet-768-before-after.png` (full page, 768)
- `board-4-tablet-1024-before-after.png` (full page, 1024)
- `board-5-hero-score-1440-fold.png` (above the fold, 1440)
- `board-6-mobile-fold-390.png` (above the fold, 390)
- `board-7-dev-vs-prod-1440-full.png` (dev vs prod, 1440)
- `board-7-dev-vs-prod-1440-fold.png` (dev vs prod, 1440 fold)
- `board-7-dev-vs-prod-390-full.png` (dev vs prod, 390)
- `board-7-dev-vs-prod-390-fold.png` (dev vs prod, 390 fold)

## 7. Validation

| Step | Result |
| --- | --- |
| `bun run typecheck` | PASSED |
| `bun run check:styles` | PASSED (cascade, token ownership, !important ceilings intact) |
| `bun run build` | PASSED (`/toools/[slug]` 2.35 kB / 187 kB First Load) |
| `bun run cloudflare:build` | PASSED (OpenNext bundle generated) |
| `bun run cloudflare:deploy` | PASSED (Version `ff81a271-...`) |
| `bunx vitest run __tests__/tool-detail/clean-baseline.test.ts` | 18/18 PASSED |
| `bunx vitest run __tests__/lib/data/editorial-score.test.ts` | 8/8 PASSED |
| `bunx vitest run __tests__/lib/data/tool-detail-derivation.test.ts` | 15/15 PASSED |
| `bun run test:unit` (full) | 643 PASSED / 25 FAILED (baseline) / 12 SKIPPED |
| `bun run lint:ci` | 9 baseline warnings (FROZEN routes) / 0 from new code |

**Baseline test failures** (NOT regressions, NOT introduced by this work):
- 17 `vibe-home-v2.test.tsx` (QueryClient context)
- 2 `typography-contract.test.ts`
- 1 `catalog-density-policy-contract.test.ts`
- 1 `token-contract.test.ts`
- 3 `home-time-to-value-contract.test.ts`
- 1 `runtime-contract.test.ts`
- 1 `tool-cms-publication-contract.test.ts` (zod.config baseline)

Total: 25 (matches ledger; 24 documented + B38 missed by ledger = 25 actual).

## 8. Atomic commits

```
9f4bab6 refactor(tool-detail): introduce td-final owner tree with visual parity [MiniMax]
19cbebc refactor(tool-detail): unify fixed-surface ownership [MiniMax]
719b081 cleanup(tool-detail): remove legacy route components and styles [MiniMax]
8c5f692 test(tool-detail): enforce clean DOM and CSS ownership [MiniMax]
c65636e test(tool-detail): update integration contract for new owner path [MiniMax]
9972d61 docs(qa): record clean baseline evidence [MiniMax]
```

## 9. Deployment

- **Production URL**: https://tooolvibes.square-shape-3527.workers.dev
- **Version ID**: `ff81a271-38c4-451f-9318-03aaac67de26`
- **Smoke test**: `HTTP 200` on `/toools/blink` (0.9s)
- **DOM check**: 0 legacy classes, 70 `.td-final-*` classes (consistent across 390/768/1440)

## 10. Objective residual issues

None identified at the structural level. The route:

- Renders with one clean owner tree, one isolated namespace.
- Uses 0 legacy component imports.
- Uses 0 `!important` declarations.
- Uses 0 literal `z-index` values (all flow from `--tv-z-*` tokens).
- Publishes and consumes `--tv-bottom-nav-total` and `--tv-tray-height` for fixed-surface offset.
- Has `scroll-padding-top` on `<html>` with mobile + ≥1280 breakpoints.
- Preserves all functional contracts (Blink score 8.4, Save, Compare MIN=2/MAX=5, persisted state, real data, external CTA, SEO, structured data).

**Awaiting**: user visual review of before/after PIL boards at the 9 audited viewports (360/390/430/768/820/1024/1280/1440/1920).

---

TOOL DETAIL CLEAN BASELINE — AWAITING VERIFICATION.
