# Validation ledger

Final local validation on 2026-07-26.

| Check | Result |
| --- | --- |
| TypeScript typecheck | Pass |
| ESLint CI profile | Pass |
| Style ownership/contracts | Pass |
| Focused route contract suite | 93/93 pass |
| Navigation and command palette suite | 28/28 pass |
| Final focused regression selection | 64/64 pass |
| `git diff --check` | Pass |
| Next production build | Pass |
| OpenNext / Cloudflare build | Pass |
| Responsive browser sweep | 126/126 route-width checks clean |
| Interaction browser sweep | Pass, 0 console/page errors |
| Visual board inspection | Pass |
| Live Worker verification | 18/18 route-viewport checks clean |

## Full unit baseline

The authoritative run used the bundled Node runtime because this shell has no
system `node` binary. Result: **1,014 total, 978 passed, 24 failed, 12 skipped**.

| Existing failure group | Count | Baseline relationship |
| --- | ---: | --- |
| Legacy `VibeHomeV2` composition/FIX-1 expectations | 17 | superseded legacy Home owner |
| B40 home time-to-value wiring expectations | 3 | superseded legacy Home flag path |
| Catalog sponsor-placement contract | 1 | pre-existing alternate flag path |
| Runtime contract invoking npm | 1 | environment has Bun and no npm |
| Certified global cascade order | 1 | pre-existing order expectation |
| Inter/Anton-only font contract | 1 | pre-existing expectation conflicts with editorial Fraunces owner |

The failure names match the documented pre-reconstruction baseline groups. The
previous `font-size below 12px` baseline failure now passes. A Bun-executed
diagnostic run was discarded because it aborted 47 suites during collection
with the known `z.config` runtime incompatibility; the Node-backed run above
collected all 326 suites.

## Build note

The user-owned untracked `/(internal)/visual-lab/tool-detail` page imports an
untracked stylesheet that is absent. It was temporarily moved to a private
temporary directory for each production build, immediately restored, and is
not part of the intended diff or deployment.
