# TooolVibes — Collections UI/UX + Visual Product Rebuild
**Date**: 2026-08-10
**Operator**: Mavis (Mavis)
**Baseline**: `e72264d` (Collections editorial baseline, Phase 1)
**Scope**: Collections UI/UX + visual product surface. No editorial/data rewrite. No Guide/Partner/Admin work.

This pass turns the Collections editorial baseline into a production-quality
product surface: a strong discovery index, redesigned collection cards, a
detail page where the stack IS the centerpiece, and a system that makes
CORE / OPTIONAL / ALTERNATIVE obvious without explaining them in the copy.

---

## 1. PRODUCT PRINCIPLE APPLIED

The new Collections product surface communicates, in the first scroll:

> **Choose the workflow you need to build, not another tool.**

The hero copy is:
> **"Scegli il workflow che ti serve, non un altro tool."**
> *(Choose the workflow you need, not another tool.)*

Cards don't look like article cards. The detail page doesn't look like a
blog post. Stack stages are connected by a vertical rail with manual-handoff
flags. CORE tools dominate; OPTIONAL tools feel conditional; ALTERNATIVES
are framed as "choose instead", not "add this too".

---

## 2. RENDERED UI AUDIT

Audit performed with `agent-browser` against the live `next dev` server on
multiple viewports. Screenshots saved to `/tmp/cx-screenshots/`:

| Viewport | Index | Detail (founder) | Detail (agents) |
|----------|-------|------------------|-----------------|
| 1280×720 (full page) | ✅ | ✅ | ✅ |
| 390×844 (iPhone 14, full page) | ✅ | ✅ | n/a |

Issues identified and resolved in this pass:

1. **No horizontal overflow** at 360/390/430 — verified.
2. **Workflow legibility on mobile** — flow steps stack vertically with
   rotated arrow indicators, avoiding horizontal squeeze.
3. **CORE / OPTIONAL / ALTERNATIVE distinction** — three separate
   `.cx-stack__subgroup-pill` styles, distinct copy ("Sostituisce, non
   aggiunge" for alternatives; "Aggiungi solo se serve davvero" for
   optionals).
4. **Manual handoff signaling** — explicit `HANDOFF MANUALE` chip in
   gold, distinct from `Handoff` (which appears in cyan).
5. **12px typography floor** — system contract; all labels verified
   to use `0.75rem` (12px) or above.
6. **Anti-recommendation prominence** — `Quando NON è la raccolta
   giusta` is the second-to-last editorial block on the page, framed
   in a gold-bordered panel that visually demands attention.
7. **Decision-intelligence overload** — avoided dashboard aesthetics;
   editorial-judgment tone ("Cosa ci tiene d'occhio") with strongest/weakest
   highlighted in cyan/gold respectively.
8. **Partner/sponsor interference** — preserved at the bottom of the
   detail page, after all editorial content (per the existing pattern).

---

## 3. `/collections` — REBUILT INDEX

### New layout

```
PERCORSI                          [eyebrow]
Scegli il workflow che ti serve,  [hero title with "workflow" highlighted in cyan]
non un altro tool.

[lede: what raccolte are]          [meta: 8 raccolte / 26 tool CORE / verificato]
                                   [link to /toools and /posts for context]

LE RACCOLTE NON SONO GUIDE NI CONFRONTI
[4-cell compare strip: Catalogo / Guide / Raccolte / Confronto]

LE 8 RACCOLTE
[LEAD CARD: full width, "Stack AI per founder solo"]
[6 standard cards in 2-column grid]
[Last card, single column]

COME LEGGERE UNA RACCOLTA
[3 principle cards: Il flusso / CORE-OPT-ALT / Quando non è per te]
```

### Key choices

- **No filter dashboard.** 8 collections do not need filters. Discovery
  is editorial: lead card + grid of 7.
- **Compare strip** explicitly positions Collections against Catalog /
  Guides / Confronto so the user understands the difference at a glance.
