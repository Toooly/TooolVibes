# 03 — Authenticated Value Doctrine

**Status:** TARGET doctrine. CURRENT product is described only to contrast.  
**This is not pricing.**

---

## Core thesis

**ACCOUNT VALUE MUST COME FROM IDENTITY, PERSISTENCE, PERSONAL CONTEXT, AND TIME.**

Never from arbitrary feature removal.

If a capability does not genuinely require identity, persistence, or personal context, gating it is an artificial paywall. TooolVibes will not do that.

---

## The loop (unchanged)

DISCOVER → SAVE → ORGANIZE → COMPARE → DECIDE → REMEMBER → RE-EVALUATE

Durable object (binding, from 2026-08-26 decisions, still law):

**USER ↔ TOOL RELATIONSHIP THROUGH TIME**

Do not create another product silo. Home, Salvati, Stack, Catalogo remain the authenticated primary destinations. This workstream **progressively enhances** those rooms. It does **not** redesign Home (no Home 2.1) or Salvati (no Salvati 2.1).

---

## Two sentences

**GUEST = DISCOVER + CHEAP LOCAL CAPTURE**

**LOGGED = UNDERSTAND + ORGANIZE + DECIDE + REMEMBER**

Guest must still understand and enjoy TooolVibes. Account value is a gradient, not a wall.

---

## Value ladder (product layering, NOT pricing tiers)

| Level | Name | Job | CURRENT | TARGET |
|---|---|---|---|---|
| 0 | VISITOR | Discover | Catalog, tool pages, Radar, editorial, basic search | same |
| 1 | GUEST WORKSPACE | Capture locally | Save, basic compare, Fast Decide, scratch note, usage | same — do not strip |
| 2 | AUTH PERSONAL WORKSPACE | Persist + organize + remember | Cloud sync, Home, Salvati 2.0, Stack create, Filo UI, Review, export — **but no AuthSheet / continuation** | Level 2 rooms **plus** natural gating, pending intent, field-level merge, productized private notes |
| 3 | AUTH INTELLIGENCE | Interpret the user's software world | **Not shipped.** Helper `recommendWorkspaceTools` unused. Palette aliases are keywords only | Personal search, Deep Compare overlay, Personal Insights, relationship-aware Radar |
| 4 | COMMUNITY | Contribute contextual experience | **Not shipped.** `/contributi` is editorial email | Esperienze — DESIGN ONLY until Wave H is explicitly approved |

Do not introduce paid tiers, Pro, Premium, credits, tokens, or caps.

---

## Natural gating law

For every candidate logged-only capability, ask:

> Does this feature genuinely REQUIRE identity, persistence, or personal context?

| Answer | Action |
|---|---|
| YES | Auth gating is natural. Use AuthSheet + continuation. |
| NO | Do not gate it just to force signup. |

### Applied (locked)

| Capability | Requires identity? | Gate? |
|---|---|---|
| Catalog / tool page / basic search / public Radar / editorial collections | No | Never |
| Basic Compare | No | Never |
| Local Save | No | Never |
| Fast Decide | No | Never |
| Guest scratch note on `/shortlist` | No | Never strip |
| Personal Stack create/edit | Yes — persistent working set | Auth-only TARGET |
| Cloud workspace | Yes | Auth (CURRENT server) |
| Filo UI / Review queue | Yes — time + identity | Keep auth-only rooms |
| Productized private notes (Tool Page, search, Filo) | Yes — personal memory | Auth TARGET Wave C |
| Personal search DSL | Yes — personal corpus | Auth TARGET Wave D |
| Deep Compare overlay | Yes — personal context | Auth TARGET Wave E |
| Personal Insights | Yes — derived from workspace | Auth TARGET Wave F |
| Relationship-aware Radar | Yes — join to workspace | Auth TARGET Wave G |
| Community write | Yes — ownership + moderation | Auth, Wave H only |

---

## Why should a user log in? (the product must make this obvious)

**Strongest reason:** *Your software memory follows you.* Salvati, decisioni, stack, note, review — across devices and across time.

Not: “unlock the catalog.”  
Not: “this feature requires login” as primary copy.

CURRENT gap: login mostly changes **which room** you see, not **which verbs** you gain — and the one verb that is gated (stack create) has **no door**.

---

## Conversion without fatigue

- One AuthSheet system, not many modals.
- Benefit headline, never “Registrati per continuare” as primary copy.
- At most one gate per task.
- Guest verbs stay free.
- No padlocks on catalog cards or tool identity.
- Resume the action after magic-link. If resume is unsafe, land in the relevant auth room without mutating.

---

## Guest preservation (law)

These remain public in TARGET and must not silently move behind auth:

- Catalog
- Tool Page public layer
- basic Search
- public Radar
- Basic Compare
- Fast Decide
- local Save
- local scratch note (`note.local`)
- editorial collections
- FUTURE public Community read

---

## Auth rooms vs auth intelligence

**CURRENT Level 2 rooms (already shipped, do not redesign here):** Home 2.0, Salvati 2.0, Stack destination, Filo UI, DecisionSheet, Review queue.

**TARGET additions to Level 2:** AuthSheet, pending intent, field-level merge, productized private notes.

**TARGET Level 3 (not current):** personal search, Deep Compare, Personal Insights, relationship-aware Radar.

Blurring CURRENT rooms with TARGET intelligence is the contradiction this package exists to prevent.

---

## Binding decisions this package obeys (08-26, still law)

- One continuous application. Public = discovery layer of the same app.
- One working library. Guest save remains. Login is not required at first save.
- Compare is a mode, not a second product. Battle dies on Decide.
- One Decide commit, many doors. Do not block Fast to force Deep.
- No Recenti as primary dest. No visible XP. No default push.
- No public stack showcase as the personal Stack product.
- Authenticated chrome must not costume-change on Catalogo, Radar, tool page, or Compare workbench.

This workstream **extends** those decisions. It does not reopen them.

---

## Forbidden (doctrine-level)

NO Premium  
NO Home 2.1  
NO Salvati redesign  
NO Stack destination redesign  
NO new Compare route  
NO second notes DB  
NO LLM search V1  
NO fake AI scores  
NO notification center  
NO social graph  
NO community implementation in A–G  
NO arbitrary lock icons
