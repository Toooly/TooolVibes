# TooolVibes — UI/UX & 3D Graphics Pass

**Date:** 2026-06-13  
**Scope:** UI, CSS, animations, layout, 3D graphics. No changes to business logic, hooks, API calls, stores, or TypeScript types.  
**Approach:** Premium completo.

---

## 1. Context & Goal

The TooolVibes app currently has a 22k-line `globals.css`, several heavy visual dependencies (`@tsparticles/*`, `@lottiefiles/react-lottie-player`, `react-countdown-circle-timer`, `howler`), and a mobile intro that needs a more immersive, premium feel.

Goal: transform the visual layer into a cohesive, immersive digital space — glassmorphism, gradient mesh, neon glow, depth/parallax, modern typography — while keeping the codebase maintainable and mobile-first (320–430 px).

---

## 2. Design Decisions

### 2.1 Dependencies

| Dependency | Decision |
|---|---|
| `@tsparticles/*` | Stop importing in components; replace effects with CSS/canvas-confetti/SVG. **Keep installed** in `package.json` for future use. |
| `@lottiefiles/react-lottie-player` | Remove from `level-up-modal.tsx`; replace with SVG stroke-draw + CSS bounce. **Keep installed**. |
| `react-countdown-circle-timer` | Remove from `radar-console.tsx`; replace with custom SVG circle + CSS/JS. **Keep installed**. |
| `howler` | Stop using in `sound-engine.ts`; rewrite with native Web Audio API. **Keep installed**. |
| `canvas-confetti` | Keep and use for arena victory burst. |
| `motion` (Framer Motion) | Keep; use for complex animations. |
| `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` | Keep; use for intro 3D logo, header micro-logo, radar overlay, desktop depth. |

### 2.2 Animation Strategy

- **Framer Motion** for complex sequences: intro text stagger, morph transition, drawer/menu springs, HUD XP bar.
- **CSS/keyframes** for simple loops: pulse, glow, gradient shift, twinkle, hover transitions.
- **Native Web Animations / requestAnimationFrame** for timers, parallax, and canvas-based effects.

### 2.3 Color Palette

Use existing brand CSS variables:

- `--brand-purple`: `#6a3cff`
- `--brand-cyan`: `#39d2f6`
- `--brand-gold`: `#f3bf4c`
- `--bg-dark`: `#0a0a1a`
- `--surface-light`: `rgba(255,255,255,0.88)`

No new colors introduced.

---

## 3. Phase 1 — Critical Fix

### 3.1 `app/(marketing)/layout.tsx`

- Remove the import path `@/components/app/orbital-system` if it does not resolve.
- The folder `components/app/orbital-system/` exists but is not exported from a single barrel file at that path. Verify the actual export (likely `components/app/orbital-system/index.ts`) and fix the import, **or** create a stub `components/app/orbital-system.tsx` that re-exports `OrbitalProvider`/`OrbitalLayer`.
- Run `npm run build` (or `npx tsc --noEmit`) immediately after to confirm the build compiles.

---

## 4. Phase 2 — CSS Refactor

### 4.1 New File Structure

Create `styles/` directory and split styles:

| File | Contents |
|---|---|
| `styles/intro.css` | Mobile intro: `.brand-intro`, gradient mesh, stars, typography, skip button, morph transition. |
| `styles/gamification.css` | Arena, battle-card-flip, badge-toast, gamer-hud, level-up-modal, cinematic-transition. |
| `styles/radar.css` | `mobile-radar-view`, `radar-console`, scanner overlay. |
| `styles/compare.css` | `mobile-compare-arena`. |
| `styles/depth-scene.css` | `desktop-depth-scene`. |
| `app/globals.css` | Tailwind import, `:root` variables (deduplicated), reset/base, shared utilities, `@import` of the files above. |

### 4.2 Deduplication

- Remove duplicate `:root` declarations (e.g., `--background`, `--foreground`, `--background-strong`, `--muted`).
- Consolidate media queries where possible.
- Delete CSS classes tied to removed tsparticles/Lottie markup.

---

## 5. Phase 3 — Mobile Intro Remake

### 5.1 Visibility

- Render only on mobile: `max-width: 767px`.
- On desktop the component returns `null` immediately.
- Auto-play once per session via existing `sessionStorage` flag.
- Respect `prefers-reduced-motion: reduce` by skipping the intro entirely.

### 5.2 Background

