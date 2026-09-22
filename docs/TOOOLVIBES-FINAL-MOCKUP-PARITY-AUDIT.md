# TooolVibes final mockup parity audit

Date: 22 September 2026  
Base before this pass: `b6e01e9` (deployed)  
This pass: presentation-layer rebuild toward the final mockups. Functional logic untouched.

## Method

The numbered final concept board was treated as the implementation specification. Every surface was measured in the browser against the mockup composition: section order, block count, card anatomy, tab geometry, CTA placement and color, reading measure, footer density.

Screenshots: `artifacts/final-mockup-parity/` (390 and 1440 per surface, plus logged-in harness). Browser metrics: `artifacts/final-mockup-parity/metrics.jsonl`.

## Parity matrix

### 01 Home / TOOL
- Reference: Home TOOL state, pill segmented control, compact editorial card, gold CTA
- Route: `/`
- Components changed: `styles/mockup-parity.css`, `styles/release-entry.ts`
- Differences remaining: hero keeps the approved brand headline; dynamic tool identity substituted
- Functional differences: none
- Parity: **PASS**

### 02 Catalogue
- Reference: "Trova i tool da valutare.", scan-first rows, two columns on desktop
- Route: `/archivio`
- Components changed: `components/archive/definitive-archive.tsx` (headline), `styles/mockup-parity.css`
- Differences remaining: live result counts differ from mockup numbers
- Functional differences: none
- Parity: **PASS**

### 03 Tool detail
- Reference: gold primary action, secondary visit, icon save, score line
- Route: `/toools/[slug]`
- Components changed: `styles/mockup-parity.css` (CTA grammar, radii)
- Differences remaining: section nav uses production labels
- Functional differences: none
- Parity: **PASS**

### 04 Guide list
- Reference: cream cards on night shell, pill filters, category + read-time metadata
- Route: `/posts`
- Components changed: `styles/mockup-parity.css`
- Differences remaining: live guide inventory
- Functional differences: none
- Parity: **PASS**

### 05 Guide article
- Reference: framed cream reading column, breadcrumb, TOC, related end cards
- Route: `/posts/[slug]`
- Components changed: `styles/mockup-parity.css` (68ch measure, frame radius)
- Differences remaining: media treatment depends on each guide
- Functional differences: none
- Parity: **PASS**

### 06 Collection
- Reference: hero metadata row, section nav, ordered numbered stack, gold primary action
- Route: `/collections/[slug]`
- Components changed: `components/collections/collection-detail-hero-v4.tsx`, `styles/mockup-parity.css`
- Differences remaining: CTA is "Avvia questa raccolta" (honest action) rather than the mockup "Duplica"
- Functional differences: none
- Parity: **PASS**

### 07 Radar
- Reference: cyan semantic accent, ranked rows, tabular metrics, compact metadata line
- Route: `/radar` and Home RADAR state
- Components changed: none beyond shared tab/card grammar
- Differences remaining: live signal data
- Functional differences: none
- Parity: **PASS**

### 08 Spazio
- Reference: compact welcome, resume-first modules, no KPI dashboard
- Route: `/account` (authenticated)
- Components changed: shared surface treatment through `styles/mockup-parity.css`
- Differences remaining: verified through the workspace QA harness, not a production session
- Functional differences: none
- Parity: **PASS**

### 09 Decisions
- Reference: filter chips, status rows, reason + date, history
- Route: `/account?view=decisioni`
- Components changed: shared chip/card grammar
- Differences remaining: live decision data
- Functional differences: none
- Parity: **PASS**

### 10 Decision sheet
- Reference: light elevated sheet over the dark app, state selector, reason chips, note, confirm
- Route: decision editor in workspace
- Components changed: `styles/mockup-parity.css`
- Differences remaining: none structural
- Functional differences: none (focus trap, escape, internal scroll preserved)
- Parity: **PASS**

### 11 Auth
- Reference: centered branded card, explanation, providers, gold email CTA
- Route: `/account` (guest)
- Components changed: `components/account/auth-page.tsx` (title), `styles/mockup-parity.css`
- Differences remaining: providers render only when GoTrue enables them, so production shows the email-only composition
- Functional differences: none
- Parity: **PASS**

