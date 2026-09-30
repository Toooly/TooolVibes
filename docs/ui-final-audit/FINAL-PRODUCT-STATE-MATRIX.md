# FINAL PRODUCT STATE MATRIX — app/(marketing)

> Static inventory (grep + key-file reads, no runtime). Generated 2026-09-30.
> Scope: 27 `page.tsx` routes in `app/(marketing)` + key components they render.
> `unknown` = not determinable statically, needs runtime/visual check.
> Global chrome (all routes when gate open): `CommandBar` (desktop, sticky top) +
> `MobileTopBar` (sticky) + `MobileBottomNav` (fixed bottom) + `CompareSessionDock`
> (fixed, hidden on `/compare` and when 0 compare slugs; compact on `/posts*`) +
> `SiteFooterV2` + `ConsentBanner`/`ConsentSettingsDialog` + `TinyAdzLoader` +
> `AuthSheet` (via `AuthContinuationProvider`, global) + `GlobalCommandPalette` (CMD+K).
> Layout source: `app/(marketing)/layout.tsx` -> `components/layout/marketing-chrome.tsx`.
> Route `loading.tsx` (all render `ScenicLoading`): `/archivio`, `/collections`,
> `/collections/[slug]`, `/posts`, `/posts/[slug]`, `/radar`, `/compare`,
> `/shortlist`, `/toools/[slug]`. NO `loading.tsx`: `/`, `/account*`, `/tags`,
> `/metodo`, `/sponsorizza`, `/shop`, `/studio`, `/affiliati`, `/contributi`,
> `/chi-siamo`, legal pages, `/wishlist`.
> Route `error.tsx` (all render `ErrorRecoveryView`): `/account`, `/compare`,
> `/shortlist` (+ `app/error.tsx`, `app/global-error.tsx`). All other routes: no
> segment boundary -> falls back to root `app/error.tsx` (unknown parity).

---

## 1. `/` — Home

Tree: `page.tsx` -> gate (`isPublicProductOpen`) -> `ComingSoonPage` (gate closed) /
`DefinitiveHome` -> `HeroDecisionScope` (decorative SVG) + `IntentEntry` (search) +
`StartHere` (TOOL/STACK/RADAR tabs: featured tool card, stack workflow cards,
`HomeRadarPreview`) + `TinyAdzInlineSlot(home-editorial)` + `FeaturedPartner` +
`SponsorOpportunityLink`.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty (0 tool) | `IntentEntry` hidden (`toolCount > 0` guard) | same | No dedicated empty copy; cockpit renders title/lede anyway — gap if catalog empty |
| populated | tabs + cards + radar preview + sponsor | list becomes primary surface | — |
| active | tab pills `aria-selected`, keyboard arrows/Home/End | same | — |
| hover | card border -> accent (CSS) | n/a | unknown exact hover treatment, verify visually |
| loading | NO route `loading.tsx` (async page, Suspense unknown) | same | Gap: add `loading.tsx` or verify Suspense |
| error | NO route `error.tsx` -> root boundary | same | unknown parity |
| long / short | announcement optional; stacks capped at 3 | lede swaps to mobile span | dynamic content, structure stable |
| modal | none dedicated (global CMD+K, AuthSheet, consent) | same | — |
| sticky | global chrome only | + bottom nav (fixed) | no route subnav |
| guest-diff | **YES**: `useAccount` in `start-here.tsx` -> guests see "Accedi per lo stack completo" lock note on stack cards | same | low drift risk (additive note only) |

## 2. `/account` — Account entry

