# V3.2 GLM Handoff

## EDITORIAL SYSTEM
- Prose UI rejected (spike SHA `72160b9`): parity scores 101 vs 100, wins portable, dependency unjustified.
- Ideas backported natively into `styles/guides.css` (rhythm ladder, brass blockquote, link focus, HR tick, table/callout spacing calibration).
- Final native commit: be54801 `feat(ui): enhance native editorial prose system`.
- No production dependency. Pipeline unchanged (DB markdown → react-markdown → sanitize → ::: → TOC → GuideMarkdown).
- Screenshots: `.tmp-qa/v32/native-editorial/` (gitignored dev evidence).
- Remaining Guide work: none unless real bug. Known pre-existing: 17 `.guides-article__body > .editorial-markdown` selectors never match production nesting (dead rules, P7 intent) — follow-up decision (wire-up vs delete) belongs to main V3.2 pass, not this backport.

## MAIN IMPLEMENTATION PASS (eed40ea → a75e219)
- P0/P1 hardening: 117 real-touch matrix checks (72+45) across 320–768, zero errors. Fixed: shortlist mobile cover-link swallow (shortlist.css), compare dock 6px tuck (compare.css), gated-prerender provider crash (marketing layout).
- Home: cockpit system strip (real counts) + lens tab voice. Catalog: lead-row span ≥600px. Tool: 'In breve' ivory judgment voice. Collections/Radar/Guides/Institutional/Shop: verified, no changes (data-driven sparseness, prose frozen).
- Footer: utility enriched (logo/value/contact/3-col) + launchpad 48-axis + family tile rails. Chrome: data-family route markers (6px dot), header dark.
- E2E: baseline public 9/9; gated chromium 11/12 (3 stale specs fixed; `/` coming-soon + archivio-redirect limits are architectural, documented); shell-390 2/2 PASS. touch-390 blocked by environmental renderer crash (proven on pristine v3.1 baseline; behaviors covered by matrices).
- Gates: check:styles, lint:ci, tsc, vitest 2926, build plain + E2E-env — all green.
- Evidence: `.tmp-qa/v32/shots/after-main/` (contact sheets 390/768/1440/1920), `pairs/` (10 before/after), responsive matrix 180/180 ox=0.
