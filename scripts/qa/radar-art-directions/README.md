# Radar instrument art-direction spike

Reference: `ab9d176f59c256c95311478e815d06f8ae5abc03` (V2). QA/design code only. No production route, renderer, engine, actions, auth or workspace changes. No winner selected. No push or deploy.

Run `node scripts/qa/radar-art-directions/serve.mjs`, then open `http://127.0.0.1:3130`. The A/B/C and Global/Local/Selected controls switch isolated, approved state fixtures. They do not replace product state logic. Local fonts come from the existing `.next/static/media` build; run the normal project build if those cached fonts are absent. The server binds only to localhost, serves an explicit file allowlist and exposes no API.

## A — Orbital Cartography

**Thesis:** an open temporal atlas, with interrupted orbital tracks and angular cartographic glyphs instead of complete rings and solid dots.

**Proprietary vocabulary:** violet time-band fragments, eight category landmarks, asymmetric frame and a hexagonal signal with a calibrated central nucleus. Local opens a single analytical arc; inspection reveals the signal name, real age/attention and perimeter bearing through an orthogonal annotation.

**Strengths:** recognizable open silhouette; negative space separates the instrument from a traditional radar; large attention markers become structured envelopes. **Weaknesses:** fragmented rings require more effort to extrapolate radial age; the hexagonal language can feel technical. **Mobile risks:** landmarks are suppressed, leaving the colored perimeter and temporal labels to orient the user; weak lines need device contrast review. **Desktop strengths:** sector names and inspection readouts add spatial detail without moving signals. **Implementation complexity:** medium, mainly segmented SVG arcs and annotations. **Performance:** 99–114 SVG nodes in this fixture; static paths, no filters, render loop or infinite animation.

## B — Precision Observatory

**Thesis:** a dark optical plate with incised calibration and data that read as observed measurements.

**Proprietary vocabulary:** a restrained lens well, split temporal reticle, fine mechanical ticks and datum envelopes with a small solid core. Local becomes a single-category lens. Selected uses corner brackets, a bearing line and a separate readout rather than a larger ball or bullseye.

**Strengths:** disciplined line hierarchy and readable datum centres; strong sense of containment and optical material. **Weaknesses:** retains more circular construction than A/C and carries the greatest resemblance to scientific instruments; it needs restraint to avoid a HUD aesthetic. **Mobile risks:** fine ticks and datum notches are less salient at small sizes; every second fine tick and numeric inspection detail are suppressed. **Desktop strengths:** layered edge lighting and calibration detail benefit from full diameter. **Implementation complexity:** medium, with the largest decorative SVG surface. **Performance:** 215–226 SVG nodes, one static radial gradient, no blur/filter stack or continuous motion.

## C — Signal Atlas

**Thesis:** an editorial market map organized by territory, typography and spatial annotation.

**Proprietary vocabulary:** TooolVibes' Anton display numerals, partial tinted category territories, count-weighted perimeter marks, horizontal editorial data glyphs and a displaced time legend. Local shows a single broad territory. Selected exposes the real attention value in a typographic callout.

**Strengths:** distinctive thumbnail, strong information hierarchy and clear separation from glossy signal balls. **Weaknesses:** filled territories carry more visual weight; rectangular glyph envelopes can make radial position less intuitive. The grouping bracket denotes a shared category, not a relationship/history network. **Mobile risks:** sector names, secondary counts and numeric inspection readouts are removed; the selected name and radial-time checkpoints stay visible. **Desktop strengths:** real cluster counts and attention callouts become part of the object. **Implementation complexity:** medium; responsive annotation placement will require more care if used with long names or different data distributions. **Performance:** 78–93 SVG nodes, flat fills and strokes, no gradient/filter stack or render loop.

## Geometry and validation

`data.json` contains the original V2 visible identities/order/radii and full-precision positions exported through the unchanged `buildRadarView`, `layoutRadarPoints` and `planRadarLocalFocus` functions. Temporal checkpoints also come from `radarRingLabels`. The browser variants consume this shared fixture; they contain no time projection, collision, representative selection or Local planner implementation.

The source is the same captured public Product Hunt day snapshot used by V2, with original timestamps. Global uses its seven visible representatives for 20 source signals; Local/Selected use all eight Development signals. Count annotations derive from that snapshot. Source attention is votes + comments. The snapshot contains external signals only; all three renderers retain a neutral, non-gold linked-identity branch, but linkage is not invented for the presentation.

`RADAR_SPIKE_OUTPUT=/absolute/artifact/path node scripts/qa/radar-art-directions/qa.mjs` checks 36 states (three concepts × three modes × two viewports × Chromium/WebKit), 276 marker records, exact canonical x/y/radius/cluster/status and exact CSS transforms against the corresponding V2 browser baseline. It also checks painted transform placement, circular 340/608px instruments, no overflow or clipped annotations, decorative aria/pointer isolation, console health and absence of SVG filters. **Signal centre delta = 0.** All 34 frozen production files retain their SHA-256 hashes. The viewport screenshots include the QA selector; isolated screenshots contain only the instrument.

Safari live was opened in a separate tab; A/B/C switching and Selected were inspected. Chromium/WebKit validation passes. This is a visual spike: no physical mobile frame-rate certification, dense-data collision/annotation certification or production action wiring is claimed. Production V2 remains unchanged, so its approved behaviour remains available.

## Review artifacts

Artifacts are outside the repository in the task's `radar-art-directions` visualization directory:

- `RADAR-CONCEPTS-A-B-C.png`: columns A/B/C, rows Global/Local/Selected, desktop captures.
- `RADAR-CONCEPTS-A-B-C-390.png`: the same matrix using actual mobile captures.
- `RADAR-CONCEPTS-V2-COMPARISON.png`: V2 beside A/B/C in all three modes.
- `RADAR-CONCEPT-{A|B|C}-{390|1440}.png`: six full-size Global views with QA selectors.
- Additional `-LOCAL`, `-SELECTED` and `-{MODE}-ISOLATED` captures retain every concept/state at both widths.
- `RADAR-CONCEPTS-QA.json`: per-state geometry, transforms, labels, node counts and browser checks.

No objective accessibility or performance blocker was found in the tested fixture. Each concept has different tradeoffs; none is recommended as the winner. Stop for human art-direction selection.