### 12 Magic-link email
- Reference: branded card, headline, one gold CTA, security note, fallback URL, footer
- Files: `lib/auth/magic-link-email.ts`, `supabase/templates/magic-link.html`
- Differences remaining: email clients strip some styling; table fallback kept
- Functional differences: none
- Parity: **PASS**

### 13 Footer
- Reference: compact close, identity + sentence, two link groups, contact pill, legal row
- Route: all public pages
- Components changed: `styles/mockup-parity.css`
- Differences remaining: link inventory follows the real navigation registry
- Functional differences: none
- Parity: **PASS**

## Verification

| Check | Result |
|---|---|
| typecheck | PASS |
| lint (`eslint . --max-warnings=0`) | PASS |
| production build | PASS |
| tests | PASS — 863 (scoped suites: layout, ads, account, home, archive, tool detail, collections, auth, discovery, styles) |

Test updates made to follow the mockup presentation: three collection assertions referenced the old "Apri lo stack" label; they now assert the primary "Avvia questa raccolta" action and the primary CTA treatment.

## Functional regression QA

| Area | Result |
|---|---|
| Home tabs, search, catalogue, filters, tool actions | PASS (browser + tests) |
| Save / Compare state | PASS (tests) |
| Guides, Collections | PASS (tests) |
| Magic link request + callback logic | PASS (tests) |
| Provider visibility | PASS — none rendered while GoTrue has them off |
| Workspace views incl. decision sheet | PASS (tests + QA harness) |
| Guest -> account merge | PASS (contract tests untouched) |
| Partner Experience | PASS |
| TinyAdz no-fill | PASS — zero height, no label |

## Remaining external blockers

- Google / Apple / GitHub still disabled in production GoTrue.
- TinyAdz real fill is vendor-side.

Final deployed SHA: `6153bf787bc0e215d2f21414a5369c4d33c84fed`  
Production URL: https://tooolvibes.eu  
Worker version: `3b57492f-9e80-4639-86cd-1b143e922e76`

## Production smoke

| Check | Result |
|---|---|
| `/api/release` sha | `6153bf7...` matches deployed HEAD |
| Home tabs (390) | 3 equal columns, pill container radius 999px |
| Home CTA | gold `rgb(243, 191, 76)` |
| Catalogue card (390) | 144px scan row |
| Auth | title "Entra in TooolVibes", gold submit `rgb(228, 178, 60)`, 350px centered card, 0 providers rendered |
| Guide | cream body `rgb(246, 241, 232)`, 664px measure |
| Overflow | 0 on all sampled routes |
| Empty `PUBBLICITÀ` | none |
| Page errors | one transient 403 not reproducible on networkidle |

## STRICT VISUAL RECONSTRUCTION PASS (22 Sep 2026)

Method: the five final mockup boards were OCR-extracted with macOS Vision (`/tmp/ocr/mockups/*.tsv`) to obtain the literal target text per numbered panel. Each production route was then DOM-extracted and checked programmatically: every target string must be present, every legacy string must be gone. Verification: `42656e8`. Screenshots: `artifacts/final-mockup-parity/390-rc2-*.png`, `1440-rc2-*.png`.

Limitation, stated plainly: this environment cannot return image pixels to the model, so the side-by-side was done on extracted text and structure, not on rendered pixels. A human should still open the screenshots and the mockup PNGs next to each other for the final aesthetic sign-off. What is proven below is that the composition and copy now match the mockup panels.

### 01 Home TOOL — PASS (structure + copy)
Present: `Recensioni indipendenti, confronti chiari e guide pratiche sul tuo lavoro con l'AI.` · `Cerca tool, categorie, use case...` · TOOL/STACK/RADAR pill · `Scelta della redazione` · score row · `Apri Blink` · `Sito` · `Ultime dal catalogo` + `Vedi tutte`
Removed: intent chips, `Cosa vuoi fare?`, system counters, entire Method section (`Cinque tappe`, `Come valutiamo`), `Valutazioni editoriali` carousel
Residual: partner label reads `Partner Experience · Sponsorizzato` (mockup: `PARTNER DI TOOLVIBES`); social icons absent (no real profile URLs in the registry)

### 02 Catalogue — PASS (structure + copy)
Present: `Trova i tool da valutare.` · search · `Tutte (30)` + category chips · cards with name, category, `★ 8.0`, `Ideale per ...`
Removed: intro lede, `Esplora per categoria` head block, description lines, level suffix in cards, `Tutti` label
Residual: `Tutti | Radar` facet kept as product navigation

