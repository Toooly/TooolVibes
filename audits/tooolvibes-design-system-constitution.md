# TooolVibes — Design System Constitution

**Version**: 1.0
**Date**: 2026-07-21
**Status**: Ratified
**Audience**: every contributor, designer, agent, future maintainer of TooolVibes
**Source of truth**: this document, until Phase 4 supersedes a section.

---

## 0. PREAMBLE

This is the visual constitution of TooolVibes. It is not a style guide.
It is not a token list. It is the set of binding decisions that the design system
must enforce so that the product stays recognisable while we finally remove
its historical inconsistency.

These decisions derive from the actual product (visual baseline 81 PNG,
forensic audit, six months of working code). They are not borrowed from
generic shadcn templates.

If a future change appears to contradict this constitution, the change
must amend the constitution first, then be implemented.

---

## 1. BRAND IDENTITY

TooolVibes is an **editorial AI directory with a dark, premium, slightly
orbital visual personality**.

It is **not**:
- a generic SaaS dashboard;
- a generic shadcn-generated admin;
- a glassmorphism-overload landing page;
- a Material Design product;
- a flat brutalist minimal directory.

It **is**:
- a curated Italian catalogue of AI tools, framed editorially;
- dark-first, optimised for low-light reading and decision-making;
- premium in tone: typography-led, restrained motion, layered surfaces;
- slightly orbital: a soft sense of depth, badges, glowing accents;
- technology-aware but not cold: editorial photography and copy coexist
  with technical signals (radar, scorecards, gamification).

The personality is **"a magazine that happens to know about AI"**.

---

## 2. VISUAL PRINCIPLES (binding)

### 2.1 Editorial leads, technology supports

Typography and copy carry the meaning. Technology (3D, motion, gamification)
is decoration that must never compete with reading. When in conflict, copy wins.

### 2.2 Dark is the default, not a theme

The product is dark-first. There is no light theme today. If a light
theme is added later, it must be visually equivalent in hierarchy and
density, not a low-contrast afterthought.

### 2.3 Violet is the brand, cyan is the accent, gold is the reward

Three accent colors maximum in any single viewport:
- **Violet (`#6a3cff`)** = brand identity, primary actions, current selection;
- **Cyan (`#39d2f6`)** = discovery, intelligence, radar, comparison;
- **Gold (`#f3bf4c`)** = reward, level up, badge unlock, premium signal.

Magenta, red, lime, mint are reserved for status states (success, danger, info).

### 2.4 Density without clutter

TooolVibes surfaces are dense with information (catalogues, scorecards,
editorial). Density must come from **typographic hierarchy and grid discipline**,
not from padding removal. Empty space is a design tool, never waste.

### 2.5 Motion must be informative

Motion reveals relationships (enter/exit, parent/child, expand/collapse),
never decorates. Decorative motion is allowed only in:
- gamification rewards (badges, levels, wins);
- 3D ambient scenes (orbital layer, hero 3D).

Every other motion must be purposeful and brief.

### 2.6 Premium feels like restraint

Premium does NOT mean gold gradients, glow on everything, large drop shadows.
Premium here means: typography is large and confident, motion is short,
surfaces are layered not flat, accents are used sparingly.

---

## 3. DARK-FIRST STRATEGY

### 3.1 Background depth ladder

Three baseline layers, plus translucent surfaces for floating UI:
- **Base** (`#0f0f12`): page background, deepest layer;
- **Raised** (`#1a1a1e`): cards, panels;
- **Elevated** (`#25252b`): popovers, sheets, dialogs.

Translucent overlays (`rgba(26, 26, 30, 0.78)`) exist for floating
glass but must not replace the solid ladder.

### 3.2 Ink contrast

Primary text is near-white (`#f3f3f7`), not pure white.
Pure white (`#ffffff`) is reserved for active state and contrast accents.
Secondary text (`#a0a0b0`) and muted text (`#6e6e7e`) define hierarchy
without relying on opacity tricks.

### 3.3 Borders are subtle, not invisible

Borders at `rgba(243, 243, 247, 0.10)` (subtle) and `0.18` (interactive).
Borders separate surfaces; they never draw attention.

---

## 4. COLOR PHILOSOPHY

### 4.1 Single source of truth for color

All colors flow through `--tv-*` semantic tokens defined in `styles/tokens.css`.
No hardcoded hex in components (`#6a3cff` is allowed exactly 0 times in
TSX once Phase 4 lands; today it appears 525 times — to be migrated).

