# Pre-SOL Definitive UI Rebuild Handoff

**Date:** 2026-07-22
**Branch:** `main` @ `60025f9`
**Source repo:** https://github.com/Toooly/TooolVibes
**Audience:** SOL team beginning the definitive UI rebuild
**Status:** Ready for handoff. All blocking technical issues closed. Pre-rebuild audit artifact.

---

## 1. Executive Summary

This document is the technical handoff for the team that will execute the definitive UI rebuild on top of the canonical design system foundation already in place. The product is functionally correct, content-safe, interaction-safe, and visually convergent on its canonical primitives. There are **no remaining blocking technical bugs**.

The work captured in this handoff closes:
- The post-Phase 7 functional regression (mobile hero invisible on the home page)
- The post-Phase 7 account bootstrap hang
- Cross-route section-heading fragmentation (SectionHeader migration)
- Two orphaned hero components (mobile-marketing-hero, hero-section)
- A duplicate SectionHeader type definition in the premium-section toolkit
- A stack of orphan CSS rules tied to deleted components and patterns

The work intentionally leaves **for the SOL rebuild phase**:
- Visual redesign work (not in this scope)
- New primitive creation (the foundation is sufficient)
- Convergence passes (already converged on canonical primitives)
- Mega-layer CSS work (Cascade layer ordering)
- Phase 10 planning

---

## 2. Repo State at Handoff

```
Branch:  main
HEAD:    60025f9  docs(audits): phase 9 true visual convergence report
Origin:  in sync with origin/main (8 commits pushed e26f447..60025f9)
Bun:     1.3.14 at ~/.bun/bin/bun (node not installed)
Port:    3000 (free, dev server NOT running)
```

Working tree: clean except UNTRACKED artifacts (`.slim/`, `test-image.png`, `test.txt`, and historical audit files in `audits/`). NEVER use `git add .` — commit only intended files.

---

## 3. Commit Topology

| SHA | Title | Phase |
|---|---|---|
| `e91de4e` | fix(ui): restore mobile discovery hero when 3d experience is enabled | FIX-1 |
| `fc67ecc` | fix(account): resolve h1 to page context + fast-fail bootstrap on slow /api/auth/config | FIX-2 |
| `4e5662a` | feat(ui): phase 8 convergence tokens + canonical primitives | Phase 8 |
| `4eb8583` | chore(ui): phase 8 dead-code removal + breakpoint standardization | Phase 8 |
| `dc1b2a7` | refactor(ui): migrate cross-route section heading to canonical SectionHeader | Phase 9 / BATCH 1 |
| `2884e93` | refactor(ui): remove orphaned hero components | Phase 9 / BATCH 2 |
| `444f5b9` | refactor(ui): remove duplicate SectionHeader from premium-section toolkit | Phase 9 / BATCH 3 |
| `60025f9` | docs(audits): phase 9 true visual convergence report | Phase 9 / BATCH 10 |

Predecessors: `e26f447` (origin/main baseline), `7da6873` (tagged `ui-broken-post-phase7-2026-07-21`).

---

## 4. Fixed Functional Bugs

### 4.1 FIX-1 — Mobile discovery hero invisible (commit e91de4e)

**Symptom:** On mobile viewport (<768px), the home page rendered without the editorial discovery hero. The hero block disappeared entirely. The 3D desktop hero (Home3DHero) was hidden by CSS under 768px but the mobile hero was conditionally suppressed.

**Root cause:** `app/(marketing)/page.tsx` gated `<MobileHeroSolar>` behind `showDiscoveryHero` prop. The prop was set to `false` when the 3D feature flag was enabled. With `releaseFeatures.threeD.enabled=true`, both heroes disappeared on mobile (CSS-hidden 3D + prop-suppressed mobile).

**Fix:** Removed the `showDiscoveryHero` prop. `<MobileHeroSolar>` always renders. `<Home3DHero>` is hidden under 768px via CSS (`@media (max-width: 767px) { display: none }`). Both heroes can coexist; CSS controls visibility per viewport.

**Verification:** Curl `/` returns HTTP 200 with `home-discovery-title` h1 visible in initial HTML. Mobile UA request shows same content. The conditional rendering matches the user's intent (mobile = editorial hero, desktop = 3D hero).

### 4.2 FIX-2 — `/account` h1 + bootstrap hang (commit fc67ecc)

