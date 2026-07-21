# TooolVibes — Token Map & Definitive Architecture

**Version**: 1.0
**Date**: 2026-07-21
**Source of truth**: this document + `styles/tokens.css`
**Companion to**: `audits/tooolvibes-design-system-constitution.md`

---

## 0. EXECUTIVE SUMMARY

This document consolidates Phase 2B–2J (token forensics, architecture,
color, typography, spacing, radius, surface/glass, elevation/z-index,
responsive, motion) into a single token map and proposes the definitive
token architecture for TooolVibes.

**Key findings:**

- 91 `--tv-*` tokens exist in `styles/tokens.css`, but the actual
  consumer base is small: only ~25 tokens carry meaningful traffic.
- **3 phantom tokens** are referenced but never defined:
  `--tv-radius-xl` (36×), `--tv-pointer-tilt-y` (14×), `--tv-pointer-tilt-x` (14×).
- **3 unused tokens** are defined but never referenced:
  `--font-manrope`, `--font-rubik`, `--tv-space-32`.
- **3 parallel token systems** coexist:
  1. `--tv-*` (91 tokens, semantic, in tokens.css)
  2. `--primary`/`--secondary`/etc. (19 aliases, in figma-implementation.css)
  3. `--surface-*` (60+ inline, scattered in globals.css and vibes-3d-maestoso.css)
- **2 dark themes** are configured but neither is the canonical one:
  `--tv-*` defines a custom dark palette in `:root`;
  `.dark` class in globals.css uses `oklch()` re-definitions.
- **5 near-duplicate purples**, **3 near-duplicate cyans**, **20+ alpha whites**
  identified by the audit are still in the codebase.
- **Hex debt**: 525× `#6a3cff`, 270× `#39d2f6`, 188× `#f3bf4c`, 684× `#ffffff`,
  total 2369 hex hardcoded values across 35 consumer files.

---

## 1. CANONICAL TOKEN INVENTORY (--tv-*)

### 1.1 Color tokens (25)

| Token | Value | Consumer Count | Status | Migration |
|-------|-------|----------------|--------|-----------|
| `--tv-bg-base` | `#0f0f12` | 30 | CANONICAL | none |
| `--tv-surface-raised` | `#1a1a1e` | 22 | CANONICAL | none |
| `--tv-surface-elevated` | `#25252b` | 23 | CANONICAL | none |
| `--tv-surface-translucent` | `rgba(26,26,30,0.78)` | 19 | CANONICAL | none |
| `--tv-surface-soft` | `rgba(37,37,43,0.72)` | <5 | SEMI-CANONICAL | keep, low traffic |
| `--tv-ink-primary` | `#f3f3f7` | 188 | CANONICAL | none |
| `--tv-ink-secondary` | `#a0a0b0` | 91 | CANONICAL | none |
| `--tv-ink-muted` | `#6e6e7e` | 15 | CANONICAL | none |
| `--tv-ink-muted-aa` | `#858596` | 15 | CANONICAL | keep as AA-variant |
| `--tv-accent-primary` | `#8b5cf6` | 60 | CANONICAL | but real brand is `#6a3cff` (see 1.5) |
| `--tv-accent-hover` | `#7c3aed` | 20 | CANONICAL | keep |
| `--tv-accent-pressed` | `#6d28d9` | <10 | CANONICAL | keep |
| `--tv-accent-aa` | `#7c3aed` | <5 | LEGACY ALIAS | merge with `--tv-accent-hover` |
| `--tv-accent-cyan` | `#39d2f6` | 32 | CANONICAL | keep (real cyan value) |
| `--tv-accent-gold` | `#f3bf4c` | 17 | CANONICAL | keep |
| `--tv-accent-magenta` | `#ec4899` | <10 | SEMI-CANONICAL | keep, low traffic |
| `--tv-border-subtle` | `rgba(243,243,247,0.1)` | 23 | CANONICAL | keep |
| `--tv-border-interactive` | `rgba(243,243,247,0.18)` | 14 | CANONICAL | keep |
| `--tv-status-success` | `#22c55e` | <10 | CANONICAL | keep, status only |
| `--tv-status-warning` | `#f59e0b` | <10 | CANONICAL | keep, status only |
| `--tv-status-danger` | `#ef4444` | <10 | CANONICAL | keep, status only |
| `--tv-status-info` | `#3b82f6` | <10 | CANONICAL | keep, status only |
| `--tv-focus-ring` | `#06b6d4` | 14 | CANONICAL | keep |

