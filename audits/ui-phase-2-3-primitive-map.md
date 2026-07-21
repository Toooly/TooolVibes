# TooolVibes — Primitive Map & Canonical UI Architecture

**Version**: 1.0
**Date**: 2026-07-21
**Source of truth**: this document + `components/ui/`
**Companion to**: `audits/tooolvibes-design-system-constitution.md`, `audits/ui-phase-2-3-token-map.md`

---

## 0. EXECUTIVE SUMMARY

TooolVibes owns 26 primitives in `components/ui/`. They are not all
canonical: two (`premium.tsx`, `premium-section.tsx`) are feature
components in disguise, and the overlay family (Dialog / Sheet / Drawer /
Popover / Tooltip) has overlap that needs documentation.

This document maps each primitive, classifies it as KEEP / MERGE /
DEPRECATE, defines the canonical primitive list, the Button system,
the Surface/Card foundation, the Overlay taxonomy, and the extended
Style Governance.

**Key decisions:**

1. The 24 canonical primitives become the building blocks of all UI.
2. `premium.tsx` + `premium-section.tsx` are migrated into the
   canonical primitives (Surface, Card, SectionHeader, Stack).
3. The overlay family is documented as 6 distinct patterns
   (Modal Dialog, Side Sheet, Bottom Sheet, Drawer, Popover, Fullscreen).
4. The Button system unifies 4 currently-separated button surfaces.
5. The Card foundation is a SHELL (`Surface` / `CardShell`) plus
   OPTIONAL feature additions (`InteractiveSurface`, `FeatureSurface`).
6. Style governance extends Phase 0 guards to a fourth axis
   (z-index arbitrary) and locks the motion scale.

---

## 1. PRIMITIVE INVENTORY (Phase 3A)

### 1.1 Complete inventory

| # | Primitive | LOC | Library | CVA? | Variants | Token-aware | Status |
|---|-----------|-----|---------|------|----------|-------------|--------|
| 1 | `accordion.tsx` | 88 | base-ui | no | open/closed | yes | KEEP |
| 2 | `avatar.tsx` | 51 | (none) | yes | 5 | partial | KEEP |
| 3 | `badge.tsx` | 89 | base-ui | yes | 14 | yes | **REFACTOR** (variant explosion) |
| 4 | `button.tsx` | 112 | base-ui | yes | 10 | yes | KEEP (canonical) |
| 5 | `card.tsx` | 103 | (none) | no | n/a | partial | KEEP (primitive, not feature) |
| 6 | `carousel.tsx` | 242 | embla | no | n/a | yes | KEEP |
| 7 | `chip.tsx` | 99 | base-ui | yes | 3 | yes | KEEP |
| 8 | `command.tsx` | 201 | cmdk | no | n/a | partial | KEEP |
| 9 | `dialog.tsx` | 168 | base-ui | no | n/a | yes | KEEP (Modal Dialog pattern) |
| 10 | `drawer.tsx` | 144 | vaul | no | n/a | yes | KEEP (Drawer pattern) |
| 11 | `dropdown-menu.tsx` | 277 | base-ui | no | n/a | yes | KEEP |
| 12 | `input-group.tsx` | 158 | (none) | yes | n/a | partial | KEEP |
| 13 | `input.tsx` | 80 | (none) | no | n/a | partial | KEEP |
| 14 | `motion-observer.tsx` | 194 | custom | no | n/a | n/a | KEEP (utility, not UI) |
| 15 | `overlay-provider.tsx` | 38 | custom | no | n/a | n/a | KEEP (system, not UI) |
| 16 | `popover.tsx` | 92 | base-ui | no | n/a | yes | KEEP (Popover pattern) |
| 17 | `premium-section.tsx` | 142 | custom | no | 4 | partial | **MIGRATE → SectionHeader / Stack** |
| 18 | `premium.tsx` | 152 | custom | no | 4 | partial | **MIGRATE → Surface / Button variants** |
| 19 | `select.tsx` | 203 | base-ui | yes | 2 sizes | yes | KEEP |
| 20 | `separator.tsx` | 27 | base-ui | no | n/a | partial | KEEP |
| 21 | `sheet.tsx` | 146 | base-ui | no | n/a | yes | KEEP (Sheet pattern, distinct from Dialog) |
| 22 | `skeleton.tsx` | 13 | (none) | no | n/a | n/a | KEEP |
| 23 | `sonner.tsx` | 52 | sonner | no | n/a | n/a | KEEP (toast system) |
| 24 | `tabs.tsx` | 87 | base-ui | yes | 2 | yes | KEEP |
| 25 | `textarea.tsx` | 78 | (none) | no | n/a | partial | KEEP |
| 26 | `tooltip.tsx` | 68 | base-ui | no | n/a | partial | KEEP |

