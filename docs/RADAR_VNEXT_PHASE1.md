# Radar visual convergence — Phase 1

Starting baseline: `c422ff06cf53ae0f4becff385df3bcf11e268b1a`, branch `main`.
Local work only. No push or deployment. Human visual review gates the next phase.

## Pass A: repository, routes and design system audit

All public routes share `MarketingLayout` → `AccountProvider` / canonical discovery persistence → `MarketingChrome`. Desktop `CommandBar`, mobile `MobileTopBar` / `MobileBottomNav`, `CompareSessionDock` and `SiteFooterV2` already own navigation, safe areas and route state. Do not create another navigation owner.

| Surface | Route / component owner | Mobile → tablet → desktop composition for convergence |
| --- | --- | --- |
| Home | `/`, `DefinitiveHome`, `definitive-home.css` | Editorial cockpit + podium → wider cockpit → split editorial/graphical canvas. Reference, frozen. |
| Catalog | `/archivio`, `DefinitiveArchive`, `archive-v4.css` | Search, chip rails, filter sheet, compact cards → grid → search/filter workspace + podium/grid. Reference, frozen. |
| Tool | `/toools/[slug]`, `ToolDetailFinalPage`, `tool-detail-final.css` | Identity/actions then editorial sections → split metrics → identity/action rail and editorial canvas. Deferred. |
| Radar | `/radar`, `MemberOnlyGate`, `RadarExperience`, `radar-full.css` | Identity/telemetry/modes/instrument/context/list → larger instrument + contextual blocks → instrument and persistent intelligence rail. This phase. |
| Collections | `/collections`, `CollectionsIndex`, `collections-v4.css` | Explorer cards → two columns → editorial explorer/content workspace. Deferred. |
| Collection | `/collections/[slug]`, `CollectionDetailBodyV4` | Stack identity + contents → expanded composition → content workspace with contextual rail. Deferred. |
| Compare | `/compare`, `ToolBattleView`, `compare.css` | Candidate selection + comparison → horizontal canvas → candidates rail + comparison canvas. Deferred. |
| Saved | `/shortlist`, `ShortlistRouteGate`, `MobileShortlistBoard` | Cards/actions → library → filters + dense library. Deferred. |
| Account | `/account`, `AccountGate` → `AuthPage` or `AccountPanel` | Personal tabs/content → expanded panels → settings/navigation rail and content. Deferred. |
| Settings | `/account/settings`, `AccountSettingsPage` | Stacked settings → two columns → grouped settings panels. Deferred. |
| Auth | `/account`, `/auth/callback`, `AccountProvider` | Canonical login and callback/loading/error/success; same semantics at all widths. Frozen. |
| Guides | `/posts`, `/posts/[slug]`, guide masthead/card/article components | Editorial feed/article → split featured → editorial grid/TOC rail. Deferred. |
| Method | `/metodo`, secondary primitives + `DecisionTrack` | Steps → expanded track → editorial split. Deferred. |
| Contributions | `/contributi`, secondary primitives; `/community` redirects | Editorial intake → grouped cards → editorial split + context. Deferred. |
| Shop | `/shop`, secondary primitives | Honest preparation state → grouped offers → editorial split. Deferred. |
| Sponsors | `/sponsorizza`, partner creatives/analytics; `/affiliati`, affiliate form | Commercial identity + form → split → editorial/context workspace. Deferred. |
| Studio | `/studio`, secondary primitives | Service cards → grid → service/editorial split. Deferred. |
| Other | `/tags`, `/chi-siamo`, legal routes; `/wishlist`, `/product-hunt` redirects | Existing public/secondary/legal shells; no redesign this phase. |

Rendered baseline: 17 primary routes at 1440px, plus authenticated Radar 390px. All returned 200, including real content paths `/toools/blink` and `/collections/ai-stack-solo-founders`. Baseline captures are in the external evidence directory. Safari live on `tooolvibes.eu` was inspected for Home, Radar Local and Selected; the production session and workspace were not changed.

### State owners

Account loading/guest/authenticated/unavailable: `AccountProvider`, `AccountGate`, `MemberOnlyGate`. Catalog empty/filter states: archive controller. Saved guest/empty/populated: shortlist gate/library. Collection empty/content/entitlement: collections owners. Compare empty/insufficient/populated: comparison owner. Guide/Tool missing content: route `notFound` and route loaders. Radar loading/error/missing-token/empty/stale/live: `useProductHuntRadar` and `resolveRadarUiModel`; personalized cold/partial/useful: `buildRadarPerTe`; watch empty/presence/history-unavailable: `evaluateRadarWatchSignals`. These owners stay authoritative. Baseline default states were rendered; exhaustive state QA in this phase targets Radar only.

### Extracted language and inconsistencies

