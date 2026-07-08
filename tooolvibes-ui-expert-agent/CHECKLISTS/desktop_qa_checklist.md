# Desktop QA Checklist — Tooolvibes

> **Use before declaring a desktop change done.** Walk this list at the target viewport(s): **1024, 1280, 1440, 1920**.

---

## How to use

- Resize to each viewport; record any visual defects with screenshot.
- Test keyboard navigation end-to-end on the affected page.
- Test sticky / scroll-locked behavior thoroughly — desktop bugs hide in sticky elements.

---

## 1. Layout integrity (≥ 1024 px)

- [ ] Content respects max-width (recommend 1280); center-aligned on wider viewports.
- [ ] No content stranded in the gutter at 1440+.
- [ ] Sidebars collapse appropriately as viewport narrows toward 1024.
- [ ] Sticky filter rail / sidebar does not overlap content.
- [ ] Hero blocks reflow to 2-col ≥ 1024 and 3-col ≥ 1280 (no awkward single-col at wide).
- [ ] Compare table is fully visible (no horizontal scroll at 1280).

## 2. Sticky & scroll behavior

- [ ] Sticky filter rail on discovery pages stays at top through scroll, does not overlap header.
- [ ] Compare table sticky first column + sticky header work together cleanly.
- [ ] Editorial article reading-progress bar does not jitter on scroll.
- [ ] Sticky add-to-shortlist CTA on detail pages does not obscure content / footer.

## 3. Typography & rhythm

- [ ] Body copy line length 60–75 chars (i.e. ~ 720px column at 1280 viewport).
- [ ] Article body uses a comfortable measure (typographic columns count).
- [ ] Display headlines (`h1`, hero) do not stretch wider than 720px on the article / detail template.
- [ ] Headings consistent across pages (e.g. all `h2` use same family, weight, scale).
- [ ] Link styles in body copy differ from nav links (clear hierarchy).

## 4. Color & contrast (WCAG 2.2 AA)

- [ ] Body text contrast ≥ 4.5:1.
- [ ] Card titles vs. muted-meta text have ≥ 3:1 difference.
- [ ] Active nav indicator clearly visible.
- [ ] Hover states clearly differentiate primary vs. secondary actions.
- [ ] Focus ring contrast meets AA against any background it lands on.

## 5. Navigation

- [ ] Top nav fits at 1024 without horizontal scroll.
- [ ] Active route indicated (e.g. underline + label, or filled icon).
- [ ] Dropdowns open on hover, close on click-out / ESC.
- [ ] Mega-menus (if any) align to column grid; do not drift.
- [ ] Search opens inline (not full-screen) on desktop.

## 6. Cards

- [ ] Card rows have consistent gutters (recommend 24px).
- [ ] All cards in a row have equal height.
- [ ] Hover affordance is subtle (≤ 2px translate, ≤ 4% lift, ≤ 200ms ease-out).
- [ ] Card selection state clearly distinct from hover.
- [ ] Save state on a card shown as filled bookmark + "Saved" label, not icon-only.
- [ ] Compare checkbox on card toggles correctly and updates a sticky bar.

## 7. Compare & shortlist

- [ ] Compare table renders 2–4 tools side-by-side without overflow at 1280.
- [ ] Compare dimensions are curated (≤ 6), not a feature dump.
- [ ] Add/remove tool on compare page works without reload.
- [ ] Shortlist at desktop has a 2-col layout (list + sticky summary or filter).
- [ ] "Compare from Shortlist" CTA appears from ≥ 2 saved tools.

## 8. Forms

- [ ] Inputs ≥ 36 px tall on desktop (44 on touch laptops).
- [ ] All inputs have visible labels (not placeholder-only).
- [ ] Errors are inline + accessible.
- [ ] Submit buttons show loading state.
- [ ] Form fields support autofill (`autocomplete` attributes correct).

## 9. Modals & popovers

- [ ] Modals centered, max-width 480–640, respects safe-area.
- [ ] Click outside dismisses; ESC closes.
- [ ] Focus trapped; returns to trigger on close.
- [ ] No modals used where a side panel would be better (e.g. tooltips, settings).

## 10. Hover, focus, animation

- [ ] Hover states visible on all interactive surfaces.
- [ ] Focus ring visible on every interactive element after Tab.
- [ ] No motion continues indefinitely (e.g. infinite bouncy CTAs).
- [ ] Reduced-motion preference respected.

## 11. Performance feel

- [ ] No jank when scrolling long editorial pages.
- [ ] Hover lift animations run at 60 fps.
- [ ] Sticky elements do not trigger layout reflow on scroll.
- [ ] Lazy-loaded sections (editorial, compare columns) load within 250ms of entering viewport.

## 12. Trust & conversion

- [ ] "Last reviewed on <date>" visible on every tool detail page.
- [ ] Reviewer byline + avatar visible on editorial and detail surfaces.
- [ ] "Why we recommend" block exists on detail pages.
- [ ] Affiliate disclosure appears *before* any affiliate CTA.
- [ ] Saving a tool triggers optimistic UI update.

## 13. Editorial quality

- [ ] Articles have author byline + role + avatar.
- [ ] Citations / footnotes have a designed style.
- [ ] Hero image is consistent in ratio across articles (recommend 16:9 or 3:2).
- [ ] In-text links differ from navigation links.

## 14. Accessibility (keyboard)

- [ ] Tab order is logical: nav → filters → content → footer.
- [ ] Skip-to-content link works.
- [ ] Landmarks (`header`, `main`, `nav`, `aside`, `footer`) present.
- [ ] Modal close buttons reachable via keyboard + announce role.
- [ ] Sidebar collapse / restore works via keyboard.

## 15. Wide viewports (≥ 1440)

- [ ] No content stranded in extreme whitespace.
- [ ] Hero typography scales proportionally (not a fixed pixel size that looks tiny on 1920).
- [ ] Card row max-width respected (no 8 cards in a single 1920px row).
- [ ] Sticky rail widths adjust proportionally.

---

## Quick triage rules

- **3+ unchecked items in §1–§5** → P0 audit.
- **1–2 unchecked items in §1–§5** → P1 audits.
- **Unchecked in §6–§15** → per-item, severity by impact.

---

## Reference findings templates

For each defect, copy-paste:

```md
### D-XXX — <short title>
- **Location:** <route, component, file, viewport>
- **Issue:** <one precise sentence>
- **Severity:** P0 | P1 | P2 | P3
- **Why it matters:** <impact>
- **Proposed fix:** <exact change>
- **Classification:** Figma-SoT | Figma-Reference | Code-Only | Both
- **QA check:** <single-sentence test>
```