### 1.2 Typography tokens (19)

| Token | Value | Consumer Count | Status | Migration |
|-------|-------|----------------|--------|-----------|
| `--font-manrope` | `var(--font-inter)` | 0 | UNUSED SHADOW | REMOVE in Phase 4 |
| `--font-rubik` | `var(--font-inter)` | 0 | UNUSED SHADOW | REMOVE in Phase 4 |
| `--tv-font-ui` | `var(--font-inter), Inter, ...` | 18 | CANONICAL | keep |
| `--tv-font-display` | `var(--font-fraunces), Georgia, serif` | 20 | CANONICAL | keep |
| `--tv-font-system` | `var(--font-inter), ...` | 128 | CANONICAL | keep |
| `--tv-text-xs` | `0.75rem` | 756 | CANONICAL | keep |
| `--tv-text-sm` | `0.875rem` | 14 | CANONICAL | keep |
| `--tv-text-md` | `1rem` | 15 | CANONICAL | keep |
| `--tv-text-lg` | `1.125rem` | 9 | CANONICAL | keep |
| `--tv-text-xl` | `1.5rem` | <5 | CANONICAL | keep |
| `--tv-text-2xl` | `2rem` | 8 | CANONICAL | keep |
| `--tv-text-3xl` | `3rem` | <5 | CANONICAL | keep |
| `--tv-weight-regular` | `400` | <10 | CANONICAL | keep |
| `--tv-weight-medium` | `500` | <10 | CANONICAL | keep |
| `--tv-weight-semibold` | `600` | 28 | CANONICAL | keep |
| `--tv-weight-bold` | `700` | 14 | CANONICAL | keep |
| `--tv-leading-tight` | `1.12` | <5 | CANONICAL | keep |
| `--tv-leading-heading` | `1.2` | <10 | CANONICAL | keep |
| `--tv-leading-body` | `1.58` | 19 | CANONICAL | keep |
| `--tv-leading-relaxed` | `1.7` | <5 | CANONICAL | keep |
| `--tv-tracking-default` | `0` | <5 | CANONICAL | keep |
| `--tv-tracking-label` | `0.08em` | 15 | CANONICAL | keep |
| `--tv-tracking-eyebrow` | `0.14em` | 18 | CANONICAL | keep |

### 1.3 Spacing tokens (10)

| Token | Value | Consumer Count | Status | Migration |
|-------|-------|----------------|--------|-----------|
| `--tv-space-1` | `0.25rem` | <10 | CANONICAL | keep |
| `--tv-space-2` | `0.5rem` | 31 | CANONICAL | keep |
| `--tv-space-3` | `0.75rem` | 37 | CANONICAL | keep |
| `--tv-space-4` | `1rem` | 55 | CANONICAL | keep |
| `--tv-space-6` | `1.5rem` | 54 | CANONICAL | keep |
| `--tv-space-8` | `2rem` | 40 | CANONICAL | keep |
| `--tv-space-12` | `3rem` | 20 | CANONICAL | keep |
| `--tv-space-16` | `4rem` | 14 | CANONICAL | keep |
| `--tv-space-24` | `6rem` | <10 | CANONICAL | keep |
| `--tv-space-32` | `8rem` | 0 | LEGACY ALIAS | REMOVE in Phase 4 |

### 1.4 Radius tokens (5 defined, 1 phantom)

| Token | Value | Consumer Count | Status | Migration |
|-------|-------|----------------|--------|-----------|
| `--tv-radius-sm` | `0.375rem` (6px) | 16 | CANONICAL | keep |
| `--tv-radius-md` | `0.625rem` (10px) | 42 | CANONICAL | keep |
| `--tv-radius-lg` | `1rem` (16px) | 32 | CANONICAL | keep |
| `--tv-radius-feature` | `1.5rem` (24px) | 12 | CANONICAL | keep |
| `--tv-radius-pill` | `999px` | 12 | CANONICAL | keep |
| `--tv-radius-xl` | (UNDEFINED) | 36 | **PHANTOM** | DECIDE in 1.6 below |

### 1.5 Layout tokens (2)