- Use existing midnight/violet surfaces, warm ivory ink, Anton display, Manrope UI; cyan for interaction/data, gold for Save/editorial semantics, fixed Radar cluster palette.
- Home editorial asymmetry, Catalog compact segmented controls, podium ranks and fine borders provide the pattern library. Secondary routes already reuse `SecondaryHero`/`SecondarySection`; preserve them.
- Existing shared foundations: `SectionHeader`, UI buttons, route markers, secondary shell, canonical cards, tokens, motion tokens, shared chrome, drawers/sheets and command search. Avoid duplicating these.
- Radar title scale does not carry Home/Catalog identity. Telemetry is visually heavy despite little information. Rail repeats source metadata and lacks cluster-specific intelligence. Rail swatches are shifted by one palette slot relative to map/chips. Trend/Per te/Watchlist are vertical lists even on desktop. History UI uses gold despite being an informational state and promises future availability without evidence. Legacy Radar stylesheet contains redundant order/material overrides; replace relevant owning rules rather than add a new global layer.
- Presentation reuse required now: `MetricStrip` for global/local/selected/personal/watch metrics, `SegmentedControl` for ranges and modes, semantic instrument/context material tokens. No speculative PageHero/FilterRail/ContextPanel wrappers.

### Frozen boundaries

No edits to `lib/radar/*`, Product Hunt normalization/API, geometry, local-focus planner, time scale, projection, hit testing, taxonomy, URL state, range filtering, auth/gates, workspace/actions, Save/Compare/Watch or analytics. Existing catalog-linked vs external CTA matrix remains intact. Home/Catalog and the rest of the site remain reference/deferred surfaces.

### QA isolation

Local Node 22.23.1. Primary final captures use real public Product Hunt day/week/month snapshots acquired on 2026-10-10, retaining their original timestamps. The existing development-only temporal-density fixture is explicitly enabled and visibly labelled `QA FIXTURE` only for state and catalog-linked CTA QA; it is never production data. Browser-only QA session uses fictional identity and localhost endpoints; remote workspace requests are intercepted. Safari live is a reference check, not evidence of changes being deployed.

## Passes B–F

### Shared system and adaptive composition

`MetricStrip` provides semantic `dl` metrics; `SegmentedControl` provides native mutually exclusive controls and accessible tabs with roving arrow/Home/End keyboard navigation. Four semantic instrument/context material tokens reuse the existing palette. No dependencies added. Segmented targets remain 44px during activation; scoped owning styles override the existing global press scale without adding `!important`.

Mobile uses one shared state tree: editorial identity → compact source/range/freshness → modes → circular instrument → local context or selected inspector → filters/legend → metrics/insights/list. Global summary rail is omitted on narrow screens; local context appears below the instrument. Selection takes focus, keeps the map mounted, and returns keyboard focus on close. The active category scrolls its own chip rail rather than every scroll ancestor. Existing shared navigation, dock and safe-area variables remain the owners of chrome clearance.

Desktop uses an approximately 63/37 instrument/context split. The rail presents the actual global or local snapshot: signal count, votes+comments, catalog presence, launch-age distribution and top current attention. Selected detail replaces context in the same sticky rail. Trend uses parallel ranking columns, Per te uses a wider card composition, Watchlist uses dense monitored rows and grouped management. Tablet retains the larger instrument with contextual blocks and multi-column mode content. No separate mobile/desktop business implementations.

The shifted rail swatches were removed. Topic/source labels now describe the actual Radar taxonomy. Age/count microbars summarize the current snapshot; they are not time-series, velocity or historical movement. Unsupported history remains explicitly unavailable. No invented chart points, recommendations, ranks or source data. Existing canonical catalog/external CTA components and URLs remain unchanged.

### Functional freeze evidence

No diff in `lib/radar/*`, API/normalization, `radar-map.tsx`, geometry/projection/local-focus/hit-testing, taxonomy, range filtering, auth/gates, stores or action implementations. Save/Compare remain Catalog actions; external signals retain source/site links and Watch only. Watch toggle, Save and Compare work in isolated QA, including dock appearance and action reachability. Durable Watch storage survives reload.

### Verification

- Chromium and WebKit: 16 requested widths, Overview → Local → Selected/close. 256 physical signal selections; wrong selection **0**, range violation **0**. Circular map; no document overflow or clipped mode/range/preview controls.
- At 390/1440: all six visual states, range switches, mode keyboard navigation, guest gate, reload persistence, light-system preference and reduced motion. Axe: all four modes, both sizes and engines, **zero violations**. No page errors or hydration errors. WebKit emits the existing unsupported `interactive-widget` viewport warning.
- Additional isolated state pass: loading, empty, error, missing token, stale; Per te cold/useful/partial; Watch empty/populated; catalog-linked Save/Compare and keyboard close/focus return; actions reachable above the real Compare Dock. Stale retains honest freshness, errors show no invented signals.
- TypeScript: passed. Targeted ESLint: passed. Radar/domain/API/gate/CTA/dock/auth replay tests: **25 files, 314 tests passed**. `git diff --check`: passed.
- `check:styles`: fails with the **same errors as the starting baseline**. Verified by rerunning the checker with the three changed foundation/owner sheets replaced in memory by their starting Git contents. Existing import-order/mockup layers, global token redefinitions and Compare `!important` debt remain outside this change.
- `check:responsive`: existing runner waits for obsolete Radar copy (`Segui i lanci`) and uses a guest context. Stopped that run; the authenticated candidate matrix above covers all 16 requested widths directly.
- `npm run build`: passed, including Next lint/type validation and all 152 static pages. Radar route bundle is **1.83 kB**, First Load JS **313 kB** (shared base 103 kB), recorded in `BUILD.log`; local font assets were used because external DNS was unavailable.

