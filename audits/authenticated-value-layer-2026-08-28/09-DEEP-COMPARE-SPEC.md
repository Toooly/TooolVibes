# 09 — Deep Compare Spec

**Status:** TARGET Wave E. Not built.  
**CURRENT:** one route `/compare` → `ToolBattleView`. Guest and auth share the **same** basic workbench: 2–5 tools, objective, ranking, matrix, Fast Decide via DecisionSheet. No personal overlay. Compare objective lives in a separate localStorage key (not synced). No second Compare.

---

## Law

Same route: **`/compare`**. No second Compare. DecisionSheet remains the canonical commit surface. Do not duplicate DecisionSheet inside Deep Compare.

**GUEST TARGET:** current Basic Compare (`compare.basic`) — public.  
**AUTH TARGET:** Basic Compare **plus** a personal context layer (`compare.deep`).

---

## What Deep Compare is

A **layer** on the existing workbench that reads the user’s workspace maps for each compared slug.

It is not:

- a new scoring system
- a fake “match %”
- a second decision form
- a fork of the route

---

## Information hierarchy (avoid avalanche)

Per compared tool, **three densities**:

### L1 — always visible (auth, if any personal fact exists)

One line max, chips not paragraphs:

- relationship: Salvato / Scelto / Scartato / Rimandato / In uso (one chip)
- if using: “In uso”
- if in stacks: first stack name, `+N` if more

If **no** personal fact, L1 is empty (guest-identical column).

### L2 — on expand / “Nel tuo spazio” disclosure (default collapsed on mobile)

- private note excerpt (2 lines) if `note.private` exists
- decision reason / useCase if present
- review due if `revisitAt` due
- replacement `replacedBy` name if any
- last Filo event humanized (one line)

### L3 — not in Compare

Full Filo, DecisionSheet, Tool Page personal insights. Links out:

- “Apri decisione” → DecisionSheet (existing door)
- “Apri tool” → `/toools/{slug}`
- personal insight chips: **max 1** per column in Wave E; Wave F may fill `OVERLAP` / `WHY_NOT` / `DECISION_CONTEXT` only

---

## Guest

Unchanged basic compare. If a guest hits a Deep Compare control (the disclosure or “Nel tuo spazio”):

- AuthSheet `compare.deep`
- continuation `{ }` or current compare slugs **only as returnTo `/compare`**
- do **not** persist untrusted slugs from intent into the tray; tray already lives in V1 locally and will merge on attach

---

## Auth without personal data

Deep Compare still looks like Basic Compare. Empty personal layer is correct. Do not show zeros or “nessun insight”.

---

## DecisionSheet

Still the one commit. Deep Compare must not add a parallel Scegli/Scarta form (CURRENT already removed the live inline form). After Decide, battle dies (existing law).

---

## Data

All from already-loaded `WorkspaceStateV1` + public catalog names. No extra fetch per column. Use the shared workspace index (Wave D; if E ships before D, build a tiny per-compare map of the ≤5 slugs only).

---

## FUTURE

Synced compare objective inside V1 (CURRENT split store). Multi-battle trays. Not E.

---

## Forbidden

New `/compare-deep` route. Fake scores. Information dump of full Filo in the matrix. Gating basic compare. Home 2.1. Salvati redesign.