- Remove `.brand-intro__grain` and `.brand-intro__aurora`.
- Animated gradient mesh:
  ```css
  background:
    radial-gradient(at 40% 20%, rgba(106,60,255,0.25) 0px, transparent 50%),
    radial-gradient(at 80% 0%, rgba(57,210,246,0.20) 0px, transparent 50%),
    radial-gradient(at 0% 50%, rgba(243,191,76,0.15) 0px, transparent 50%),
    #0a0a1a;
  background-size: 200% 200%;
  animation: gradientShift 8s ease infinite;
  ```
- Starfield: 30–50 small `span` dots (or pseudo-elements) with opacity twinkle. Pure CSS, no `tsparticles`.

### 5.3 3D Logo

New file: `components/3d/logo-3d-intro.tsx`

- R3F `Canvas`:
  - `dpr={[1, 1.5]}`
  - `gl={{ antialias: false, alpha: true }}`
  - Full viewport (`100vw` × `100vh`), `fixed`/`absolute`.
- Scene:
  - `TorusKnot` (trefoil-like) with `MeshDistortMaterial` color `#6a3cff` → `#39d2f6`.
  - Two thinner `Torus` ribbons in cyan and gold swirling around the main knot to evoke the reference video.
  - `<Float speed={1.5} rotationIntensity={0.4} />`.
  - `<pointLight color="#6a3cff" />`, `<pointLight color="#39d2f6" />`, `<ambientLight intensity={0.4} />`.
  - `Bloom` from `@react-three/postprocessing` with low intensity (`intensity={0.4}`, `threshold={0.85}`).
- Scale and center the logo to fill ~40–50% of the mobile viewport.
- Dismount the Canvas after the intro ends to free GPU.

### 5.4 Typography & Animation

- **"Welcome in"**
  - Font: Manrope, weight 500.
  - Color: `rgba(255,255,255,0.9)`.
  - Animation: fade-in + `translateY(10px → 0)`, duration 0.4s, delay 0.2s.
  - Subtle glassy text-shadow inspired by the reference photo.
- **"TooolVibes"**
  - Font: Rubik, weight 700.
  - Gradient text: purple → cyan via `background-clip: text`.
  - Reveal: clip-path wipe from left or per-character scale.
  - Stagger: 0.03s per character.
  - Start delay: 0.5s after "Welcome in".
- **"Scopri. Confronta. Vibra."**
  - Smaller size, color `rgba(255,255,255,0.6)`.
  - Fade-in after 1.0s.

### 5.5 Timing & Skip

- `INTRO_DURATION_MS = 3800` (down from 5600).
- Skip button: X icon, 20px, absolute top-right, opacity 0.6, transition 0.2s.
- On tap: `finishIntro(true)` immediately.

### 5.6 Exit Morph

Phases:

1. `entering` — 0–400 ms
2. `playing` — 400–3400 ms
3. `leaving` — 3400–4000 ms
4. `unmounted` — after 4000 ms

During `leaving`:

- 3D logo scales from `1` to `0.15`.
- Logo translates toward header: `translateY(-40vh)`.
- Transition: 0.6s `cubic-bezier(0.22, 1, 0.36, 1)`.
- Text fades out.
- After morph, container fades out over 0.3s.

### 5.7 Events

- Dispatch `tooolvibes:brand-intro-finished` when intro finishes.
- Dispatch `SOUND_PLAY_EVENT` at key moments (spark, reveal, finish) to keep audio synchronized.

---

## 6. Phase 4 — General UI/UX

### 6.1 `site-header-v2.tsx`

- **VibeTapMiniGame launcher**: move from beside the logo to a FAB bottom-right, above the bottom nav (`z-index: 80`).
- **BrandLogo**: replace static PNG with `components/3d/brand-logo-3d.tsx` (36×36 px micro Canvas) on all marketing pages. Fallback to CSS/SVG if heavy.
- **Mobile menu**:
  - Icons: 20px.
  - Touch target: min 44px.
  - Thin dividers between link groups (`border-b border-white/10`).
  - Drawer: `bg-white/70 backdrop-blur-2xl`.

### 6.2 `mobile-bottom-nav.tsx`

- Background simplified:
  ```css
  bg-white/70 backdrop-blur-xl border border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
  ```
- Active state:
  - Icon `scale(1.1)`.
  - Subtle purple glow: `box-shadow: 0 0 12px rgba(106,60,255,0.3)`.
- Compare badge: pulse animation when `compareCount` changes.

### 6.3 `arena-battle-stage.tsx`

