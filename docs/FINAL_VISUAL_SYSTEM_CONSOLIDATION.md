# TooolVibes — Final Visual System Consolidation

Status: Phase 7 complete — production verified
Started: 2026-07-28
Starting commit: `bcd69e4` (`main`, clean and aligned with `origin/main`)
Production: `https://tooolvibes.eu`
Worker: `tooolvibes` in Cloudflare account `ffacd11bfafdca87d540a6c5fbe89120`

This is the durable source of truth for the final visual consolidation. It is
updated at the end of every phase. Product behavior, data contracts, Supabase,
authentication, search, save, compare, collections, monetization, Product Hunt,
SEO and Cloudflare/OpenNext behavior remain outside the visual-change boundary.

## Canonical system

The only accepted active public visual generation is:

- dark editorial Command Center shell;
- warm-ivory Decision Desk surfaces used only when they clarify reading or
  decision work;
- semantic/component tokens owned by `styles/tokens.css`;
- Anton for monumental/navigation display, Fraunces for editorial statements,
  Inter for interface, metadata and body copy;
- opaque surfaces, restrained violet/cyan/gold accents, visible focus and
  reduced-motion support;
- one conceptual information model across mobile, tablet and desktop.

The canonical shell owners are `CommandBar`, `MobileTopBar`,
`MobileBottomNav`, `SiteFooterV2` and the route-owned editorial components.

## Phase 0 — preflight and baseline

### Repository state

- Branch: `main`
- Starting HEAD: `bcd69e4`
- Working tree at start: clean
- Rollback tag available: `pre-sol-definitive-ui-rebuild`
- Initial deployed snapshot documented at Worker version
  `56f0be35-32fa-4fb8-9b08-f4e17637bd09`; the immediate pre-release production
  version was `007801a0-9acf-406c-910a-f0e1b8954195`.

### Baseline validation

| Check | Result |
| --- | --- |
| Style ownership | Passed |
| TypeScript | Passed |
| ESLint, zero warnings | Passed |
| Focused UI tests | 103 passed, 2 skipped |
| Known stale tests | Removed with the retired B40 Home generation |
| Full test suite, pre-deploy | 111 files: 110 passed, 1 skipped; 981 tests: 971 passed, 10 skipped; 0 failed |
| Next production build, pre-deploy | Passed; 53 pages generated |

### Current-run production evidence

Accepted viewport screenshots were captured after navigation and hydration for
the 12 primary routes at 390×844, 1024×768 and 1440×1000. Radar loading and
resolved states were captured separately. The current production matrix has:

- one `main` landmark on every route;
- zero horizontal overflow in all 36 route/viewport observations;
- truthful Radar unavailability/resolved behavior without fabricated data;
- one delayed mobile Collections stream that was recaptured after its real
  heading and collection content resolved.

Evidence root:
`audits/final-visual-system-consolidation-2026-07-28/baseline/production/`

### Active visual generations

| Generation | Evidence | Decision |
| --- | --- | --- |
| Canonical `--tv-*` editorial system | `styles/tokens.css`, current shell and definitive route owners | **Keep** |
| Maestoso/3D legacy foundation | `styles/vibes-3d-maestoso.css`, historical `v-*` consumers | **Residual debt: inactive for the rebuilt Radar; reduce only after separate consumer trace** |
| Global historical UI layer | historical route rules in `app/globals.css` | **Legacy root token owner removed; residual inactive rules remain isolated debt** |
| Premium/brand disguise layer | `styles/shell.css`, `styles/brand-primitives.css`, `styles/premium-motion.css` | **Dead `styles/buttons.css` removed; active shell behavior retained** |
| Route-specific definitive sheets | Home, Archive, Tool Detail, Compare, Radar, public routes | **Keep, then trim to sole ownership** |
| Generic `NativePlacement` family | four variants of one generic rectangle | **Replace** |
| Split Radar art directions | Home preview, mobile view and desktop view | **Merge into one information and state grammar** |

## Keep / Migrate / Merge / Delete inventory

### Keep

- `styles/tokens.css` as the sole visual-token owner.
- `styles/release-entry.ts` as the explicit cascade contract.
- `components/ui/section-header.tsx`, `route-marker.tsx` and active
  loading/empty/error primitives.
