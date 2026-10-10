# Radar final reference — Phase 1.5

Starting SHA: `18dbc1cbccad813a49e6b486868a8571c1d78320`, branch `main`.
Final delivery SHA and commit are recorded in `HANDOFF.json` beside the contact sheets (written after the local commit so the identifier is exact). No push, deploy, or site-wide rollout.

## Scope and final behavior

Five production files changed: `components/radar/full-radar-experience.tsx`, `components/radar/radar-quick-preview.tsx`, `components/radar/radar-panels.tsx`, `styles/radar-full.css`, `styles/tokens.css`. A focused inspector/fallback regression was added in `__tests__/components/radar/radar-cta-contract.test.tsx`. One dedicated browser QA script added: `scripts/qa/radar-finalref.mjs`.

Engine, geometry, time scales, local focus, taxonomy, hit testing, representative selection, domain models, auth, MemberOnlyGate, and canonical Save/Compare/Watch actions remain frozen. Mobile Overview/Local/Trend and desktop Overview/Local/Selected/Trend retain their approved architecture. Desktop growth uses the bounded workspace scale only. Global navigation retains its existing visual and routing contract.

## Mobile Selected

One non-modal contextual inspector uses the existing quick-preview business logic. Below 1024 px it becomes a fixed bottom sheet above canonical bottom navigation, consent, safe area and Compare Dock clearance.

- Compact default: identity, category, external/catalog badge, votes, comments, rank, age, topics, primary CTA, Watch and applicable Save/Compare. At 390×844 the sheet begins around 334 px, leaving approximately 40% of the viewport above it and over 200 px of the circular Local map visible. Exact Chromium/WebKit measurements are in `RADAR-FINALREF-QA.json`.
- Expanded: the explicit 44 px control reveals tagline, historical availability and source classification within the same inspector. Core actions precede longer supporting details. The sheet scrolls internally on short screens; actions retain their canonical sticky treatment.
- Close/Escape: restores the original category/range/query URL, marker coordinates, shell/window scroll position and originating keyboard focus. Selection scrolls the instrument into view rather than scrolling away to a detail card. Selecting another tool mounts a fresh compact inspector.
- Motion: 180 ms opacity/translation entry; no height animation. Reduced-motion disables entry motion. No backdrop, page navigation, scroll lock, duplicated detail tree, or parallel mobile business logic.

## Personal workspace

At desktop sizes, real recommendations/guidance occupy the primary column and an interest-profile rail occupies the contextual column. Mobile uses the same DOM in a readable stack.

| State | Main surface | Evidence rail |
| --- | --- | --- |
| Cold | Three actionable paths: Catalog categories, current Trend, initial Saved tools | Actual zero counts and the absence of inferred interests |
| Partial | Explicit no-match state for the selected period, Trend and Catalog entry points | Real persisted inputs, retained even when the snapshot has no match |
| Mature | Existing deterministic cards with the exact existing reason/explanation and Explore action | Actual Saved, Compare, watched tools/categories, stack and recorded tool-state counts; existing inferred category labels |

“Mature” means the existing model has useful cards, not a new confidence threshold. Inputs with no inferred category are displayed honestly. Watched external signals can be relevant without implying inferred category affinity. No fabricated confidence score, recommendations, interaction history or AI profile.

## Watch workspace

A monitored-signals main surface pairs with a category/management rail. The current period appears in the section eyebrow; real counts, attention, age, topic area, Product Hunt source and catalog status stay explicit.

- Empty: real zero metrics, an Open Radar action and up to three actual signals from the current snapshot; these are entry points, not personal recommendations. Real available areas remain navigable in the rail.
- One item: a deliberate monitor row plus current-period metrics, snapshot signal and honest historical availability. Clear is a compact utility alongside actual watch counts.
- Multiple: the same monitor list grows without switching data models. Category controls and the canonical tool picker stay in the rail; original signal evaluation and callbacks are unchanged.
- Non-empty with no matches: retains watch counts, states that watched tools are absent from the current snapshot and offers Radar entry points. It never suggests watched tools disappeared permanently.

## Desktop scale and header

| Width | Composition |
| --- | --- |
| 1024 | Two-column workspace starts; main/rail ratio 1.7:1, instrument constrained by the main column. Existing mobile global chrome remains until its canonical 1280 breakpoint. |
| 1280–1440 | Existing desktop header and active Radar route; bounded columns, 608 px instrument target and roughly 20 px gap. |
| 1600 | Instrument grows toward 640 px, gap grows within the shared clamp. |
| 1728–1920 | Instrument caps at 672 px; canvas caps at 1600 px, including its inline padding. At 1920 the centered outer canvas leaves 160 px margins. Rail and text stay proportional without increasing global typography. |

Shared scale tokens live only in `styles/tokens.css`: `--tv-workspace-max`, `--tv-workspace-gap`, `--tv-primary-column`, `--tv-context-rail`, `--tv-instrument-size`. Radar consumes these through its own stylesheet. Header/search/account hierarchy remains as approved; no navigation redesign was necessary.

## Phase 2 primitives audit

