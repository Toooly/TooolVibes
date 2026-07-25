# Tool Detail v4 — Score Contract (2026-07-25)

## Canonical source of truth

`lib/data/editorial-score.ts` exports `computeEditorialScore(tool)`.

This is the **single source of truth** for the TooolVibes editorial score,
consumed by:

| Consumer | File | Score label |
|---|---|---|
| Archive v4 tool card | `components/archive/archive-v4-tool-card.tsx` | "9.4" (no unit) + "/ 10" |
| Tool Detail v4 score instrument | `app/(marketing)/toools/[slug]/page.tsx` | "9.4" (large) + "/10" |
| Compare route (when wired) | (future) | (same) |

Both consumers call `computeEditorialScore(tool)` and read `.value` /
`.label` from the result. The displayed number is byte-identical between
Archive and Tool Detail.

## Formula

```
const EDITORIAL_SCORE_MIN = 6.8
const EDITORIAL_SCORE_MAX = 9.5
const EDITORIAL_SCORE_TOOL_OF_WEEK_BONUS = 0.6
const EDITORIAL_SCORE_JITTER_STEP = 0.5

function computeEditorialScore(tool):
  base = 6.8 + (tool.name.length % 3) * 0.5
  boosted = tool.toolOfWeek
    ? min(base + 0.6, 9.5)
    : base
  value = round(boosted * 10) / 10
  label = value >= 9.0 ? "Ottimo"
        : value >= 8.0 ? "Solido"
        : value >= 7.0 ? "Buono"
                      : "Base"
  return { value, label }
```

Properties:
- Deterministic: same input → same output
- Range: [6.8, 9.5]
- Tool of week gets exactly +0.6
- Built from `tool.name.length` only (no fabricated reviews/ratings)
- Never reaches 10.0

## Why this formula

The formula was the one already in use by `components/archive/archive-v4-tool-card.tsx` and Home v4 — chosen before this Tool Detail work. It uses a deterministic jitter from name length so that visually similar tools don't all display the same number, while remaining entirely reproducible.

The Tool Detail v4 originally introduced a *different* formula
(`base = 7.4` adjusted by level/featured/toolOfWeek bonuses). This was
an inconsistency: the same "Score TooolVibes" label was showing 8.4 in
Archive and 9.3 in Tool Detail for Blink.

**Resolution**: Tool Detail v4 now delegates to the canonical
`computeEditorialScore`. Blink shows **8.4** in both Archive and Tool
Detail.

## Validation (testable contract)

`__tests__/lib/data/editorial-score.test.ts` enforces:

- 8.4 for Blink (5 chars, toolOfWeek=true) — the exact value the Archive
  v4 card displays.
- Tool-of-week bonus is exactly +0.6.
- Range [6.8, 9.5].
- Deterministic.
- 1-decimal rounding.
- Label band matches value band.

8/8 tests pass.

## Test baseline reconciliation

Pre-Batch-5 (a19e2bc): 23 failed / 588 passed / 12 skipped.
This was the figure the user reported.

The user-facing ledger (audits/release-integrity-check/test-failure-ledger.json
2026-07-24T17:30:00) reports the same 23. However, a re-run after the
Archive v4 rebuild (commit 4f8cdbe) revealed that the B38 catalog density
test (`renders the sponsor band AFTER the organic catalog when the flag is ON`)
had been broken by the Archive v4 rewrite (the legacy `<FloatingCatalogView>`
component was replaced). This 24th failure was not captured in the
ledger snapshot.

| State | Failed | Note |
|---|---|---|
| User-reported baseline (23) | 23 | Ledger snapshot, missing B38 |
| Pre-Tool-Detail actual (24) | 24 | Archive v4 broke B38 |
| After Tool Detail first build (25) | 25 | +1 inline `fontSize: 0.7rem` violation |
| After Tool Detail fix (24) | 24 | inline violation removed via CSS class |

**Delta introduced by Tool Detail work: 0** (peak +1, fixed).

The 24 failures split as:
- 17 vibe-home-v2 (QueryClientProvider context — pre-existing)
- 2 release typography contract (CSS font-size in archive-v4 / mobile-bottom-nav / shell / tool-detail legacy — pre-existing)
- 3 B40 wiring flag (pre-existing)
- 1 release runtime contract (preinstall npm — pre-existing)
- 1 B38 catalog density (broken by Archive v4 rebuild, not Tool Detail)

None of these 24 are caused by the Tool Detail v4 work.

## Motion budget

| Element | Loop type | Duration | Product meaning |
|---|---|---|---|
| `.td4-identity::before` | infinite (very slow) | 14s linear | subtle hero scan — atmospheric, not load-bearing |
| `.td4-score__bar-fill` | one-shot entrance | 720ms once | score reveal animation on first paint |

Total continuous loops above the fold: **1** (under the 2-loop ceiling).

The bar was previously an infinite 4s shimmer. Per visual review feedback,
a continuous shimmer is not meaningful (no semantic response to user input).
It was converted to a one-shot entrance that completes in under a second.
