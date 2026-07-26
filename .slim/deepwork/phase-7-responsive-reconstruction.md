# Phase 7 — Final Responsive & Experience Reconstruction

**Branch:** `design-system/phase-5-primitives`
**Date:** 2026-07-21
**Status:** PLANNING → BATCH 1 (Global Responsive Shell)
**Source policy:** User directive 2026-07-21

## Mission

Eliminate mobile/tablet/desktop/wide-desktop fragmentation. Build ONE PRODUCT
architecture with adaptive composition. No visual redesign — apply existing
Design System Constitution.

## Source-of-truth references

- `audits/tooolvibes-design-system-constitution.md` — visual language
- `styles/tokens.css` — semantic tokens (Phase 4 + 6)
- `components/ui/` — primitive layer (Phase 3 + 5 + 6)
- `audit-report-desktop-ui.md` — desktop audit
- `audit-interaction-motion-report.md` — interaction/motion audit
- `audits/ui-forensic-audit-2026-07-21.md` — full forensic
- `audits/visual-baseline-2026-07-21/` — screenshots baseline

## Phase 7 Plan (12 batches)

| # | Batch | Specialists | Gate | Status |
|---|-------|-------------|------|--------|
| 1 | Global responsive shell + navigation (7A) | @designer + @fixer | build + smoke @ 390/430/768/1024/1280/1440/1728/1920 | TODO |
| 2 | Container system (7B) | @designer | build + visual diff | TODO |
| 3 | Home reconstruction (7C) | @designer + @fixer | build + visual diff @ all viewports | TODO |
| 4 | Collections reconstruction (7D) | @designer + @fixer | build + visual diff | TODO |
| 5 | Archive reconstruction (7E) | @designer + @fixer | build + visual diff | TODO |
| 6 | Tool Detail reconstruction (7F) | @designer + @fixer | build + visual diff | TODO |
| 7 | Radar reconstruction (7G) | @designer + @fixer | build + visual diff | TODO |
| 8 | Compare reconstruction (7H) | @designer + @fixer | build + visual diff | TODO |
| 9 | Shortlist reconstruction (7I) | @designer + @fixer | build + visual diff | TODO |
| 10 | Tablet rescue (7J) | @designer | tablet-only smoke @ 768/820/1024 | TODO |
| 11 | Wide desktop pass (7K) | @designer | wide smoke @ 1440/1728/1920/2560 | TODO |
| 12 | Legacy CSS cleanup (7L) | @fixer | build + diff stat | TODO |

**Final deliverable:** `audits/ui-phase-7-responsive-experience-reconstruction-report-2026-07-21.md` (20 sections).

## Routing policy

- Layout decisions, breakpoints, container architecture → **@oracle** (Responsive Product Architect role)
- Visual hierarchy, composition, premium quality, mobile/tablet/desktop specifics → **@designer**
- Visual diff classification (before/after screenshots) → **@observer**
- Mechanical implementation that preserves designer intent → **@fixer**
- Code recon (find files, locate components, read patterns) → **@explorer**

## Oracle review budget

Per Phase 7 user policy, visual diffs are EXPECTED but must be INTENTIONAL.
Oracle reviews at end of:
- BATCH 3 (Home — flagship route)
- BATCH 6 (Tool Detail — high-traffic)
- BATCH 10 (Tablet Rescue)
- BATCH 11 (Wide Desktop)
- BATCH 12 (Final cleanup)

Reason: high-risk composition decisions where wrong layout cascades across all routes.

## GIT policy

- NO commit / push / merge during Phase 7 (per user)
- User reviews and commits manually

## STOP condition

End of BATCH 12 → STOP. Do NOT start Final Visual Polish, motion overhaul, gamification redesign.