Tree: `page.tsx` -> `AccountGate` -> (`loading`: `ScenicLoading`) / (`authenticated`: `AccountPanel`) / (else: `AuthPage` = login/register + `OAuthButtons`).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | n/a (auth surface) | same | — |
| populated | panel vs auth form by status | same | `body[data-account-surface]` switches workspace/auth |
| active | unknown | unknown | verify visually |
| hover | unknown | n/a | verify visually |
| loading | `ScenicLoading` "Apriamo il tuo spazio" | same | in-component, no route `loading.tsx` |
| error | `error.tsx` -> `ErrorRecoveryView` | same | — |
| long / short | OAuth buttons optional by env | same | `initialAuthEnabled` from Supabase env |
| modal | `AuthSheet` NOT here (page-level `AuthPage` instead) | same | — |
| sticky | global chrome; `isAccountAppPath()` hides marketing chrome elements (verify) | same | — |
| guest-diff | **IS the guest/logged switch** (`useAccount`) | same | — |

## 3. `/account/preview` — Workspace QA harness (dev only)

Tree: `page.tsx` -> `WorkspaceQaHarness` (+ `AuthSheet` instances) + `workspace-model` fixtures (`new/quiet/review/compare/stacks/resume/few/using/empty/multistack/mature`). `notFound()` in production.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | `empty` fixture exists | same | dev-only, no prod impact |
| populated | fixture-driven | same | — |
| active/hover | unknown | unknown | dev-only |
| loading/error | unknown | unknown | no route `loading/error.tsx` |
| long/short | fixture-driven | same | — |
| modal | `AuthSheet` mounted directly (preview only) | same | — |
| sticky | unknown | unknown | dev-only |
| guest-diff | fixture-driven, n/a | n/a | dev-only |

## 4. `/account/settings` — Settings

Tree: `page.tsx` -> `AccountSettingsPage` (+ `account.css`).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | n/a | n/a | — |
| populated | settings form (details unknown statically) | unknown | read file for full states if needed |
| active/hover | unknown | unknown | verify visually |
| loading | unknown (no route `loading.tsx`; in-component unknown) | unknown | **gap: verify** |
| error | NO route `error.tsx` -> root boundary | same | gap vs `/account` which has one |
| long/short | unknown | unknown | — |
| modal | `Dialog`-family usage found in file (grep hit) — unknown which | unknown | verify at runtime |
| sticky | global chrome | same | — |
| guest-diff | `useAccount` (settings require auth; exact guest redirect unknown) | unknown | verify: redirect vs gate copy |

## 5. `/affiliati` — Affiliates

Tree: `page.tsx` -> `SecondaryPageShell` + `SecondaryHero` + `SecondaryCardGrid`/`SecondaryPrincipleCard` (steps) + `AffiliateApplicationForm` + `SecondaryClosingCTA` (mailto CTA).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | n/a (static + form) | same | — |
| populated | static editorial + form | stacks to 1 col | — |
| active/hover | unknown | unknown | verify visually |
| loading | form submit state unknown | unknown | verify (no route `loading.tsx`; static page) |
| error | form validation/error copy unknown statically | unknown | verify |
| long/short | static | same | — |
| modal | none (grep: none) | none | — |
| sticky | global chrome only | same | — |
| guest-diff | none found | none | — |

## 6. `/archivio` — Catalog (DefinitiveArchive)

Tree: `page.tsx` (reads `?q=&group=&level=`) -> `DefinitiveArchive` -> `CatalogoFacetHead` + search/filters + `ArchiveV4ToolCard` grid + `PartnerEditorialInsert` + `TinyAdzInlineSlot` + mobile `FilterSheet` (custom fixed overlay w/ focus trap).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | "Nessun tool trovato" / "Nessun risultato per …" / "Nessun tool corrisponde ai filtri" | same copy in sheet context | covered |
| populated | card grid + partner insert (after 6) + TinyAdz (after 18) | same, mobile filter bar | — |
| active | facet pills, `aria-pressed`; sheet accordion groups (`categoria/obiettivi/livello`) | same | — |
| hover | card hover unknown statically | n/a | verify visually |
| loading | route `loading.tsx` (`ScenicLoading`) | same | in-grid skeleton unknown — verify |
| error | NO route `error.tsx` -> root boundary | same | **gap** for a data-heavy route |
| long | paginated/lazy grid (verify mechanism) | same | unknown windowing |
| short | 1–2 results layout unknown | unknown | verify |
| modal | `FilterSheet` (mobile, `position:fixed`, focus trap) | primary surface | no Radix Dialog here |
| sticky | facet head sticky (`archive-v4.css:277`); mobile bar sticky (`:1540`); filter row sticky (`:1531`) | same + bottom nav | compare dock present (fixed) |
| guest-diff | no `useAccount` in `definitive-archive.tsx`; save/compare go through `SaveOverflow` (guest -> `AuthSheet` via continuation for stack create) — **verify card wiring** | same | drift risk low IF all save entry points use `SaveOverflow`; audit recommended |

