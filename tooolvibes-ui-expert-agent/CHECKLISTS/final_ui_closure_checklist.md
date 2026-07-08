# Final UI Closure Checklist — Tooolvibes

> **Use when declaring a UI milestone complete.** Every item here is a gate. Anything unchecked blocks closure.

---

## How to use

- Walk this list top to bottom.
- Mark each item ✅ pass, ❌ fail, ⚠️ partial.
- A pass is verifiable on the rendered page at the target viewports.
- Failures are filed as P0/P1 findings — closure does not happen while any P0/P1 is open.

---

## 1. Coverage

- [ ] Every primary route audited at mobile (375) and desktop (1280).
- [ ] Tablet (768) covered where the surface has a tablet variant.
- [ ] Wide (≥ 1440) sanity-checked.
- [ ] Open audit backlog contains only P2 / P3 items.

## 2. Design system

### Tokens
- [ ] Color tokens declared in one place.
- [ ] Typography tokens declared in one place.
- [ ] Spacing tokens declared in one place.
- [ ] Radius tokens declared in one place.
- [ ] Elevation tokens declared in one place.
- [ ] Motion tokens declared in one place.
- [ ] No drift between declared and used.
- [ ] No raw hex / px values inline in components.

### Primitives
- [ ] Button has one canonical source (and only one).
- [ ] Badge / chip has one canonical source.
- [ ] Card has one canonical source per type (Tool, Editorial, Offer).
- [ ] Input has one canonical source.
- [ ] Modal has one canonical source.
- [ ] BottomSheet has one canonical source.
- [ ] Tooltip, Toast, Tabs each have one canonical source.

### Composites
- [ ] Tool Card is composed of primitives.
- [ ] Editorial Card is composed of primitives.
- [ ] Compare row is composed of primitives.
- [ ] Header / nav is composed of primitives.

## 3. Figma handoff

- [ ] Every Figma-SoT primitive is built and signed off.
- [ ] Every Figma-SoT hero page is built and signed off.
- [ ] Every Figma-SoT primitive has a handoff artifact.
- [ ] Figma-Reference snapshots regenerated for shipped pages.
- [ ] Drift between Figma-SoT and shipped output is ≤ minor for hero pages.

## 4. Visual hierarchy & layout

- [ ] One obvious primary action per primary screen.
- [ ] Type hierarchy clear without relying on color.
- [ ] Spacing follows the declared scale (no ad-hoc values).
- [ ] Section rhythm consistent (vertical spacing follows pattern).
- [ ] Cards have equal heights within rows.
- [ ] Hero blocks reflow correctly across mobile / desktop.

## 5. Typography

- [ ] UI family + display family locked.
- [ ] Size scale declared and used everywhere.
- [ ] Line-heights within 1.4–1.6 for body, 1.15–1.3 for headings.
- [ ] Body line length 45–75 chars mobile, 60–75 desktop.
- [ ] No font weight < 300 or > 700 in production.

## 6. Color

- [ ] Identity = monotone + one accent.
- [ ] All interactive elements have hover / focus / pressed states.
- [ ] States not signaled by color alone (icon or text always paired).
- [ ] Dark + light coverage both pass AA contrast (or theme scope is locked).

## 7. Components

### Buttons
- [ ] Primary / secondary / ghost / destructive only.
- [ ] Disabled state consistent.
- [ ] Loading state present and consistent.
- [ ] Min height ≥ 36 (desktop) / ≥ 44 (mobile).
- [ ] Icon-only buttons have aria-label.

### Badges
- [ ] Variants: neutral / accent / success / warning / danger / info.
- [ ] Pair with text or icon (color-alone forbidden).
- [ ] Sizes consistent.

### Cards
- [ ] Tool Card has ≤ 6 elements.
- [ ] Save + Compare actions reachable on mobile without hover.
- [ ] Hover lift ≤ 2px translate, ≤ 4% background lift.

### Inputs
- [ ] Visible labels above inputs (not placeholder-only).
- [ ] Helper text + inline errors.
- [ ] Input height ≥ 44 (mobile) / ≥ 36 (desktop).
- [ ] Correct `inputmode`, `enterkeyhint`, `autocomplete`.