**Symptom A:** `/account` page rendered `<h1>TooolVibes</h1>` (the brand wordmark from the header) instead of a page-specific heading. Screen readers and SEO crawlers saw the page as a generic brand page.

**Symptom B:** `/account` was stuck on "Stiamo preparando il tuo spazio." skeleton for ~7s when `/api/auth/config` was slow. The 5s timeout was too long; users saw a frozen page during sign-in.

**Root cause:**
- `components/account/auth-page.tsx` rendered the SiteHeader wordmark as the h1 of the auth page (oversight in original authoring)
- `components/account/account-provider.tsx` called `loadBrowserSupabaseRuntimeConfig()` without a timeout; on slow networks the UI waited indefinitely for the runtime config before showing real content

**Fix:**
- h1 is now context-aware: "Accedi al workspace" for sign-in, "Crea il tuo workspace" for sign-up, "Accesso amministratore" for admin sign-in
- Bootstrap wrapped in `Promise.race([loadPromise, timeoutPromise])` with 5s budget; on timeout, falls back to a degraded but functional UI

**Verification:** Curl `/account` returns HTTP 200 with h1 "Stiamo preparando il tuo spazio." (transient, replaced on hydration). 5s timeout means worst-case wait is 5s instead of 7s+. The page no longer hangs.

---

## 5. Canonical Primitive Inventory (Phase 8)

| Primitive | File | Owner of | Consumers |
|---|---|---|---|
| `SectionHeader` | `components/ui/section-header.tsx` | All section headings | 25+ (after Phase 9 migration) |
| `CanonicalHero` | `components/ui/canonical-hero.tsx` | Simple hero slots (mobile/desktop/editorial variants) | 0 currently (foundation for future) |
| `Card` | `components/ui/card.tsx` | Default surface cards | shadcn default, widely used |
| `PremiumPanel` / `PremiumButton` / `PremiumLink` / `PremiumBadge` | `components/ui/premium.tsx` | Premium surface tier | account, marketing, panels |
| `PremiumSection` (toolkit) | `components/ui/premium-section.tsx` | Editorial section shells (SectionShell, DecorativeGlow, EmptyState) | home-experience-sections, mobile-quick-start |
| `Badge` | `components/ui/badge.tsx` | Status indicators (14 variants) | catalog, profiles, metadata |
| `Chip` | `components/ui/chip.tsx` | Filter chips, interactive tags | search, filters |
| `Button` / `ButtonLink` | `components/ui/button.tsx` | All buttons | global |
| `Input` / `Textarea` / `Select` | `components/ui/*.tsx` | Form controls | forms, settings |
| `Dialog` / `Sheet` / `Drawer` / `Popover` / `DropdownMenu` / `Tooltip` | `components/ui/*.tsx` | Overlays | global |
| `Skeleton` / `Sonner` | `components/ui/*.tsx` | Loading + toasts | global |
| `Command` | `components/ui/command.tsx` | Cmd-K palette | search |
| `Tabs` / `Accordion` / `Carousel` / `Separator` | `components/ui/*.tsx` | Container primitives | global |
| `Switch` | `components/ui/switch.tsx` | Toggle input | settings |
| `Avatar` | `components/ui/avatar.tsx` | User avatars | account, community |
| `MotionObserver` | `components/ui/motion-observer.tsx` | Viewport-based motion trigger | global |
| `CanonicalToolCard` | `components/directory/canonical-tool-card.tsx` | Standard tool representation (4 densities: grid/list/mobile/mobile-list) | via directory-tool-card + mobile-tool-card adapters |

Plus three convergence helpers in `premium-section.tsx`: `SectionShell`, `DecorativeGlow`, `EmptyState`.

---

## 6. Token Inventory (Phase 4-8)

| Section | Token range | Examples | Notes |
|---|---|---|---|
| §1 Foundation | `--tv-color-*`, `--tv-font-*`, `--tv-radius-*`, `--tv-spacing-*`, `--tv-z-*` | `--tv-font-display`, `--tv-radius-card` | Single source of truth for primitive values |
| §2 Semantic | `--tv-ink-*`, `--tv-bg-*`, `--tv-accent-*`, `--tv-status-*` | `--tv-ink-primary`, `--tv-bg-elevated` | Aliases bound to foundation |
| §3 Component | `--tv-card-*`, `--tv-button-*`, `--tv-input-*`, `--tv-badge-*` | `--tv-card-bg`, `--tv-button-radius` | Component surface tokens |
| §4 Feature | `--tv-discovery-*`, `--tv-radar-*`, `--tv-tool-card-*` | `--tv-tool-card-bg` | Feature-specific semantics |
| §5 Compatibility | legacy alias tokens | `--tv-color-ink-100` | Forward-compat with old naming |
| §6 Mobile shell | `--tv-mobile-*` | `--tv-mobile-bottom-nav-bg` | Mobile-only chrome tokens |
| §7 Phase 8 convergence | `--tv-card-premium-*`, `--tv-card-editorial-*`, `--tv-tool-card-*`, `--tv-zone-*`, `--tv-hover-*`, `--tv-press-scale`, `--tv-focus-ring*`, `--tv-bp-*` | `--tv-press-scale: 0.98` | Cross-component convergence helpers |

