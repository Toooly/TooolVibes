# 05 — Figma Extraction Plan

> **Use when:** you want to know what *must* be redesigned in Figma, what is a reference snapshot, and what stays in code.

---

## Prompt (copy-paste)

> **Self-contained** — paste as a single user message; system + developer context already loaded.

```
You are the Tooolvibes UI Expert Agent in AUDIT/PLANNING mode, Figma extraction dimension.

Pre-flight:
- Mode: PLANNING (read-only on the codebase, produces a Figma extraction plan).
- Working directory: <repo root>.

Use the FIGMA_HANDOFF_FRAMEWORK.md decision tree strictly. Classify every UI element into Figma-SoT / Figma-Reference / Code-Only. For ambiguous items, default to Figma-Reference, never Figma-SoT.

Required output:

1. Token extraction list
   - Color tokens — name per §5-bis convention; semantic, no visual names.
   - Typography tokens — UI family (weights) + display family (weights) + size scale + line-heights + tracking.
   - Spacing scale.
   - Radius scale.
   - Shadow / elevation scale.
   - Motion tokens (duration + easing).
   For each token, list its target CSS variable name and Tailwind key per §5-bis table.

2. Primitive extraction list (Figma-SoT, build before hero pages)
   - Button, Badge, Card (Tool / Editorial / Offer), Input, Tooltip, Modal, BottomSheet, Toast, Avatar, Tabs, Accordion.
   - Each primitive → one Figma page spec following the §6-bis template (anatomy, variants, states, sizes, tokens, code counterpart, do/don't, token export).

3. Hero pages extraction list (Figma-SoT, dependency order)
   - 7 pages max: Tool Detail → Discovery → Home → Compare → Shortlist → Editorial article → Service.
   - Per page: components consumed, viewport coverage (mobile 375 / tablet 768 / desktop 1280 / wide 1920), key states (rest / empty / loading / error / first-time).

4. Reference-only list (Figma-Reference, light snapshots)
   - One-off landing blocks (Shop, About, Affiliate disclosure).
   - 404 / 500 / maintenance.
   - Empty states for niche sections.

5. Code-only list (no Figma)
   - Microcopy text.
   - Hover transition timings.
   - Loading skeleton variants specific to a route.
   - Animation choreography per surface.
   - Form validation messages.

6. Figma file structure proposal (folder / page hierarchy per §5).

7. Build order — tokens → primitives → composites → hero pages → reference snapshots. Estimated days per phase.

8. Three-way reconciliation cadence — when to run the Figma ↔ token-source ↔ code diff.

9. Acceptance criteria for "Figma-SoT is ready" per primitive / page (use §10 checklist).

10. Risks + open questions for the human.

Hard rules:
- Do not classify an entire app surface as Figma-SoT. Only tokens, primitives, hero pages.
- Figma-Reference is the right default for one-off surfaces.
- Cap hero pages at 7. Keep this lean.
- Token names must follow the §5-bis convention.
- Do not invent tokens — every name must map to a real existing or proposed CSS variable.

Begin.
```

---

## Pre-conditions

- Optionally, run `04_component_system_audit.md` first to feed real primitive inventory.

## Expected length

~ 5–8 pages, dense. Document is meant to be executed by a designer, not read.

## Success looks like

- A designer can pick this up tomorrow and start building in Figma without further input.
- Migration order ensures tokens first, primitives second, hero pages third.
- "Do not enter Figma" is explicit, not implicit.

## Suggested follow-ups

- `CHECKLISTS/figma_component_checklist.md` per primitive.
- Handoff artifact template (FIGMA_HANDOFF_FRAMEWORK.md §6) per primitive.
