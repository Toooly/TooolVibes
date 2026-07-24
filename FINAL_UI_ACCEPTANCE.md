# TooolVibes — Final UI Acceptance (Persistent Master File)

**Source of truth** for the TooolVibes UI reconstruction across all
current and future OpenCode sessions. This file supersedes any
"READY FOR RELEASE" / "FINAL CLOSURE" / "FINAL ACCEPTANCE PASS"
verdicts in `design-qa.md` until every item below is checked.

**Status rule.** Until every required item is checked, the only
valid overall status is **FINAL UI RECONSTRUCTION IN PROGRESS**.
"READY FOR RELEASE", "FINAL CLOSURE", and "FINAL ACCEPTANCE PASS"
are explicitly disallowed.

**Completion rule.** An item may be checked only after:

1. IMPLEMENTATION (real code/component change in the working tree)
2. RENDERED SCREENSHOT (captured at the relevant viewport(s))
3. ACTUAL VISUAL REVIEW (a human or this agent has looked at the
   screenshot against the acceptance criterion, not just a code grep
   or HTTP 200)
4. RESPONSIVE VERIFICATION (checked at every required viewport for
   that workstream)

Code inspection, test passes, HTTP 200, and "looks OK in the file"
are **not** sufficient on their own.

---

## Batch progress

| Batch | Scope | Status |
|---|---|---|
| 1 | Global Shell + Global Design System | IN PROGRESS |
| 2 | Home + Tool of the Week + Podium | NOT STARTED |
| 3 | Archive + Tool Detail | NOT STARTED |
| 4 | Radar + Compare + Saved | NOT STARTED |
| 5 | Secondary routes + full responsive matrix | NOT STARTED |
| 6 | Final QA + deployment | NOT STARTED |

---

# MASTER WORKSTREAM A — GLOBAL SHELL

- [ ] Reconstruct desktop header hierarchy
- [ ] Reconstruct mobile top shell
- [ ] Reconstruct mobile bottom navigation
- [ ] Remove the crowded pill/circle cluster
- [ ] Define brand / nav / search / utilities / account hierarchy
- [ ] Verify sticky behavior
- [ ] Verify active, hover, focus, pressed states
- [ ] Verify 360 / 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920

**Acceptance**
- Header reads as one coherent premium TooolVibes command bar.
- Mobile navigation reads as intentionally designed, not just
  "labels hidden below 420px".
- No element competes for primary focus. Brand owns the start, the
  current route owns the active state, search is reachable without
  reading as a third CTA cluster.

---

# MASTER WORKSTREAM B — GLOBAL DESIGN SYSTEM

- [ ] Audit dark surfaces
- [ ] Audit ivory surfaces
- [ ] Repair explicit foreground ownership (no accidental inheritance
  between dark and light sections)
- [ ] Repair metadata hierarchy (eyebrow / label / meta / micro-meta)
- [ ] Repair pill and badge hierarchy
- [ ] Rebuild button hierarchy
- [ ] Normalize control sizes
- [ ] Normalize type scale
- [ ] Normalize spacing scale
- [ ] Normalize route intro spacing
- [ ] Create reusable TooolVibes visual primitives

**Required button system**
- PRIMARY · SECONDARY · TERTIARY · INSTRUMENT · SELECTED · DISABLED

**Required brand primitives** (derived from the existing logo)
- WAVE · SIGNAL · TRACE · ORBIT · NODE · PULSE · SCAN · LOCK

---

# MASTER WORKSTREAM C — HOME

- [ ] Refine hero layout
- [ ] Refine heading scale and wrapping
- [ ] Refine CTA hierarchy
- [ ] Refine decision journey
- [ ] Rebuild Home Radar internal composition
- [ ] Remove bad tool-name truncation
- [ ] Normalize nodes and labels
- [ ] Refine ranking markers
- [ ] Refine center instrument
- [ ] Add restrained logo-derived signal geometry
- [ ] Make Home Radar responsive
- [ ] Redesign Tool of the Week
- [ ] Redesign Podium
- [ ] Introduce controlled color and motion
- [ ] Verify reduced motion

**Acceptance**
- Home matches or exceeds the supplied GPT Sol concept quality.
- Radar does not look like a prototype.
- Tool of the Week does not look like three static dark cards on
  ivory.

---

# MASTER WORKSTREAM D — ARCHIVE / CATALOG

