# 02 - UI/UX Rules

## Visual direction

The design should feel:

- premium
- modern
- clean
- polished
- responsive
- interactive
- credible
- refined
- not overly dark
- not childish
- not cluttered

The UI should look like a serious SaaS/product platform, not a quick landing page template.

---

## Mobile requirements

Mobile must not be a compressed desktop layout.

Rules:

- Avoid huge cards stacked endlessly.
- Avoid fixed-width containers.
- Avoid text overflow.
- Avoid oversized hero blocks.
- Avoid massive vertical gaps.
- Avoid tiny unreadable text.
- Avoid horizontal scrolling caused by broken containers.
- Avoid full-width elements that feel visually heavy without reason.
- Avoid forcing desktop carousel behavior onto mobile.
- Avoid long unstructured pages where the user only scrolls cards forever.

Use, where useful:

- accordions
- compact cards
- tabs
- drawers
- bottom sheets
- swipeable lists
- horizontal mobile carousels
- “show more” patterns
- progressive disclosure
- sticky mini navigation
- section summaries
- smaller CTAs
- reduced hero height
- improved content hierarchy

Mobile must feel intentionally designed.

---

## Desktop requirements

Desktop should remain polished and spacious, but not empty.

Rules:

- Use grid and flex layouts carefully.
- Align sections consistently.
- Keep card heights visually coherent.
- Avoid inconsistent spacing between sections.
- Avoid decorative effects used randomly only once.
- Use gradients, accents, and background effects coherently.
- Keep visual rhythm across the page.
- Avoid oversized empty areas.
- Avoid text blocks that are too wide.
- Use good max-widths for readability.
- Keep CTAs visible and well-positioned.

---

## Tablet and large screen requirements

The layout must adapt between mobile and desktop.

Rules:

- Tablet should not simply inherit broken desktop widths.
- Large screens should not stretch content excessively.
- Ultra-wide and TV-like screens need max-width constraints.
- Sections should remain centered and balanced.
- Cards should not become absurdly wide.
- Text lines should remain readable.

---

## Buttons

Buttons should not be basic colored rectangles.

Expected behavior:

- smooth hover animation
- smooth active/click animation
- accessible focus state
- good contrast
- coherent with palette
- animated background, shine, border, gradient, glow, or transition where tasteful
- hover can shift toward a warm yellow/gold accent if coherent with the palette
- active state should feel tactile
- disabled state should be clear
- buttons must remain readable during animation

Avoid:

- only using `scale()` as the entire animation
- excessive bounce effects
- unreadable gradients
- low-contrast transparent buttons
- inconsistent button styles across the site

---

## Carousels

If carousels exist:

- They must work on desktop and mobile.
- Navigation arrows must be visible and usable.
- Mobile behavior may differ from desktop.
- Swipe behavior should be natural on touch devices.
- Avoid transparent/low-contrast carousel items.
- Avoid hidden controls.
- Avoid clipped shadows.
- Avoid layout jump during slide transitions.
- Avoid duplicated carousel implementations fighting each other.
- Remove stale carousel code if it overrides the new version.
- Test carousel width at mobile, tablet, desktop, and large desktop sizes.

Desktop carousel can be visually richer.

Mobile carousel should be simpler, readable, and touch-friendly.

---

## Cards and content blocks

Cards must:

- keep text inside boundaries
- avoid overflow
- have consistent spacing
- use readable typography
- avoid being too tall on mobile
- avoid excessive internal padding on small screens
- preserve visual hierarchy
- have clear hover states if interactive
- not rely only on color to communicate status
- align properly inside grids or carousels

---

## Typography

Typography rules:

- headings should be visually strong but not oversized on mobile
- body text should remain readable
- avoid line lengths that are too wide on desktop
- avoid tiny labels on mobile
- avoid text overflow
- use responsive font sizing where useful
- keep hierarchy clear between title, subtitle, metadata, CTA, and descriptions

---

## Colors and brightness

The site should not be too dark.

Rules:

- Use dark areas only when they improve contrast or premium feeling.
- Keep enough light/neutral surfaces for readability.
- Use gradients tastefully.
- Use accent colors consistently.
- Avoid random colors that do not match the palette.
- Warm yellow/gold hover accents are acceptable if integrated well.
- Avoid transparency that makes text hard to read.

---

## Animation rules

Animations should improve perception and usability.

Use:

- hover transitions
- active/tap feedback
- subtle entrance animations
- layout transitions
- carousel transitions
- accordion expand/collapse
- tooltip/popover transitions
- controlled glow/shine effects
- tasteful micro-interactions

Avoid:

- excessive movement
- distracting loops
- animations that hurt readability
- heavy effects that degrade performance
- animations without reduced-motion consideration

---

## CSS and styling

Rules:

- Avoid specificity wars.
- Avoid duplicated CSS.
- Avoid stale classes.
- Avoid hardcoded pixel widths unless necessary.
- Prefer fluid responsive layout.
- Prefer centralized design tokens or consistent utility patterns.
- Avoid random `!important`.
- Avoid multiple components solving the same UI problem differently.
- Keep global CSS clean.
- Verify that responsive classes are actually applied to active components.

---

## Acceptance criteria for UI work

A UI task is not complete until:

- desktop still works
- mobile is intentionally designed
- tablet is not broken
- text does not overflow
- buttons have real interaction states
- spacing is coherent
- old duplicate code is not overriding new code
- build/lint/typecheck is run where available
- changed areas are summarized clearly