**Totals**: 26 primitives, 2931 LOC total, 8 use CVA, 12 use base-ui,
1 vaul, 1 cmdk, 1 embla, 1 sonner, 9 custom-only.

### 1.2 Library distribution

| Library | Count | Examples |
|---------|-------|----------|
| `@base-ui/react` | 12 | dialog, sheet, drawer, popover, tooltip, select, accordion, badge, button, chip, dropdown-menu, separator, tabs |
| `vaul` | 1 | drawer |
| `cmdk` | 1 | command |
| `embla-carousel-react` | 1 | carousel |
| `sonner` | 1 | sonner (toast) |
| custom only | 9 | card, input, input-group, skeleton, avatar (custom variants), motion-observer, overlay-provider, premium, premium-section |

### 1.3 Consumer counts

| Primitive | Consumers |
|-----------|-----------|
| `button.tsx` | 60+ (used everywhere) |
| `input.tsx` | 40+ |
| `card.tsx` | 35+ |
| `badge.tsx` | 50+ |
| `chip.tsx` | 30+ |
| `dialog.tsx` | 15+ |
| `popover.tsx` | 10+ |
| `tooltip.tsx` | 10+ |
| `tabs.tsx` | 8+ |
| `select.tsx` | 5+ |
| `sheet.tsx` | 5+ |
| `skeleton.tsx` | 8+ |
| `accordion.tsx` | 3+ |
| `command.tsx` | 2+ |
| `dropdown-menu.tsx` | 5+ |
| `carousel.tsx` | 4+ |
| `tooltip.tsx` | 10+ |
| `separator.tsx` | 8+ |
| `sonner.tsx` | 1 (root) |
| `avatar.tsx` | 6+ |
| `input-group.tsx` | 4+ |
| `textarea.tsx` | 8+ |
| `motion-observer.tsx` | 4+ |
| `overlay-provider.tsx` | 1 (root) |
| `premium.tsx` | 20+ (legacy premium components) |
| `premium-section.tsx` | 12+ (legacy premium sections) |

---

## 2. PRIMITIVE DUPLICATION MAP

### 2.1 Overlay family (5 + 1 system)

| Pattern | Primitive | Library | Distinct use case |
|---------|-----------|---------|-------------------|
| **Modal Dialog** | `dialog.tsx` | base-ui | Centered, dismissible, blocks main content. Used for: settings, confirmations, full forms. |
| **Side Sheet** | `sheet.tsx` | base-ui | Slides from one edge (right default, configurable). Used for: detail panels, edit forms. |
| **Bottom Sheet** | `drawer.tsx` | vaul | Mobile-first bottom-up sheet with snap points. Used for: actions, mobile filters. |
| **Popover** | `popover.tsx` | base-ui | Anchored to trigger, non-modal. Used for: rich menus, inline previews. |
| **Tooltip** | `tooltip.tsx` | base-ui | Anchored, hover/focus only. Used for: explanations. |
| **Command** | `command.tsx` | cmdk + base-ui Dialog | Cmd+K launcher. |
| **Toast** | `sonner.tsx` | sonner | Non-blocking notifications. |

**Decision**: these 7 patterns are all CANONICAL. They are NOT duplicates.
They each represent a distinct UX pattern. The audit was wrong to
suggest Dialog ≈ Sheet; they share a base library but solve different
problems.

### 2.2 Action family (1 canonical + 2 wrappers to migrate)

| Component | Today | Future |
|-----------|-------|--------|
| `Button` | `components/ui/button.tsx` | KEEP (canonical) |
| `ButtonLink` | inside `button.tsx` (different render) | MERGE into `Button` with `asChild` prop |
| `PremiumButton` | `components/ui/premium.tsx` | DEPRECATE → `Button variant="brand"` |
| `PremiumLink` | `components/ui/premium.tsx` | DEPRECATE → `Button asChild variant="brand"` |
| `PremiumBadge` | `components/ui/premium.tsx` | DEPRECATE → `Badge variant="brand"` |
| `PremiumPanel` | `components/ui/premium.tsx` | DEPRECATE → `Surface variant="brand"` |

