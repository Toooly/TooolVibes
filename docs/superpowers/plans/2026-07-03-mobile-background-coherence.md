# Mobile Background Coherence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify TooolVibes mobile section backgrounds to a single dark foundation (`#06060E`), eliminate patchwork/banding in Radar and Tool Battle, keep Categories as the light reference, and reduce decorative noise while preserving identity.

**Architecture:** Mobile-only CSS variables defined inside `@media (max-width: 767px)` drive the new background tokens. Existing section-specific CSS rules are updated to use those tokens instead of ad-hoc gradients and `!important` overrides. Component-level hard-coded backgrounds are aligned. Desktop is untouched.

**Tech Stack:** Next.js, Tailwind CSS, CSS custom properties, React TSX.

---

## Files that will change

| File | Responsibility |
|------|----------------|
| `app/globals.css` | New mobile tokens; background/coherence fixes for Radar, Shortlist/Compare, Collections, Method, Categories. |
| `styles/radar.css` | Radar-specific mobile background and sheet color fixes. |
| `styles/vibes-3d-maestoso.css` | Home discovery stage mobile background continuity. |
| `components/radar/mobile-radar-view.tsx` | Inline root background color update. |

---

## Task 1: Add mobile-only background tokens

**Files:**
- Modify: `app/globals.css`

Add the shared tokens at the top of the existing `@media (max-width: 767px)` block, before any section rules.

- [ ] **Step 1: Open `app/globals.css` and locate the mobile breakpoint start**

Use search for `@media (max-width: 767px) {` near line 14300.

- [ ] **Step 2: Insert the token block immediately after the opening brace**

```css
@media (max-width: 767px) {
  /* ── Mobile background coherence tokens ── */
  :root {
    --mobile-bg-void: #06060E;
    --mobile-bg-section: #06060E;
    --mobile-bg-section-soft: radial-gradient(circle at 50% 0%, rgba(106, 60, 255, 0.03), transparent 50%);
    --mobile-bg-card: rgba(255, 255, 255, 0.05);
    --mobile-border-subtle: rgba(255, 255, 255, 0.08);
    --mobile-text-primary: #ffffff;
    --mobile-text-secondary: rgba(255, 255, 255, 0.72);
  }
```

- [ ] **Step 3: Save and run lint**

Run: `npm run lint`
Expected: 0 new errors (15 pre-existing warnings are acceptable).

---

## Task 2: Radar — unify page and canvas backgrounds

**Files:**
- Modify: `components/radar/mobile-radar-view.tsx`
- Modify: `styles/radar.css`
- Modify: `app/globals.css`

- [ ] **Step 1: Change inline root background in the component**

In `components/radar/mobile-radar-view.tsx` around line 470:

```tsx
// BEFORE
<div className="mobile-radar-view relative min-h-screen overflow-hidden bg-[#0a0a1a]">

// AFTER
<div className="mobile-radar-view relative min-h-screen overflow-hidden">
```

The background will now come from CSS, where the mobile token is applied.

- [ ] **Step 2: Align canvas gradient stops with the unified dark base**

In `components/radar/mobile-radar-view.tsx` around line 286:

```tsx
// BEFORE
bgGrad.addColorStop(0, "#0a0a1a");
bgGrad.addColorStop(0.7, "#070714");
bgGrad.addColorStop(1, "#06060E");

// AFTER
bgGrad.addColorStop(0, "#0d0d18");
bgGrad.addColorStop(0.7, "#090914");
bgGrad.addColorStop(1, "#06060E");
```

This keeps the radar vignette but removes the jump from `#0a0a1a` page to `#06060E`.

- [ ] **Step 3: Update `.mobile-radar-view` in `styles/radar.css`**

In `styles/radar.css` near line 4:

```css
// BEFORE
.mobile-radar-view{color:#fff;background:#0a0a1a;flex-direction:column;padding-top:1.55rem;display:flex}

// AFTER
.mobile-radar-view{color:var(--mobile-text-primary);background:var(--mobile-bg-section);flex-direction:column;padding-top:1.55rem;display:flex}
```

- [ ] **Step 4: Update `.mobile-radar-view` in `app/globals.css`**

In `app/globals.css` around line 14810:

