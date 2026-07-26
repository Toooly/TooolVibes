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
| Active Cloudflare version | `a55600ac-22ce-41cb-8f10-8cd8971ab796` at 100% |

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
diagnostic after the release work completed all 1,014 tests with 973 passed,
29 failed and 12 skipped. The authoritative Node baseline above remains the
release reference because the extra Bun failures are runtime/test-harness
drift rather than a new public-UI failure group.

## Build note

The unfinished internal Tool Detail Visual Lab imported a stylesheet that did
not exist and prevented clean production builds. It was removed from the
product tree rather than special-cased in the release process; it remains
recoverable from Git history at `990f6a1`. The final Next and OpenNext builds
now run from a clean checkout path with no temporary file moves.

The production browser pass used viewport captures rather than the browser
driver's distorted full-page mobile capture. Nine routes at 390×844 and
1440×900 all render the expected shell, main landmark and zero horizontal
overflow. The console contains no errors; the only warning kind is the existing
`THREE.Clock` deprecation notice.
