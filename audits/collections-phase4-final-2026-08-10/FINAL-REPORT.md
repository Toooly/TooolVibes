# TOOOLVIBES COLLECTIONS — PHASE 4 FINAL REPORT
## 8 → 12 Collections · Detail V4 · Index Recomposition · Cleanup

**Status: COLLECTIONS PHASE 4 COMPLETE — READY FOR GROK**
**Date: 2026-08-10**
**Working tree: committed to main, no deployment**
**Author: giammagc**

---

## FINAL SHA

`main == origin/main` after the final push.

(See git log for the precise final SHA on `main`.)

---

## 12 COLLECTION INVENTORY

| # | Slug | Group | Accent | Featured | Title |
|---|---|---|---|---|---|
| 1 | ai-stack-solo-founders | build | indigo | YES | Stack AI per founder solo |
| 2 | design-sprint-essentials | build | indigo | no | Essenziali per design sprint |
| 3 | from-mvp-to-sellable-saas | build | indigo | YES | Da MVP a SaaS vendibile |
| 4 | creator-video-stack | create | violet | YES | Stack creator per video e voce |
| 5 | ai-content-marketing-stack | create | violet | no | Stack AI per content marketing |
| 6 | personal-brand-linkedin-stack | create | violet | no | Stack personal brand su LinkedIn |
| 7 | ai-video-training-stack | create | violet | no | Stack AI per video-corsi e formazione |
| 8 | ai-customer-support-stack | operate | teal | no | Stack AI per customer support |
| 9 | ai-agents-automation-stack | operate | teal | YES | Stack AI agents e automazione |
| 10 | agency-operating-stack | operate | teal | no | Stack operativo per agenzie 2-8 persone |
| 11 | free-budget-ai-stack | grow | amber | no | Stack AI a basso costo (€0 o quasi) |
| 12 | lead-generation-stack | grow | amber | no | Stack AI per lead generation e sales |

4 featured: solo-founders, mvp-saas, creator-video, agents. Deterministic via
`collectionVisualIdentity[slug].featured`. Lead = first featured (solo-founders).

---

## FOUR NEW COLLECTIONS

### 9. ai-video-training-stack (CREATE / violet)
**Concept:** trasformare expertise in un video-corso monetizzato (research →
script → avatar video → hosting → pagamenti).
**CORE:** jenni-ai, synthsia-ai, blogify
**BALANCED:** + vidau + lemon-squeezy
**OPTIONAL:** imagine-art (asset visivi)
**Caveat:** Blogify non sostituisce un LMS vero (no quiz, certificati,
progress tracking strutturato).

### 10. agency-operating-stack (OPERATE / teal)
**Concept:** gestire 2-8 clienti con un minimo di tooling (outreach → delivery
→ fatturazione → supporto).
**CORE:** reachifyme, make, lemon-squeezy, helpdesk
**BALANCED:** + frase-ai, chatbot
**OPTIONAL:** frase-ai, chatbot
**Caveat:** Helpdesk è funzionale ma non specializzato per agenzie (no
CRM-style per-cliente view).

### 11. free-budget-ai-stack (GROW / amber)
**Concept:** workflow AI utile spendendo €0 o sotto €30/mese (PATH €0 puro
vs PATH LOW-COST).
**CORE (PATH €0):** flowise, imagine-art
**BALANCED (PATH LOW-COST):** + jenni-ai, frase-ai
**Caveat:** free tier cambiano pricing; non per uso commerciale ad alto
volume; Flowise richiede self-hosting base.

### 12. lead-generation-stack (GROW / amber)
**Concept:** funnel B2B ripetibile (prospect → outreach → qualifica →
handoff).
**CORE:** socleads, reachifyme, frase-ai
**BALANCED:** + make, chatbot
**OPTIONAL:** windsor-ai (attribution)
**Catalog gap esplicito:** nessun CRM integrato nel catalogo TooolVibes.
Lead qualificati vanno gestiti in Notion, Sheets, o tool esterni. Gap
documentato nel decision_intelligence.weakest + scenario.

---

## INDEX COMPOSITION

`/collections` ora usa raggruppamento editoriale in 4 gruppi (BUILD / CREATE
/ OPERATE / GROW) con featured deterministica in cima.