### 4.2 The five-purple problem

The codebase historically contains 5 near-identical purples:
`#6a3cff`, `#7C4DFF`, `#7c4dff`, `#8b5cf6`, `#4f46e5`.

**Decision**: `#6a3cff` is the canonical brand violet.
The other four are aliases to be remapped during Phase 4 migration.
`#8b5cf6` (Tailwind violet-500) is the one already used as
`--tv-accent-primary` — both values coexist and must converge.

### 4.3 Status colors are reserved

`--tv-status-success` (`#22c55e`), `--tv-status-warning` (`#f59e0b`),
`--tv-status-danger` (`#ef4444`), `--tv-status-info` (`#3b82f6`) must be
used ONLY for their semantic role. No decorative usage.

The audit identified `#ef4444` (danger red) used in a compare toggle
where it is semantically wrong — it must migrate to violet.

### 4.4 No light theme now, but tokens are theme-ready

If a light theme is added, tokens must be redefined (not duplicated).
The token names do not change; only the values do.

---

## 5. TYPOGRAPHY PHILOSOPHY

### 5.1 Two families, three roles

- **Fraunces** = display, editorial headings, hero copy;
- **Inter** = UI, body, labels, buttons, all functional text.

Aliases `--font-manrope` and `--font-rubik` exist as historical shadows
that resolve to Inter. They are removed in Phase 4 once consumers migrate.

### 5.2 Scale is numeric, not semantic

Current scale (`--tv-text-xs` through `--tv-text-3xl`) is numeric.
Phase 4 will introduce semantic aliases:

```
--tv-text-display-hero   (clamp, 56-96px)
--tv-text-display        (clamp, 40-64px)
--tv-text-h1             (32-44px)
--tv-text-h2             (24-32px)
--tv-text-h3             (20-24px)
--tv-text-title          (18-20px)
--tv-text-body-lg        (17px)
--tv-text-body           (15px)
--tv-text-body-sm        (13px)
--tv-text-label          (12px, tracked +0.08em)
--tv-text-eyebrow        (11px, tracked +0.14em, uppercase)
--tv-text-caption        (11px)
```

### 5.3 Weights: four only

400 (regular), 500 (medium), 600 (semibold), 700 (bold).
No thin, no black, no extra-bold. Display headings may use 600 or 700 max.

### 5.4 Line heights: per role

- **Tight** (`1.12`): display headings, hero copy;
- **Heading** (`1.20`): section titles;
- **Body** (`1.58`): running text;
- **Relaxed** (`1.70`): long-form editorial, tool descriptions.

### 5.5 Tracking

- Default: 0;
- Label: `0.08em` (buttons, labels, eyebrows);
- Eyebrow: `0.14em` (all-caps tracking).

---

## 6. SPACING PHILOSOPHY

### 6.1 Base 4, scale 4/8/12/16/24/32/48/64

The current scale (`--tv-space-1` through `--tv-space-24`) is preserved.
`--tv-space-32` (legacy alias for 8rem) is removed in Phase 4.

### 6.2 Three spacing categories

- **Micro spacing**: 4, 8 (between icon and label, inside chips);
- **Control spacing**: 12, 16 (inside buttons, input padding);
- **Component spacing**: 24, 32 (between cards, around sections);
- **Section spacing**: 48, 64 (between page sections);
- **Page spacing**: 96+ (rare, hero whitespace).

### 6.3 Tailwind-first, token-second

Spacing in JSX should use Tailwind utilities (`p-4`, `gap-6`, `mt-8`),
not raw `var(--tv-space-4)`. Tailwind v4 maps to the same scale.
Tokens are reserved for CSS files and dynamic contexts.

---

## 7. RADIUS PHILOSOPHY

### 7.1 Six radius levels

```
--tv-radius-sm       0.375rem  (6px)   chip, tag, inline label
--tv-radius-md       0.625rem  (10px)  input, button, small card
--tv-radius-lg       1rem      (16px)  standard card
--tv-radius-feature  1.5rem    (24px)  feature card, hero panel
--tv-radius-modal    1.75rem   (28px)  modal, sheet, drawer
--tv-radius-pill     9999px    (chip, pill, avatar)
```

### 7.2 The phantom `--tv-radius-xl` is resolved