## 7. `/chi-siamo` — About

Tree: `page.tsx` -> `AboutPage` (`components/about/about-page` + `about-services`).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty/populated | static editorial | same | — |
| active/hover | unknown | unknown | verify visually |
| loading/error | static, n/a (no route files) | n/a | — |
| long/short | static | same | — |
| modal | none found | none | — |
| sticky | global chrome only | same | — |
| guest-diff | none found | none | — |

## 8. `/collections` — Collections index

Tree: `page.tsx` -> `CollectionsIndex` -> lead `CollectionCardV4(featured)` + `MemberPreviewGate` (locks `rest` grid for guests).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | **`if (collections.length === 0) return null` — NO empty state, blank page** | same | **GAP (P1)** |
| populated | lead + gated grid | same | — |
| active/hover | unknown | unknown | verify visually |
| loading | route `loading.tsx` | same | — |
| error | NO route `error.tsx` -> root boundary | same | gap |
| long/short | grid grows; 1-collection edge (lead only, `rest` empty -> gate wraps empty div) unknown | unknown | verify single-collection case |
| modal | none dedicated | none | — |
| sticky | global chrome only | same | — |
| guest-diff | **YES, HIGH**: guests see lead only + `MemberPreviewGate` lock card ("Continua nel tuo spazio"); logged see full grid | same | SEO/crawl sees full grid (SSR) but guest UX gated — intentional? confirm product decision |

## 9. `/collections/[slug]` — Collection detail

Tree: `page.tsx` -> `CollectionDetailBodyV4` (hero, `collection-section-nav-v4`, `collection-stack-flow-v4`, `collection-scenario-v4`, `collection-variant-paths-v4`, `collection-decision-notes-v4`, `collection-anti-recommendation-v4`, `collection-next-step-v4`, `collection-guide-bridge-v4`) + `CollectionSignalTracker` + `PartnerCollectionModule` + `SponsorOpportunityLink`. `notFound()` if slug missing.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | unknown (empty `included_tools` handling unknown) | unknown | **verify** |
| populated | full section stack | same, stacked | — |
| active | section nav active item (scroll-spy unknown) | unknown | verify |
| hover | unknown | n/a | verify visually |
| loading | route `loading.tsx` | same | — |
| error | NO route `error.tsx`; missing slug -> `notFound()` (needs `not-found.tsx` check) | same | verify `not-found` handling |
| long/short | variant paths conditional; related guides/stacks conditional | same | — |
| modal | none found | none | — |
| sticky | `cx-section-nav` is **NOT sticky** (static; only margin rules in mockup CSS) — inconsistent vs tool-detail decision nav | same | confirm intentional |
| guest-diff | none found in body; gate unknown | unknown | verify vs index gating |

## 10. `/community` — Legacy redirect

Tree: `page.tsx` -> `permanentRedirect("/contributi")`. No UI, no states. (Community experience components live under tool-detail `ExperienceSection`, gated by `isCommunityReadEnabled`.)

## 11. `/compare` — Compare (ToolBattleView)

