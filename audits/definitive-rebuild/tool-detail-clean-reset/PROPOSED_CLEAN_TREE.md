# Tool Detail — Proposed Clean Tree (2026-07-25)

Target state after the reset, **before any visual mockup-driven rebuild**. The
route receives a single new owner and a single isolated namespace. Visual
work is paused until the five binding mockups are delivered.

---

## 1. New owner

**One** new owner for the page:

```
components/tool-detail/
  tool-detail-final-page.tsx          (server component, replaces the route file)
  tool-detail-final-cta-bar.tsx       (client component, replaces tool-detail-cta-bar.tsx)
  tool-detail-final-identity.tsx      (server, section A)
  tool-detail-final-score.tsx         (server, section B)
  tool-detail-final-rationale.tsx     (server, section C)
  tool-detail-final-decision-nav.tsx  (client, section D)
  tool-detail-final-product-info.tsx  (server, section E)
  tool-detail-final-signal.tsx        (server, section F)
  tool-detail-final-alternatives.tsx  (server, section G container)
  alternative-decision-card.tsx       (client, single alternatives card — owns `.alt-card*`)
  tool-detail-final.css               (one stylesheet, namespace `.td-final-*`)
```

Why split per section: the new page reads as **a composition of 7 owner
components** (one per binding section) so the mockup can map 1:1 to a
component without the page file doing everything.

---

## 2. Single isolated namespace

All new selectors in `tool-detail-final.css` must use the prefix `.td-final-*`.
No class outside this file may match `.td-final-*` selectors. No selector
inside this file may match anything else (except where it consumes
shared global tokens).

Forbidden in the new file:
- `.ar4-*` selectors (or any Archive v4 class)
- `.premium-button*` (use the shared `premium-button` system or a new
  button class, not a legacy one)
- `.tool-detail-*` (legacy namespace; deleted)
- `.home-*` (Home v4 namespace)
- `.internal-page*` / `.internal-tool-page*` (legacy wrappers)
- `.page-shell` (root layout utility; do not extend from inside the route)
- any `!important`

---

## 3. Component tree (after reset)

```
app/(marketing)/toools/[slug]/page.tsx                [server, leaf import only]
  └── ToolDetailFinalPage
        ├── <section class="td-final-identity">  → ToolDetailFinalIdentity (server)
        │     └── <ToolDetailFinalCtaBar>            (client) — Save/Compare/external
        ├── <section class="td-final-score">     → ToolDetailFinalScore    (server)
        ├── <nav     class="td-final-decision-nav">  → ToolDetailFinalDecisionNav (client)
        ├── <section id="td-final-rationale"      class="td-final-rationale">  → ToolDetailFinalRationale
        ├── <section id="td-final-product"       class="td-final-product">     → ToolDetailFinalProductInfo
        ├── <section id="td-final-signal"         class="td-final-signal">     → ToolDetailFinalSignal
        └── <section id="td-final-alternatives"   class="td-final-alternatives">  → ToolDetailFinalAlternatives
              └── <AlternativeDecisionCard> x 3
```

Section IDs are public anchors for the decision nav and the deep-link to
alternatives.

---

## 4. Reuse matrix (binding)

| Concern | Reuse? | Where |
|---|---|---|
| `computeEditorialScore` (8.4 for Blink) | YES | `lib/data/editorial-score.ts` |
| `deriveTrend`, `deriveVotes`, `deriveScoreDimensions`, `buildAlternativeWhy` | YES | `lib/data/tool-detail-derivation.ts` |
| `useToolWorkspaceStore` + `MIN_COMPARE_TOOLS` / `MAX_COMPARE_TOOLS` | YES | `lib/stores/tool-workspace-store.ts` |
| `ShortlistToggle` / `CompareToggle` icons (their internal mechanics only) | YES (logic only) — render through our own buttons | `components/tools/` |
| `premium-button` system primitives (logic in `components/ui/premium.tsx`) | YES — but wrap into `.td-final-cta--*` style | shared |
| Shell: `MobileTopBar`, `MobileBottomNav`, `CommandBar`, `SiteFooterV2` | YES (unchanged) | `app/(marketing)/layout.tsx` |
| `PageTransition` wrapper | YES (unchanged) | `app/(marketing)/layout.tsx` |
| `AccountProvider` / `DiscoveryPersistenceProvider` | YES (unchanged) | `app/(marketing)/layout.tsx` |
| Avatar / favicon fallback logic | YES — re-implement in `.td-final-identity` (no reuse of `DirectoryToolGlyph`) | inline |
| SEO (`generateMetadata`, `generateStaticParams`) | YES — keep on the new page file | page.tsx |

---

## 5. Forbidden reuse (must NOT appear in the new code)

