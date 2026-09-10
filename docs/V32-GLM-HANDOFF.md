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

## V3.2 RELEASE (v3.2.0 → 88b103a)
- Final polish: catalog podium indexing (01-03 strong / 04+ subdued), chrome loop node, collections workflow rails, radar signal trace (verified on 5 live nodes in prod), compare brass decision voice. Shortlist/account audited already family-correct.
- Gates: check:styles ✓ lint:ci ✓ tsc ✓ vitest 2926 ✓ build 151 ✓ E2E baseline 9/9 ✓ shell-390 2/2 ✓ (touch-390 environmentally blocked, documented). Responsive 180/180 ox=0. Interaction regression 9/9.
- Released: push 9dafa03..88b103a, Cloudflare worker tooolvibes version 8214f525-0e49-433f-b5bc-28aa9a464da4, prod SHA verified 88b103a stable at T+60s/T+120s/final. Production smoke 22/22 (390+1440, 11 routes): H1 correct, ox=0, banner 1, footer present, 0 page errors, 0 first-party 4xx/5xx. Guest interactions: card tap→detail, save toggle, radar live nodes OK.
- Tag v3.2.0 → 88b103a pushed. RELEASE FROZEN.

## V3.3 BACKLOG (non-blocking)
- Radar feed data quality: consumer Apple products + 'Dato non disponibile' placeholders in live data.
- 17 dead `.guides-article__body > .editorial-markdown` selectors (wire-up vs delete).
- Archivio soft-gate question: anonymous /archivio serves catalog with gate=1 (product decision).
- vibes-3d-maestoso dead weight (214 unused classes).
- touch-390 Playwright runner renderer crash (environmental — bisect-proven on pristine v3.1).