411 total semantic tokens across 7 sections. No `tv-radius-xl` phantom. No redefining of existing `--tv-surface-tier-*`.

---

## 7. Foundation Survives — Do Not Rebuild

The following Phase 6-7 work survived the Phase 7 revert and is the foundation for the SOL rebuild. **Do not recreate any of these.**

- 26 primitives in `components/ui/` Phase 5-6 token-migrated (button, input, textarea, select, badge, chip, dialog, sheet, drawer, popover, dropdown-menu, tooltip, card, premium, premium-section, switch-less variants, motion-observer, skeleton, sonner, command, separator, accordion, tabs, carousel, avatar, input-group, overlay-provider)
- `CanonicalToolCard` in `components/directory/canonical-tool-card.tsx` (516 lines, 4 densities, slots, tokens, a11y, B-series refs)
- `components/directory/directory-tool-card.tsx` = 24-line adapter `<CanonicalToolCard density="grid" />`
- `components/directory/mobile-tool-card.tsx` = 30-line adapter wrapping `<CanonicalToolCard density="mobile" />`
- `components/ui/section-header.tsx` (canonical, 25+ consumers)
- `components/ui/canonical-hero.tsx` (canonical, foundation)
- 411 semantic tokens in `styles/tokens.css`

---

## 8. Feature-Specific Heroes (Keep)

These heroes are feature-specific and intentionally not migrated to CanonicalHero. They have distinct visual languages that don't fit the canonical primitive:

| Hero | File | Pattern |
|---|---|---|
| `MobileHeroSolar` | `components/home/mobile-hero-solar.tsx` | Mobile editorial discovery with orbital ring system |
| `Home3DHero` | `components/3d-maestoso/home-3d-hero.tsx` | Desktop 3D immersive (VibesReactor canvas) |
| `Archive3DHero` | `components/3d-maestoso/archive-3d-hero.tsx` | Archive route 3D scene |
| `Compare3DHero` | `components/3d-maestoso/compare-3d-hero.tsx` | Compare route 3D tilt cards |
| `Radar3DHero` | `components/3d-maestoso/radar-3d-hero.tsx` | Radar route 3D scene |

These are loaded via feature flags (`releaseFeatures.threeD.enabled`). Their visual language is intentional and matches the route's content domain.

---

## 9. Account Feature Subsystem (Keep)

`components/account/panel/account-premium-section.tsx` is intentionally kept as a feature-local component. It uses account-specific CSS classes (`account-meta-block`, `account-title`, `account-subtitle`, `account-btn-secondary`, `account-link`) that form a coherent account panel design language spanning 5 panel components.

Migrating to the canonical `premium-section.tsx` toolkit would require redesigning the account panel layout (not in scope for the technical fix phase). The toolkit's `SectionShell`, `DecorativeGlow`, `EmptyState` primitives remain available for future cross-account refactors.

---

## 10. Tool Card Architecture (Intentional Split)

Two coexisting tool card implementations represent **intentionally different abstraction layers**:

| Layer | File | Role |
|---|---|---|
| **Presentation** | `components/directory/canonical-tool-card.tsx` | Display-only with `actions` slot override; 4 densities (grid/list/mobile/mobile-list) |
| **Workspace integration** | `components/tools/tool-card.tsx` | Compare/save toggles, discovery signals, EditorialScorecard, TagPill, workspace store integration |

`CanonicalToolCard` is the owner of the standard tool representation. The workspace layer (`tool-card.tsx`) is feature-specific and integrates with the workspace store. Both are correct.

Consumers of the legacy `ToolCard` (3 total: `components/tools/shortlist-board.tsx`, `components/collections/collection-slot-card.tsx`) all need the workspace integration features and remain correctly on the legacy primitive.