- Remove `tsparticles` fireworks.
- Victory burst via `canvas-confetti`.
- Fight shake: `rotate: [-8deg, 8deg]`, `scale: [0.95, 1.05]`.
- White flash overlay (0.15s) on impact.

### 6.4 `cinematic-transition.tsx`

- Remove `@tsparticles/preset-hyperspace`.
- CSS-only effect:
  - Vertical scanline crossing the screen.
  - White flash `opacity: 0 → 0.8 → 0` in 0.2s.
  - Horizontal wipe bar using `scaleX`.

### 6.5 `radar-console.tsx`

- Glass panel: `bg-white/5 backdrop-blur-md border border-white/10`.
- Replace `CountdownCircleTimer` with custom SVG circle animated via `stroke-dashoffset` + JS/CSS.
- Add mini sparkline SVG for top-3 signal votes: simple `polyline` with gradient stroke.

### 6.6 `level-up-modal.tsx`

- Remove inline Lottie.
- Replace with:
  - SVG trophy that draws via `stroke-dashoffset`.
  - Scale-bounce at end.
  - CSS sparkles around the modal.

### 6.7 `badge-unlock-toast.tsx` & `gamer-hud.tsx`

- Badge toast: spring enter `scale(0.8) → scale(1)`.
- Gamer HUD: XP bar fills with smooth CSS transition; numbers may animate with Framer Motion.

---

## 7. Phase 5 — 3D & Depth

### 7.1 Persistent Micro Logo

New file: `components/3d/brand-logo-3d.tsx`

- 36×36 px Canvas.
- `dpr={[1, 1]}`.
- Minimal geometry (small `Icosahedron` or `TorusKnot`).
- Very light `Float` (low speed / intensity).
- No post-processing.
- Used in `site-header-v2` on all marketing pages.
- Fallback to PNG/CSS for reduced motion or low-power devices.

### 7.2 Radar 3D Overlay

In `mobile-radar-view.tsx`:

- Add R3F Canvas above the existing 2D radar canvas (higher `z-index`).
- Elements:
  - Pulsing torus from center (sonar 3D effect).
  - Small floating spheres at node positions.
- `dpr={[1, 1]}` and minimal geometry for mobile GPU safety.
- Existing 2D radar canvas remains functional; 3D is atmospheric only.

### 7.3 Desktop Depth Scene

In `desktop-depth-scene.tsx`:

- Mouse parallax: midground cards tilt slightly toward cursor (`rotateX`, `rotateY`).
- Use throttled `requestAnimationFrame` or `mousemove` with throttling.
- Progressive background blur for depth.
- Route-link hover: `translateZ(10px)` + purple glow.

---

## 8. Phase 6 — Dependency Cleanup (Non-Destructive)

- **Do not remove packages from `package.json`**. The user wants to keep them available for future use.
- Remove all runtime imports/usages of:
  - `@tsparticles/react`
  - `@tsparticles/preset-confetti`
  - `@tsparticles/preset-fireworks`
  - `@tsparticles/preset-hyperspace`
  - `@tsparticles/slim`
  - `@lottiefiles/react-lottie-player`
  - `react-countdown-circle-timer`
  - `howler`
- After code changes, run `npm run build` to verify there are no TypeScript/import errors.

---

## 9. Non-Regression Rules

- Do not modify business logic, hooks, API calls, Zustand stores, or TypeScript types.
- Do not modify existing tests.
- Preserve accessibility: `aria-label`, `role`, `aria-live`, focus management.
- Mobile-first: all changes must work perfectly at 320–430 px; desktop must benefit or at least not degrade.
- Use brand CSS variables for colors.
- Pause/disable 3D rendering when not visible (`useFrame` conditionals, IntersectionObserver, unmount after intro).

---

## 10. Acceptance Criteria

- [ ] `npm run build` passes without errors.
- [ ] Mobile intro renders only on mobile, plays once per session, respects reduced motion, and morphs to header.
- [ ] `globals.css` is split into focused stylesheets with no duplicate `:root` variables.
- [ ] Header uses micro-3D logo on all marketing pages.
- [ ] Bottom nav uses simplified glass style with active scale/glow.
- [ ] Arena uses `canvas-confetti` and impact flash/shake.
- [ ] Cinematic transition is CSS-only.
- [ ] Radar console uses custom SVG timer and sparkline.
- [ ] Level-up modal uses SVG draw + bounce + sparkles.
- [ ] Badge toast and HUD have smooth spring/fill animations.
- [ ] Radar 3D overlay and desktop parallax are present but performance-safe.
