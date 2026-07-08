# Figma Handoff Framework — Tooolvibes

> **Use this whenever the agent must decide what becomes a Figma source-of-truth, what is a reference sketch, and what stays in code.** Prevents over-investing in Figma and prevents drift in the opposite direction.

---

## 1. Why this framework exists

Tooolvibes has shipped without a Figma-first system. The risk is **two extremes**:

- **Over-Figma:** rebuild the whole product in Figma before code, blocking engineering for weeks.
- **Under-Figma:** ship nothing in Figma, then fail to onboard new designers / agencies / reviewers.

This framework picks the middle: **Figma owns tokens, primitives, and the 5–7 hero pages. Code owns everything else.** This is the only model that scales for Tooolvibes right now.

---

## 2. The three classifications (binding)

| Tag                 | Definition                                                                                                                    | Where the truth lives                                                   | Update cadence   |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------- |
| **Figma-SoT**       | Source of truth. Both Figma and code are kept in sync; either can lead but a spec exits.                                       | Figma file is canonical; code must match within tight tolerance.        | Weekly / per-milestone |
| **Figma-Reference** | Visual sketch exists so a non-engineer can review; code is allowed to drift.                                                  | Code is canonical; Figma is a *snapshot* of what shipped.               | Per release      |
| **Code-Only**       | No Figma. Living entirely in code. Copy, animation timings, micro-utility styles.                                             | Code is canonical; Figma is not involved.                              | n/a              |

---

## 3. Decision tree

Use this on every UI element to classify it.

```
Is it a token?
├─ Color / space / radius / shadow / type step → Figma-SoT
└─ No ↓

Is it a primitive used in ≥3 different surfaces?
├─ Button / Badge / Card / Input / Tooltip / Modal / BottomSheet / Toast → Figma-SoT
└─ No ↓

Is it a hero page (Home / Discovery / Tool Detail / Compare / Shortlist / Editorial / Service)?
├─ Yes → Figma-SoT
└─ No ↓

Is the layout bespoke (one-off landing block, affiliate panel, error page)?
├─ Yes → Figma-Reference
└─ No ↓

Is the change microcopy, animation timing, focus-ring style, hover transform?
└─ Yes → Code-Only
```

If you genuinely cannot decide, default to **Figma-Reference** (cheap) and escalate after one cycle.

---

## 4. What must be in Figma (Phase 1 — Backlog)

### 4.1 Tokens (Figma-SoT, must exist first)

- **Color**
  - Background base
  - Surface (raised)
  - Ink primary, ink secondary, ink muted
  - Accent (primary / hover / pressed)
  - Success, warning, danger, info
  - Focus ring color
- **Typography**
  - UI family + weights (default: Inter 400 / 500 / 600)
  - Display family + weights (default: GT Sectra / Fraunces)
  - Size scale (caption / body / lead / h3 / h2 / h1 / display)
  - Line-heights (tight / normal / loose)
  - Tracking (tight / default / wide)
- **Spacing**
  - 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128
- **Radius**
  - sm / md / lg / pill (e.g. 6 / 10 / 16 / 999)
- **Shadow / elevation**
  - rest / raised / modal (named — never free hex)
- **Motion**
  - duration fast / base / slow (e.g. 120 / 180 / 280 ms)
  - ease standard / emphasis

### 4.2 Primitives (Figma-SoT, must exist before hero pages)

- **Button** — primary / secondary / ghost / destructive / loading / icon-only
- **Badge** — neutral / accent / success / warning / danger / info
- **Card** — Tool Card (the workhorse) + Editorial Card + Offer Card
- **Input** — text / search / textarea / select / checkbox / radio / switch
- **Tooltip**
- **Modal**
- **BottomSheet**
- **Toast**
- **Avatar**
- **Tabs**
- **Accordion** (use sparingly)

### 4.3 Hero pages (Figma-SoT, build after primitives)

The 7 priority pages, in dependency order:

1. **Tool Detail** — most visited, most editorial.
2. **Tool Discovery** (category hub + filters)
3. **Home**
4. **Compare**
5. **Shortlist**
6. **Editorial article**
7. **Service** (positioning + CTA)