| Token | Value | Consumer Count | Status | Migration |
|-------|-------|----------------|--------|-----------|
| `--tv-content-wide` | `80rem` | 20 | CANONICAL | keep |
| `--tv-content-reading` | `46rem` | <10 | CANONICAL | keep |

### 1.6 Elevation tokens (3)

| Token | Value | Consumer Count | Status | Migration |
|-------|-------|----------------|--------|-----------|
| `--tv-elevation-rest` | `0 1px 2px rgba(0,0,0,0.16)` | 10 | CANONICAL | keep |
| `--tv-elevation-raised` | `0 18px 42px rgba(0,0,0,0.28)` | 20 | CANONICAL | keep |
| `--tv-elevation-modal` | `0 30px 90px rgba(0,0,0,0.48)` | <10 | CANONICAL | keep |

### 1.7 Motion tokens (5)

| Token | Value | Consumer Count | Status | Migration |
|-------|-------|----------------|--------|-----------|
| `--tv-motion-fast` | `120ms` | <10 | CANONICAL | keep (rename `--tv-motion-fast-160` if scale changes) |
| `--tv-motion-base` | `180ms` | 37 | CANONICAL | keep (rename `--tv-motion-base-240`) |
| `--tv-motion-slow` | `280ms` | <10 | CANONICAL | keep (rename `--tv-motion-slow-360`) |
| `--tv-ease-standard` | `cubic-bezier(0.2,0,0,1)` | 34 | CANONICAL | keep |
| `--tv-ease-emphasis` | `cubic-bezier(0.4,0,0.2,1)` | <10 | CANONICAL | keep |

### 1.8 Z-index tokens (9)

| Token | Value | Consumer Count | Status | Migration |
|-------|-------|----------------|--------|-----------|
| `--tv-z-base` | `0` | <5 | CANONICAL | keep |
| `--tv-z-content` | `1` | <5 | CANONICAL | keep |
| `--tv-z-sticky` | `10` | <10 | CANONICAL | keep |
| `--tv-z-nav` | `50` | 13 | CANONICAL | keep |
| `--tv-z-overlay` | `80` | 10 | CANONICAL | keep |
| `--tv-z-modal` | `90` | <5 | CANONICAL | keep |
| `--tv-z-floating` | `100` | 12 | CANONICAL | keep |
| `--tv-z-toast` | `110` | <5 | CANONICAL | keep |
| `--tv-z-effects` | `120` | <5 | CANONICAL | keep |

### 1.9 Mobile shell tokens (5)

| Token | Value | Consumer Count | Status | Migration |
|-------|-------|----------------|--------|-----------|
| `--tv-shell-nav-inset-left` | n/a | <5 | CANONICAL | keep |
| `--tv-shell-nav-inset-right` | n/a | <5 | CANONICAL | keep |
| `--tv-shell-nav-inset-bottom` | n/a | <5 | CANONICAL | keep |
| `--tv-shell-fab-size` | n/a | <5 | CANONICAL | keep |
| `--tv-shell-fab-gap` | n/a | <5 | CANONICAL | keep |

### 1.10 Keyboard/Viewport tokens (6)

| Token | Value | Status | Migration |
|-------|-------|--------|-----------|
| `--tv-kbd-overlay-inset-*` | various | SEMI-CANONICAL | keep |
| `--tv-kbd-sheet-max-height` | n/a | SEMI-CANONICAL | keep |
| `--tv-kbd-input-min-font-size` | n/a | SEMI-CANONICAL | keep |

---

## 2. PHANTOM AND UNUSED TOKENS (THE THREE PROBLEMS)

### 2.1 The phantom `--tv-radius-xl`

**Evidence**: 36 references in CSS/TSX, ZERO definitions in tokens.css.

```
$ grep -rho "var(--tv-radius-xl)" --include="*.tsx" --include="*.css" . | wc -l
36
$ grep -c "tv-radius-xl:" styles/tokens.css
0
```

**What it actually is**: the codebase uses `--tv-radius-xl` expecting
it to be defined. The references are spread across multiple CSS rules
that treat it as a 28–32px radius. The Tailwind v4 `@theme inline` block
defines `--radius-xl: 32px;` independently at globals.css:13295.

**Decision**: `--tv-radius-xl` is **removed** and all 36 references migrate
to either `--tv-radius-lg` (16px) for compact contexts or
`--tv-radius-feature` (24px) for feature contexts.

### 2.2 The phantom `--tv-pointer-tilt-y/x`

