# 02 — Target Access Matrix

**Status:** TARGET (not shipped)  
**Doctrine:** GUEST = DISCOVER + CHEAP LOCAL CAPTURE · AUTH = UNDERSTAND + ORGANIZE + DECIDE + REMEMBER  
**Not pricing.** No Pro / Premium / credits.

Labels used below: TARGET guest/auth behavior. CURRENT is only referenced to avoid blurring. FUTURE / DEFERRED called out per row.

Wave IDs: see `13-IMPLEMENTATION-WAVES.md`. Infra (`capability.registry`, `auth.sheet`) is Wave A.

---

## Public / guest-preserved (must not move behind login)

| ID | GUEST TARGET | AUTH TARGET | NATURAL GATING REASON | PUBLIC PREVIEW | AUTH TRIGGER | CONTINUATION | SERVER REQUIREMENT | DATA DEPENDENCY | WAVE |
|---|---|---|---|---|---|---|---|---|---|
| `catalog.browse` | full | full | Discovery does not need identity | the catalog | — | — | none | public tools | keep (CURRENT = TARGET) |
| `tool.page.public` | full editorial | public layer + personal layer | SEO / understand | tool page | personal slots use other IDs | — | none on public layer | editorial | keep; personal slots C/F |
| `search.basic` | catalog tokens | same | Querying public catalog | `/archivio?q=` + palette Trova | — | — | none | catalog snapshot | keep |
| `radar.public` | PH today/7g/30g | same public lens | Trending is public | `/radar` | — | — | PH API | PH payload | keep |
| `alternatives.basic` | editorial table | + later overlap via `insight.personal` | Catalog fact | tool page | — | — | none | editorial | keep |
| `collections.editorial.read` | read | read | Public stacks / concept preview | `/collections` | — | — | public read | collections tables | keep |
| `compare.basic` | 2–5 + objective + Fast Decide | same workbench | Comparison as discovery does not need identity | `/compare` | Deep layer = `compare.deep` | — | none | V1 `compare` | keep |
| `save.local` | Speed 1 local save | local + `workspace.cloud` | Capture must stay cheap | heart / bookmark | — | merge on login | none on local write | V1 `saved` | keep |
| `decide.fast` | outcome + date, local | synced | Judgment ≠ identity | DecisionSheet | deep memory is auth value, not a lock | — | none on local write | V1 decision + events | keep |
| `note.local` | scratch on `/shortlist` only | superseded by `note.private` when auth | On-device scratch does not need identity | guest board | Tool Page note = `note.private` | merge field-level | none | `toolStates.note` | keep guest; do **not** strip |
| `usage.local` | using/stopped/replaced locally | synced | Same as decide | boards | — | field-level merge | none | software memory fields | keep |

**FUTURE PUBLIC:** `community.read` — public read of published Experiences. Not in A–G. See `11-COMMUNITY-EXPERIENCES-SPEC.md`.

---

## Auth-only (TARGET)