Each page built in 3 viewports: mobile (375), tablet (768), desktop (1280+).

### 4.4 Figma-Reference (light coverage)

- One-off landing blocks (Shop, About, Affiliate disclosure, Pricing/Shop).
- 404 / 500 / maintenance.
- Empty states for niche sections.
- Thank-you / confirmation pages.

### 4.5 Code-Only (no Figma)

- Microcopy text.
- Hover transition timings.
- Loading skeleton variants specific to a single route.
- Animation choreography per surface.
- Focus-ring customizations per route.
- Form validation messages.

---

## 5. Figma file structure (recommendation)

```
Tooolvibes Design System
├── Cover
├── 00 — Tokens (Figma Variables, every primitive binds here)
│   ├── Color
│   ├── Typography
│   ├── Spacing
│   ├── Radius
│   ├── Elevation
│   └── Motion
├── 01 — Primitives (Figma-SoT)
│   ├── Buttons
│   ├── Badges
│   ├── Cards
│   ├── Inputs
│   ├── Modal / Sheet
│   └── Tooltip / Toast
├── 02 — Components (composed)
│   ├── Tool Card
│   ├── Editorial Card
│   ├── Compare Row
│   ├── Header / Nav
│   └── Footer
├── 03 — Pages (Figma-SoT hero pages)
│   ├── Home
│   ├── Discovery
│   ├── Tool Detail
│   ├── Compare
│   ├── Shortlist
│   ├── Editorial article
│   └── Service
├── 04 — Patterns
│   ├── Empty states
│   ├── Loading states
│   └── Error states
└── 99 — Snapshots (Figma-Reference only)
    ├── /shop
    ├── /404
    └── /account
```

Pages prefixed with `99 —` are visual snapshots only; they exist to keep cross-team review possible without forcing a re-handoff. Pages prefixed with `00` and `01` are the gating dependencies: nothing in `02`-`03` ships as Figma-SoT until its primitives are tokenized.

---

## 5-bis. Token naming convention (binding)

Tooolvibes token names **must map 1:1 across Figma Variables, CSS variables, and Tailwind keys**, so a designer hand-off can be consumed by code without translation:

| Concept                | Figma Variable           | CSS variable                 | Tailwind key             |
| ---------------------- | ------------------------ | ---------------------------- | ------------------------ |
| Background base        | `color/bg/base`          | `--color-bg-base`            | `bg.base`                |
| Surface raised         | `color/surface/raised`   | `--color-surface-raised`     | `surface.raised`         |
| Ink primary            | `color/ink/primary`      | `--color-ink-primary`        | `ink.primary`            |
| Ink muted              | `color/ink/muted`        | `--color-ink-muted`          | `ink.muted`              |
| Accent primary         | `color/accent/primary`   | `--color-accent-primary`     | `accent.primary`         |
| Accent hover           | `color/accent/hover`     | `--color-accent-hover`       | `accent.hover`           |
| Space-3                | `space/3`                | `--space-3`                  | `space.3`                |
| Radius md              | `radius/md`              | `--radius-md`                | `radius.md`              |
| Elevation raised       | `elevation/raised`       | `--elevation-raised`         | `elevation.raised`       |
| Duration fast          | `motion/duration/fast`   | `--motion-duration-fast`     | `motion.duration.fast`   |

Rules:

1. **Lowercase, slash-separated.** Figma group names use `/`, code uses `-`. Both are auto-translatable.
2. **Semantic, never visual.** `accent.primary` ✅, `violet.500` ❌.
3. **Role first, then state.** `ink.primary`, `ink.muted`. Always ink + role.
4. **No `#`, no `px`, no `kg`** in any token name (no units in names).
5. **One token, one value.** No dual-mode (`accent-light` / `accent-dark`) tokens. Mode is handled by Figma Modes / CSS `:root[data-theme]`.
6. **Refuse free-form values in Figma.** A hex picked in Figma that has no matching token = an automatic spec violation; the designer must add a token instead.