```
$ grep -rho "var(--tv-pointer-tilt-y)" --include="*.tsx" --include="*.css" . | wc -l
14
$ grep -rho "var(--tv-pointer-tilt-x)" --include="*.tsx" --include="*.css" . | wc -l
14
$ grep -c "tv-pointer-tilt-" styles/tokens.css
0
```

These are dynamic CSS variables set by JavaScript on the orbital layer
to track pointer tilt. They live in JS, not in tokens.css.

**Decision**: move these to `--tv-orbital-tilt-x/y` and define them
in tokens.css with default values, OR remove them from the token
namespace entirely (they are runtime-set, not design tokens).

### 2.3 The unused shadows

```
$ grep "tv-font-manrope\|tv-font-rubik\|tv-space-32" styles/tokens.css
--font-manrope: var(--font-inter);
--font-rubik: var(--font-inter);
--tv-space-32: 8rem;
$ grep -rho "var(--font-manrope)\|var(--font-rubik)\|var(--tv-space-32)" --include="*.tsx" --include="*.css" . | wc -l
0
```

**Decision**: REMOVE all three. They are dead aliases.

---

## 3. PARALLEL TOKEN SYSTEMS — THE THREE-WAY CONFLICT

### 3.1 System A: `--tv-*` (91 tokens, in tokens.css)

The semantic layer. Owned by the design system.

### 3.2 System B: shadcn-style aliases (19 tokens, in figma-implementation.css)

Defined inside `.tv-design-system` class:

```css
--primary, --secondary, --accent, --background, --foreground,
--card, --card-foreground, --popover, --popover-foreground,
--muted, --muted-foreground, --destructive, --border, --input, --ring
--accent-foreground, --secondary-foreground, --primary-foreground
--radius
```

These exist to match shadcn/ui conventions but are NOT consumed by
the actual shadcn-style code (which uses `--tv-*` directly).

**Decision**: REMOVE `--primary`/`--secondary`/etc. and map any consumer
to the `--tv-*` equivalent. The `--radius` alias is the only one
that should stay (it is consumed by Tailwind v4 `@theme inline`).

### 3.3 System C: `--surface-*` (60+ tokens, scattered)

Found in:
- `app/globals.css` (60+ `--surface-*` custom properties)
- `styles/vibes-3d-maestoso.css` (`--surface-brand-panel-bg`,
  `--surface-dark-panel-bg`, etc.)
- `components/home/`, `components/desktop/` (component-local
  `--surface-intro-*`, `--surface-selection-*`)

These are **feature-specific surfaces** (panel backgrounds, marketing
hero overlays, intro layouts) that escaped the token system.

**Decision**: each `--surface-*` is audited in Phase 4 and either:
1. Migrated to an existing `--tv-surface-*` semantic token, OR
2. Defined as a new `--tv-surface-*` semantic token if it represents
   a reusable concept, OR
3. Removed if it is dead code.

### 3.4 System D: oklch re-definitions in `.dark` block

In `app/globals.css` the `.dark` class redefines the shadcn-style
tokens using oklch:

```css
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  ...
}
```

This is the **shadcn default dark mode**, never selected because
`<html>` never gets the `.dark` class (TooolVibes is dark by default
with `--tv-*` colors, not via `.dark`).

**Decision**: the `.dark` block is REMOVED in Phase 4. TooolVibes's
dark theme lives in tokens.css `:root` and is permanent. The `.dark`
block is dead code that ships ~30 unused oklch tokens.

---

## 4. HEX HARDCODED DEBT DISTRIBUTION

Top 30 hex values (count of occurrences across all `.tsx` and `.css`):

