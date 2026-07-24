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
| 1 | Global Shell + Global Design System | DONE |
| 2 | Home + Tool of the Week + Podium | NOT STARTED |
| 3 | Archive + Tool Detail | NOT STARTED |
| 4 | Radar + Compare + Saved | NOT STARTED |
| 5 | Secondary routes + full responsive matrix | NOT STARTED |
| 6 | Final QA + deployment | NOT STARTED |

---

# MASTER WORKSTREAM A — GLOBAL SHELL

- [x] Reconstruct desktop header hierarchy
- [x] Reconstruct mobile top shell
- [x] Reconstruct mobile bottom navigation
- [x] Define brand / nav / search / utilities / account hierarchy
- [x] Verify sticky behavior
- [x] Verify 390 / 430 / 768 / 1024 / 1280 / 1440 / 1920
- [x] Close the 1024 tablet nav gap (bottom nav now visible at
      <1280, desktop nav visible at >=1280)
- [ ] Remove the crowded pill/circle cluster (3-element utility
      cluster at desktop acceptable; cluster is now icon-led
      except for the account pill; deeper flattening deferred to
      Batch 5 alongside footer / secondary routes)
- [ ] Verify 360 viewport (deferred — batch1 spec covered 390+;
      Workstream J will own the full 13-width matrix)
- [ ] Verify active, hover, focus, pressed states (active dot
      confirmed; hover/focus/pressed declared in CSS but not
      individually screenshotted — Workstream K will own this)

**Acceptance**
- Header reads as one coherent premium TooolVibes command bar
  at xl (1280+): brand mark + flat 5-item nav pill + icon-led
  utility cluster (search + sound + music) + account avatar
  chip. Wordmark suppressed above xl. ✅
- Mobile navigation reads as intentionally designed instrument
  bar: 5 destinations with always-visible labels, instrument
  surface for the active link, pulsing brand dot on the active
  icon. ✅
- Tablet (768-1279) now gets the same instrument bar as mobile;
  no more "hamburger-only" gap. ✅
- No element competes for primary focus: brand owns the start,
  the current route owns the active state, search opens a modal
  sheet instead of fighting for inline space. ✅

---

# MASTER WORKSTREAM B — GLOBAL DESIGN SYSTEM

- [x] Audit dark surfaces (all routes use --tv-bg-base; dark
      surface ownership intact)
- [x] Audit ivory surfaces (shortlist empty state, tool card,
      compare-arena header all read correctly on ivory)
- [x] Repair explicit foreground ownership (no accidental ink
      inheritance between dark and ivory sections; checked at
      /toools/blink sidebar, /shortlist empty state, /radar
      period selector)
- [x] Repair metadata hierarchy (eyebrow uppercase tracked /
      label medium / micro-meta caption — consistent across
      routes)
- [x] Create reusable TooolVibes visual primitives (WAVE /
      SIGNAL / TRACE / ORBIT / NODE / PULSE / SCAN / LOCK in
      styles/brand-primitives.css, all token-driven)
- [x] Rebuild button hierarchy (PRIMARY / SECONDARY / TERTIARY /
      INSTRUMENT / SELECTED / DISABLED defined in
      styles/buttons.css)
- [ ] Apply button system to existing components (the new
      classes are defined but most existing CTAs still use raw
      Tailwind classes — work is intentionally deferred to
      Batch 2-5 because it requires per-route refactor)
- [ ] Repair pill and badge hierarchy (3 pill variants still
      coexist: filled-purple, filled-cyan, outlined-cyan;
      consolidated in Batch 2 alongside tool cards)
- [ ] Normalize control sizes (radar period/vista tabs use
      different pill sizes in the same component; deferred)
- [ ] Normalize type scale (display heading clamp() varies per
      route; consolidation deferred)
- [ ] Normalize spacing scale (route intro offset varies
      60-100px; consolidation deferred)
- [ ] Normalize route intro spacing (each route sets its own
      eyebrow top margin; consolidation deferred)

**Required button system**
- PRIMARY · SECONDARY · TERTIARY · INSTRUMENT · SELECTED · DISABLED ✅

**Required brand primitives** (derived from the existing logo)
- WAVE · SIGNAL · TRACE · ORBIT · NODE · PULSE · SCAN · LOCK ✅

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
**Status:** DONE (2026-07-24)

### Completed
- Desktop header as one coherent command bar:
  brand mark + flat 5-item nav pill + icon-led utility cluster
  (search / sound / music) + account avatar chip. Wordmark
  suppressed above xl.
- Mobile top bar minimal: brand mark left, search + menu right,
  no redundant centered title.
- Mobile bottom nav instrument-style: 5 destinations with
  always-visible labels, instrument surface for the active link,
  pulsing brand dot on the active icon (respects reduced motion).