### 03 Tool detail — PASS (structure + copy)
CTA order Confronta (gold) → Visita → Salva; `In sintesi` brief. (Tool detail was already rebuilt in the previous pass; this pass kept it.)

### 04 Guide list — PASS (structure + copy)
Present: `Guide scritte per decidere.` · `Letture lunghe su un tool o un flusso. Tesi, struttura, parere.` · cream cards · `Leggi la guida`
Removed: `Sezione Guide` kicker, masthead stats, `Letture organizzate per area` head, `Tutte le guide` kicker, `Apri` CTA

### 05 Guide article — PASS (structure + copy)
Cream reading column at 66ch framed by the night shell; breadcrumb, byline, takeaways, TOC unchanged from the previous pass.

### 06 Collection — PASS (structure + copy)
Present: `Avvia questa raccolta` · 3 hero metrics (Costo / Setup / Tool) · section nav (Stack, Varianti, Decisioni, Scenario, Quando no, Guide) · numbered stages · `Perché questa raccolta` (collapsed)
Removed: `Come funziona, in pratica` heading and visible rationale wall, Difficoltà/Verificato metrics

### 07 Radar — PASS (structure + copy)
`Cosa sta emergendo adesso` · `I tool più discussi, in crescita ora.` · cyan ranked rows. Home preview already matched.

### 08 Spazio — PASS (structure + copy)
`Bentornato` · `Cosa vuoi fare oggi?` head added; resume-first modules unchanged.

### 09 Decisions — PASS (structure + copy)
List, chips and rows unchanged; sheet renamed per mockup.

### 10 Decision sheet — PASS (structure + copy)
`Valuta {tool}` · `Perché questa decisione?` · reason chips · `Nota privata` · `Annulla` / `Salva decisione` · cream sheet over dark app.

### 11 Auth — PASS (structure + copy)
`Entra in TooolVibes` · `Il tuo spazio per salvare, confrontare e ricordare le tue decisioni.` · providers only when enabled · `Inserisci la tua email` · `Invia link` · `Ti invieremo un link sicuro per accedere.` · `Crea un account`
Removed: Accedi/Crea spazio/Recupera tab pills, old subtitle, aside manifesto

### 12 Magic-link email — PASS (structure + copy)
`TooolVibes` · `Better tools / Brighter builders` · `Entra in TooolVibes` · gold `Conferma e apri TooolVibes` · one-time notice · `Se il pulsante non funziona` · fallback URL · `Se non hai richiesto tu questa email, puoi ignorarla.` · footer with `Strumenti per chi costruisce il domani` and `Il tuo spazio, idee più lontane.` Dark composition per the dedicated email mockup; dashboard template synced.

### 13 Footer — PASS (structure + copy)
Identity + summary + `Scrivici` · Esplora / TooolVibes columns · legal + `Trasparenza e affiliazioni` + mark. Removed: `Parliamone` block. Social icons omitted (no registry URLs).

## Verification for this pass

| Check | Result |
|---|---|
| tsc | PASS |
| eslint `.` | PASS |
| build | PASS |
| tests | PASS — 2952 passed, 36 skipped, 0 failed |
| overflow | 0 on all sampled routes at 390 and 1440 |
| legacy strings | programmatically absent |
| mockup strings | programmatically present |

Commit: `42656e8`. Not deployed.

## FINAL PARITY EVIDENCE, PREVIEW AND PRODUCTION (22 Sep 2026)

### Method
`artifacts/final-mockup-parity/` contains a capture-and-compare pipeline:

- `capture.mjs` — 13 implementation shots at 390×844@2x (Home TOOL/STACK/RADAR, Catalogue, Tool detail, Guides list, Guide article, Collections, Collection, Auth, Footer, Email rendered from the live module, logged-in workspace harness)
- `compare.py` — crops the 7+6 panels from the reference board `00_00_34`, trims the phone screen box, fits both to 390×844, produces overlay/diff pairs and a contact sheet, and registers matched text anchors
- `pairs/<name>/{mockup,implementation,overlay,diff}.png` for all 13 surfaces, plus `FINAL-MOCKUP-PARITY-CONTACT-SHEET.png`
- `FINAL-MOCKUP-PARITY-METRICS.json` — registration residuals, edge similarity, text-line counts per surface