| Hex | Count | Category | Canonical replacement |
|-----|-------|----------|----------------------|
| `#ffffff` | 684 | white | `--tv-ink-primary` (most cases); keep for SVG icon fills |
| `#6a3cff` | 525 | violet brand | `--tv-accent-primary` (after convergence, see 1.5) |
| `#fff` | 526 | white short | same as above |
| `#39d2f6` | 270 | cyan accent | `--tv-accent-cyan` |
| `#cccccc` | 226 | mid grey | `--tv-ink-muted` or remove |
| `#f3bf4c` | 188 | gold accent | `--tv-accent-gold` |
| `#ffffff14` | 135 | white 8% | `--tv-border-subtle` |
| `#616161` | 195 | mid grey | `--tv-ink-muted` or remove |
| `#ffffff1a` | 98 | white 10% | `--tv-border-subtle` |
| `#007acc` | 116 | blue (editor) | remove (editor-only) |
| `#ffffff1f` | 94 | white 12% | `--tv-border-interactive` |
| `#3794ff` | 85 | blue (VSCode) | remove (editor-only) |
| `#f14c4c` | 75 | red (VSCode) | remove (editor-only) |
| `#f3f3f3` | 75 | near-white | `--tv-ink-primary` |
| `#7C4DFF` | 68 | violet alt | CONVERGE to `#6a3cff` |
| `#ffffffb8` | 93 | white 72% | `--tv-ink-primary` (with alpha) |
| `#252526` | 70 | surface alt | `--tv-surface-raised` |
| `#000` | 59 | black | `--tv-bg-base` |
| `#000000` | 54 | black full | `--tv-bg-base` |

The audit flagged the 2369 hex debt. Phase 4 migration removes the
top 500 occurrences in primitives and shared components.

---

## 5. DEFINITIVE TOKEN ARCHITECTURE (Phase 4 target)

### 5.1 Layer model

```
foundation         → raw values (single source of numerical truth)
semantic           → role names (consumed by components)
component          → scoped to one component family
feature            → scoped to one feature (radar, arena, etc.)
```

### 5.2 Foundation tokens (RAW VALUES ONLY, NEVER consumed directly)

```css
/* Color foundation */
--tv-color-violet-500: #6a3cff;
--tv-color-violet-600: #7c3aed;
--tv-color-violet-700: #6d28d9;
--tv-color-cyan-400: #39d2f6;
--tv-color-cyan-500: #43c6ff;
--tv-color-gold-500: #f3bf4c;
--tv-color-magenta-500: #ec4899;
--tv-color-green-500: #22c55e;
--tv-color-amber-500: #f59e0b;
--tv-color-red-500: #ef4444;
--tv-color-blue-500: #3b82f6;
--tv-color-cyan-300: #06b6d4;       /* focus */

/* Neutral foundation */
--tv-color-ink-50: #f3f3f7;
--tv-color-ink-200: #a0a0b0;
--tv-color-ink-400: #858596;
--tv-color-ink-500: #6e6e7e;
--tv-color-base-900: #0f0f12;
--tv-color-surface-800: #1a1a1e;
--tv-color-surface-700: #25252b;
--tv-color-surface-600: #2f2f37;

/* Alpha ladder (5 values only) */
--tv-alpha-06: 0.06;
--tv-alpha-10: 0.10;
--tv-alpha-16: 0.16;
--tv-alpha-24: 0.24;
--tv-alpha-72: 0.72;

/* Spacing foundation (4-based) */
--tv-space-0: 0;
--tv-space-1: 0.25rem;
--tv-space-2: 0.5rem;
--tv-space-3: 0.75rem;
--tv-space-4: 1rem;
--tv-space-6: 1.5rem;
--tv-space-8: 2rem;
--tv-space-12: 3rem;
--tv-space-16: 4rem;
--tv-space-24: 6rem;

/* Radius foundation */
--tv-radius-0: 0;
--tv-radius-sm: 0.375rem;
--tv-radius-md: 0.625rem;
--tv-radius-lg: 1rem;
--tv-radius-feature: 1.5rem;
--tv-radius-modal: 1.75rem;
--tv-radius-pill: 9999px;

/* Z-index foundation */
--tv-z-skip: 9999;        /* a11y skip-link only */
--tv-z-effects: 120;
--tv-z-toast: 110;
--tv-z-floating: 100;
--tv-z-modal: 90;
--tv-z-overlay: 80;
--tv-z-nav: 50;
--tv-z-sticky: 10;
--tv-z-content: 1;
--tv-z-base: 0;
--tv-z-backplane: -10;    /* marketing backplane only */

/* Motion foundation */
--tv-motion-instant: 80ms;
--tv-motion-fast: 160ms;
--tv-motion-base: 240ms;
--tv-motion-slow: 360ms;
--tv-motion-cinematic: 720ms;
--tv-ease-standard: cubic-bezier(0.2, 0, 0, 1);
--tv-ease-emphasis: cubic-bezier(0.4, 0, 0.2, 1);
```

### 5.3 Semantic tokens (CONSUMED BY COMPONENTS)