If the codebase already uses a different naming convention (e.g. an existing Tailwind theme), **do not rename wholesale.** Add a translation shim and surface a P1 migration entry on the backlog.

---

## 6. Figma component spec — per primitive (template)

For each primitive component, the Figma file must contain a single page that documents:

1. **Anatomy** — labeled callouts of every part, with token names visible inside each callout.
2. **Variants** — every visual variant, with token names visible.
3. **States** — rest / hover / pressed / focus / disabled / loading / error (as applicable).
4. **Sizes** — sm / md / lg where applicable.
5. **Tokens used** — list every color / space / radius / type / motion token, by name (no hex / px).
6. **Code counterpart** — file path + component name + props (typed).
7. **Do / Do not** — 1 example pair, in Figma-native frames.
8. **Token export** — at the bottom of the spec page, list the exact CSS / Tailwind exports the implementer should drop into the codebase to mirror this primitive (a fenced JSON or CSS block).

The agent **does not** build these Figma frames. The human designer does, using this spec as the brief.

### 6-bis. Per-primitive spec (one-page brief template, pasteable)

```md
# Primitive spec — <Name>

## 1. Anatomy
1. root container — uses `--radius-md`, `--space-3`, `--color-surface-raised`
2. icon slot — `--size-icon-md` if tokenized, else 16px; aligned left
3. label — `--font-ui`, weight 500, `--color-ink-primary`
4. trailing element — optional

## 2. Variants
- variant: button/primary | colors: accent/primary, accent/hover, accent/pressed
- variant: button/secondary | colors: surface/raised, ink/primary, accent/hover as border
- variant: button/ghost | colors: transparent, ink/primary, ink/muted on hover
- variant: button/destructive | colors: danger/primary, danger/hover, danger/pressed
- variant: button/icon-only | aria-label required

## 3. States
- rest | hover (lift ≤ 2px or border accent) | focus (visible ring --color-focus) | disabled (50% opacity + cursor:not-allowed) | loading (spinner 16, label remains)

## 4. Sizes
- sm 32px height | md 40px | lg 48px

## 5. Tokens used (no hex / px)
- color: --color-accent-primary, --color-surface-raised, --color-ink-primary, --color-ink-muted, --color-danger-primary, --color-focus
- space: --space-2 (xs gap), --space-3 (icon→label), --space-4 (button padding-x)
- radius: --radius-md
- elevation: --elevation-rest (default), --elevation-raised (hover on cards)
- motion: --motion-duration-fast (120ms) | --motion-easing-standard

## 6. Code counterpart
- File: src/components/ui/Button.tsx
- Props: variant: 'primary'|'secondary'|'ghost'|'destructive'|'icon-only'; size?: 'sm'|'md'|'lg'; loading?: boolean; ariaLabel?: string; as?: 'button'|'a'
- Already used in: <count> sites; <list of route:component call sites>

## 7. Do / Do not
- ✓ pair with text label (or aria-label) — never icon-only without label
- ✗ two stacked buttons on the same row with primary + primary; one must demote to secondary

## 8. Token export (drop into the codebase to mirror this primitive)

```css
/* globals.css or tokens.css — drop-in */
:root {
  --color-accent-primary: hsl(...);
  --color-accent-hover:   hsl(...);
  --color-accent-pressed: hsl(...);
  --radius-md: 10px;
  --motion-duration-fast: 120ms;
  --motion-easing-standard: cubic-bezier(.2,.0,.0,1);
}
```
```ts
// tailwind.config.ts additions (if Tailwind)
export default {
  theme: {
    extend: {
      colors: { accent: { primary: 'var(--color-accent-primary)', hover: 'var(--color-accent-hover)' } },
      borderRadius: { md: 'var(--radius-md)' },
      transitionDuration: { fast: 'var(--motion-duration-fast)' },
    },
  },
};
```
```ts
// tokens.ts additions (if JS tokens)
export const tokens = {
  color: { accent: { primary: '...', hover: '...', pressed: '...' } },
  radius: { md: 10 },
  motion: { duration: { fast: 120 }, easing: { standard: 'cubic-bezier(.2,.0,.0,1)' } },
} as const;
```
```

---