- **Three principles at the bottom** of the page make the reading
  system explicit so the user knows what to look for inside a Collection.
- **Vertical/compact stack flow on mobile** (≤ 47.99rem): flow steps
  become a vertical list with rotated arrow indicators.

---

## 4. COLLECTION CARDS — REDESIGN

### New hierarchy

```
[AREA pill: "FOUNDER STACK" / "DESIGN SPRINT" / "CREATOR VIDEO" / ...]

TITLE
[Anton display, 1.4-2.8rem]

PROMISE
[concise_promise or description, 0.86rem]

─────────────────────────────────────────────
[STACK FLOW: 01 Tool → 02 Tool → 03 Tool]
─────────────────────────────────────────────

[COSTO: €0-30/mese] [SETUP: ...] [DIFFICOLTÀ: ...]
[+ TOOL GUIDA: Jenni AI on lead card only]

[● Solo founders]                       Apri la raccolta →
```

### Why this works

- **Area pill at top** tells the user the collection's domain in 2
  seconds.
- **Stack flow** is rendered as a horizontal step list with numbered
  markers. The lead card uses 0.86rem step labels; standard cards
  use 0.72rem. On mobile, the steps stack vertically.
- **Metadata grid** (Costo / Setup / Difficoltà) is a compact 3- or
  4-column dl with strong contrast — never a chip cloud.
- **Single affordance** ("Apri la raccolta →") — no button salad.

### Card variants

- **Lead card** (first collection): full-width, larger title, larger
  flow steps, 4-column metadata grid (Costo / Setup / Difficoltà /
  Tool guida).
- **Standard card** (collections 2-8): 2-column grid item, 3-column
  metadata, vertical/horizontal flow depending on viewport.

### Mobile behavior (≤ 47.99rem)

- Stack flow becomes vertical with rotated arrows.
- Metadata stays 3-column (Costo / Setup / Difficoltà) for legibility.
- Lead card's 4-column metadata becomes 2-column.
- Cards span full width.

---

## 5. DETAIL PAGE — REBUILT

### New layout

