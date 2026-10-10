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

Local Node 22.23.1. Existing development-only temporal-density fixture is explicitly enabled and visibly labelled `QA FIXTURE`; it is never production data. Browser-only QA session uses fictional identity and localhost endpoints; remote workspace requests are intercepted. Safari live is a reference check, not evidence of changes being deployed.

## Passes B–F

Implementation and final verification results are appended after the local candidate is validated.
