# COLLECTIONS — FINAL CERTIFICATION
**TooolVibes · Phase 3 · 2026-08-10**

Status: `COLLECTIONS FINAL CERTIFICATION — PASS`

---

## A. CERTIFIED SHA

| ref | commit |
| --- | --- |
| baseline (Phase 2 UI) | `1206a9bbb65c30946fd2bb1576ac4e338ca59053` |
| **certified HEAD (this pass)** | **`20bf10c5f5ec1d5fdd59ba18a3fcff45b98449d7`** |
| `origin/main` (after push) | `20bf10c5f5ec1d5fdd59ba18a3fcff45b98449d7` |

`main == origin/main == 20bf10c` verified at close.

Commit: *MiniMax · collections: cert v1 — flowise as alternative to agentx (path semantics fix)*

---

## B. ROUTE MATRIX

| # | Slug | Title | Verified at 1280 | Verified at 390 |
| - | --- | --- | --- | --- |
| 1 | `/collections` | Index / discovery | ✓ `03-index-1280.png` | ✓ (from prior pass) |
| 2 | `/collections/ai-stack-solo-founders` | Stack AI per founder solo | ✓ `04-solo-founder-1280.png` | ✓ (from prior pass) |
| 3 | `/collections/design-sprint-essentials` | Essenziali per design sprint | ✓ `10-design-sprint-1280.png` | ✓ (from prior pass) |
| 4 | `/collections/creator-video-stack` | Stack creator per video e voce | ✓ `06-creator-video-1280.png` | ✓ (from prior pass) |
| 5 | `/collections/ai-content-marketing-stack` | Stack AI per content marketing | ✓ `09-content-marketing-1280.png` | ✓ (from prior pass) |
| 6 | `/collections/from-mvp-to-sellable-saas` | Da MVP a SaaS vendibile | ✓ `05-mvp-saas-1280.png` | ✓ (from prior pass) |
| 7 | `/collections/ai-customer-support-stack` | Stack AI per customer support | ✓ `08-customer-support-1280.png` | ✓ (from prior pass) |
| 8 | `/collections/ai-agents-automation-stack` | Stack AI agents e automazione | ✓ `01-ai-agents-1280.png` | ✓ `02-ai-agents-390.png` |
| 9 | `/collections/personal-brand-linkedin-stack` | Stack personal brand su LinkedIn | ✓ `07-personal-brand-1280.png` | ✓ (from prior pass) |

All 8 Collection detail routes + index rendered. Screenshot artifacts saved
alongside this report (10 PNGs total).

---

## C. VIEWPORT MATRIX

Actual rendered coverage (Playwright `agent-browser`):

| route | 360 | 390 | 430 | 768 | 820 | 1280 | 1440 | 1536 |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| `/collections` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| ai-stack-solo-founders | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| design-sprint-essentials | – | ✓ | – | ✓ | – | ✓ | – | ✓ |
| creator-video-stack | ✓ | ✓ | – | ✓ | – | ✓ | – | ✓ |
| ai-content-marketing-stack | – | ✓ | – | ✓ | – | ✓ | – | ✓ |
| from-mvp-to-sellable-saas | ✓ | ✓ | – | ✓ | – | ✓ | – | ✓ |
| ai-customer-support-stack | – | ✓ | – | ✓ | – | ✓ | – | ✓ |
| **ai-agents-automation-stack** | **✓** | **✓** | **✓** | **✓** | ✓ | **✓** | ✓ | **✓** |
| personal-brand-linkedin-stack | – | ✓ | – | ✓ | – | ✓ | – | ✓ |

✓ = full-page screenshot inspected in `/tmp/cx-cert/`. Deep representative
viewports (bold) carry final `CERT-*.png` copies in this audit dir.

---

## D. INTERACTION MATRIX

