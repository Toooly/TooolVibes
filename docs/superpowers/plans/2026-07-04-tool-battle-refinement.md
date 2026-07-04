# Tool Battle refinement implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Tool Battle `/compare` section into a cleaner, credible game arena for both mobile and desktop without changing battle scoring/gameplay logic.

**Architecture:** Extract shared types and utilities into a dedicated file, create an extensible `ToolFighter` component and a responsive `ToolBattleView` wrapper, refactor `MobileCompareView` for the new arena layout, add a `DesktopCompareView`, simplify the page hero, and clean up/compare CSS.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, canvas-confetti, Vitest.

---

## File structure

| File | Responsibility |
|------|----------------|
| `components/tools/tool-battle-shared.ts` *(new)* | Shared types (`NormalisedTool`) and pure helpers (`normalise`, `withBattleScores`, `dirScore`, `legacyScore`, `getToolLogoUrl`, `hashColor`, `stableScoreOffset`). |
| `components/tools/tool-fighter.tsx` *(new)* | Extensible fighter avatar. Now renders a default orb+base; `variant` prop is a slot for future category-specific characters. |
| `components/tools/tool-battle-view.tsx` *(new)* | Responsive orchestrator: renders `MobileCompareView` or `DesktopCompareView` via `useIsMobile`. |
| `components/tools/mobile-compare-view.tsx` *(modify)* | Refactored mobile arena: HUD, fighter grid, CTA, fixed footer above bottom nav, scrollable matrix with indicator. |
| `components/tools/desktop-compare-view.tsx` *(new)* | Desktop two-column layout: arena left, stats/matrix right. |
| `components/3d-maestoso/compare-3d-hero.tsx` *(modify)* | Replace heavy Canvas hero with a lightweight text/graphic header. |
| `app/(marketing)/compare/page.tsx` *(modify)* | Use `ToolBattleView` instead of `MobileCompareView`; keep `Compare3DHero` wrapper. |
| `styles/compare.css` *(modify)* | Remove obsolete chaotic styles, add new arena/matrix/footer styles. |
| `styles/vibes-3d-maestoso.css` *(modify)* | Ensure background coherence for the compare page. |

---

### Task 1: Extract shared types and utilities

**Files:**
- Create: `components/tools/tool-battle-shared.ts`
- Modify: `components/tools/mobile-compare-view.tsx` (remove duplicated code, re-import)

- [ ] **Step 1: Create `components/tools/tool-battle-shared.ts`**

Move the following from `mobile-compare-view.tsx` into the new file:

```ts
import type { ToolRecord } from "@/lib/types/tool";
import type { DirectoryTool, DirectoryToolLevel } from "@/lib/data/tooolvibes-directory";

export const levelScoreBase: Record<DirectoryToolLevel, number> = {
  featured: 91,
  beginner: 72,
  intermediate: 82,
  expert: 87,
};

export function dirScore(t: DirectoryTool) {
  return Math.min(
    98,
    levelScoreBase[t.level] +
      (t.toolOfWeek ? 4 : 0) +
      (t.featured ? 2 : 0) +
      Math.min(t.highlights.length, 3),
  );
}

export function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h % 360);
  return `hsl(${hue} 80% 55%)`;
}

export function legacyScore(t: ToolRecord): number {
  return Math.min(95, 70 + (t.is_featured ? 10 : 0) + Math.min(t.tags?.length ?? 0, 5) * 2);
}

export function getToolLogoUrl(value: string | null | undefined) {
  if (!value) return "";
  try {
    const domain = new URL(value).hostname.replace(/^www\./, "");
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
  } catch {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(value)}&sz=64`;
  }
}

export function stableScoreOffset(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return (hash % 13) - 6;
}

export type NormalisedTool = {
  slug: string;
  name: string;
  category: string;
  categoryLabel: string;
  score: number;
  battleScore: number;
  accentFrom: string;
  accentTo: string;
  tldr: string;
  useCase: string;
  review: string;
  highlights: string[];
  readingTime: string;
  url: string;
  logoUrl: string;
  isDirectory: boolean;
  useCasesCount: number;
};

