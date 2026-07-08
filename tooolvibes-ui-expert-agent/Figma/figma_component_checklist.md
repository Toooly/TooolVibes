# Figma Component Checklist — Tooolvibes

> **Use when a primitive or hero page is moving from concept to "Figma-SoT ready to hand off to code".** Walk this list end-to-end. Anything unchecked must be fixed before the component is marked ready.

---

## How to use

- Run this for each token, primitive, and hero page you declare Figma-SoT.
- The agent does not build Figma frames — the human designer does. This checklist is the gate the agent uses to verify the result.

---

## 0. Setup rules

- [ ] All token names use the project's naming convention (semantic, not visual).
- [ ] Figma file uses Figma Variables (or styles bound to variables) — no free hex / px anywhere.
- [ ] Component layer names follow the convention: `Component / Variant / State` (e.g. `Button / Primary / Hover`).
- [ ] Variants are using Figma Variant property, not duplicated frames.
- [ ] No legacy / dead variants on the component page.

---

## 1. Tokens

### Color
- [ ] Background / surface / ink (primary, secondary, muted) declared.
- [ ] Accent roles (primary, hover, pressed) declared with one accent only.
- [ ] Status colors (success / warning / danger / info) declared.
- [ ] Focus ring color declared (separate from accent).
- [ ] Dark + light theme coverage (if dark-first is confirmed).

### Typography
- [ ] UI family declared with weights 400 / 500 / 600.
- [ ] Display family declared with weights 400 / 600 (or 400 only).
- [ ] Size scale: caption / body / lead / h3 / h2 / h1 / display documented.
- [ ] Line-height tokens: tight / normal / loose.
- [ ] Tracking tokens: tight / default / wide.

### Spacing
- [ ] 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 declared.
- [ ] Used everywhere — no ad-hoc values in components.

### Radius
- [ ] sm / md / lg / pill declared.

### Elevation
- [ ] rest / raised / modal declared.

### Motion
- [ ] fast / base / slow duration tokens declared.
- [ ] standard / emphasis easing tokens declared.

---

## 2. Primitives — per primitive checklist

For each of: Button, Badge, Card, Input, Tooltip, Modal, BottomSheet, Toast, Avatar, Tabs, Accordion.

### Anatomy
- [ ] Every part of the component is labeled with a callout.
- [ ] Layers are organized (Background → Foreground → Content).
- [ ] Auto-layout used; no manual positioning.

### Variants
- [ ] All visual variants present (e.g. Button: primary, secondary, ghost, destructive, icon-only).
- [ ] State variants present (rest, hover, focus, disabled, loading, where applicable).
- [ ] Size variants present if applicable (sm, md, lg).

### Tokens used (no free values)
- [ ] Colors reference token variables.
- [ ] Spacing references spacing tokens.
- [ ] Radius references radius tokens.
- [ ] Type references typography tokens.
- [ ] No absolute pixel values for type / spacing / radius.

### States coverage
- [ ] Rest, hover, focus, disabled present.
- [ ] Loading state present for button (if not, document why).
- [ ] Error state present for inputs (if not, document why).

### Accessibility
- [ ] Touch / click target ≥ 44 × 44 px (mobile) / ≥ 32 × 32 px (desktop).
- [ ] Color contrast declared meets AA.
- [ ] Icon-only buttons have a label spec (`aria-label`).

### Code counterpart
- [ ] Linked to the code file in `components/ui/`.
- [ ] Component name and prop names match between Figma and code.
- [ ] Variant names align (Button/Primary = `<Button variant="primary">`).

### Do / Do not
- [ ] One example frame showing correct usage.
- [ ] One example frame showing a misuse (e.g. wrong color, wrong spacing).

---

## 3. Hero pages — per page checklist

For each of: Home, Discovery, Tool Detail, Compare, Shortlist, Editorial article, Service.

### Structure
- [ ] Page broken into named sections (Hero, Filters, Grid, CTA, Footer, etc.).
- [ ] Each section uses primitives from §2.
- [ ] Section vertical rhythm obeys spacing scale.

### Viewports
- [ ] Mobile (375) frame present.
- [ ] Tablet (768) frame present where applicable.
- [ ] Desktop (1280) frame present.
- [ ] Wide (1920) sanity check present.

### States
- [ ] Empty state frame present.
- [ ] Loading skeleton frame present.
- [ ] Error state frame present.
- [ ] First-user / signed-out state frame present.

### Behavior annotations
- [ ] Hover / focus notes documented.
- [ ] Sticky behavior documented (filter rail, etc.).
- [ ] Responsive behavior annotated (collapse points, reflow rules).

### Trust & editorial
- [ ] Trust signals (last reviewed, reviewer) labeled on detail / hero frames.
- [ ] Author byline placed on editorial frames.
- [ ] Affiliate disclosure placement noted.

### Code counterpart
- [ ] Linked to the code route.
- [ ] Component import tree documented.

### Do / Do not
- [ ] One correct usage frame.
- [ ] One misuse / anti-pattern frame (e.g. too many badges, wrong rhythm).

---

## 4. Acceptance gate

A primitive or hero page passes the Figma-SoT gate only when:

- [ ] All §1 token checkboxes pass.
- [ ] All §2 checkboxes pass for that primitive.
- [ ] All §3 checkboxes pass for that page.
- [ ] A second human reviewer has signed off in a Figma comment.
- [ ] A handoff artifact exists (FIGMA_HANDOFF_FRAMEWORK.md §6 template).

If any of those fail, the component is **not ready to hand off** and the coding agent must push back.

---

## 5. Drift detection (after release)

At every release:

- [ ] Screenshot taken at the canonical viewport per surface.
- [ ] Screenshot dropped into `99 — Snapshots` page in Figma.
- [ ] Drift vs. Figma-SoT frame noted in a Figma comment.
- [ ] If drift > "minor" (more than one token-level deviation), raise a ticket to update Figma-SoT.