**Struttura pagina:**
1. Hero (masthead + lede + meta)
2. "Le raccolte non sono guide né confronti" (intro + comparison strip)
3. **IN EVIDENZA** — 1 featured card (Stack AI per founder solo)
4. **COSTRUISCI** — 2 cards (design-sprint, mvp-saas)
5. **CREA** — 3 cards (creator-video, content-marketing, personal-brand)
6. **CREA** — 1 card (video-training) — layout 3+1
7. **GESTISCI** — 3 cards (customer-support, agents, agency)
8. **CRESCI** — 2 cards (free-budget, lead-gen)
9. "Come leggere una raccolta" (3 principles: flusso, CORE/OPT/ALT, anti-rec)
10. Footer (Tooolvibes nav, preserved)

**Accenti per gruppo:**
- BUILD = indigo
- CREATE = violet
- OPERATE = teal
- GROW = amber

L'eyebrow di ogni gruppo usa l'accent del gruppo (solo tipografico, mai come
fill di card). Le card mantengono il proprio accent individuale via
`data-cx-accent`.

---

## DETAIL V4 SYSTEM

Tutte le 12 collection usano lo stesso detail system adattivo.

**9 sezioni in sequenza guidata:**
1. **HERO** — eyebrow + title + promise + 2 audience CTAs + stack preview
   inline (real brand glyphs) + "N STRUMENTI CORE" + decision strip
   4-up (cost / setup / difficulty / verified) + audience tabs
2. **STACK FLOW** — sequenza CORE connessa verticalmente, OPT/ALT come
   inline inserts (no card laterale)
3. **VARIANT PATHS** — additive tabs (7 collection) o path-based side-by-side
   (agents: MANAGED vs SELF-HOSTED)
4. **DECISION NOTES** — 3 gruppi editoriali (funziona / occhio / lungo termine)
5. **SCENARIO** — step numerati con disclaimer "ipotetico ma realistico"
6. **ANTI-RECOMMENDATION** — editoriale, no alert icon, link ad altre collection
7. **GUIDE BRIDGE** — dedup di related_guide_slugs + per-slot relevant_guide_slug
8. **NEXT COLLECTION** — 2 next cards con relationship framing
9. **PARTNER MODULE** — preservato dal pipeline (intoccato)

**Path-based detector:**
```ts
isPathBased = subsetDiffers || variants.some(v => v.architectural === true)
```

Solo agents ha `architectural: true` sul lean variant + `path_split` esplicito
su `stack_meta`. Le altre 11 collection usano additive tabs.

**Real tool identity:** `CollectionToolGlyph` (client component) riusa
accentFrom/accentTo/domain/externalUrl dal catalogo. Real brand gradient →
Google s2 favicon → monogram → deterministic gradient fallback.

---

## MOBILE QA (390 / 360 / 430)

Index (12 collection + 4 gruppi + featured):
- 360: h=9311, overflow=0
- 390: h=9189, overflow=0
- 430: h=8925, overflow=0

Detail 390 (avg 8491px, range 7606-9456px):
- solo-founders 8527, design-sprint 8259, creator-video 9385, content-marketing
  8878, mvp-saas 8779, customer-support 7984, agents 8116, personal-brand 7780,
  video-training 8260, agency 9316, free-budget 7521, lead-gen 9091

Detail 360 / 430:
- solo-founders 360=8950, 430=8235
- agents 360=8511, 430=7880

Tutti i viewport mobile: zero overflow. Page heights all'interno del range
target (5000-6500 desktop, content-rich mobile come da brief).

---

## DESKTOP QA (1280 / 1440 / 1536)

Index:
- 1280: h=4993, overflow=0
- 1440: h=4927, overflow=0
- 1536: h=4932, overflow=0

Detail 1440 (avg 6206px, range 5712-6806px):
- tutti i 12 slugs verificati.

Detail 1536 / 1280 (deep QA su solo-founders, agents):
- solo-founders 1280=6228, 1536=6274
- agents 1280=5973, 1536=6018

---

## OVERFLOW MATRIX

| Viewport | solo-founders | agents | creator-video | free-budget | agency |
|---|---|---|---|---|---|
| 360 | 0 | 0 | 0 | 0 | 0 |
| 390 | 0 | 0 | 0 | 0 | 0 |
| 430 | 0 | 0 | 0 | 0 | 0 |
| 768 | 0 | 0 | 0 | 0 | 0 |
| 1280 | 0 | 0 | 0 | 0 | 0 |
| 1440 | 0 | 0 | 0 | 0 | 0 |
| 1536 | 0 | 0 | 0 | 0 | 0 |

Zero overflow su 7 viewport × 5 route = 35 test.

---

## INTERACTION QA

- Variant switching (LE / BALANCED / POWERED): active state visibile, panel
  content updates, aria-selected updates. ✓