## 7. Handoff workflow (Figma → Code)

Each token / primitive / hero page must travel Figma → Code with a **handoff artifact**:

```md
# Handoff — <name>
- Source Figma: <link to Figma frame>
- Target files: <list of files>
- Tokens affected: <list>
- Variants shipped now: <list>
- Variants deferred: <list>
- Risks / regressions: <list>
- QA: <link to checklist>
- Owner: <name>
- Date: <date>
```

The implementation agent reads the handoff artifact and executes **only** what is in scope.

---

## 8. Handoff workflow (Code → Figma snapshot)

After a release, the Figma "Reference" snapshot of a page must be regenerated. Process:

1. Render the page in production.
2. Screenshot at 375 / 768 / 1280.
3. Drop the screenshot into the `99 — Snapshots` page.
4. Note any drift vs. the Figma-SoT frame in a single comment.
5. If drift > "minor" (more than spacing or color token), schedule a Figma update.

This prevents silent drift and keeps Figma "Reference" useful.

---

## 9. What kills Figma-SoT

Avoid these anti-patterns:

- **Figma becomes the only place tokens live.** Tokens must be exported to code (CSS variables / Tailwind config / JS object). Figma is editorial.
- **Free-form design in Figma.** Every primitive has a token binding. If a designer hand-picks a hex, it must be added to the token set; do not allow ad-hoc values to leak into the Figma file.
- **Naming drift.** Hex codes in token names (`violet-500`), visual names in semantic slots (`purple-blue`), or unit suffixes (`16px`) break the Figma↔code bridge. Reject on sight.
- **Pixel-perfect worship.** Code may legitimately deviate within a tolerance (e.g. ±2px) for reasons of OS / browser. Figma-SoT does not mean "pixel-identical"; it means "these are the tokens, this is the hierarchy".
- **Figma drift left unmanaged.** A Figma file untouched for 6 months is worse than no Figma. Enforce weekly review.
- **Figma-SoT exported without a code counterpart.** Every Figma-SoT primitive must have a `components/ui/` file targeted before the Figma frame is "shipped." Otherwise it becomes an orphan spec with no consumer.

---

## 10. Acceptance criteria — when Figma-SoT is "ready"

A Figma-SoT component / page is ready to hand off to code when **every** box below is checked. The agent reviews this list on request; a human designer ticks it. If any item fails, the coding agent must push back rather than guess.

- [ ] All tokens are bound (no free values; no `#hex` or `12px` in the Figma frame).
- [ ] Token names follow the §5-bis convention, mapping 1:1 to Figma Variables, CSS variables, and Tailwind keys.
- [ ] All states documented (rest / hover / focus / disabled / loading / error where applicable).
- [ ] All breakpoints present (mobile 375, tablet 768, desktop 1280; wide 1920 sanity).
- [ ] Code counterpart path is linked, and the React file exists (or is staged in the same PR).
- [ ] Token export block (§6-bis item 8) is provided, ready to drop into the codebase.
- [ ] Do / Do not examples are present (correct vs. misuse, side by side).
- [ ] A second human reviewer (not the original author) has signed off in a Figma comment.
- [ ] If the Figma-SoT replaces existing code, a `FINDING DENSITY` upstream fix has been planned (e.g. migrate 8 callers at once, not one at a time).

---

## 11. Three-way reconciliation (Figma ↔ design tokens ↔ code)

To keep Figma, the design token source, and the code rendering identical, run this reconciliation once per milestone:

1. Run a script in the repo that exports token values from the codebase (CSS vars / Tailwind config / tokens.ts) into JSON.
2. Run a Figma plugin (Tokens Studio / Figma Variables export) to dump the Figma variables into JSON.
3. Diff the two JSON files. Any mismatch is a drift bug.
4. Decide direction: code is canonical for code, Figma is canonical for design intent. Resolve drift in the direction of the milestone target (e.g. if rebranding, Figma wins; if stabilizing, code wins).
5. Re-export tokens back into the codebase from the merged JSON.

If drift exceeds 3 token values in a single milestone, raise a P1 finding. This guarantees the system does not silently decay.
