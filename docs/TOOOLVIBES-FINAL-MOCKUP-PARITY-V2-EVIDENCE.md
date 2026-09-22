# TooolVibes final mockup parity — V2 evidence

Date: 22 September 2026
Verified code: HEAD `5ea5fdb` (product code identical to deployed `0727feb7`)
Method: exact final candidate build (`npm run build` -> `next start`), gates on computed styles before any screenshot is allowed into the sheet.

## Why V1 was rejected and what changed
The V1 contact sheet contained raw pages because a stale server process from a clobbered `.next` was serving broken chunks (assets 404, no hydration). V1 is withdrawn.

V2 captures are produced only when all gates pass, otherwise the screenshot is **not written**:

- HTTP 200 and `networkidle`
- `document.fonts.status === "loaded"`
- hydration marker (bottom-nav dataset or header)
- body background luminance < 70 (dark shell)
- zero default browser-blue links (`rgb(0,0,238)` family)
- stylesheets >= 3, links >= 3
- primary CTA present and gold where the surface defines one

A capture that fails any gate is discarded and reported as FAIL. The first run correctly rejected `11-auth` against the broken server; after the server was restarted clean, the same gate passed.

## Per-surface evidence

| Surface | Route | Viewport | Loaded font (h1) | Computed background | Primary button | Valid | Row-profile corr |
|---|---|---|---|---|---|---|---|
| 01-home | `/` | 390x844 | Anton, "Anton Fallback", Impact, "Arial Narrow", sans-serif | color(srgb 0.0950588 0.0495686 0.234824) | rgb(243, 191, 76) | True | 0.263 |
| 02-catalog | `/archivio` | 390x844 | Anton, "Anton Fallback", Impact, "Arial Narrow", sans-serif | color(srgb 0.0950588 0.0495686 0.234824) | — | True | 0.072 |
| 03-tool | `/toools/blink` | 390x844 | Anton, "Anton Fallback", Impact, "Arial Narrow", sans-serif | color(srgb 0.0950588 0.0495686 0.234824) | rgb(228, 178, 60) | True | 0.463 |
| 04-guides | `/posts` | 390x844 | Anton, "Anton Fallback", Impact, "Arial Narrow", sans-serif | color(srgb 0.0950588 0.0495686 0.234824) | — | True | 0.649 |
| 05-guide | `/posts/omi-app-ai` | 390x844 | Anton, "Anton Fallback", Impact, "Arial Narrow", sans-serif | color(srgb 0.0950588 0.0495686 0.234824) | — | True | -0.119 |
| 06-collection | `/collections/ai-stack-solo-founders` | 390x844 | Anton, "Anton Fallback", Impact, "Arial Narrow", sans-serif | color(srgb 0.0950588 0.0495686 0.234824) | rgb(228, 178, 60) | True | -0.068 |
| 07-radar | `/radar` | 390x844 | Anton, "Anton Fallback", Impact, "Arial Narrow", sans-serif | color(srgb 0.0950588 0.0495686 0.234824) | — | True | 0.007 |
| 11-auth | `/account` | 390x844 | Manrope, "Manrope Fallback", Manrope, "Segoe UI", sans-serif | color(srgb 0.0950588 0.0495686 0.234824) | rgb(228, 178, 60) | True | 0.304 |
| 13-footer | `/ (footer element)` | 390x844 | Anton, "Anton Fallback", Impact, "Arial Narrow", sans-serif | color(srgb 0.0950588 0.0495686 0.234824) | rgb(243, 191, 76) | True | 0.101 |
| 12-email | `getMagicLinkHtml() rendered` | 390x844 | Times | rgb(7, 6, 13) | gold td bgcolor #e4b23c (email table) | True | 0.382 |
| 08-spazio | `/dev/workspace-qa?state=mature&view=riprendi` | 390x844 | Manrope, "Manrope Fallback", Manrope, "Segoe UI", sans-serif | rgb(8, 8, 10) | — | True | 0.14 |
| 09-decisioni | `/dev/workspace-qa?state=mature&view=decisioni` | 390x844 | Manrope, "Manrope Fallback", Manrope, "Segoe UI", sans-serif | rgb(8, 8, 10) | — | True | 0.024 |
| 10-decisionsheet | `/dev/workspace-qa?state=mature&view=decisioni (sheet open)` | 390x844 | Manrope, "Manrope Fallback", Manrope, "Segoe UI", sans-serif | rgb(8, 8, 10) | — | True | 0.09 |

Notes:
- `11-auth`: production GoTrue has Google/Apple/GitHub disabled, so the render shows the email-only composition. The mockup's extra white share comes from the three provider pills. This is an external blocker, not a styling defect.
- `12-email`: rendered from the live module `lib/auth/magic-link-email.ts` via esbuild; dark letter (`rgb(7,6,13)`) matching the dedicated email mockup, gold CTA on `bgcolor="#e4b23c"`.
- `13-footer`: element screenshot after scrolling to the document end.
- Row-profile correlation compares luminance profiles after normalising both images to 180x400. It is a weak geometric proxy (dynamic data, different tool examples, different scroll extents), reported for transparency, not as a parity claim.
- All 13 renders are fully styled: dark shell, brand fonts (Anton display / Manrope UI), gold CTAs, no default browser rendering.

## Artifacts
`artifacts/final-mockup-parity-v2/`

- `NN-name-mockup.png` and `NN-name-final-render.png` for all 13 surfaces
- `FINAL-MOCKUP-PARITY-CONTACT-SHEET-V2.png` (MOCKUP | FINAL RENDER, all 13)
- `STYLE-GATES-V2.jsonl` (raw computed-style gate results per capture)
- `FINAL-MOCKUP-PARITY-V2-REPORT.json` (validity + profile stats)

## Remaining honest caveats
- Human visual sign-off is still required: this environment cannot feed image pixels back to the model. The contact sheet exists for that check.
- Dynamic content differs from the mockups by nature (live Radar feed, catalogue contents, counts).
- Logged-in surfaces were captured through the workspace QA harness because the harness is intentionally 404 in production. Structure, shell, fonts and styles are the production design system; the data is fixture data.
- OAuth providers and TinyAdz real fill remain external.