```css
// BEFORE
  .mobile-radar-view {
    display: flex;
    flex-direction: column;
    padding-top: 1.55rem;
    background: #0a0a1a;
    color: #ffffff;
  }

// AFTER
  .mobile-radar-view {
    display: flex;
    flex-direction: column;
    padding-top: 1.55rem;
    background: var(--mobile-bg-section);
    color: var(--mobile-text-primary);
  }
```

- [ ] **Step 5: Update Radar sheet background**

In `styles/radar.css` near the `.mobile-radar-view__sheet` rule:

```css
// BEFORE
.mobile-radar-view__sheet{z-index:55;border-radius:var(--radius-2xl) var(--radius-2xl) 0 0;background:linear-gradient(#12102a,#0a0a1a);border-top:1px solid #6a3cff2e;...}

// AFTER
.mobile-radar-view__sheet{z-index:55;border-radius:var(--radius-2xl) var(--radius-2xl) 0 0;background:var(--mobile-bg-card);border-top:1px solid var(--mobile-border-subtle);...}
```

In `app/globals.css` around the `.mobile-radar-view__sheet` rule (if present):

```css
// BEFORE
    background: linear-gradient(180deg, #12102a 0%, #0a0a1a 100%);
    border-top: 1px solid rgba(106, 60, 255, 0.18);

// AFTER
    background: var(--mobile-bg-card);
    border-top: 1px solid var(--mobile-border-subtle);
```

- [ ] **Step 6: Reduce node halo intensity**

In `app/globals.css` locate `.mobile-radar-view__node` glow/halo rules. Reduce `box-shadow` opacity by ~30% (e.g. from `0.45` to `0.3`). Do not change desktop rules.

- [ ] **Step 7: Verify Radar page**

Run dev server, open `/radar` at 390px and 768px widths. Scroll top-to-bottom.
Expected: no color bands between header, canvas stage, and list; sheet opens smoothly.

---

## Task 3: Tool Battle / Shortlist / Compare — remove conflicting overrides

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Remove the `!important` dark override block**

Locate `@media (max-width: 767px) { ... .mobile-library-board { background: ... !important; ... }` around line 24805.

Delete the entire override block for `.mobile-library-board`, `.mobile-library-empty`, `.mobile-compare-arena__energy-lines`, `.mobile-compare-arena__fighter-orb`, and related `!important` text color rules that were forcing a separate dark theme.

If those selectors are needed, rewrite them using the mobile tokens without `!important`.

```css
// AFTER (keep only if needed, no !important)
  .mobile-library-board {
    background: var(--mobile-bg-section-soft);
    color: var(--mobile-text-primary);
  }

  .mobile-library-empty {
    background: var(--mobile-bg-section);
    color: var(--mobile-text-primary);
  }
```

- [ ] **Step 2: Unify `.mobile-library-board` original light rule**

Around line 18593:

```css
// BEFORE
.mobile-library-board {
  padding: 1.25rem 1rem 7rem;
  min-height: 100svh;
  background:
    radial-gradient(circle at 50% 0%, rgba(106, 60, 255, 0.035), transparent 45%),
    var(--gradient-shell);
}

// AFTER (move inside @media (max-width: 767px) and use tokens)
@media (max-width: 767px) {
  .mobile-library-board {
    padding: 1.25rem 1rem 7rem;
    min-height: 100svh;
    background: var(--mobile-bg-section-soft);
    color: var(--mobile-text-primary);
  }
}
```

- [ ] **Step 3: Clean up legacy `.mobile-shortlist-board` rules**

Around line 15332, the `.mobile-shortlist-board` rules are unused because the component renders `mobile-library-board`. Remove the `.mobile-shortlist-board` block entirely to avoid confusion.

- [ ] **Step 4: Update Compare arena mobile background**

Around line 15702:

```css
// BEFORE
  .mobile-compare-arena {
    padding: 0 0 7rem;
    background: linear-gradient(180deg, #0f0618 0%, #1a0b2e 40%, #0f0618 100%);
    min-height: 100vh;
  }

// AFTER
  .mobile-compare-arena {
    padding: 0 0 7rem;
    background: var(--mobile-bg-section);
    min-height: 100vh;
  }
```

- [ ] **Step 5: Update Compare battle stage**

Around line 15740:

```css
// BEFORE
    background:
      radial-gradient(circle at 50% 45%, rgba(106, 60, 255, 0.18), transparent 36%),
      radial-gradient(circle at 20% 16%, rgba(57, 210, 246, 0.14), transparent 26%),
      radial-gradient(circle at 78% 82%, rgba(243, 191, 76, 0.12), transparent 28%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.07), rgba(0, 0, 0, 0.2));

// AFTER
    background:
      radial-gradient(circle at 50% 45%, rgba(106, 60, 255, 0.1), transparent 40%),
      radial-gradient(circle at 20% 16%, rgba(57, 210, 246, 0.08), transparent 32%),
      radial-gradient(circle at 78% 82%, rgba(243, 191, 76, 0.06), transparent 34%),
      var(--mobile-bg-card);
```

- [ ] **Step 6: Verify Shortlist and Compare pages**

Open `/shortlist` and `/compare` at 390px. Expected: single dark scene, no light flashes, no `!important` winning via dev tools.

---

## Task 4: Collections — remove vertical gradient strip

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update section root**

Around line 17274:

```css
// BEFORE
  .mobile-collections {
    position: relative;
    padding: 0 0 3rem;
    background: linear-gradient(180deg, #0a0412 0%, #14082a 40%, #0f0618 100%);
    min-height: 100vh;
    overflow: hidden;
  }

// AFTER
  .mobile-collections {
    position: relative;
    padding: 0 0 3rem;
    background: var(--mobile-bg-section);
    min-height: 100vh;
    overflow: hidden;
  }
```

- [ ] **Step 2: Tone down hero glow**

Around line 17305:

```css
// BEFORE
    opacity: 0.35;
    filter: blur(20px);

// AFTER
    opacity: 0.22;
    filter: blur(28px);
```

The blur increase spreads the glow more softly so the edge is less clipped.

- [ ] **Step 3: Simplify hero and item surfaces**

Hero:
```css
// BEFORE
    background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25));

// AFTER
    background: var(--mobile-bg-card);
```

Item:
```css
// BEFORE
    background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
    border: 1px solid rgba(255, 255, 255, 0.08);

// AFTER
    background: var(--mobile-bg-card);
    border: 1px solid var(--mobile-border-subtle);
```

- [ ] **Step 4: Verify Collections page**

Open `/collections` at 390px, scroll full height. Expected: no vertical color band, hero glow feels soft, cards readable.

---

## Task 5: Method — unify dark background and reduce starfield

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Update section root**

Around line 17030:

```css
// BEFORE
  .mobile-method-room {
    position: relative;
    padding: 0 0 3rem;
    background: linear-gradient(180deg, #0a0412 0%, #14082a 40%, #0f0618 100%);
    min-height: 100vh;
    overflow: hidden;
  }

// AFTER
  .mobile-method-room {
    position: relative;
    padding: 0 0 3rem;
    background: var(--mobile-bg-section);
    min-height: 100vh;
    overflow: hidden;
  }
```

- [ ] **Step 2: Reduce starfield opacity**

Around line 17037, in `.mobile-method-room__stars`, reduce all `rgba` alpha values by roughly half:

```css
// BEFORE
      radial-gradient(1.5px 1.5px at 18% 12%, rgba(255,255,255,0.3), transparent),
      radial-gradient(1px 1px at 55% 8%, rgba(255,255,255,0.18), transparent),
      ...

// AFTER
      radial-gradient(1.5px 1.5px at 18% 12%, rgba(255,255,255,0.15), transparent),
      radial-gradient(1px 1px at 55% 8%, rgba(255,255,255,0.09), transparent),
      radial-gradient(1.5px 1.5px at 82% 18%, rgba(255,255,255,0.12), transparent),
      radial-gradient(1px 1px at 35% 45%, rgba(255,255,255,0.07), transparent),
      radial-gradient(1.5px 1.5px at 72% 38%, rgba(255,255,255,0.11), transparent),
      radial-gradient(1px 1px at 12% 68%, rgba(255,255,255,0.06), transparent),
      radial-gradient(1.5px 1.5px at 62% 78%, rgba(255,255,255,0.1), transparent);
```

- [ ] **Step 3: Simplify panels**

Panel:
```css
// BEFORE
    background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.2));

// AFTER
    background: var(--mobile-bg-card);
```

Footer CTA:
```css
// BEFORE
    background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));

// AFTER
    background: var(--mobile-bg-card);
```

- [ ] **Step 4: Verify Method page**

Open `/metodo` at 390px. Expected: calm dark scene, stars subtle, panels readable.

---

## Task 6: Home discovery stage — keep void base and reduce grid glow