- `components/directory/canonical-tool-card.tsx` as the public presentation
  card. It remains separate from workspace `components/tools/tool-card.tsx`.
- Current route data, copy, actions and information architecture.
- Command Bar/mobile shell/fixed-surface contracts.

### Migrate

- Active legacy aliases in `app/globals.css` to semantic `--tv-*` consumers.
- Active public `premium-*`, `brand-*`, `v-*` selectors to their route or
  component owner.
- Partner call sites to four purpose-built editorial formats.
- Home Radar preview and full Radar responsive views to shared state,
  identity, signal and provenance primitives.
- Remaining arbitrary public-route colours, radii and motion values.

### Merge

- Loading, empty, error, missing-token and stale Radar grammar.
- Repeated identity/status/score/disclosure markup with multiple real public
  consumers.
- Responsive trees that express the same content and actions.
- Public secondary-route shell and legal/editorial framing where ownership is
  currently duplicated.

### Delete

- `NativePlacement` implementation and its obsolete styles after migration.
- Retired Home/Radar/Tool Detail/Catalog visual generations after import
  tracing.
- Dead aliases, gradients, animations, duplicated responsive markup, emergency
  overrides and stale generation comments.
- Obsolete visual QA documentation only when superseded evidence is complete;
  historical release evidence needed for rollback is retained.

## Route and CSS ownership

| Surface | Functional/visual owner |
| --- | --- |
| Global tokens | `styles/tokens.css` |
| Cascade entry | `styles/release-entry.ts` |
| Shared desktop/mobile shell | `styles/command-bar.css`, `mobile-top-bar.css`, `mobile-bottom-nav.css`, shell components |
| Home | `components/home/definitive-home.tsx`, `styles/definitive-home.css` |
| Archive | `components/archive/definitive-archive.tsx`, `styles/archive-v4.css` |
| Tool detail | `components/tool-detail-final/**`, `styles/tool-detail-final.css` |
| Radar | `components/radar/radar-experience.tsx`, `lib/radar/radar-ui-model.ts`, `styles/radar.css` |
| Compare | `components/tools/tool-battle-view.tsx` and responsive owners, `styles/compare.css` |
| Shortlist | `components/tools/mobile-shortlist-board.tsx`, `shortlist-board.tsx`, route-owned styles |
| Collections | collection index/detail owners plus their route namespaces |
| Posts/article | route owners plus `styles/public-routes.css` |
| Account | `components/account/**`, `styles/account.css` |
| Affiliates/legal/secondary routes | route owners plus `styles/public-routes.css` |
| Monetization | placement data/visibility logic plus the new canonical partner family |

`app/globals.css` is currently both foundation and historical visual warehouse;
that is the largest ownership defect. `styles/shell.css` also contains a high
number of `!important` rules that restyle older component contracts globally.

## Known visual and structural defects

1. The active public system now has a single root token owner, but inactive
   historical CSS remains in the Maestoso/global sheets and needs a separately
   scoped consumer trace before deletion.
2. Some route naming still describes obsolete mobile-only generations even
   when the component owns all viewports; renaming it would add churn without
   changing runtime ownership.
3. No known visual or structural defect blocks the final release.

## Phase 1 — canonical foundations

- Moved the full legacy `:root` declaration block out of `app/globals.css`
  into a documented compatibility section in `styles/tokens.css`, preserving
  values exactly.
- Consolidated duplicate responsive root properties.
- `app/globals.css` no longer declares `:root`; the ownership checker now
  rejects future global custom-property declarations on `:root`, `html` or
  `body`.
- Migrated the new partner family to semantic/component tokens. Only two
  purpose-specific partner tokens were added.
- `styles/buttons.css` was confirmed unreferenced and removed.

Validation: style ownership, TypeScript and whitespace checks passed.

## Phase 2 — editorial partner formats

- Replaced the generic `NativePlacement` rectangle with four explicit
  component anatomies: `FeaturedPartner`, `PartnerToolCard`,
  `ContextualPartnerBlock` and `PartnerCollectionModule`.