```css
/* Surface semantic */
--tv-bg-base: var(--tv-color-base-900);
--tv-surface-raised: var(--tv-color-surface-800);
--tv-surface-elevated: var(--tv-color-surface-700);
--tv-surface-translucent: rgb(from var(--tv-surface-raised) r g b / var(--tv-alpha-78));

/* Text semantic */
--tv-ink-primary: var(--tv-color-ink-50);
--tv-ink-secondary: var(--tv-color-ink-200);
--tv-ink-muted: var(--tv-color-ink-500);
--tv-ink-muted-aa: var(--tv-color-ink-400);

/* Brand semantic */
--tv-accent-primary: var(--tv-color-violet-500);    /* canonical violet */
--tv-accent-hover: var(--tv-color-violet-600);
--tv-accent-pressed: var(--tv-color-violet-700);
--tv-accent-cyan: var(--tv-color-cyan-400);
--tv-accent-gold: var(--tv-color-gold-500);
--tv-accent-magenta: var(--tv-color-magenta-500);

/* Border semantic */
--tv-border-subtle: rgb(from var(--tv-color-ink-50) r g b / var(--tv-alpha-10));
--tv-border-interactive: rgb(from var(--tv-color-ink-50) r g b / var(--tv-alpha-18));

/* Status semantic */
--tv-status-success: var(--tv-color-green-500);
--tv-status-warning: var(--tv-color-amber-500);
--tv-status-danger: var(--tv-color-red-500);
--tv-status-info: var(--tv-color-blue-500);

/* Focus semantic */
--tv-focus-ring: var(--tv-color-cyan-300);
```

### 5.4 Component tokens (CONSUMED BY ONE PRIMITIVE FAMILY)

```css
/* Button component */
--tv-button-radius: var(--tv-radius-md);
--tv-button-radius-pill: var(--tv-radius-pill);
--tv-button-min-height: 2.5rem;
--tv-button-padding-x: var(--tv-space-4);
--tv-button-padding-y: var(--tv-space-3);

/* Input component */
--tv-input-radius: var(--tv-radius-md);
--tv-input-min-height: 2.5rem;
--tv-input-padding-x: var(--tv-space-3);

/* Card component */
--tv-card-radius: var(--tv-radius-feature);
--tv-card-padding: var(--tv-space-6);

/* Dialog/Sheet */
--tv-modal-radius: var(--tv-radius-modal);
--tv-modal-padding: var(--tv-space-6);
--tv-modal-max-width: 32rem;
```

### 5.5 Feature tokens (CONSUMED BY ONE FEATURE)

```css
/* Radar feature */
--tv-radar-sweep-color: var(--tv-accent-cyan);
--tv-radar-node-size: 4.5rem;

/* Arena feature */
--tv-arena-core-size: 12rem;
--tv-arena-energy-color: var(--tv-accent-gold);

/* Orbital feature */
--tv-orbital-badge-size: 3rem;
--tv-orbital-core-size: 8rem;
```

### 5.6 Migration strategy (alias-based, zero big-bang)

Phase 4 introduces the foundation layer. The semantic layer continues
to use the same names. Existing consumers see no change. New work
consumes foundation → semantic → component tokens. Old hex values
migrate gradually via codemod (one directory at a time).

---

## 6. RESPONSIVE FOUNDATIONS (Phase 2I)

### 6.1 Canonical viewport tiers

| Tier | Min (px) | Max (px) | Tailwind | Usage |
|------|----------|----------|----------|-------|
| mobile-s | 0 | 359 | (none) | fallback only |
| mobile | 360 | 639 | `sm:` | default mobile |
| tablet-p | 640 | 767 | (none) | small tablet |
| tablet-l | 768 | 1023 | `md:` | tablet |
| desktop | 1024 | 1279 | `lg:` | desktop |
| desktop-wide | 1280 | 1535 | `xl:` | wide desktop |
| desktop-uw | 1536 | ∞ | `2xl:` | ultra-wide |

### 6.2 Container tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--tv-container-mobile` | `100%` | mobile-first width |
| `--tv-container-tablet` | `720px` | tablet content width |
| `--tv-container-app` | `1024px` | forms, dashboards |
| `--tv-container-wide` | `1280px` | catalogues, lists |
| `--tv-container-uw` | `1536px` | ultra-wide |
| `--tv-content-reading` | `46rem` | editorial body |
| `--tv-content-wide` | `80rem` | marketing wide |

