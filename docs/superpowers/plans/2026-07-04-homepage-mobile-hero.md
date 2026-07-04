# Homepage mobile hero implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a dedicated, lightweight, premium mobile hero for the TooolVibes homepage, isolated from desktop and connected to the wheel/selector below.

**Architecture:** Add a `useIsMobile` hook, create a new `MobileMarketingHero` component with a dark spatial background and minimal copy, and wrap the existing `Home3DHero` so it renders the mobile component only on small viewports. Styles live in the existing mobile breakpoint of `styles/vibes-3d-maestoso.css` to keep the change localized.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, Vitest.

---

## File structure

| File | Responsibility |
|------|----------------|
| `lib/hooks/use-is-mobile.ts` *(new)* | Hook that reports `true` when viewport width is below a breakpoint, with a desktop fallback during SSR/hydration. |
| `components/home/mobile-marketing-hero.tsx` *(new)* | Presentational hero for mobile: label, headline, subheadline, two CTAs, "Esplora" scroll indicator, starfield background. |
| `components/3d-maestoso/home-3d-hero.tsx` *(modify)* | Conditionally render `MobileMarketingHero` on mobile and keep the existing 3D hero for desktop. |
| `components/home/mobile-hero-solar.tsx` *(modify)* | Add an `id="v-discovery-stage"` so the scroll indicator can target it. |
| `styles/vibes-3d-maestoso.css` *(modify)* | Mobile-hero background, starfield, CTA and indicator styles, scoped inside the existing mobile media query. |

---

### Task 1: Create `useIsMobile` hook

**Files:**
- Create: `lib/hooks/use-is-mobile.ts`

- [ ] **Step 1: Write the hook**

```ts
"use client";

import { useEffect, useState } from "react";

export function useIsMobile(breakpoint = 767): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);

  return isMobile;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 2: Add scroll target id to the wheel section

**Files:**
- Modify: `components/home/mobile-hero-solar.tsx`

- [ ] **Step 1: Locate the root element of the wheel/selector section and add the id**

Find the outermost `<section>` or wrapper (for example `.v-discovery-stage--orbital`) and add `id="v-discovery-stage"`.

Example change:

```tsx
<section id="v-discovery-stage" className="v-discovery-stage v-discovery-stage--orbital ...">
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 3: Create `MobileMarketingHero` component

**Files:**
- Create: `components/home/mobile-marketing-hero.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { PremiumLink } from "@/components/ui/premium";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

const STARS_COUNT = 24;

function Starfield() {
  const stars = useMemo(() => {
    return Array.from({ length: STARS_COUNT }).map((_, i) => ({
      id: i,
      top: `${(i * 37) % 100}%`,
      left: `${(i * 53) % 100}%`,
      size: 1 + (i % 3),
      opacity: 0.25 + ((i * 7) % 40) / 100,
      delay: (i * 0.12) % 2,
    }));
  }, []);

  return (
    <div className="v-hero-mobile__stars" aria-hidden="true">
      {stars.map((star) => (
        <span
          key={star.id}
          className="v-hero-mobile__star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
          }}
        />
      ))}
    </div>
  );
}

export function MobileMarketingHero({
  tools,
  weeklyTool,
}: {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
}) {
  const reducedMotion = useReducedMotion();

  const handleExploreClick = () => {
    const target = document.getElementById("v-discovery-stage");
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
    }
  };

  const transition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.6, ease: [0.22, 1, 0.36, 1] };

  return (
    <section className="v-hero-mobile relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 py-24 text-center">
      <div className="v-hero-mobile__bg" aria-hidden="true" />
      <Starfield />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <motion.span
          className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.1 }}
        >
          TooolVibes
        </motion.span>

        <motion.h1
          className="text-[2rem] font-bold leading-[1.05] text-white sm:text-5xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.2 }}
        >
          Scegli tool AI validi
        </motion.h1>

        <motion.p
          className="mt-4 text-lg leading-relaxed text-slate-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.3 }}
        >
          Senza attraversare il rumore.
        </motion.p>

        <motion.div
          className="mt-8 flex w-full flex-col items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.4 }}
        >
          <PremiumLink
            href="/archivio"
            size="lg"
            className="v-hero-mobile__cta v-hero-mobile__cta--primary w-full max-w-xs justify-center"
          >
            Esplora catalogo
          </PremiumLink>

          <Link
            href="/radar"
            className="v-hero-mobile__cta v-hero-mobile__cta--secondary"
          >
            Radar live
          </Link>
        </motion.div>
      </div>

      <div className="v-hero-mobile__explore-wrap">
        <motion.button
          type="button"
          onClick={handleExploreClick}
          className="v-hero-mobile__explore"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transition, delay: 0.6 }}
          aria-label="Scorri per esplorare"
        >
          <span>Esplora</span>
          <ChevronDown className="v-hero-mobile__explore-chevron" size={16} />
        </motion.button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 4: Wire `MobileMarketingHero` into `Home3DHero`

**Files:**
- Modify: `components/3d-maestoso/home-3d-hero.tsx`

- [ ] **Step 1: Import the new hook and component**

Add at the top of the file:

```tsx
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { MobileMarketingHero } from "@/components/home/mobile-marketing-hero";
```

- [ ] **Step 2: Split desktop content and add mobile branch**

Replace the `return (...)` block with:

```tsx
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileMarketingHero tools={tools} weeklyTool={weeklyTool} />;
  }

  return (
    <section className="home-3d-hero relative flex min-h-[60vh] items-center justify-center overflow-hidden sm:min-h-[85vh]">
      <VibesReactor orbs={orbs} className="home-3d-hero__reactor" />
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.p
          className="mb-4 text-sm font-semibold uppercase tracking-widest text-[#B388FF]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          Sistema TooolVibes
        </motion.p>
        <motion.h1
          className="home-3d-hero__title v-text-gradient-purple text-[1.75rem] font-bold leading-tight sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          Scegli tool AI validi senza attraversare il rumore
        </motion.h1>
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#9E99B8]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          {siteConfig.description}
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <PremiumLink href="/archivio" size="lg" className="home-3d-hero__cta home-3d-hero__cta--catalog">
            Esplora catalogo
          </PremiumLink>
          <Link href="/radar" className="home-3d-hero__cta home-3d-hero__cta--radar v-btn-radar-live">
            <span className="v-btn-radar-live__dot" aria-hidden="true" />
            <span className="v-btn-radar-live__glow" aria-hidden="true" />
            Radar live
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </section>
  );
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 5: Add mobile hero styles