Tree: `page.tsx` -> `ToolBattleView` -> `MobileCompareView` / `DesktopCompareView` (matchMedia >=1280px, `CompareViewportFallback` while resolving) -> `compare-battle-stage`, `compare-factor-matrix` (sticky head), `compare-verdict-card`, `compare-objective-selector`, `compare-decision-panel`, `ComparePersonalContext`, `CompareRanking`, `CompareWorkbenchChrome`.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | `CompareWorkbenchEmpty` (both views) | same | covered |
| populated | 2–5 fighter slots, matrix, verdict, decision panel | same, stacked | — |
| active | objective selector, verdict tie/auto ("Nessun distacco netto") | same | — |
| hover | unknown | n/a | verify visually |
| loading | route `loading.tsx` + `CompareViewportFallback` ("Preparazione dell'area di confronto…") | same | covered |
| error | `error.tsx` -> `ErrorRecoveryView` | same | — |
| long (5 tools) | matrix horizontal scroll + sticky axis/head | same | verify overflow UX |
| short (0–1) | empty/partial state (verify 1-tool copy) | same | partial-verify |
| modal | `CompareDecisionPanel`, `SaveOverflow` popover, `StackPickOrCreate` (guest -> AuthSheet) | same | — |
| sticky | workbench identity sticky top; factor-matrix head sticky; decide-jump sticky bottom; **dock HIDDEN on this route** | + bottom nav offset (`--tv-bottom-nav-total`) | densest sticky stack in product |
| guest-diff | **YES**: `ComparePersonalContext` -> guest CTA opens AuthSheet (`requestCompareDeep`); `CompareRanking` hides personal when guest; `CompareWorkbenchChrome` salvati href differs | same | medium drift risk: personal layer invisible to guests — confirm empty vs CTA treatment |

## 12. `/contributi` — Contribute

Tree: `page.tsx` -> secondary shell (`SecondaryHero`, `SecondaryCardGrid`/`SecondaryPrincipleCard` x contribution types, `SecondaryClosingCTA` mailto).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty/populated/loading/error | static, n/a | same | — |
| active/hover | unknown | unknown | verify visually |
| long/short | static | same | — |
| modal/sticky/guest-diff | none / global only / none | same | — |

## 13. `/cookie` — Legal

Tree: `page.tsx` -> `LegalPageShell` (static copy incl. TinyAdz disclosure).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| all | static; consent change surfaces live in `ConsentBanner`/`ConsentSettingsDialog` (global) | same | — |
| guest-diff | none | none | — |

## 14. `/metodo` — Method

Tree: `page.tsx` -> secondary shell + `DecisionTrack` + `RouteMarker` + lifecycle copy (`formatDecisionLifecycle`).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty/populated | static editorial | same | — |
| active/hover | `DecisionTrack` interactive states unknown statically | unknown | verify |
| loading/error | static (no route files) | n/a | — |
| long/short | static | same | — |
| modal | none found | none | — |
| sticky | global chrome only | same | — |
| guest-diff | none found | none | — |
## 15. `/posts` — Guides index

Tree: `page.tsx` -> `GuideMasthead` + `GuideFeaturedSection` + `GuideGridSection` + `GuideCard` (reading minutes, topic).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | "Nessuna guida trovata in quest'area. Prova un filtro diverso." (grid section) | same | covered (verify filter UI that triggers it) |
| populated | featured + grid | same | — |
| active/hover | unknown | unknown | verify visually |
| loading | route `loading.tsx` | same | — |
| error | NO route `error.tsx` -> root boundary | same | gap |
| long/short | static list length varies | same | — |
| modal | none dedicated | none | dock renders COMPACT on this route |
| sticky | global chrome only (no index subnav found) | same | — |
| guest-diff | none found on index | none | detail route gates instead (see below) |

## 16. `/posts/[slug]` — Guide article