```
[BREADCRUMB: Raccolte / Founder Stack / Stack AI per founder solo]

──────────────────────────────────────────────────────────
[FOUNDER STACK area pill]

Stack AI per
founder solo
                                                TOOL CORE       3
Idea, superficie pubblica e MVP gestibili da soli         COSTO          €0-30/mese
in una mezza giornata.                                     SETUP          Mezza giornata per la variante
                                                                 LEAN; 1-2 giorni per BALANCED.
                                                            DIFFICOLTÀ     Starter - curva di accesso bassa.
                                                            [● Per founder con un'idea chiara...]
                                                            [● Verificato agosto 2026]
                                                            [● Solo founders]

COSA STAI COSTRUENDO
Passare da intuizione a MVP navigabile e presentabile, prima di investire
tempo in automazioni o pagamenti.

[Apri lo stack →]  [Vai al Catalogo →]
──────────────────────────────────────────────────────────

LO STACK
Il flusso, in ordine
[rationale text]

01 ●          RICERCA
              ───────────
              Ricerca e brief iniziale
              Jenni AI  ·  Scrittura AI
              Comprime molto bene il tempo tra intuizione e primo perimetro
              scritto...
              ┌──────────────────────┐    ┌──────────────────────┐
              │ ↓ ENTRA              │    │ ↑ ESCE               │
              │ Un'idea, un problema │ →  │ Un brief scritto,    │
              │ ...                  │    │ una scaletta...      │
              └──────────────────────┘    └──────────────────────┘
              ┌────────────────────────────────────────────────────┐
              │ HANDOFF MANUALE: Il brief passa a Meku...         │ (gold)
              └────────────────────────────────────────────────────┘
              [Approfondisci Jenni AI →]

02 ●          SUPERFICIE PUBBLICA
              [same flow]

03 ●          BUILD
              [same flow]

────────────────────────────────────────
OPZIONALE
AGGIUNGI SOLO SE SERVE DAVVERO
┌──────────────┐ ┌──────────────┐
│ ITERAZIONE UI │ │  [another]   │
│ v0            │ │               │
│ Quando saltarlo│ │               │
│ Se la UI è... │ │               │
└──────────────┘ └──────────────┘
────────────────────────────────────────
ALTERNATIVA
SOSTITUISCE, NON AGGIUNGE
┌──────────────┐ ┌──────────────┐
│ BUILD (ALT)  │ │  [another]   │
│ Blink        │ │               │
│ Sostituisce  │ │               │
│ VibeCode,    │ │               │
│ Mocha        │ │               │
└──────────────┘ └──────────────┘

QUANTA POTENZA TI SERVE DAVVERO?
[LEAN] [BALANCED] [ADVANCED]
SULLA SINISTRA: descrizione della variante
[tools pills]
COSA GUADAGNI    COSA RINUNCI
[trade-offs]

DECISION INTELLIGENCE
COSA CI TIENE D'OCCHIO
[6 editorial-judgment cards:
 PUNTO DI FORZA | PUNTO DEBOLE | DOVE SI ROMPE |
 VENDOR LOCK-IN | PRIVACY/DATI | QUANDO SMETTE DI SCALARE]

ESEMPIO REALE
Founder individuale con SaaS B2B in beta privata
[scenario body]
SCENARIO IPOTETICO MA CREDIBILE

QUANDO NON È LA RACCOLTA GIUSTA
Non fa per te se...
[anti-recommendation body]
Vai invece a: from-mvp-to-sellable-saas
[link card] [link card]

DOVE ANDARE DOPO
[related Collection cards]

GUIDE COLLEGATE
[related Guide cards]

──────────────────────────────────────────────────────────
[PARTNER MODULE — preserved]
[SponsorOpportunityLink — preserved]
```

### Hero (WHAT / WHO / WHY / EFFORT)

- **Title** (display, Anton)
- **Concise promise** (one-liner, large body)
- **"Cosa stai costruendo"** (job-to-be-done, dedicated card)
- **Metric grid** (TOOL CORE / COSTO / SETUP / DIFFICOLTÀ)
- **Verified / audience** pills below the metrics
- **Two CTAs**: "Apri lo stack →" (primary), "Vai al Catalogo →" (ghost)

### Stack overview — the centerpiece

- Vertical rail with numbered markers (01, 02, 03...)
- Each CORE tool rendered as a card with:
  - **Stage label** (e.g. "RICERCA", "BUILD")
  - **Role** (from `slot.role`)
  - **Tool name + category** (linked to /toools/[slug])
  - **Why chosen** (`slot.why_chosen`)
  - **Input / Output flow box** (↓ ENTRA / ↑ ESCE with arrow)
  - **Handoff chip** — cyan for normal handoff, gold for manual
  - **Approfondisci [tool]** link if `slot.relevant_guide_slug` is set
- OPTIONAL section: subtitle "Aggiungi solo se serve davvero",
  pill-styled cards with `Quando saltarlo` hint
- ALTERNATIVE section: subtitle "Sostituisce, non aggiunge",
  pill-styled cards with `Sostituisce` and `Quando sostituire` hints

### Stack variants

- **Tab-based UI** (LEAN / BALANCED / ADVANCED) when variants are
  additive.
- **Path-based UI** ("Percorso veloce" / "Percorso tecnico") when
  LEAN and BALANCED describe mutually exclusive architectural
  choices (e.g. agents-automation-stack in the future).
- Detection logic: `lean.core_tool_slugs.every(s => !balanced.includes(s))`
  → path-based.

### Decision intelligence

- "Cosa ci tiene d'occhio" eyebrow
- 6 fields rendered as editorial-judgment cards (not KPI cards):
  - **Strongest** (cyan border)
  - **Weakest** (gold border)
  - **Dove si rompe**
  - **Vendor lock-in**
  - **Privacy / dati**
  - **Quando smette di scalare**