- Tablet (768-1279) gap closed: bottom nav now visible at <1280,
  desktop nav visible at >=1280, clean handoff at the breakpoint.
- Sound toggles: quiet icon pair, no raised pill, no border.
- Brand primitives (WAVE/SIGNAL/TRACE/ORBIT/NODE/PULSE/SCAN/
  LOCK) authored in `styles/brand-primitives.css`, token-driven.
- Button hierarchy (PRIMARY/SECONDARY/TERTIARY/INSTRUMENT/
  SELECTED/DISABLED + --sm/--lg size modifiers) authored in
  `styles/buttons.css`.
- Home Radar empty state polished: brand-aligned copy + pulsing
  cyan dot in the status pill.
- Lint cleanup: `open-next.config.ts` named default export so
  `lint:ci` passes with `--max-warnings=0`.
- 2026-07-24 follow-up polish: this batch (3 atomic fixes +
  1 lint fix) was originally marked "READY FOR RELEASE" in
  `design-qa.md`; that verdict was withdrawn because the 3
  fixes cover ~5% of the items in the master A-K workstream.
  New persistent master file: `FINAL_UI_ACCEPTANCE.md`.
  New honest status: "FINAL UI RECONSTRUCTION IN PROGRESS".

### Commits (this batch)
- `d370478` docs(qa): withdraw 'READY FOR RELEASE' verdict,
            establish FINAL_UI_ACCEPTANCE.md
- `de75e03` feat(shell): brand primitives — WAVE / SIGNAL / TRACE
            / ORBIT / NODE / PULSE / SCAN / LOCK
- `e193e7b` feat(shell): explicit button hierarchy — PRIMARY /
            SECONDARY / TERTIARY / INSTRUMENT / SELECTED / DISABLED
- `1679b06` fix(shell): desktop command bar — flat nav, compact
            search, account avatar, wordmark suppressed above xl
- `dff5115` fix(shell): mobile bottom nav — instrument-style
            command bar with always-visible labels
- `f1f0d6f` fix(shell): minimal mobile top bar — remove redundant
            centered title, scope nav display to xl
- `06a7eb5` (pre-batch 1) header utility quieting + compact-phone
            bottom-nav labels + Home Radar empty-state polish
- `2311f59` (pre-batch 1) Home Radar empty-state copy + pulse
- `9759bf4` (pre-batch 1) lint fix: name the default export

### Follow-up commit (tablet gap)
- `PENDING` fix(shell): close 1024 tablet nav gap — bottom nav
            visible <1280, desktop nav >=1280, main pb-xfade
- (covers `components/layout/mobile-bottom-nav.tsx`,
  `styles/shell.css`, `app/(marketing)/layout.tsx`)

### Screenshots
- `audits/final-ui-acceptance/batch1/`: 42 PNG (6 routes x 7
  viewports 390/430/768/1024/1280/1440/1920) — every required
  batch-1 viewport inspected by eye, not just generated.
- `audits/final-ui-acceptance/batch1-verify/`: 24 PNG (6 routes
  x 4 viewports 1024/1024-tall/1279/1280) — confirms the 1024
  tablet fix: bottom nav visible at <1280, desktop nav at
  >=1280, zero horizontal overflow at any viewport.

### Validation
- `bun run check:styles` PASS — !important ceiling of
  styles/shell.css (138) intact, no new debt.
- `bun run lint:ci` PASS — 0 warnings, 0 errors.
- `bun run typecheck` PASS — 0 type errors.
- 6 routes x 7 viewports = 42 screenshots, all 200 OK, zero
  horizontal overflow, nav visibility probe confirmed
  (visible <1280 / hidden >=1280 for bottom nav, opposite for
  desktop nav).

### Remaining items (deferred to subsequent batches, NOT a
failure of Batch 1)
- Apply the new button system to existing components (most
  CTAs still use raw Tailwind classes; per-route refactor in
  Batches 2-5).
- Consolidate pill / badge variants down to 1-2.
- Normalize control sizes, type scale, spacing scale, route
  intro spacing across all routes (Workstream B continued).
- Verify hover / focus / pressed states individually with
  interaction screenshots (Workstream K).
- Verify the 360 viewport (Workstream J).
- Per-route visual debt called out in Workstreams C, D, E, F,
  G, H (Home, Archive, Tool Detail, Radar, Compare, Saved).

### Next batch
**Batch 2 — Home + Tool of the Week + Podium**
(Workstream C: hero / heading / CTA / decision journey / Home
Radar / Tool of the Week redesign / Podium / motion.)

Honest status of the project: **FINAL UI RECONSTRUCTION IN
PROGRESS**. The only valid overall status until every A-K
workstream is closed.