### Registration where anchors matched

| Surface | RMS x / y | Notes |
|---|---|---|
| 01 Home TOOL | 0.000 / 0.006 | 4 anchors, edge similarity 0.678 |
| 02 Catalogue | 0.088 / 0.222 | anchors polluted by dynamic names, see copy check |
| 05 Guide article | 0.002 / 0.041 | |
| 06 Collection | 0.002 / 0.041 | |
| 12 Email | 0.029 / 0.082 | rendered from the live module |
| 13 Footer | 0.028 / 0.194 | mobile board footer reference |

Surfaces 03, 07, 08, 09, 10, 11 carry too few stable anchors for global registration because the mockups show dynamic data (for example Notion AI, which is not in the catalogue) or because logged-in surfaces only exist behind the dev harness. Those were verified by structural anchors (section order, block count) and copy checks instead. Stated as a limitation, not as a pass on pixels.

### Legacy audit
A DOM check across the seven public routes now returns **zero** legacy strings (`Cosa vuoi fare?`, `Cinque tappe`, `Valutazioni editoriali`, `Apri la raccolta`, `Come funzionano le Raccolte?`, `Sezione Guide`, `Segui i lanci`, `Tutti i tool` heading). Two residual legacy elements were found during preview QA and fixed: the catalogue `ar4-goals` block (commit `ae3a2fd`) and the collection next-step `Apri la raccolta` CTA (commit `0727feb`).

### Preview
Built with `npm run build:cloudflare` and uploaded with `opennextjs-cloudflare upload`.

- Preview `6ecf53ff` (sha `ae3a2fd`) failed the legacy gate on `Apri la raccolta`
- After the fix: preview `f335b0eb` (sha `0727feb7`)
- Preview QA: **45/45 PASS** — 390 / 430 / 768 / 1280 / 1440 × 9 routes, checking status, horizontal overflow, navigation by breakpoint, legacy strings, footer heading contrast, `PUBBLICITÀ`, and font load

### Production
Deployed with `npm run cloudflare:deploy`.

- Worker version `229104bb-c5a9-4b6a-aa2d-6d2a03a0b4a2`
- `/api/release` sha `0727feb7af205bd598e0a7e32a4418596cd96ed7`
- Production smoke: **27/27 PASS** — 390 / 768 / 1440 × 9 routes, overflow 0, no legacy strings, no dark-on-dark footer headings, no empty `PUBBLICITÀ`
- Production screenshots: `artifacts/final-mockup-parity/production/` (390 and 1440 for Home, Catalogue, Tool detail, Guides, Collection, Auth)

### Per-surface status

| # | Surface | Status | Basis |
|---|---|---|---|
| 01 | Home TOOL | PASS | registration RMS y 0.006 + copy + legacy zero |
| 02 | Catalogue | PASS | copy + legacy zero + structural anchors |
| 03 | Tool detail | PASS | structure + copy (prev. pass) |
| 04 | Guide list | PASS | structure + copy + legacy zero |
| 05 | Guide article | PASS | registration RMS 0.002 / 0.041 |
| 06 | Collection | PASS | registration RMS 0.002 / 0.041 |
| 07 | Radar | PASS | structure + copy; live feed requires Product Hunt |
| 08 | Spazio | PASS | harness structure + copy |
| 09 | Decisions | PASS | harness structure + copy |
| 10 | Decision sheet | PASS | harness structure + copy |
| 11 | Auth | PASS | structure + copy; providers gated by GoTrue |
| 12 | Email | PASS | registration RMS 0.029 / 0.082 |
| 13 | Footer | PASS | registration RMS 0.028 / 0.194 |

### Honest caveats
- This environment cannot feed image pixels back to the model, so no human-visual side-by-side was performed by the agent. The contact sheet exists for that final human check.
- Dynamic data legitimately differs (Radar live feed, tool examples, counts).
- Logged-in surfaces were verified through the workspace harness, not a production session.
- Social icons from the mockup footer are not rendered because the navigation registry has no real profile URLs.
- OAuth providers remain disabled in production GoTrue; the UI correctly renders the email-only composition.
- TinyAdz real campaign fill remains vendor-side; the no-fill fallback is verified.
