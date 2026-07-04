# Mobile Intro — Logo as Holographic Planet Core

## Goal
Integrate the TooolVibes logo into the main planet of the mobile intro (`MobileHeroSolar`) so that it reads as the holographic core of the planet, not a flat sticker. Visibility on small viewports must improve while preserving the existing animation, mood, and structure.

## Scope
- **Mobile only**: changes are isolated to the mobile/touch breakpoint (`@media (max-width: 767px), (hover: none)`).
- **No desktop changes**: the orbital discovery stage on desktop keeps its current styling.
- **No unrelated sections touched**.

## Current state
- Component: `components/home/mobile-hero-solar.tsx`
- Planet element: `.v-discovery-brand` (CSS aura + ring + centered PNG logo)
- Logo asset: `/brand/tooolvibes-logo.png`
- Styles: `styles/vibes-3d-maestoso.css`
- The component is shared between desktop and mobile; mobile behavior is driven by CSS.

## Design

### 1. Markup change (mobile-only wrapper)
Wrap the existing `<Image>` logo with a new span:

```tsx
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
```

The wrapper exists in the markup for all viewports but is styled only on mobile.

### 2. Logo sizing on mobile
Increase the logo size relative to the planet on small viewports so it remains readable:

```css
@media (max-width: 767px), (hover: none) {
  .v-discovery-brand-logo {
    width: 78%;
    height: 78%;
  }
}
```

### 3. Holographic ring (pseudo-element)
Add a thin pulsing ring around the logo using `::before` on `.v-discovery-brand-hologram`:

```css
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
}
```

### 4. Core glow (pseudo-element)
Add a soft radial glow behind the logo using `::after`:

```css
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
  z-index: -1;
}
```

### 5. Logo drop-shadow
Make the PNG itself feel luminous:

```css
.v-discovery-brand-logo {
  filter: drop-shadow(0 0 6px rgba(0, 229, 255, 0.55));
}
```

### 6. Keyframe
A subtle pulse synchronized with the existing brand aura:

```css
@keyframes tv-hologram-pulse {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.04); }
}
```

## Isolation
- The new wrapper has no styles outside the mobile/touch breakpoint.
- The existing `.v-discovery-brand-aura`, `.v-discovery-brand-ring`, and orbit animations are not modified.
- No layout shift: the wrapper is absolutely centered and the logo keeps its original `position: absolute` centering.

## File impact
- `components/home/mobile-hero-solar.tsx` — add hologram wrapper around logo image.
- `styles/vibes-3d-maestoso.css` — add mobile styles and keyframe.

## Acceptance criteria
- Logo is clearly readable at 360px.
- Logo feels integrated into the planet (glow + ring + pulse).
- Existing planet animation and orbit are unchanged.
- No overlap issues with orbiting nodes.
- No console errors.
- No desktop regressions.
- `npm run lint`, `npm test`, `npm run build` pass.

## Risks and mitigations
| Risk | Mitigation |
|------|------------|
| Logo too large on very small screens | Clamp size and test at 360px. |
| Glow conflicts with orbit nodes | Keep z-index below nodes; ring stays inside planet boundary. |
| Performance | Use only `transform` and `opacity` animations; no blur animation. |
| Desktop affected | Styles wrapped in mobile breakpoint only. |
