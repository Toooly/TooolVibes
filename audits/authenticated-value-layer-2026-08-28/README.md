# Authenticated Value Layer 1.0

**Status:** ARCHITECTURE LOCKED. Wave A + Wave B IMPLEMENTED / ACCEPTED on `feature/authenticated-value-layer-a-b`. Not RELEASED. Wave C NOT STARTED.  
**Date:** 2026-08-28  
**Baseline:** `main` @ `1e4c7a2ac725e8c2b95751b4048cfcd200f73a19`  
**Branch:** `feature/authenticated-value-layer-a-b`  

This folder is the canonical architecture for making authentication meaningful on TooolVibes. It governs later implementation. It is not a changelog of shipped product.

---

## Why this project exists

TooolVibes already has a strong public/guest product and an authenticated workspace.

The problem is not that guests are blocked. The problem is the opposite:

**CURRENT:** a logged-in user does not yet unlock enough *additional productized value* compared with a guest. Login mostly swaps rooms (legacy `/shortlist` to Salvati 2.0, plus Home / Stack / Filo) rather than adding verbs that require identity.

**TARGET:** Guest = DISCOVER + cheap local capture. Logged-in = UNDERSTAND + ORGANIZE + DECIDE + REMEMBER.

Account value must come from identity, persistence, personal context, and time — never from arbitrarily removing public features.

This is **not pricing**. There is no Pro, Premium, credits, tokens, or usage cap in this workstream.

---

## Mandatory distinction

Every document in this package labels facts as:

| Label | Meaning |
|---|---|
| **CURRENT** | What the repo does today at SHA `1e4c7a2` |
| **TARGET** | What this architecture will make true |
| **FUTURE** | Later than the eight waves, not scheduled |
| **DEFERRED** | Explicitly out of this workstream |

Do not read a TARGET row as shipped.

### CURRENT vs TARGET auth — correction

A prior summary incorrectly listed Deep Compare, Personal Insights, relationship-aware Radar, Community write, AuthSheet, pending-intent, tool-page notes, and personal search DSL as current auth capabilities.

**CURRENT auth already has:**

- cloud persistence (canonical remote workspace)
- Home 2.0 (`/account`)
- Salvati 2.0
- personal Stack create/edit (UI-gated, not server-gated)
- DecisionSheet / persistent decision workflow
- Filo UI
- Review queues on Home / Salvati
- Settings / export
- account-scoped workspace
- `toolStates.note` where already surfaced (Salvati 2.0; guest scratch on `/shortlist`)
- command-palette personal aliases (keyword lists, not a search DSL)
- Software Memory **data** (usage, replacedBy, decisions, events, revisitAt)
- canonical remote workspace CAS

**CURRENT auth does not yet have as productized capabilities:**

- contextual AuthSheet
- pending-intent continuation after login
- private-note experience on the Tool Page
- unified searchable private-note layer
- structured personal search DSL
- real Deep Compare layer
- Personal Insights
- relationship-aware Radar
- Community Experiences
- `community.write`

Those last items are TARGET (or Wave H DESIGN-ONLY).

---

## Doctrine in one paragraph

Guest save, basic compare, and Fast Decide remain public. Login is for cross-device continuation, named stacks, export, Filo, review, productized private notes, and later intelligence. Do not cripple discovery to manufacture signup. Do not scatter padlocks. When a guest hits an identity-dependent **action**, show one contextual Liquid Glass AuthSheet with benefit copy, store a `PendingAuthIntent` in `localStorage`, and after magic-link + workspace attach replay **one** safe intent.

---

## Value ladder (not pricing)

| Level | Name | Job |
|---|---|---|
| 0 | Visitor | Discover |
| 1 | Guest workspace | Capture locally |
| 2 | Auth personal workspace | Persist + organize + remember |
| 3 | Auth intelligence | Interpret the user's software world |
| 4 | Community | Contribute contextual experience |

CURRENT product reaches Level 2 **rooms** (Home, Salvati 2.0, Stack, Filo) without Level 2 **conversion UX** (AuthSheet + continuation) and without Level 3 surfaces.

---

## Document map

| File | Role |
|---|---|
| [01-CURRENT-ACCESS-MATRIX.md](./01-CURRENT-ACCESS-MATRIX.md) | Repo-grounded map of what guest vs auth can do **today** |
| [02-TARGET-ACCESS-MATRIX.md](./02-TARGET-ACCESS-MATRIX.md) | Canonical target access for every capability |
| [03-AUTHENTICATED-VALUE-DOCTRINE.md](./03-AUTHENTICATED-VALUE-DOCTRINE.md) | Product philosophy and natural-gating law |
| [04-CAPABILITY-REGISTRY-SPEC.md](./04-CAPABILITY-REGISTRY-SPEC.md) | Minimal `canUse` registry — not RBAC |
| [05-AUTH-GATING-UX.md](./05-AUTH-GATING-UX.md) | One AuthSheet + pending intent |
| [06-ADVANCED-SEARCH-SPEC.md](./06-ADVANCED-SEARCH-SPEC.md) | Deterministic personal search V1 — no LLM |
| [07-PERSONAL-INSIGHTS-SPEC.md](./07-PERSONAL-INSIGHTS-SPEC.md) | Explainable deterministic insights — no fake scores |
| [08-PRIVATE-NOTES-SPEC.md](./08-PRIVATE-NOTES-SPEC.md) | Productized notes on `toolStates.note` |
| [09-DEEP-COMPARE-SPEC.md](./09-DEEP-COMPARE-SPEC.md) | Personal layer on `/compare` — no second route |
| [10-STACK-AUTH-MIGRATION.md](./10-STACK-AUTH-MIGRATION.md) | Stack auth-only + guest to auth field-level merge |
| [11-COMMUNITY-EXPERIENCES-SPEC.md](./11-COMMUNITY-EXPERIENCES-SPEC.md) | Esperienze — **design only**, Wave H |
| [12-SECURITY-RISK-MAP.md](./12-SECURITY-RISK-MAP.md) | Threat model, including existing health-endpoint debt |
| [13-IMPLEMENTATION-WAVES.md](./13-IMPLEMENTATION-WAVES.md) | Waves A–H, complexity, first ship = A+B |
| [14-ACCEPTANCE-PLAN.md](./14-ACCEPTANCE-PLAN.md) | Evidence path per wave, especially A+B |

