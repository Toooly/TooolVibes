# 04 — Component System Audit

> **Use when:** you want to assess the existing component / design-system surface area before introducing tokens or redesigning primitives.

---

## Prompt (copy-paste)

> **Self-contained** — paste as a single user message; system + developer context already loaded.

```
You are the Tooolvibes UI Expert Agent in AUDIT mode (read-only), component-system dimension.

Pre-flight:
- Mode: AUDIT. Dimension: component system.
- Working directory: <repo root>.
- Stack inferred from package.json: <paste or "infer">.

Task:
Run a COMPONENT SYSTEM audit. Produce a token + primitive inventory, divergence map, migration plan, Figma-SoT seed list.

Scope:
1. Inventory primitives in use: Button, Badge, Card, Input, Modal, Sheet, Tooltip, Toast, Tabs, Avatar, Accordion, Switch. For each, list source file(s), usage count (grep), variants in the wild, last-touched date (git blame).
2. Inventory tokens: color (hex / CSS var names), typography (font / weight / size / line-height / tracking), spacing (px or var), radius, shadow, motion (duration / easing). Distinguish: declared vs. used vs. drifted.
3. Identify divergence:
   - Multiple Button variants with no canonical source.
   - Multiple Card structures for the same logical "Tool Card".
   - Inline-styled elements duplicating primitive responsibilities.
   - Tokens declared but unused, or used but not declared (free hex / px).
4. Score each primitive on:
   - Canonical: ONE source-of-truth (yes / partial / no).
   - Variant sprawl: visually-distinct variants not justified.
   - Token-bound: every value references a token (yes / partial / no).
   - State coverage: rest / hover / focus / disabled / loading / error / empty.
5. Compose-of-primitives check — ToolCard, EditorialCard, OfferCard: are they built from primitives, or hand-rolled?

Required output (UI_AUDIT_FRAMEWORK.md §D):
1. Header + reading plan (file list to scan, greps to run).
2. Token inventory table — token name | source file | declared | used | drifted (yes/no) | scope (light/dark).
3. Primitive inventory table — primitive | source file(s) | usage count | variants count | canonical | token-bound | state coverage score.
4. Composition audit — yes/no per composite.
5. Findings — every divergence as P1 (canonical source missing) or P2 (variant sprawl) or P3 (nice-to-have token). Include Evidence (file:line, grep result) + Severity + Effort + Classification + QA check.
6. Migration plan in 4 phases:
   - Phase 1 — Tokens (color, type, space, radius, shadow, motion).
   - Phase 2 — Primitives (Button, Badge, Card, Input, Modal/Sheet, Tooltip/Toast).
   - Phase 3 — Composites (ToolCard, EditorialCard, OfferCard).
   - Phase 4 — Hero pages (Home, Discovery, Tool Detail, Compare, Shortlist, Editorial, Service).
   - For each phase: list of changes, risk per change, "no-op visual" verification.
7. Figma-SoT seed — the primitives that MUST exist in Figma before hero pages can start, in dependency order.
8. Density flag — if ≥ 30% of findings point to one primitive, surface as a P1 architectural issue.
9. Assumptions + open questions.

Hard rules:
- Do not propose a wholesale rewrite of any component. Refactor only.
- Do not propose switching CSS strategy (e.g. CSS Modules → Tailwind).
- Migration at each step must be visually a no-op.
- No new dependency. No Supabase / RLS / auth / routing edits.

Begin.
```

---

## Pre-conditions

- The agent has scanned `components/`, `ui/`, `styles/`, `tailwind.config.*`, `theme.*`, `globals.*`.

## Expected length

~ 20–40 findings plus a token + primitive matrix.

## Success looks like

- A migration order exists that respects: tokens first → primitives second → composed third.
- Every primitive has a "canonical file" identified or a "must create" callout.
- Figma-SoT list reflects the migration order (build primitives in Figma after tokens).

## Suggested follow-ups

- `05_figma_extraction_plan.md` once the migration order is locked.
- `CHECKLISTS/figma_component_checklist.md` to spec each primitive.
