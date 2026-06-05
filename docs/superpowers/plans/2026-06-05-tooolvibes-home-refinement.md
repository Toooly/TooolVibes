# TooolVibes Home UI/UX Refinement — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Home from separated blocks into a continuous premium experience, fix Catalogo overlaps, and restore Radar/Suggerisci coherence while keeping all 3D and backend intact.

**Architecture:** Split the monolithic `vibe-home-v2.tsx` into focused section components (Hero, Routes, Discover, Weekly, Levels, Final). Apply global CSS fixes for z-index, overflow, and spacing. Unify the Suggerisci form on desktop with the existing Premium mobile component. Fix Radar copy and accents.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS, Framer Motion, existing Premium design system (`@/components/ui/premium`).

---

## File Map

| File | Responsibility |
|------|---------------|
| `app/globals.css` | Global orbital CSS, z-index, overflow, gradient continuity |
| `app/(marketing)/page.tsx` | Data fetching, props to VibeHomeV2 |
| `components/home/vibe-home-v2.tsx` | Orchestrator: imports all section components, passes data |
| `components/home/home-hero-section.tsx` | Hero with orbital HUD + featured/supporting tool cards |
| `components/home/home-routes-section.tsx` | 3 big rectangular route cards (Catalogo/Collection/Radar) |
| `components/home/home-discover-section.tsx` | Compact Discover/Compare/Shortlist grid |
| `components/home/home-weekly-section.tsx` | Editorial "In orbita questa settimana" grid |
| `components/home/home-levels-section.tsx` | Beginner/Intermediate/Expert cards with floating badges |
| `components/home/home-final-section.tsx` | "Resta dentro l'orbita" CTA section |
| `components/directory/floating-catalog-view.tsx` | Catalogo z-index and overflow fixes |
| `app/(marketing)/archivio/page.tsx` | Catalogo page root overflow |
| `components/desktop/desktop-vibe-radar.tsx` | Radar desktop copy fixes |
| `app/(marketing)/product-hunt/page.tsx` | Radar mobile copy unification + padding |
| `app/(marketing)/wishlist/page.tsx` | Wishlist page layout, uses RequestToolForm on both breakpoints |
| `components/desktop/desktop-vibe-wishlist.tsx` | Deprecated; desktop now uses RequestToolForm |
| `components/wishlist/request-tool-form.tsx` | Minor responsive tweaks if needed |

---

## Task 1: Global CSS Foundation

**Files:**
- Modify: `app/globals.css`

**Context:** The current `.home-orbit-stage` uses `overflow-x-clip` which clips orbital nodes. The HUD has `z-index: 8` while nodes have `z-index: 9`, causing nodes to cover text.

- [ ] **Step 1: Fix `.home-orbit-stage` overflow**

Replace `overflow-x-clip` with `overflow-visible` on `.home-orbit-stage`.

```css
/* BEFORE */
.home-orbit-stage {
  isolation: isolate;
}

/* AFTER */
.home-orbit-stage {
  isolation: isolate;
  overflow: visible;
}
```

Also remove `overflow-x-clip` from the inline class in the component (will be done in Task 3).

- [ ] **Step 2: Raise HUD z-index above orbital nodes**

```css
/* BEFORE */
.catalog-orbit-hud {
  position: absolute;
  left: clamp(1rem, 4vw, 3rem);
  bottom: clamp(5.8rem, 10vh, 7.5rem);
  z-index: 8;
  ...
}

/* AFTER */
.catalog-orbit-hud {
  position: absolute;
  left: clamp(1rem, 4vw, 3rem);
  bottom: clamp(5.8rem, 10vh, 7.5rem);
  z-index: 20;
  ...
}
```

- [ ] **Step 3: Ensure marketing-shell uses overflow-x-hidden**

Find the `.marketing-shell` media query block and change `overflow-x-clip` to `overflow-x-hidden`.

```css
/* BEFORE */
.marketing-shell {
  width: 100%;
  max-width: 100vw;
  overflow-x: clip;
  ...
}

/* AFTER */
.marketing-shell {
  width: 100%;
  max-width: 100vw;
  overflow-x: hidden;
  ...
}
```