Tree: `page.tsx` -> `ReadingProgressBar` + `GuideArticleHero` + `GuideArticleToc` (sticky rail) + `GuideMarkdown` (+ `GuideCallout`, `GuideTakeawaysDisclosure`, `GuideByline`) wrapped in **`MemberPreviewGate`** + `GuideArticleEnd` + `GuideRelatedRail` + `EntityCardList` + `GuidePartnerExperience` + `TinyAdzInlineSlot` + `JsonLd`.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | unknown (post without content/details edge unknown) | unknown | verify |
| populated | full article + related + partner | TOC collapses/compact on mobile | — |
| active | TOC active heading (verify) | compact TOC | verify |
| hover | unknown | n/a | verify visually |
| loading | route `loading.tsx` | same | — |
| error | NO route `error.tsx`; missing slug -> `notFound()` | same | verify `not-found` |
| long/short | progress bar + TOC scale with length | same | — |
| modal | none dedicated | none | dock COMPACT on this route |
| sticky | TOC sticky rail (`guides.css:1410,2263`); progress bar (verify position) | rail becomes compact sticky | — |
| guest-diff | **YES, HIGH**: `MemberPreviewGate` — guests get kicker/title/body + CTA "Entra per continuare" with rest inert/blurred; logged see full markdown | same | same SEO-vs-guest consideration as collections |

## 17. `/privacy` — Legal (see `/cookie`)

Tree: `LegalPageShell`. Static. No per-state UI. No guest diff.

## 18. `/product-hunt` — Legacy redirect

Tree: `permanentRedirect("/radar")`. No UI.

## 19. `/radar` — Radar (Product Hunt signals)

Tree: `page.tsx` -> `RadarExperience` -> hero + `CatalogoFacetHead(active="radar")` + `RadarStatusBar` + controls (range day/week/month, visual nodes/table, `RadarLensControl` personal lens, retry) + `RadarInstrument` / `RadarTable` + `RadarStatePanel` (empty/stale/error/missing-token) + `RadarPersonalEmpty` + `TinyAdzInlineSlot(radar-feed)` + `RadarProvenance`.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | dedicated empty panel ("Nessun segnale…") + `RadarPersonalEmpty` for personal lens | list/table forced on small screens (matchMedia -> table) | covered, incl. `missing-token` variant |
| populated | map (nodes) or table | table primary ("mobile-first ranked board") | — |
| active | range/visual/lens buttons `aria-pressed` | same | — |
| hover | instrument hover unknown | n/a | verify visually |
| loading | route `loading.tsx` + `aria-busy`/refreshing shimmer (`radar.css:1669`) | same | covered |
| error | in-place `RadarStatePanel` error + retry (`canRetry`) — no route `error.tsx` | same | covered in-component |
| stale | banner + data preserved (per V2 S14) | same | covered |
| long/short | "Nessun lancio nel periodo" for short ranges | same | — |
| modal | none dedicated (`<details>` provenance, accordions) | none | — |
| sticky | no route subnav (only refreshing `::before` sticky marker) | same | confirm intentional |
| guest-diff | **YES**: `useRadarPersonalLayer` returns signals only when `authenticated`; guests get global lens only (`showLens` false -> lens control hidden) | same | low-medium risk: hidden control vs disabled-with-CTA — confirm product call |

## 20. `/shop` — Shop placeholder

Tree: `page.tsx` -> secondary shell + 3 status cards (no products/prices/checkout by design) + catalog/collections CTAs.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| all | static placeholder, n/a empty/loading/error | same | intentional non-shop |
| modal/sticky/guest-diff | none / global only / none | same | — |

## 21. `/shortlist` — Salvati (guest board)

Tree: `page.tsx` -> `ShortlistRouteGate` (**authenticated -> `router.replace(/account?view=salvati)`**, i.e. `WorkspaceBiblioteca`) -> guests: `MobileShortlistBoard` -> hero, decision-memory list, stage groups, `MobileNoteSheet`, `DecisionSheet`, `StackPickOrCreate`, `SaveOverflow`; `MobileLibraryEmpty` when 0.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | `MobileLibraryEmpty` (suggests catalog, `categoryCount`) | same (board is mobile-first naming, renders both) | covered for guests; logged empty lives in `WorkspaceBiblioteca` ("Nessun tool salvato ancora") |
| populated | stage groups + compare strip + decisions | same | — |
| active | stage toggle, note sheet, decision sheet | same | — |
| hover | unknown | n/a | verify visually |
| loading | route `loading.tsx` | same | — |
| error | `error.tsx` -> `ErrorRecoveryView` | same | — |
| long/short | recent strip capped at 8; decided list sorted by timestamp | same | — |
| modal | `MobileNoteSheet` + `DecisionSheet` + stack picker + `SaveOverflow` popover | same | richest modal stack alongside compare |
| sticky | unknown route-specific sticky (verify; global + dock) | same | **verify** |
| guest-diff | **YES, HIGHEST DRIFT RISK**: two implementations — guest `MobileShortlistBoard` (local store) vs logged `WorkspaceBiblioteca` (canonical workspace, search, `WorkspaceEmptyMotif`, personal notes). Same URL, different trees. | same | any board redesign must be mirrored; add cross-check to QA |

