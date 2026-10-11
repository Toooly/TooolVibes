# Signal Atlas V3.5 — territories and beacons

Base: `d780c49e72a249831cfbe79bc350c964e2401c9f` (Atlas V3). Frozen interaction resolver: `87ff1cb0aa817b2070de8b9ea1292daff3bc6a50`.

## Visual decision

Both alternatives were rendered in the real local Radar at 390 and 1440, in Global, Local and Selected, using identical captured public Product Hunt snapshots, original source timestamps, territories and constellation positions. A used a thin cartographic outline; B uses an asymmetric material Beacon. B was selected before the complete QA matrix. No alternative switch remains in production.

The comparison favoured B for five observable reasons: its quiet filled mass keeps Global territory captions dominant; the asymmetric silhouette is distinguishable from a generic diamond; its facet and nucleus remain legible at mobile size; its body area expresses attention more clearly than A's outline; its separate datum accommodates catalog identity without adding another badge. Both preserve canonical attention ordering and interaction geometry. The final implementation subsequently refined the common Selected leader routing and territory label placement; the A/B board intentionally records the original decision, while the final contact sheet records the shipping result.

A Beacon combines an asymmetric five-point body, restrained facet, category nucleus, real Unicode initial, keyline and short datum. Body and nucleus scale with the canonical attention radius, so area increases with attention. Catalog-linked signals have paired neutral datum ticks; external signals have a broken endcap. These cues are independent of the violet Selected corner frame. No catalog gold, image dependency or halo was introduced. Existing category colours, including Coding amber, retain their taxonomy meaning.

## Territories and interaction

Global shows exactly one real lead per active cluster. All real tools remain available in Local and the existing lists. Active territories expose their real category, count and arrow persistently; mobile uses compact captions and desktop uses full captions. Hover and keyboard focus strengthen the territory edge and fill. Inactive territories remain context only.

Each active SVG territory is a named semantic button. Enter and Space open its Local cluster. The transparent sector target forwards physical pointer events to the unchanged canonical resolver: visible signal selection takes precedence, followed by valid empty sector fallback. No new pointer resolver, hit-radius change, camera transform or Global signal-centre adjustment was added. Label slots may move inside their own territory to avoid the visible leads and instrument metadata.

The territory transition lasts 280 ms and changes opacity only. Reduced-motion support remains intact. Selected retains the established attention/age callout, radial guide and a single routed leader; its label and leader choose an unoccupied margin without moving signals.

## Constellation and temporal truth

`planRadarAtlasConstellation` changes only Local display angles. It ranks real signals by canonical attention radius, temporal radius and stable ID; uses irregular alternating anchors; obtains a feasible seed from the existing all-pair solver; and performs at most eight deterministic angular optimization passes. Each accepted candidate preserves the 14 px physical edge-clearance floor. A weighted mass moment encourages distribution without enforcing a uniform clock. The actual measured instrument width determines physical clearance. Selection is not an input.

For every node, `semanticRadius === focusDisplayRadius === 42 * radiusRatio`. Original semantic angles, time scale, ages, attention and source coordinates remain unchanged. Same data, range and instrument dimensions produce the same layout, independently of input order or selection. Physically impossible inputs retain an explicit residual-collision result and the existing fallback; they are not presented as successful packings.

The captured 24H Coding batch shares one source launch time. Its equal radii therefore form a circular temporal locus with irregular angular spacing. Inventing different depths would violate temporal truth. The 7G and 30G snapshots contain different launch ages and show different radial depths.

## Evidence and validation

QA uses captured public snapshots, with account services intercepted only on localhost. It does not write remote workspace data. Chromium and WebKit cover all ranges and Global → Local → Selected → close → Panoramica. Every visible representative and every tool in every active Local cluster receives a physical click, with exact expected-name checks and unchanged display transforms after selection. The completed interaction matrix records 744 correct signal selections, 96 empty-sector entries and 96 keyboard entries, with zero misses or wrong selections. After the final label refinements, 128 additional physical taps on counts and arrows at 390/1440 in Chromium/WebKit and all ranges also open the correct territory with no preview or miss. Each active territory receives an empty-sector click and keyboard entry, including visible-focus checks. The `tiun.` regression retains centre, inside/outside boundary and ambiguous-hit assertions.

