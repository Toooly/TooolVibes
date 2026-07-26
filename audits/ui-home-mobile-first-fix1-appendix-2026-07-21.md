# FIX-1 Appendix — Mobile Discovery Hero Restoration

**Date:** 2026-07-21
**Branch:** `main @ e26f447` (post-Phase 7 revert baseline)
**Fix scope:** minimal + surgical (3 files modified, no redesign)
**Method:** root-cause-driven, regression-tested, runtime-verified on 4 viewports

---

## Root cause

In `components/home/vibe-home-v2.tsx`, `MobileHeroSolar` was wrapped in a conditional:

```tsx
{showDiscoveryHero && <MobileHeroSolar ... />}
```

The caller `app/(marketing)/page.tsx` passed:

```tsx
showDiscoveryHero={!releaseFeatures.threeD.enabled}
```

When `releaseFeatures.threeD.enabled = true` (the production default), the conditional resolved to `false`, so `MobileHeroSolar` was **never instantiated**. The `Home3DHero` (desktop 3D hero) had identical copy ("Curatela indipendente / Trova il tool giusto...") but was rendered as a sibling and hidden via CSS at ≤767px (`.home-3d-hero { display: none !important; }`, app/globals.css:32260-32270).

**Result on mobile:** the first visible section became `MobileSpotlight`, with **no value proposition, no primary CTAs, no solar routes** above the fold. The user's reported "sparite un sacco di sezioni" was real.

---

## Files modified

| File | Lines | Change |
|------|------:|--------|
| `components/home/vibe-home-v2.tsx` | +7 -4 | Removed `showDiscoveryHero` prop + default. `<MobileHeroSolar>` rendered unconditionally. |
| `app/(marketing)/page.tsx` | +5 -1 | Removed `showDiscoveryHero={!releaseFeatures.threeD.enabled}` from `<VibeHomeV2>` invocation. Added explanatory comment. |
| `__tests__/components/home/vibe-home-v2.test.tsx` | +133 | 11 new FIX-1 regression tests added. |

---

## Behavior before

- `releaseFeatures.threeD.enabled = true` (default)
- `<MobileHeroSolar>` NOT mounted
- Mobile first visible section = `<MobileSpotlight>` at y=66
- No CTA "Esplora i tool" above-the-fold
- No CTA "Guarda il Radar" above-the-fold
- No solar routes (orbital/grid) accessible
- Page body text: "Salta al contenuto / TOOOLVIBES / TOOL DELLA SETTIMANA / Blink / Vibe coding..."
- scrollHeight: ~3740px on 390 viewport

## Behavior after

- `releaseFeatures.threeD.enabled = true` (UNCHANGED)
- `<MobileHeroSolar>` ALWAYS mounted
- Mobile first visible section = `<MobileHeroSolar>` at y=66 (955px tall on 390)
- CTA "Esplora i tool" present at (390, 483, 173×48, href=/archivio)
- CTA "Guarda il Radar" present at (390, 483, 173×48, href=/radar)
- 5 solar routes (orbit + grid, total 10 links in DOM) accessible
- MobileSpotlight still present after hero (1022-2068 on 390)
- Page body text: "Salta al contenuto / TOOOLVIBES / CURATELA INDIPENDENTE · MENO RUMORE, PIÙ SEGNALE / Trova il tool giusto prima che il rumore scelga per te. / Esplora una selezione ragionata..."
- scrollHeight: ~4700px on 390 viewport (≈+960px from hero addition)

---

## Viewport verification matrix

| Viewport | scrollH | Hero visible | Esplora CTA | Radar CTA | Spotlight | Placement | Method | Footer | BottomNav | Errors |
|---------:|--------:|:------------:|:-----------:|:---------:|:---------:|:---------:|:------:|:------:|:---------:|:------:|
| 360×800 | 4734 | ✓ (66, 360×996) | ✓ (/archivio) | ✓ (/radar) | ✓ (1062) | ✓ (2105) | ✓ (2386) | ✓ (3538) | ✓ (724) | 0 |
| 375×812 | 4679 | ✓ (66, 375×939) | ✓ (/archivio) | ✓ (/radar) | ✓ (1005) | ✓ (2050) | ✓ (2331) | ✓ (3483) | ✓ (736) | 0 |
| 390×844 | 4697 | ✓ (66, 390×955) | ✓ (/archivio) | ✓ (/radar) | ✓ (1022) | ✓ (2068) | ✓ (2349) | ✓ (3501) | ✓ (768) | 0 |
| 430×932 | 4664 | ✓ (66, 430×974) | ✓ (/archivio) | ✓ (/radar) | ✓ (1041) | ✓ (2092) | ✓ (2341) | ✓ (3468) | ✓ (856) | 0 |

