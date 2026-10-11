# Signal Atlas V3.6 — final Beacon hierarchy

Base: `0eba84737e30b8d9b945468b4a1a1768e408dee0`. Local main only; no push or deployment. Final SHA and completed gates are recorded in the artifact handoff.

The Local field now expresses the existing canonical `attention` ranking through three visual tiers. Stable ID resolves equal attention. The highest-attention Tool is Primary, the next three are Secondary, and all remaining signals are Ambient. There is no new score. Global retains its existing representative treatment and one real lead per active territory.

Primary has a taller asymmetric material body, larger nucleus/identity, brighter restrained keyline and more precise datum. Secondary uses medium material mass and readable identity. Ambient uses 73% of the previous body dimensions, quieter contrast and a visible real mark or initial. Primary is not Selected: the violet corner frame and approved callout remain selection cues. No glow or aura was added.

Each tier stays inside its unchanged canonical circular envelope, including the body keyline. Canonical marker radii, centres, Local display angles, temporal radii, time scale, projection, hit circles and signal-first resolver are unchanged. The constellation planner, Global territory renderer, parent state architecture and Selected callout function are frozen. Image success or failure changes identity artwork only.

Local identity uses the real thumbnail artwork already supplied by the source contract. Images start transparent over a deterministic Unicode initial. Successful load reveals the image; error removes the image and preserves the initial. Missing, invalid or pending images never expose broken-image UI. No favicon inference, extra data fetch model, dependency or image-dependent geometry was introduced. Global artwork remains unchanged.

Editorial names identify the Primary and, if there is safe space, the strongest Secondary. Names are limited to sixteen characters. The native SVG text metrics determine their physical footprint; a finite deterministic search finds space inside the territory rim, avoiding canonical Beacon envelopes, temporal labels, metadata and Selected text/leader. Leaders are thin and avoid other signals. The Selected callout supplies the name when that same Tool is selected, so its editorial name is not duplicated. Secondary names are omitted when space is insufficient. Font completion and instrument resize trigger measurement; selection never moves signals.

At the captured 390 px 24H Coding field, Primary body size is **33.68 × 32.19 px**, Secondary **21.81–22.36 × 19.91–20.41 px**, and Ambient **15.68–16.05 × 12.43–12.73 px**. The Primary body is taller than V3.5, while the weaker signals are quieter rather than uniformly enlarged. Real source artwork is visible on all eight Tools in the reference capture. The minimum gap between conservative painted-body circles, including the keyline, is **18.742660 px**; all are contained inside the canonical envelopes whose approved clearance floor remains 14 px.

Including the actual keyline, visible material bounds at 390 are Primary **35.08 × 33.59 px**, Secondary **23.61–24.16 × 21.71–22.21 px**, and Ambient **17.08–17.45 × 13.83–14.13 px**.

At 1440 px, Primary is **60.23 × 57.57 px**, Secondary **39.00–39.98 × 35.60–36.49 px**, and Ambient **28.03–28.71 × 22.23–22.77 px**. Primary/Secondary label typography and real identity benefit from the larger physical instrument. The relative masses remain different. Painted-body clearance in this reference field is **42.635158 px**.

## Validation and artifacts

The browser gate retains the V3.5 all-signal/all-territory checks. Setting `RADAR_BEACON_HIERARCHY=1` adds tier-size and label-overlap measurements, asserts one Primary and at most two names, checks persistent Primary identity, and compares every Global and Local display transform with the supplied baseline. Canonical hit radii and attention sizes remain equal. V3.6 uses the prior V3.5 `AFTER-DISPLAY.json` as its baseline, stored under the existing `V2-DISPLAY.json` compatibility filename.

Completed gates: **346 tests** (345 repository tests plus canonical integrity audit), final targeted rerun **22 passed**, **744** correct physical signal selections, **96/96** empty-territory entries and **96/96** keyboard entries, with zero misses/wrong selections. Canonical gap minimum: **14.004712 px**, zero Beacon overlaps. The responsive matrix has **108 states**, including **72** hierarchy/label checks. Axe covers 54 states with zero serious/critical findings and the existing minor preview issue in 18 Selected states. Global 390/1440 images are pixel-identical to V3.5. The last WebKit 1920 matrix was rerun independently after correcting stale post-Local hover coordinates in the test; the final report aggregates only completed green viewport matrices.

The matrix covers Chromium and WebKit, all three ranges, and 390, 430, 768, 1024, 1440 and 1920. Physical signal and territory gates run at 390, 1440 and 1920. Unit tests include attention ordering/ties, image success/failure without geometry change, independent Primary/Selected state, deterministic safe labels and hidden names when space is unavailable. Existing `tiun.` and boundary/ambiguity regressions remain part of the suite.

The source-integrity audit compares all 60 canonical source records and the original engine hashes/resolver. The V3.6 freeze audit additionally checks the constellation planner, parent component, Global territory function and Selected callout function. The Global reference screenshots at 390/1440 are compared pixel by pixel.

No scope expansion fixes the existing minor `aria-allowed-role` on the Selected preview aside or the previously documented unrelated global style-ownership baseline. WebKit automation does not certify a physical iPhone/Safari session. The optimized Next.js build and scoped lint pass. Final typecheck and ending SHA are recorded in `HANDOFF.md` with the raw logs. The local build uses the existing cached Google-font responses and QA account environment, and records the base SHA before the local commit.

Changed production files: `components/radar/radar-atlas.tsx`, `components/radar/radar-map.tsx`, `styles/radar-full.css`, `lib/radar/radar-atlas-beacons.ts`. Validation: `__tests__/lib/radar/radar-atlas-beacons.test.tsx`, `scripts/qa/radar-atlas-v35.mjs`; this document records the closure.

Evidence directory:

`/Users/gianmariacaltagirone/.codex/visualizations/2026/10/10/01a12687-6dca-7710-99c5-bf2179659686/radar-atlas-v36`

- `RADAR-ATLAS-BEACON-HIERARCHY.png`: same data, range and centres, V3.5 vs V3.6 at 390/1440, Local/Selected.
- `RADAR-ATLAS-BEACON-LOCAL-{390,1440}.png`.
- `RADAR-ATLAS-BEACON-SELECTED-{390,1440}.png`.
- Visible-mass measurements, freeze audit, browser reports, build/typecheck/lint/test logs and final handoff.

Stop for final human visual review after the local commit.