## 22. `/sponsorizza` — Sponsor showcase

Tree: `page.tsx` -> custom (non-secondary) showcase: format cards (spotlight/tool-card/dispatch/collection) + live partner creatives (`PartnerCreativeRenderer`: Taylora/OnWeb24/ZapLater/OpenSlot) + `SponsorOpportunityMailtoLink` + `sponsorizza.css`.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | `LIVE_PARTNER_CAMPAIGNS` empty edge unknown (showcase renders nothing? verify) | unknown | **verify zero-active-campaign state** |
| populated | format cards + live creatives | same | — |
| active/hover | unknown | unknown | verify visually |
| loading/error | static + campaign data (no route files) | unknown | verify failure mode |
| long/short | varies with active campaigns | same | dynamic |
| modal | none found | none | — |
| sticky | global chrome only (verify) | same | verify |
| guest-diff | none found | none | — |

## 23. `/studio` — Studio services

Tree: `page.tsx` -> secondary shell (services grid, process, closing mailto CTA).

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| all | static, n/a empty/loading/error | same | — |
| modal/sticky/guest-diff | none / global only / none | same | — |

## 24. `/tags` — Tags index

Tree: `page.tsx` (custom, no shared card) -> category cards (link `/archivio?group=`) + tag pills (link `/archivio?tag=`) with counts.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | **NO empty state**: zero-tag edge renders sections with `0 tag disponibili` heading and empty wrap — no copy | same | **GAP (P2)**: add "Nessun tag" message or guarantee non-empty at data layer |
| populated | category grid + tag cloud | same | — |
| active/hover | hover border->accent (Tailwind classes inline) | n/a | covered in code |
| loading | NO route `loading.tsx` (async page) | same | gap, minor (fast query) |
| error | NO route `error.tsx` | same | gap, minor |
| long/short | tag cloud wraps, counts inline | same | — |
| modal | none | none | — |
| sticky | global chrome only | same | — |
| guest-diff | none | none | — |

## 25. `/termini` — Legal (see `/cookie`)

Tree: `LegalPageShell`. Static. No per-state UI. No guest diff.

## 26. `/toools/[slug]` — Tool detail FINAL

Tree: `page.tsx` -> `ToolDetailFinalPage` -> `ToolDetailHero` (+ `ToolDetailScore`) + `ToolDetailActionSurface` (Confronta/Visita/Salva) + `ToolDetailDecisionNav` (sticky in-page nav) + `ToolDetailDecisionBrief` + `ToolDetailDeepenItems` (details/summary) + `ToolDetailExtendedContent` + `ToolDetailPricing` + `ToolDetailInformation` + `ToolDetailAlternatives` + `ExperienceSection` (community, flag-gated) + `EntityCardList` (guides/stacks) + `PartnerToolCard` + `TinyAdzInlineSlot` + `JsonLd`.