All 4 viewports: section order preserved (hero → spotlight → placement → method → footer). Footer reachable via scroll. No console errors.

---

## Regression test added

`__tests__/components/home/vibe-home-v2.test.tsx` — added `FIX-1` describe block with **11 tests**:

1. `FIX-1: MobileHeroSolar (v-discovery-stage) e' SEMPRE montato, time-to-value` — primary invariant
2. `FIX-1: MobileHeroSolar e' SEMPRE montato, layout legacy` — layout independence
3. `FIX-1: heading principale (h1) presente dentro il discovery stage` — content presence
4. `FIX-1: CTA 'Esplora i tool' presente e raggiungibile` — href guard
5. `FIX-1: CTA 'Guarda il Radar' presente e raggiungibile` — href guard
6. `FIX-1: 5 solar routes accessibili (almeno 5 link totali tra grid + orbit)` — content presence
7. `FIX-1: MobileSpotlight resta presente dopo il discovery stage` — no section dropped
8. `FIX-1: NativePlacement resta presente dopo lo spotlight` — no section dropped
9. `FIX-1: MobileMethodSteps resta presente` — no section dropped
10. `FIX-1: ordine sezioni discovery -> spotlight -> placement -> method` — composition order preserved
11. `FIX-1: prop showDiscoveryHero NON e' piu' nel type/contract` — contract guard via static file scan

**Test result:** 18/18 PASS (was 7/7 before, +11 new)

---

## Test results

```
$ bun ./node_modules/.bin/tsc --noEmit
(exit 0, no output)

$ bun ./node_modules/.bin/vitest run __tests__/components/home/vibe-home-v2.test.tsx
 ✓ __tests__/components/home/vibe-home-v2.test.tsx (18 tests) 211ms
 Test Files  1 passed (1)
      Tests  18 passed (18)

$ bun ./node_modules/.bin/vitest run __tests__/components/ui/
 ✓ core-primitives.test.tsx (22 tests) 359ms
 ✓ overlay-primitives.test.tsx (12 tests) 353ms
 Test Files  2 passed (2)
      Tests  34 passed (34)
```

### Pre-existing failures (NOT caused by FIX-1)

Full vitest run shows 12 test failures across `tests/design-system/{token-contract,typography-contract}.test.ts`, `__tests__/styles/home-time-to-value-contract.test.ts`, `__tests__/scripts/runtime-contract.test.ts`. **These all fail on the baseline (e26f447) WITHOUT FIX-1** — they are pre-existing failures related to runtime/contrast/typography env issues, unrelated to this fix.

---

## What was NOT changed

- ❌ NO redesign of Home
- ❌ NO modification to `threeD.enabled` config
- ❌ NO modification to `Home3DHero` (still hidden on mobile via CSS, visible on desktop)
- ❌ NO modification to Home3DHero copy
- ❌ NO modification to MobileHeroSolar content
- ❌ NO modification to other routes
- ❌ NO new primitives/components
- ❌ NO CSS additions
- ❌ NO token changes

The fix is purely: **remove the conditional wrapper that was wrongly linking `MobileHeroSolar` rendering to `threeD.enabled`**.

---

## Files impacted by the fix

```
M  app/(marketing)/page.tsx                        (6 changes)
M  components/home/vibe-home-v2.tsx                (11 changes)
M  __tests__/components/home/vibe-home-v2.test.tsx (133 additions)
```

Total: **145 insertions, 5 deletions** across 3 files.

---

## Device check pending

Awaiting user device verification before proceeding to redesign or any other route work.

---

## Screenshot artifacts

`audits/home-runtime-step2-2026-07-21/`:
- `fix1-verify-360-full.png`
- `fix1-verify-375-full.png`
- `fix1-verify-390-full.png`
- `fix1-verify-430-full.png`

All 4 viewports verified post-fix.
