# 07 — Final UI Closure Pass

> **Use when:** P0 and P1 are clear, and you want a last-mile sweep to declare the UI "done" — covers QA, design system completeness, Figma snapshot hygiene, and accessibility gate.

---

## Prompt (copy-paste)

> **Self-contained** — paste as a single user message; system + developer context already loaded.

```
You are the Tooolvibes UI Expert Agent in CLOSURE mode (final pass). Read-only on the codebase; do not edit.

Pre-flight:
- Mode: CLOSURE. Binding: CHECKLISTS/final_ui_closure_checklist.md.
- Working directory: <repo root>.
- Milestone name: <e.g. v1.0 launch>.
- Open audit backlog path: <path to backlog file from prior audits>.

Required output:

# Tooolvibes UI Closure — <milestone>
> Mode: CLOSURE. Confidence: HIGH / MEDIUM / LOW.

## Coverage
- Routes cleared: <count of routes with no open P0/P1>
- Viewports cleared: 320 / 375 / 414 / 768 / 1024 / 1280 / 1440 / 1920 — list viewports actually verified
- P0 outstanding: <list or "none">
- P1 outstanding: <list or "none">

## Design system (verify by reading the codebase)
- Tokens: declared count / used count / duplicates / free hex count.
- Primitives: canonical-source yes/no per primitive.
- Composites: composed-of-primitives yes/no per composite.
- Drift: any free values found in components?

## Figma
- Figma-SoT complete: yes/no, list per primitive and per hero page.
- Reference snapshots refreshed: yes/no, list.
- Drift > minor between Figma-SoT and shipped output: list.
- Acceptance criteria (§10 FIGMA_HANDOFF_FRAMEWORK.md) all met: yes/no, list any gaps.

## Accessibility (WCAG 2.2 AA)
- Contrast pass: yes/no, list of failures.
- Focus rings: visible on every interactive element yes/no.
- Target sizes: ≥ 44×44 mobile, ≥ 32×32 desktop yes/no.
- ARIA landmarks + skip-to-content: yes/no.
- Tab order: logical across nav → filters → content → footer yes/no.

## Performance (skim, do not optimize here)
- Lighthouse / dev-tools FCP, LCP, CLS values if measurable, else "not measured in this pass".
- Largest layout shift suspects: list.

## Trust & conversion
- Last-reviewed dates visible on tool pages: yes/no.
- Reviewer bylines + avatars visible: yes/no.
- Affiliate disclosure present and PRE-affiliate-CTA: yes/no.
- Any fake counts / urgency / social proof surfaced: yes/no (P0 brand risk if yes).
- Optimistic save/unsave: yes/no.

## Editorial
- Author byline + role + avatar on articles: yes/no.
- Citations / footnotes designed + visible: yes/no.
- Hero image ratio consistent across articles: yes/no.

## Mobile (CHECKLISTS/mobile_qa_checklist.md walk)
- Items passed: <count> / 13.
- Items failed: list.

## Desktop (CHECKLISTS/desktop_qa_checklist.md walk)
- Items passed: <count> / 15.
- Items failed: list.

## Final score (UI_AUDIT_FRAMEWORK.md §F)
- Per-axis 0–3 score table.
- Total / 100.
- Open P0 + P1 count alongside the score.

## Remaining backlog
- P2 list.
- P3 list.

## Sign-off line
> Tooolvibes UI closure for <milestone>: **PASS** — only P2 / P3 remain open. / **NOT PASS** — outstanding P0: <count>, P1: <count>.

Hard rules (binding):
- Do not propose new work in this pass; only verify what exists.
- Anything that fails a gate is listed as P0/P1 even if not in the original backlog.
- The sign-off line must be honest — "PASS" requires every gate met.
- Do not invent scores; if a gate was not actually walked, list it as "not measured" rather than faking a pass.
- If a brand decision was assumed (accent / theme default / type pair), flag the assumption in the report.

Begin.
```

---

## Pre-conditions

- All P0 and P1 fixes from earlier audits are merged.
- The agent has access to rendered screenshots at all required viewports.

## Expected length

Single dense document; ~ 3–6 pages.

## Success looks like

- Every gate is verifiable on the rendered page.
- The sign-off line can be quoted in a release note.
- Remaining P2/P3 is a tidy backlog, not a discovery ground.

## Suggested follow-ups

- Schedule next milestone: `01_full_ui_audit.md` again on the next scope.
- Update `TOOOLVIBES_PRODUCT_CONTEXT.md` if any brand decisions changed during closure.