| Stato | Desktop | Mobile | Note |
|---|---|---|---|
| empty | sections conditional (`hasExtendedContent`, `hasPricing`, related>0) — missing blocks hidden, no "empty" copy (acceptable) | same | by-design compression; verify 0-alternative layout |
| populated | full layer stack | same | Golden Masters: `TOOL-DETAIL-FINAL-MASTER.png`, `TOOL-DETAIL-IMPLEMENTATION-MASTER.png` (authoritative for visual parity) |
| active | decision-nav scroll-spy pill; `aria-pressed` on Confronta; compare rank badge; max-compare disabled (`isAtMax`) | same | — |
| hover | unknown statically | n/a | verify against Golden Master |
| loading | route `loading.tsx` | same | — |
| error | NO route `error.tsx`; missing slug -> `notFound()` | same | verify `not-found` |
| long (extended content) | deepen disclosure + pricing + information | same | — |
| short (thin tool) | hero + brief + actions only | same | verify |
| modal | `SaveOverflow` popover + `.td-final-account-scrim` (fixed) for account-gated speed-2 actions | same | — |
| sticky | decision nav sticky (`tool-detail-final.css:621`, below header); global chrome; dock present | + bottom nav | — |
| guest-diff | local workspace store works for guests; `SaveOverflow` guest -> AuthSheet for stack create; `ExperienceSection` read-flag gated (not auth) | same | low risk; confirm no hard gate regressed in |

## 27. `/wishlist` — Legacy redirect

Tree: `redirect("/shortlist#wishlist")`. No UI. (Hash anchor `#wishlist` handling on shortlist board: verify.)

---

## Shared primitives inventory (component -> file path)

| Primitive | File(s) |
|---|---|
| Buttons | `components/ui/button.tsx` |
| Pills / chips / badges | `components/tools/tag-pill.tsx` (tag), `components/ui/chip.tsx`, `components/ui/badge.tsx` |
| Tabs | `components/ui/tabs.tsx`; route-level: `START_TABS` in `components/home/start-here.tsx`, `components/archive/catalogo-facet-head.tsx`, radar range/visual controls in `components/radar/radar-experience.tsx` |
| Cards — Tool | `components/archive/archive-v4-tool-card.tsx` |
| Cards — Guide | `components/guides/guide-card.tsx` (+ `guide-featured-section.tsx`, `guide-grid-section.tsx`, `guide-masthead.tsx`) |
| Cards — Stack/Collection | `components/collections/collection-card-v4.tsx` (+ `collections-index.tsx`) |
| Cards — Entity (generic) | `components/graph/entity-cards.tsx` |
| Cards — base | `components/ui/card.tsx`, `components/ui/responsive-disclosure-card.tsx` |
| Inputs / textarea | `components/ui/input.tsx`, `components/ui/input-group.tsx`, `components/ui/textarea.tsx` |
| Search | `components/home/intent-entry.tsx` (home), archive search inside `components/archive/definitive-archive.tsx`, `GlobalCommandPalette` in `components/app/global-command-palette.tsx` |
| Filters | `components/archive/definitive-archive.tsx` (+ mobile `FilterSheet` inside), `components/directory/catalog/catalog-controller.ts` (`parseCatalogLevelParam`, `resolveCatalogGroupParam`) |
| Scores | `components/tools/editorial-scorecard.tsx` (`EditorialScoreMeter`/`EditorialScorecard`), `components/tool-detail-final/tool-detail-score.tsx`, `lib/data/editorial-score.ts` (`computeEditorialScore`) |
| Dropdowns / popovers | `components/ui/popover.tsx`, `components/ui/command.tsx`, `components/ui/tooltip.tsx`; route-level: `components/tools/save-overflow.tsx`, `components/tools/stack-pick-or-create.tsx`, `components/layout/header-account-control.tsx` (`<details>` menu) |
| Accordions (details/summary pattern) | `components/tool-detail-final/tool-detail-deepen-items.tsx`, `components/tools/compare-factor-matrix.tsx`, `components/tools/compare-editorial-details.tsx`, `components/guides/guide-callout.tsx` (`GuideTakeawaysDisclosure`), collection `collection-variant-paths-v4.tsx` / `collection-stack-flow-v4.tsx` / `collection-scenario-v4.tsx` / `collection-decision-notes-v4.tsx`, `components/method/decision-track.tsx` |
| Sheets / modals / dialogs | Base: `components/ui/dialog.tsx`, `components/ui/sheet.tsx`, `components/ui/drawer.tsx`; instances: `components/account/auth-sheet.tsx` (+ `.css`, global via `auth-continuation-provider.tsx`), `components/account/workspace/decision-sheet.tsx` (+ `.css`), archive `FilterSheet` (in `definitive-archive.tsx`, fixed overlay), `MobileNoteSheet` (in `mobile-shortlist-board.tsx`), `components/ads/consent-banner.tsx` + `components/ads/consent-settings-dialog.tsx`, `components/coming-soon/gate-modal.tsx`, gamification `badge-unlock-modal.tsx` / `level-up-modal.tsx` / `game-mission-drawer.tsx` |
| Toasts | `components/ui/sonner.tsx` (mounted in `components/app/root-providers.tsx`) + `lib/feedback.ts` (`feedback.success/selection`) |
| Compare dock | `components/layout/compare-session-dock.tsx` (+ `styles/compare.css` `.tv-compare-dock`, fixed; gesture logic `lib/shell/compare-chrome.ts`) |
| Sponsor / pricing cards | `components/monetization/partner-placements.tsx` (`FeaturedPartner`, `PartnerEditorialInsert`, `PartnerToolCard`, `PartnerCollectionModule`, `ContextualPartnerBlock`, `SponsorOpportunityLink`), `components/monetization/partner-creatives.tsx` (Taylora/OnWeb24/ZapLater/OpenSlot creatives), pricing: `components/tool-detail-final/tool-detail-pricing.tsx` |
| Header / nav | `components/layout/command-bar.tsx` (+ `styles/command-bar.css`, desktop sticky), `components/layout/mobile-top-bar.tsx` (+ `.css`, sticky), `components/layout/mobile-bottom-nav.tsx` (+ `.css`, fixed), `components/layout/site-footer-v2.tsx`, `components/layout/header-account-control.tsx`, `components/layout/marketing-chrome.tsx`, `components/layout/chrome-viewport.tsx`, `components/ui/route-marker.tsx`, `components/ui/section-header.tsx` |
| Loading / error | `components/layout/scenic-loading.tsx`, `components/app/error-recovery-view.tsx` |
| Auth / account | `components/account/account-provider.tsx` (`useAccount`), `components/account/account-gate.tsx`, `components/account/auth-page.tsx`, `components/account/account-panel.tsx`, `components/account/member-preview-gate.tsx`, `components/account/workspace/*` (shell, biblioteca, riprendi, stacks, decisioni, decision-sheet, personal-insights, private-note-editor, filo) |