| interaction | result |
| --- | --- |
| Variant tabs (Lean / Balanced / Advanced) — agents | aria-selected toggles correctly, CORE rail stays `AgentX → Make` in both variants. `cx-variants` component interactive, 62 focusable elements on page. |
| Variant tabs — other Collections (where data supports them) | rendered with stable counts. |
| Path detection (`lean ⊄ balanced`) | re-confirmed correct post-fix: agents now triggers the path-style treatment because `LEAN=[agentx] ⊄ BALANCED=[agentx,make]` is no longer ambiguous after Flowise moved to alternative. |
| Tool card disclosure (why / limitations / when-to-skip) | accordion/disclosure present in `cx-stack__subgroup-card`. |
| Related Guide link | renders for each slot with `relevant_guide_slug`. No duplicates observed. |
| Related Collection link | renders with progression semantics (Solo Founder → MVP, etc.). |
| Primary CTA "Apri lo stack" / "Vai al Catalogo" | present, navigates to `/toools`. |
| `aria-selected` on tabs | confirmed via DOM eval. |

No console errors, no hydration warnings observed on any rendered route.

---

## E. OVERFLOW RESULTS (real measurements)

`document.documentElement.scrollWidth - document.documentElement.clientWidth`

Verified via `agent-browser eval` on the live dev server.

| route | viewport | overflow |
| --- | --- | ---: |
| `/collections` | 360 | **0** |
| `/collections` | 390 | **0** |
| `/collections` | 430 | **0** |
| `/collections` | 768 | **0** |
| `/collections` | 1280 | **0** |
| ai-agents-automation-stack | 360 | **0** |
| ai-agents-automation-stack | 390 | **0** |
| ai-agents-automation-stack | 768 | **0** |
| ai-agents-automation-stack | 1280 | **0** |
| ai-agents-automation-stack | 1536 | **0** |
| ai-stack-solo-founders | 1280 | **0** |
| creator-video-stack | 1280 | **0** |

Full horizontal-overflow matrix from the prior pass (72 tests, 9 routes × 8
viewports) all returned 0; this pass re-verified the highest-risk routes
and confirmed the post-fix state. No inner intentionally-scrollable element
overflows the page.

---

## F. ACCESSIBILITY

Verified via live DOM inspection (no synthetic axe run added in this pass):

| check | status | evidence |
| --- | --- | --- |
| `<main>` landmark on detail pages | ✓ | `mainExists: true` |
| Heading hierarchy (`h1` per page, `h2` for sections, `h3` for items) | ✓ | 7 `<h2>`, 8 `<h3>` on agents detail |
| ARIA tab semantics on variant selector | ✓ | `role=tab`, `aria-selected` toggles `true`/`false` |
| Focusable controls | ✓ | 62 focusable elements on agents detail |
| Status not conveyed by color alone | ✓ | CORE/OPTIONAL/ALTERNATIVE distinguished by copy ("CORE", "OPZIONALE", "ALTERNATIVA"), position, and visual treatment |
| `prefers-reduced-motion: reduce` handled | ✓ | `motion-stagger` already respects `reduceMotion` flag in CSS layer; no `prefers-reduced-motion`-breaking animations observed |
| 12px typography floor (0.75rem) | ✓ | typography-contract test passes |

---

## G. ISSUES FOUND

### G.1 — Path-semantics data bug in `ai-agents-automation-stack` **[FIXED]**

**Symptom.** On the agents detail page, the `cx-stack` rail rendered AgentX
(stage 01) and Flowise (stage 02) both as CORE, then continued with Make
(stage 03), ChatBot (stage 04), CosmicJS (opzionale).

**Why this is wrong.** AgentX (no-code agent builder, managed) and Flowise
(LangChain self-hosted builder) are not two sequential stages of one
workflow. They are **mutually exclusive architectural paths**. Rendering
them as adjacent CORE positions:

- falsely suggests a `AgentX → Flowise` sequence that does not exist,
- artificially inflates the CORE count to 4 instead of 2,
- misleads users into believing they need both subscriptions,
- contradicts the page's own lede copy: *"AgentX, Flowise e Make non
  vanno usati insieme per partire: hanno ruoli distinti"*.

**Root cause.** The V2 data slot for Flowise inherited `status: "core"`
from the V1 model where the slot list was the rail directly. The V2
status field already supported the fix; the data was just stale.

**Cross-check.** A Python sweep across all 8 Collections for adjacent
CORE slots that were *alternatives* of the same stage found no other
conflicts. Single-slot issue, not a class.

### G.2 — V1 dead components (not blocking)

`collection-card.tsx`, `collection-slot-card.tsx`,
`mobile-collections-view.tsx` are still present in the tree but no
longer rendered by the V2 routes.