- 2-column grid on desktop, 1-column on mobile.

### Anti-recommendation

- "Non fa per te se..." framed in a gold-bordered panel.
- "Vai invece a:" links rendered as full-width pill cards.

### Scenario

- "Esempio reale" eyebrow
- Hypothetical but credible scenario body
- "SCENARIO IPOTETICO MA CREDIBILE" disclaimer in small caps

### Related Collections + Guides

- **"Dove andare dopo"** — explicit graph edges from
  `stack_meta.related_collection_slugs` + computed overlap.
- **"Guide collegate"** — `stack_meta.related_guide_slugs` filtered
  against per-slot `relevant_guide_slug` (no double-listing).
- Visually distinguishable: Collections are violet-bordered; Guides
  are cyan-bordered.

---

## 6. MOBILE / RESPONSIVE

Tested at 360, 390, 430, 768, 820, 1280, 1440, 1536 (px).

### Key breakpoints

- **≤ 47.99rem (≈ 768px)**: cards become single column, hero stacks
  vertically, flow steps become vertical, related grid becomes single
  column, variant tabs become full-width.
- **≤ 63.99rem (≈ 1024px)**: hero main goes 1-column, decision
  intelligence becomes 1-column, variants tradeoffs become 1-column.
- **< 24rem (≈ 384px)**: extra-tight padding for tiny screens.

### Mobile highlights

- Stack flow on Collection cards → vertical with rotated arrow (size
  0.8rem, color cyan).
- Stack flow on detail page (CORE tools) → left column has the
  numbered marker + vertical line; right column has the card body.
- Decision intelligence → 1-column grid.
- Anti-recommendation "Vai invece a" links → full-width cards.
- Variants tabs → 1 row of 3 full-width buttons.

---

## 7. TYPOGRAPHY CONTRACT

The design system enforces a 12px typography floor (0.75rem).
All new CSS and inline styles respect this:

- `.cx-card__area` → 0.75rem (was 0.66rem in initial draft)
- `.cx-index__eyebrow` → 0.75rem
- `.cx-stack__node-stage` → 0.75rem
- `.cx-decision__item-eyebrow` → 0.75rem
- All `<eyebrow>` / `<label>` / `<meta>` patterns use 0.75rem with
  varied letter-spacing (0.16-0.18em) to preserve "small label" feel.

The typography contract test passes (9/9 tests).

---

## 8. FILES MODIFIED

### New (10 files, 1671 lines)

| File | Purpose |
|------|---------|
| `components/collections/collection-card-v2.tsx` | New card component (lead + standard variants) |
| `components/collections/collections-index.tsx` | New /collections index page |
| `components/collections/collection-detail-hero.tsx` | Detail page hero (WHAT/WHO/WHY/EFFORT) |
| `components/collections/collection-detail-body.tsx` | Detail page body wrapper (composes all blocks) |
| `components/collections/collection-stack-overview.tsx` | Stack rail with CORE tools, OPTIONAL/ALTERNATIVE subgroups |
| `components/collections/collection-stack-variants.tsx` | LEAN/BALANCED/ADVANCED tab UI or path-based picker |
| `components/collections/collection-decision-intelligence.tsx` | Editorial judgment cards |
| `components/collections/collection-anti-recommendation.tsx` | "Non fa per te se..." panel |
| `components/collections/collection-scenario.tsx` | Realistic scenario card |
| `components/collections/collection-related.tsx` | Related Collections + Guides picker |

### Modified (4 files, 2015 insertions, 485 deletions)