`--tv-radius-xl` is referenced 36 times but defined 0 times.
**Decision**: it is removed. All references migrate to
`--tv-radius-lg` (16px) or `--tv-radius-feature` (24px) depending on context.

### 7.3 Radius matches elevation

Higher elevation → larger radius. A modal (highest elevation) gets
the largest radius (28px). A chip (lowest elevation) gets 6px.

### 7.4 No arbitrary `rounded-[Npx]`

Components must use semantic radius tokens. Arbitrary values (`rounded-[22px]`,
`rounded-[34px]`, etc., 415 occurrences) are migrated in Phase 4.

---

## 8. SURFACE SYSTEM

### 8.1 Five surface levels

| Level | Token | Background | Border | Use |
|-------|-------|-----------|--------|-----|
| Base | `--tv-bg-base` | `#0f0f12` | none | page background |
| Raised | `--tv-surface-raised` | `#1a1a1e` | subtle | cards, panels |
| Elevated | `--tv-surface-elevated` | `#25252b` | subtle | popovers, dropdowns |
| Floating | `--tv-surface-translucent` | `rgba(26,26,30,0.78)` | subtle | floating panels with backdrop blur |
| Brand | `--tv-accent-primary` (gradient overlay) | violet→cyan radial | none | hero, cta background |

### 8.2 Glass is restrained

Glass (`backdrop-filter: blur()`) is used only on:
- floating command palette;
- bottom sheet on mobile;
- modal dialogs;
- hero section background overlays.

Glass is **never** applied to entire pages, lists, or tool cards.
Glass is a state, not a style.

---

## 9. GLASS USAGE RULES

### 9.1 Three glass tiers

- **Glass subtle**: `blur(8px)`, `rgba(255,255,255,0.04)` overlay;
  used for ambient overlays behind hero text.
- **Glass standard**: `blur(12px)`, `rgba(26,26,30,0.78)`;
  used for sheets, command palette.
- **Glass strong**: `blur(24px)`, `rgba(15,15,18,0.92)`;
  used for full-screen modal on mobile.

### 9.2 Glass must respect performance

On low-end devices (`prefers-reduced-motion` OR `getPerformanceProfile() === "low"`),
glass tier degrades by one level (subtle → solid).

### 9.3 Glass never carries semantic content

Anything inside glass must also be readable on a solid background of
the same color. Glass is an enhancement, never a requirement.

---

## 10. ELEVATION SYSTEM

### 10.1 Four elevation tokens

```
--tv-elevation-rest     0 1px 2px rgba(0,0,0,0.16)
--tv-elevation-raised   0 18px 42px rgba(0,0,0,0.28)
--tv-elevation-modal    0 30px 90px rgba(0,0,0,0.48)
--tv-elevation-floating 0 12px 28px rgba(0,0,0,0.32)   (NEW, for floating chips)
```

### 10.2 Elevation matches surface level

- Resting surfaces (cards at rest) → `--tv-elevation-rest`;
- Raised surfaces (hovered cards) → `--tv-elevation-raised`;
- Modal/dialog → `--tv-elevation-modal`;
- Floating chips, badges with motion → `--tv-elevation-floating`.

### 10.3 No shadow stacking

A component uses ONE shadow token at a time. Stacking shadows is forbidden.
The four tokens are sufficient for every case.

---

## 11. MOTION PHILOSOPHY

### 11.1 Three motion categories

- **Functional**: page transitions, modal enter/exit, expand/collapse;
  fast, short, never blocks interaction.
- **Informative**: scroll-reveal, stagger, value changes (number-flow);
  medium duration, signals meaning.
- **Cinematic**: 3D scenes, orbital layer, intro, hero;
  longer, decorative, gated by user preference and performance.

### 11.2 Single duration scale

```
--tv-motion-instant    80ms    (color/opacity changes, hover state)
--tv-motion-fast       160ms   (chips, tags, small interactive)
--tv-motion-base       240ms   (cards, buttons, standard interactive)
--tv-motion-slow       360ms   (modals, sheets, drawers)
--tv-motion-cinematic  720ms   (page transitions, scroll reveals)
```

### 11.3 Two easing curves

```
--tv-ease-standard  cubic-bezier(0.2, 0, 0, 1)    (default)
--tv-ease-emphasis  cubic-bezier(0.4, 0, 0.2, 1)  (enter, exit, modal)
```

### 11.4 Spring categories

