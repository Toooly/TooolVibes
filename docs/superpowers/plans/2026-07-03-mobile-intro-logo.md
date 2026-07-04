# Mobile Intro — Logo as Holographic Planet Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the TooolVibes logo into the main planet of the mobile intro as a holographic core, improving visibility on small viewports without changing desktop or the existing animation.

**Architecture:** A new wrapper around the existing PNG logo in `components/home/mobile-hero-solar.tsx` receives mobile-only CSS pseudo-elements (ring + glow) and a synchronized pulse keyframe. All new styles live inside the existing mobile/touch breakpoint in `styles/vibes-3d-maestoso.css`.

**Tech Stack:** Next.js, React, Tailwind CSS, CSS pseudo-elements/keyframes.

---

## Files that will change

| File | Responsibility |
|------|----------------|
| `components/home/mobile-hero-solar.tsx` | Add holographic wrapper around the logo `<Image>`. |
| `styles/vibes-3d-maestoso.css` | Mobile-only styles for the wrapper, ring, glow, logo sizing, and keyframe. |

---

## Task 1: Add holographic wrapper in JSX

**Files:**
- Modify: `components/home/mobile-hero-solar.tsx:47-58`

- [ ] **Step 1: Locate the logo block**

Open `components/home/mobile-hero-solar.tsx` and find:

```tsx
        <div className="v-discovery-brand" aria-hidden="true">
          <span className="v-discovery-brand-aura" />
          <span className="v-discovery-brand-ring" />
          <Image
            src="/brand/tooolvibes-logo.png"
            alt=""
            width={72}
            height={72}
            className="v-discovery-brand-logo"
            priority
          />
        </div>
```

- [ ] **Step 2: Wrap the Image in a hologram span**

Replace the `Image` with the wrapped version:

```tsx
        <div className="v-discovery-brand" aria-hidden="true">
          <span className="v-discovery-brand-aura" />
          <span className="v-discovery-brand-ring" />
          <span className="v-discovery-brand-hologram">
            <Image
              src="/brand/tooolvibes-logo.png"
              alt=""
              width={72}
              height={72}
              className="v-discovery-brand-logo"
              priority
            />
          </span>
        </div>
```

- [ ] **Step 3: Run lint and typecheck**

Run:
- `npm run lint`
- `npx tsc --noEmit`

Expected: 0 new errors.

---

## Task 2: Add mobile-only CSS for the holographic core

**Files:**
- Modify: `styles/vibes-3d-maestoso.css`

- [ ] **Step 1: Locate the existing mobile/touch breakpoint for the discovery stage**

Search for the existing block:

```css
@media (max-width: 767px), (hover: none) {
  .v-discovery-stage--orbital { ... }
  ...
}
```

It is around line 4331 in `styles/vibes-3d-maestoso.css`.

- [ ] **Step 2: Add the hologram styles inside that breakpoint**

Append these rules inside the same `@media (max-width: 767px), (hover: none)` block:

```css
  /* Holographic logo core on mobile */
  .v-discovery-brand {
    width: clamp(5.4rem, 18vw, 6.8rem);
    height: clamp(5.4rem, 18vw, 6.8rem);
  }

  .v-discovery-brand-hologram {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
  }

  .v-discovery-brand-hologram::before {
    content: "";
    position: absolute;
    inset: -8%;
    border-radius: 50%;
    border: 1px solid rgba(0, 229, 255, 0.45);
    box-shadow:
      0 0 12px rgba(0, 229, 255, 0.35),
      inset 0 0 10px rgba(124, 77, 255, 0.25);
    animation: tv-hologram-pulse 3.2s ease-in-out infinite;
    pointer-events: none;
  }

  .v-discovery-brand-hologram::after {
    content: "";
    position: absolute;
    inset: -20%;
    border-radius: 50%;
    background:
      radial-gradient(circle, rgba(0, 229, 255, 0.22) 0%, transparent 55%),
      radial-gradient(circle, rgba(124, 77, 255, 0.18) 0%, transparent 65%);
    filter: blur(6px);
    animation: tv-hologram-pulse 3.2s ease-in-out infinite reverse;
    pointer-events: none;
    z-index: -1;
  }

  .v-discovery-brand-logo {
    position: relative;
    z-index: 1;
    width: 78%;
    height: 78%;
    filter:
      drop-shadow(0 0 6px rgba(0, 229, 255, 0.55))
      drop-shadow(0 0 14px rgba(124, 77, 255, 0.35));
  }
```

- [ ] **Step 3: Add the keyframe**

Add the keyframe at the end of `styles/vibes-3d-maestoso.css`:

```css
@keyframes tv-hologram-pulse {
  0%, 100% {
    opacity: 0.55;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.04);
  }
}
```

- [ ] **Step 4: Verify no desktop rules changed**

Confirm that the rules outside `@media (max-width: 767px), (hover: none)` still use the original values:

```css
.v-discovery-stage--orbital .v-discovery-brand {
  width: clamp(4.9rem, 7vw, 6.4rem);
  height: clamp(4.9rem, 7vw, 6.4rem);
}

.v-discovery-stage--orbital .v-discovery-brand-logo {
  width: 62%;
}
```

- [ ] **Step 5: Run lint and typecheck**

Run:
- `npm run lint`
- `npx tsc --noEmit`

Expected: 0 new errors.

---

## Task 3: Build and test

- [ ] **Step 1: Run tests**

Run: `npm test`
Expected: 19/19 tests pass.

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: build completes with 0 errors.

- [ ] **Step 3: Manual mobile check (notes)**

Open the home page at 360px, 375px, 390px, 414px, 430px, and 768px portrait. Verify:
- Logo is clearly visible and centered on the planet.
- Hologram ring and glow are visible but not overwhelming.
- Orbit animation is unchanged.
- No console errors.

---

## Plan self-review

- **Spec coverage:** wrapper (Task 1), mobile sizing (Task 2), ring/glow/pulse (Task 2), keyframe (Task 2), build/test (Task 3) — all covered.
- **Placeholder scan:** no TBD/TODO/fill-in.
- **Type consistency:** class names match between JSX and CSS.