**Files:**
- Modify: `styles/vibes-3d-maestoso.css`

- [ ] **Step 1: Append mobile-hero styles inside the existing mobile media query**

Find the existing mobile breakpoint block (for example `@media (max-width: 767px), (hover: none)`) and append inside it. If no suitable mobile-only block exists, create one at the end of the file:

```css
/* ─── Mobile marketing hero ─── */
.v-hero-mobile {
  background: #06060E;
}

.v-hero-mobile__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 35%, rgba(11, 11, 24, 0.95) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 100%, rgba(6, 6, 14, 1) 0%, transparent 40%);
  z-index: 0;
}

.v-hero-mobile__stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  overflow: hidden;
}

.v-hero-mobile__star {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.25);
}

.v-hero-mobile__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 9999px;
  padding: 0.875rem 1.75rem;
  font-size: 0.9375rem;
  font-weight: 600;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.v-hero-mobile__cta:active {
  transform: scale(0.98);
}

.v-hero-mobile__cta--primary {
  background: #F8FAFC;
  color: #0F172A;
}

.v-hero-mobile__cta--primary:hover {
  opacity: 0.92;
}

.v-hero-mobile__cta--secondary {
  border: 1px solid rgba(71, 85, 105, 0.65);
  color: #E2E8F0;
  background: transparent;
}

.v-hero-mobile__cta--secondary:hover {
  border-color: rgba(148, 163, 184, 0.8);
  color: #FFFFFF;
}

.v-hero-mobile__explore-wrap {
  position: absolute;
  bottom: 1.75rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

.v-hero-mobile__explore {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(71, 85, 105, 0.45);
  border-radius: 9999px;
  background: rgba(6, 6, 14, 0.5);
  color: #94A3B8;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease;
}

.v-hero-mobile__explore:hover {
  color: #E2E8F0;
  border-color: rgba(148, 163, 184, 0.6);
}

.v-hero-mobile__explore-chevron {
  animation: v-hero-mobile-chevron-bob 2s ease-in-out infinite;
}

@keyframes v-hero-mobile-chevron-bob {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(4px); }
}

@media (prefers-reduced-motion: reduce) {
  .v-hero-mobile__explore-chevron {
    animation: none;
  }
}
```

- [ ] **Step 2: Verify CSS is valid**

Run: `npm run lint`
Expected: 0 new errors (existing warnings allowed).

---

### Task 6: Verification

- [ ] **Step 1: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Run linter**

Run: `npm run lint`
Expected: 0 new errors.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 4: Build the project**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Manual mobile visual check**

Open the local dev server (or use a mobile viewport in DevTools) and verify:
- On widths 360 px, 375 px, 390 px, 414 px, 430 px:
  - label, headline, sottotitolo, CTAs and "Esplora" indicator are visible;
  - text is not covered by the header or bottom nav;
  - CTA buttons are easy to tap;
  - tapping "Esplora" scrolls smoothly to the wheel/selector section;
  - background is continuous with the section below (`#06060E`).
- On desktop widths (>= 768 px):
  - the original 3D hero is still rendered unchanged.

---

## Spec coverage self-check

| Spec requirement | Task that implements it |
|------------------|------------------------|
| Hero mobile con label, headline, sottotitolo, 2 CTA, indicatore | Task 3 |
| Sfondo scuro `#06060E` con gradiente radiale | Task 5 |
| Micro-stelle statiche / leggere | Task 3 + Task 5 |
| Nessun blur/glass/3D su mobile | Task 3 (no canvas) + Task 5 |
| CTA leggere e responsive | Task 3 + Task 5 |
| Indicatore "Esplora" che scrolla verso ruota | Task 2 (target id) + Task 3 (handler) |
| Animazioni leggere con `prefers-reduced-motion` | Task 3 + Task 5 |
| Isolamento mobile, desktop invariato | Task 4 + Task 5 |
| Build/lint/test passano | Task 6 |

## Placeholder scan

No TBD/TODO, no vague "add validation" steps. Every step contains exact file paths and code.

## Type consistency

- `useIsMobile(breakpoint?: number): boolean` is used as a boolean in `Home3DHero`.
- `MobileMarketingHero` accepts the same props shape as `Home3DHero` so the wrapper can pass them through unchanged.
