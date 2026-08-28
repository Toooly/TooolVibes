# 10 — Stack Auth Policy and Guest→Auth Merge

**Status:** TARGET Wave B. Not implemented.  
This document covers **Stacks** and the **whole guest→auth merge**, because merge bugs will destroy notes, decisions, and stack membership — not only stacks.

---

## Part A — Stack auth policy

### CURRENT

- Named stack **create** is UI-gated: `allowCreate={owner.kind === "account"}` (`stack-pick-or-create.tsx`).
- Guests with **zero** stacks: section omitted. **No Accedi CTA.** Source: “S22 Accedi-to-create is not built.”
- Guests **can** add to stacks that already exist in local V1 (unusual).
- Reducer `stacks/create` is **not** auth-checked.
- Personal stacks live in V1 `personalStacks` (max 30). Remote if account + canonical sync.
- Editorial collections (`/collections`) are a **separate** public system. Not `personalStacks`.
- Legacy `workspace.stack` lista may be adopted into id `"lista"` / name `"Lista"`.

### TARGET

| Actor | Rule |
|---|---|
| Guest | May **read** editorial collections (concept preview). May **not** create personal stacks. AuthSheet on create. |
| Auth | Create, edit, archive, restore, membership, stack compare (CURRENT `queueStackCompare` stays). |
| Leftover guest `personalStacks` | **Do not wipe.** On login, merge by stack `id` (see Part B). If a guest somehow has local stacks, add-to-existing remains until they log in. |

Stack creation is AUTH-ONLY because a persistent working set needs identity. This is natural gating, not a fake lock.

### Continuation (see also `05-AUTH-GATING-UX.md`)

Guest clicks Nuovo stack / create from overflow:

1. AuthSheet “Crea il tuo spazio di lavoro”
2. PendingAuthIntent `{ capability: "stack.create", payload: { slug, name? }, returnTo }`
3. Magic-link → attach/merge
4. Replay: ensure saved; create+add if name; else open pick/create with slug
5. Idempotent if already a member

Do not silently destroy guest compare/save while this happens.

### Server

CURRENT: no dedicated stacks API; stacks ride the workspace blob (Bearer CAS).  
TARGET Wave B: keep that. Do not add a guest remote stack writer. UI + pending intent + blob auth is the control plane. Document that hidden UI is not security; CAS still requires a session to persist remotely.

---

## Part B — CURRENT merge (bug)

`mergeGuestWorkspaceContribution` in `lib/discovery/workspace-sync.ts`:

| Field | CURRENT behavior | Lost? |
|---|---|---|
| `clearedAt` | account only | guest clear cannot wipe account (correct) |
| `saved` / `stack` | union slugs | none until remote cap 500 |
| `compare` | union, slice 0..5 | extra compare slugs |
| `personalStacks` | account + guest stacks whose **id** is new | guest stack **body** on colliding ids (account stack kept) |
| `toolStates` | `{ ...guest, ...account }` | **entire guest toolState for overlapping slugs** — notes, pins, decision, usage, revisit, useCase |
| `events` | concat then later normalize | oldest overflow at 200; **duplicate ids possible** until normalize |

Tests (`guest-account-merge-contract.test.ts`) cover list union and stack id collision. They do **not** currently assert field-level toolStates.

Attach path (`attachCanonicalWorkspace`): existing account uses empty `input` and merges **remote ⊕ guest_state** (client account snapshot ignored). Account-device dirty state must already be on the server or it is not in that attach. That is CURRENT attach semantics — Wave B may document but should **not** silently change attach-vs-remote precedence without tests. Field-level merge applies to **guest contribution vs account**, not to rewriting CAS.

---

## Part C — TARGET field-level merge doctrine

Guest handoff is a **contribution**, never an account-wide replacement.  
`clearedAt`: still account-only.

### Lists (`saved`, `stack` leftover)

**Union** slugs, stable: account order, then guest-only slugs appended. `updatedAt`: latest timestamp.

### Compare

Union then **slice 0..MAX_COMPARE_TOOLS (5)**. Precedence for which slugs survive the cap: account compare order first, then guest-only. (Same spirit as CURRENT slice, with explicit account-first cap.)

### personalStacks

- Guest stack whose `id` is **not** on the account: **append** (preserve guest name, slugs, description, archivedAt).
- Same `id`: **do not replace the account stack**. Merge **membership**: union `slugs`. Name/description/archivedAt: account wins unless account fields are empty and guest has values.
- Do not wipe guest-only stacks.

### toolStates (the CURRENT bug)

Do **not** wholesale-spread. For each slug:

1. If only guest has state → take guest.
2. If only account has state → take account.
3. If both → **per-field merge**:

| Field | Policy |
|---|---|
| `stage` | newer `updatedAt` wins; if timestamps equal, account |
| `note` | if one empty, take the other; if both non-empty and equal, that value; if both non-empty and different: newer `updatedAt`; if `updatedAt` equal: **account** (OPEN QUESTION 3 for this tie) |
| `saveReason` | same as note (non-empty prefers; else newer; tie account) |
| `pinned` | OR (either pinned stays pinned) |
| `decision` | if one missing, take the other; if both: newer `decision.updatedAt`; tie account |
| `useCase` | same as note |
| `alternatives` | union, cap 5, account order first |
| `revisitAt` | if one null, take the other; if both: later date (more conservative reminder) unless one is clearly stale — **lock: later ISO wins** |
| `usage` | if one null, take the other; if both differ: newer tool `updatedAt`; tie account |
| `replacedBy` | follows usage merge; must remain a different slug or null |
| `compareObjective` | same as usage |
| `updatedAt` | max(guest, account) after merge |

“Newer” uses `toolStates[slug].updatedAt`. If a nested decision has its own `updatedAt`, use that for the decision field only.

### events

- Concatenate.
- **Dedupe by `id`.** If same id, keep one (either; they should be identical).
- Then existing normalize / cap 200 (prefer keeping `decided` / `replaced`).
- Do not emit new events during merge.

### Caps after merge

Run existing `workspaceSyncStateV1Schema` / remote capacity. If over cap, existing capacity error path — do not drop guest-only tools silently without the CURRENT capacity rules.

---

## Simultaneous edits (OPEN QUESTION 3)

When guest and account edited the **same field** with the **same `updatedAt`** (or both missing): **account wins**. Documented as the conservative identity-preserving default. Implementers must not invent “concatenate two notes” in V1.

---

## Pending intent vs merge order

**Lock:** attach/merge workspace **first**, then replay intent. Replay writers see the merged state. If replay would exceed max stacks, skip create and land on Stack view.

---

## What not to do

- Do not copy account workspace into the guest key on logout (CURRENT isolate + restore guest overlay is correct).
- Do not destroy leftover guest stacks to “force” auth-only.
- Do not implement merge in this documentation pass.

---

## Tests Wave B must add (see `14-ACCEPTANCE-PLAN.md`)

- Guest note on overlapping slug survives when account note is empty.
- Guest note vs account note: newer wins; equal timestamp → account.
- Guest-only stack id appended.
- Colliding stack id: union slugs, account name.
- Events deduped by id.
- Pending intent replay after merge is idempotent.