- [ ] Remove excessive header-to-content gap
- [ ] Complete route intro
- [ ] Refine search and statistics
- [ ] Refine objective/category territory
- [ ] Refine filters
- [ ] Refine featured rail
- [ ] Reconstruct tool-card hierarchy
- [ ] Fix unreadable category text
- [ ] Fix unreadable pills
- [ ] Fix unreadable metadata
- [ ] Refine save/compare controls
- [ ] Refine score hierarchy
- [ ] Integrate comparison tray
- [ ] Remove dead vertical areas
- [ ] Refine sponsored placement
- [ ] Verify mobile and tablet composition

**Acceptance.** On a tool card the following are immediately readable:
CATEGORY · TOOL NAME · DESCRIPTION · LEVEL · STATUS · SAVE STATE ·
COMPARE STATE · SCORE.

---

# MASTER WORKSTREAM E — TOOL DETAIL

- [ ] Refine main hero
- [ ] Refine information hierarchy
- [ ] Refine sidebar
- [ ] Refine editorial rationale
- [ ] Refine actions
- [ ] Refine partner placement
- [ ] Rebuild Alternative Decision Surface
- [ ] Fix washed-out category text
- [ ] Fix washed-out badges
- [ ] Fix secondary metadata
- [ ] Refine related tool cards
- [ ] Verify mobile presentation

**Acceptance.** No meaningful text in related-tool cards is
practically invisible.

---

# MASTER WORKSTREAM F — FULL RADAR

- [ ] Match Home Radar instrument family
- [ ] Refine route spacing
- [ ] Refine controls
- [ ] Refine node view
- [ ] Refine table view
- [ ] Refine selected-node state
- [ ] Refine metadata strip
- [ ] Verify loading
- [ ] Verify live
- [ ] Verify stale
- [ ] Verify empty
- [ ] Verify error
- [ ] Verify missing-token state
- [ ] Verify mobile and tablet

---

# MASTER WORKSTREAM G — COMPARE

- [ ] Refine candidate arena
- [ ] Refine winner hierarchy
- [ ] Refine ranking
- [ ] Refine scores
- [ ] Refine matrix density
- [ ] Refine semantic colors
- [ ] Refine factor labels
- [ ] Refine decision notes
- [ ] Build intentional mobile decision flow
- [ ] Verify tablet and laptop widths

---

# MASTER WORKSTREAM H — SAVED

- [ ] Verify empty state
- [ ] Verify one-tool state
- [ ] Verify multiple-tool state
- [ ] Verify comparison-ready state
- [ ] Verify recent state
- [ ] Refine section containers
- [ ] Refine Community suggestion flow
- [ ] Verify mobile

---

# MASTER WORKSTREAM I — SECONDARY ROUTES

- [ ] Collections
- [ ] Collection detail
- [ ] Account
- [ ] Community
- [ ] Shop
- [ ] Affiliates
- [ ] About
- [ ] Posts
- [ ] Legal routes
- [ ] Footer

Remove obsolete visual families and inconsistent surfaces.

---

# MASTER WORKSTREAM J — RESPONSIVE ACCEPTANCE

Required widths (each must be checked at the routes it applies to):

- [ ] 360
- [ ] 390
- [ ] 430
- [ ] 768
- [ ] 820
- [ ] 912
- [ ] 1024
- [ ] 1180
- [ ] 1280
- [ ] 1366
- [ ] 1440
- [ ] 1536
- [ ] 1920

Per route, verify on every applicable width:

- [ ] no horizontal overflow
- [ ] no clipped Anton headings
- [ ] no tiny metadata
- [ ] no broken navigation
- [ ] no missing functionality
- [ ] no unsupported intermediate state
- [ ] no excessive empty space
- [ ] no contrast failure

---

# MASTER WORKSTREAM K — FINAL QA

- [ ] Screenshot matrix generated
- [ ] Screenshots actually inspected (not just generated)
- [ ] Before/after evidence stored under `audits/final-ui-acceptance/`
- [ ] Keyboard QA completed
- [ ] Reduced motion QA completed
- [ ] Interaction journeys completed
- [ ] Tests completed (vitest, lint, typecheck, check:styles, build,
      cloudflare:build)
- [ ] Production build completed
- [ ] Cloudflare deploy completed
- [ ] Public production verified

---

# Batch log

## Batch 1 — Global Shell + Global Design System
**Status:** IN PROGRESS

_Recorded at end of batch — list completed items, exact commits,
screenshots, remaining items, next exact batch._
