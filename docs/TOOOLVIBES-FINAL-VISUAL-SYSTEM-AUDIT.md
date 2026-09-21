# TooolVibes final visual system audit

Date: 22 September 2026  
Base: `1fab558` (deployed production pass)  
This pass: visual unification only. Not deployed.

## A. Visual problems found

- Home TOOL / STACK / RADAR tabs were inline-flex pills, so widths drifted and the active state was only an inset ring.
- Cards (catalog, stack, partner, auth, saved rows) used different radii and border opacities.
- Glow existed as leftover tokens but was not a shared hierarchy.
- Footer spacing was still a full section rhythm, so the close of the page felt like another page.
- Auth card used a personal-grammar inset bar that did not match the public night surface.
- Magic-link email was on-brand but flatter than the product: no framed fallback URL, weak hierarchy.
- Stack mode repeated “ordine, esito, tempo e costo” above cards that already show those facts.
- Motion was route-specific, not one 180 / 320ms language with reduced-motion.

Architecture, CompareDock, safe-area, TinyAdz collapse, and OAuth gating were left alone.

## B. Design tokens created / refined

Added in `styles/visual-system.css` (loaded after `visual-character.css`):

- `--tv-glow-gold`
- `--tv-glow-cyan`
- `--tv-glow-violet`
- `--tv-border-system`
- `--tv-radius-system` (16px)
- `--tv-motion-ui` (180ms)
- `--tv-motion-panel` (320ms)

Existing `--tv-space-*` scale was already canonical (4–64). This pass did not invent a second spacing scale.

## C. Components consolidated

No new React primitives. One late CSS layer now shares treatment across:

- Home tabs
- Workflow / catalog / partner / auth / saved-row cards
- Primary CTAs (editorial, tool detail)
- Radar launch rows
- Workspace switch (`.tv-space-switch`)
- Active mobile nav glyph

## D. Copy removed

- Home STACK lede: “Stack già montati: ordine, esito, tempo e costo.”
- Email kept the decision-specific sentence. Concept slogans such as “Better tools. Brighter builders.” were not copied.

## E. Spacing normalized

- Home tabs: 6px grid gap, equal columns, 22.5rem track.
- Footer utility shell gap tightened to 1.25rem. Nav/tray reservation padding was not removed.
- Auth card padding set to 1.5rem / 1.25rem.
- Radar row alignment uses the existing grid; metrics stay tabular.

## F. Typography changes

No new font. Display stays on ranks/headlines. UI sans stays on tabs and body. Radar ranks/metrics use tabular numbers. Uppercase limited to existing footer kickers, with tracking reduced to 0.08em.

## G. Glow / motion system

- TOOL active tab: gold glow
- STACK active tab: violet glow
- RADAR active tab: cyan glow
- Primary CTA hover/focus: gold glow
- Card hover: 1px lift, only for fine pointers
- Panel change: 320ms fade/translate
- `prefers-reduced-motion: reduce` disables those transitions

Glow is not applied to every card.

## H. Mobile before / after

Before: production `1fab558` (deployed). Tabs unequal, inset-only active state, looser footer.

After, captured locally (not committed):

- `artifacts/visual-system-2026-09-22/390-home.png`
- `artifacts/visual-system-2026-09-22/390-catalog.png`
- `artifacts/visual-system-2026-09-22/390-tool.png`
- `artifacts/visual-system-2026-09-22/390-guide.png`
- `artifacts/visual-system-2026-09-22/390-auth.png`
- `artifacts/visual-system-2026-09-22/390-collections.png`
- `artifacts/visual-system-2026-09-22/430-home.png`

Cream guide reading surface is unchanged on purpose. The concept boards also use a light reading column.

## I. Desktop before / after

- `artifacts/visual-system-2026-09-22/768-home.png`
- `artifacts/visual-system-2026-09-22/1280-home.png`
- `artifacts/visual-system-2026-09-22/1440-home.png`
- `artifacts/visual-system-2026-09-22/1440-catalog.png`
- `artifacts/visual-system-2026-09-22/1440-auth.png`

Desktop is the same system, not a restacked mobile layout. Max widths already owned by route CSS were not widened into a new grid.

## J. Auth / email visual changes

- Auth card: 20px radius, night raised surface, violet edge glow. Provider buttons still render only when GoTrue enables them.
- Live magic-link HTML (`lib/auth/magic-link-email.ts`) and `supabase/templates/magic-link.html` now share a framed night card, gold `#c9a227` CTA, security line, and bordered fallback URL. No copy-to-clipboard control (email clients cannot run it). Dashboard paste is still required for the native mailer. Resend uses the live module.

## K. Logged-in visual changes

`.tv-space-switch .is-current` and `.tv-lib-row` pick up the same radius/glow. No dashboard modules added. Decision sheet behavior was not rewritten.

## L. Remaining visual issues

- Route CSS still owns most padding. This pass unifies the visible grammar; it does not delete every historical rule.
- Guide cream column is intentional and still a semantic shift from the night canvas.
- Footer columns are calmer, not a new information architecture.
- Logged-in screens were not re-shot in a real session (local GoTrue down).
- Concept-board headlines were not adopted. Product headline stays “Scegli il tool giusto. Ricorda perché.”

## M. Screenshots

Local only: `artifacts/visual-system-2026-09-22/`. Not committed.

## N. Final commit SHA

`28a6a195a118b5976d2c13d9f0a766ceb7dffccc`
