# UI Audit Framework — Tooolvibes

> **Use this whenever the agent runs any audit prompt.** Defines how the agent inspects, scores, classifies, and reports. Bind this to every audit pass.

---

## A. Operating model

The agent's job is to **transform subjective "this looks off" into measurable, fixable, prioritized findings**. Three principles:

1. **What a human can observe.** Every finding must be observable by a human with a browser and 2 minutes.
2. **What a developer can fix.** Every finding must map to a single edit or a small cluster of edits.
3. **What a designer can reproduce.** Every P0/P1 finding must be expressible in Figma or as a 1-paragraph copy change.

---

## B. Severity model (binding)

| Tag  | Definition                                                                                          | Decision rule                                                              | SLA target  |
| ---- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------- |
| P0   | **Blocking.** Layout broken, content unreadable, navigation impossible, severe accessibility fail.   | If a real user would hit this in their first 30 seconds, it is P0.        | Fix today.  |
| P1   | **Major.** Product clarity, trust, hierarchy, or conversion is compromised.                         | If a real user would hesitate, scroll past, or distrust, it is P1.         | Fix ≤ 1 wk. |
| P2   | **Polish.** Inconsistency or rough edge that does not block the user but hurts the brand.           | If a designer notices in 5 seconds, it is at least P2.                     | Fix ≤ 1 mo. |
| P3   | **Nice-to-have.** Improvement that elevates craft but is not felt as a defect.                      | "Worth doing"; user does not notice the absence.                           | Backlog.    |

---

## C. Audit axes (every audit must cover these)

Each axis lists *what to look at* and *the bar to meet*. The agent inspects in this order.

### 1. Product clarity
- The job-to-be-done of every screen is visible in ≤ 5 seconds.
- Headlines are statements, not labels.
- Empty states explain what goes here + how to populate.
- "Next action" is obvious on every tool card and detail page.

### 2. Visual hierarchy
- One primary action per viewport.
- The biggest element is the one that matters.
- Type scale follows a clear ratio (recommend 1.25 or 1.333).
- Section breaks use whitespace, not lines or boxes.

### 3. Layout & grid
- Desktop: 12-col grid with consistent gutters (default 24px) and max-width (default 1280).
- Mobile: 4-col grid with 16–20px gutters.
- Vertical rhythm: every vertical spacing unit is from the type/rhythm scale.
- Sidebar patterns (compare, account) align to the same columns as content blocks.

### 4. Spacing
- Spacing scale (default 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96).
- Cards have ≥ 24px internal padding.
- Sections have ≥ 64px vertical breathing on desktop, ≥ 40px on mobile.
- Never use ad-hoc values like 17px, 23px, 27px.

### 5. Typography
- One UI family, one editorial display family (or one family with weights).
- Three sizes per viewport: caption / body / heading + at most two display sizes.
- Line-height: 1.5 for body, 1.2 for headings, 1.7 for editorial articles.
- No font weight below 300 or above 700 in production.
- No italic body copy. Italics for editorial accent only.

### 6. Color
- Background, surface, ink, muted ink, accent, success, warning, danger. (8 max.)
- Accent is one color with three roles: primary / hover / pressed.
- No gradients on functional UI (allowed on hero / editorial moments only).
- Contrast ≥ 4.5:1 for body, ≥ 3:1 for large text and icon-only buttons. (WCAG AA.)

### 7. Radius
- One scale: sm / md / lg / pill (e.g. 6 / 10 / 16 / 999).
- All cards = same radius (recommend md).
- All buttons = same radius (recommend pill for CTAs, md for secondary).
- Avatars / icons / chips may use sm.

### 8. Shadow / elevation
- 2 named levels: "rest" (subtle) and "raised" (overlay).
- Optional 1 "modal" level.
- No stacked borders + shadows; pick one.
- No shadows on dark backgrounds; use border or background lift instead.

### 9. Buttons
- Primary / secondary / ghost / destructive. That's it.
- Primary: solid accent. Secondary: bordered surface. Ghost: text only.
- Disabled: 50% opacity + cursor not-allowed. Never a different color.
- Min height 36 (mobile 44).
- Icon-only buttons need `aria-label`.

### 10. Badges
- Default badge = small pill, neutral surface, ink text.
- Variants: neutral, accent, success, warning, danger, info.
- Never use a badge as the *only* state indicator (must pair with text or icon).

### 11. Cards (Tool Card spec — most important)
- Cover (or none), title, one-line pitch, 2–3 meta chips, primary action.
- Always same height in a row.
- Title weight ≥ 500. Pitch weight 400, size body, muted ink.
- Primary CTA explicit ("Open", "Compare", "Save"). No ambiguous icons.
- Hover state: subtle lift (≤ 2px) + border accent at most.