### 2.3 Label family (3 → 2)

| Component | Today | Future |
|-----------|-------|--------|
| `Badge` (14 variants) | `components/ui/badge.tsx` | KEEP, but REFACTOR: reduce 14 → 6 variants |
| `Chip` (3 variants) | `components/ui/chip.tsx` | KEEP (interactive, selected state) |
| `TagPill` (inline, tools/) | `components/tools/tag-pill.tsx` | KEEP (route-specific semantic) |
| `selection-chip` (inline classes) | scattered | DEPRECATE → use `Chip variant="selected"` |

**Decision**: `Badge` variants reduced from 14 to 6:
- `default`, `success`, `warning`, `danger`, `info`, `brand`

The other 8 are removed (low traffic or unused).

### 2.4 Surface family (1 primitive + 1 wrapper)

| Component | Today | Future |
|-----------|-------|--------|
| `Card` | `components/ui/card.tsx` | KEEP (primitive shell) |
| `PremiumPanel` | `components/ui/premium.tsx` | MIGRATE → `Surface variant="brand"` |
| `Surface` (NEW) | n/a | ADD (Phase 4) — canonical base surface |

### 2.5 Input family

| Component | Today | Future |
|-----------|-------|--------|
| `Input` | `components/ui/input.tsx` | KEEP |
| `Textarea` | `components/ui/textarea.tsx` | KEEP |
| `InputGroup` | `components/ui/input-group.tsx` | KEEP |
| `Select` | `components/ui/select.tsx` | KEEP |
| `SearchInput` (scattered) | various | CONSOLIDATE → use `InputGroup` |

---

## 3. CANONICAL PRIMITIVES LIST (Phase 3B)

The 24 canonical primitives that survive Phase 4:

### 3.1 Actions (4)

| Primitive | Variants | Use |
|-----------|----------|-----|
| **Button** | variant: default, primary, brand, ghost, outline, secondary, destructive, link; size: sm, md, lg, icon | every action |
| **IconButton** | variant: default, ghost, brand; size: sm, md, lg | icon-only actions |
| **LinkButton** | asChild prop on Button | link rendered as button |
| **ButtonGroup** | horizontal/vertical | grouped actions |

### 3.2 Containers (4)

| Primitive | Variants | Use |
|-----------|----------|-----|
| **Surface** | base, raised, elevated, floating, brand | every elevated element |
| **CardShell** | standard, feature, modal | feature cards |
| **InteractiveSurface** | standard, selected | clickable surfaces |
| **SectionShell** | hero, section, intro | marketing sections |

### 3.3 Inputs (5)

| Primitive | Variants | Use |
|-----------|----------|-----|
| **Input** | default, search, error | text input |
| **Textarea** | default, error | multi-line input |
| **InputGroup** | addon-left, addon-right, both | composed input |
| **Select** | default, sm | dropdown |
| **SearchInput** | default | search field |

### 3.4 Labels (2)

| Primitive | Variants | Use |
|-----------|----------|-----|
| **Badge** | default, brand, success, warning, danger, info | status labels |
| **Chip** | default, selected, removable | interactive tags |

### 3.5 Overlays (7)

| Primitive | Use |
|-----------|-----|
| **Dialog** | Modal Dialog |
| **Sheet** | Side Sheet (base-ui) |
| **Drawer** | Bottom Sheet (vaul, mobile) |
| **Popover** | Non-modal anchored |
| **Tooltip** | Hover/focus anchored |
| **Command** | Cmd+K launcher |
| **Toast** (sonner) | Notifications |

### 3.6 Disclosure (2)

| Primitive | Use |
|-----------|-----|
| **Accordion** | Expand/collapse sections |
| **Tabs** | Switch between views |

### 3.7 Feedback (3)

| Primitive | Use |
|-----------|-----|
| **Skeleton** | Loading placeholder |
| **EmptyState** | Empty/no-results state |
| **Avatar** | User/tool image with fallback |

### 3.8 System (3)

| Primitive | Use |
|-----------|-----|
| **Separator** | Horizontal/vertical rule |
| **Carousel** | Embla-based slider |
| **MotionObserver** | Scroll-reveal utility (kept in ui/ for proximity) |

### 3.9 Removed in Phase 4 (2)