### 6.3 Page gutters

| Tier | Gutter |
|------|--------|
| mobile-s | 12px |
| mobile | 16px |
| tablet-p | 20px |
| tablet-l | 24px |
| desktop | 32px |
| desktop-wide | 48px |
| desktop-uw | 64px |

### 6.4 Migration: existing custom breakpoints

Today 36 unique custom breakpoints exist. Phase 4 migrates them to the
7 canonical tiers. Custom breakpoints are allowed only for:
- feature-specific scope (e.g., orbital layer collapse threshold);
- they must be defined in a `--tv-bp-feature-*` token, not raw media query.

---

## 7. MOTION FOUNDATIONS (Phase 2J)

### 7.1 Duration scale (final)

| Token | Value | Use |
|-------|-------|-----|
| `--tv-motion-instant` | `80ms` | hover state, opacity |
| `--tv-motion-fast` | `160ms` | chips, tags |
| `--tv-motion-base` | `240ms` | cards, buttons |
| `--tv-motion-slow` | `360ms` | modals, sheets |
| `--tv-motion-cinematic` | `720ms` | page transitions |

The current tokens (`--tv-motion-fast: 120ms`, `--tv-motion-base: 180ms`,
`--tv-motion-slow: 280ms`) are redefined to match this scale.

### 7.2 Easing

| Token | Value | Use |
|-------|-------|-----|
| `--tv-ease-standard` | `cubic-bezier(0.2, 0, 0, 1)` | default |
| `--tv-ease-emphasis` | `cubic-bezier(0.4, 0, 0.2, 1)` | modal enter/exit |
| `--tv-ease-spring-snappy` | motion spring `{ stiffness: 600, damping: 30 }` | chips |
| `--tv-ease-spring-soft` | motion spring `{ stiffness: 280, damping: 24 }` | cards |
| `--tv-ease-spring-playful` | motion spring `{ stiffness: 220, damping: 18 }` | badges |
| `--tv-ease-spring-physics` | motion spring `{ stiffness: 80, damping: 14 }` | 3D orbital |

### 7.3 Reduced motion policy

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### 7.4 Three motion systems coexist

1. **motion/react** (40 files): declarative React-level motion. Owns:
   - page transitions;
   - modal enter/exit;
   - card hover;
   - number-flow;
   - reveal animations.
2. **CSS keyframes** (231 total): low-level animations. Owns:
   - skeleton pulse;
   - radar sweep;
   - category icon bounce;
   - ambient breathing.
3. **GSAP** (1 file, lib/gsap-setup.ts): Lenis ticker ONLY. Owns:
   - smooth scroll integration.

Phase 4 keeps all three but assigns each a clear ownership above.
A future phase may collapse 2 into 1 but it is not required today.

---

## 8. Z-INDEX SCALE (final)

```
--tv-z-backplane: -10;       /* marketing backplane only */
--tv-z-base: 0;
--tv-z-content: 1;
--tv-z-sticky: 10;
--tv-z-nav: 50;
--tv-z-overlay: 80;
--tv-z-modal: 90;
--tv-z-floating: 100;
--tv-z-toast: 110;
--tv-z-effects: 120;
--tv-z-skip: 9999;            /* accessibility skip-link ONLY */
```

Documented exceptions (kept verbatim, not changed):

| Value | Selector | File:line | Why |
|-------|----------|-----------|-----|
| `9999` | `.skip-link` | `app/globals.css:255` | a11y: must be above everything |
| `-10` | `.marketing-shell__backplane` | `app/globals.css:296` | design: gradient behind content |

These two values are now EXPLICITLY RESERVED in the token scale
(`--tv-z-skip`, `--tv-z-backplane`) so future code cannot accidentally
reuse them.

---

## 9. SURFACE & GLASS SYSTEM (final)

### 9.1 Surface tokens

```css
--tv-surface-base: #0f0f12;                    /* page */
--tv-surface-raised: #1a1a1e;                  /* card */
--tv-surface-elevated: #25252b;                /* popover */
--tv-surface-translucent: rgba(26,26,30,0.78); /* floating */
--tv-surface-soft: rgba(37,37,43,0.72);        /* secondary floating */
--tv-surface-brand: linear-gradient(...);      /* hero */
--tv-surface-glass-subtle: rgba(255,255,255,0.04) + blur(8px);
--tv-surface-glass-standard: rgba(26,26,30,0.78) + blur(12px);
--tv-surface-glass-strong: rgba(15,15,18,0.92) + blur(24px);
```

