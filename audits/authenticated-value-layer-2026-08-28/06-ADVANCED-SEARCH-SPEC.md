# 06 — Advanced Search Spec (Personal Search V1)

**Status:** Wave D IMPLEMENTED / ACCEPTED. Not released until deploy.

**Shipped:** `lib/search/personal-search-query.ts` parser, `workspace-search-index.ts`, `personal-search.ts` engine. Palette consumes the engine. Salvati typed query uses the same filters. Guest personal DSL/aliases → AuthSheet `search.personal` (`Cerca nel tuo spazio`); catalog words stay public. Pending intent payload is `{ query }` only, localStorage TTL 30min, never in URL, never in telemetry. `q_note` may sit in that local intent until consume. `alternative-to:<slug>` = same `categoryLabel` plus `toolStates.alternatives`, minus self. Unknown `key:value` tokens become free text. Salvati chips stay; they AND with the typed query.  
**CURRENT:** in-memory catalog engine `lib/search/tool-search.ts` (accent-insensitive, AND tokens, Damerau-1). Command palette adds keyword aliases (`rimandati`, `in uso`, …) and saved/stack name matches. Salvati has substring `matchesSalvatiSearch` (name/slug/category/useCase). **No FTS, no embeddings, no LLM, no personal DSL.**

Guest palette aliases currently deep-link `/account?view=salvati` (dead-end). That is a CURRENT bug to fix when palette routing is touched (Wave D, or a tiny A/B fix if aliases are hit earlier — prefer Wave D unless A+B already edits palette).

---

## Law

**No LLM V1. No embeddings. No server FTS required. No whole-workspace LLM.**

Personal search is deterministic: catalog search + workspace indexes + relationship filters.

---

## Access

| Viewer | Behavior |
|---|---|
| Guest | `search.basic` only. Catalog tokens. Palette Trova = catalog + local saved **names**, Vai = Salvati `/shortlist` + Catalogo + Radar. Personal aliases that require Salvati 2.0 **must not** send guests to `/account`. |
| Auth | `search.basic` **plus** `search.personal` |

If a guest types a personal DSL token (`in:saved`, `usage:using`), **do not** run it against an empty account. Show AuthSheet `search.personal` with continuation `{ query }` **or** silently ignore unknown filters and run catalog search. **Lock: unknown `in:` / `status:` / `usage:` filters on guest → AuthSheet**, because the user expressed personal intent. Bare catalog words stay public.

---

## Query model

```
query := catalog_free_text? + filters*

catalog_free_text := tokens passed to existing searchTools()
filters := key:value | key:"quoted value"
```

### Canonical filters (V1)

| Filter | Meaning | Source |
|---|---|---|
| `in:saved` | slug ∈ `saved.slugs` | V1 |
| `status:da_valutare` | Salvati filter `da_valutare` | `salvati-relationship.ts` |
| `status:scelti` | selected and not using | same |
| `status:scartati` | rejected | same |
| `status:rimandati` | deferred | same |
| `usage:using` | usage === using | toolStates |
| `usage:stopped` | stopped | toolStates |
| `usage:replaced` | replaced | toolStates |
| `stack:"AI Coding"` | member of active stack whose name matches (case-insensitive) | personalStacks |
| `stack:{id}` | member of stack id | personalStacks |
| `revisit:due` | reviewDue now | pipeline / salvati |
| `note:yes` | note non-empty | toolStates.note |
| `q_note:"pricing"` | note substring, accent-insensitive | toolStates.note |
| `not:rejected` | outcome !== rejected | toolStates.decision |
| `alternative-to:{slug}` | catalog alternatives / same category as slug, minus self | catalog + V1 |
| `category:"video"` | catalog categoryLabel match | catalog |

Free-text without filters = existing `search.basic` ranking, then if auth, personal matches (saved name, stack name) may interleave in palette groups — **CURRENT palette already groups**; keep groups, do not mix scores across groups.

### Intent examples (compile to filters, not to an LLM)

| User-shaped intent | V1 compilation |
|---|---|
| tool video che ho salvato ma non ancora valutato | catalog `video` + `in:saved` + `status:da_valutare` |
| alternative a Descript che non ho già scartato | `alternative-to:descript` + `not:rejected` |
| tool AI coding che uso attualmente | catalog tokens + `usage:using` |
| tool nei miei Stack per marketing | `stack:"marketing"` or category + stack membership |
| cosa avevo rimandato da rivedere questo mese | `revisit:due` (month window = due now; no extra date math V1) |
| trova alternative ai software che uso con prezzo più basso | **not V1** — pricing sort is FUTURE; V1 can do `usage:using` + `alternative-to` per slug, no price rank unless catalog already has a comparable field used in compare |

Do not promise natural-language AI search.

---

## Parser

1. Tokenize on whitespace; keep `"quoted"` spans.
2. Tokens matching `^[a-z-]+:` (and `q_note:`) are filters; remainder is catalog free-text.
3. Unknown filter keys: ignore (do not error the whole query) **for auth**; for guest see Access.
4. Invalid values (`status:foo`): ignore that filter.
5. Multiple filters AND together.
6. Repeated same key: OR within that key (e.g. `usage:using usage:stopped`).

Pure function. No I/O.

---

## Execution

**CURRENT catalog path unchanged** for free-text.

**TARGET personal path (auth):**

1. Build **one workspace derived index per V1 revision** (see Performance):
   - `bySlug`: toolState + saved boolean + stack ids/names + reviewDue
   - `savedSet`, `usingSet`, `rejectedSet`, `noteSet`
2. Start from catalog result set (or full published catalog if only filters).
3. Apply filters as Set intersections.
4. Rank: existing catalog score if free-text present; else recency (`toolStates.updatedAt` / saved order).

No per-row O(N²). No server round trip. No LLM.

---

## Surfaces

| Surface | CURRENT | TARGET Wave D |
|---|---|---|
| Command palette | keywords + names | parser + groups: Filtri personali / Salvati / Stack / Catalogo |
| `/archivio?q=` | catalog only | **keep catalog only** — do not make Catalogo a personal OS. Personal filters in palette (and optional Salvati). |
| Salvati search box | substring | **OPEN QUESTION 4:** whether to accept DSL syntax here in V1 or keep substring and document DSL as palette-only |

**Recommendation:** Wave D V1 = command palette + keep Salvati substring. Salvati DSL is optional same wave if cheap, not a blocker.

---

## Performance

One index per `WorkspaceStateV1` revision. Maps/Sets by slug, stack, status, usage, review, notes. Insights and search **share** this index (Wave D builds it; F/G reuse).

Avoid scanning the entire workspace per result row. Avoid N+1. Avoid server recompute.

---

## FUTURE (not V1)

Semantic retrieval, embeddings, NL parser onto this same filter model, price-aware “cheaper than tools I use”, catalog-diff since last visit.

---

## Forbidden

LLM search V1. New search database. Sending workspace JSON to a model. Gating `search.basic`.