export function withBattleScores(tools: NormalisedTool[]): NormalisedTool[] {
  const ranked = tools
    .map((tool, index) => ({
      index,
      tool,
      raw: tool.score + stableScoreOffset(`${tool.slug}:${tool.category}:${index}`),
    }))
    .sort((a, b) => b.raw - a.raw || a.tool.name.localeCompare(b.tool.name));

  const battleBySlug = new Map<string, number>();
  ranked.forEach(({ tool, raw }, rank) => {
    const score = Math.max(62, Math.min(99, Math.round(raw - rank * 2.25)));
    battleBySlug.set(tool.slug, score);
  });

  return tools.map((tool) => ({
    ...tool,
    battleScore: battleBySlug.get(tool.slug) ?? tool.score,
  }));
}

export function normalise(
  directoryTools: DirectoryTool[],
  legacyTools: ToolRecord[],
  compareSlugs: string[],
): NormalisedTool[] {
  const out: NormalisedTool[] = [];
  for (const slug of compareSlugs) {
    const d = directoryTools.find((t) => t.slug === slug);
    if (d) {
      out.push({
        slug: d.slug,
        name: d.name,
        category: d.category,
        categoryLabel: d.categoryLabel,
        score: dirScore(d),
        battleScore: dirScore(d),
        accentFrom: d.accentFrom,
        accentTo: d.accentTo,
        tldr: d.tldr,
        useCase: d.idealUseCase,
        review: d.editorialReview,
        highlights: d.highlights,
        readingTime: d.readingTime,
        url: d.url,
        logoUrl: getToolLogoUrl(d.domain || d.externalUrl),
        isDirectory: true,
        useCasesCount: d.useCases.length,
      });
      continue;
    }
    const l = legacyTools.find((t) => t.slug === slug);
    if (l) {
      const c = hashColor(l.name);
      out.push({
        slug: l.slug,
        name: l.name,
        category: l.category ?? "Tool",
        categoryLabel: l.category ?? "Tool",
        score: legacyScore(l),
        battleScore: legacyScore(l),
        accentFrom: c,
        accentTo: c,
        tldr: l.short_description_it ?? l.description_it ?? "Nessun riassunto disponibile.",
        useCase: l.description_it ?? "",
        review: l.editorial_note ?? "",
        highlights: l.tags?.slice(0, 3) ?? [],
        readingTime: "2 min",
        url: l.website_url ?? "",
        logoUrl: getToolLogoUrl(l.website_url),
        isDirectory: false,
        useCasesCount: 0,
      });
    }
  }
  return out;
}
```

- [ ] **Step 2: Update `mobile-compare-view.tsx` to import from shared file**

Remove the duplicated type/helper code from `mobile-compare-view.tsx` and add:

```ts
import {
  normalise,
  withBattleScores,
  getToolLogoUrl,
  type NormalisedTool,
} from "./tool-battle-shared";
```

Keep the rest of the component logic (store, state, confetti) intact.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 2: Create `ToolFighter` component

**Files:**
- Create: `components/tools/tool-fighter.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { getToolBadgeLabel } from "@/lib/data/tooolvibes-directory";
import type { NormalisedTool } from "./tool-battle-shared";

export type ToolFighterVariant = "default";

