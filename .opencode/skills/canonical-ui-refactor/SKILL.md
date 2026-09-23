# canonical-ui-refactor

Prevent Frankenstein CSS during visual reconstruction.

## Rules

- Inspect the canonical component before styling it.
- Fix the actual canonical component/scoped stylesheet.
- Remove or neutralize an obsolete rule instead of overriding it again.
- No new parity-vN override stylesheets (no v5/v6/v7 layers).
- Avoid !important; avoid specificity wars.
- Keep business logic separate from presentation.
- One canonical visual implementation per component.
- Legacy CSS may be removed/neutralized only after proving the
  replacement renders correctly.
- Keep the git diff understandable: one surface per commit where possible.