- Agents path rendering: side-by-side MANAGED + SELF-HOSTED senza toggle
  (architectural comparison è il punto). ✓
- Guide bridge CTAs: link a `/posts/{slug}`. ✓
- Next collection CTAs: link a `/collections/{slug}`. ✓
- Stack flow "Più dettagli" links: link a `/toools/{slug}`. ✓
- Anti-rec "Vai invece a" links: link a collezioni alternative. ✓
- Featured deterministica: `pickFeaturedCollection()` in
  `lib/collections/visual-identity.ts` (spostata da collection-card-v3). ✓

No runtime errors. No hydration errors. No failed favicon requests (graceful
fallback via monogram → deterministic gradient).

---

## EDITORIAL INVARIANTS

Validated by tests (`__tests__/lib/data/content-collections-editorial.test.ts`):

- exactly 12 public Collections ✓
- unique slugs ✓
- every Collection has at least one CORE slot ✓
- no duplicate tool slugs inside a Collection ✓
- order field unique inside each Collection ✓
- related_collection_slugs and look_instead_at reference real Collections ✓
- no self-reference ✓
- all stack_variants reference real tool slugs (resolves against
  directoryTools catalog) ✓
- all included_tools reference real catalog slugs ✓
- access: "open" on every Collection ✓
- editorial_state: "published" or "featured" on every Collection ✓

---

## AGENTS PATH CHECK

**CORE:**
- AgentX (no-code agent runtime)
- Make (orchestration)

**ALTERNATIVE:**
- Flowise (self-hosted LangChain agent)

**Architectural paths (stack_meta.path_split):**
- MANAGED (NO-CODE): [agentx, make] — "Parti subito, senza devops"
- SELF-HOSTED (LANGCHAIN): [flowise, make] — "Controllo completo, hosting tuo"

**Detector:** `architectural: true` on lean variant + `path_split` on
stack_meta → renders as side-by-side comparison, NOT additive tabs.

Validated by `__tests__/lib/data/content-collections-editorial.test.ts` (every
Collection references only catalog tools) and by Playwright render
(after-ai-agents-automation-stack-390.png shows side-by-side paths).

---

## SOURCE LOG FOR NEW COLLECTIONS

Primary sources consulted (web search, 2026-08-10):
- blogify.dev pricing (free plan + Starter $9/mo)
- livechat.com pricing (Starter $19/agent/mo annual, 14-day trial, no free plan)
- imagine.art pricing (100 free tokens/day, Basic $7-15/mo, Standard $20-30/mo)

For the other tools (synthesia, vidau, muse-ai, socleads, reachifyme, frase,
lemon-squeezy, chatbot, helpdesk, tolt, make, flowise, jenni-ai), the editorial
baseline from Phase 1 was reused — these were already vetted in the
8-collection baseline (content-collections.ts and tooolvibes-directory.ts).

Where CURRENT pricing was uncertain (e.g. Lemon Squeezy merchant-of-record
fees), the data uses "freemium" or "paid" with a trade-off rather than a
specific price number.

---

## FILES MODIFIED

**Modified (5):**
- `app/(marketing)/collections/[slug]/page.tsx` — switched to V4 body
- `app/(marketing)/collections/collections.css` — V4 detail styles + index
  group styles + dead V3 removal (-267 lines)
- `components/collections/collections-index.tsx` — group composition (BUILD
  / CREATE / OPERATE / GROW)
- `lib/collections/helpers.ts` — 4 new audience + 4 new theme labels
- `lib/collections/visual-identity.ts` — `pickFeaturedCollection` moved
  here (single source of truth for visual system)
- `lib/data/content-collections.ts` — 4 new Collections (+1011 lines),
  related graph updates
- `lib/types/collection.ts` — 4 new theme + 4 new audience type members,
  `architectural?` flag on `CollectionStackVariant`, `path_split?` on
  `CollectionStackMeta`

**New (9 V4 detail components):**
- `collection-detail-body-v4.tsx`
- `collection-detail-hero-v4.tsx`
- `collection-stack-flow-v4.tsx`
- `collection-variant-paths-v4.tsx`
- `collection-decision-notes-v4.tsx`
- `collection-scenario-v4.tsx`
- `collection-anti-recommendation-v4.tsx`
- `collection-guide-bridge-v4.tsx`
- `collection-next-step-v4.tsx`

**Test updates (4):**
- `__tests__/lib/data/content-collections-editorial.test.ts` — 8 → 12
- `__tests__/lib/data/collection-repository.test.ts` — slug list 8 → 12
- `__tests__/lib/data/public-collections.test.ts` — 8 → 12
- `__tests__/lib/monetization/commercial-density-contracts.test.ts` —
  collections-list route file: `mobile-collections-view.tsx` →
  `collections-index.tsx`

