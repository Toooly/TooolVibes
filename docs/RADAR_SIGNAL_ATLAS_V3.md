# Signal Atlas V3 — approved visuals and final interaction closure

Resolver commit: `87ff1cb0aa817b2070de8b9ea1292daff3bc6a50`.

Base SHA: `eabb40bda3cde621cfd66f231f62300f677d2bd8`, branch `main`. Human visual approval is complete. Release scope is two local commits: canonical hit priority, then the approved Atlas implementation. No push or deploy.

## Art direction

Concept C is the approved macro reference. The production map now defaults to an editorial temporal atlas: partial west-side time arcs, very dark annular territories, category perimeter identities, Anton coordinate numerals, product sans names and existing mono data labels. No complete grid rings, conventional bezel, spherical marker bodies, filters, Canvas, external fonts or continuous animation.

Global retains the fixed category geography and reports the complete snapshot count and active areas, independently of the representative count. Local renders a restrained broad territory in its category accent, the real cluster count and cluster identity. Selected adds the tool name, exact votes-plus-comments attention and truthful launch age. Its leader uses the same canonical display override as the painted signal. Annotation placement chooses the least occupied margin without moving signals.

The C glyph has two opposing clipped corners, a dark material body, category nucleus, lower datum edge and internal datum line. Visual mass uses the unchanged canonical drawn radius. Linked identity is a neutral small identifier; it does not use selection notches or gold. From B, only checkpoint ticks, non-scaling decorative line hierarchy and selected corner notches are retained.

At mobile sizes, count/range numerals are approximately 13% smaller than C; secondary perimeter/density inscriptions disappear while time labels and selected attention remain. Desktop restores category inscriptions, area counts and footer coordinates. Ultrawide adds perimeter legibility while preserving the approved instrument diameter and projection. The surrounding workspace is unchanged. Entry layers assemble in 220–330 ms, selected guidance in 140 ms; reduced motion disables these effects.

`RadarMap.instrumentRenderer` is an internal rollback seam defaulting to `atlas`. Passing `v2` renders the retained V2 visuals through the same engine and accessible controls. There is no renderer URL parameter, persistence setting or user-facing toggle. The existing V2 tests exercise this seam.

## Geometry and checks

- All 60 engine records across captured day/week/month snapshots match V2 exactly: id, x/y, radiusRatio, age, cluster, attention and attention size.
- All 23 engine files are unchanged. A 34-file hash audit covers existing engine/components/workspace tokens. The only authorized interaction exception moves visible-signal resolution ahead of empty-sector navigation and forwards physical sector-affordance taps through that same handler; sector keyboard entry is unchanged.
- Exact V2 DOM position strings, drawn radii, identities/order, accessible labels and hit radii match at all 16 widths for the five original reference states. Added Local/Selected week/month states retain canonical projection.
- 288 responsive states: 16 widths × nine range/mode combinations × Chromium/WebKit. No root overflow, clipped instrument text or changed circular coordinate field.
- Final physical hit matrix: 384 selections, including 96 direct Global representative taps. every visible Global representative in 24H/7G/30G, plus Local and Selected, at 390/1440/1920 in Chromium/WebKit. Zero wrong selections and zero misses. Mobile Selected hit-only checks use a taller viewport to expose all targets above the existing sheet; screenshot/responsive checks use 390 × 844.
- All 96 active-sector empty-area entries pass. Every active Global sector is also tested at a known empty point more than eight display units from all signal centres. Each tap opens the expected Local cluster; Panoramica restores Global. Background exploration remains available.
- Before the fix: zero wrong selections and six misses (Global 30G `tiun.` at three widths in both browsers). The same failure was reproduced in V2 and Atlas before editing. Its display centre is (11.2564326733, 49.1291929115), radius 38.7534, bearing 271.2876°. The outer-radius branch chose sector index 6 (`ai-agents`) before considering the single valid signal candidate: `tiun.` (`1199144`, Coding), distance zero, hit radius seven. The nearest other representative is AINA at distance 44.1575, outside the target. The adjacent empty category was then cleared by existing URL state handling.
- After the fix, the unchanged canonical display projection and deterministic resolver handle visible interactive signals first. Sector navigation is eligible only for `kind: none`; ambiguity uses the existing signal mechanism. There is no signal-id or range-specific production exception.
- The dedicated captured-fixture regression covers the rendered centre, offsets just inside/outside the hit radius, invisible/non-interactive exclusion, overlapping candidates, sector-affordance forwarding, sector keyboard entry and Local selection.
- No app runtime errors in the final paced browser runs. WebKit physical inputs are paced to avoid its history-mutation quota during automated rapid selection.
- Save, Compare, Compare Dock, Watch on/off, catalog CTA, external CTA semantics, keyboard, close, range controls, Trend, Per Te, Watchlist, compact/expanded mobile preview and reduced motion pass. Actions use a clearly local linked fixture and intercepted local account/workspace services; no production session or remote writes.
- Axe: zero serious/critical violations; the pre-existing minor preview `aria-allowed-role` remains. WebKit ignores the pre-existing `interactive-widget` viewport hint.
- 332 related unit tests plus one complete engine-integrity test pass. Targeted ESLint, `tsc --noEmit` and the production Next.js build pass. The validation build uses localhost QA auth configuration and the existing cached fonts; it is not a deployment.
- Maximum observed SVG cost: 145 nodes. Physical iPhone Safari performance has not been certified.

The V2 handoff's Watch hydration issue after reload remains outside this renderer scope; toggling Watch passes. No geometry engine, time scale, taxonomy, LOD, Local planner, state controller, auth or Save/Compare/Watch code was changed. Atlas visual source is byte-identical to the approved implementation outside the explicitly authorized pointer change.

## Evidence and reproduction

Artifacts: `/Users/gianmariacaltagirone/.codex/visualizations/2026/10/10/01a12687-6dca-7710-99c5-bf2179659686/radar-atlas-v3`.

The final evidence is in the sibling `radar-atlas-v3-final` folder: `RADAR-ATLAS-V3-FINAL.png` contains real browser rendering for 390 Global/Local/Selected, 1440 Global/Selected and 1920 Global. JSON/logs record before/after pointer traces, hit and empty-sector matrices, responsive checks, frozen geometry, and verification results. The earlier folder retains historical evidence of the inherited defect.

Use `scripts/qa/radar-atlas-v3.mjs` against localhost with captured public snapshots and the corresponding V2 `V2-DISPLAY.json` in the output directory. Set `RADAR_QA_BASE_URL`, `RADAR_QA_SNAPSHOT_DIR`, and `RADAR_QA_OUTPUT_DIR`; optional `RADAR_QA_WIDTHS`/`RADAR_QA_ENGINES` narrow the run. `RADAR_ATLAS_HITS=0` runs the responsive matrix separately. The script exits nonzero when the strict hit gate fails. Visible signal taps must inspect directly; no recovery through a category is allowed to mask a missed hit. Empty-sector navigation is verified separately.

## Release decision

The zero-miss gate is green. Commit `fix(radar): prioritize visible signal hits` contains only the priority correction and its regression; `feat(radar): implement signal atlas instrument` contains the approved visuals, Atlas tests, and QA/documentation. Production remains on the previously deployed V2 release. Stop for final physical iPhone Safari review before any push/deploy.