- Public rendering now requires `visible`, `status: "ready"`, real partner
  identity/link and an editorial relevance statement.
- All current `reserved`/`planned` inventory therefore disappears cleanly from
  public routes while remaining intact for administration and sales.
- Migrated Home, Archive, article inline/sidebar and collection-detail call
  sites; removed empty wrappers and the obsolete global/archive overrides.
- External partner CTAs use `rel="sponsored noopener noreferrer"`. Existing
  real affiliate CTAs were aligned to the same disclosure contract.

Validation: 12 focused monetization tests, TypeScript, ESLint and style
ownership passed.

## Phase 3 — one truthful Radar

- Added `lib/radar/radar-ui-model.ts` as the single UI resolver for
  `loading`, `live`, `stale`, `empty`, `missing-token` and `error`.
- Home and `/radar` now render `RadarInstrument` from the same responsive
  component tree and consume one Product Hunt query per range.
- Removed the post-hydration viewport switch, separate mobile canvas,
  duplicated desktop nodes/table fetch consumers and stale-as-live copy.
- Sweep/live pulse only animate in a genuinely live state. Stale data remains
  visible with its original UTC timestamp, an `ULTIMA SYNC` label and manual
  refresh. Error has retry on every viewport.
- Period and Radar/Table controls remain native, keyboard reachable and cache
  preserving. The hidden-signal rewarded action is preserved.
- The E2E fixture now satisfies the production payload type and declares
  `source` and `stale`; it remains test-only.

Validation: 23 focused Radar tests passed, including the six-state resolver,
query dedup/cache, view/range behavior and axe structural checks.

## Phase 4 — primary route closure

- Added the missing Shortlist `h1` and named landmark plus a regression test.
- Removed nested Posts listing shells that duplicated horizontal padding.
- Normalized accessible `loading` status semantics across Archive, Tool
  Detail, Compare, Shortlist and Collections.
- Connected Affiliati validation copy to fields and live regions; success and
  error announcements are now explicit.
- Kept Archive, Tool Detail, Compare, Collections, Posts, Account and
  Affiliati data/actions unchanged.

Validation: TypeScript, targeted ESLint and 40 focused route tests passed.

## Phase 5 — legacy deletion

Removed confirmed unreferenced or superseded generations:

- retired Home v2 and its four mobile/helper components and stale contracts;
- old Radar switch, mobile view/canvas, desktop composition/nodes/table/canvas
  and their superseded tests;
- generic `NativePlacement`;
- unreferenced Product Hunt ranking, canonical hero, carousel, separator,
  skeleton and button stylesheet.

At the current tracked diff boundary this removes 6,979 lines while adding
1,182 lines, before counting new untracked implementation/test/documentation
files. No dependency was removed without a separate package consumer audit.

## Phase 6 — responsive and build validation

Phase 6 is complete locally and is recorded as a pre-deploy checkpoint. This
section does not claim a commit, push, Worker version or production promotion.

### Deterministic Radar QA fixture

The deterministic Radar payload is explicitly test-only:

- it is returned only when `NODE_ENV === "development"` and
  `TOOOLVIBES_RADAR_QA_FIXTURE=1`;
- its payload source is `qa-fixture`;
- the UI state is labelled `QA FIXTURE` and is not animated or described as a
  live Product Hunt feed;
- the local E2E configuration refuses fixture-backed runs against a non-loopback
  origin.

Fixture screenshots are therefore local visual evidence, not production-data
evidence and not proof of a deployed state.

### Responsive matrix

The final local matrix covers eight deliberate viewports:

- 360×800
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1280×900
- 1440×1000
- 1920×1080

Ten route families were inspected at all eight sizes: Archive, Tool Detail,
Shortlist, Compare, Account, Collections, Collection Detail, Posts, Article and
Affiliati. Home and Radar each have a separate fixture-backed run across the
same eight viewports, plus focused missing-token/table/fold captures where
needed.

Evidence root:
`audits/final-visual-system-consolidation-2026-07-28/final/local/`

### Automated closure

