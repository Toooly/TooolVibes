# responsive-ui-qa

Verify mobile-first changes do not destroy tablet/desktop.

## Checklist

- Horizontal overflow: `document.body.scrollWidth <= innerWidth` at every
  QA viewport (375x812, 390x844, 430x932, 768x1024, 1440x1000).
- Fixed/sticky overlap: bottom nav, compare dock, consent banner,
  headers must not cover CTAs, article text, or footer legal links.
- Safe area: env(safe-area-inset-*) respected on iOS viewports.
- Typography: no clipped headings, no orphaned meta, measure respected.
- Cards/modals/filter rails: intact at each breakpoint.
- Dialogs/sheets: correct bounds, focus trap, dismiss behavior.
- Touch targets >= 44px on mobile controls.
- Keyboard focus visible throughout.