| ID | GUEST TARGET | AUTH TARGET | NATURAL GATING REASON | PUBLIC PREVIEW | AUTH TRIGGER | CONTINUATION BEHAVIOR | SERVER REQUIREMENT | DATA DEPENDENCY | WAVE |
|---|---|---|---|---|---|---|---|---|---|
| `stack.create` | cannot create | create named stacks | Persistent working set needs identity | editorial collections | overflow / Salvati ⋯ / Stack tab “Nuovo stack” | pending intent: slug + optional name; after attach create+add | TARGET: workspace blob remains CAS-authenticated; do not rely on hidden UI | V1 `personalStacks` | **B** (sheet in **A**) |
| `stack.edit` | no personal stack room | rename/archive/reorder/membership | Ownership | none | Stack UI | N/A if already auth | same as cloud workspace | V1 | **B** |
| `workspace.cloud` | never remote | CAS sync | Cross-device persistence | AuthPage live counts (CURRENT) | login | attach merge | Bearer PUT/attach **CURRENT and TARGET** | `viewer_workspaces` | exists CURRENT; merge fix **B** |
| `filo.read` | no Filo UI | Salvati Filo | Time needs a room and a durable identity | none | Salvati row | — | blob auth | `events[]` | exists CURRENT UI; keep auth-only |
| `review.queue` | no Home queue | Home + Salvati `da_rivedere` | A remember-over-time promise | none | Home / Salvati / DecisionSheet revisit | optional later; not required for Wave B | blob auth | `revisitAt` | exists CURRENT UI |
| `note.private` | no productized note (scratch only) | Tool Page + Salvati + DecisionSheet + search + Filo snapshot | Personal memory | none | “Ricordalo nel tempo” | open composer on returnTo tool/salvati | blob auth | `toolStates.note` | **C** |
| `search.personal` | catalog search only | DSL over catalog + workspace | Needs personal corpus | basic search remains | palette / optional Salvati syntax | restore query string | client-side V1; no new search API V1 | V1 maps + catalog | **D** |
| `compare.deep` | basic only | personal context layer on `/compare` | Needs relationship context | basic compare | “Confrontalo con ciò che già usi” | reopen `/compare` with tray intact | none extra V1 | V1 maps | **E** |
| `insight.personal` | editorial only | explainable insight objects | Derived from workspace | none or one teaser that opens sheet | “Vedi cosa significa per te” | open tool personal layer | client-side | V1 + catalog; extend `personalization.ts` | **F** |
| `radar.personal` | public radar only | explainable relationship signals | Join PH ∩ workspace | public radar | Radar logged lens | restore `/radar` | client-side join | PH + V1 | **G** |
| `community.write` | no | one Experience per tool (later) | Identity + moderation | public read FUTURE | write CTA | not in V1 workspace | new tables + RLS + rate limit | new DB | **H** design; implement only after approval |
| `export.workspace` | no | settings export | Ownership of the vault | none | settings | — | session | V1 snapshot | exists CURRENT |
| `capability.registry` | n/a | `canUse(id)` | Stop ad-hoc `if (user)` | n/a | n/a | n/a | document `serverEnforced` per id | viewer kind | **A** |
| `auth.sheet` | sees sheet on gated action | never | Conversion without padlocks | n/a | gated capability | PendingAuthIntent | magic-link existing API | sessionStorage | **A** |

---

## Capability IDs — canonical list

**Public / guest (TARGET = keep public):**  
`catalog.browse` · `tool.page.public` · `search.basic` · `radar.public` · `alternatives.basic` · `collections.editorial.read` · `compare.basic` · `save.local` · `decide.fast` · `note.local` · `usage.local`

**Auth-only TARGET:**  
`stack.create` · `stack.edit` · `workspace.cloud` · `filo.read` · `review.queue` · `note.private` · `search.personal` · `compare.deep` · `insight.personal` · `radar.personal` · `community.write` · `export.workspace`

**Infra TARGET:**  
`capability.registry` · `auth.sheet`

**FUTURE public:**  
`community.read`

**DEFERRED (not in matrix as product):**  
notifications, Home 2.1, Salvati redesign, LLM search, Premium, public profiles.

---

## TARGET Guest doctrine

A guest can understand and enjoy TooolVibes: browse, read tools, search the catalog, use Radar, compare, save locally, Fast Decide, leave a scratch note on `/shortlist`. They cannot create personal Stacks, cannot use Home/Salvati 2.0/Filo, cannot rely on cloud memory. When they hit an identity-dependent action, they see a benefit AuthSheet — not a dead end.

## TARGET Auth doctrine

The same public product, plus: cloud workspace, Stacks, Filo, Review, productized private notes, personal search, Deep Compare overlay, Personal Insights, relationship-aware Radar, export. Later: write Experiences.

---

## What must not happen

- Do not gate `compare.basic` or `decide.fast` to force signup.
- Do not strip `note.local` from `/shortlist`.
- Do not invent lock icons on catalog cards.
- Do not treat CURRENT Salvati 2.0 / Filo / Home as TARGET intelligence features — they are CURRENT Level 2 rooms.
- Do not implement `community.write` in waves A–G.