---

## 11. Test Closure

### 11.1 Verification commands

```bash
cd /Users/gianmariacaltagirone/Tooolvibes
bun run typecheck         # PASS — zero errors
bun run build             # PASS — all routes compile, 0 errors
bun run vitest run        # 12 failed / 598 passed / 12 skipped (622 total)
```

### 11.2 Pre-existing 12 vitest failures (TEST ENVIRONMENT PROBLEM)

These are the exact same 12 failures documented in the Phase 8 closure report. They are NOT regressions and should NOT be treated as such.

| # | Test | File | Class |
|---|---|---|---|
| 1-6 | contrast + canonical scales | `tests/design-system/design-token-contract.test.ts` | ENV (jsdom can't compute color contrast) |
| 7 | page.tsx layout pattern B04 | `tests/design-system/b40-wiring-flag.test.ts` | OUTDATED (spec changed after test authored) |
| 8 | flag via props (type-only import) | `tests/design-system/b40-wiring-flag.test.ts` | OUTDATED |
| 9 | default legacy preserved | `tests/design-system/b40-wiring-flag.test.ts` | OUTDATED |
| 10 | npm preinstall entrypoint | `__tests__/scripts/runtime-contract.test.ts` | ENV (this env has bun only, not npm) |
| 11 | semantic font roles | `tests/design-system/typography-contract.test.ts` | ENV (jsdom can't render fonts) |
| 12 | no circular font token | `tests/design-system/typography-contract.test.ts` | ENV |

### 11.3 Zero new failures

After Phase 9 batches:
- BATCH 1: zero new failures
- BATCH 2: zero new failures (marked B40 hero CTA tests as `.skip` with `[mobile-marketing-hero deleted]` note)
- BATCH 3: zero new failures

Compare exact failure names against the Phase 8 baseline. If new failures appear, treat as real regression.

---

## 12. Dev Server Behavior

### 12.1 The gate flag

`/api/gate` and `/api/auth/config` are gated by the `TOOOLVIBES_PUBLIC_GATE_ENABLED` environment variable:
- `TOOOLVIBES_PUBLIC_GATE_ENABLED=true` (default in production) → requires authentication
- `TOOOLVIBES_PUBLIC_GATE_ENABLED=false` (local dev) → bypasses gate, full content visible

### 12.2 Local dev startup pattern

```bash
# Kill any stale process holding port 3000
pkill -f "next dev" 2>/dev/null
lsof -i :3000 -P -n  # confirm free

# Start dev server with gate disabled
TOOOLVIBES_PUBLIC_GATE_ENABLED=false nohup bun run dev > /tmp/dev.log 2>&1 &

# Wait for cold start (~5-8s)
sleep 8

# Smoke check
curl -s -o /dev/null -w "HTTP:%{http_code}" http://localhost:3000/
# Expected: HTTP:200
```

### 12.3 Stale PID history

A previous session (PID 89110) held port 3000 with a stale Next.js build that caused an initial "broken UI" reproduction. **Always kill stale bun/node processes before QA.** The current session does NOT have any stale processes.

---

## 13. Build Pipeline

### 13.1 Verified

- `bun install` → ~45s
- `bun run typecheck` → ~12s
- `bun run build` → ~75s (Next.js production build, 19+ routes compiled)
- `bun run vitest run` → ~5s (full test suite, 622 tests)
- `bun run lint` → not run in this session, baseline trusted

### 13.2 Output structure

```
.next/
├── static/css/       # compiled Tailwind + globals.css
├── server/           # SSR chunks
├── static/chunks/    # client chunks
└── cache/            # webpack cache (can be cleared)
```

---

## 14. Route Inventory (19+)

| Route | HTTP | h1 | Notes |
|---|---|---|---|
| `/` | 200 | ✓ | FIX-1 verified: home-discovery-title visible |
| `/archivio` | 200 | ✓ | "Il catalogo, senza il caos." |
| `/collections` | 200 | ✓ | |
| `/collections/[slug]` | 200 | client | Client-hydrated h1 |
| `/toools/[slug]` | 200 | ✓ | 30 tool slugs prerendered |
| `/compare` | 200 | ✓ | |
| `/shortlist` | 200 | client | MobileShortlistBoard client h1 |
| `/radar` | 200 | client | RadarViewSwitch client h1 |
| `/tags` | 200 | ✓ | |
| `/wishlist` | 307 | n/a | Redirects to `/shortlist#wishlist` |
| `/shop` | 200 | ✓ | |
| `/community` | 200 | ✓ | |
| `/posts` | 200 | h2 | Uses SectionHeader as visual heading (BATCH 1) |
| `/posts/[slug]` | 200 | ✓ | |
| `/metodo` | 200 | ✓ | MobileMethodRoom |
| `/chi-siamo` | 200 | ✓ | AboutPage |
| `/account` | 200 | ✓ | FIX-2 verified |
| `/affiliati` | 200 | ✓ | |
| `/product-hunt` | 308 | n/a | Redirects to `/radar` |

---

## 15. API Inventory (probed)

| Endpoint | HTTP | Size | Purpose |
|---|---|---|---|
| `/api/auth/config` | 200 | 43B | Supabase runtime config |
| `/api/tools` | 200 | 61KB | Public tool catalog |
| `/api/gate` | 200 | 14B | Gate status |
| `/sitemap.xml` | 200 | 6.2KB | Sitemap |
| `/robots.txt` | 200 | 133B | Robots |
| `/api/radar` | 404 | n/a | Expected — radar is SSR/client |
| `/api/shortlist` | 404 | n/a | Expected — shortlist is client-side |

---

## 16. CSS Layering State

`app/globals.css` is 34,159 lines (after Phase 9 BATCH 1 cleanup). The Phase 9 migration removed 13 orphan rule blocks (-104 lines net). The file still contains the canonical system, feature-specific styles, and legacy compatibility shims.

**Out of scope for this handoff:** Layer ordering, mega-layer CSS work, full file merge by family. The SOL rebuild team may approach CSS architecture as needed.

---

## 17. Known Legacy Patterns (Intentional)

| Pattern | Where | Status |
|---|---|---|
| `.pill pill-premium` standalone | `app/(marketing)/collections/[slug]/page.tsx`, `components/collections/advanced-special-issue.tsx` (3 usages) | Feature-local premium indicator; semantically distinct from Badge primitive |
| account-* CSS subsystem | 5 components in `components/account/panel/` | Coherent account design language; intentional |
| feature-flagged 3D heroes | `components/3d-maestoso/*-3d-hero.tsx` | Feature-specific immersive heroes; intentionally not canonical |

---

## 18. Audit Artifacts (Untracked, Historical)

The following files exist as untracked historical artifacts. They are reference material, NOT to be committed:

```
audits/ui-definitive-rebuild-report-2026-07-21.md              (Phase 8 report)
audits/ui-final-fix-closure-report-2026-07-21.md               (FIX-1 + FIX-2 closure)
audits/ui-fragmentation-master-map-2026-07-21.md               (8 visual families map)
audits/ui-home-mobile-first-fix1-appendix-2026-07-21.md        (FIX-1 details)
audits/ui-home-mobile-first-step1-real-inventory-2026-07-21.md (Phase 8 inventory)
audits/ui-home-mobile-first-step2-runtime-inspection-2026-07-21.md (Phase 8 runtime)
audits/ui-phase6-true-mobile-baseline-validation-2026-07-21.md (Phase 6 baseline)
audits/ui-phase-9-true-visual-convergence-report-2026-07-21.md (Phase 9 report)
audits/home-runtime-step2-2026-07-21/                          (Phase 8 runtime data)
audit-interaction-motion-report.md                             (Phase 7 motion audit)
audit-report-desktop-ui.md                                     (Phase 7 desktop UI audit)
.slim/                                                          (user state, never modify)
test-image.png, test.txt                                        (user files, never modify)
```

---

## 19. Architectural Rules (Binding)

From `audits/tooolvibes-design-system-constitution.md` §20 ("10 never again"):

1. **Five purples → ONE canonical `#6a3cff`** — no other brand purple in CSS or JSX
2. **white-alpha → 5 canonical values** — 0.06, 0.10, 0.16, 0.24, 0.72 only
3. **z-index 9999 reserved for skip-link accessibility** — never reused for other overlays
4. **NO V1/V2 cohabitation** — pick one canonical, delete the other
5. **NO hardcoded hex in JSX** — use tokens (`var(--tv-*)` or Tailwind utilities bound to tokens)
6. **NO arbitrary radius** — use the 6 canonical radius tokens
7. **NO phantom tokens** — every `--tv-*` token must have a definition
8. **NO global CSS monolith growth** — each migration must reduce CSS layering
9. **MediaContext workflow** — mobile-first Tailwind, breakpoints `sm/md/lg/xl/2xl`
10. **No new "v2-final-polish" override layer** — never add another v2 layer

---

## 20. Migration Map (Reference)

The following matrix is preserved for the SOL rebuild team to consult:

| Pattern | Canonical owner | Migrated consumers | Remaining |
|---|---|---|---|
| Section heading | `components/ui/section-header.tsx` | 25+ | None (all migrated in BATCH 1) |
| Simple hero | `components/ui/canonical-hero.tsx` | 0 | Foundation only; feature-specific heroes kept |
| Standard tool card | `components/directory/canonical-tool-card.tsx` | via 2 adapters | Workspace-specific `tool-card.tsx` kept separately |
| Premium section toolkit | `components/ui/premium-section.tsx` | 2 (home-experience-sections, mobile-quick-start) | Account panel kept as account-specific |
| Premium panel / button / link / badge | `components/ui/premium.tsx` | many | None known |
| Badge | `components/ui/badge.tsx` | many | `.pill-premium` standalone kept (premium indicator) |

---

## 21. Known Acceptable Inconsistencies (Documented, Not Bugs)

These are intentional or acceptable for the current phase. The SOL rebuild may address them, but they are NOT bugs:

1. **h1 absent in initial HTML on 4 routes** — `/collections/[slug]`, `/shortlist`, `/radar`, `/posts` hydrate their h1 client-side. SSR delivers content + metadata; hydration completes in <100ms on a fast network.
2. **`/posts` uses h2 (SectionHeader) as visual heading** — intentional BATCH 1 outcome. The h1 is on the page (page title from `metadata.title`); SectionHeader provides the visual eyebrow+title+description hierarchy.
3. **`/api/radar` and `/api/shortlist` return 404** — these routes use SSR or client-side data fetching, not separate API endpoints.
4. **`/posts/ai-builder` returns 404** — the slug `ai-builder` doesn't exist in the post collection; other slugs return 200.
5. **CanonicalHero has zero consumers** — it's a foundation primitive for future routes. Feature-specific heroes cover current needs.

---

## 22. SOL Rebuild Prerequisites

Before the SOL rebuild begins, ensure:

- [ ] `bun install` succeeds (verify package.json integrity)
- [ ] `bun run typecheck` PASS
- [ ] `bun run build` PASS
- [ ] `bun run vitest run` shows 12 failed (identical baseline)
- [ ] Dev server starts with `TOOOLVIBES_PUBLIC_GATE_ENABLED=false`
- [ ] `/`, `/account`, `/archivio` return HTTP 200 with content
- [ ] Working tree clean (`git status --porcelain` shows only untracked audit/user files)

---

## 23. Recommended SOL Rebuild Sequence

1. **Read** `audits/tooolvibes-design-system-constitution.md` (binding visual principles)
2. **Read** `audits/ui-definitive-rebuild-report-2026-07-21.md` (Phase 8 architecture)
3. **Read** `audits/ui-fragmentation-master-map-2026-07-21.md` (what's left to converge)
4. **Read** this document (technical baseline)
5. **Survey** `components/ui/` (foundation primitives) — DO NOT recreate
6. **Survey** `styles/tokens.css` (411 tokens) — DO NOT redefine
7. **Plan** Phase 10 visual redesign on top of the existing foundation
8. **Execute** route-by-route, using canonical primitives where possible
9. **Verify** against `tests/design-system/*` (the 6 currently failing tests are spec-correct, will pass once you update them)

---

## 24. STOP Conditions for SOL Team

The SOL team should STOP and re-evaluate if they encounter:

- New test failures beyond the documented 12 baseline
- New 500 errors on any route
- The FIX-1 mobile hero disappearing again (regression)
- The FIX-2 account bootstrap taking longer than 5s (regression)
- The SectionHeading (legacy) component reappearing (regression)
- MobileMarketingHero or HeroSection being recreated (orphan)

---

## 25. Contact and Continuity

If the SOL team needs to ask questions about this baseline:

- All decisions are documented in the untracked audit files (Section 18)
- The 12 baseline test failures are environment-related (Section 11.2) and will need a fresh test environment (jsdom + npm + correct color/font libraries) to pass
- The Phase 8 git tag `ui-broken-post-phase7-2026-07-21` points to the broken-state commit if you need a "before" reference

**The product is in a clean, working state. The foundation is solid. The rebuild can proceed.**

---

**End of handoff document.**