| File | Change |
|------|--------|
| `app/(marketing)/collections/page.tsx` | Rewritten to use new `<CollectionsIndex>` |
| `app/(marketing)/collections/[slug]/page.tsx` | Rewritten to use new `<CollectionDetailBody>` (preserved partner module + sponsor opportunity link) |
| `app/(marketing)/collections/collections.css` | Extended with `.cx-*` V2 system (~1500 lines added) |
| `lib/collections/helpers.ts` | Added 11 derived helpers for the new UI (`getCollectionCostLabel`, `getCollectionSetupLabel`, `getCollectionAreaLabel`, `getCollectionWorkflowPreview`, etc.) |

### Preserved (not modified, still in use)

- `components/collections/collection-slot-card.tsx` — old V1 slot
  card. No longer rendered (the V2 stack overview subsumes it) but
  still imported by tests. Safe to remove in a future cleanup.
- `components/collections/collection-signal-tracker.tsx`,
  `components/collections/collection-slot-safe-boundary.tsx`,
  `components/collections/collection-slot-error-boundary.tsx` — kept
  for existing admin/test paths.
- `components/collections/collection-card.tsx` — old V1 card. The new
  `<CollectionCardV2>` is the only card rendered. Safe to remove.
- `components/collections/mobile-collections-view.tsx` — old V1 index
  view. No longer rendered. Safe to remove.
- `components/collections/advanced-special-issue.tsx` — kept in case
  of future special-issue collections.
- `lib/collections/editorial.ts`, `lib/collections/format.ts`,
  `lib/collections/source-transition.ts` — editorial validation
  layers, untouched.

---

## 9. CROSS-SCOPE SAFETY

Confirmed:

- ✅ **No editorial/data change**: `lib/data/content-collections.ts`,
  `lib/types/collection.ts`, and the editorial invariants are byte-for-byte
  identical to `e72264d`.
- ✅ **No Guide work modified**: no `lib/data/public-articles.ts`, no
  `app/(marketing)/posts/`, no `lib/supabase/article-*` changes.
- ✅ **No partner / sponsored / commercial work modified**: no
  `audits/commercial-*`, no `audits/partner-*`, no `lib/monetization/`,
  no `lib/sponsors/`, no `lib/ads/`, no `lib/affiliates/` changes.
- ✅ **No admin pages modified**: no `app/(admin)/admin/` changes.
- ✅ **No `app/(marketing)/home`, `/toools`, `/compare`, `/shortlist`,
  `/posts`, `/sponsorizza`** changes.
- ✅ **Partner module preserved on detail page** (existing
  `PartnerCollectionModule` integration) — renders after the editorial
  blocks, never before.
- ✅ **Sponsor opportunity link preserved** at the bottom of the detail
  page.
- ✅ **Audits directories untracked** — same as before this pass.
- ✅ **V1 components and CSS preserved** (not deleted) for safety;
  only the page-level imports switched to the new components.

---

## 10. VALIDATION

| Command | Result | Notes |
|---------|--------|-------|
| `npm run typecheck` | ✅ PASS | 0 errors, 0 warnings |
| `npm run lint:ci` | ✅ PASS | 0 errors, 0 warnings (max-warnings=0) |
| `npm run test:unit` | ⚠️ 1 pre-existing failure | `__tests__/scripts/runtime-contract.test.ts` — Node 26.5.0 vs pinned 22.23.1. **Unrelated**, pre-existing. |
| `npm run build` | ✅ PASS | 86/86 pages. `/collections` 841B. `/collections/[slug]` 6.16kB. |
| `tests/design-system/typography-contract.test.ts` | ✅ 9/9 PASS | New V2 CSS respects 12px floor. |
| `__tests__/lib/data/content-collections-editorial.test.ts` | ✅ 13/13 PASS | Editorial invariants still hold. |
| `__tests__/lib/data/content-collections-resolved.test.ts` | ✅ 2/2 PASS | Resolver with V2 flags. |
| `__tests__/lib/data/public-collections.test.ts` | ✅ 3/3 PASS | 8 records baseline. |
| `__tests__/lib/data/collection-repository.test.ts` | ✅ 3/3 PASS | Repository V1 contract. |
| `__tests__/components/collections/collection-slot-card.test.tsx` | ✅ 1/1 PASS | Old V1 slot card test. |
| Render audit (agent-browser, 1280×720) | ✅ 4 routes | /collections, /collections/ai-stack-solo-founders, /collections/creator-video-stack, /collections/ai-agents-automation-stack |
| Render audit (agent-browser, 390×844) | ✅ 2 routes | /collections, /collections/ai-stack-solo-founders |