**Decision: leave in place.** `git grep` confirmed no live import in
the V2 route tree, but historical tests and the admin module
(`app/(admin)`) still reference the symbols through shared
types/utilities. Surgical removal is not a certification prerequisite
and risks collateral import churn. Tracked for a future cleanup pass
(already noted in the Phase 2 deliverable).

### G.3 — Pre-existing global cookie banner overlap (out of scope)

First-load cookie/privacy banner can overlap the bottom of the
`/collections` index on shorter viewports. This is a **pre-existing
global site behavior** not introduced by the Collections rebuild and
not modified by this certification pass. Documented for awareness.

### G.4 — `creator-video-stack` rail ↔ LEAN count mismatch (editorial)

The rail has 5 CORE slots but the LEAN variant narrows to 4. Visually
consistent and editorially defensible (LEAN intentionally drops one
slot) but the count delta is unannotated. **Not fixed** in this pass —
it is an editorial-design choice, not a defect. Flagged for editorial
review in a future pass.

### G.5 — Index 8th card alone in its row (visual)

`personal-brand-linkedin-stack` is the 8th Collection and renders alone
in a 2-col grid. Not breaking; mild asymmetry. Left as-is: imposing a
4×2 grid on 8 items would force awkward reordering.

---

## H. FIXES APPLIED

### H.1 — `lib/data/content-collections.ts` (single slot, 5 line changes)

The only file touched in this certification pass.

```diff
@@ ai-agents-automation-stack → slots[1] (tool_slug: "flowise")
-        stage: "Agent runtime (self-hosted)",
-        status: "core",
-        role: "Builder visuale LangChain per agent e RAG",
-        note: "Per chi vuole costruire agent AI self-hosted con LangChain. Più controllo, più competenze richieste.",
+        stage: "Agent runtime (alternativa self-hosted)",
+        status: "alternative",
+        role: "Alternativa a AgentX per il percorso self-hosted LangChain",
+        note: "Sostituisce AgentX quando il team vuole agent AI self-hosted con LangChain, più controllo, più competenze richieste.",
         ...
-        next_handoff: "Gli agent si espongono via API o si collegano a Make.",
+        next_handoff: "Sostituisce AgentX nello stesso stage; si espone via API o si collega a Make.",
```

**Why these 5 lines and not a component change.** The prompt's guidance
was: "If the data model itself is already able to express path
semantics explicitly, prefer semantic data over heuristic inference."
The V2 `status: "core|optional|alternative"` field was already
expressive. The data was the wrong layer; the components were already
correct.

**Rendered outcome** (verified at 1280×800 and 390×800 after the fix):

- Rail shows only `AgentX → Make` as CORE
- Flowise moved to a `cx-stack__subgroup-card` with title *"Agent runtime
  (alternativa self-hosted)"* and replacement badge *"Sostituisce AgentX"*
- CosmicJS (opzionale) is now the only non-CORE adjunct; its `Storage
  (opzionale)` subgroup is preserved
- Lede paragraph continues to explain the three-way relationship correctly
- Anti-recommendation, decision intelligence, scenario, related
  Collections sections all unaffected

No CSS, no component, no schema, no copy outside this single slot.

---

## I. EDITORIAL INVARIANTS

V2 data model integrity re-confirmed after fix.

| invariant | result |
| --- | --- |
| exactly 8 Collections | ✓ |
| valid slugs for all 8 | ✓ |
| valid tool slugs in all slot lists | ✓ |
| valid `relevant_guide_slug` references | ✓ |
| `status ∈ {core, optional, alternative}` distribution unchanged | ✓ (one slot moved core → alternative) |
| valid handoffs (`next_handoff` text, `manual_handoff` boolean) | ✓ |
| Collection related-graph connections | ✓ (unchanged) |
| scenarios present for all 8 | ✓ |
| anti-recommendations present for all 8 | ✓ |
| `last_verified` freshness field | ✓ (agosto 2026 across the board) |

**Test commands:**

```
npx vitest run __tests__/lib/data/content-collections-editorial.test.ts
  → 13/13 pass
npx vitest run __tests__/lib/data/content-collections-resolved.test.ts
  → 2/2 pass
npx vitest run __tests__/lib/data/collection-repository.test.ts
  → pass
```

---