## 8. States

### Empty
- [ ] Every list / system has an empty state with illustration + line + CTA.
- [ ] Empty shortlist / compare surfaces help the user populate.

### Loading
- [ ] Skeletons match eventual layout.
- [ ] Single-row actions can use spinners.
- [ ] Top-of-route progress shown for slow navigations.

### Error
- [ ] Inline errors tied to offending field.
- [ ] Route-level errors have a recovery CTA.
- [ ] Friendly language (no `Error: undefined`).

### Hover / selected / saved
- [ ] Hover transitions ≤ 150ms ease-out.
- [ ] Selected state distinct from hover.
- [ ] Saved state shows "Saved" label, not icon-only.

## 9. Navigation

- [ ] Skip-to-content link present and working.
- [ ] Primary nav covers home, discover, editorial, shortlist (with count), account.
- [ ] Active route is unambiguous.
- [ ] Mobile uses hamburger / bottom-nav intentionally (not both).
- [ ] Breadcrumbs on detail and editorial pages.

## 10. Compare & shortlist

- [ ] Compare shows 2–4 tools across ≤ 6 curated dimensions by default.
- [ ] Compare row labels sticky on desktop.
- [ ] Add / remove tools on compare without full reload.
- [ ] Shortlist persists across sessions; syncs on login.
- [ ] "Compare from Shortlist" CTA appears from ≥ 2 saved tools.

## 11. Trust & conversion

- [ ] "Last reviewed on <date>" visible on every tool detail page.
- [ ] Reviewer byline + avatar on editorial and detail surfaces.
- [ ] "Why we recommend" panel on detail.
- [ ] Affiliate disclosure appears *before* affiliate CTA.
- [ ] No fake counts / fake urgency ("12,453 saved", "3 people viewing").
- [ ] Save action triggers optimistic UI.

## 12. Editorial quality

- [ ] Articles have author byline + role + avatar.
- [ ] Citations / footnotes designed and visible.
- [ ] Hero image ratio consistent across articles.
- [ ] Article card distinguishes long-form from short-form.
- [ ] Reading-progress indicator (P2/P3, OK if absent).

## 13. Mobile UX

- [ ] All items in `CHECKLISTS/mobile_qa_checklist.md` pass.

## 14. Desktop UX

- [ ] All items in `CHECKLISTS/desktop_qa_checklist.md` pass.

## 15. Accessibility (WCAG 2.2 AA)

- [ ] Contrast ≥ 4.5:1 (body) / ≥ 3:1 (large text, icons).
- [ ] Focus rings visible on every interactive element.
- [ ] All interactive elements reachable via keyboard.
- [ ] Tab order logical: nav → filters → content → footer.
- [ ] Modals focus-trap and return focus on close.
- [ ] Skip-to-content link works.
- [ ] ARIA roles correct on landmarks.
- [ ] Reduced-motion preference respected.
- [ ] VoiceOver / TalkBack tested on primary flows (where feasible).

## 16. Performance feel

- [ ] First contentful paint ≤ 1.5s on mid-range Android (4G).
- [ ] CLS ≤ 0.1 for primary screens.
- [ ] Images lazy-loaded below the fold.
- [ ] No jank on scroll of long editorial pages.
- [ ] Hover lift animations at 60 fps.

## 17. Documentation

- [ ] Audit reports archived in `audits/`.
- [ ] `TOOOLVIBES_PRODUCT_CONTEXT.md` updated if brand decisions changed.
- [ ] Figma handoff artifacts archived.
- [ ] Open P2 / P3 backlog published.

---

## Sign-off line

Final UI closure for milestone `<name>`:

> **Tooolvibes UI closure: PASS** — only P2 / P3 items remain open. List: <link>.
>
> **Tooolvibes UI closure: NOT PASS** — outstanding P0: <count>, P1: <count>. List: <link>.

The sign-off line is the only line that should appear in the release note. Everything else is supporting evidence.