**Files:**
- Modify: `styles/vibes-3d-maestoso.css`

- [ ] **Step 1: Ensure discovery stage base stays `--v-void`**

Already `background: var(--v-void)` at line 2829. No change needed unless a mobile override exists.

- [ ] **Step 2: Reduce discovery stage background glow intensity**

Around line 2834:

```css
// BEFORE
  background:
    radial-gradient(circle at 20% 30%, rgba(124,77,255,0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(0,229,255,0.04) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255,215,64,0.03) 0%, transparent 40%);

// AFTER (inside @media (max-width: 767px) override)
@media (max-width: 767px) {
  .v-discovery-stage-bg {
    background:
      radial-gradient(circle at 20% 30%, rgba(124,77,255,0.035) 0%, transparent 50%),
      radial-gradient(circle at 80% 70%, rgba(0,229,255,0.025) 0%, transparent 50%),
      radial-gradient(circle at 50% 50%, rgba(255,215,64,0.018) 0%, transparent 40%);
  }
}
```

- [ ] **Step 3: Reduce grid line opacity on mobile**

Around line 2846:

```css
// BEFORE
    background-image:
      linear-gradient(90deg, rgba(124,77,255,0.04) 1px, transparent 1px),
      linear-gradient(0deg, rgba(0,229,255,0.03) 1px, transparent 1px);

// AFTER (inside @media (max-width: 767px) override)
@media (max-width: 767px) {
  .v-discovery-stage-grid-bg {
    background-image:
      linear-gradient(90deg, rgba(124,77,255,0.022) 1px, transparent 1px),
      linear-gradient(0deg, rgba(0,229,255,0.016) 1px, transparent 1px);
  }
}
```

- [ ] **Step 4: Reduce static grid node colored glows**

Around the `.v-discovery-grid-node` rules inside `@media (max-width: 767px), (hover: none)`:

Find the `box-shadow` declarations (likely using `--route-color`). Reduce their opacity/spread by ~40%.

- [ ] **Step 5: Verify Home page**

Open `/` at 390px. Expected: discovery section is one calm dark area, grid lines are atmospheric but not noisy, no visible band at the orbit-to-grid breakpoint.

---

## Task 7: Categories — keep light, reduce patchiness

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Keep light background**

No change to `var(--gradient-shell)` background. Categories remains the light reference.

- [ ] **Step 2: Reduce sticky header blur strength**

Around line 14410:

```css
// BEFORE
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(12px);

// AFTER
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(8px);
```

A more opaque surface improves readability and reduces the "frosted band" look.

- [ ] **Step 3: Reduce category blob shadow/glow**

Around line 14460:

```css
// BEFORE
    box-shadow:
      0 8px 24px color-mix(in srgb, var(--cat-color, #6a3cff) 12%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);

// AFTER
    box-shadow:
      0 6px 18px color-mix(in srgb, var(--cat-color, #6a3cff) 8%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.55);
```

Also reduce `tv-float` amplitude or remove it on mobile if it contributes to visual instability.

- [ ] **Step 4: Verify Categories page**

Open `/archivio` at 390px. Expected: light shell stays coherent, blobs feel connected rather than scattered, header readable.

---

## Task 8: Build, lint, and test

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: 0 new errors.

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: all tests pass (19/19 baseline).

- [ ] **Step 4: Run build**

Run: `npm run build`
Expected: build completes with 0 errors.

---

## Task 9: Mobile viewport verification

- [ ] **Step 1: Verify these viewports**

Open Chrome DevTools and check each width in portrait:
- 360px
- 375px
- 390px
- 414px
- 430px
- 768px (tablet/mobile)

For each, scroll these pages top-to-bottom:
- `/`
- `/radar`
- `/shortlist`
- `/compare`
- `/collections`
- `/metodo`
- `/archivio`

- [ ] **Step 2: Capture notes**

Note any remaining bands, seams, or unreadable cards and fix in a follow-up task if small.

---

## Plan self-review

- **Spec coverage:** every section from the spec (Radar, Tool Battle, Categories, Collections, Method, Home) has a dedicated task.
- **Placeholder scan:** no TBD/TODO/fill-in; code blocks show concrete selectors and values.
- **Type consistency:** CSS custom property names are consistent across all tasks.
- **Isolation:** all changes are inside `@media (max-width: 767px)` or `.mobile-*` selectors; desktop untouched.