---

## Cross-route findings (guest/logged, sticky, modal)

- Guest/logged switches live in: `start-here.tsx` (lock note), `compare-personal-context.tsx` / `compare-ranking.tsx` / `compare-workbench-chrome.tsx`, `shortlist-route-gate.tsx`, `radar-personal-layer.tsx`, `member-preview-gate.tsx` (posts detail, collections index), `save-overflow.tsx` + `auth-continuation-provider.tsx` (guest stack-create -> AuthSheet), `header-account-control.tsx` / `use-authenticated-nav-items.ts`.
- Sticky/fixed map: `command-bar` sticky top-0 / `mobile-top-bar` sticky top-0 / `mobile-bottom-shell` fixed / `tv-compare-dock` fixed (hidden `/compare`, compact `/posts*`) / archive facet/mobile-bar sticky / `td-final-decision-nav` sticky / compare matrix-head/workbench-identity sticky + decide-jump sticky-bottom / guides TOC sticky / radar refreshing-marker only / `cx-section-nav` NOT sticky.
- Modal/sheet map: global `AuthSheet` (continuation-gated, all routes) / consent banner+dialog (global) / CMD+K palette (global) / archive `FilterSheet` / shortlist note/decision/stack sheets + `SaveOverflow` / tool-detail `SaveOverflow` + scrim / gamification badge/level-up modals (mount point to verify per route).