| Item | Why forbidden | Where it lives today |
|---|---|---|
| `ArchiveV4ToolCard` in the alternatives flow | the card was designed for the dark Archive grid; forcing it onto ivory requires ~70 lines of override and creates the "incomplete adaptation" the user flagged | `components/archive/archive-v4-tool-card.tsx` |
| `DirectoryToolCard` (V1) | legacy | `components/directory/directory-tool-card.tsx` |
| `DirectoryToolGlyph` (V1) | legacy | `components/directory/directory-tool-glyph.tsx` |
| `PageOrbitShell` / `SectionOrbitProvider` | not used by the current page; provider is dead weight on this route | `components/app/orbital-system/` |
| `td4-*` namespace (replace entirely with `td-final-*`) | the current namespace is a V4 working name; the next pass is the final pass | `styles/tool-detail-v4.css` |
| `tool-detail-*` namespace | legacy V1 | `styles/tool-detail.css` + parts of `styles/shell.css` |
| `premium-button-*` (when wrapping the new CTAs) | the new page must use `.td-final-cta--*` so it owns its visual layer end-to-end | `components/ui/button.tsx`, `components/ui/premium.tsx` |
| Inline styles on JSX (we found two: `style={{ color: "var(--tv-accent-cyan)" }}` and the earlier `fontSize: 0.7rem` regressions) | inline styles bypass the design system and hide regressions | `app/(marketing)/toools/[slug]/page.tsx` |

---

## 6. Class naming convention (binding)

- BEM-style within the namespace: `.td-final-block`, `.td-final-block__element`, `.td-final-block--modifier`
- Tokens only for color/space/radius/font (no `rgb()` or `rem()` literals inside the new file)
- No `:where()` / `:is()` cleverness; plain selectors so the cascade is greppable
- Section-specific surface (ivory alternatives) lives under a single root selector `.td-final-alternatives`; the alternative cards do not need descendant overrides because they own their own classes

---

## 7. File-by-file reset plan (no code written yet)

| Action | File | Reason |
|---|---|---|
| DELETE | `styles/tool-detail.css` (649 lines) | No consumer on current page |
| DELETE | `components/directory/directory-tool-card.tsx` (if no consumer anywhere — to verify) | legacy V1 |
| DELETE | `components/directory/directory-tool-glyph.tsx` (if no consumer — to verify) | legacy V1 |
| REMOVE IMPORT | `app/globals.css` line that imports `styles/tool-detail.css` | drop the dead stylesheet from the cascade |
| REMOVE BLOCK | `styles/shell.css` lines ~800-851 (`.tool-detail-editorial-card`, `.tool-detail-meta-block`, `.premium-button-primary` mappings under `.marketing-shell :is(...)`) | no consumer on this route |
| KEEP (no change) | `styles/archive-v4.css` | other routes use it |
| KEEP (no change) | `styles/tool-detail-v4.css` UNTIL `td-final-*` is ready, then DELETE | current V4 work; will be replaced |
| KEEP (no change) | `components/tool-detail/tool-detail-cta-bar.tsx` UNTIL `td-final-cta-bar` is ready | current V4 work |
| REPLACE | `ArchiveV4ToolCard` import in `app/(marketing)/toools/[slug]/page.tsx` with `AlternativeDecisionCard` | the user-flagged leak |
| ADD | `components/tool-detail/alternative-decision-card.tsx` | new owner for the alternatives card on the ivory surface |
| ADD | `styles/tool-detail-final.css` | the only CSS file allowed to use `.td-final-*` |
| RENAME | `styles/tool-detail-v4.css` → `styles/tool-detail-v4.css` (DELETE after new file lands) | per atomic commit |
| MOVE | current `td4-*` blocks into new namespace, then DELETE the v4 file | single pass per section |

---

## 8. Verification steps after each reset commit

1. `bun run typecheck` — no errors
2. `bun run check:styles` — radius baseline ≤ 915 (no new arbitrary radii), no new `!important`
3. `bun run lint:ci` — 0 new errors, 0 new warnings
4. `bun run test:unit` — 24 failed / 626 passed / 12 skipped (no new failures)
5. `bun run build` — no new warnings
6. `bun run cloudflare:build` — succeeds
7. Grep verification on the route:
   - `grep -nE "td4-|tool-detail-|premium-button-" app/(marketing)/toools/\[slug\]/page.tsx components/tool-detail/` returns 0 matches after reset (except for the `td-final-*` namespace)
8. DOM verification: `curl /toools/blink | grep -oE "td4-|premium-button-primary|ar4-card" | sort -u` returns empty
9. Visual verification at 360/390/430/768/1024/1180/1280/1440 — sections render and stacking is intact (run after the binding mockups arrive)

---

## 9. Open question for the user before the reset starts

The five binding mockups (desktop 1440 / mobile 390 / tablet 768+1024 /
alternatives / interaction+fixed-surface) will define the *visual* choices
for the new owner. The structural reset above is independent of those
choices and can begin as soon as the user gives the go-ahead.