### 12. Navigation
- Top nav: home, discover, editorial, shortlist (badge with count), account.
- Mobile: hamburger → full-screen sheet, or bottom-bar (recommend for app-feel).
- Breadcrumbs on detail and editorial pages.
- Skip-to-content link is mandatory (accessibility).

### 13. Forms
- Labels above inputs (not placeholders).
- Helper text under inputs.
- Errors: red text + icon + input border. Inline, not toast.
- Inputs ≥ 44px tall on mobile.
- Auth inputs: explicit labels (no placeholder-only).

### 14. Empty states
- Centered illustration (or styled block), one sentence, one CTA.
- Never just "No data".

### 15. Loading states
- Skeletons for content cards. Never spinners on list areas.
- Spinners OK for single-row actions (e.g. submit form).
- Top-of-route progress indicator on slow navigations.

### 16. Error states
- Inline form errors are red, with the offending value highlighted.
- Route-level errors have a recovery CTA ("Try again", "Go home").
- Never raw `Error: undefined` text. Always friendly.

### 17. Hover / selected / saved states
- Hover: subtle (≤ 2px translate, ≤ 4% background lift).
- Selected: accent border or background tint.
- Saved: filled bookmark icon + "Saved" label toggle, never icon-only.
- All state changes ≤ 150ms, ease-out.

### 18. Mobile UX
- Target sizes ≥ 44×44px.
- No horizontal scroll on any primary screen.
- Save/compare actions reachable on tool cards without hover.
- Bottom-nav recommended for primary destinations.
- Compare and detail page: support portrait, but show "best on desktop" tip.

### 19. Desktop UX
- Use horizontal real estate — do not center tiny cards.
- Sticky filter rail on discovery pages.
- Compare table: sticky header + sticky first column.
- Detail page: 2-column (content + sidebar) ≥ 1024px.

### 20. Accessibility
- WCAG 2.2 AA target on contrast, target size, focus visibility.
- Visible focus ring everywhere (custom but explicit).
- Semantic landmarks (`header`, `main`, `nav`, `aside`, `footer`).
- Skip-to-content link.
- Modals: focus trap + ESC close + return focus.
- Decorative `aria-hidden`, meaningful `alt` text.

### 21. Trust & conversion
- Trust signals visible on every paid/recommended tool: last reviewed, reviewer, citations.
- Affiliate disclosure "We may earn a commission" placed *before* the affiliate CTA, not after.
- "Why we recommend" panel on editorial / detail pages.
- No fake counts ("12,453 saved") unless actually tracked.

### 22. Editorial quality
- Articles have a real author byline + avatar + role.
- Article hero is consistent in image-to-text ratio.
- In-text links are differentiated from navigation.
- Citations / footnotes have a visible design.
- Article card on listing pages distinguishes long-form from short-form.

### 23. Comparison / shortlist quality
- Compare default shows 2–3 tools across ≤ 6 curated dimensions (not 30 micro-specs).
- Each tool column has logo, name, "best for", key actions (open / remove).
- Shortlist persists across sessions; sync on login.
- "Compare 2 tools in Shortlist" CTA appears from ≥ 2 saved tools.

### 24. Design system consistency
- Tokens (color, type, space, radius, shadow) live in one place.
- Primitives (Button, Badge, Input, Card, Modal, Sheet, Tooltip) live in one folder.
- Components are imported, never inlined.
- No file imports CSS from a sibling component.

---

## D. Standard output format (binding for every audit)

Use this skeleton **without exception**:

```md
# Tooolvibes UI Audit — <scope> (<date>)

> Mode: AUDIT (read-only). Confidence: HIGH | MEDIUM | LOW.

## Scope
- Surface(s) audited:
- Viewport(s) audited:
- Round:
- Auditor: Tooolvibes UI Expert Agent v1.0
- Working directory:

## Reading plan (reproducibility)
1. <file or route to read>
2. <grep command to run>
3. <screen to open at viewport X>
…
(n ≤ 8)

## Inventory snapshot
- Routes seen:
- Components in use:
- Tokens declared / used:
- Stack inferred:
- Tooling available (browser, screenshots, lint, build):

## Executive summary
- 3 top P0s:
- 3 top P1s:
- Design-system gaps:
- Estimated effort bands (S / M / L):
- Finding density flag (see §D-bis) — fill this in if true.

## Findings

### [N] <short title>
- **Location:** <route, component, file:line, viewport (e.g. 375 / 1280)>
- **Evidence:** <file:line, grep result, DOM observation, or screenshot ref>
- **Issue:** <one precise sentence describing what is wrong>
- **Severity:** P0 | P1 | P2 | P3
- **Why it matters:** <direct user/business impact>
- **Proposed fix:** <exact CSS / component / copy / Figma change; "replace … with …" when possible>
- **Classification:** Figma-SoT | Figma-Reference | Code-Only | Both
- **Effort:** S | M | L
- **QA check:** <single-sentence manual or automated test, including viewport>

(… repeat for every finding …)

## Findings by surface
- Global:
- Tool Discovery:
- Tool Detail:
- Compare:
- Shortlist:
- Editorial:
- Forms / States:
- Mobile:
- Desktop:
- Accessibility:
- Design System:
- Conversion & Trust:

## Recommendations
1. Top 3 P0s to fix this week (smallest S/M patches first).
2. Top 3 P1s to fix this sprint.
3. Top 3 P2s to bundle into a polish pass.
4. Figma backlog (ordered: tokens → primitives → hero pages).
5. Open questions for the human.
6. Assumptions made (only if any; one line each).
```