### Performance and environment limits

The domain/map React memoization and SVG geometry are unchanged. New snapshot work is bounded by the same input feed; no duplicate query, new dependency, continuous animation or additional font family. Existing images keep explicit 40×40 dimensions. Font DNS was unavailable, so local QA/build use the exact original Manrope/Anton WOFF2 assets already present in a prior local build, via a temporary Next font response cache outside the committed source.

Local development Chromium at 390: 91 SVG descendants globally / 96 locally, ~126ms global→local→selected with reduced motion and ~211ms with normal motion; post-ready CLS **0** and no long tasks during those interaction samples. Reduced animations were 0.01ms; observed animations were finite. These are automation/development samples, not production or physical-device benchmarks. Initial development auth/loading/consent lifecycle recorded CLS **0.63** and two startup long tasks; production startup remains to be measured. Remote Product Hunt thumbnails could not load in this environment; final real-data screenshots show their reserved slots. No production performance certification is implied.

### Objective remaining defects / review boundaries

1. **Pre-existing Watch hydration projection defect:** canonical account storage preserves `radarWatch`, but `renderWorkspaceStateWithoutPersist` projects working collections without `projectRadarWatchView`. Consequently the Watch view can be empty after reload even though durable data remains. The same omission is present at starting SHA `c422ff06`. The explicitly frozen store/Watch implementation was not changed. This requires a separate authorized functional fix before treating reload behavior as release-ready.
2. Existing global style checker debt remains; no new checker error introduced.
3. Initial startup CLS, physical mobile smoothness, real safe-area insets and actual Safari candidate testing remain to be validated before production release. Native Safari live was used as a production visual reference; automated WebKit validates the local candidate. No claim of deployment or physical-device acceptance.
4. Home/Catalog stayed reference surfaces. Tool detail, Collections, Compare, Saved, Account/Settings/Auth, Guides and commercial/editorial routes are inventoried and intentionally deferred. Phase 2 waits for human visual approval of Radar.

### Evidence and local commits

Evidence root: `/Users/gianmariacaltagirone/.codex/visualizations/2026/10/10/01a12687-6dca-7710-99c5-bf2179659686/radar-vnext`

- `RADAR-VNEXT-MOBILE-CONTACT-SHEET.png`
- `RADAR-VNEXT-DESKTOP-CONTACT-SHEET.png`
- `RADAR-VNEXT-RESPONSIVE-CONTACT-SHEET.png`
- Twelve requested named Chromium screenshots, corresponding WebKit captures, all 16 responsive images; state/CTA screenshots under `states/`.
- `RADAR-VNEXT-QA.json`, `states/RADAR-VNEXT-QA.json`, `RADAR-VNEXT-PERFORMANCE.json`; route audit and baseline contact sheet retained alongside them.
- Mobile screenshots use the real shell scrollport; Overview/Local start at its top, Selected follows the actual inspection scroll. Full desktop captures remain available; contact sheets crop only for review legibility.

Commits: `493e7f18` shared foundations/audit; `ff2da3f0` adaptive Radar workspace; final QA/motion/documentation commit follows. Starting SHA is at the top; ending SHA is supplied in the final handoff and `RADAR-VNEXT-HANDOFF.json` alongside browser evidence.

Files: `components/ui/{metric-strip,segmented-control}.tsx`, `components/radar/{full-radar-experience,radar-panels,radar-quick-preview,radar-snapshot-panel}.tsx`, `styles/{tokens,public-system,radar-full}.css`, `scripts/qa/radar-vnext.mjs`, this report. Existing unrelated untracked artifacts were preserved.

### Reproduce local browser QA

Run a local dev server on port 3100 with the public gate open, `TOOOLVIBES_RADAR_QA_FIXTURE=1`, and fictional localhost Supabase configuration. Use Node 22.23.1. The QA script refuses non-local origins and intercepts workspace/auth/signal requests; it never uses a production account.

```sh
RADAR_QA_SNAPSHOT_DIR=/absolute/evidence/path/snapshots RADAR_QA_OUTPUT_DIR=/absolute/evidence/path node scripts/qa/radar-vnext.mjs
RADAR_QA_STATES_ONLY=1 RADAR_QA_SNAPSHOT_DIR=/absolute/evidence/path/snapshots RADAR_QA_OUTPUT_DIR=/absolute/evidence/path/states node scripts/qa/radar-vnext.mjs
```

Omit `RADAR_QA_SNAPSHOT_DIR` only when deliberately verifying the labelled development fixture. `RADAR_QA_WIDTHS` restricts diagnostics to a subset; the release evidence used all 16 widths. Final data provenance is retained in the three snapshot JSON files.

**No push. No deployment. Stop for human visual review.**