export function ToolFighter({
  tool,
  variant = "default",
  isWinner,
  isFighting,
  layoutId,
}: {
  tool: NormalisedTool;
  variant?: ToolFighterVariant;
  isWinner?: boolean;
  isFighting?: boolean;
  layoutId?: string;
}) {
  const [logoError, setLogoError] = useState(false);

  if (variant !== "default") {
    // Slot for future category-specific characters.
    return (
      <div className="tool-fighter tool-fighter--placeholder" data-variant={variant}>
        <span className="tool-fighter__initials">{getToolBadgeLabel(tool.name)}</span>
      </div>
    );
  }

  return (
    <motion.div
      className="tool-fighter"
      data-winner={isWinner}
      data-fighting={isFighting}
      layoutId={layoutId}
    >
      <div
        className="tool-fighter__orb"
        style={{
          borderColor: tool.accentFrom,
          boxShadow: isWinner ? `0 0 24px ${tool.accentFrom}66` : undefined,
        }}
      >
        {!tool.logoUrl || logoError ? (
          <span className="tool-fighter__initials">{getToolBadgeLabel(tool.name)}</span>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={tool.logoUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="tool-fighter__logo"
            onError={() => setLogoError(true)}
          />
        )}
      </div>
      <div className="tool-fighter__base" aria-hidden="true" />
      <div className="tool-fighter__info">
        <span className="tool-fighter__name">{tool.name}</span>
        <div
          className="tool-fighter__health"
          style={{
            background: `linear-gradient(90deg, ${tool.accentFrom}, ${tool.accentTo})`,
          }}
        />
        <span className="tool-fighter__score">{tool.battleScore}</span>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 3: Create `ToolBattleView` responsive wrapper

**Files:**
- Create: `components/tools/tool-battle-view.tsx`

- [ ] **Step 1: Write the wrapper**

```tsx
"use client";

import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";
import { MobileCompareView } from "./mobile-compare-view";
import { DesktopCompareView } from "./desktop-compare-view";

export function ToolBattleView({
  directoryTools,
  legacyTools,
}: {
  directoryTools: DirectoryTool[];
  legacyTools: ToolRecord[];
}) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileCompareView directoryTools={directoryTools} legacyTools={legacyTools} />;
  }

  return <DesktopCompareView directoryTools={directoryTools} legacyTools={legacyTools} />;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 4: Refactor `MobileCompareView` arena and footer

**Files:**
- Modify: `components/tools/mobile-compare-view.tsx`

This is a large refactor. Keep the store subscription, normalisation, scoring, and confetti logic. Replace the visual arena markup with the new clean structure.

- [ ] **Step 1: Replace arena stage markup**

Find the existing arena/battle-stage JSX (around lines 635–820) and replace it with:

```tsx
<section className="mobile-compare-arena" aria-label="Arena di confronto">
  <div className="mobile-compare-arena__bg" aria-hidden="true" />

  <header className="mobile-compare-arena__hud">
    <h2 className="mobile-compare-arena__title">Arena</h2>
    <span className={cn("mobile-compare-arena__status", `mobile-compare-arena__status--${battleState}`)}>
      {battleState === "idle" && "Pronti"}
      {battleState === "fighting" && "Scontro…"}
      {battleState === "result" && `Vincitore: ${winner?.name}`}
    </span>
  </header>

  <div className="mobile-compare-arena__stage">
    {tools.map((tool, i) => (
      <div
        key={tool.slug}
        className="mobile-compare-arena__fighter-slot"
        style={getFighterSlotStyle(tools.length, i)}
      >
        <ToolFighter
          tool={tool}
          isWinner={battleState === "result" && winner?.slug === tool.slug}
          isFighting={battleState === "fighting"}
          layoutId={`fighter-${tool.slug}`}
        />
      </div>
    ))}

    {battleState === "fighting" && (
      <div className="mobile-compare-arena__flash" aria-hidden="true" />
    )}
  </div>

  <div className="mobile-compare-arena__actions">
    <button
      type="button"
      className="mobile-compare-arena__fight-btn"
      disabled={battleState === "fighting" || tools.length < 2}
      onClick={handleFight}
    >
      {battleState === "fighting" ? "In corso…" : battleState === "result" ? "Nuovo scontro" : "Combatti"}
    </button>
  </div>
</section>
```

`getFighterSlotStyle(count, index)` should return percentage-based `top`/`left` coordinates that keep fighters readable and non-overlapping on mobile. Example:

```ts
function getFighterSlotStyle(count: number, index: number) {
  const positions: Record<number, Array<{ top: string; left: string }>> = {
    2: [
      { top: "45%", left: "28%" },
      { top: "45%", left: "72%" },
    ],
    3: [
      { top: "38%", left: "20%" },
      { top: "38%", left: "50%" },
      { top: "38%", left: "80%" },
    ],
    4: [
      { top: "34%", left: "22%" },
      { top: "34%", left: "48%" },
      { top: "34%", left: "74%" },
      { top: "68%", left: "50%" },
    ],
    5: [
      { top: "32%", left: "18%" },
      { top: "28%", left: "38%" },
      { top: "28%", left: "62%" },
      { top: "32%", left: "82%" },
      { top: "70%", left: "50%" },
    ],
  };
  return positions[count]?.[index] ?? { top: "50%", left: "50%" };
}
```

- [ ] **Step 2: Fix sticky footer above bottom nav**

Replace the existing footer markup with:

```tsx
<footer className="mobile-compare-arena__footer">
  <button
    type="button"
    className="mobile-compare-arena__fight-btn mobile-compare-arena__fight-btn--footer"
    disabled={battleState === "fighting" || tools.length < 2}
    onClick={handleFight}
  >
    {battleState === "fighting" ? "In corso…" : battleState === "result" ? "Nuovo scontro" : "Combatti"}
  </button>
</footer>
```

Ensure CSS positions it above the site mobile bottom nav with appropriate `bottom`/`z-index`/`padding-bottom`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 5: Refactor `MobileCompareView` matrix

**Files:**
- Modify: `components/tools/mobile-compare-view.tsx`
- Modify: `styles/compare.css`

- [ ] **Step 1: Add scroll affordance and fix header offset**

Wrap the matrix in a container with class `mobile-compare-matrix` and add a scroll hint element:

```tsx
<div className="mobile-compare-matrix">
  <div className="mobile-compare-matrix__scroll-hint" aria-hidden="true">
    <ArrowRight size={14} />
  </div>
  {/* existing matrix table */}
</div>
```

Remove the duplicate “Punti forti” row by consolidating the highlight text and count into one row.

- [ ] **Step 2: Improve cell contrast and sticky header**

Ensure matrix header is sticky with `top: 4rem` (or whatever clears the fixed site header). Cell text should use `text-slate-200` / `text-slate-400`, backgrounds `rgba(255,255,255,0.05)`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 6: Create `DesktopCompareView`

**Files:**
- Create: `components/tools/desktop-compare-view.tsx`

- [ ] **Step 1: Write the desktop layout**

Reuse the same normalisation, scoring, and state logic as `MobileCompareView`. Render a two-column layout:

```tsx
"use client";

import { useMemo, useState } from "react";
import { useToolWorkspaceStore } from "@/lib/stores/tool-workspace-store";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { ToolRecord } from "@/lib/types/tool";
import { normalise, withBattleScores } from "./tool-battle-shared";
import { ToolFighter } from "./tool-fighter";

export function DesktopCompareView({
  directoryTools,
  legacyTools,
}: {
  directoryTools: DirectoryTool[];
  legacyTools: ToolRecord[];
}) {
  const compareSlugs = useToolWorkspaceStore((s) => s.compareSlugs);
  const [battleState, setBattleState] = useState<"idle" | "fighting" | "result">("idle");

  const tools = useMemo(() => {
    const base = normalise(directoryTools, legacyTools, compareSlugs);
    return withBattleScores(base);
  }, [directoryTools, legacyTools, compareSlugs]);

  const sorted = useMemo(() => [...tools].sort((a, b) => b.battleScore - a.battleScore), [tools]);
  const winner = sorted[0];

  const handleFight = () => {
    if (tools.length < 2) return;
    setBattleState("fighting");
    setTimeout(() => setBattleState("result"), 1200);
  };

  return (
    <section className="desktop-compare" aria-label="Confronto desktop">
      <div className="desktop-compare__arena">
        <header className="desktop-compare__hud">
          <h2 className="desktop-compare__title">Arena</h2>
          <span className="desktop-compare__status">
            {battleState === "idle" && "Pronti"}
            {battleState === "fighting" && "Scontro…"}
            {battleState === "result" && `Vincitore: ${winner?.name}`}
          </span>
        </header>

        <div className="desktop-compare__stage">
          {tools.map((tool, i) => (
            <div
              key={tool.slug}
              className="desktop-compare__fighter-slot"
              style={getDesktopFighterSlotStyle(tools.length, i)}
            >
              <ToolFighter
                tool={tool}
                isWinner={battleState === "result" && winner?.slug === tool.slug}
                isFighting={battleState === "fighting"}
                layoutId={`fighter-${tool.slug}`}
              />
            </div>
          ))}
        </div>

        <div className="desktop-compare__actions">
          <button
            type="button"
            className="desktop-compare__fight-btn"
            disabled={battleState === "fighting" || tools.length < 2}
            onClick={handleFight}
          >
            {battleState === "fighting" ? "In corso…" : battleState === "result" ? "Nuovo scontro" : "Combatti"}
          </button>
        </div>
      </div>

      <div className="desktop-compare__sidebar">
        {/* Scoreboard + matrix */}
        <div className="desktop-compare__scoreboard">
          {sorted.map((tool, i) => (
            <div key={tool.slug} className="desktop-compare__score-row">
              <span className="desktop-compare__rank">#{i + 1}</span>
              <span className="desktop-compare__name">{tool.name}</span>
              <span className="desktop-compare__score">{tool.battleScore}</span>
              {i > 0 && winner && (
                <span className="desktop-compare__diff">
                  {tool.battleScore >= winner.battleScore ? "—" : `-${winner.battleScore - tool.battleScore}`}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Matrix can reuse the same table component built for mobile */}
      </div>
    </section>
  );
}

function getDesktopFighterSlotStyle(count: number, index: number) {
  // Example: spread fighters in a gentle arc.
  const positions: Record<number, Array<{ top: string; left: string }>> = {
    2: [
      { top: "55%", left: "25%" },
      { top: "55%", left: "75%" },
    ],
    3: [
      { top: "40%", left: "20%" },
      { top: "40%", left: "50%" },
      { top: "40%", left: "80%" },
    ],
    4: [
      { top: "35%", left: "20%" },
      { top: "35%", left: "45%" },
      { top: "35%", left: "70%" },
      { top: "65%", left: "35%" },
    ],
    5: [
      { top: "35%", left: "15%" },
      { top: "30%", left: "38%" },
      { top: "30%", left: "62%" },
      { top: "35%", left: "85%" },
      { top: "70%", left: "50%" },
    ],
  };
  return positions[count]?.[index] ?? { top: "50%", left: "50%" };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 7: Refactor `Compare3DHero` to lightweight header

**Files:**
- Modify: `components/3d-maestoso/compare-3d-hero.tsx`

- [ ] **Step 1: Replace Canvas hero with simple header**

Replace the entire component body with:

```tsx
export function Compare3DHero() {
  return (
    <section className="compare-hero-light relative flex min-h-[30vh] items-center justify-center overflow-hidden py-16 md:min-h-[38vh]">
      <div className="compare-hero-light__glow" aria-hidden="true" />
      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl">
          Tool Battle
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          Metti i tool sul ring e scegli il vincitore.
        </p>
      </div>
    </section>
  );
}
```

Keep `Compare3DFloatCard` export as-is (it is unused but removing it is out of scope).

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 8: Update compare page entry

**Files:**
- Modify: `app/(marketing)/compare/page.tsx`

- [ ] **Step 1: Swap `MobileCompareView` for `ToolBattleView`**

```tsx
import { Compare3DHero } from "@/components/3d-maestoso/compare-3d-hero";
import { ToolBattleView } from "@/components/tools/tool-battle-view";
import { getPublishedTools } from "@/lib/data/public-tools";
import { directoryTools } from "@/lib/data/tooolvibes-directory";

export const metadata = {
  title: "Confronto tool",
  description: "Confronta tool salvati e alternative per scegliere lo stack piu adatto.",
  alternates: { canonical: "/compare" },
};

export default async function ComparePage() {
  const tools = await getPublishedTools();

  return (
    <div className="compare-space-page">
      <Compare3DHero />
      <ToolBattleView directoryTools={directoryTools} legacyTools={tools} />
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: 0 errors.

---

### Task 9: Clean and update `styles/compare.css`

**Files:**
- Modify: `styles/compare.css`

- [ ] **Step 1: Remove obsolete chaotic rules**

Remove or disable the old fighter sprite styles, rotating rings, melee clouds, lightning, conic aura, and broken desktop grid areas that are no longer used. Be conservative: only remove rules whose selectors no longer exist in the new markup.

- [ ] **Step 2: Add new arena styles**

Append:

```css
/* ─── Compare page background coherence ─── */
.compare-space-page {
  background: #06060E;
}

.compare-hero-light {
  position: relative;
  background: radial-gradient(ellipse at 50% 60%, rgba(11, 11, 24, 0.95) 0%, transparent 55%);
}

.compare-hero-light__glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba(124, 77, 255, 0.08) 0%, transparent 55%);
}

/* ─── Mobile arena ─── */
.mobile-compare-arena {
  position: relative;
  min-height: 60svh;
  padding: 1.25rem 1rem 8rem;
  overflow: hidden;
}

.mobile-compare-arena__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(11, 11, 24, 0.9) 0%, transparent 50%),
    linear-gradient(180deg, transparent 70%, rgba(6, 6, 14, 1) 100%);
}

.mobile-compare-arena__hud {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.mobile-compare-arena__title {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #E2E8F0;
}

.mobile-compare-arena__status {
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.08);
  color: #94A3B8;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.mobile-compare-arena__status--fighting {
  color: #F3BF4C;
  border-color: rgba(243, 191, 76, 0.4);
}

.mobile-compare-arena__status--result {
  color: #64FFDA;
  border-color: rgba(100, 255, 218, 0.4);
}

.mobile-compare-arena__stage {
  position: relative;
  z-index: 1;
  height: min(22rem, calc(100svh - 18rem));
  margin-bottom: 1rem;
}

.mobile-compare-arena__fighter-slot {
  position: absolute;
  transform: translate(-50%, -50%);
}

.mobile-compare-arena__flash {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6rem;
  height: 6rem;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  opacity: 0;
  animation: compare-flash 0.35s ease-out forwards;
  pointer-events: none;
}

@keyframes compare-flash {
  0% { opacity: 0.8; transform: translate(-50%, -50%) scale(0.5); }
  100% { opacity: 0; transform: translate(-50%, -50%) scale(2); }
}

.mobile-compare-arena__actions {
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
  padding: 0 1rem;
}

.mobile-compare-arena__fight-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  border-radius: 9999px;
  font-size: 1rem;
  font-weight: 700;
  color: #0F172A;
  background: linear-gradient(135deg, #7C4DFF, #39D2F6);
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 0 0 rgba(124, 77, 255, 0);
}

.mobile-compare-arena__fight-btn:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(124, 77, 255, 0.45);
  transform: translateY(-1px);
}

.mobile-compare-arena__fight-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.mobile-compare-arena__fight-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Fixed footer above site bottom nav */
.mobile-compare-arena__footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 3.1rem; /* height of MobileBottomNav */
  z-index: 55;
  display: flex;
  justify-content: center;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, transparent 0%, rgba(6, 6, 14, 0.92) 40%, rgba(6, 6, 14, 1) 100%);
  pointer-events: none;
}

.mobile-compare-arena__footer > * {
  pointer-events: auto;
}

/* ─── Matrix ─── */
.mobile-compare-matrix {
  position: relative;
  margin-top: 1.5rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.mobile-compare-matrix::-webkit-scrollbar {
  display: none;
}

.mobile-compare-matrix__scroll-hint {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(90deg, transparent, rgba(6, 6, 14, 0.9));
  color: #94A3B8;
  pointer-events: none;
  z-index: 2;
}

/* ─── ToolFighter ─── */
.tool-fighter {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 5.5rem;
}

.tool-fighter__orb {
  position: relative;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  border: 2px solid;
  background: rgba(6, 6, 14, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.tool-fighter__logo {
  width: 60%;
  height: 60%;
  object-fit: contain;
}

.tool-fighter__initials {
  font-size: 0.875rem;
  font-weight: 700;
  color: #E2E8F0;
}

.tool-fighter__base {
  width: 2.5rem;
  height: 0.35rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  margin-top: -0.75rem;
}

.tool-fighter__info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  width: 100%;
}

.tool-fighter__name {
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: #F1F5F9;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tool-fighter__health {
  width: 100%;
  height: 0.25rem;
  border-radius: 9999px;
  background: #334155;
}

.tool-fighter__score {
  font-size: 0.875rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #FFFFFF;
}

/* ─── Desktop compare ─── */
.desktop-compare {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 2rem;
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
}

.desktop-compare__arena {
  position: relative;
  min-height: 60vh;
  border-radius: 1.5rem;
  background: radial-gradient(ellipse at 50% 30%, rgba(11, 11, 24, 0.95) 0%, transparent 55%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem;
  overflow: hidden;
}

.desktop-compare__stage {
  position: relative;
  height: 32rem;
}

.desktop-compare__fighter-slot {
  position: absolute;
  transform: translate(-50%, -50%);
}

.desktop-compare__fight-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 2rem;
  border-radius: 9999px;
  font-size: 1rem;
  font-weight: 700;
  color: #0F172A;
  background: linear-gradient(135deg, #7C4DFF, #39D2F6);
  border: none;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.desktop-compare__fight-btn:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(124, 77, 255, 0.45);
  transform: translateY(-1px);
}

.desktop-compare__fight-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.desktop-compare__fight-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.desktop-compare__sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.desktop-compare__score-row {
  display: grid;
  grid-template-columns: 2rem 1fr 3rem 3rem;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

@media (max-width: 767px) {
  .desktop-compare {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mobile-compare-arena__flash,
  .compare-flash {
    animation: none;
  }
}
```

- [ ] **Step 3: Verify lint**

Run: `npm run lint`
Expected: 0 new errors.

---

### Task 10: Align compare background in `vibes-3d-maestoso.css`

**Files:**
- Modify: `styles/vibes-3d-maestoso.css`

- [ ] **Step 1: Remove or override compare-specific background overrides that conflict with `#06060E`**

Find rules like `.mobile-compare-arena` background overrides or `.compare-space-page` gradient overrides in this file and replace them with:

```css
.compare-space-page,
.compare-space-page > * {
  background-color: #06060E;
}
```

If the file does not contain such overrides, skip this step.

- [ ] **Step 2: Verify lint**

Run: `npm run lint`
Expected: 0 new errors.

---

### Task 11: Verification

- [ ] **Step 1: TypeScript check**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 2: Linter**

Run: `npm run lint`
Expected: 0 new errors.

- [ ] **Step 3: Tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5: Visual regression checks**

Open `/compare` with 2-5 tools selected and verify:
- Mobile (360/375/390/414/430 px): arena readable, footer above bottom nav, CTA tappable, matrix scrolls.
- Desktop (≥768 px): two-column layout, arena and sidebar aligned.
- Reduced motion enabled: no shake/flash/confetti.

---

## Spec coverage self-check

| Spec requirement | Task |
|------------------|------|
| Shared types/utilities extracted | Task 1 |
| Extensible `ToolFighter` default variant | Task 2 |
| Responsive `ToolBattleView` wrapper | Task 3 |
| Mobile arena HUD/fighter grid/CTA/footer | Task 4 |
| Mobile matrix scroll indicator & contrast | Task 5 |
| Desktop two-column layout | Task 6 |
| Lightweight compare hero | Task 7 |
| Page entry uses wrapper | Task 8 |
| Coherent background, no patchwork | Tasks 9-10 |
| Build/lint/test pass | Task 11 |

## Placeholder scan

No TBD/TODO. The `variant` placeholder intentionally returns initials and is documented as a future slot.

## Type consistency

- `NormalisedTool` lives in `tool-battle-shared.ts` and is imported everywhere.
- `ToolFighter` accepts `NormalisedTool` plus boolean flags.
- `MobileCompareView` and `DesktopCompareView` share the same public props shape.
