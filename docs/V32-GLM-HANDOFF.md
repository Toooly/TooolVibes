# V3.2 GLM Handoff

## EDITORIAL SYSTEM
- Prose UI rejected (spike SHA `72160b9`): parity scores 101 vs 100, wins portable, dependency unjustified.
- Ideas backported natively into `styles/guides.css` (rhythm ladder, brass blockquote, link focus, HR tick, table/callout spacing calibration).
- Final native commit: be54801 `feat(ui): enhance native editorial prose system`.
- No production dependency. Pipeline unchanged (DB markdown → react-markdown → sanitize → ::: → TOC → GuideMarkdown).
- Screenshots: `.tmp-qa/v32/native-editorial/` (gitignored dev evidence).
- Remaining Guide work: none unless real bug. Known pre-existing: 17 `.guides-article__body > .editorial-markdown` selectors never match production nesting (dead rules, P7 intent) — follow-up decision (wire-up vs delete) belongs to main V3.2 pass, not this backport.