| Category | Use | Motion config |
|----------|-----|---------------|
| Snappy | chips, toggles | `{ stiffness: 600, damping: 30 }` |
| Soft | cards, panels | `{ stiffness: 280, damping: 24 }` |
| Playful | badges, rewards | `{ stiffness: 220, damping: 18 }` |
| Physics | 3D, orbital | `{ stiffness: 80, damping: 14 }` |

### 11.5 Reduced motion is mandatory

Every animation respects `prefers-reduced-motion`:
- Functional: stays at 80ms (instant);
- Informative: skipped or static state;
- Cinematic: replaced by static image or skipped.

### 11.6 GSAP is reserved

GSAP is currently used only for the Lenis ticker (one line).
It is preserved for future scroll-triggered scenarios but does not
govern the standard motion system. New work must use motion/react or CSS.

---

## 12. RESPONSIVE PHILOSOPHY

### 12.1 Six viewport tiers

```
mobile-s     < 360px
mobile       360-639px     (default Tailwind sm breakpoint)
tablet-p     640-767px     (between mobile and tablet)
tablet-l     768-1023px    (Tailwind md-lg gap)
desktop      1024-1279px
desktop-wide 1280-1535px
desktop-uw   ≥ 1536px
```

### 12.2 Container widths

| Context | Token | Value |
|---------|-------|-------|
| Reading width (editorial) | `--tv-content-reading` | `46rem` |
| App width (forms, dashboards) | `--tv-content-app` (NEW) | `64rem` |
| Wide content (catalogues, lists) | `--tv-content-wide` | `80rem` |
| Full-bleed (hero, 3D scenes) | viewport edge | `100vw` |

### 12.3 Page gutters

- Mobile: `16px` (`--tv-space-4`);
- Tablet: `24px` (`--tv-space-6`);
- Desktop: `32px` (`--tv-space-8`);
- Wide: `48px` (`--tv-space-12`).

### 12.4 The tablet gap

Today `md:` (768-1023) is severely underused (99 occurrences vs 599 for `sm:`).
Phase 4 introduces an explicit tablet tier with layout patterns (e.g.,
side-by-side hero, two-column archive).

### 12.5 Mobile-first is mandatory

Tailwind mobile-first discipline. Every component starts at the mobile
viewport and adds `md:`, `lg:`, `xl:` prefixes for larger viewports.

---

## 13. DENSITY PHILOSOPHY

### 13.1 One density per surface

A surface has ONE density (compact / standard / comfortable).
Mixed-density inside the same component is forbidden.

### 13.2 Density by context

- **Compact**: tool list rows, comparison matrix, admin tables;
- **Standard**: tool cards, archive grid, editorial cards;
- **Comfortable**: editorial article body, hero sections, modals.

### 13.3 Density tokens

```
--tv-density-compact:        --tv-space-2 + --tv-space-3 (8+12)
--tv-density-standard:       --tv-space-3 + --tv-space-4 (12+16)
--tv-density-comfortable:    --tv-space-4 + --tv-space-6 (16+24)
```

---

## 14. MOBILE VS DESKTOP RELATIONSHIP

### 14.1 Desktop is NOT a stretched mobile

Today `VibeHomeV2` renders mobile components at desktop width.
This is wrong. Desktop is its own first-class design with:
- multi-column layouts;
- sidebar filters visible at all times;
- keyboard-navigable interactions;
- hover affordances (used cautiously, never exclusively);
- tool-rich density.

### 14.2 Two design languages, one foundation

Mobile and desktop are different UX patterns (scroll vs grid, sheet vs sidebar).
But they share foundations: tokens, primitives, motion principles, color.
A button is a button; its placement and density change.

### 14.3 The fork directory `components/desktop/` is decommissioned

Phase 4 eliminates `components/desktop/` by making mobile components
responsive-friendly. Desktop variants become `@media (min-width: 1024px)`
overrides inside the same component file.

---

## 15. COMPONENT COMPOSITION RULES

### 15.1 Components compose, never inherit

A card is a card. A button is a button. Tools are not buttons.
Do not create `ToolCardButton` monsters.

### 15.2 Slots over variants

When a component has more than 3 boolean toggles, it should accept
slot children instead of variants.

### 15.3 Primitives are dumb

UI primitives (`components/ui/*`) contain no business logic, no
domain types, no fetching. They accept typed props and render.

### 15.4 Feature components own domain knowledge

Feature components (`components/tools/*`, `components/directory/*`) own
their data shape, fetching, mutations. They consume primitives.

