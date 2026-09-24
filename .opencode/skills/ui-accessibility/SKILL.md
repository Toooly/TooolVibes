# ui-accessibility

Preserve WCAG-quality interaction while matching Golden Masters.

## Checklist

- Contrast AA for text and controls on every surface.
- Semantic buttons/links (no div-onClick for actions).
- aria labels on icon-only controls; dialog roles and focus trap.
- Focus visible; logical tab order; skip link functional.
- Touch targets >= 44x44pt on mobile.
- Screen-reader ordering matches visual ordering.
- prefers-reduced-motion respected.
- Never sacrifice accessibility to match a mockup pixel: report the
  conflict instead.
