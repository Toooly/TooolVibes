# 14 — Acceptance Plan

**Status:** TARGET evidence paths. No implementation in this package.  
Claims below are what later waves must prove. This documentation pass is accepted if the 15 files exist, CURRENT ≠ TARGET everywhere, and `git diff` is docs-only.

---

## Documentation pass (this commit)

- [ ] 15 files under `audits/authenticated-value-layer-2026-08-28/`
- [ ] CURRENT / TARGET / FUTURE / DEFERRED distinguished
- [ ] CURRENT auth contradiction corrected
- [ ] Zero `.ts` `.tsx` `.css` `.sql` package changes

---

## Wave A

| Claim | Evidence path |
|---|---|
| `canUse("stack.create", "guest")` is false | unit test on registry |
| `canUse("compare.basic", "guest")` is true | unit test |
| AuthSheet renders headline from capability | component test |
| Dismiss does not leave a pending intent (write-on-CTA) | component test |
| CTA writes valid PendingAuthIntent to localStorage | unit + component |
| Malformed localStorage is ignored | unit |
| `returnTo` with `//evil` or `javascript:` rejected | unit |
| Expired intent rejected | unit |
| Telemetry events named only (hooks may be no-op if ingest not wired) | unit of emit shape |
| AuthPage still works for direct `/account` | existing account tests stay green |
| Reduced motion / dialog aria | component a11y assertions already used in repo style |

Wave A **does not** require a production stack-create door until B.

---

## Wave B — primary conversion (A+B release)

Happy path (must be automatable and/or Playwright):

1. Guest clicks Create Stack (overflow or equivalent) on a known tool slug.
2. AuthSheet appears with stack copy.
3. Intent stored on CTA.
4. Magic link (test can stub session).
5. Auth succeeds.
6. Guest workspace merge (field-level).
7. Personal Stack action resumes.
8. Tool remains present in saved + stack membership.
9. Refresh: state persists remotely (CAS stub or contract test).
10. Second authenticated session sees it.

Also:

| Case | Expected |
|---|---|
| Dismiss | no intent, no stack, guest still guest |
| Expired intent | land `/account?view=stack`, no mutate |
| Malformed payload | land stack view, no mutate |
| Failed auth | guest state intact, intent may remain until expiry |
| Remote unavailable | existing attach failure UX; **no** fake stack; intent not half-applied |
| Duplicate replay | second pass no-ops; no second stack if membership exists |
| Already-auth user | no sheet; create runs |
| Guest state collision (same slug, guest note, empty account note) | guest note survives |
| Same slug both notes, newer guest `updatedAt` | guest note wins |
| Same slug both notes, equal `updatedAt` | account note wins |
| Guest-only stack id | appended |
| Colliding stack id | account name kept, slugs unioned |
| Events same id | one copy |
| Guest leftover stacks | not wiped on “auth-only” policy |
| Guest Fast Decide / save / basic compare | still work without sheet |
| `createPersonalStack` not shown to guest | W9-T19 style tests remain + sheet test added |

Do not regress `__tests__/components/tools/stack-from-save.test.tsx` W9-T18 (guest Speed 1 still no login) or W9-T19 (guest overflow no Nuovo stack) except replacing “no Accedi” with **AuthSheet on create** — T19 must be updated: guest overflow **does** show a create affordance that opens the sheet, **not** a silent omit. **Lock: B changes T19.** Silent omit is CURRENT; TARGET is a door.

---

## Wave C

Status: IMPLEMENTED / ACCEPTED (not RELEASED).


| Claim | Evidence |
|---|---|
| Guest `/shortlist` scratch note still works | existing board tests |
| Guest Tool Page has no note body; CTA opens AuthSheet | component |
| Auth Tool Page can set/clear note ≤2000 | action + UI |
| Empty note → null | unit |
| SSR public tool HTML contains no note | fetch/render test |
| Filo shows snapshot excerpt, no `noted` required | filo test |
| No new SQL | `git diff` has no migration |

---

## Wave D — ACCEPTED (gates in this branch)

| Claim | Evidence |
|---|---|
| Parser: `in:saved status:da_valutare video` AND-filters | unit |
| Guest catalog query does not require auth | existing search tests |
| Guest `in:saved` opens AuthSheet, stores query | component |
| Auth personal filter uses one index per revision | unit (index identity) |
| Palette aliases do not send guests to `/account` | palette test (fixes CURRENT dead-end) |
| No LLM / no extra search HTTP | grep + network |

---

## Wave E — IMPLEMENTED / ACCEPTED (not RELEASED until deploy)

| Claim | Evidence |
|---|---|
| `/compare` still public basic | existing compare tests |
| Auth L1 chips from workspace maps | `__tests__/lib/compare/compare-personal-context.test.ts` |
| Guest deep disclosure → AuthSheet | auth-sheet DEEP-AUTH-04 |
| DecisionSheet still the only commit | no second form; decide panel unchanged |
| ≤5 slugs, no N+1 | derive uses one workspace index |
| No private note in guest HTML | DEEP-PRIV-01 |

---

## Wave F / G

| Claim | Evidence |
|---|---|
| Insights have type + explanation + source | unit of derivation |
| No numeric score UI | UI test / grep |
| No match → render nothing | unit |
| Tool static page has no personal insight HTML | SSR |
| Radar public identical for guest | radar tests |
| Auth radar chip only when join rule matches | unit |

---

## Wave H

Not accepted in this workstream. Any implementation PR without explicit approval is out of scope.

---

## Invariants every wave must keep green

- Guest: catalog, tool page public, basic search, public radar, basic compare, Fast Decide, local save, local scratch note, editorial collections
- No Premium
- No Home 2.1 / Salvati redesign
- Merge tests + workspace isolation tests
- Canonical remote CAS tests

---

## Verification philosophy

Prefer contract tests on merge and intent validation (deterministic) over only UI snapshots. Playwright for the A+B happy path once AuthSheet exists. Do not add a new analytics vendor to “prove” conversion in V1; telemetry hooks are enough to inspect later.