---

## 16. ACCESSIBILITY PRINCIPLES

### 16.1 Keyboard first

Every interactive element is reachable by Tab, operable by Enter/Space,
escapable by Escape. Focus rings are always visible (use `--tv-focus-ring`).

### 16.2 Skip-link is sacred

`.skip-link` at z-index 9999 is intentional (a11y requirement).
It must remain functional. Never reuse 9999 for other purposes.

### 16.3 Color is never the only signal

Status, error, success must use icon + color + label, not color alone.

### 16.4 Touch targets ≥ 44px

All interactive elements are at least 44×44px (mobile) or 32×32px (desktop).
Below this, the element is decorative or uses a wrapper.

### 16.5 Contrast ≥ WCAG AA

All text/background combinations must meet AA (4.5:1 normal, 3:1 large).
Verify every new color pairing.

---

## 17. GAMIFICATION VISUAL RULES

### 17.1 Reward is gold, danger is red, selection is violet

Gamification rewards use gold (`--tv-accent-gold`).
Combat/danger uses red (`--tv-status-danger`).
Selection and current state use violet (`--tv-accent-primary`).

### 17.2 Level-ups celebrate, do not block

Level-up and badge unlock modals are cinematic (longer duration)
but dismissible in one tap. They never auto-block the app.

### 17.3 Scorecards are honest

Editorial scorecards show numbers in `number-flow` with explicit labels.
No fake percent bars, no inflated scores. Trust is the product.

---

## 18. 3D / ORBITAL VISUAL RULES

### 18.1 Three.js is decorative, never required

Every 3D scene has a 2D fallback (poster image, gradient). Users on
low-end devices or `prefers-reduced-motion` get the 2D fallback.

### 18.2 The orbital layer is ambient

Orbital badges drift in the background, never block content, never
trap focus. `pointer-events: none` is mandatory.

### 18.3 Three.js scenes respect performance

`frameloop="demand"` for non-hero scenes.
Hero 3D may use `frameloop="always"` but must check
`getPerformanceProfile()` first.

---

## 19. WHAT MAKES TOOOLVIBES RECOGNIZABLE

Five signals that, if removed, would make TooolVibes generic:

1. **Dark violet atmosphere**: the dark base + violet glow + cyan accents
   make the product instantly identifiable as TooolVibes.
2. **Editorial typography**: Fraunces headings set the editorial tone;
   removing them turns the product into a generic SaaS.
3. **Orbital layer**: the soft drift of badges in the background is unique.
   No competitor has it.
4. **Italian editorial copy**: voice matters. "Curatela indipendente" is
   not interchangeable with "Independent curation".
5. **Premium density**: the catalogue feels curated, not listed.
   Density signals trust.

These five are protected. Any redesign must preserve them.

---

## 20. WHAT MUST NEVER HAPPEN AGAIN

The audit identified several patterns that must never reappear:

1. **Five near-identical purples**: violet has ONE canonical value (`#6a3cff`).
2. **20+ alpha whites**: white alpha has FIVE canonical values
   (`0.06`, `0.10`, `0.16`, `0.24`, `0.72`). No other.
3. **Z-index 9999 for non-skip-link elements**: 9999 is reserved for
   the accessibility skip-link. The next stack level is `--tv-z-modal` (90).
4. **Untyped component duplication**: every primitive variant must live
   inside a CVA definition. No "if-else density" patterns.
5. **V1/V2 cohabitation**: every component has ONE canonical file.
   No `site-header.tsx` + `site-header-v2.tsx` pairs.
6. **Hardcoded color in JSX**: every color flows through a `--tv-*` token.
7. **Arbitrary radius in JSX**: every `rounded-[Npx]` is a violation.
   Phase 0 guardrail catches this.
8. **Phantom tokens**: every referenced token must be defined.
   `--tv-radius-xl` (referenced 36×, defined 0×) is the canonical example.
9. **CSS dead code in shipped bundles**: every shipped CSS class has
   at least one JSX consumer. Otherwise it is removed.
10. **Global CSS monolith**: `globals.css` at 34k LOC is the
    pathology. It must be split, slowly, by domain.

---

## SIGNATURE

This constitution is binding for Phase 4 and beyond.
Amendments require explicit versioning and the same forensic verification
methodology used to ratify it.

**Ratified**: 2026-07-21
**Authority**: forensic audit + Phase 0/1 verification
**Reviewer**: the user (pending)