| Check | Pre-deploy result |
| --- | --- |
| Complete test files | 111 total: 110 passed, 1 skipped, 0 failed |
| Complete test cases | 981 total: 971 passed, 10 skipped, 0 failed |
| Next production build | Passed; 53 pages generated |
| TypeScript | Passed |
| ESLint, zero warnings | Passed |
| Style ownership | Passed |
| Diff whitespace | Passed |

Historical references to the retired failing Home-generation contracts are no
longer active release blockers; the complete current suite has zero failures.

## Phase 7 — release and production verification

- Committed the product implementation as `ebf47a8` and the durable visual
  evidence as `ac03b7d`, then pushed both directly to `origin/main`.
- Made the OpenNext path reproducible by declaring the native Next standalone
  output in repository configuration; no local `node_modules` patch is needed.
- Rebuilt the complete 53-page Next application and the OpenNext Worker
  artifact successfully.
- Confirmed the active Wrangler profile is authenticated as
  `staff@elevianutrition.eu` in account
  `ffacd11bfafdca87d540a6c5fbe89120`.
- Uploaded and promoted Worker version
  `5b068a5d-591c-4d6a-a986-770f4d29ffc3` to 100% of traffic on the historical
  Worker `tooolvibes`. Deployment ID:
  `cda17998-b786-4d19-88ad-2bd5d956ccf0`.
- Verified `https://tooolvibes.eu` after hydration at 390×844, 1024×768 and
  1440×1000 on both Home and Radar: one `main`, one H1, zero horizontal
  overflow, no QA fixture copy, live Product Hunt provenance, functional
  Radar/Table switching and no browser-console warnings or errors.
- Confirmed HTTP 200 with the OpenNext runtime header from both
  `https://tooolvibes.eu` and the historical
  `https://tooolvibes.staff-ffa.workers.dev` endpoint.

Production evidence:
`audits/final-visual-system-consolidation-2026-07-28/final/production/`

## Phase plan

1. Canonical foundations: migrate the aliases and shared primitives required by
   active public owners; tighten ownership checks.
2. Monetization: introduce the four editorial partner formats, migrate all
   call sites and remove `NativePlacement`.
3. Radar: unify state and information grammar, add an intentional tablet
   composition and deterministic QA fixture that cannot ship in production.
4. Primary routes: close semantic/responsive gaps without changing behavior.
5. Legacy deletion: trace imports, delete retired owners and reduce the cascade.
6. QA: **complete locally** — targeted/full checks, eight-viewport responsive
   matrix and Next production build.
7. Release: **complete** — focused commits on `main`, push, deploy to the
   pinned historical Worker and hydrated verification of `tooolvibes.eu`.

## Rollback

- Code rollback base: Git tag `pre-sol-definitive-ui-rebuild`.
- Immediate pre-consolidation code point: commit `bcd69e4`.
- Production rollback: promote the immediate pre-release Worker version
  `007801a0-9acf-406c-910a-f0e1b8954195` only if the final deployed version
  fails a future live verification.
- Do not alter DNS, the Custom Domain mapping or the separate
  `tooolvibes-security-state` Worker.

## Phase log

- 2026-07-28 — Phase 0 started: clean baseline recorded, current production
  matrix captured, initial ownership and visual-generation inventory created.
- 2026-07-28 — Phase 1 complete: canonical root ownership moved to tokens and
  guarded by the release checker.
- 2026-07-28 — Phase 2 complete: four honest partner formats shipped in code;
  empty commercial inventory no longer renders publicly.
- 2026-07-28 — Phase 3 complete: Home/full Radar unified under one state model,
  query and responsive tree.
- 2026-07-28 — Phase 4 complete: route semantics, loading feedback and
  Affiliati form accessibility closed without behavior changes.
- 2026-07-28 — Phase 5 complete: confirmed dead/superseded visual generations
  deleted.
- 2026-07-28 — Phase 6 complete locally: QA fixture explicitly labelled,
  10-route matrix plus Home/Radar verified across eight viewports, complete
  test suite green and 53-page Next production build passed.
- 2026-07-28 — Phase 7 complete: commits pushed to `main`, Worker version
  `5b068a5d-591c-4d6a-a986-770f4d29ffc3` deployed at 100% and
  `tooolvibes.eu` verified live without console or responsive defects.