The responsive matrix covers 320, 344, 360, 375, 390, 393, 414, 430, 480, 768, 1024, 1280, 1440, 1600, 1728 and 1920 in both engines: 288 main states. It verifies bounds, square instrument, labels, controls and physical Local separation. The final rerun also checks 96 Global territory-caption states against painted Beacon bounds, including the keyline. Minimum observed Local gap in the complete interaction matrix: **14.004712 px** (responsive-only minimum: **14.055875 px**), with zero Beacon overlaps. Browser matrix projection error is at most **0.000003961 SVG units** from native SVG matrix precision; planner radial-field delta is exactly zero. The canonical 60-record source comparison has zero delta, all 23 existing engine files retain their hashes, the pointer handler is byte-identical, and 33 protected engine/workspace/style files retain their hashes.

Unit validation: 340 repository tests, plus two captured-data/integrity audits. The real snapshot audit covers 16 active range/cluster combinations at the conservative 256 px reference, with minimum gap 14.102960 px. New tests cover temporal-radius equality, deterministic input order, irregular composition, range recomputation, honest impossible packing, semantic territories, keyboard entry and independent Beacon identity/selection cues.

Accessibility has no serious or critical findings in the inspected instrument. Axe still reports the previously documented minor `aria-allowed-role` on the existing `.tv-rx-preview` aside in Selected; this closure does not change that workspace preview contract. WebKit automation is not a physical iPhone/Safari certification.

The additional style-ownership check fails on existing release-entry ordering, global token declarations and Compare `!important` counts outside this patch. Those files were not changed; this unrelated baseline remains open.

The optimized Next.js production build, final `tsc --noEmit`, scoped ESLint with zero warnings, and the final 22-test renderer/hit/integrity rerun all pass. The build used the existing cached Google-font responses and local QA account environment. It is compilation evidence; no Cloudflare deployment was requested. Completed interaction totals and the ending SHA are also recorded in the evidence handoff. This is a local-main review candidate: **no push and no deploy**.

## Files and review artifacts

Production scope: `components/radar/full-radar-experience.tsx`, `components/radar/radar-atlas.tsx`, `components/radar/radar-map.tsx`, `styles/radar-full.css`, and `lib/radar/radar-atlas-constellation.ts`. Tests: `__tests__/lib/radar/radar-atlas-constellation.test.ts`, `__tests__/components/radar/radar-atlas-territories.test.tsx`. Repeatable browser gate: `scripts/qa/radar-atlas-v35.mjs`.

Evidence directory:

`/Users/gianmariacaltagirone/.codex/visualizations/2026/10/10/01a12687-6dca-7710-99c5-bf2179659686/radar-atlas-v35`

- `RADAR-ATLAS-BEACONS-A-B.png`: real-browser alternative comparison.
- `RADAR-ATLAS-TERRITORY-BEACON-CONTACT-SHEET.png`: final six-state contact sheet.
- `RADAR-ATLAS-V3-VS-TERRITORY-BEACON.png`: same-data/range before and after.
- `RADAR-ATLAS-TERRITORIES-GLOBAL-{390,1440}.png`.
- `RADAR-ATLAS-CONSTELLATION-LOCAL-{390,1440}.png`.
- `RADAR-ATLAS-BEACON-SELECTED-{390,1440}.png`.
- QA JSON, source-integrity audit, build/typecheck/lint/test logs and `HANDOFF.md`.

Local QA inputs remain in `.tmp-qa/radar-snapshots`, with the original `.tmp-qa/instrument-engine-before.json` semantic baseline and a per-output `V2-DISPLAY.json` display baseline. The browser gate accepts `RADAR_QA_SNAPSHOT_DIR`, `RADAR_QA_OUTPUT_DIR`, `RADAR_QA_WIDTHS` and `RADAR_ATLAS_HITS=0` for a responsive-only run. These local inputs and unrelated audits are preserved rather than staged.