Related prior work (do not treat as this package): `audits/my-tooolvibes-authenticated-forensic-2026-08-26/`, `audits/my-tooolvibes-product-synthesis-2026-08-26/DECISIONS.md`. Home 2.0 and Salvati 2.0 have shipped since that forensic; this package is current as of `1e4c7a2`.

---

## Wave sequence

| Wave | Name | Status in this package |
|---|---|---|
| **A** | Capability registry + AuthSheet + pending intent + telemetry hooks | TARGET, not built |
| **B** | Stack natural gating + continuation + field-level merge | TARGET, not built |
| **C** | Private notes (Tool Page + searchable product layer) | TARGET, not built |
| **D** | Personal search DSL | TARGET, not built |
| **E** | Deep Compare layer | TARGET, not built |
| **F** | Personal Insights | TARGET, not built |
| **G** | Relationship-aware Radar | TARGET, not built |
| **H** | Community Experiences | DESIGN ONLY — do not implement in A–G |

**Release recommendation:** develop A and B separately if useful; **ship A+B as one first user-facing slice**. Do not ship an AuthSheet with nothing meaningful behind it.

---

## Key locked decisions

1. **Natural gating.** If a feature does not require identity, persistence, or personal context, do not gate it.
2. **Guest remains strong.** Catalog, tool pages, basic search, public Radar, basic Compare, Fast Decide, local Save, local scratch notes, editorial collections stay public.
3. **Personal Stack create/edit is auth-only** in TARGET. Editorial collections remain the public preview of the concept. Do not silently destroy leftover guest `personalStacks`.
4. **Basic Compare stays public.** Deep Compare is a personal overlay on the same `/compare` route.
5. **Fast Decide stays public.** DecisionSheet remains the one commit surface.
6. **Guest scratch notes stay.** Auth private notes productize the same `toolStates.note` field — no second notes database.
7. **Personal Search V1 is deterministic.** No LLM, no embeddings, no server FTS required.
8. **Personal Insights V1 is deterministic and explainable.** No 87/100 scores. Extend `lib/account/personalization.ts`; that helper is CURRENT code, not a shipped insights UI.
9. **PendingAuthIntent lives in `localStorage`.** Magic-link email opens a new tab; `sessionStorage` would not survive. Never in `WorkspaceStateV1`.
10. **Guest to auth merge becomes field-level.** CURRENT bug: account `toolStates` win wholesale on overlapping slugs.
11. **Community is Wave H design.** No implementation in A–G.
12. **No Home 2.1, no Salvati redesign, no Stack destination redesign, no Premium.**

---

## What implementation starts next

After this package is accepted:

**Next implementation pass = Wave A**, immediately followed by Wave B, released together.

Wave A must not ship alone.

Do not start community, notes UI, search DSL, insights, Deep Compare, or Radar personalization before A+B.

---

## Open questions (short)

Settled questions are not reopened here. Only these remain:

1. Does Wave C need a `noted` Filo event, or is snapshot `toolStates.note` sufficient? **Recommendation in 08: snapshot is Wave C V1; `noted` is FUTURE.**
2. Exact AuthSheet visual composition inside the existing Liquid Glass grammar (Home/Salvati tokens, not the current solid `AuthPage` card).

**Resolved:** pending-intent storage is `localStorage` (not `sessionStorage`). Evidence: magic-link href is `{origin}/auth/callback?token_hash=…` opened from the email client, typically a new tab. Callback is outside `AccountProvider`. Supabase session already uses `localStorage`.
3. Exact field-level conflict policy when guest and account edit the same field at the same `updatedAt`.
4. Whether Personal Search V1 lives only in the command palette or also exposes Salvati search syntax.

---

## Forbidden (entire workstream)

NO Premium / paid plan / tokens / credits  
NO LLM search V1  
NO fake AI scores  
NO Home 2.1  
NO Salvati redesign  
NO Stack destination redesign  
NO new Compare route  
NO second notes DB  
NO notification center  
NO public profile network / followers  
NO star ratings  
NO community implementation in waves A–G  
NO arbitrary lock icons on catalog/tool cards  
NO product code in this documentation commit
