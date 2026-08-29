# 13 — Implementation Waves

**Status:** Wave A = IMPLEMENTED / ACCEPTED. Wave B = IMPLEMENTED / ACCEPTED.  
Not RELEASED (feature branch only; not merged, not deployed).  
Wave C–D = IMPLEMENTED / ACCEPTED / RELEASED.
Wave E = IMPLEMENTED / ACCEPTED (not RELEASED).

---

## Locked sequence

| Wave | Scope | Complexity | Code risk | Schema risk | Security risk | UX risk | Test burden |
|---|---|---|---|---|---|---|---|
| **A** | Capability registry; AuthSheet; PendingAuthIntent; `auth_gate_*` telemetry hooks | **M** | M (new UI + localStorage) | none | M (intent validation) | M (glass sheet) | M |
| **B** | Stack natural gating; continuation replay; field-level merge; leftover guest stacks preserved | **M** | M (merge is easy to get wrong) | none | H if merge wrong | M (first conversion) | **H** |
| **C** | Productized private notes (Tool Page + Filo snapshot + Salvati keep) | **M** | M | none for snapshot; `noted` FUTURE | M (SSR leak) | M | M |
| **D** | Personal search DSL + palette; guest alias dead-end fix | **M/L** | M–L (parser + index) | none | M (don’t log notes) | M | M/L |
| **E** | Deep Compare overlay on `/compare` | **M** | M | none | L | M (density) | M |
| **F** | Personal Insights objects + tool page layer | **M** | M | none | M (no static cache leak) | M | M |
| **G** | Relationship-aware Radar signals | **M** | M | none | L | M | M |
| **H** | Community Experiences | **L/XL** | L | **H** (new tables) | **H** | L | L |

Hypothesis validated: A=M, B=M, C=M, D=M/L, E=M, F=M, G=M, H=L/XL.

---

## Release recommendation (locked)

Develop A and B separately if useful.

**Ship A+B as one first user-facing slice.**

Do not ship an AuthSheet with nothing meaningful behind it. Stack create is the first natural door.

---

## Wave A — IMPLEMENTED / ACCEPTED (not released)

- `lib/capabilities/` registry + `canUse`
- AuthSheet (one component)
- PendingAuthIntent localStorage helpers + validation
- Telemetry events (first-party, no new vendor)
- Wire **no** product writer except through the sheet’s continue path
- Keep AuthPage for direct `/account`

Exit: sheet can open from a stub trigger in tests; production trigger is Wave B `stack.create`.

## Wave B — IMPLEMENTED / ACCEPTED (not released)

- `stack.create` uses AuthSheet + intent
- Replay after attach
- Field-level `mergeGuestWorkspaceContribution`
- Do not wipe leftover guest stacks
- Tests listed in 14
- Optional tiny: palette guest aliases should not 404 into AuthPage if touched; otherwise leave for D

## Wave C — IMPLEMENTED

- Tool Page note composer behind `note.private`
- Filo snapshot line for current note
- Salvati form stays (no redesign)
- Snapshot-only Filo; **no `noted` event in C V1**
- Depends on B merge so guest scratch can survive login

## Wave D — IMPLEMENTED / ACCEPTED (not released until deploy)

- Parser + workspace index
- Palette personal filters
- Guest: personal filter → AuthSheet; catalog words stay public
- Fix guest alias → `/account` dead-end
- Salvati DSL = OPEN QUESTION 4 (not a blocker)

## Wave E — IMPLEMENTED / ACCEPTED (not RELEASED until deploy)

- L1/L2 personal layer on `/compare` ranking
- DecisionSheet unchanged
- AuthSheet `compare.deep` for guests (“Il tuo contesto”)
- Derived from WorkspaceStateV1 + Wave D index; no new persistence

## Wave F — TARGET, not built

- `PersonalInsight` objects; extend `personalization.ts`
- Tool page personal layer
- Max 3 insights; no scores
- Do not redesign Home

## Wave G — TARGET, not built

- Radar personal chips (PH ∩ workspace)
- Public radar remains default lens

## Wave H — DESIGN ONLY

- See `11-COMMUNITY-EXPERIENCES-SPEC.md`
- New DB tables
- Do not start casually

---

## Migrations expected

| Wave | Migration |
|---|---|
| A–B, D–G | **none** (V1 reuse) |
| C V1 | **none** (snapshot note) |
| C FUTURE `noted` | SQL validator enum + TS union |
| H | **new tables** + RLS |

## New DB tables expected

**None in A–G.**  
H: experiences, reports, moderation (names TBD at implementation).

## WorkspaceStateV1 reuse

saved, compare, stack leftover, personalStacks, toolStates (including note), events, usage, replacedBy, revisitAt, decisions.

PendingAuthIntent is **not** V1.

---

## Files likely affected (when coding starts — not now)

| Wave | Likely files |
|---|---|
| A | new `lib/capabilities/*`, `components/account/auth-sheet.tsx`, `account-provider.tsx`, `lib/analytics/*` extend |
| B | `stack-pick-or-create.tsx`, `save-overflow.tsx`, `workspace-stacks.tsx`, `workspace-sync.ts`, attach path, merge tests |
| C | `tool-detail-action-surface.tsx`, `workspace-biblioteca.tsx`, `decision-sheet.tsx`, `filo.tsx` |
| D | `lib/search/*`, `global-command-palette.tsx` |
| E | `tool-battle-view.tsx` / compare chrome |
| F | `personalization.ts`, tool page personal slot |
| G | `radar-experience.tsx` (not Home 2.1) |
| H | new supabase + tool page slot — later |

---

## Explicitly not in any wave A–G

Premium, tokens, LLM search, fake scores, Home 2.1, Salvati redesign, Stack destination redesign, new Compare route, second notes DB, notification center, profiles/followers, star ratings, community implementation, padlocks on catalog cards.

---

## Next implementation pass (after this package)

**Wave A, then Wave B, released together.**  
Do not start Wave A in this commit.