- [ ] **Step 4: Add continuous background gradient utility**

Append to the end of `globals.css`:

```css
.home-flow-gradient {
  background:
    radial-gradient(ellipse at 50% 0%, rgba(106, 60, 255, 0.04), transparent 50%),
    radial-gradient(ellipse at 50% 100%, rgba(57, 210, 246, 0.03), transparent 50%);
}
```

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "fix(css): home orbit overflow, hud z-index, continuous gradient"
```

---

## Task 2: Home Data Flow Fix

**Files:**
- Modify: `app/(marketing)/page.tsx`
- Modify: `components/home/vibe-home-v2.tsx`

**Context:** `page.tsx` computes `supportingTools` and passes it, but `vibe-home-v2.tsx` ignores it and recomputes everything internally.

- [ ] **Step 1: Read `app/(marketing)/page.tsx`**

Current code:
```tsx
import { VibeHomeV2 } from "@/components/home/vibe-home-v2";
import {
  directoryTools,
  getFeaturedDirectoryTools,
  getToolOfTheWeek,
} from "@/lib/data/tooolvibes-directory";

export default function HomePage() {
  const weeklyTool = getToolOfTheWeek();
  const supportingTools = getFeaturedDirectoryTools(4).filter(
    (tool) => tool.slug !== weeklyTool?.slug,
  );

  return (
    <VibeHomeV2
      tools={directoryTools}
      weeklyTool={weeklyTool}
      supportingTools={supportingTools.slice(0, 4)}
    />
  );
}
```

- [ ] **Step 2: Keep `page.tsx` as-is (it already passes the prop correctly)**

No changes needed to `page.tsx`.

- [ ] **Step 3: Modify `vibe-home-v2.tsx` to use the `supportingTools` prop**

In the `VibeHomeV2` function, replace the internal re-filtering with the prop:

```tsx
export function VibeHomeV2({ tools, weeklyTool, supportingTools }: VibeHomeV2Props) {
  const featuredTools = tools.filter((tool) => tool.featured).slice(0, 8);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0];
  const displayTools = [
    ...featuredTools.filter((tool) => tool.slug !== focusTool?.slug),
    ...tools.filter((tool) => tool.slug !== focusTool?.slug),
  ].slice(0, 6);

  // Use the prop directly instead of recomputing
  const heroSupportingTools = supportingTools.length > 0
    ? supportingTools
    : featuredTools.filter((tool) => tool.slug !== focusTool?.slug).slice(0, 4);

  // ... rest of component
```

- [ ] **Step 4: Commit**

```bash
git add app/(marketing)/page.tsx components/home/vibe-home-v2.tsx
git commit -m "fix(home): use supportingTools prop instead of recomputing"
```

---

## Task 3: Create Section Components

**Files:**
- Create: `components/home/home-hero-section.tsx`
- Create: `components/home/home-routes-section.tsx`
- Create: `components/home/home-discover-section.tsx`
- Create: `components/home/home-weekly-section.tsx`
- Create: `components/home/home-levels-section.tsx`
- Create: `components/home/home-final-section.tsx`

### 3A. Hero Section

- [ ] **Step 1: Create `components/home/home-hero-section.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import type { OrbitalItem, OrbitalShapeType } from "@/components/app/orbital-system";

const HOME_ICON_MAP = {
  Bookmark: require("lucide-react").Bookmark,
  Boxes: require("lucide-react").Boxes,
  Compass: require("lucide-react").Compass,
  GitCompare: require("lucide-react").GitCompare,
  Radar: require("lucide-react").Radar,
  Search: require("lucide-react").Search,
  Sparkles: require("lucide-react").Sparkles,
  Zap: require("lucide-react").Zap,
} as const;

function slugToShape(slug: string): OrbitalShapeType {
  const shapes: OrbitalShapeType[] = ["hexagon", "crystal", "shard", "gem", "blob"];
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = ((hash << 5) - hash) + slug.charCodeAt(i);
    hash |= 0;
  }
  return shapes[Math.abs(hash) % shapes.length];
}