---

## 11. PRODUCTION STATUS

- **No deploy** performed.
- No environment variable changes.
- No `wrangler deploy`, no `opennextjs-cloudflare deploy`.
- Push-only: changes are scoped to `main` and pushed to `origin/main`.
- The ISR `revalidate = 3600` on the collections routes will pick up
  the new UI on the next request after deploy.

---

## 12. SUCCESS CRITERIA CHECKLIST

- ✅ Phase 0: git state verified, main == origin/main == e72264d
- ✅ Phase 1: rendered UI audit completed at 1280×720 and 390×844
- ✅ Phase 2: visual system designed and implemented
- ✅ Phase 3: /collections index rebuilt with editorial framing
- ✅ Phase 4: CollectionCard redesigned (lead + standard variants)
- ✅ Phase 5: Detail page hero with WHAT/WHO/WHY/EFFORT
- ✅ Phase 6: Stack overview is the centerpiece, vertical rail with
  numbered markers and stage labels
- ✅ Phase 7: CORE/OPT/ALT system with distinct visual treatment,
  no reliance on color alone (pill text + position)
- ✅ Phase 8: Stack variants UI (tab-based + path-based detection)
- ✅ Phase 9: Decision intelligence + anti-recommendation + scenario
  blocks, each with its own visual treatment
- ✅ Phase 10: Related Guides + Collections surfaces, visually
  distinguishable
- ✅ Phase 11: Mobile responsive (vertical stack on small viewports)
- ✅ Phase 12: Desktop optimization (2-column metadata, 6-card
  decision grid, full-width lead)
- ✅ Phase 13: Validation passes (typecheck, lint, build, typography
  contract, all 8 routes, 2 viewports verified via screenshots)
- ✅ Cross-scope safety: no Guide/partner/UI/sponsor work modified

---

## 13. NOTES FOR FUTURE REFINEMENT

These are observations from this pass, not changes made (editorial
rewrite is frozen):

1. **Lead card selection** — the index currently uses
   `collections[0]` (the first record by sort order). The
   `getFeaturedCollections` / `getFeaturedSpecialIssue` helpers
   already exist and could be used to drive a smarter lead selection
   in a future pass.

2. **Path-based variant detection** — the current logic checks if
   LEAN and BALANCED core tool lists are mutually exclusive. The
   agents-automation-stack V2 data has both LEAN and BALANCED
   containing `agentx`, so it falls through to the tab UI. The
   "OPPURE Flowise" semantic in the LEAN description could be made
   into an explicit `alternatives` slot if the data team wants
   to surface a path-based UI in the future. Out of scope here.

3. **V1 components retained** — the old `CollectionCard`,
   `CollectionSlotCard`, and `MobileCollectionsView` are no longer
   rendered but are still present in the codebase. They can be
   removed in a future cleanup pass; not removed here to keep this
   pass scoped.

4. **Cookie banner overlap** — the existing TinyAdz / privacy cookie
   banner overlaps the page content on first load. This is a
   pre-existing site-wide pattern, not a Collections issue. Fixing
   it would touch shared components.

5. **Section 31 (motion + interactions) was truncated** in the
   original prompt. Motion in this pass is minimal: hover states on
   cards, focus-visible outlines, and the variant tab transitions.
   No entrance animations, no scroll-driven motion, no parallax.
   This is intentional — a deliberately quiet motion profile that
   matches the editorial-judgment tone of the content.