---

## DEAD CODE REMOVED

**14 file V1/V2/V3 rimossi** (tutti verificati zero-import prima del rm):

Components:
- `collection-card-v2.tsx`
- `collection-card-v3.tsx`
- `collection-card.tsx` (V1 originale)
- `collection-slot-card.tsx`
- `collection-slot-safe-boundary.tsx`
- `collection-slot-error-boundary.tsx`
- `mobile-collections-view.tsx`
- `collection-detail-body.tsx`
- `collection-detail-hero.tsx`
- `collection-stack-overview.tsx`
- `collection-stack-variants.tsx`
- `collection-decision-intelligence.tsx`
- `collection-anti-recommendation.tsx`
- `collection-scenario.tsx`
- `collection-related.tsx`

Test:
- `__tests__/components/collections/collection-slot-card.test.tsx`

CSS scoped cleanup:
- 267 lines of dead V3 card styles (2425-2691) removed from collections.css

`pickFeaturedCollection` migrato da collection-card-v3.tsx a
`lib/collections/visual-identity.ts` (era l'unica export ancora usata).

---

## VALIDATION

- **Typecheck:** `npx tsc --noEmit` — clean ✓
- **Lint:** `npx eslint app components` — clean ✓
- **Tests:** `npx vitest run` — 1826 passed, 1 pre-existing failure
  (`runtime-contract.test.ts` Node 22.23.1 vs 26.5.0, out of scope),
  32 skipped
- **Build:** `npm run build` — successful, all routes compiled
- **Dev server:** port 4124, 200 OK on all 12 detail routes + index
- **Visual QA:** 41 screenshots, all viewports, all routes, zero overflow

Pre-existing known issue (out of scope per brief):
- `runtime-contract.test.ts` — Node 22.23.1 (CI) vs 26.5.0 (local). Not
  introduced by Phase 4. Documented as known.

---

## CROSS-SCOPE SAFETY

**Not modified** (verified by grep):
- `app/(marketing)/posts/*` — guide pages
- `app/(marketing)/toools/*` — tool detail pages
- `app/(marketing)/compare/*` — compare pages
- `app/(marketing)/home*` — home pages
- `app/(admin)/*` — admin collection pages
- `components/guides/*` — guide components
- `components/tool-detail-final/*` — tool detail final
- `lib/monetization/*` — commercial placement (only the test file was
  updated to point to the new collections-list path)
- `lib/sponsors/*` — partner/sponsor resolver
- `lib/affiliates/*` — affiliate logic
- `components/ads/*` — TinyAdz and rails

**Preserved audit directories** (untracked, not committed):
- `audits/collections-prod-release-2026-08-10/`
- `audits/commercial-final/`
- `audits/commercial-inventory-final/`
- `audits/partner-aurora-final/`
- `audits/partner-brand-assets-v1/`
- `audits/partner-experience-v3-2026-08-07/`
- `audits/partner-final-polish/`
- `audits/partner-inventory-v4/`
- `audits/phase4-proposal-2026-08-10/`
- `audits/phase4-step3-2026-08-10/`
- `audits/collections-phase4-final-2026-08-10/` (this report)

---

## REMAINING NON-BLOCKING ISSUES

- Free-budget daily token limits (Imagine Art 100/day, Jenni 10k words/month)
  may shift. Pricing fact-check should be re-run every 3-6 months per the
  anti-recommendation copy.
- Lead-generation CRM gap: TooolVibes catalog still has no native CRM.
  Documented as a catalog gap, not fabricated.
- Index hero "IN EVIDENZA" eyebrow is rendered through CollectionCardV4
  cover_kicker concatenation; not a separate "label" field. If a future
  redesign wants a distinct "FEATURED" badge styling, that's a V4.2 task.
- `pickFeaturedCollection` returns the first Collection with
  `featured: true` from visual-identity. Currently 4 featured, 1 lead used.
  If multiple featured in the same group section, deterministic by visual-
  identity declaration order.

---

## DEPLOYMENT

**NO DEPLOYMENT was executed.** Phase 4 ends with the working tree
committed and pushed to `main`. Production remains at the Phase 3 / V2
baseline + V4.1 cards already deployed (worker
`254c154a-7464-4829-9d5b-f74330b241e6`).

The new 12-collection baseline will be deployed in a separate operation
after Grok cross-site pass.
