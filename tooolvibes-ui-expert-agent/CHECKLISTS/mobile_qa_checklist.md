# Mobile QA Checklist — Tooolvibes

> **Use before declaring a mobile change done.** Walk this list at the target viewport(s): **320, 375, 414**. Tablet at 768 if the surface has a tablet variant.

---

## How to use

- Open the page in Chrome / Safari devtools at each viewport.
- Tap through every primary action as a real user would.
- Check off each item. Anything unchecked is a defect to file.
- For each defect, note: location (file/line) + severity (P0–P3) + screenshot if possible.

---

## 1. Layout integrity (≤ 414 px)

- [ ] No horizontal scrollbar appears on any primary screen.
- [ ] Body width is fluid; no fixed-pixel containers force overflow.
- [ ] Sidebars (if any) are collapsed by default.
- [ ] Compare table does not overflow (use horizontal-scroll-with-shadow-hint or reflow to stacked cards).
- [ ] Editorial article images do not exceed container width.
- [ ] Floating elements (sticky CTA, cookie banner) do not obscure content on iOS safe-area.
- [ ] No element is cut off at the right edge on 320 viewport.

## 2. Touch targets

- [ ] All tap targets ≥ 44 × 44 px.
- [ ] Adjacent targets (e.g. save + compare icons on a card) have ≥ 8 px gap.
- [ ] No hover-only actions on critical user paths.
- [ ] Bottom-nav / hamburger is reachable from the thumb without stretching (within ~ 60% of screen height).

## 3. Typography & rhythm

- [ ] Body copy measures 45–75 chars per line.
- [ ] Article H2 spacing consistent across screen (no orphan/widow lines).
- [ ] Headings wrap cleanly — no word stranded on its own line.
- [ ] Line-heights render as 1.4–1.6 for body, 1.15–1.3 for headings.
- [ ] No font weight < 300 or > 700.

## 4. Color & contrast (WCAG 2.2 AA)

- [ ] Body text contrast ≥ 4.5:1.
- [ ] Large text and icon-only buttons ≥ 3:1.
- [ ] No state is communicated by color alone (pair with icon or text).
- [ ] Dark mode contrast respects AA (or light-only is opted-in explicitly).

## 5. Navigation

- [ ] Bottom-nav (or hamburger) shows primary destinations.
- [ ] Active state is unambiguous (current route indicated by accent + label).
- [ ] Back navigation works as expected (no dead ends).
- [ ] Save / Shortlist / Compare reachable without entering hover mode.
- [ ] Search opens full-screen on mobile, returns to source on close.

## 6. Forms

- [ ] Input height ≥ 44 px.
- [ ] All inputs have visible labels (no placeholder-only).
- [ ] Error messages are inline and tied to the offending field.
- [ ] Keyboard "Next" / "Done" behaves correctly (`inputmode`, `enterkeyhint` set).
- [ ] Password managers can detect password / email fields.
- [ ] Submit button shows loading state; cannot be tapped twice.

## 7. Cards

- [ ] Tool Cards stack to 1 column on phones, 2 on small tablets.
- [ ] All cards in a row have equal height.
- [ ] Tap target on a card = full card body, but inner actions are still tappable individually.
- [ ] Save button on card is reachable and unambiguous without entering a menu.
- [ ] Compare checkbox on card toggles correctly and updates a counter / sticky bar.

## 8. Modals & bottom sheets

- [ ] Use bottom sheets (not centered modals) for action menus on mobile.
- [ ] Sheet has a drag handle (or clear close action).
- [ ] Sheet respects iOS safe-area at the bottom.
- [ ] Tapping outside the sheet dismisses it.
- [ ] Focus is trapped while sheet is open; returns to trigger on close.

## 9. Loading & empty

- [ ] Skeleton placeholders match the eventual layout (no jumping content).
- [ ] Empty states have an illustration, a one-line explanation, and one CTA.
- [ ] Offline state shows a banner with retry CTA.

## 10. Performance feel

- [ ] First contentful paint < 1.5 s on mid-range Android (over 4G).
- [ ] No layout shift greater than 0.1 CLS for primary screens.
- [ ] Images lazy-load below the fold.
- [ ] Smooth scroll at 60 fps on mid-range devices (no jank when sticky CTA appears).

## 11. Gestures & iOS

- [ ] Pull-to-refresh, if used, does not conflict with native scroll.
- [ ] iOS safe-area inset respected (header top, sheet bottom, bottom-nav padding).
- [ ] No "rubber-band" backdrop issues on overscroll.
- [ ] No element uses `100vh` for full-screen UI (use `100dvh` or `min-height: 100vh` fallback).

## 12. Reachability

- [ ] Primary action on tool cards (Open / Save) reachable in ≤ 1 tap.
- [ ] Compare action reachable in ≤ 2 taps from any list.
- [ ] Account / settings reachable in ≤ 2 taps.

## 13. Accessibility

- [ ] Skip-to-content link works.
- [ ] Focus ring visible on every interactive element (mobile + Bluetooth keyboard).
- [ ] VoiceOver / TalkBack reads labels + roles correctly (validate critical screens).
- [ ] Reduced-motion preference respected (animations softened / disabled).

---

## Quick triage rules

- **3+ unchecked items in §1–§3** → file as a single P0 audit.
- **1–2 unchecked items in §1–§3** → file as 1–2 P1 audits.
- **Unchecked items in §6–§13** → file per-item, severity based on impact.
- **All checked** → ship.

---

## Reference findings templates

For each defect, copy-paste:

```md
### M-XXX — <short title>
- **Location:** <route, component, file, viewport>
- **Issue:** <one precise sentence>
- **Severity:** P0 | P1 | P2 | P3
- **Why it matters:** <impact>
- **Proposed fix:** <exact change>
- **Classification:** Figma-SoT | Figma-Reference | Code-Only | Both
- **QA check:** <single-sentence test>
```