### D-bis. Finding density rule (binding)

If **≥ 30%** of findings point to the same component, file, or area, surface it explicitly at the top of the executive summary with the label `FINDING DENSITY`:

```md
> FINDING DENSITY: N of M findings (≈ X%) point at `<file:line or component>`. This is a system-level issue, not a fix list. Recommend a `<P?>` upstream token / primitive / pattern fix before patching downstream cases individually.
```

This converts 8 small findings into one architectural fix and prevents the same surface area being audited over and over.

---

## E. Anti-vagueness checklist (run on every audit pass before submitting)

For each finding, verify:

- [ ] Mentions a concrete element (component name, class name, CSS variable, route).
- [ ] Anchored in evidence (file:line, grep, screenshot ref).
- [ ] Includes a number, ratio, or pixel value when the issue is dimensional.
- [ ] Fix is a "replace X with Y" pattern (CSS, component, copy, Figma element).
- [ ] QA check names a viewport and a concrete manual or test command.
- [ ] Could a junior engineer ship the fix in ≤ 30 minutes using only the finding itself?

If any answer is "no," the finding is not ready. Rewrite or drop it.

---

## F. Scoring rubric (use for aggregated reports)

If the human asks for a numeric score (or in `PROMPTS/07_final_ui_closure_pass.md`):

| Axis                   | Weight | 0–3 score                                                          |
| ---------------------- | -----: | ------------------------------------------------------------------ |
| Product clarity        |     20 | 0 broken, 1 confused, 2 clear-ish, 3 unmistakable                 |
| Visual hierarchy       |     10 | 0 chaotic, 1 muddy, 2 mostly ranked, 3 one obvious primary        |
| Layout & grid          |      5 | 0 chaos, 1 drift, 2 mostly consistent, 3 perfect rhythm            |
| Typography             |      5 | 0 unreadable, 1 default, 2 hierarchy OK, 3 distinctive + readable  |
| Color                  |      5 | 0 unusable, 1 inconsistent, 2 mostly consistent, 3 intentional     |
| Components consistency |     10 | 0 divergent, 1 drifty, 2 mostly consistent, 3 one of each          |
| States coverage        |      5 | 0 missing, 1 partial, 2 most covered, 3 complete                   |
| Mobile UX              |     10 | 0 broken, 1 cramped, 2 workable, 3 native-quality                  |
| Accessibility          |     10 | 0 AA failures, 1 borderline, 2 mostly passes, 3 clean               |
| Trust & conversion     |     10 | 0 manipulative or absent, 1 minimal, 2 present, 3 first-class       |
| Editorial quality      |      5 | 0 spammy, 1 generic, 2 decent, 3 distinctive                       |
| Design system rigor    |      5 | 0 inline styles, 1 partial tokens, 2 most things tokenized, 3 full |

Total max: 100. A passing score for v1.0 closure: **≥ 75**. A category-defining score: **≥ 88**.

When computing the score, also report **count of open P0/P1** alongside the numeric. A score of 75 with 12 open P0s is *not* a pass.

---

## G. What the agent must NEVER do in an audit

- Do not invent issues that are not visible on the rendered page or in the codebase.
- Do not propose a new framework or dependency.
- Do not skip the executive summary.
- Do not produce findings without an Evidence and QA check.
- Do not classify everything as Figma-SoT. Reserve that for tokens and primitives.
- Do not duplicate the same finding under multiple surfaces; cite once, reference elsewhere.
- Do not write or modify code in AUDIT mode. Suggestions only.

---

## H. After each audit

1. Save the report to `audits/<surface>_<round>_<date>.md`.
2. Surface top 3 P0s in the user channel.
3. Apply the §E anti-vagueness checklist before delivering — if any check fails, rewrite or drop the offending finding.
4. If 3+ design-system issues are open, recommend running `PROMPTS/04_component_system_audit.md` next.
5. If mobile-only issues are open, recommend running `PROMPTS/02_mobile_audit.md`.
6. If `FINDING DENSITY` triggered, surface it as a separate P1 token/primitive workstream, not as N small fixes.
7. Recommend loading `CHECKLISTS/` corresponding to viewport + scope.
8. Record assumptions made in §10 of `TOOOLVIBES_PRODUCT_CONTEXT.md` if any new assumption surfaced during the audit.
