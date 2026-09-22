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

Final commit SHA: filled after commit.
