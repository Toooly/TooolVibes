# Canonical ToolCard contract (B24 / DS-306)

Status: release contract for the single responsive tool card
(`components/directory/canonical-tool-card.tsx`).

Scope: one card API renders grid / list / mobile without losing information.
`DirectoryToolCard` and `MobileToolCard` are thin adapters over it with
unchanged exports and props; consumers and routes keep mounting the same
components (reversibility is a git revert). The editorial
`components/tools/tool-card.tsx` family stays untouched until B58.

## API

```tsx
import { CanonicalToolCard } from "@/components/directory/canonical-tool-card";

<CanonicalToolCard tool={tool} density="grid" priority showActions />
```

| Prop | Values | Notes |
|---|---|---|
| `tool` | `DirectoryTool \| ToolPublicView` | shared public model (B14); nullable editorial fields (`editorialReview`, `whyItMatters`, `ctaLabel`, `publishedAt`) are handled with graceful fallbacks |
| `density` | `grid` (default), `list`, `mobile` | layout/density switch; `mobile` maps to the Card primitive `size="sm"` |
| `priority` | `boolean` | visual emphasis on the glyph (e.g. first card of a rail) |
| `actions` | `ReactNode` | overrides the actions slot; default = shared `ShortlistToggle` + `CompareToggle` on the workspace store |
| `showActions` | `boolean` (default `true`) | hides the actions slot only; navigation CTAs always stay |
| `className` | `string` | merged on the root Card |

## Density matrix — same data, three layouts

- **grid**: media region (glyph, level/`toolOfWeek` badges, name, category,
  highlights) → meta panel (Livello/Fonte) → sections (In breve, Cosa fa,
  Lettura rapida) → tag links → footer (`whyItMatters`, external CTA +
  profile CTA, save/compare actions, update date).
- **list**: same fields arranged horizontally from `md` (768px) up:
  identity column, body column, meta/actions rail. No information loss.
- **mobile**: compact row — glyph, category, level badge, linked title,
  description (with `tldr` fallback), `Apri scheda` link, save/compare
  actions.

Responsive contract (logical breakpoints 320 / 768 / 1024 / 1440): base
single column, `sm:`/`md:`/`lg:` utilities drive the deterministic parts;
jsdom asserts the static class contract, real media-query behavior is
covered by the E2E visual layer (rebaseline currently suspended per user
decision).

## Composition and tokens

- Built on B23 primitives: `Card` (root, `data-slot="card"`,
  `data-density`), `Badge` (levels, highlights, tag links via `render`),
  `Button` (external/profile CTAs via `render` on `<a>`/`<Link>`).
  `Chip` is intentionally not used: card tags are navigation, not filters
  (B23 contract: Badge for static labels, Chip for selectable filters).
- Save/compare actions are the existing shared toggles
  (`ShortlistToggle` / `CompareToggle`), so workspace state, compare limit
  and persistence stay single-sourced. The root mirrors state for styling
  and tests through `data-saved` / `data-compared`.
- Styling consumes `--tv-*` tokens (surfaces, ink, radius, elevation,
  motion, typography) and the light-theme semantic aliases already used by
  the Card primitive (`text-card-foreground`); per-tool accent colors stay
  data-driven inline styles. No hardcoded z-index, no new stylesheets, no
  `!important`.
- Typography respects the B21 contract: nothing below 12px
  (`--tv-text-xs`), label tracking `0.08em`, eyebrow tracking max `0.14em`.
- Missing logo: the shared `DirectoryToolGlyph` falls back to the tool
  initials on image error.

## Adapters

- `DirectoryToolCard` (`components/directory/directory-tool-card.tsx`):
  `density="grid"`, same `tool`/`priority` props. Adds the shared
  save/compare actions required by DS-306.
- `MobileToolCard` (`components/directory/mobile-tool-card.tsx`):
  `density="mobile"` plus the exact `motion` whileInView wrapper from the
  B25 catalog facade, same `tool`/`index` props. The facade
  (`catalog-result-list.tsx`) imports it from the new module with an
  otherwise behavior-preserving diff.

## Test coverage

`__tests__/components/directory/canonical-tool-card.test.tsx` (18 tests,
vitest + jsdom):

- grid: every canonical slot, full information set, CTA links, date,
  save/compare presence, badge variant mapping, responsive static
  contract, B21 typography minimum;
- list: information parity with grid, horizontal `md:flex-row` contract,
  linked title;
- mobile: compact contract, `size="sm"` propagation, description fallback,
  accessible `Apri scheda` label;
- long copy: full text kept in the DOM, clamp/break-words/min-w-0 classes
  (no overflow, no JS truncation);
- missing logo: image error → initials fallback visible;
- save/compare states: not-saved/saved and in/out of compare on card
  (`data-saved`/`data-compared`) and toggles (`aria-pressed`), interactive
  save toggle through the canonical workspace reset
  (`activateToolWorkspaceOwner`);
- actions slot override and `showActions={false}`;
- adapters: unchanged exports/props, `priority` emphasis, density wiring;
- axe-core: zero violations on all three densities and both workspace
  states (`color-contrast` and `region` disabled as in the B23 suite).
