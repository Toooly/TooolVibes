# 03 - Known Issues

## UI problems observed historically

The project has previously shown issues such as:

- mobile layout poor or visually oversized
- sections too tall on mobile
- card lists causing endless scrolling
- fixed desktop widths breaking on smaller or larger screens
- text overflowing containers
- poor alignment between blocks
- inconsistent spacing
- weak carousel presentation
- carousel controls not reliable across devices
- buttons too static or visually basic
- UI too dark in some versions
- glass/transparency effects hurting readability
- decorative elements not used consistently
- stale CSS overriding newer work
- duplicate components or old patches still present

---

## Responsive risks

OpenCode should specifically check for:

- `width` or `min-width` hardcoded in pixels
- containers with fixed desktop max sizes but no mobile behavior
- `overflow-hidden` clipping content or shadows
- absolute-positioned decorative elements causing horizontal scroll
- carousels exceeding viewport width
- cards with too much padding on small screens
- grid layouts without proper breakpoints
- long text without wrapping rules
- buttons or links too small for touch
- hidden navigation states on mobile

---

## Technical risks

Potential technical risks:

- multiple AI sessions may have created duplicate components
- old CSS may override new CSS
- some fixes may be patched locally instead of solved systemically
- some components may exist but not be imported anywhere
- current visible UI may be controlled by a different component than expected
- package dependencies may have been added inconsistently
- deployment configuration may not match local dev assumptions
- environment variables may be host-specific
- build may pass locally but fail on serverless hosts if filesystem assumptions exist

---

## Before fixing a visual issue

Always inspect:

- active page/route
- component imports
- component actually rendered
- global CSS
- module CSS
- utility classes
- duplicated components
- old unused files
- wrappers and containers
- parent layout constraints
- breakpoints
- active build target

Do not assume the problem is inside the visible component only. Parent containers often cause layout bugs.

---

## Before fixing deployment issues

Always inspect:

- package scripts
- framework config
- adapter/output mode
- environment variables
- host-specific limitations
- serverless filesystem usage
- API routes
- runtime assumptions
- custom domain settings
- Cloudflare/Vercel/Netlify differences

---

## Known user expectation

When the user asks to fix a specific section, do not change unrelated sections.

When the user asks for a full UI refactor, improve the overall system while preserving working features.

When the user says something is already good on desktop, do not ruin desktop while fixing mobile.