| Component | Reason |
|-----------|--------|
| `premium.tsx` | Migrated into Surface + Button + Badge variants |
| `premium-section.tsx` | Migrated into SectionShell + SectionHeader + DecorativeGlow |

---

## 4. BUTTON SYSTEM (Phase 3C)

### 4.1 Final API

```typescript
<Button
  variant?: "default" | "primary" | "brand" | "ghost" | "outline" | "secondary" | "destructive" | "link"
  size?: "sm" | "md" | "lg" | "icon"
  asChild?: boolean
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
  type?: "button" | "submit" | "reset"
  onClick?: MouseEventHandler
>
```

### 4.2 Variants (8)

| Variant | Background | Text | Border | Use |
|---------|-----------|------|--------|-----|
| `default` | transparent | `--tv-ink-primary` | `--tv-border-interactive` | secondary action |
| `primary` | `--tv-accent-primary` | white | none | main CTA |
| `brand` | gradient (violet → cyan) | white | none | hero CTA |
| `ghost` | transparent | `--tv-ink-secondary` | none | tertiary action |
| `outline` | transparent | `--tv-ink-primary` | `--tv-border-subtle` | low emphasis |
| `secondary` | `--tv-surface-elevated` | `--tv-ink-primary` | none | secondary CTA |
| `destructive` | `--tv-status-danger` | white | none | destructive action |
| `link` | transparent | `--tv-accent-primary` | underline | inline action |

### 4.3 Sizes (4)

| Size | Height | Padding | Font | Min width |
|------|--------|---------|------|-----------|
| `sm` | 2rem (32px) | `var(--tv-space-2)` `var(--tv-space-3)` | `--tv-text-sm` | n/a |
| `md` | 2.5rem (40px) | `var(--tv-space-3)` `var(--tv-space-4)` | `--tv-text-sm` | n/a |
| `lg` | 3rem (48px) | `var(--tv-space-4)` `var(--tv-space-6)` | `--tv-text-md` | n/a |
| `icon` | 2.5rem (40px) | 0 | n/a | 2.5rem |

### 4.4 States

| State | Visual |
|-------|--------|
| `default` | base |
| `hover` | elevation-rest → elevation-raised |
| `active`/`pressed` | scale 0.98, accent-pressed background |
| `focus-visible` | `--tv-focus-ring` outline + 2px offset |
| `disabled` | opacity 0.5, cursor not-allowed |
| `loading` | spinner replaces icon, button disabled |

### 4.5 Migration

| Old component | New replacement |
|---------------|-----------------|
| `<Button variant="primary">` | KEEP |
| `<Button variant="default">` | KEEP |
| `<Button variant="outline">` | KEEP |
| `<Button variant="ghost">` | KEEP |
| `<Button variant="destructive">` | KEEP |
| `<Button variant="link">` | KEEP |
| `<Button variant="premium">` | **DEPRECATE → `variant="brand"`** |
| `<Button variant="glow">` | **DEPRECATE → `variant="brand"`** |
| `<ButtonLink>` | **DEPRECATE → `<Button asChild>`** |
| `<PremiumButton>` | **DEPRECATE → `<Button variant="brand">`** |
| `<PremiumLink>` | **DEPRECATE → `<Button asChild variant="brand">`** |

### 4.6 Touch targets

All button sizes respect the 44×44 minimum on mobile. The `md` size
(40px) becomes `44px` on viewports < 768px via responsive override.

---

## 5. SURFACE / CARD FOUNDATION (Phase 3D)

### 5.1 Hierarchy

```
Surface                    → base primitive, defines background level
  CardShell                → adds padding + radius + elevation
    InteractiveSurface     → adds cursor + hover + active states
    FeatureSurface         → adds feature-specific chrome (image slot, etc.)
```

### 5.2 Surface primitive (NEW in Phase 4)

```typescript
<Surface
  level?: "base" | "raised" | "elevated" | "floating" | "brand"
  padding?: "none" | "sm" | "md" | "lg"
  radius?: "sm" | "md" | "lg" | "feature" | "modal" | "pill"
  as?: "div" | "section" | "article" | "aside"
>
```

### 5.3 CardShell primitive

```typescript
<CardShell
  variant?: "standard" | "feature" | "compact"
  padding?: "sm" | "md" | "lg"
  interactive?: boolean
>
```

### 5.4 Feature cards (NOT consolidated)

