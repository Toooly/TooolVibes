# 08 — Private Notes Spec

**Status:** TARGET Wave C for productized auth notes. Guest scratch is CURRENT and must remain.  
**CURRENT field:** `WorkspaceToolState.note: string | null` max **2000** (`lib/discovery/workspace-constants.ts`). Writers: `setWorkspaceNote`. Surfaces today: guest `/shortlist` board sheet; auth Salvati 2.0 inline form. **Not** on Tool Page. **Not** in Speed-2 overflow. **Not** searchable as `q_note`. **No** Filo event type `noted` (SQL enum has decided/reopened/started_using/stopped_using/replaced/revisit_set/revisited).

Do **not** create a second notes database.

---

## Distinction

| | Guest scratch `note.local` | Auth private `note.private` |
|---|---|---|
| CURRENT | yes on `/shortlist` | Salvati 2.0 only |
| TARGET | **keep** scratch on `/shortlist` | Tool Page + Salvati + DecisionSheet + Filo snapshot + personal search |
| Persistence | guest localStorage | V1 + cloud CAS |
| Search | no | Wave D `note:yes` / `q_note:` |
| Filo | no | snapshot visible; event optional FUTURE |

Private notes are **not** public Experiences. See `11-COMMUNITY-EXPERIENCES-SPEC.md`.

---

## Reuse

**Always reuse `toolStates.note`.** One string per tool slug. Empty/null = no note.

Related but distinct CURRENT fields — do not merge in Wave C:

- `saveReason` (enum, guest-board leaning)
- `useCase` (decision/use-case chips)
- DecisionSheet “Perché” currently maps to event `reason` **and** can write `note`

Wave C must **not** reopen the 08-26 “merge saveReason/useCase/note” decision as a schema project. Notes stay `note`. Perché stays decision reason. Use case stays `useCase`.

---

## Surfaces (TARGET Wave C)

| Surface | Guest | Auth |
|---|---|---|
| Tool Page | no composer (AuthSheet on “Aggiungi nota”) | personal layer composer |
| Salvati 2.0 | n/a (room is auth) | keep/refine inline — **no Salvati redesign** |
| DecisionSheet | Fast Decide public; note field remains optional local if already there | same sheet; note is memory |
| Filo | no UI | show current note as snapshot line if present (“Nota: {excerpt}”) — not a new event unless `noted` exists |
| Personal search | n/a | Wave D |
| Speed-2 overflow | do not add note in C if it fights two-speed save quietness | optional later; not C required |

Do not clutter Salvati rows: excerpt behind existing ⋯ / inline, not a new column.

---

## Edit / save / delete

| Rule | V1 |
|---|---|
| Max length | 2000 (CURRENT constant) |
| Empty | `null` or `""` normalized to `null` = delete |
| Save | **manual Conferma** on Tool Page (avoid noisy autosave CAS). Salvati may keep CURRENT blur/save behavior if already shipped — do not regress. |
| Timestamp | `toolStates[slug].updatedAt` (CURRENT). No separate `noteUpdatedAt` in V1. |
| Create | first non-empty write |
| Delete | set null |

---

## Filo integration and `noted` event

**OPEN QUESTION 1.**

**Wave C V1 recommendation (locked unless implementation discovers a Filo hole):** **snapshot only.** Filo already falls back to “1 stato” from judgment snapshots (`summarizeFilo`). Showing the current note text in the Filo panel is enough. Adding `noted` requires:

- TypeScript event union
- Zod schema
- SQL `workspace_state_v1_is_valid` enum (`20260828000000_workspace_state_v1_events.sql`)
- cap-200 eviction policy (notes could spam the journal)

**FUTURE:** additive `noted` event if we need “edited note at T” history. Not Wave C required.

Migration cost of `noted`: **schema validator migration**, not a new table. Still DEFERRED from C.

---

## Continuation

Guest clicks Tool Page “Aggiungi nota” → AuthSheet `note.private` → intent `{ slug }` → after attach open composer **without writing empty note**.

Merge: field-level `note` (see `10-STACK-AUTH-MIGRATION.md`). CURRENT wholesale account win can **drop a guest note** on overlapping slugs — Wave B must fix before Wave C can promise memory.

---

## Search

Wave D: `note:yes`, `q_note:"..."`. Wave C does not need a search box of its own.

---

## Security / privacy

Notes are inside the workspace blob. Never a public column. Never sent to an LLM in this workstream. Never shown on public tool pages. Cross-user leak = workspace leak (CAS/owner). See `12-SECURITY-RISK-MAP.md`.

---

## Forbidden

Second notes DB. Guest note stripped. Autosave storms. `noted` as a C blocker. Public notes. Star ratings.
