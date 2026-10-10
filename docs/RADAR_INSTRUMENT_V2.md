# Radar Instrument V2 — local visual review

Starting SHA: `d5ff1595425cd18f647e7a83b0fa0a6df17c3b95`. Ending SHA is recorded in [HANDOFF.json](/Users/gianmariacaltagirone/.codex/visualizations/2026/10/10/01a12687-6dca-7710-99c5-bf2179659686/radar-instrument-v2/HANDOFF.json) after the local commit. Branch: `main`. No push or deploy.

## Scope and audit

The original renderer had nearly equal ring weights, a large origin, circular white marker highlights and a field that blended into the page. Homepage and finalized Catalog/Podium established the reference: fine layered borders, directional tonal surfaces, restrained lighting and clear state hierarchy.

Only the SVG renderer and its CSS changed. Hero, tabs, telemetry, navigation, Per Te, Watchlist, mobile inspection sheet and desktop intelligence rail are unchanged. No dependencies added.

## Visual system

- Surface: restrained static radial well, fine inset edge and integral corner frame; no blur filters.
- Bezel: three fine boundaries, 48 calibrated ticks with lighter mobile detail.
- Global: canonical eight colored perimeter arcs; subtle geographic diagonals and stronger primary axes.
- Local: focused cluster accent, single perimeter and analytical axes; multicolor compass and geographic dividers disappear.
- Temporal grid: unchanged ring radii, timestamps and label positions; stronger major/outer rings, dark label backing and axis intersection ticks.
- NOW: small nucleus, thin corona and static field; no pulse or sweep.
- Markers: cluster tonal material, dark keyline and thin directional highlight. Neutral diamond identifies catalog-linked signals. Attention ordering and existing visual size treatment remain unchanged.
- Selected: one halo, one ring and a NOW → signal guide using the canonical display override. No separate coordinate engine.

Entry fades take 300–320ms; Local perimeter enters in 220ms and selection in 140ms. Existing 220ms point and 240ms camera transitions retain truthful range/mode positions. Hover reinforces opacity/keyline only. Reduced motion removes entry/selection animation and minimizes existing transitions. Keyboard focus, Enter selection and Escape focus restoration pass.

## Responsive and engine evidence

The approved sizing and workspace geometry were retained: approximately 340px SVG at viewport 390, 608px at 1440 and 672px at 1920. Larger viewports use finer label hierarchy and additional perimeter ticks. Mobile uses readable labels and fewer fine ticks. The complete instrument is visible in isolated screenshots; workspace viewport screenshots retain normal page scrolling and the approved Selected sheet.

Chromium and WebKit tested at 320, 344, 360, 375, 390, 393, 414, 430, 480, 768, 1024, 1280, 1440, 1600, 1728 and 1920: 160 mode/range states, circular geometry, no horizontal overflow, no clipped labels, reachable controls and unchanged marker/hit geometry.

Pure engine comparison: 60 source records across 24H/7G/30G; exact equality for id, x, y, radiusRatio, ageHours, cluster, attention size and attention. All 23 tracked `lib/radar` files and the pointer resolver are byte-identical. Rendered before/after comparison: 1024 markers across 160 states, exact equality of ids, group positions, dot centres/radii, hit radii and accessible labels. **Position delta = 0.**

256 physical selections: **wrongSelection = 0**. All captured timestamps satisfy their range: **rangeViolation = 0**. No browser page errors. Hover centre delta is zero. The guide uses full canonical endpoint precision; WebKit rounds CSS transform serialization, accounted for only in the guide DOM string check.

## Validation

- 25 existing test files / 316 tests passed: Radar temporal scale, Local focus, projection, geometry/hits, data/API, UI actions, auth intent and dock contract.
- Three new renderer tests passed: display override guide endpoint, unchanged centres/hit radius under selection/catalog identity, absent selected signal.
- Chromium + WebKit action checks passed: Global, Local, Selected, close, Panoramica, ranges, keyboard, Watch, external CTA; fixture-only catalog CTA, Save and Compare.
- Loading, empty, error, missing-token, stale, Per Te and guest gate checks passed.
- 30 axe scans: no serious/critical violations. Six repetitions of the existing minor `aria-allowed-role` finding on the frozen Selected panel.
- `tsc --noEmit`, focused ESLint with zero warnings, `git diff --check` and production build passed. Build uses local cached fonts and dummy localhost services; no production writes.
- Global style ownership still fails on existing unrelated cascade/token/Compare issues. Before/after output is byte-identical; no added violation or `!important`.

## Artifacts and reproduction

[Instrument contact sheet](/Users/gianmariacaltagirone/.codex/visualizations/2026/10/10/01a12687-6dca-7710-99c5-bf2179659686/radar-instrument-v2/RADAR-INSTRUMENT-V2-CONTACT-SHEET.png) · [Isolated before/after](/Users/gianmariacaltagirone/.codex/visualizations/2026/10/10/01a12687-6dca-7710-99c5-bf2179659686/radar-instrument-v2/RADAR-INSTRUMENT-V2-BEFORE-AFTER.png) · [Workspace contact sheet](/Users/gianmariacaltagirone/.codex/visualizations/2026/10/10/01a12687-6dca-7710-99c5-bf2179659686/radar-instrument-v2/RADAR-INSTRUMENT-V2-WORKSPACE-CONTACT-SHEET.png).

All ten requested full workspace PNGs and isolated counterparts are in the same artifact directory. Before/after uses identical captured public snapshots, viewports and dimensions for Global/Local/Selected at 390 and 1440.

`scripts/qa/radar-instrument-v2.mjs` accepts `RADAR_QA_PHASE=before|after`, `RADAR_QA_BASE_URL` (localhost only), `RADAR_QA_SNAPSHOT_DIR` (day/week/month JSON), `RADAR_QA_OUTPUT_DIR` and optional `RADAR_QA_WIDTHS`. Capture baseline before renderer edits, then compare after. Browser contexts use a fictional local account and intercepted services. QA JSON, snapshots, logs and the temporary integrity/motion checks are preserved in the artifact directory.

## Remaining objective limits

The frozen Watch store preserves durable monitoring data but omits its display on reload; verified in both engines at 390/1440. The minor Selected ARIA warning and global style ownership debt predate this renderer pass. No new instrument defect was found. Automated WebKit does not certify performance on physical mobile Safari. Live Product Hunt linkage was absent in the captured snapshot; linked actions were separately checked with the explicitly labelled development fixture.

Stop for human visual review. No push. No deploy.