TooolVibes has many feature-specific cards (ToolCard, CanonicalToolCard,
CollectionCard, EditorialPostCard, etc.). They are NOT merged into a
single mega-component. Each feature card:

1. uses `Surface` + `CardShell` + `InteractiveSurface` as the foundation;
2. composes additional feature-specific primitives (Badge, Button,
   Avatar, Image);
3. owns its domain shape and behavior.

This is the "composition over consolidation" rule from the Constitution.

---

## 6. OVERLAY ARCHITECTURE (Phase 3E)

### 6.1 Taxonomy (6 patterns + 1 system)

| Pattern | Primitive | Trigger | Use case |
|---------|-----------|---------|----------|
| **Modal Dialog** | `Dialog` | explicit action | confirm, settings, full form |
| **Side Sheet** | `Sheet` | explicit action | detail panel, edit |
| **Bottom Sheet** | `Drawer` | explicit action (mobile-first) | actions, filters, mobile |
| **Drawer (desktop)** | `Drawer` | edge navigation | rare, archive/radar desktop |
| **Popover** | `Popover` | trigger click/hover | rich menus, inline previews |
| **Tooltip** | `Tooltip` | hover/focus only | explanations |
| **Fullscreen** | custom (Phase 4+) | mobile immersive | mobile intro, mobile compare full-screen |
| **Toast** | `Sonner` | system event | notifications (non-blocking) |

### 6.2 Decision tree

```
User needs to display content above the page:
├── Blocking, requires decision?
│   ├── Centered → Dialog
│   └── From edge → Sheet (side) or Drawer (bottom on mobile)
├── Non-blocking, anchored to trigger?
│   ├── Rich content, dismissable → Popover
│   └── Hint only, on hover → Tooltip
├── Global launcher?
│   └── Command (cmdk + Dialog)
├── Notification, non-interactive?
│   └── Toast (sonner)
└── Mobile immersive experience?
    └── Fullscreen overlay (Phase 4 new)
```

### 6.3 Implementation requirements

Every overlay must:

- trap focus while open;
- restore focus on close;
- be dismissable by Escape (except Toast);
- use `prefers-reduced-motion` for enter/exit;
- have a backdrop (except Popover and Tooltip);
- have an accessible title (visually hidden if needed).

### 6.4 Migration

| Use case today | Use case in Phase 4 |
|----------------|---------------------|
| `Dialog` for any centered modal | KEEP |
| `Sheet` for side panel | KEEP |
| `Drawer` (vaul) for bottom sheet | KEEP |
| Modal from `motion.div` in `badge-unlock-modal.tsx` | MIGRATE → use `Dialog` |
| Modal from `motion.div` in `level-up-modal.tsx` | MIGRATE → use `Dialog` |
| `custom panel` in `compare-decision-panel.tsx` | MIGRATE → use `Sheet` |

The 3 inline `motion.div` modals in gamification are migrated to
`Dialog` to inherit focus management and accessibility.

---

## 7. STYLE GOVERNANCE EXTENSION (Phase 3F)

### 7.1 Existing guards (from Phase 0)

| Guard | Threshold | Status |
|-------|-----------|--------|
| hex hardcoded | ≤ 2369 | LOCKED |
| radius arbitrary | ≤ 879 | LOCKED |
| breakpoints custom | ≤ 36 unique | LOCKED |
| motion duration arbitrary | ≤ 13 | LOCKED |

### 7.2 New guards (Phase 4)

| Guard | Threshold | What it catches |
|-------|-----------|-----------------|
| **z-index arbitrary** | ≤ 5 (only exceptions) | `z-index: [NNN]` not in token scale |
| **inline styles in admin** | ≤ 100 (current 100) | `style={{` in admin pages |
| **motion duration non-token** | ≤ 13 (current) | `duration-[Nms]`, `transition-duration: NNms` not using tokens |
| **font-family non-canonical** | 0 | `font-family:` not using Inter or Fraunces |
| **Tailwind arbitrary spacing** | ≤ 50 | `p-[Nrem]`, `gap-[Nrem]` not in scale |

### 7.3 Check script extension

Phase 4 adds these counters to `scripts/release/check-style-ownership.mjs`:

```js
// New: z-index arbitrary guard
const Z_INDEX_ARBITRARY = grepCount("z-index:\\s*\\d+", ["**/*.css", "**/*.tsx"]);
if (Z_INDEX_ARBITRARY > 5) fail(`z-index arbitrary count ${Z_INDEX_ARBITRARY} > 5 (only documented exceptions)`);

// New: motion duration non-token guard
const MOTION_DURATION_NONTOKEN = grepCount("duration-\\[[0-9]+ms\\]|transition-duration:\\s*[0-9]+ms", ["**/*.tsx", "**/*.css"]);
if (MOTION_DURATION_NONTOKEN > 13) fail(`motion duration non-token count ${MOTION_DURATION_NONTOKEN} > 13`);
```

### 7.4 Migration policy

The 4 legacy counters (hex, radius, breakpoints, motion duration) may
decrease but NEVER increase. New code that uses these patterns fails
the check.

This is the "LEGACY BASELINE + NO NEW DEBT" rule from the Constitution.

### 7.5 What governance does NOT do (yet)

- It does NOT block legacy violations.
- It does NOT enforce token naming.
- It does NOT enforce component composition.
- It does NOT enforce responsive tier usage.

These belong to linter rules (ESLint, Stylelint) that are added in
Phase 5+, not in the governance script.

---

## 8. CANONICAL MIGRATION QUEUE

### 8.1 Phase 4 migration order (12 weeks)

| Week | Focus | Files affected |
|------|-------|----------------|
| 1 | Add Surface primitive; migrate `card.tsx` | components/ui/card.tsx + 35 consumers |
| 2 | Add IconButton + ButtonGroup; migrate button variants | components/ui/button.tsx + 60 consumers |
| 3 | Migrate `PremiumButton`/`PremiumLink` → `Button variant="brand"` | components/ui/premium.tsx + 20 consumers |
| 4 | Migrate `PremiumBadge` → `Badge variant="brand"`; reduce 14 → 6 variants | components/ui/badge.tsx + 50 consumers |
| 5 | Migrate `PremiumPanel` → `Surface variant="brand"` | components/ui/premium.tsx |
| 6 | Migrate `premium-section.tsx` → `SectionShell` + `SectionHeader` | components/ui/premium-section.tsx + 12 consumers |
| 7 | Migrate 3 motion.div modals → `Dialog` | components/gamification/* (3 files) |
| 8 | Migrate inline `style={{}}` in admin → component classes | app/(admin)/* (10+ files) |
| 9 | Migrate hex `#6a3cff` → `var(--tv-accent-primary)` in primitives | components/ui/* |
| 10 | Migrate hex debt in shared components | components/app/*, components/layout/* |
| 11 | Migrate hex debt in feature components (folder by folder) | components/tools/* |
| 12 | Migrate remaining hex debt + arbitrary radii | rest of codebase |

### 8.2 Acceptance criteria for migration completion

A migration step is COMPLETE when:

1. The old component has zero remaining consumers.
2. The old component is removed from `components/ui/`.
3. Build passes.
4. Typecheck passes.
5. Style check passes (no new debt).
6. Visual regression: PNG diff vs Phase 0 baseline shows zero diff
   (or only documented intentional changes).

---

## 9. SUMMARY STATS

| Metric | Count |
|--------|-------|
| Total primitives today | 26 |
| Total primitives after Phase 4 | 24 (2 deprecated) |
| Total primitives NEW in Phase 4 | +3 (Surface, IconButton, ButtonGroup) |
| Net primitives | 24 |
| LOC total (current) | 2931 |
| LOC total (after migration) | ~2700 (consolidation gain) |
| CVA adoption | 8/26 today → 18/24 after Phase 4 |
| base-ui adoption | 12/26 today |
| Consumer overlap removed | PremiumButton, PremiumLink, PremiumBadge, PremiumPanel, PremiumSection, ButtonLink |
| Overlay patterns | 7 distinct (not 4 duplicates) |
| New governance guards | 5 (z-index, inline styles, motion duration, font, tailwind arbitrary) |

---

## 10. NEXT STEPS

Phase 5 (planned) will:
1. Consolidate the 7 ToolCard variants into a composition pattern.
2. Consolidate the 4 Compare variants.
3. Consolidate the 2 Shortlist variants.
4. Migrate remaining hex debt in features.

Phase 6 (planned) will:
1. Split globals.css by domain.
2. Migrate `!important` to semantic layering.
3. Add ESLint rules for design system compliance.
4. Consolidate responsive tier usage.
5. Decide on light theme (or formally reject it).