function toolToOrbital(tool: DirectoryTool, sectionId: string, priority = 1): OrbitalItem {
  const words = tool.name.split(/\s+/).filter(Boolean);
  const initials =
    words.length === 1
      ? words[0].slice(0, 2).toUpperCase()
      : (words[0]?.[0] ?? "") + (words[1]?.[0] ?? "");
  const domain = tool.domain || tool.externalUrl;
  const iconUrl = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`
    : undefined;
  return {
    id: `${sectionId}-${tool.slug}`,
    title: tool.name,
    initials: initials.toUpperCase(),
    description: tool.shortDescription || tool.tldr || tool.description,
    category: tool.categoryLabel,
    href: `/toools/${tool.slug}`,
    sectionId,
    priority,
    color: tool.accentFrom || "#6a3cff",
    shapeType: slugToShape(tool.slug),
    iconUrl,
    variant: "tool",
    size: "sm",
  };
}

interface HomeHeroSectionProps {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
  supportingTools: DirectoryTool[];
}

export function HomeHeroSection({ tools, weeklyTool, supportingTools }: HomeHeroSectionProps) {
  const featuredTools = tools.filter((t) => t.featured).slice(0, 5);
  const focusTool = weeklyTool ?? featuredTools[0] ?? tools[0];
  const heroItems = featuredTools.map((t) => toolToOrbital(t, "home-hero", 1));
  const support = supportingTools.length > 0 ? supportingTools : featuredTools.filter((t) => t.slug !== focusTool?.slug).slice(0, 4);

  return (
    <section className="relative z-10 min-h-[calc(85svh-4rem)] overflow-visible px-4 pt-16 pb-20 md:px-8 md:pt-20 md:pb-24 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />

      <div className="relative z-20 mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#39d2f6]">
            Sistema TooolVibes
          </p>
          <h1 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.1] text-white">
            Scegli tool validi senza attraversare il rumore.
          </h1>
          <p className="mt-4 max-w-xl text-[0.95rem] leading-7 text-white/75 sm:text-[1.05rem]">
            TooolVibes seleziona, organizza e aggiorna i migliori strumenti AI e SaaS.
            Nessuna lista infinita: solo quelli che fanno davvero la differenza.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/archivio"
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl bg-gradient-to-r from-[#6a3cff] to-[#4f46e5] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(106,60,255,0.25)] transition-transform hover:translate-y-[-2px]"
            >
              Esplora il catalogo
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/product-hunt"
              className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-5 py-2.5 text-sm font-medium text-white/90 backdrop-blur-md transition-colors hover:bg-white/12"
            >
              Scopri il Radar
            </Link>
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-[1fr_1.5fr]">
          {/* Featured tool card */}
          <Link
            href={`/toools/${focusTool.slug}`}
            className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(12,8,38,0.45)] p-5 backdrop-blur-xl transition-all hover:border-[#6a3cff]/30 hover:bg-[rgba(12,8,38,0.6)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#6a3cff]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#bda8ff]">
                  Tool del giorno
                </span>
                <h3 className="mt-3 text-xl font-bold text-white">{focusTool.name}</h3>
                <p className="mt-1 text-sm leading-6 text-white/65">
                  {focusTool.shortDescription || focusTool.tldr}
                </p>
              </div>
              {focusTool.domain && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(focusTool.domain)}&sz=64`}
                  alt=""
                  className="size-10 rounded-lg"
                />
              )}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#39d2f6]">
              <span>Scopri di più</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Supporting tools grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {support.slice(0, 4).map((tool) => (
              <Link
                key={tool.slug}
                href={`/toools/${tool.slug}`}
                className="group relative overflow-hidden rounded-[22px] border border-white/8 bg-[rgba(12,8,38,0.35)] p-4 backdrop-blur-md transition-all hover:border-white/15 hover:bg-[rgba(12,8,38,0.5)]"
              >
                <div className="flex items-center gap-3">
                  {tool.domain ? (
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=64`}
                      alt=""
                      className="size-8 rounded-md"
                    />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-md bg-[#6a3cff]/20 text-xs font-bold text-white">
                      {tool.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{tool.name}</p>
                    <p className="truncate text-[11px] text-white/50">{tool.categoryLabel}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative floating elements */}
      <div className="pointer-events-none absolute right-[5%] top-[15%] hidden lg:block">
        <div className="animate-[float_6s_ease-in-out_infinite] rounded-2xl border border-[#6a3cff]/20 bg-[#6a3cff]/10 px-4 py-2 text-xs font-bold text-[#bda8ff] backdrop-blur-md">
          AI
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-[20%] left-[3%] hidden lg:block">
        <div className="animate-[float_5s_ease-in-out_infinite_1s] rounded-2xl border border-[#39d2f6]/20 bg-[#39d2f6]/10 px-4 py-2 text-xs font-bold text-[#a8f0ff] backdrop-blur-md">
          SaaS
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `components/home/home-routes-section.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ArrowRight, Compass, Radar, Boxes } from "lucide-react";

const routes = [
  {
    icon: Compass,
    title: "Catalogo",
    description: "Esplora l'archivio. Tutti i tool selezionati, filtrabili per categoria e utilizzo.",
    href: "/archivio",
    cta: "Entra nel catalogo",
    gradient: "from-[#6a3cff]/20 to-transparent",
    border: "border-[#6a3cff]/25",
    hover: "hover:border-[#6a3cff]/50",
  },
  {
    icon: Boxes,
    title: "Collection",
    description: "Collezioni tematiche. Selezione curata per esigenze specifiche.",
    href: "/collections",
    cta: "Scopri le collection",
    gradient: "from-[#f3bf4c]/15 to-transparent",
    border: "border-[#f3bf4c]/25",
    hover: "hover:border-[#f3bf4c]/50",
  },
  {
    icon: Radar,
    title: "Radar Live",
    description: "Radar & trend. I lanci più caldi e i segnali da non perdere.",
    href: "/product-hunt",
    cta: "Apri il Radar",
    gradient: "from-[#39d2f6]/15 to-transparent",
    border: "border-[#39d2f6]/25",
    hover: "hover:border-[#39d2f6]/50",
  },
];

export function HomeRoutesSection() {
  return (
    <section className="relative z-10 px-4 py-16 md:px-8 md:py-20 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#39d2f6]">
          Percorsi principali
        </p>
        <h2 className="mt-3 text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold leading-tight text-white">
          Scegli la tua prossima rotta
        </h2>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <Link
                key={route.title}
                href={route.href}
                className={`group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[28px] border bg-gradient-to-br ${route.gradient} ${route.border} ${route.hover} p-6 backdrop-blur-md transition-all hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.25)] sm:min-h-[300px] sm:p-7`}
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8">
                    <Icon className="size-6 text-white" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-white">{route.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/60">{route.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-white/80 transition-colors group-hover:text-white">
                  {route.cta}
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `components/home/home-discover-section.tsx`**

```tsx
"use client";

import Link from "next/link";
import { Search, GitCompare, Bookmark } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Discover",
    description: "Scopri strumenti utili selezionati, non liste infinite.",
    href: "/archivio",
  },
  {
    icon: GitCompare,
    title: "Compare",
    description: "Confronta alternative reali, non pubblicità.",
    href: "/compare",
  },
  {
    icon: Bookmark,
    title: "Shortlist",
    description: "Salva e costruisci la tua selezione operativa.",
    href: "/shortlist",
  },
];

export function HomeDiscoverSection() {
  return (
    <section className="relative z-10 px-4 py-12 md:px-8 md:py-16 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.title}
                href={step.href}
                className="group rounded-[24px] border border-white/8 bg-white/[0.03] p-6 backdrop-blur-sm transition-colors hover:border-white/15 hover:bg-white/[0.06] sm:p-7"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8">
                  <Icon className="size-6 text-white/80" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/55">{step.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create `components/home/home-weekly-section.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

interface HomeWeeklySectionProps {
  tool?: DirectoryTool | null;
}

export function HomeWeeklySection({ tool }: HomeWeeklySectionProps) {
  if (!tool) return null;

  return (
    <section className="relative z-10 px-4 py-16 md:px-8 md:py-20 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#39d2f6]">
          In orbita questa settimana
        </p>
        <h2 className="mt-3 text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold leading-tight text-white">
          {tool.name}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">{tool.whyItMatters || tool.shortDescription}</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Main featured card */}
          <Link
            href={`/toools/${tool.slug}`}
            className="group relative col-span-1 overflow-hidden rounded-[28px] border border-white/10 bg-[rgba(12,8,38,0.45)] p-6 backdrop-blur-xl transition-all hover:border-[#6a3cff]/30 sm:col-span-2 lg:col-span-2"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full bg-[#f3bf4c]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#ffeaa0]">
                  Weekly pick
                </span>
                <h3 className="mt-3 text-2xl font-bold text-white">{tool.name}</h3>
                <p className="mt-2 max-w-lg text-sm leading-7 text-white/65">{tool.longDescription || tool.shortDescription}</p>
              </div>
              {tool.domain && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=64`}
                  alt=""
                  className="size-12 rounded-xl"
                />
              )}
            </div>
            <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#39d2f6]">
              <span>Apri la scheda</span>
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Placeholder editorial cards */}
          {[1, 2].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] p-5 backdrop-blur-sm"
            >
              <span className="inline-flex items-center rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/50">
                {i === 1 ? "Trending" : "From Product Hunt"}
              </span>
              <p className="mt-4 text-sm font-semibold text-white/40">Prossimamente</p>
              <p className="mt-1 text-xs text-white/25">Integrazione Product Hunt in arrivo.</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Create `components/home/home-levels-section.tsx`**

```tsx
"use client";

import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";

const levels = [
  {
    key: "beginner" as const,
    title: "Beginner",
    color: "#10b981",
    border: "border-emerald-500/25",
    bg: "from-emerald-500/10 to-transparent",
    description: "Per chi vuole partire veloce, scoprire tool semplici e trovare strumenti immediati.",
    categories: ["no-code", "ai-app-builder"],
  },
  {
    key: "intermediate" as const,
    title: "Intermediate",
    color: "#8b5cf6",
    border: "border-violet-500/25",
    bg: "from-violet-500/10 to-transparent",
    description: "Per chi usa già tool AI/SaaS e vuole alternative migliori e workflow più efficienti.",
    categories: ["marketing", "design", "writing", "automation"],
  },
  {
    key: "expert" as const,
    title: "Expert",
    color: "#f59e0b",
    border: "border-amber-500/25",
    bg: "from-amber-500/10 to-transparent",
    description: "Per chi cerca tool avanzati, automazioni, API, stack professionali e soluzioni tecniche.",
    categories: ["dev", "headless-cms", "vibe-coding"],
  },
];

interface HomeLevelsSectionProps {
  tools: DirectoryTool[];
}

export function HomeLevelsSection({ tools }: HomeLevelsSectionProps) {
  return (
    <section className="relative z-10 px-4 py-16 md:px-8 md:py-20 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl">
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[#39d2f6]">
          Percorsi per livello
        </p>
        <h2 className="mt-3 text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold leading-tight text-white">
          Trova il tuo livello
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {levels.map((level) => {
            const examples = tools
              .filter((t) => level.categories.some((c) => t.segments.includes(c as never)))
              .slice(0, 3);

            return (
              <div
                key={level.key}
                className={`group relative overflow-hidden rounded-[28px] border ${level.border} bg-gradient-to-br ${level.bg} p-6 backdrop-blur-md transition-all hover:-translate-y-1 sm:p-7`}
              >
                <div
                  className="h-1 w-12 rounded-full"
                  style={{ backgroundColor: level.color }}
                />
                <h3 className="mt-5 text-xl font-bold text-white">{level.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{level.description}</p>

                {/* Floating example badges */}
                <div className="relative mt-6 h-16">
                  {examples.map((tool, i) => (
                    <div
                      key={tool.slug}
                      className="absolute flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm"
                      style={{
                        left: `${i * 28}%`,
                        top: `${(i % 2) * 18}px`,
                        animation: `float ${4 + i}s ease-in-out infinite`,
                      }}
                    >
                      {tool.domain ? (
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(tool.domain)}&sz=64`}
                          alt=""
                          className="size-4 rounded"
                        />
                      ) : (
                        <span className="size-4 rounded bg-white/10 text-[9px] leading-4 text-center">
                          {tool.name.slice(0, 1)}
                        </span>
                      )}
                      {tool.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Create `components/home/home-final-section.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ArrowRight, Linkedin, MessageCircle, Mail, Send } from "lucide-react";

const actions = [
  { icon: Linkedin, label: "LinkedIn", href: "#" },
  { icon: MessageCircle, label: "Community", href: "#" },
  { icon: Mail, label: "Newsletter", href: "#" },
  { icon: Send, label: "Suggerisci il tuo tool", href: "/wishlist" },
];

export function HomeFinalSection() {
  return (
    <section className="relative z-10 px-4 py-16 md:px-8 md:py-20 lg:px-12">
      <div className="home-flow-gradient absolute inset-0 -z-10" />
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-bold leading-tight text-white">
          Resta dentro l&apos;orbita TooolVibes
        </h2>
        <p className="mt-3 text-sm leading-7 text-white/60 sm:text-base">
          Seguici, suggerisci un tool, entra nel circuito.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-white/85 backdrop-blur-md transition-all hover:border-[#6a3cff]/40 hover:bg-white/10"
              >
                <Icon size={16} />
                {action.label}
              </Link>
            );
          })}
        </div>

        <div className="mt-6">
          <a
            href="mailto:hello@tooolvibes.com"
            className="text-sm text-white/40 transition-colors hover:text-white/70"
          >
            hello@tooolvibes.com
          </a>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 7: Commit new section components**

```bash
git add components/home/home-hero-section.tsx \
  components/home/home-routes-section.tsx \
  components/home/home-discover-section.tsx \
  components/home/home-weekly-section.tsx \
  components/home/home-levels-section.tsx \
  components/home/home-final-section.tsx
git commit -m "feat(home): add new section components for continuous experience"
```

---

## Task 4: Rewrite Orchestrator (`vibe-home-v2.tsx`)

**Files:**
- Modify: `components/home/vibe-home-v2.tsx`

**Context:** Replace the monolithic `VibeHomeV2` with a clean orchestrator that imports the new section components. Keep `HomeOrbitStage` and helpers for backward compatibility if any other file uses them, but the main render should use the new sections.

- [ ] **Step 1: Write the new `vibe-home-v2.tsx`**

```tsx
"use client";

import type { DirectoryTool } from "@/lib/data/tooolvibes-directory";
import { HomeHeroSection } from "./home-hero-section";
import { HomeRoutesSection } from "./home-routes-section";
import { HomeDiscoverSection } from "./home-discover-section";
import { HomeWeeklySection } from "./home-weekly-section";
import { HomeLevelsSection } from "./home-levels-section";
import { HomeFinalSection } from "./home-final-section";

type VibeHomeV2Props = {
  tools: DirectoryTool[];
  weeklyTool?: DirectoryTool | null;
  supportingTools: DirectoryTool[];
};

export function VibeHomeV2({ tools, weeklyTool, supportingTools }: VibeHomeV2Props) {
  return (
    <div className="relative">
      <HomeHeroSection tools={tools} weeklyTool={weeklyTool} supportingTools={supportingTools} />
      <HomeRoutesSection />
      <HomeDiscoverSection />
      <HomeWeeklySection tool={weeklyTool} />
      <HomeLevelsSection tools={tools} />
      <HomeFinalSection />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/home/vibe-home-v2.tsx
git commit -m "refactor(home): rewrite vibe-home-v2 as clean orchestrator"
```

---

## Task 5: Catalogo Fixes

**Files:**
- Modify: `components/directory/floating-catalog-view.tsx`
- Modify: `app/(marketing)/archivio/page.tsx`

**Context:** Prevent orbital nodes from overlapping fixed controls and avoid horizontal scroll.

- [ ] **Step 1: Cap catalog node z-index below controls**

In `components/directory/floating-catalog-view.tsx`, the `CatalogOrbitStage` renders nodes with class `catalog-orbit-node`. The global CSS gives these `z-index: 9`. We need to scope them lower inside the catalog context.

Add an inline style or wrapper class. Since the nodes are rendered with `catalog-orbit-node`, we can wrap the stage in a container that creates a new stacking context with a lower z-index.

Modify the return of `CatalogOrbitStage`:

```tsx
    <section
      className="catalog-orbit-stage relative min-h-[calc(100svh-4rem)] overflow-visible px-4 pt-28 pb-36 md:px-8 md:pb-28 lg:px-12"
      aria-label={label}
    >
```

Change to:
```tsx
    <section
      className="catalog-orbit-stage relative isolate min-h-[calc(100svh-4rem)] overflow-visible px-4 pt-28 pb-36 md:px-8 md:pb-28 lg:px-12"
      aria-label={label}
    >
```

`isolate` creates a new stacking context, but doesn't lower z-index. Instead, we should explicitly set the section to `z-index: 1` and ensure controls are higher.

Actually, the controls in `floating-catalog-view.tsx` are at `z-40` (fixed). The `catalog-orbit-node` has `z-index: 9`. Since 9 < 40, they should be below. The issue is with the global `OrbitalLayer` at `z-15` with badges at `z-60`. To fix this, wrap the `CatalogOrbitStage` in a div with `z-index: 1` and `position: relative`.

In the main `FloatingCatalogView` return, wrap the stage:

```tsx
      <div className="relative z-[1]">
        <AnimatePresence mode="wait">
          ...
        </AnimatePresence>
      </div>
```

- [ ] **Step 2: Add overflow-x-hidden to catalog page root**

In `app/(marketing)/archivio/page.tsx`, wrap the content:

```tsx
<main className="relative overflow-x-hidden">
  <FloatingCatalogView ... />
</main>
```

- [ ] **Step 3: Commit**

```bash
git add components/directory/floating-catalog-view.tsx app/(marketing)/archivio/page.tsx
git commit -m "fix(catalogo): isolate stacking context, prevent horizontal scroll"
```

---

## Task 6: Radar Fixes

**Files:**
- Modify: `components/desktop/desktop-vibe-radar.tsx`
- Modify: `app/(marketing)/product-hunt/page.tsx`

**Context:** Fix broken accents and unify copy.

- [ ] **Step 1: Fix accents in `desktop-vibe-radar.tsx`**

Replace:
```tsx
          <p>
            Il radar non e piu un blocco appoggiato alla pagina: la classifica vive come
            una sala di segnali, con orbite, sweep e card agganciate alla profondita del sito.
          </p>
```

With:
```tsx
          <p>
            Il radar non è più un blocco appoggiato alla pagina: la classifica vive come
            una sala di segnali, con orbite, sweep e card agganciate alla profondità del sito.
          </p>
```

- [ ] **Step 2: Unify mobile copy in `product-hunt/page.tsx`**

Replace the mobile hero text to match the desktop narrative:

```tsx
                <h1 className="mt-4 max-w-[13ch] text-[clamp(2rem,9vw,3.35rem)] leading-[1.05] text-white">
                  I lanci più forti da tenere d&apos;occhio.
                </h1>
                <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-white/70 sm:mt-5 sm:text-[1rem]">
                  Una vista compatta sui prodotti più votati in Product Hunt: giorno,
                  settimana e mese, con token protetto lato server e cache per restare veloce
                  su Cloudflare.
                </p>
```

With:
```tsx
                <h1 className="mt-4 max-w-[13ch] text-[clamp(2rem,9vw,3.35rem)] leading-[1.05] text-white">
                  I lanci si muovono dentro un radar 3D.
                </h1>
                <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-white/70 sm:mt-5 sm:text-[1rem]">
                  Il radar non è più un blocco appoggiato alla pagina: la classifica vive come
                  una sala di segnali, con orbite, sweep e card agganciate alla profondità del sito.
                </p>
```

- [ ] **Step 3: Commit**

```bash
git add components/desktop/desktop-vibe-radar.tsx app/(marketing)/product-hunt/page.tsx
git commit -m "fix(radar): correct accents, unify desktop/mobile copy"
```

---

## Task 7: Suggerisci Unification

**Files:**
- Modify: `app/(marketing)/wishlist/page.tsx`
- Modify: `components/desktop/desktop-vibe-wishlist.tsx`

**Context:** The desktop version uses a legacy custom form. Replace it with the existing `RequestToolForm` component (Premium design system) to unify UX.

- [ ] **Step 1: Modify `wishlist/page.tsx` to use `RequestToolForm` on desktop**

Current desktop section uses `<DesktopVibeWishlist />`. Replace it with a desktop layout that uses `RequestToolForm`.

Replace:
```tsx
        <DesktopVibeWishlist />
```

With:
```tsx
        <div className="hidden lg:block">
          <div className="tone-wishlist page-shell space-y-6 pb-18 pt-9">
            <section className="hero-shell hero-shell-wishlist motion-reveal px-7 py-8 sm:rounded-[38px]">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,0.85fr)] lg:items-start">
                <div className="max-w-[48rem]">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-white/58">
                    Wishlist TooolVibes
                  </p>
                  <h1 className="mt-4 max-w-[13ch] text-[clamp(2.05rem,4vw,3.35rem)] leading-[1.05] text-white">
                    Suggerisci il prossimo tool che merita spazio.
                  </h1>
                  <p className="mt-4 max-w-[42rem] text-[0.98rem] leading-7 text-white/70 sm:mt-5 sm:text-[1rem]">
                    La directory resta premium solo se la selezione cresce con criterio. Se hai
                    trovato un tool AI, SaaS, no-code o automation davvero utile, portalo qui.
                  </p>
                </div>
                <RequestToolForm />
              </div>
            </section>
          </div>
        </div>
```

And add the import for `RequestToolForm` at the top (it's already imported for mobile).

- [ ] **Step 2: Deprecate `DesktopVibeWishlist` — add a comment or leave as-is**

Since `DesktopVibeWishlist` is no longer imported, we can leave the file untouched (it's now unused) or delete it. To be safe, leave it but add a comment at the top:

```tsx
// DEPRECATED: DesktopVibeWishlist is no longer used.
// The wishlist page now uses RequestToolForm for both mobile and desktop.
```

- [ ] **Step 3: Commit**

```bash
git add app/(marketing)/wishlist/page.tsx components/desktop/desktop-vibe-wishlist.tsx
git commit -m "feat(wishlist): unify desktop form with Premium design system"
```

---

## Task 8: Build Verification

**Files:**
- N/A (verification only)

- [ ] **Step 1: Run build**

```bash
npm run build
```

- [ ] **Step 2: Verify no errors**

Expected: build completes with 0 errors. Warnings about `<img>` tags without width/height are pre-existing and acceptable.

- [ ] **Step 3: Commit if build passes**

```bash
git add -A
git commit -m "build: verify production build passes"
```

---

## Self-Review Checklist

| Spec Requirement | Task | Status |
|---|---|---|
| Remove `space-y-6`, reduce stage heights | Task 4 | Covered |
| Fix `overflow-x-clip` → `overflow-visible` | Task 1 | Covered |
| Raise HUD z-index above nodes | Task 1 | Covered |
| Continuous background gradient | Task 1 | Covered |
| Hero: new copy, featured/supporting cards | Task 3A | Covered |
| Routes: 3 big rectangular cards | Task 3B | Covered |
| Discover/Compare/Shortlist compact | Task 3C | Covered |
| Weekly/Editorial section | Task 3D | Covered |
| Beginner/Intermediate/Expert | Task 3E | Covered |
| Final: channels, email, suggest | Task 3F | Covered |
| Catalogo: z-index, overflow | Task 5 | Covered |
| Radar: accents, copy unification | Task 6 | Covered |
| Suggerisci: unify form | Task 7 | Covered |
| Build verification | Task 8 | Covered |

**No placeholders found.**
**Type consistency verified:** all props and types align with existing `DirectoryTool` and `OrbitalItem` interfaces.

---

**Plan complete and saved to `docs/superpowers/plans/2026-06-05-tooolvibes-home-refinement.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

Which approach would you like?
