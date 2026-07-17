# Core primitives contract (B23 / DS-305)

Status: release contract for `Button`, `Card`, `Badge` and `Chip`.

Scope: `components/ui/*` only. No route migration, no raw-control changes in
consumers. Legacy exports stay working as temporary aliases; reversibility is
a git revert away.

## Shared contract

- Every interactive primitive renders a native element (`<button>` for
  `Button` and `Chip`), so Enter/Space activation, focus order and form
  semantics come from the platform. jsdom cannot exercise activation
  behavior, so the keyboard contract is asserted structurally in
  `__tests__/components/ui/core-primitives.test.tsx` and real key dispatch is
  covered by the E2E layer.
- Every primitive exposes a stable data contract for tests and styling:
  `data-slot`, plus `data-variant` / `data-size` where the prop exists.
- Focus state: `focus-visible` ring (`border-ring` + `ring-3 ring-ring/50`),
  never on mouse click. Never remove the outline without a visible
  replacement.
- Disabled state: native `disabled` attribute, `pointer-events-none`,
  `opacity-50`, no activation by pointer or keyboard.
- Styling consumes semantic `--tv-*` tokens; new hardcoded color, radius,
  elevation, motion or z-index values are rejected by the ownership policy in
  `docs/design-system/cascade-and-token-foundation.md`.

## Button — `components/ui/button.tsx`

Built on Base UI `Button`. `data-slot="button"`.

| Prop | Values | Notes |
|---|---|---|
| `variant` | `default`/`primary`, `premium`, `glow`, `outline`, `secondary`, `subtle`, `ghost`, `destructive`, `link` | mapped to the `premium-button-*` visual classes |
| `size` | `default`, `xs`, `sm`, `md`, `lg`, `xl`, `icon`, `icon-xs`, `icon-sm`, `icon-lg` | mirrored to `data-size` |
| `loading` | `boolean` | sets `aria-busy`, `data-loading`, disables the control and renders a spinner while keeping the label readable |
| `disabled` | `boolean` | native disabled; activation suppressed |

States: `hover`, `focus-visible` ring, `active/pressed` via the
`premium-button-*` classes, `disabled`, `loading`, `aria-invalid` ring.
`ButtonLink` remains the legacy navigation alias (primary/premium/secondary/
ghost/outline variants) and is unchanged.

## Card — `components/ui/card.tsx`

Pure layout primitive. Slots via data contract: `card`, `card-header`,
`card-title`, `card-description`, `card-action`, `card-content`,
`card-footer`.

| Prop | Values | Notes |
|---|---|---|
| `size` | `default`, `sm` | density switch on `data-size`; `sm` reduces padding/gap through `group-data-[size=sm]/card` selectors |

Non-interactive by default: add interactive children (`Button`, links)
inside slots instead of making the whole card clickable.

## Badge — `components/ui/badge.tsx`

Static label/status primitive (Base UI `useRender`, renders a `<span>`).
`data-slot="badge"`, `data-variant` mirrors the variant prop.

Variants: `default`, `neutral`, `accent`, `secondary`, `trust`, `verified`,
`affiliate`, `info`, `warning`, `success`, `destructive`, `danger`,
`outline`, `ghost`, `link`.

Badge is not interactive: use `Chip` for selectable filters and `Button`
for actions.

## Chip — `components/ui/chip.tsx`

Interactive filter/toggle primitive built on Base UI `Toggle`
(`<button aria-pressed>`). `data-slot="chip"`, `data-variant`, `data-size`;
the pressed state also exposes `data-pressed` for styling.

| Prop | Values | Notes |
|---|---|---|
| `variant` | `default`, `accent`, `outline` | neutral surface, accent tint, transparent outline |
| `size` | `sm`, `default`, `lg` | mirrored to `data-size` |
| `selected` | `boolean` | controlled pressed state (maps to `aria-pressed`) |
| `defaultSelected` | `boolean` | uncontrolled initial pressed state |
| `onSelectedChange` | `(selected: boolean) => void` | fired after every toggle |
| `disabled` | `boolean` | native disabled; activation suppressed |

States: `hover`, `focus-visible` ring, `pressed` (selected), `disabled`.
Pressed visuals are token-based (`--tv-surface-elevated`,
`--tv-border-interactive`, `--tv-accent-aa` with white text, which keeps the
4.5:1 contrast contract).

## State matrix and test coverage

The dev showcase (`app/dev/design-system/page.tsx` →
`components/dev/figma-design-system-showcase.tsx`) renders the canonical
state matrix in section 02 (Primitive): Button variants ×
default/disabled/loading + full size row, Chip variants ×
default/selected/disabled + size row, all Badge variants, Card in both
densities.

Automated coverage (`__tests__/components/ui/core-primitives.test.tsx`,
vitest + jsdom, axe-core already in node_modules):

- data contract (slot/variant/size) for every primitive;
- Button: variants, all sizes, disabled, loading (`aria-busy`, spinner,
  activation suppression), native keyboard contract;
- Chip: toggle on click, controlled/uncontrolled selection, disabled,
  variants/sizes, native keyboard contract;
- Badge: variants and data contract;
- Card: all slots, density size;
- axe-core: zero violations on every primitive matrix and on the full
  showcase (`color-contrast` and `region` rules are disabled because jsdom
  cannot compute real contrast and fragments are not whole documents; the
  contrast contract is enforced statically on tokens).

Visual snapshot rebaseline (Playwright `visual-matrix.spec.ts`) is
intentionally not part of this batch per user decision.
