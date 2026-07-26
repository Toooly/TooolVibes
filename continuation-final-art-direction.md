# ToooLVives — Continuation Checkpoint

## Repository

- Branch: `main`
- HEAD: `4e652c7` (chore(qa): remove stale debug scripts from contrast investigation)
- git diff --check: clean

## Uncommitted modified files (2)

- `styles/tokens.css` — added 6 canonical stage offset tokens (--tv-stage-compact, --tv-stage-standard, --tv-stage-immersive + mobile variants)
- `styles/catalog.css` — .catalog-discovery padding: clamp(6.75rem, 9vw, 8.5rem) → var(--tv-stage-compact)

## Uncommitted untracked utility scripts (3)

- `scripts/spacing-audit.mjs` — Playwright route spacing auditor
- `scripts/archive-dom.mjs` — Playwright Archive DOM walker
- `scripts/archive-dom2.mjs` — Playwright Archive deeper DOM walker

## Production

- Version: `1ff3a190-8374-4853-b593-81c6869a3732`
- URL: `https://tooolvibes.square-shape-3527.workers.dev`
- All 8 priority routes verified 200

## Validation status

- check:styles — PASS
- lint:ci — PASS (max-warnings=0)
- typecheck — PASS
- build — PASS (TOOOLVIBES_ALLOW_MOCK_DATA=1)
- cloudflare:build — PASS
- vitest — 942/957 PASS (3 pre-existing B40 baseline failures, ZERO new regressions)

## Completed (final-pass work)

- Added canonical stage offset tokens to styles/tokens.css
- Applied COMPACT token to Archive .catalog-discovery
- Ran initial route spacing audit via Playwright

## Active investigation (EXACT INTERRUPTED POINT)

**Excessive vertical spacing between fixed header and Archive content.**

Spacing chain at 1440px desktop:
```
<main>                        padding-top: 64px   (canonical fixed-header offset)
.archive-final-surface        padding-top: 0      (wrapper)
.catalog-page                 padding-top: 56px   (legacy mobile safe-area, leaking to desktop)
.catalog-discovery            padding-top: 48px   (new --tv-stage-compact)
```

Total offset from viewport top: 64 + 0 + 56 + 48 = 168px. Header is 64px. Gap = 104px.

The `.catalog-page` wrapper is the culprit — it has `padding-top: 56px` (legacy mobile safe-area from `app/globals.css` line 14451+ or `styles/vibes-3d-maestoso.css`). This should NOT apply on desktop.

**NEXT EXACT ACTION (do NOT change):**

1. `grep -A5 "\.mobile-catalog-view\b" app/globals.css:14451` to read the actual rule
2. Scope the padding-top to mobile-only if it's genuinely a mobile safe-area rule
3. Desktop should NOT receive redundant wrapper padding
4. Re-measure: header bottom → first visible "DIRECTORY EDITORIALE" eyebrow text
5. Target 40-72px visual gap after header on desktop

## Known real visual issues (from brief)

- Home Radar Live: truncated tool names, uneven nodes, weak center
- Archive: excessive header gap, low-contrast cards/pills/metadata
- Tool Detail related cards: white-on-white category text
- Header: crowded "collection of pills and circles"
- Podium: static, needs trace/edge/pulse treatment

## Execution order after spacing closure

1. Header final refinement (brand+nav hierarchy)
2. Home Radar Live rebuild (names, nodes, center, scan)
3. Tool of the Week + Podium signature treatment
4. Archive card readability + composition
5. Tool Detail alternative-card surface contrast
6. Button + interaction hierarchy
7. Brand decorative language (wave fragments, signal traces, micro-arcs, scan marks, lock-on markers)
8. Full Radar route refinement
9. Compare + Saved final polish
10. Mobile translation (360/390/430)
11. Tablet/intermediate widths (768/820/912/1024/1180/1280/1366)
12. Final human-level screenshot review (13 widths × 9 routes)
13. Technical validation
14. Production deploy + acceptance

## DO-NOT-BREAK rules

- Visual architecture: DARK COMMAND CENTER + WARM IVORY DECISION SURFACES + ANTON + INTER + SOLID ULTRAVIOLET + RADAR / SIGNAL / WAVE / NODE + SCOPRI → CONFRONTA → SALVA
- Do NOT redesign from zero
- Do NOT rewrite copy
- Do NOT create override layers or mega-CSS files
- Fix issues in correct CSS owners only
- Do NOT commit junk files (.slim/, audit-*, test.txt, test-image.png)
- Work on main, atomic commits, NO `git add .`
- ZERO new vitest regressions
- Proactive DCP compression after each completed work block