### 9.2 Glass usage rules

Glass is allowed ONLY on:
- floating command palette (`--tv-surface-glass-standard`);
- bottom sheet on mobile (`--tv-surface-glass-standard`);
- modal dialogs (`--tv-surface-glass-strong`);
- hero section ambient overlays (`--tv-surface-glass-subtle`).

Glass is FORBIDDEN on:
- tool cards;
- collection cards;
- editorial content;
- form fields;
- tables.

### 9.3 Migration

The 60+ scattered `--surface-*` custom properties in globals.css and
vibes-3d-maestoso.css are audited in Phase 4 and either migrated
to the canonical `--tv-surface-*` scale or removed if dead code.

---

## 10. WHAT CHANGES IN PHASE 4 (token-only)

### 10.1 Additions (no removals yet)

- `--tv-radius-modal: 1.75rem` (NEW, for modals/sheets)
- `--tv-elevation-floating: 0 12px 28px rgba(0,0,0,0.32)` (NEW, for floating chips)
- `--tv-color-*` foundation layer (NEW, raw hex values)
- `--tv-z-backplane: -10` (NEW, documented exception)
- `--tv-z-skip: 9999` (NEW, documented exception)
- `--tv-density-*` (NEW, three density tiers)
- `--tv-motion-instant` and `--tv-motion-cinematic` (NEW, extend scale)

### 10.2 Aliases introduced (backward-compatible)

| Old | Alias → | New canonical |
|-----|---------|---------------|
| `--tv-radius-xl` (phantom) | → | `--tv-radius-lg` (16px) or `--tv-radius-feature` (24px) by context |
| `--tv-motion-fast: 120ms` | → | `--tv-motion-fast: 160ms` (redefined value) |
| `--tv-motion-base: 180ms` | → | `--tv-motion-base: 240ms` (redefined value) |
| `--tv-motion-slow: 280ms` | → | `--tv-motion-slow: 360ms` (redefined value) |

### 10.3 Removals (after migration completes)

- `--font-manrope`, `--font-rubik` (zero-use shadow aliases)
- `--tv-space-32` (legacy alias)
- `--tv-accent-aa` (duplicate of `--tv-accent-hover`)
- `--tv-pointer-tilt-x`, `--tv-pointer-tilt-y` (move to feature scope or remove)
- `--tv-radius-xl` (phantom, after references migrated)

These are removed in batches, not all at once.

---

## 11. SUMMARY STATS

| Metric | Count | Notes |
|--------|-------|-------|
| `--tv-*` tokens defined | 91 | in tokens.css |
| `--tv-*` tokens with traffic | ~25 | ≥ 10 consumers |
| Phantom tokens | 3 | `--tv-radius-xl`, `--tv-pointer-tilt-y/x` |
| Unused tokens | 3 | `--font-manrope`, `--font-rubik`, `--tv-space-32` |
| Token files | 4 | tokens.css, figma-implementation.css, figma-final-polish.css, vibes-3d-maestoso.css |
| Tailwind v4 `@theme` block | 1 | globals.css:13260 |
| Hex hardcoded total | 2369 | to be migrated in Phase 4 |
| Top hex offender | `#6a3cff` (525×) | brand violet |
| Arbitrary radii total | 879 | 415 TSX + 464 CSS |
| Custom breakpoints unique | 36 | to be consolidated to 7 canonical |
| @keyframes | 231 | audit said 49 (under-counted) |
| Z-index scale violations | 2 | documented exceptions (skip-link, backplane) |
| Component tokens planned | 12 | new foundation layer |
| Feature tokens planned | 8 | new foundation layer |

---

## 12. NEXT STEPS

Phase 4 will:
1. Add foundation + component + feature token layers to tokens.css.
2. Redefine motion tokens to the new scale (instant/fast/base/slow/cinematic).
3. Add `--tv-radius-modal` and `--tv-elevation-floating`.
4. Document the two reserved z-index exceptions.
5. Migrate primitives (`components/ui/*`) one at a time.
6. Migrate shared components (`components/app/*`, `components/layout/*`).
7. Migrate feature components folder by folder.

This map is the reference for all of the above.