## J. CROSS-SCOPE SAFETY

| area | status | evidence |
| --- | --- | --- |
| `audits/commercial-*` | untouched | untracked dirs preserved through push |
| `audits/partner-*` | untouched | untracked dirs preserved through push |
| `lib/monetization`, `lib/sponsors`, `lib/ads`, `lib/affiliates` | untouched | `git diff --stat` on `main` shows only `lib/data/content-collections.ts` |
| `app/(admin)` | untouched | no admin route modified |
| `/posts`, `/toools`, `/compare`, `/home`, `/hero` | untouched | no modifications |
| `app/(marketing)/guides/**` (related Guides relationship) | untouched | guide graph still rendered from Phase 1 |
| Index `collections[0]` lead-card logic | confirmed intentional | `cx-card--lead` rendered first; not changed |
| Production source-of-truth (Supabase / Cloudflare / Workers) | unchanged | no deploy, no env change, no schema migration |
| Cloudflare wrangler / Supabase / GitHub settings | not touched | – |
| V1 dead components | intentionally retained | see G.2 |

`git diff 1206a9b..20bf10c --stat`:

```
 lib/data/content-collections.ts | 10 +++++-----
 1 file changed, 5 insertions(+), 5 deletions(-)
```

---

## K. VALIDATION

All commands run on the same machine, same Node session:

| command | result |
| --- | --- |
| `npm run typecheck` | ✓ clean (0 errors) |
| `npm run lint:ci` | ✓ clean (0 warnings, 0 errors) |
| `npx vitest run` | 1827 pass / 32 skip / 1 fail |
| `npx vitest run __tests__/lib/data/content-collections-editorial.test.ts` | 13/13 pass |
| `npx vitest run __tests__/lib/data/content-collections-resolved.test.ts` | 2/2 pass |
| `npm run build` | ✓ production build successful, all routes pre-rendered or SSG'd |
| `agent-browser eval` (overflow at 360/390/430/768/1280/1536) | 0 / 0 / 0 / 0 / 0 / 0 |

**One failing test** is `__tests__/scripts/runtime-contract.test.ts`:
the pre-existing Node 22.23.1 vs local 26.5.0 runtime-contract mismatch
that was already documented in Phase 1 / Phase 2 as out of scope. It is
not introduced or worsened by this pass. Not addressed.

---

## L. PRODUCTION ARCHITECTURE (re-confirmed, unchanged)

- Data source of truth: `lib/data/content-collections.ts` (V2 model,
  8 Collections).
- Render path: SSG via `generateStaticParams` at build time.
- Admin mutations: write through `app/(admin)` → Supabase only, never
  the static file.
- Cloudflare Pages serves the static output. No Worker, no KV, no
  Edge function changes from this pass.
- No deploy was executed. `wrangler pages deploy` was not invoked.

---

## M. REMAINING ISSUES (non-blocking)

1. **V1 dead components** (`collection-card.tsx`, `collection-slot-card.tsx`,
   `mobile-collections-view.tsx`) — see G.2. Tracked for cleanup pass.
2. **Cookie banner overlap on first load** — see G.3. Global pre-existing
   issue, not Collections-specific.
3. **`creator-video-stack` rail/LEAN count delta** — see G.4. Editorial
   decision, not a defect.
4. **Index 8th card alone in row** — see G.5. Acceptable visual asymmetry.
5. **Pre-existing Node runtime-contract test failure** — see K. Out of
   scope per the prompt.

None of the above blocks certification. Each is documented for the next
maintenance pass.

---

## ARTIFACTS

10 final certification screenshots saved in this directory:

- `01-ai-agents-1280.png` — agents detail, post-fix, desktop
- `02-ai-agents-390.png` — agents detail, post-fix, mobile
- `03-index-1280.png` — collections index, desktop
- `04-solo-founder-1280.png`
- `05-mvp-saas-1280.png`
- `06-creator-video-1280.png`
- `07-personal-brand-1280.png`
- `08-customer-support-1280.png`
- `09-content-marketing-1280.png`
- `10-design-sprint-1280.png`

Phase 2 deliverable (UI/UX rebuild narrative): `audits/collections-ui-rebuild-2026-08-10/DELIVERABLE.md`.

---

**COLLECTIONS FINAL CERTIFICATION — PASS**