| Foundation | Ready behavior | Next phase boundary |
| --- | --- | --- |
| MetricStrip | Semantic definition-list metrics, shared typography, zero/loading values | Already reusable React primitive |
| SegmentedControl | Accessible tabs and ranges, roving keyboard focus, adaptive sizing | Already reusable React primitive |
| ResponsiveWorkspace / ContextRail | One DOM, stacked mobile, bounded main+rail desktop, shared gap/column tokens | Extract from Radar presentation when a second route needs it |
| InstrumentPanel | Distinct instrument material, graphical header, count and bounded canvas | Preserve geometry ownership inside each instrument |
| WorkspaceHeader / SectionEyebrow | Editorial hierarchy, cyan factual labels, consistent rhythm | Extract presentation only; keep route semantics local |
| DataList / StatBlock | Real source matrix and compact monitor rows with explicit status | Native list/dl semantics, no invented aggregate metrics |
| ColdStartState / EmptyState | Real zero metrics, structured next actions, preserved input evidence | Route-supplied actions and facts |
| DesktopDetailRail / MobileInspection | Same detail/actions, contextual desktop rail and compact/expanded mobile inspector | Keep canonical CTA components and route-level focus/scroll restoration |

Instrument/context materials (`--tv-instrument-surface/edge`, `--tv-context-surface/edge`) and existing radii/spacing/color roles remain the visual base. No speculative shared-component extraction or other-route refactor was done.

## Verification and evidence

Local URL: `http://127.0.0.1:3100/radar`. Browser plugin/`browser` skill unavailable; regular Playwright used under frontend-testing-debugging. Safari production inspected live read-only for contextual comparison. Candidate QA uses separate fictional local auth/workspace contexts; writes to remote workspace services are intercepted.

Public Product Hunt snapshots captured during Phase 1 supply real source names and original timestamps. The explicitly labelled development fixture separately covers catalog-linked actions. No real account data is seeded or changed.

| Check | Result |
| --- | --- |
| Chromium + WebKit | 320, 390, 768, 1024, 1280, 1440, 1600, 1728, 1920 px; 144 physical marker selections; zero wrong selections |
| Local inspection | Exact URL/coordinate/scroll/focus restoration; compact/expanded states; 390×640 short-screen actions and dock clearance |
| Modes and ranges | Overview → Local → Selected → close; Trend, cold/mature/partial Personal, empty/one/multiple Watch; 24H/7G/30G payload boundaries |
| Actions and navigation | Watch, category follow/unfollow, canonical catalog CTA, Save, Compare and dock; external CTA popup/href; actual bottom and desktop Radar nav clicks; keyboard arrows/Enter/Escape |
| Axe | 108 matrix runs plus 16 final inspector runs across both engines; zero serious/critical, including mobile compact/expanded Selected and desktop Overview/Selected/Personal/Watch |
| Responsive transitions | Sequential 1440→1600→1728→1920→1024→390→1920 resize, circular instrument, no overflow or duplicate map/main trees |
| Performance | Post-ready interaction CLS 0 in every measured context; short sheet motion uses only transform/opacity. Dev startup CLS reaches ~0.71 on narrow Chromium contexts during existing auth/loading/consent transitions. Dev long tasks include QA/axe work and cannot certify production INP. WebKit lacks those PerformanceObserver entry types in this runtime; its zero values are not equivalent measurements. |
| Unit regression | 25 files, 316 tests passed |
| TypeScript | `tsc --noEmit` passed |
| Lint | Changed TSX and QA script: zero warnings/errors |
| Production build | Local `npm run build` passed; detailed log alongside contact sheets |
| Style ownership | Global check still fails with exactly the same baseline output; no additional violations |

Page identity, non-blank rendering, no framework error overlay, screenshot evidence and state assertions passed. No page exceptions or hydration errors. Console noise is limited to unavailable remote thumbnail DNS and WebKit's pre-existing unsupported `interactive-widget` viewport key; image slots retain explicit dimensions and failed preview thumbnails fall back to tool initials.

## Known remaining limits

1. Existing workspace hydration persists `radarWatch` correctly but its non-persist projection omits Watch fields, so UI may empty after reload despite intact durable data. The Phase 1 baseline limitation remains under the explicit freeze; no action/store changes were introduced.
2. Global style-ownership debt persists in unrelated styles/import ordering. Candidate and baseline checker logs are byte-identical.
3. Local dev startup CLS, third-party asset availability and production/device performance are not certified by this QA. Post-ready interaction measurements are reported separately. Physical iOS Safari was not tested; automated WebKit and live macOS Safari were.

## Artifacts

Directory: `/Users/gianmariacaltagirone/.codex/visualizations/2026/10/10/01a12687-6dca-7710-99c5-bf2179659686/radar-finalref`.

- `RADAR-FINALREF-MOBILE-CONTACT-SHEET.png`: requested six 390 px states.
- `RADAR-FINALREF-DESKTOP-CONTACT-SHEET.png`: Overview, Selected, cold Personal and multi-item Watch at 1024/1280/1440/1728/1920.
- `RADAR-FINALREF-ULTRAWIDE-CONTACT-SHEET.png`: Overview, Selected, mature Personal and one-item Watch at 1600/1728/1920.
- Individual requested PNGs plus empty/one/mature/partial variants and WebKit counterparts.
- `RADAR-FINALREF-QA.json`, `RADAR-FINALREF-SUPPLEMENTAL.json`, `RADAR-FINALREF-INSPECTION.json`, `states/RADAR-VNEXT-QA.json`, build/tests/browser/style logs, and exact final `HANDOFF.json`.

Reproduce rendered QA with Node 22.23.1, the local dev server/environment described in Phase 1, and:

```sh
RADAR_QA_SNAPSHOT_DIR=.tmp-qa/radar-snapshots RADAR_QA_OUTPUT_DIR=/absolute/evidence/path node scripts/qa/radar-finalref.mjs
```

STOP after this local handoff. Phase 2 requires human approval.
