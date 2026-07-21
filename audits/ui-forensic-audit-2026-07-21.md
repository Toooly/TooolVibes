# TooolVibes — Frontend Forensic & Systemic Audit
**Data**: 2026-07-21 · **Audit type**: READ-ONLY archeologico, iper-approfondito · **Stack**: Next.js 15.5 App Router · React 19 · Tailwind CSS v4 (CSS-first) · @base-ui/react · vaul · cmdk · sonner · `motion` + GSAP + Lenis · three.js / R3F · `shadcn` (base-nova)
**Modo di lavoro**: nessuna modifica al codice, nessun refactor, nessuna eliminazione di codice. Solo mappatura, classificazione e raccomandazioni.

> **Metodologia**
> - **6 lane di esplorazione parallele** sul codice (architettura, design tokens, CSS forensics, interaction/motion, responsive, consistency + archaeology), ciascuna con prompt mirato e tool di ricerca dedicati.
> - **Audit visivo runtime** con `agent-browser` su dev server locale (Next.js già in esecuzione su :3000): 16 screenshot a 4 viewport (390×844 mobile, 768×1024 tablet, 1440×900 desktop, 1728×1000 wide).
> - **Visual analysis** effettuata con OCR + pixel forensics + color histogram + cross-referencing del codice (l'ambiente del subagent non ha visione nativa sulle immagini).
> - **Verifica codice** mirata su due anomalie visive critiche (colore rosso non-brand sul dettaglio tool + striscia lavanda universale sul bordo destro).
> - Tutti i claim riportano `file:line` quando possibile.

---

## EXECUTIVE SUMMARY

TooolVibes è un prodotto maturo sul piano funzionale e architetturale ma **gravemente stratificato sul piano UI**. Il frontend è cresciuto per successivi cicli di sviluppo che hanno lasciato **strati sovrapposti, fork dimenticati, primitive duplicate, override accumulati e convenzioni implicite**. Esiste un **design system parziale** (78 token in `tokens.css`) ma **non è il sistema che governa il prodotto**: a valle convivono ~420 variabili CSS addizionali, due fogli `figma-*.css` (di cui uno mai importato), uno `globals.css` da 34k righe, un `vibes-3d-maestoso.css` da 6.2k righe, `next-themes` installato ma mai attivato, e pattern Tailwind arbitrari ovunque (`text-[0.98rem]`, `rounded-[28px]`, `#6a3cff`×190).

**Numeri chiave**

| Metrica | Valore | Soglia ideale |
|---|---|---|
| File component (.tsx) | **206** | — |
| LOC totali componenti | **~39 600** | — |
| File CSS totali | **12** + `globals.css` | 2-3 |
| LOC totali CSS | **~46 300** | < 8k |
| `!important` totali | **~1 186 / 1 190** (99.7 % del budget) | < 50 |
| Varianti ToolCard | **4** (`tool-card`, `canonical-tool-card`, `mobile-tool-card`, `directory-tool-card`) | 1 |
| Header v1/v2 coesistenti | 2 set | 1 |
| Footer v1/v2 coesistenti | 2 set | 1 |
| Experience-layer v1/v2 | 2 set | 1 |
| Sound-layer v1/v2 | 2 set | 1 |
| Folder 3d vs 3d-maestoso | 2 set | 1 |
| Implementazioni compare board | **7** (`compare-board`, `mobile-compare-view`, `desktop-compare-view`, `unified-compare-board`, `tool-battle-view`, `shortlist-board`, `mobile-shortlist-board`) | 1-2 |
| Breakpoint custom unici | **25+** | 5 (Tailwind) |
| Token `--tv-*` definiti in `tokens.css` | 78 | — |
| Custom properties CSS totali (stima) | **~420** | ≤ 80 |
| Classi CSS morte (zero riferimenti tsx) | **~50+** | 0 |
| Modalità Tailwind usate | `sm:` 599, `md:` **99**, `lg:` 205, `xl:` 67, `2xl:` 7 | distribuzione crescente |
| Durate motion distinte | **12+** | 3 token |
| Sistemi motion attivi | **3** (`motion/react`, MotionObserver custom, CSS keyframes) | 1 |

**Verdetto sintetico**: il prodotto mostra un'identità visiva riconoscibile (viola `#6a3cff`, Fraunces display, superfici dark glass) ma questa identità è **sotto stress**: la stessa parola "tool" viene resa con radius diversi su schermi diversi, lo stesso header ha due versioni attive, il bottone "compare" usa un rosso non-brand sul dettaglio tool, e la home desktop è di fatto un layout mobile allargato.

**Causa sistemica principale (P0)**: **assenza di una libreria di primitive consolidata + assenza di un enforcement meccanico (lint, style-ownership guard, theme tokens obbligatori) ⇒ ogni nuova feature ha reintrodotto pattern locali**. Ogni nuova feature ha contribuito ad aumentare la frammentazione.

**Risultato finale atteso della successiva fase di consolidamento (Phase 0–10 in fondo)**: 1 linguaggio visivo, 1 sistema di spacing, 1 sistema tipografico, 1 sistema di superfici, 1 sistema di componenti, 1 sistema responsive, 1 sistema di motion, 1 identità UI coerente mobile + desktop.

---

## 1 · FRONTEND ARCHITECTURE MAP

### 1.1 Route map (sintesi)

| Route | Group | Layout | Note |
|---|---|---|---|
| `/` | `(marketing)` | `app/(marketing)/layout.tsx` | Hero mobile-first, layout strettissimo a desktop |
| `/account` | `(marketing)` | idem | `AccountPanel`, `AuthPage` |
| `/affiliati`, `/archivio`, `/chi-siamo`, `/collections`, `/collections/[slug]`, `/community`, `/compare`, `/cookie`, `/privacy`, `/termini`, `/metodo`, `/posts`, `/posts/[slug]`, `/product-hunt`, `/radar`, `/shop`, `/shortlist`, `/tags`, `/toools/[slug]`, `/wishlist` | `(marketing)` | idem | — |
| `/admin/*` | `(admin)` | `(admin)/admin/(protected)/layout.tsx` | `FounderControlCenterV2` |
| `/admin/login` | `(admin)` | separato | LoginForm |
| `/auth/callback` | none | — | auth |
| `/dev/design-system` | none | — | `FigmaDesignSystemShowcase` (DEV, candidate alla rimozione) |

**Coupling**: ~110 file route in `app/`, due route groups, tre layout principali.

### 1.2 Component tree map (`components/`)

| Subdir | File | LOC totali | Scopo | Layer |
|---|---:|---:|---|---|
| `ui` | 26 | 2 931 | Primitive shadcn-style | **PRIMITIVES** |
| `tools` | 20 | 5 804 | Compare board, shortlist, tool card, scorecard | **FEATURE** |
| `directory` | 23 | 4 187 | Discovery app, catalog views, search, tool cards | **FEATURE** |
| `gamification` | 19 | 3 211 | Arena battle, mini-games, badges, radar game, leaderboard | **FEATURE** |
| `3d-maestoso` | 16 | 2 494 | Scene R3F (arena, radar, archive, home heroes) | **MOTION/3D** |
| `account` | 16 | 1 363 | Auth, panel, gamification sections | **FEATURE** |
| `app` | 23 | 2 413 | Providers, orbital system, experience layer, command palette | **SHARED/SYSTEM** |
| `admin` | 12 | 3 439 | Form collezione/tool/articolo, founder control center | **FEATURE** |
| `desktop` | 9 | 1 938 | Versioni desktop di radar/archive/compare/wishlist (fork) | **FEATURE/LEGACY** |
| `home` | 9 | 1 087 | Hero, spotlight, scroll-reveal, tilt-card | **PAGE-SECTIONS** |
| `layout` | 7 | 1 445 | Site header v2/v1, footer v2/v1, bottom nav, brand logo | **NAVIGATION** |
| `radar` | 3 | 1 051 | Mobile radar canvas, view switch | **FEATURE** |
| `collections` | 4 | 980 | Collection cards, advanced special issue, mobile view | **FEATURE** |
| `3d` | 2 | 158 | Brand logo 3D legacy | **MOTION/3D/LEGACY** |
| `sections` | 2 | 116 | Section heading, surface intro | **SHARED** |
| `editorial` | 2 | ~60 | Post card, markdown content | **FEATURE** |
| `discovery` | 1 | 254 | Canonical discovery persistence provider | **SHARED** |
| `coming-soon` | 4 | ~200 | Gate modal, starfield, waitlist form | **OVERLAY** |
| `dev` | 1 | 566 | Figma design system showcase | **DEV/REMOVE CANDIDATE** |
| `affiliates` | 1 | 321 | Form affiliazione | **FEATURE** |
| `wishlist` | 1 | 657 | Request tool form | **FEATURE** |
| `security` | 1 | ~30 | Submission protection fields | **SHARED** |
| `product-hunt` | 1 | 487 | Product Hunt rankings | **FEATURE** |
| `method` | 1 | ~80 | Mobile method room | **PAGE-SECTIONS** |
| `monetization` | 1 | ~30 | Native placement | **FEATURE** |
| `about` | 1 | 404 | About page | **PAGE-SECTIONS** |

### 1.3 Layer model (proposto per la fase successiva)

```
FOUNDATIONS      → lib/utils.ts (cn, format…), styles/tokens.css, lib/types
PRIMITIVES       → components/ui/* (button, card, dialog, drawer, input…)
SHARED           → components/app/root-providers, orbital-system, discovery, sections, security
LAYOUT           → components/layout/* (header, footer, bottom nav)
NAVIGATION       → vedi LAYOUT
FEATURE          → components/tools, directory, admin, account, collections, gamification…
OVERLAYS         → components/coming-soon, ui/dialog, ui/drawer, ui/sheet
MOTION / 3D      → components/3d-maestoso, app/orbital-system, home/scroll-reveal
THEME            → app/globals.css + styles/*.css (oggi frammentato)
PAGE-SECTIONS    → components/home, about, method
LEGACY / FORK    → components/3d, desktop/*, layout/site-header.tsx (v1),
                    app/global-experience-layer.tsx (v1),
                    admin/founder-control-center.tsx (v1),
                    depth-scene.css, figma-implementation.css,
                    tooolvibes-design-handoff/, tooolvibes-ui-expert-agent/
```

---

## 2 · COMPONENT INVENTORY (top 60 con verdetto)

| # | Nome | Path | LOC | Ruolo | Usi | Verdetto | Rischio |
|---|---|---|---:|---|---|---|---|
| 1 | ToolDiscoveryApp | `components/directory/tool-discovery-app.tsx` | 1430 | Feature/page | 1 | **REFACTOR** | HIGH |
| 2 | VibeTapMiniGame | `components/gamification/vibe-tap-mini-game.tsx` | 1005 | Feature/overlay | 1 | **KEEP** | MED |
| 3 | MobileShortlistBoard | `components/tools/mobile-shortlist-board.tsx` | 881 | Feature/page | 1 | **KEEP+POLISH** | MED |
| 4 | MobileCompareView | `components/tools/mobile-compare-view.tsx` | 783 | Feature | 1 | **CONSOLIDATE** | MED |
| 5 | MobileRadarView | `components/radar/mobile-radar-view.tsx` | 748 | Feature | 1 | **CONSOLIDATE** | MED |
| 6 | CollectionForm | `components/admin/collection-form.tsx` | 729 | Feature/admin | 2 | **KEEP** | LOW |
| 7 | UnifiedCompareBoard | `components/tools/unified-compare-board.tsx` | 679 | Feature | 1 | **KEEP** | MED |
| 8 | AccountProvider | `components/account/account-provider.tsx` | 670 | Feature/shared | 2 | **KEEP** | LOW |
| 9 | RequestToolForm | `components/wishlist/request-tool-form.tsx` | 657 | Feature | 1 | **KEEP** | LOW |
| 10 | OrbitalLayer | `components/app/orbital-system/orbital-layer.tsx` | 649 | Shared/motion | 0 direct | **KEEP** | MED |
| 11 | SiteHeaderV2 | `components/layout/site-header-v2.tsx` | 594 | Navigation | 1 | **KEEP+POLISH** | LOW |
| 12 | CompareBoard | `components/tools/compare-board.tsx` | 567 | Feature | 2 | **CONSOLIDATE** | MED |
| 13 | FigmaDesignSystemShowcase | `components/dev/figma-design-system-showcase.tsx` | 566 | Dev | 1 | **DEPRECATE** | LOW |
| 14 | CanonicalToolCard | `components/directory/canonical-tool-card.tsx` | 516 | Feature | 2 | **CONSOLIDATE** | MED |
| 15 | ProductHuntRankings | `components/product-hunt/product-hunt-rankings.tsx` | 487 | Feature | 1 | **KEEP** | MED |
| 16 | GlobalExperienceLayerV2 | `components/app/global-experience-layer-v2.tsx` | 476 | Shared/system | 1 | **KEEP** | MED |
| 17 | CollectionTransitionCard | `components/admin/collection-transition-card.tsx` | 476 | Feature/admin | 1 | **KEEP** | LOW |
| 18 | RadarScene3D | `components/3d-maestoso/radar-scene-3d.tsx` | 473 | Motion/3d | 1 | **KEEP** | MED |
| 19 | ToolCard | `components/tools/tool-card.tsx` | 468 | Feature | 4 | **CONSOLIDATE** | MED |
| 20 | CollectionSyncPreviewPanel | `components/admin/collection-sync-preview-panel.tsx` | 427 | Feature/admin | 1 | **KEEP** | MED |
| 21 | AdvancedSpecialIssue | `components/collections/advanced-special-issue.tsx` | 423 | Feature | 1 | **KEEP** | MED |
| 22 | OrbitingBadge | `components/app/orbital-system/orbiting-badge.tsx` | 422 | Shared/motion | 1 | **KEEP** | MED |
| 23 | HomeExperienceSections | `components/directory/home-experience-sections.tsx` | 417 | Feature | 1 | **KEEP** | MED |
| 24 | ArenaFighter | `components/3d-maestoso/arena-fighter.tsx` | 416 | Motion/3d | 1 | **KEEP** | MED |
| 25 | CategoryToolCarousel | `components/directory/category-tool-carousel.tsx` | 412 | Feature | 2 | **KEEP** | MED |
| 26 | AboutPage | `components/about/about-page.tsx` | 404 | Page | 1 | **KEEP** | LOW |
| 27 | DesktopVibeArchive | `components/desktop/desktop-vibe-archive.tsx` | 395 | Feature | 1 | **CONSOLIDATE** | MED |
| 28 | ArenaBattleStage | `components/gamification/arena-battle-stage.tsx` | 376 | Feature | 1 | **KEEP** | MED |
| 29 | CompareDecisionPanel | `components/tools/compare-decision-panel.tsx` | 365 | Feature | 1 | **KEEP** | MED |
| 30 | ToolForm | `components/admin/tool-form.tsx` | 358 | Feature/admin | 2 | **KEEP** | LOW |
| 31 | IntroCinematic | `components/3d-maestoso/intro-cinematic.tsx` | 348 | Motion/3d | 1 | **KEEP** | MED |
| 32 | AuthPage | `components/account/auth-page.tsx` | 342 | Feature | 1 | **KEEP** | LOW |
| 33 | ArticleForm | `components/admin/article-form.tsx` | 340 | Feature/admin | 2 | **KEEP** | LOW |
| 34 | GameMissionPanel | `components/gamification/game-mission-panel.tsx` | 336 | Feature | 1 | **KEEP** | MED |
| 35 | RadarConsole | `components/gamification/radar-console.tsx` | 334 | Feature | 1 | **KEEP** | MED |
| 36 | ArticleMarkdownEditor | `components/admin/article-markdown-editor.tsx` | 332 | Feature/admin | 1 | **KEEP** | MED |
| 37 | DesktopCompareView | `components/tools/desktop-compare-view.tsx` | 325 | Feature | 1 | **CONSOLIDATE** | MED |
| 38 | AffiliateApplicationForm | `components/affiliates/affiliate-application-form.tsx` | 321 | Feature | 1 | **KEEP** | LOW |
| 39 | FounderControlCenterV2 | `components/admin/founder-control-center-v2.tsx` | 311 | Feature/admin | 1 | **KEEP** | LOW |
| 40 | CollectionCard | `components/collections/collection-card.tsx` | 306 | Feature | 2 | **KEEP** | LOW |
| 41 | ShortlistBoard | `components/tools/shortlist-board.tsx` | 304 | Feature | 1 | **CONSOLIDATE** | MED |
| 42 | SiteUniverseBackground | `components/app/site-universe-background.tsx` | 294 | Shared/motion | 2 | **KEEP** | LOW |
| 43 | ArenaScene3D | `components/3d-maestoso/arena-scene-3d.tsx` | 294 | Motion/3d | 1 | **KEEP** | MED |
| 44 | OrbitalCoreNode | `components/app/orbital-system/orbital-core-node.tsx` | 290 | Shared/motion | 1 | **KEEP** | MED |
| 45 | GlobalExperienceLayer | `components/app/global-experience-layer.tsx` | 283 | Shared/system | 1 | **DEPRECATE** | LOW |
| 46 | DropdownMenu | `components/ui/dropdown-menu.tsx` | 277 | Primitives | molti | **KEEP** | LOW |
| 47 | DesktopRadarCanvas | `components/desktop/desktop-radar-canvas.tsx` | 274 | Feature | 1 | **CONSOLIDATE** | MED |
| 48 | DesktopDepthScene | `components/desktop/desktop-depth-scene.tsx` | 268 | Motion/3d | 1 | **KEEP** | MED |
| 49 | DesktopVibeWishlist | `components/desktop/desktop-vibe-wishlist.tsx` | 266 | Feature | 1 | **CONSOLIDATE** | MED |
| 50 | MusicAmbienceLayer | `components/app/music-ambience-layer.tsx` | 262 | Shared | 1 | **KEEP** | LOW |
| 51 | GlobalCommandPalette | `components/app/global-command-palette.tsx` | 261 | Shared | 1 | **KEEP** | MED |
| 52 | FounderControlCenter | `components/admin/founder-control-center.tsx` | 260 | Feature/admin | 1 | **DEPRECATE** | LOW |
| 53 | DiscoveryPersistenceProvider | `components/discovery/canonical-discovery-persistence-provider.tsx` | 254 | Shared | 2 | **KEEP** | LOW |
| 54 | Carousel | `components/ui/carousel.tsx` | 242 | Primitives | molti | **KEEP** | LOW |
| 55 | OrbitalShapes | `components/app/orbital-system/orbital-shapes.tsx` | 237 | Shared | 1 | **KEEP** | MED |
| 56 | EditorialScorecard | `components/tools/editorial-scorecard.tsx` | 232 | Feature | 1 | **KEEP** | LOW |
| 57-60 | (MobileCompareView-related…) | … | … | … | … | … | … |

**Totale LOC top 60 ≈ 26 000 (66 % di tutto il layer componenti).**

---

## 3 · DESIGN SYSTEM AUDIT

### 3.1 Inventario `styles/tokens.css` (78 token, `--tv-*`)

| Categoria | Token | Note |
|---|---|---|
| Background | `--tv-bg-base`, `--tv-surface-raised`, `--tv-surface-elevated` | 3 livelli |
| Ink | `--tv-ink-primary/secondary/muted/muted-aa` | 4 livelli |
| Accent | `--tv-accent-primary/hover/pressed/aa` + `--tv-accent-cyan/gold/magenta` | 7 |
| Surface | `--tv-surface-translucent`, `--tv-surface-soft` | 2 |
| Border | `--tv-border-subtle/interactive` | 2 |
| Status | `--tv-status-success/warning/danger/info` | 4 |
| Focus | `--tv-focus-ring` | 1 |
| Font family | `--font-manrope`, `--font-rubik`, `--tv-font-ui`, `--tv-font-display`, `--tv-font-system` | 5 (3 sono alias di Inter) |
| Type scale | `--tv-text-xs…3xl` | 7 step |
| Weight | `--tv-weight-regular/medium/semibold/bold` | 4 |
| Leading | `--tv-leading-tight/heading/body/relaxed` | 4 |
| Tracking | `--tv-tracking-default/label/eyebrow` | 3 |
| Spacing | `--tv-space-1…24` (+ `-32` legacy) | 10 |
| Radius | `--tv-radius-sm/md/lg/feature/pill` | 5 |
| Content | `--tv-content-wide`, `--tv-content-reading` | 2 |
| Elevation | `--tv-elevation-rest/raised/modal` | 3 |
| Motion | `--tv-motion-fast/base/slow` + `--tv-ease-standard/emphasis` | 5 |
| Z-index | `--tv-z-base…effects` | 9 |
| Mobile shell | `--tv-shell-nav-inset-*`, `--tv-shell-fab-*`, `--tv-shell-dock-*` | 7 |
| Keyboard/viewport | `--tv-kbd-overlay-inset-*`, `--tv-kbd-sheet-max-height`, `--tv-kbd-input-min-font-size` | 6 |

**Token legacy/abbandonati**: `--tv-space-32` (alias da rimuovere), `--font-manrope` e `--font-rubik` (risolvono a `--font-inter`).

### 3.2 Stato per area

#### COLORI — **P0**

| Indicatore | Valore |
|---|---|
| Token definiti in `tokens.css` | 25 |
| Custom properties totali (tutti i CSS) | ~420 (stima) |
| `#6a3cff` hardcodato | **190 occorrenze** |
| `#ffffff` hardcodato | 188 |
| `#39d2f6` hardcodato | 103 |
| Quasi-duplicati viola | `#6a3cff`, `#7C4DFF`, `#7c4dff`, `#8b5cf6`, `#4f46e5` (P1) |
| Quasi-duplicati ciano | `#39d2f6`, `#43c6ff`, `#00E5FF`, `#64FFDA` (P2) |
| Alfa bianco distinti | **20+ valori** (0.04, 0.06, 0.08, 0.10, 0.12, 0.14, 0.16, 0.18, 0.22, 0.24, 0.28, 0.58, 0.62, 0.68, 0.70, 0.72, 0.76, 0.78, 0.82, 0.86, 0.90, 0.92, 0.94, 0.96) |

`figma-implementation.css` ridefinisce alias semantici (`--primary`, `--secondary`, `--accent`, `--border`, `--input`, `--ring`) paralleli a `--tv-*`; `figma-final-polish.css` aggiunge 257 `!important` su `.tv-figma-theme`. **Ma `figma-implementation.css` non risulta importato** in `styles/release-entry.ts` (importa solo `globals.css`, `vibes-3d-maestoso.css`, `figma-final-polish.css`). File zombie.

#### TYPOGRAPHY — **P1**

- Font: Inter (UI) + Fraunces (display) caricati in `app/layout.tsx:9-18`.
- Scale definita: 7 step (`--tv-text-xs…3xl`).
- **61+ classi `text-[Npx|Nrem]` arbitrary** rilevate, es. `text-[0.98rem]`×15, `text-[1.32rem]`×5, `text-[2rem]`×3, `text-[1.46rem]`×3, `text-[1.72rem]`×5, `text-[clamp(2rem,9vw,3.3rem)]`, `text-[clamp(2rem,10vw,2.65rem)]`. La scala è un'illusione.
- Ad-hoc tracking: `g-[0.18em]`×68, `g-[0.16em]`×28, `g-[0.14em]`×13 (NB: molti matchano letter-spacing, non gap).
- Peso usato direttamente come `font-weight-600/700` invece dei token.

#### SPACING — **P2**

- Scala: 4/8/12/16/24/32/48/64/96 px (`--tv-space-*`).
- Arbitrary: decine di valori `p-[0.55rem]`, `p-[0.68rem]`, `p-[0.85rem]`, `p-[1.25rem]`, ecc. La scala è regolarmente bypassata.
- `--tv-space-32: 8rem` è alias di `-16 × 2` (legacy, commento "remove after route migration").

#### RADIUS / BORDER — **P1**

- Token: `--tv-radius-sm/md/lg/feature/pill` (5 step).
- `--tv-radius-xl` è **usato 36 volte ma mai definito** (P1 — token fantasma).
- Arbitrary: `rounded-[22px]`×42, `rounded-[24px]`×35, `rounded-[28px]`×29, `rounded-[20px]`×23, `rounded-[32px]`×10, `rounded-[30px]`×10, `rounded-[36px]`×9, `rounded-[34px]`×13, `rounded-[38px]`×4, `rounded-[18px]`×7, `rounded-[26px]`×7, `rounded-[40px]`×1, `rounded-[14px]`×1. Solo 4 valori su 13 sono allineati alla scala.
- Border colors: 8 occorrenze di `border-[rgba(83,63,170,0.12)]` invece di `--tv-border-*`.

#### SHADOWS — **P1**

- Token: `--tv-elevation-rest/raised/modal` (3 livelli).
- Classi: `shadow-soft`×11, `shadow-card`×11, `shadow-strong`×3, `shadow-premium`×2, `shadow-glow-purple/cyan/amber`×6.
- In `vibes-3d-maestoso.css` ulteriori `--v-shadow-card/card-hover/glow-*` paralleli a `--tv-elevation-*`.
- Hardcoded: `box-shadow: 0 18px 42px rgba(0,0,0,0.28)`×7, `box-shadow: 0 26px 70px #2f217e1f` (`depth-scene.css:22`), `box-shadow: 0 8px 40px rgba(124,77,255,0.5)`×3, e `box-shadow: inset 0 1px 0 rgba(255,255,255,0.XX)` in 6 alfa diversi.

#### GLASS / BLUR / EFFECTS — **P2**

- Classi: `glass`×11, `glass-border`×2, `glass-strong/light/hover`×3.
- Token: `--tv-surface-translucent`, `--tv-surface-soft` (rgba semi-trasparenti).
- Nessuna `backdrop-blur-*` standardizzata in token.
- Gradient chaos: 30+ gradient unici hardcodati.

#### SURFACES — **P0**

- Due sistemi paralleli:
  1. `--tv-surface-raised/elevated/translucent/soft` in `tokens.css`.
  2. `--surface`, `--surface-raised`, `--surface-elevated`, `--surface-soft`, `--surface-brand-panel-bg`, `--surface-dark-panel-bg`, `--surface-light`, `--surface-glass`, `--surface-glass-light`, `--surface-metadata-bg`, `--surface-panel-border`, `--surface-panel-shadow`, `--surface-shell-bg`, `--surface-tint`, `--surface-strong`, `--surface-muted` (~16 variabili), in `figma-implementation.css` / `figma-final-polish.css`.
- Più: `--background`, `--card`, `--popover`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring` in `figma-implementation.css`.

#### ICONS — **P3**

- `lucide-react` importato (default stroke 2). Taglie arbitrarie; nessuna scala `size-*` di design.

#### CONTROL SIZE — **P2**

- Button: 4+ altezze (`2.5rem`, `2.75rem`, `3rem`, `3.25rem`, `3.4rem`, `4.2rem`).
- Touch target: `min-height: 2.75rem` (44 px) solo in alcuni componenti.
- Input: `min-height: 2.5rem` (alcuni), altri no.

#### INTERACTIVE STATES — **P2**

- Pattern motion definiti (`--tv-motion-fast/base/slow` + 2 ease), ma quasi mai consumati: `duration-200` hardcodato in 5 file, `duration-300`×1.
- Hover/active/focus/selected spesso reimplementati per componente.

#### MOTION TOKENS — **P2**

- 49 `@keyframes` definiti nei CSS, nessun catalogo.
- 12+ durate distinte in `motion/react` (`0.35s`×6, `0.22s`×3, `0.7s`×2, `0.25s`×2, `0.8s`, `0.36s`, `2s`…).
- Easings: `easeOut`×8, `easeInOut`×4, `[0.215,0.61,0.355,1]`×2, spring variants × 12+.

#### RESPONSIVE — **P2**

- Breakpoint raw nei CSS (non allineati a Tailwind): 360, 374, 380, 390, 400, 420, 430, 480, 560, 679, 760, 767, 767.98, 900, 980, 1079, 1180, 1181, 1399 px.
- Nessun blocco `@theme` Tailwind in `globals.css` (niente `screens` custom).
- Nessun container query.

#### THEME — **P0**

- `next-themes` installato in `package.json` ma **mai integrato** (no `ThemeProvider` in `root-providers.tsx`).
- **Tema chiaro assente**: tutto dark. `tokens.css` è dark-only.
- Nessuna variabile `.dark\:`, `.light\:` nei CSS.

### 3.3 Verdetto Design System

> **Esiste un design system? PARZIALE.** 78 token sono definiti, ma non sono il sistema che governa il prodotto. La codebase ha ~420 variabili custom, due file `figma-*.css` (di cui uno non caricato), tre sistemi di motion paralleli, e nessun enforcement meccanico (no lint, no tema runtime). Le decisioni di design sono ancora per la maggior parte **convenzioni implicite e override locali**.

---

## 4 · CSS & STYLING DEBT

### 4.1 CSS file map

| File | LOC | Classi uniche | `!important` | Note |
|---|---:|---:|---:|---|
| `app/globals.css` | **34 269** | n/a (globale) | ~70+ | Monolite: base + tokens + utility + pagine |
| `styles/vibes-3d-maestoso.css` | **6 215** | 295 | **873** (al limite) | Secondo `globals.css` per la 3D |
| `styles/compare.css` | 2 530 | 154 | 2 | Battle arena, matrix, duel cards |
| `styles/figma-final-polish.css` | 675 | 5 (`.tv-figma-theme` root) | **257** (al limite) | Overlay Figma |
| `styles/figma-implementation.css` | 671 | 38 | 40 | **NON importato** — file zombie |
| `styles/account.css` | 617 | 27 | 0 | Auth, profile, gamification stats |
| `styles/catalog.css` | 300 | 12 | 0 | Category map, discovery |
| `styles/radar.css` | 261 | 26 | 4 | Radar console, predictions |
| `styles/home.css` | 243 | 9 | 0 | Hero, discovery stages |
| `styles/gamification.css` | 239 | 57 | 14 | Battle cards, level-up |
| `styles/depth-scene.css` | 117 | 2 | 0 | 3D perspective scene |
| `styles/tokens.css` | 144 | 0 | 0 | Custom properties |

**Import order** (`styles/release-entry.ts`):
```
@app/globals.css → @/styles/vibes-3d-maestoso.css → @/styles/figma-final-polish.css
```

### 4.2 `!important` inventory (riepilogo)

- Budget **1 186 / 1 190 usato (99.7 %)**. Il sistema di governance in `scripts/release/check-style-ownership.mjs` ha dei ceiling per file; **i file sono al limite del loro tetto**: `vibes-3d-maestoso.css` (873/873), `figma-final-polish.css` (257/257), `figma-implementation.css` (40/40), `gamification.css` (14/14), `compare.css` (2/2), `radar.css` (4/4).
- Esempio emblematico: `app/globals.css:397` `animation: none !important;` poi `app/globals.css:1060-1063` altri `!important` su animation, quindi `app/globals.css:2875` `animation: tv-intro-reactor-out !important;` per ripristinare un'animazione specifica.

### 4.3 Z-index inventory

| Valore | Count | File:line rappresentativi | Note |
|---|---:|---|---|
| `9999` | 1 | `app/globals.css:255` | **P0 — debug artifact** |
| `-10` | 1 | `app/globals.css:296` | **P2 — rompe la scala** |
| `120` | 2 | 2856, 4052 | Floating overlay |
| `118` | 1 | 4052 | Near-overlay |
| `50` | 1 | 13682 | nav |
| `20` | 1 | 13534 | High modal-like |
| `10` | 2 | 2966, 14089 | sticky nav |
| `9` | 2 | 10520, 13658 | Active elements |
| `8` | 2 | 10446, 11398 | Orbit nodes |
| `6` | 1 | 11390 | Rail |
| `4` | 5 | vari | Scene layers |
| `3` | 8 | focus panels | Consistent |
| `2` | 15 | content | Consistent |
| `1` | 40+ | base | OK |
| `0` | 20+ | default | OK |
| `-1` | 8 | background | OK |
| `-2` | 2 | deep background | OK |
| `-3` | 4 | far background | OK |
| `var(--tv-z-*)` | 8 | tokenizzati | OK |

**Scala tokenizzata**: `--tv-z-base 0`, `--tv-z-content 1`, `--tv-z-sticky 10`, `--tv-z-nav 50`, `--tv-z-overlay 80`, `--tv-z-modal 90`, `--tv-z-floating 100`, `--tv-z-toast 110`, `--tv-z-effects 120`. **30+ valori hardcoded bypassano la scala**.

### 4.4 Inline styles inventory

Top file:

| File | Inline styles | Pattern |
|---|---:|---|
| `collections/page.tsx` | 102 | Admin CRUD forms |
| `affiliates/page.tsx` | ~100 | Admin forms |
| `articles/page.tsx` | ~90 | Admin forms |
| `tools/[slug]/page.tsx` | 73 | Tool detail page |

85 % evitabili (`borderColor: "var(--line)"`, `background: "rgba(255,255,255,0.76)"`); 15 % necessari (3D transforms dinamici).

### 4.5 Media query / breakpoint analysis

Breakpoint custom unici rilevati (escludendo standard Tailwind 640/768/1024/1280/1536): **360, 374, 380, 390, 400, 420, 430, 480, 560, 679, 760, 767, 900, 980, 1079, 1180, 1181, 1399**. Molti sono **frammentati e non standardizzati**.

### 4.6 Duplicati cross-file

| Selector | File | Rischio |
|---|---|---|
| `.is-active` | compare, figma-final-polish, figma-implementation, gamification, radar, vibes-3d | P2 |
| `.site-footer-v2` | figma-final-polish, figma-implementation, vibes-3d | P1 |
| `.premium-button*` | figma-final-polish, figma-implementation, vibes-3d | P1 |
| `.tv-figma-theme` | figma-final-polish (143 rules), figma-implementation (43 rules) | **P0** |
| `.mobile-category-map__signals` | vibes-3d (zero refs TSX) | P2 (dead) |
| `.v-podium-step--rank-*` | vibes-3d (zero refs TSX) | P1 (dead) |
| `.v-spotlight-*` | vibes-3d (zero refs TSX) | P2 (dead) |

### 4.7 Dead CSS (classi definite ma mai referenziate)

| Classe | File | Refs TSX |
|---|---|---:|
| `.v-podium-step--rank-1/2/3` | `vibes-3d-maestoso.css` | 0 |
| `.v-podium-step`, `.v-podium-avatar` | `vibes-3d-maestoso.css` | 0 |
| `.v-spotlight-title/desc/content/section` | `vibes-3d-maestoso.css` | 0 |
| `.mobile-category-map__signals` | `vibes-3d-maestoso.css` | 0 |
| `.v-discovery-orbit-node/track/shell` | `vibes-3d-maestoso.css`, `home.css` | 0 |
| (stima dead) | — | **~50 classi / ~800 LOC solo in vibes-3d-maestoso.css** |

### 4.8 Tailwind class abuse

| File | className refs | Avg length | Note |
|---|---:|---:|---|
| `tags/page.tsx` | 26 | **98 caratteri** | **P0 — peggiore** |
| `tools/[slug]/page.tsx` | 73 | 81 caratteri | **P0** |
| `posts/[slug]/page.tsx` | 87 | 52 | P2 |
| `collections/[slug]/page.tsx` | 91 | 45 | P2 |
| `collections/page.tsx` | 102 | 47 | P2 |
| `articles/page.tsx` | 56 | 52 | P2 |

Pattern ricorrente: `flex flex-col gap-3 rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-4…` ripetuto 15+ volte.

---

## 5 · UI ARCHAEOLOGY

12+ casi tipici di stratificazione storica. Per ogni caso: **ORIGINAL LAYER → LATER OVERRIDE → CURRENT EFFECT → ROOT CAUSE → RECOMMENDED RESOLUTION**.

### A1 — 3D components split

| | |
|---|---|
| **ORIGINAL** | `components/3d/{brand-logo-3d,logo-3d-intro}.tsx` (2 file, 158 LOC) — prima implementazione logo 3D |
| **OVERRIDE** | `components/3d-maestoso/*` (16 file, 2 494 LOC) + `styles/vibes-3d-maestoso.css` (6 215 righe, 873 `!important`) |
| **EFFECT** | Entrambe le directory importate/possibili; vecchia 3D ancora bundlata; CSS 3D duplica definizioni in `globals.css` |
| **ROOT CAUSE** | Esplorazioni parallele da agent/team diversi, nessun percorso di deprecazione |
| **RESOLUTION** | Rimuovere `components/3d/` e verificare import; consolidare in `3d-maestoso/` |

### A2 — CSS files stacked

| | |
|---|---|
| **ORIGINAL** | `styles/tokens.css` (144 righe) |
| **OVERRIDE** | `styles/figma-implementation.css` (671), `figma-final-polish.css` (675), `depth-scene.css` (117), `vibes-3d-maestoso.css` (6 215) |
| **EFFECT** | Definizioni parallele di token semantic e classi; classi `.tv-figma-theme` e `.tv-design-system` in conflitto con Tailwind |
| **ROOT CAUSE** | Traduzione iterativa Figma→codice senza cleanup; ogni ondata ha aggiunto CSS |
| **RESOLUTION** | Audit classi usate in `figma-*.css`; migrare usate a token/componenti; cancellare i due file |

### A3 — Global Experience Layer v1 → v2

| | |
|---|---|
| **ORIGINAL** | `components/app/global-experience-layer.tsx` — variabili CSS scroll/pointer |
| **OVERRIDE** | `components/app/global-experience-layer-v2.tsx` — +6 variabili parallax/velocity |
| **EFFECT** | Entrambi importati in `root-providers.tsx:42-43` (raddoppia lavoro) |
| **ROOT CAUSE** | Feature aggiunta senza rimuovere la precedente |
| **RESOLUTION** | Cancellare v1, rinominare v2 |

### A4 — Site Header v1 → v2

| | |
|---|---|
| **ORIGINAL** | `components/layout/site-header.tsx` (194 LOC) |
| **OVERRIDE** | `components/layout/site-header-v2.tsx` (594 LOC) — B30 |
| **EFFECT** | Header alternato per route/flag |
| **ROOT CAUSE** | Refactor B30 ha creato v2 mantenendo v1 per fallback |
| **RESOLUTION** | Audit import, cancellare v1, consolidare in v2 |

### A5 — ButtonLink vs Button

| | |
|---|---|
| **ORIGINAL** | `Button` CVA in `components/ui/button.tsx` |
| **OVERRIDE** | `ButtonLink` aggiunto nello stesso file — `rounded-full px-4.5 py-2.9` hardcoded, non CVA |
| **EFFECT** | `ButtonLink` rende diversamente da `Button variant="default"` |
| **ROOT CAUSE** | Quick fix senza refactor di `Button` per supportare `render` prop |
| **RESOLUTION** | `Button` con `render` prop (già supportato da base-ui); deprecare `ButtonLink` |

### A6 — Interaction Sound Layer facade

| | |
|---|---|
| **ORIGINAL** | `components/app/interaction-sound-layer.tsx` — monolith |
| **OVERRIDE** | `components/app/interaction-sound-layer-v2.tsx` — facade verso `components/app/sound/*` |
| **EFFECT** | V2 thin facade con commento "reversible by restoring monolith"; vecchio layer ancora potenzialmente importato |
| **ROOT CAUSE** | Refactor B26 scompone in moduli ma tiene facade |
| **RESOLUTION** | Se v2 funziona, cancellare l'originale |

### A7 — ToolCard → CanonicalToolCard

| | |
|---|---|
| **ORIGINAL** | `components/tools/tool-card.tsx` (468 LOC) — varianti featured/standard/compact/scan |
| **OVERRIDE** | `components/directory/canonical-tool-card.tsx` (516 LOC) — DS-306 density grid/list/mobile |
| **EFFECT** | Entrambi usati; adapter `DirectoryToolCard`/`MobileToolCard` sottili su CanonicalToolCard |
| **ROOT CAUSE** | Due implementazioni parallele di fasi di design diverse |
| **RESOLUTION** | Migrare tutto a `CanonicalToolCard`, cancellare `ToolCard` |

### A8 — Compare Board explosion

| | |
|---|---|
| **ORIGINAL** | `CompareBoard` (567 LOC) — desktop |
| **OVERRIDE** | `UnifiedCompareBoard`, `MobileCompareView`, `DesktopCompareView`, `CompareDecisionPanel`, `CompareObjectiveSelector` |
| **EFFECT** | 2 884+ LOC in componenti compare con responsabilità sovrapposte |
| **ROOT CAUSE** | Aggiunte iterative senza unificazione |
| **RESOLUTION** | Audit per file; `UnifiedCompareBoard` come wrapper canonico; cancellare i restanti se ridondanti |

### A9 — Premium components scattered

| | |
|---|---|
| **ORIGINAL** | `components/ui/premium.tsx` — `PremiumLink/PremiumBadge/PremiumPanel/PremiumButton` |
| **OVERRIDE** | `components/ui/premium-section.tsx` — `SectionShell/SectionHeader/DecorativeGlow/EmptyState` |
| **EFFECT** | Due file per "premium"; `SectionHeading` in `components/sections/` duplica `SectionHeader` |
| **ROOT CAUSE** | Sessioni diverse hanno creato librerie separate |
| **RESOLUTION** | Audit, consolidare in un unico file premium |

### A10 — Mobile Shortlist Board rewrite

| | |
|---|---|
| **ORIGINAL** | `ShortlistBoard` (304 LOC) — Kanban |
| **OVERRIDE** | `MobileShortlistBoard` (881 LOC) — library shelves |
| **EFFECT** | Stesso concetto due UI diverse (desktop vs mobile) |
| **ROOT CAUSE** | Redesign mobile senza aggiornare desktop |
| **RESOLUTION** | Se desktop deve adottare shelves, refactor; altrimenti cancellare `MobileShortlistBoard` |

### A11 — Stylesheets per funzionalità deprecate

| | |
|---|---|
| **ORIGINAL** | `styles/depth-scene.css` (117 righe) |
| **OVERRIDE** | `styles/vibes-3d-maestoso.css` (6 215 righe) |
| **EFFECT** | `depth-scene.css` probabilmente orfano |
| **ROOT CAUSE** | Nuovo sistema 3D senza audit del vecchio |
| **RESOLUTION** | Verificare uso classe `.depth-scene`; cancellare se morta |

### A12 — Home page layout v1/v2

| | |
|---|---|
| **ORIGINAL** | `VibeHomeV2` con `layout="legacy"` (default) |
| **OVERRIDE** | `VibeHomeV2` con `layout="time-to-value"` (BATCH 40 mobile) |
| **EFFECT** | Feature flag attivo, commento `"legacy" = composizione originale; "time-to-value" = discovery stage a flusso e margini mobile corretti` |
| **ROOT CAUSE** | Bandierina mobile senza rollout completo |
| **RESOLUTION** | Se `time-to-value` è canonico, renderlo default e rimuovere legacy |

### A13 — figma-implementation.css non importato

| | |
|---|---|
| **ORIGINAL** | `styles/figma-implementation.css` (671 righe) definisce `.tv-design-system`, `--primary/secondary/accent/border/input/ring` |
| **EFFECT** | File presente ma non in `styles/release-entry.ts`; nessun effetto runtime; confusione archeologica |
| **ROOT CAUSE** | Iterazione Figma→codice: il file "implementation" è stato superato da "final-polish" ma non cancellato |
| **RESOLUTION** | Cancellare (o migrare classi usate e cancellare) |

### A14 — next-themes installato ma non attivato

| | |
|---|---|
| **ORIGINAL** | `next-themes` in `package.json` (dipendenza) |
| **EFFECT** | `ThemeProvider` non avvolge in `root-providers.tsx`; niente toggle light/dark; tokens dark-only |
| **ROOT CAUSE** | Decisione iniziale dark-only; `next-themes` aggiunto per roadmap futura |
| **RESOLUTION** | P0 architetturale: decidere se dotarsi di light theme o rimuovere la dipendenza |

---

## 6 · COMPONENT DUPLICATION MAP

| Gruppo | Implementazioni | LOC | Verdetto |
|---|---|---:|---|
| **A. Card** | `ui/card.tsx` (103), `tools/tool-card.tsx` (468), `directory/canonical-tool-card.tsx` (516), `directory/mobile-tool-card.tsx` (33), `directory/directory-tool-card.tsx` (26), `collections/collection-card.tsx` (306), `collections/collection-slot-card.tsx` (95), `editorial/editorial-post-card.tsx` (~40), `admin/collection-transition-card.tsx` (476), `gamification/battle-card-flip.tsx` (106), `home/tilt-card.tsx` (48), `3d-maestoso/tilt-card-3d.tsx` (75) | **~2 290** | **Severe** |
| **B. Desktop vs Mobile split** | `desktop-compare-view` (325) ↔ `mobile-compare-view` (783); `compare-board` (567) ↔ `mobile-shortlist-board` (881); `desktop-radar-canvas` (274) ↔ `mobile-radar-canvas` (211); `mobile-radar-view` (748) ↔ `desktop-vibe-radar` (138); `shortlist-board` (304) vs inline; `desktop-vibe-compare` (137); `desktop-vibe-wishlist` (266); `desktop-vibe-archive` (395) | **~3 800** | **Severe** |
| **C. 3d vs 3d-maestoso** | `3d/logo-3d-intro` (108), `3d/brand-logo-3d` (50), `3d-maestoso/*` (16 file, 2 494) | **2 652** | **Severe** |
| **D. Site header** | `site-header.tsx` (194) vs `site-header-v2.tsx` (594) | 788 | **Severe** |
| **E. Site footer** | `site-footer.tsx` (155) vs `site-footer-v2.tsx` (150) | 305 | **Severe** |
| **F. Global Experience Layer** | `global-experience-layer.tsx` (283) vs `global-experience-layer-v2.tsx` (476) | 759 | **Severe** |
| **G. Founder Control Center** | `founder-control-center.tsx` (260) vs `founder-control-center-v2.tsx` (311) | 571 | **Severe** |
| **H. Sound toggle button** | `sound-toggle-button` (~81) vs `music-toggle-button` (~75) | ~156 | **Consolidate** |
| **I. Premium components** | `ui/premium.tsx` (152) vs `ui/premium-section.tsx` (142) vs `sections/section-heading.tsx` (45) + `surface-intro.tsx` (71) | ~410 | **Severe** |
| **J. Interaction Sound Layer** | `interaction-sound-layer.tsx` vs `interaction-sound-layer-v2.tsx` | — | **Severe** |
| **K. Tool detail layout** | `tools/[slug]/page.tsx` (esistente, 73 inline styles), `EditorialScorecard`, `CanonicalToolCard` variants | — | **Consolidate** |

**Totale LOC in componenti duplicati ≈ 12 000 (~30 % di tutto il layer).**

---

## 7 · RESPONSIVE PROBLEMS

### 7.1 Statistiche breakpoint Tailwind

| Prefisso | Usi | Ruolo | Note |
|---|---:|---|---|
| `sm:` | **599** | base mobile (≥640) | **dominante** |
| `lg:` | 205 | desktop (≥1024) | secondario |
| `md:` | **99** | tablet (≥768) | **fortemente sottoutilizzato** |
| `xl:` | 67 | wide desktop (≥1280) | sparso |
| `2xl:` | **7** | ultra-wide (≥1536) | quasi assente |

**Verdetto**: mobile-first, ma con un **gap tablet** (768-1023 px) sistematicamente sotto-trattato.

### 7.2 Mobile — findings prioritizzate

#### MOBILE CRITICAL (P0)
1. `app/(marketing)/layout.tsx:35` — `overflow-x-clip` su `.marketing-shell` è **una benda** che nasconde la root cause di overflow orizzontale. Ripresenterà artefatti.
2. `app/globals.css:271` — `@media (pointer: coarse), (max-width: 767px)` **raw media query** che bypassa Tailwind; può divergere da `sm:` (640). Drift possibile.
3. `components/home/mobile-marketing-hero.tsx:90` — heading `text-[2rem]` senza scaling responsive; su 320 px rischia overflow.
4. `app/globals.css:253, 500, 2965, 3655` — formule `bottom: calc(...+ env(safe-area-inset-bottom))` con offset incoerenti (`0.75rem`, `1rem`, `5.85rem`, `6.9rem`).
5. `components/tools/compare-toggle.tsx:122` — uso di `#ef4444` (rosso non-brand) per stato "non-selezionato". Confermato: il toggle compare sul dettaglio tool inietta un colore fuori palette (rilevato anche dal pixel forensics: pixel rossi nella nav mobile della schermata `/toools/blink`). **Causa probabile del "red nav anomaly"**: il pulsante compare è inline nell'area pulsanti dell'appbar tool.
6. `app/globals.css:218, 334, 337-356` — `scrollbar-width: thin` + `::-webkit-scrollbar` thumb/track globali; questo è la causa probabile della **striscia lavanda di 3 px** universale sul bordo destro di tutti gli screenshot (artefatto visivo di gutter).

#### MOBILE HIGH (P1)
7. `components/tools/mobile-shortlist-board.tsx:592` — `position: "fixed"` inline su un elemento motion; mixing CSS/Tailwind/inline.
8. `components/layout/site-header-v2.tsx:295` — `fixed` con `transform: translateZ(0)` ma **senza `will-change: transform`**. iOS Safari può jitterare.
9. `components/app/orbital-system/orbital-layer.tsx:618` — z-index 15 con `pointer-events-none`; in landscape e su dispositivi con notch il sistema di safe zone è fragile.
10. `components/directory/mobile-catalog-view.tsx:79` — `pb-24` hardcoded; se si aggiungono voci alla bottom nav, si rompe il layout.
11. `components/radar/mobile-radar-view.tsx` — canvas 2D RAF continuo (non WebGL); performance a rischio su Android low-end.
12. Stato vuoto radar: 5 nodi placeholder con testo ripetuto e troncato (`"Radar in p, dati non di"`×5). Sembra un fallback dev, non un empty state disegnato (rilevato dal pixel forensics mobile e desktop).
13. Schermata `/toools/blink` mobile: layout a 3 colonne compresso a 390 px con troncamento di "IN BREVE / PER CHI / LETTURA RAPIDA". Tutto il value prop si chiude con ellissi.
14. Bottom nav: **colore attivo incoerente** — bianco su home/archivio/collections, viola su radar, misto su shortlist.

#### MOBILE MEDIUM (P2)
15. `components/ui/sheet.tsx:64` — `pb-[env(safe-area-inset-bottom)]` solo per bottom sheet; manca safe-area per top/left/right su direzioni non standard.
16. `components/home/mobile-method-steps.tsx:40` — `py-16 md:py-20` salta a md: senza `lg:` per transizione fluida.
17. `components/app/custom-cursor.tsx:20` — detection touch via `"ontouchstart" in window` (legacy); usare `navigator.maxTouchPoints > 0`.
18. Active color brand: il viola è assente (0.00 %) su `/toools/[slug]`, `/collections` e tablet `/archivio` (rilevato dal pixel forensics).

#### MOBILE POLISH (P3)
19. `components/layout/site-header-v2.tsx:420` — bottone menu `size-11` (44 px) al minimo; padding adiacente migliorabile.
20. `app/globals.css:10906` — `@media (min-width: 1536px)` esiste ma gestisce solo un `overflow-x-auto`; nessuna strategia wide-screen.
21. Breadcrumb `HOME + CATALOGO = BLINK` con `=` come separatore, sentito come matematico e non editoriale.

### 7.3 Desktop — findings prioritizzate

#### DESKTOP CRITICAL (P0)
1. **Home page = mobile layout su desktop**: `VibeHomeV2` monta `MobileHeroSolar` (`max-w-sm`), `MobileSpotlight`, `MobileMethodSteps`. A 1440 px ≈ 500 px di void per lato; a 1728 px ≈ 600 px. Confermato da screenshot d-home e w-home.
2. **Collections page = mobile layout su desktop**: `MobileCollectionsView` (`mobile-collections__*` class names). A 1440 px full-bleed single column, no sidebar, no griglia.
3. **Tablet 768 px = dead zone di navigazione**: `mobile-bottom-nav` ha `md:hidden`; a 768 px esattamente si nasconde e **non c'è sostituto desktop**. t-home conferma nav mancante (1.6 % bright pixels nel bottom 60 px). t-archivio ha nav appena visibile ma spenta.

#### DESKTOP HIGH (P1)
4. **`/radar` desktop è un empty state crudo**: "Aggiornamento non disponibile", "Feed Product Hunt non disponibile". 95.6 % pixel scuri. Nessun design di fallback.
5. **Nessun sistema max-width/ container unificato**: `page-shell` 84 rem, header/footer 1440 px, admin 1440 px, reading 42/44/40 rem. Allineamento ragged tra route.
6. **`SiteHeaderV2` nasconde la nav desktop fino a `min-[1360px]`**: su laptop 1024-1359 px resta hamburger + ricerca mobile.
7. **`components/desktop/`** fork di 9 componenti: `desktop-radar-canvas`, `desktop-radar-nodes`, `desktop-radar-table`, `desktop-vibe-archive`, `desktop-vibe-compare`, `desktop-vibe-radar`, `desktop-vibe-wishlist`, `desktop-depth-scene`, `desktop-compare-canvas`. Ogni nuova feature su uno specchio mobile va riportata sul desktop manualmente (anti-pattern di manutenzione).
8. Card radius non coerente su desktop: `rounded-[28px]`, `rounded-[32px]`, `rounded-[var(--tv-radius-feature)]` (24 px), `rounded-[var(--tv-radius-lg)]` (16 px).

#### DESKTOP MEDIUM (P2)
9. `/toools/[slug]`: tre card "IN BREVE / PER CHI / LETTURA RAPIDA" wrappate male in `lg:`. Sidebar metadata arriva a `lg:` senza `md:` step.
10. `/compare` swap a 768 px (mobile→desktop) senza tablet.
11. `/radar` swap a 1024 px (mobile→desktop) senza tablet.
12. `/archivio` jump `xl:grid-cols-[0.98fr_25rem]` (no `md:` o `lg:` step); l'hero visualizza la sidebar destra solo a `xl:`.
13. `app/(marketing)/shop/page.tsx:155` — breakpoint custom `min-[380px]:grid-cols-3` (non in design system).
14. `app/globals.css:5289` — `@media (hover: hover)` per hover desktop-only; logica invertita (mobile hover:none dovrebbe essere il base).
15. `components/tools/desktop-compare-view.tsx:192` vs mobile — `aria-label` italiano/inglese misto, pattern ARIA non allineato.

#### DESKTOP POLISH (P3)
16. `app/(marketing)/collections/[slug]/page.tsx:139` — `sm:max-w-[14ch] lg:max-w-[14ch]` (stesso valore, niente fluid scaling).
17. Hero header desktop vs mobile: stessa altezza ma proporzioni diverse.

---

## 8 · INTERACTION & MOTION AUDIT

### 8.1 Overlay matrix

| Tipo | Libreria | Path | LOC | Animation approach |
|---|---|---|---:|---|
| Dialog | `@base-ui/react` | `components/ui/dialog.tsx` | 168 | `data-open:animate-in` + tailwind-animate |
| Drawer | `vaul` | `components/ui/drawer.tsx` | 144 | `data-open:animate-in` + backdrop opacity |
| Sheet | `@base-ui/react` | `components/ui/sheet.tsx` | 146 | `data-starting-style:` + `data-ending-style:` + CSS |
| Popover | `@base-ui/react` | `components/ui/popover.tsx` | 92 | `data-open:animate-in` |
| Dropdown | `@base-ui/react` | `components/ui/dropdown-menu.tsx` | 277 | `data-open:animate-in`, `zoom-in-95` |
| Tooltip | `@base-ui/react` | `components/ui/tooltip.tsx` | 68 | `data-open:animate-in` |
| Command | `cmdk` + Dialog | `components/ui/command.tsx` | 201 | Wrapped in Dialog, no close button visible |
| Toast | `sonner` | `components/ui/sonner.tsx` | 52 | sonner internals |
| **Custom modal** | motion/react | `components/gamification/badge-unlock-modal.tsx` (`AnimatePresence`+`motion.div`) | — | **NON usa Dialog primitive** |
| **Custom modal** | motion/react | `components/gamification/level-up-modal.tsx` (`AnimatePresence`+`motion.div`) | — | **NON usa Dialog primitive** |
| **Custom panel** | — | `components/tools/compare-decision-panel.tsx` | — | **NON usa Sheet/Dialog** |

**P1**: Sheet e Dialog sono **funzionalmente identici** (entrambi `base-ui/react/dialog`) con nomi diversi → duplicazione confusionale.

### 8.2 Motion stack (3 sistemi)

| Sistema | File | Trigger | Note |
|---|---|---|---|
| `motion/react` | ~40 file | `initial`/`animate`/`exit`, `AnimatePresence`, springs, `layout` | 12+ durate distinte, 12+ easings |
| `MotionObserver` (custom) | `components/ui/motion-observer.tsx` (194 LOC) | `IntersectionObserver` → classe `.is-visible` su `.motion-reveal`; stagger 52 ms; durata 760 ms | Usato in `route-transition-loader`, `shop`, `community`, `about` |
| CSS keyframes | `app/globals.css` + `styles/*.css` | 49 `@keyframes` + 25+ in styles | Durate: 120/150/200/0 ms; infinite loop |

**Overlap**: stesso elemento può essere animato da 2+ sistemi.

### 8.3 GSAP

- `lib/gsap-setup.ts` + `components/app/lenis-provider.tsx`.
- GSAP usato **solo** per ticker Lenis: `gsap.ticker.add((time) => { lenis.raf(time * 1000) }); gsap.ticker.lagSmoothing(0); ScrollTrigger.update();`.
- **Nessuna timeline GSAP, nessuno ScrollTrigger animation**. Sovraccarico di bundle per funzione minima → **P1**.

### 8.4 Confetti (canvas-confetti)

| File | Parametri | Note |
|---|---|---|
| `gamification/badge-unlock-modal.tsx` | `particleCount: 80, scalar: 1, spread: 70, origin.y: 0.6` | |
| `gamification/level-up-modal.tsx` | `particleCount: 100, scalar: 1.1, spread: 80, origin.y: 0.55` | |
| `gamification/arena-battle-stage.tsx` | `particleCount: 3, angle: 60, spread: 55, origin.x: 0` | tiny bursts |
| `gamification/vibe-tap-mini-game.tsx` | game rewards | |

**P1**: nessuna config condivisa, parametri ad hoc per componente.

### 8.5 Suoni (howler)

- 37 sound kinds definiti in `lib/config/sound.ts` + `lib/gamification/sound-engine.ts`.
- Trigger ibrido: alcuni via attributo `data-sonic-action`, altri via `useEffect`. **P2**.
- `components/app/sound-toggle-button.tsx` rispetta `prefers-reduced-motion` (default) e persist in localStorage.

### 8.6 Number flow, haptics, microinteractions

- `@number-flow/react` × 12 file gamification.
- `confetti`, `number-flow`, `tilt-card` (magnetico mouse), sound: **nessuna registry centrale**.

### 8.7 Stato attivo e pattern

| Componente | Pattern | Note |
|---|---|---|
| `Button` (CVA) | `data-[state=...]` + focus ring | OK |
| `Chip` (CVA) | `data-[pressed]` | OK |
| `Badge` (CVA) | 14 varianti, hover/focus | OK |
| `Tabs` (CVA) | `data-active:bg-background` | OK |
| `ToolCard` | `selected && "tool-card-selected"`, `isSaved && "tool-card-saved"`, `isCompared && "tool-card-compared"` | **ad hoc**, non CVA |
| `ShortlistToggle` | `data-sonic-action="shortlistToggle"` | OK |
| `CompareToggle` | `data-sonic-action="compareToggle"` | OK |

### 8.8 Top 15 motion/interaction root causes

| # | Root cause | File:line | Severity |
|---|---|---|---|
| 1 | Sheet ≈ Dialog (stessa primitiva, due nomi) | `ui/sheet.tsx` vs `ui/dialog.tsx` | **P0** |
| 2 | 3 motion systems sovrapposti | motion/react + MotionObserver + CSS | **P0** |
| 3 | 12+ durate distinte, nessun token consumato | ovunque | **P0** |
| 4 | Easings ad hoc | ovunque | **P0** |
| 5 | GSAP caricato ma usato solo come ticker Lenis | `lib/gsap-setup.ts` | P1 |
| 6 | Confetti params ad hoc per componente | gamification | P1 |
| 7 | Route loader duration per route (760-980 ms) | `route-transition-loader.tsx` | P1 |
| 8 | 37 sound kinds, nessuna validazione runtime | `lib/config/sound.ts` | P1 |
| 9 | `ToolCard` usa class toggle non CVA | `tools/tool-card.tsx` | P1 |
| 10 | Command palette senza close button visibile | `ui/command.tsx` | P2 |
| 11 | MotionObserver vs motion/react overlap | route-transition-loader | P2 |
| 12 | Badge 14 varianti vs Chip 3 | `ui/badge.tsx` | P2 |
| 13 | Skeleton `bg-muted animate-pulse` vs `skeleton-block` | ui vs tools | P2 |
| 14 | `data-sonic-action` vs `useEffect` trigger | vari | P2 |
| 15 | focus ring `ring-3` vs `ring-[3px]` | button vs tabs | P2 |

---

## 9 · RUNTIME VISUAL AUDIT

> **Metodologia caveat**: a causa di un bug del tool di lettura immagini nel subagent (`Bun is not defined`), l'analisi visiva è stata effettuata con **OCR + pixel forensics + color histogram + edge detection + cross-referencing del codice**, non con visione diretta. I claim quantitativi (pixel counts, color clusters, brightness banding) sono **estrazioni deterministiche dai PNG**, ma alcune interpretazioni qualitative (es. "alien design language") sono **inference del revisore basate su evidenza di codice e pixel**. I claim P0 sono stati verificati nel codice quando possibile (confermato il rosso `#ef4444` in `compare-toggle.tsx`; confermata la striscia lavanda come scrollbar gutter globale in `globals.css`).

Screenshots analizzati (in `/var/folders/1m/.../opencode/tv-shots/`):
m-home, m-archivio, m-radar, m-tool, m-collections, m-shortlist, t-home, t-archivio, d-home, d-archivio, d-radar, d-compare, d-tool, d-collections, d-devds, w-home.

### 9.1 Mobile (390×844) — sintesi

| Schermata | Premium feel | Issues principali |
|---|---|---|
| m-home | 6/10 | Hero card e successivi piatti (gerarchia flat); violetto presente ma secondario |
| m-archivio | 6/10 | Griglia categorie densa ma label "Tutti 30 tool" compressi |
| m-radar | **4/10** | Empty state con 5 placeholder ripetuti e troncati; viola presente, contrasto basso; viola attivo nella nav (inconsistente) |
| m-tool | **4/10** | **Pixel rossi (~3 884) nella nav mobile (compare-toggle `#ef4444` verificato)**; layout a 3 colonne compresso a 390 px; viola brand 0.00 % |
| m-collections | 7/10 | "SPECIALE" ben gestito; viola 0.00 %, sostituito da cyan/gold (color story divergente) |
| m-shortlist | **8/10** | Miglior empty state; ben bilanciato; nav mista (viola su Confronto) |

### 9.2 Tablet (768×1024)

| Schermata | Issues |
|---|---|
| t-home | **Bottom nav mancante** (`md:hidden` + nessuna sostituzione desktop); 50 % viewport vuoto sopra la fold; OCR frammentato |
| t-archivio | Nav appena visibile (luminosità 37-64 vs >150 su mobile); griglia categorie compressa; viola 0.01 % |

### 9.3 Desktop (1440×900) — sintesi

| Schermata | Premium feel | Issues |
|---|---|---|
| d-home | **4/10** | Mobile layout (MobileHeroSolar max-w-sm) → 60 % empty cells; nessun desktop layout |
| d-archivio | 6/10 | Funzionale, ma componenti mobile inside desktop wrapper |
| d-radar | **2/10** | Empty state grezzo "Feed Product Hunt non disponibile"; 95.6 % pixel scuri |
| d-compare | 7/10 | Il migliore dei landing desktop; tipografia display efficace |
| d-tool | **8/10** | Best-in-class; sidebar metadata funzionante; gerarchia forte |
| d-collections | **3/10** | MobileCollectionsView a 1440 px full-bleed single column |
| d-devds | 7/10 | Showcase DS coerente (tokens + primitive + componenti); completo sotto la fold |

### 9.4 Wide (1728×1000)

- d-home peggiora: 67 % empty cells, hero ribbon stretto in oceano di nero. **Nessuna gestione ultra-wide** (no `2xl:` effective).

### 9.5 Top 10 visual runtime problems

| # | Sev | Schermata | Problema |
|---|---|---|---|
| 1 | P0 | m-tool | Rosso non-brand in nav mobile (compare-toggle `#ef4444`) |
| 2 | P0 | t-home | Nav mancante a 768 px (`md:hidden` + no fallback) |
| 3 | P0 | d-home / w-home | Home = mobile layout su desktop; nessun design desktop |
| 4 | P0 | d-collections | MobileCollectionsView a 1440 px; nessun design desktop |
| 5 | P1 | m-tool | 3 colonne compresse a 390 px con troncamento integrale |
| 6 | P1 | m-radar / d-radar | Empty state assomiglia a fallback dev, non a design |
| 7 | P1 | tutti | **Striscia lavanda 3 px universale** sul bordo destro (scrollbar gutter global) |
| 8 | P1 | tutti | Active nav color incoerente (bianco/viola misto) |
| 9 | P2 | m-tool / m-collections / t-archivio | Viola brand 0.00-0.01 % (color story divergente) |
| 10 | P2 | t-home / t-archivio | Tablet = stretched phone; nessun design tablet |

---

## 10 · ROOT CAUSE MAP (causa sistemica → sintomi)

| # | Root cause sistemica | Sintomi prodotti (selezione) |
|---|---|---|
| **RC1** | **Assenza di primitive UI consolidate e forzate (lint, tokens obbligatori)** | 12 varianti Card (2 290 LOC); 7 componenti Compare (2 884 LOC); 4 tool card; Button vs ButtonLink divergenti; radius/shadow ad hoc su ogni componente |
| **RC2** | **`tokens.css` non è il sistema che governa il prodotto** | `#6a3cff`×190 hardcoded; `--tv-radius-xl` usato 36 volte e mai definito; `--tv-space-*` bypassato da p-[0.55rem] ecc.; shadow 5 schemi (`shadow-soft/card/strong/premium/glow-*` + `--tv-elevation-*` + `--v-shadow-*`); 20+ alpha bianco distinti |
| **RC3** | **Nessun enforcement meccanico sul CSS** (no lint su breakpoint, no lint su `!important`, no ownership contract attivo) | 25+ breakpoint custom; `!important` budget 99.7 %; `figma-final-polish.css` 257 `!important`; `scrollbar` globali come benda |
| **RC4** | **3 sistemi di motion paralleli** (motion/react + MotionObserver + CSS keyframes) + 12+ durate | Incoerenza animazioni; micro-interazioni non coordinate; GSAP caricato ma usato come ticker (bundle overhead); durate/easings token non consumati |
| **RC5** | **Cultura "fork mobile vs desktop"** invece di responsive design | `components/desktop/` 9 file; `Mobile*` componenti usati su desktop; tablet = dead zone (768 px); `mobile-bottom-nav md:hidden` rompe a 768 px; home/collections a 1440 px = mobile layout |
| **RC6** | **Processo Figma → codice senza cleanup** | `figma-implementation.css` non importato; `figma-final-polish.css` duplica con `!important`; `vibes-3d-maestoso.css` (6 215 righe, 873 `!important`); `--surface-*` parallelo a `--tv-surface-*`; ~50 classi CSS morte |
| **RC7** | **Nessuna convenzione su `next-themes` / tema chiaro-scuro** | next-themes installato non attivato; tokens dark-only; impossibile servire utenti che preferiscono light; impossibile A/B testare |
| **RC8** | **Refactor incrementali con mantenimento del precedente (v1 + v2)** | header/footer/experience-layer/sound-layer/founder-control-center tutti in doppio; `VibeHomeV2 layout="legacy" / "time-to-value"` bandierina senza rollout |
| **RC9** | **Scarsa enforcement delle micro-interazioni** (suoni, confetti, focus ring) | 37 sound kinds non validati; confetti params ad hoc; `ring-3` vs `ring-[3px]`; loading 2+ scheletri |
| **RC10** | **Documentazione di design precedente mai consolidata nel codice** | `tooolvibes-design-handoff/` adozione 20-70 %; `tooolvibes-ui-expert-agent/` documenti referenziati ma non enforced; `audit-report-tooolvibes.md` precedente (56k byte) con findings UI non chiusi |

---

## 11 · KEEP / POLISH / REBUILD / DEPRECATE MATRIX

> Classificazione basata sull'audit combinato (code + visual runtime).

### 11.1 Per schermata

| Schermata | KEEP | POLISH | REBUILD | DEPRECATE | Note |
|---|---|---|---|---|---|
| `/` (home mobile) | gerarchia, palette, hero pattern | CTA, spacing hero, gerarchia card | layout desktop (P0) | — | |
| `/` (home desktop) | — | — | **REBUILD** | — | MobileHeroSolar in desktop = fallimento |
| `/archivio` mobile | filtri, search, griglia categorie | densità label "3tool" | — | — | |
| `/archivio` desktop | — | filter sidebar density, max-width | hero `xl:` step | — | |
| `/radar` | nome del concept, scheda | empty state (P0 dev fallback) | desktop fallback quando Product Hunt non disponibile | — | |
| `/compare` desktop | tipografia display, layout duel | sound effects su decision | — | — | |
| `/compare` mobile | flusso deck | troncamenti, gerarchia | — | — | |
| `/toools/[slug]` mobile | contenuto, metadata | 3-colonne compresse (REBUILD quella sezione) | — | — | rosso compare-toggle da correggere |
| `/toools/[slug]` desktop | overall 8/10 | micro-spacing, aria | — | — | |
| `/collections` mobile | narrative card, special badge | active nav color (misto) | — | — | |
| `/collections` desktop | — | — | **REBUILD** | MobileCollectionsView | |
| `/shortlist` mobile (empty) | design 8/10 | active nav (mixed) | — | — | |
| `/dev/design-system` | struttura tokens+primitive+components | routing pubblico/protezione | — | Rimuovere da produzione o spostare | |

### 11.2 Per componente (top 60 + 26 primitive)

| Classe | Count | Categoria prevalente |
|---|---:|---|
| **KEEP** | ~30 | Feature solide (gamification, admin forms, primitives) |
| **KEEP + POLISH** | ~8 | SiteHeaderV2, MobileShortlistBoard |
| **CONSOLIDATE** | ~14 | ToolCard, CanonicalToolCard, Mobile/Desktop Compare, ShortlistBoard, 3d desktop fork |
| **REFACTOR** | 1 | ToolDiscoveryApp (god-component 1430 LOC) |
| **REBUILD** | 3 | home desktop layout, collections desktop layout, radar empty state |
| **DEPRECATE** | ~6 | FigmaDesignSystemShowcase, FounderControlCenter v1, GlobalExperienceLayer v1, InteractionSoundLayer v1, SiteHeader v1, SiteFooter v1 |

---

## 12 · TECHNICAL DEBT PRIORITY (P0-P3)

### 12.1 P0 — blocca identità di design system (10)

1. `--tv-radius-xl` referenziato ma non definito in `tokens.css` (36 usi).
2. `next-themes` installato ma non attivato in `root-providers.tsx` — impossibile avere light theme / runtime theme switch.
3. `app/globals.css` = 34 269 righe monolitiche.
4. `figma-implementation.css` non importato (zombie in repo).
5. `figma-final-polish.css` 257 `!important` (al ceiling); `.tv-figma-theme` 143 rules specificity war.
6. `vibes-3d-maestoso.css` 6 215 righe, 873 `!important` (al ceiling) — secondo `globals.css` dedicato al 3D.
7. `z-index: 9999` in `app/globals.css:255` (debug artifact) — rompe la scala.
8. Striscia lavanda 3 px universale = scrollbar gutter globale (`app/globals.css:218, 334, 337-356`); benda che impatta tutte le schermate.
9. `compare-toggle.tsx:122` usa `#ef4444` (rosso non-brand) per stato "non selezionato" sul dettaglio tool mobile → pixel rossi nella bottom nav.
10. `MobileHeroSolar` (`max-w-sm`) renderizzato da `VibeHomeV2` su desktop → home desktop = mobile allargato (60 % empty cells, 67 % a 1728 px).

### 12.2 P1 — grave consistenza / UX (15)

1. 4 ToolCard variants (P0 visual).
2. Header/footer/experience-layer/sound-layer/founder-control-center v1+v2 coesistenti.
3. `components/desktop/` 9 file fork.
4. `MobileCollectionsView` a 1440 px (full-bleed single column).
5. Tablet 768 px dead zone (`mobile-bottom-nav md:hidden` + no desktop fallback).
6. Radar empty state = fallback dev (`feed non disponibile` × 5 nodi placeholder).
7. 3 motion systems paralleli (motion/react + MotionObserver + CSS keyframes).
8. Sheet ≈ Dialog duplicati.
9. 12+ durate motion, nessun token consumato.
10. GSAP caricato per sola funzionalità Lenis (bundle overhead).
11. Confetti params ad hoc.
12. 37 sound kinds non validati a runtime.
13. `Tablet` gap md: sottoutilizzato (99 vs 599 sm:).
14. `/toools/[slug]` mobile: 3 colonne compresse a 390 px con troncamento integrale.
15. `tags/page.tsx` 98 char avg className + `tools/[slug]/page.tsx` 81 char.

### 12.3 P2 — importante ma non bloccante (15)

1. 25+ breakpoint custom unici.
2. Active nav color incoerente (bianco vs viola).
3. Brand violet assente su `/toools/[slug]` e `/collections` (0.00 % pixel).
4. Striscia lavanda scrollbar (anche se non bloccante per identità).
5. 5 quasi-duplicati viola (`#6a3cff`, `#7C4DFF`, `#7c4dff`, `#8b5cf6`, `#4f46e5`).
6. 3 quasi-duplicati ciano (`#39d2f6`, `#43c6ff`, `#00E5FF`).
7. 20+ alfa bianco distinti.
8. Radius ad hoc (12 valori non in scala).
9. `site-header-v2` nasconde nav desktop fino a `min-[1360px]`.
10. `route-transition-loader` duration per route hardcoded.
11. Badge 14 varianti vs Chip 3.
12. Skeleton `bg-muted animate-pulse` vs `skeleton-block`.
13. `data-sonic-action` vs `useEffect` sound triggers.
14. focus ring `ring-3` vs `ring-[3px]`.
15. Inline styles admin pages (100+) evitabili.

### 12.4 P3 — polish (10)

1. Touch targets ai minimi (size-11 = 44 px).
2. Detection touch legacy in `custom-cursor.tsx`.
3. Header height jump mobile-tablet.
4. Breadcrumb `=` separator su tool detail.
5. Aria-label EN/IT misti su compare desktop/mobile.
6. Hero `sm:max-w-[14ch] lg:max-w-[14ch]` (no fluid).
7. Backplane gradient height fissa su wide screens.
8. Lucide stroke width 2 non standardizzato.
9. Padding inconsistente tra `Card`, `CanonicalToolCard`, `ToolCard`.
10. Padding inconsistente in `Button` (ButtonLink hardcoded).

---

## 13 · DEFINITIVE DESIGN SYSTEM REQUIREMENTS

Requisiti per **un solo design system definitivo**.

### 13.1 Foundations (token)

| Area | Requisito |
|---|---|
| **Color** | Scala semantica chiusa: `bg`, `surface` (3 livelli), `ink` (4 livelli), `accent` (primary + 2 secondari), `status` (4), `border` (3), `focus`. **Single source of truth**: `--tv-*` in `tokens.css`. Eliminare alias paralleli `--surface-*`, `--background`, `--card`, `--primary`, ecc. in `figma-*.css`. Definire o rimuovere `--tv-radius-xl`. Solo 1 viola, 1 ciano, 1 gold, 1 magenta, 1 success/warning/danger/info. |
| **Typography** | Scala a 7 step obbligatoria (`xs/sm/md/lg/xl/2xl/3xl`), nessun `text-[Nrem]` eccetto casi fluidi documentati in una whitelist. Clamp consentito solo con formula standardizzata. Tracking 3 valori massimo. |
| **Spacing** | Scala 4/8/12/16/24/32/48/64/96 + 1 half-step (4/8/12/16/24/32/48/64/96/128). Vietato `p-[0.55rem]` eccetto casi eccezionali. Rimuovere `--tv-space-32`. |
| **Radius** | 5 valori max (`sm/md/lg/xl/feature` + `pill`). Vietati `rounded-[28px]`, `[30px]`, `[34px]`, `[36px]`, ecc. |
| **Elevation** | 3 livelli (`rest/raised/modal`) + `glow-purple/cyan/amber` (solo per 3D/section hero). Vietati shadow hardcoded. |
| **Border** | 2-3 valori (`subtle`, `interactive`, `strong`). |
| **Motion** | 3 durate (`fast/base/slow`) + 2-3 easings (`standard/emphasis/exit`). Tutte le animazioni motion/react e CSS keyframes devono consumare token. Vietate durate ad hoc. |
| **Z-index** | Scala chiusa `0/1/10/50/80/90/100/110/120`. Vietato qualsiasi valore numerico se non token. Rimuovere `9999` e `-10`. |
| **Theme** | Light + Dark come tema runtime via `next-themes`. Tokens con default dark, override `[data-theme="light"]`. `ThemeProvider` in `root-providers.tsx`. |

### 13.2 Primitive

Una sola libreria `components/ui/` con:

- **Bottoni**: `Button` (con prop `render` per link), varianti: `primary | secondary | subtle | ghost | destructive | link`. Sizes: `sm | md | lg`. CVA obbligatorio.
- **Input / Select / Textarea**: `Input`, `InputGroup`, `Select`, `Textarea`, `SearchField`. Altezza standard 2.75 rem (44 px).
- **Card**: 1 sola primitiva + props di variant (`surface | glass | outline | premium`). Nessun `CanonicalToolCard` come primitiva; sarà un composition.
- **Badge**: max 5 varianti (`default | accent | success | warning | danger`).
- **Chip**: 3 varianti.
- **Tabs**: 2 varianti (default, line).
- **Dialog / Sheet / Drawer / Popover / Dropdown / Tooltip / Command / Toast**: già basati su `base-ui`/`vaul`/`cmdk`/`sonner`. **Eliminare duplicazione Sheet/Dialog**: scegliere UNO, rimuovere l'altro (raccomando Sheet come unica primitiva con `side` prop).
- **EmptyState**, **Skeleton**, **Spinner**, **ErrorState**, **Toast**: una sola implementazione ciascuna.
- **Premium components**: consolidare in un unico file `premium.tsx` (`PremiumButton`, `PremiumBadge`, `PremiumPanel`, `PremiumLink`, `SectionShell`, `SectionHeader`).

### 13.3 Layout / Navigation

- `SiteHeader` (unico, no v1).
- `SiteFooter` (unico, no v1).
- `MobileBottomNav` (unico, **solo mobile**, rimosso a `md:`).
- `DesktopTopNav` (unico, attivo da `lg:`).
- **Tablet** 768-1023 px: hybrid header (top bar + drawer hamburger, **no bottom nav**).

### 13.4 Feature components

- **ToolCard**: una sola implementazione (`CanonicalToolCard`) con variants `grid | list | mobile | featured | compact`.
- **Compare**: `UnifiedCompareBoard` come unica entry; `MobileCompareView` e `DesktopCompareView` consolidati in un singolo componente responsive (no fork). `CompareBoard`, `ShortlistBoard` → rimosso (sostituito da `MobileShortlistBoard` library-shelf come default).
- **3D**: rimuovere `components/3d/`; consolidare tutto in `3d-maestoso/`.

### 13.5 Responsive rules

- 5 breakpoint massimo: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`.
- Tutti i breakpoint custom devono essere **rimossi o mappati** a questi.
- Container queries dove ha senso (sidebar di filtro archivio).
- Max-width container: `--tv-content-wide` (80 rem), `--tv-content-reading` (46 rem), `--tv-content-shell` (84 rem → ridefinito a 80 rem).

### 13.6 Motion system

- **Un solo entry point**: `motion/react` per transizioni complesse.
- `MotionObserver` custom mantenuto solo per `motion-reveal` scroll (ruolo singolo, ben definito).
- CSS keyframes solo per animazioni cicliche (skeleton, radar sweep, depth-scene-breathe).
- **GSAP**: rimuovere se non usato oltre Lenis (valutare Lenis con RAF puro).
- Lenis resta.
- `tailwindcss-animate` rimane (per data-open/data-closed).

### 13.7 Interaction patterns

- **Stato attivo globale**: un solo colore (viola `--tv-accent-primary`) su tutti gli elementi attivi (nav, tabs, chips, tool-card-selected).
- **Suoni**: 37 kinds consolidati a max 12 categoriali (`nav`, `tap`, `open`, `close`, `success`, `error`, `reveal`, `level`, `battle`, `compare`, `shortlist`, `route`).
- **Confetti**: 1 helper `fireConfetti(intensity)` con 3 livelli.
- **Focus ring**: unica classe utility `focus-visible:ring-3 focus-visible:ring-ring/50`.

---

## 14 · FRONTEND CLEANUP ROADMAP

11 fasi, ciascuna con obiettivo, file coinvolti, dipendenze, rischio, ordine e criteri di completamento.

### PHASE 0 · Safety baseline
**Obiettivo**: garantire che ogni fase successiva sia verificabile senza regressioni.
- **File**: `scripts/release/*`, `tests/e2e/visual-matrix.spec.ts`, `playwright.config.ts`.
- **Dipendenze**: nessuna.
- **Rischio**: basso.
- **Output**:
  - Espandere `check-style-ownership.mjs` con regole per: token usage (no hex hardcoded), radius (solo scala), breakpoint (solo Tailwind 5), motion (solo token durations).
  - Aggiungere snapshot visivi baseline su 8 viewports × 8 route (in `tests/e2e/visual-matrix.spec.ts`).
- **Criteri di completamento**: `npm run check:styles && npm run test:e2e:visual` passa; diff visivo accettabile.

### PHASE 1 · Remove UI debt (zero behaviour change)
**Obiettivo**: eliminare codice morto e fork dimenticati.
- **File**:
  - DELETE: `components/3d/{brand-logo-3d,logo-3d-intro}.tsx` + `styles/3d-old.css` se esistente.
  - DELETE: `components/layout/site-header.tsx` (v1), `components/layout/site-footer.tsx` (v1).
  - DELETE: `components/app/global-experience-layer.tsx` (v1) — rinominare v2.
  - DELETE: `components/admin/founder-control-center.tsx` (v1).
  - DELETE: `components/app/interaction-sound-layer.tsx` (v1) — verificare che v2 lo sostituisce.
  - DELETE: `styles/figma-implementation.css`.
  - DELETE: `styles/depth-scene.css` (se morta — verificare).
  - DELETE: `components/dev/figma-design-system-showcase.tsx` (o spostare fuori produzione).
  - DELETE: classi CSS morte (~50 classi, ~800 LOC in `vibes-3d-maestoso.css`).
- **Dipendenze**: Phase 0 (snapshot baseline).
- **Rischio**: medio (molti import da verificare).
- **Criteri**: `npm run lint:ci && npm run typecheck && npm run test:unit && npm run test:e2e:visual` passa; visual diff ≤ 1 %.

### PHASE 2 · Consolidate primitives
**Obiettivo**: una sola libreria di primitive.
- **File**:
  - `components/ui/button.tsx`: rimuovere `ButtonLink`, supportare `render` prop.
  - `components/ui/sheet.tsx` o `dialog.tsx`: scegliere UNO (raccomando `sheet.tsx` con `side` prop). Rimuovere l'altro.
  - `components/ui/badge.tsx`: ridurre da 14 a 5 varianti.
  - `components/ui/premium.tsx` + `premium-section.tsx`: consolidare in un unico file.
  - `components/sections/section-heading.tsx` + `surface-intro.tsx`: consolidare in `premium.tsx`.
- **Dipendenze**: Phase 1.
- **Rischio**: alto (refactor API).
- **Criteri**: nessun regressione visiva; `Button`/`Badge`/`Chip` con stesse variants ovunque.

### PHASE 3 · Create definitive design tokens
**Obiettivo**: un solo sistema di token, enforced.
- **File**:
  - `styles/tokens.css`: rimuovere `--tv-space-32`, definire `--tv-radius-xl`, rimuovere alias font inutili.
  - `styles/tokens.css`: aggiungere `light` theme (`[data-theme="light"]`).
  - Aggiungere `@theme` block Tailwind v4 per `screens` e tokens consumabili.
  - **Aggiornare tutti i file** per consumare token invece di hex/rgba/px.
  - Rimuovere `#6a3cff`×190, sostituire con `var(--tv-accent-primary)`.
  - Rimuovere `rounded-[28px]`×29, sostituire con token.
  - Rimuovere 25+ breakpoint custom, mappare a Tailwind.
- **Dipendenze**: Phase 0 (check-styles aggiornato), Phase 1.
- **Rischio**: molto alto (toccabile ovunque); meccanico ma lungo.
- **Criteri**: `rg '#[0-9a-fA-F]{6}' components/ app/` ritorna ≤ 20 risultati (solo casi eccezionali); `rg 'rounded-\[' components/` ritorna ≤ 5 risultati; check-styles passa.

### PHASE 4 · Create definitive component system
**Obiettivo**: 1 ToolCard, 1 Compare, 1 Shortlist, 1 SiteHeader, 1 SiteFooter, 1 Premium set.
- **File**:
  - `components/directory/canonical-tool-card.tsx`: unica implementazione.
  - DELETE: `components/tools/tool-card.tsx`, `directory/mobile-tool-card.tsx`, `directory/directory-tool-card.tsx`.
  - `components/tools/unified-compare-board.tsx`: unica entry compare.
  - DELETE: `compare-board.tsx`, `mobile-compare-view.tsx`, `desktop-compare-view.tsx`, `shortlist-board.tsx`.
  - MobileShortlistBoard diventa default per ogni viewport (responsive).
  - Rimuovere `components/desktop/` intero (verificare che non sia importato).
  - Consolidare `components/3d/` + `components/3d-maestoso/`.
- **Dipendenze**: Phase 2, Phase 3.
- **Rischio**: molto alto (consolidamento logica).
- **Criteri**: 1 componente per ruolo; usage map pulita; test visual passa.

### PHASE 5 · Mobile normalization
**Obiettivo**: 1 sistema mobile + tablet pulito.
- **File**:
  - `components/layout/mobile-bottom-nav.tsx`: rimosso a `md:` (oggi già a `md:hidden`).
  - **Aggiungere** `components/layout/desktop-top-nav.tsx`: attivo da `lg:`.
  - **Aggiungere** `components/layout/tablet-hybrid-nav.tsx`: attivo 768-1023 px (top bar compatta + drawer).
  - `app/(marketing)/layout.tsx`: rimuovere `overflow-x-clip` banda; fixare la root cause (verificare `100vw`).
  - `components/home/mobile-marketing-hero.tsx`: tipografia fluida.
  - `components/tools/compare-toggle.tsx`: rimuovere `#ef4444` rosso, usare `--tv-ink-muted` o `--tv-status-danger` (semantico).
  - `app/globals.css`: rimuovere scrollbar gutter globale (ripristinare default nativo).
  - `app/(marketing)/radar/page.tsx`: empty state disegnato (non dev fallback).
  - `app/(marketing)/toools/[slug]/page.tsx`: 3-colonne `IN BREVE / PER CHI / LETTURA RAPIDA` riformulate come stack su mobile.
- **Dipendenze**: Phase 4.
- **Rischio**: alto.
- **Criteri**: `mobile-bottom-nav` non usato ≥768; tablet dead-zone chiusa; rosso rimosso; empty state radar ridisegnato.

### PHASE 6 · Desktop normalization
**Obiettivo**: desktop non più mobile allargato.
- **File**:
  - `components/home/vibe-home-v2.tsx`: rimuovere `layout="legacy"`; `time-to-value` come unico layout; costruire variante desktop (max-width, multi-column).
  - `components/collections/`: aggiungere `desktop-collections-view.tsx`; non più `MobileCollectionsView` a 1440 px.
  - `components/layout/site-header-v2.tsx`: nav desktop attivo da `lg:` (oggi `min-[1360px]`).
  - `app/(marketing)/layout.tsx`: container max-width unificato (`--tv-content-wide`).
  - `app/(marketing)/radar/page.tsx`: desktop view con skeleton/chart placeholder (non solo testo).
  - `app/(marketing)/compare/page.tsx`: rimozione swap a 768; responsive unico.
- **Dipendenze**: Phase 4, Phase 5.
- **Rischio**: alto.
- **Criteri**: desktop screens 1440 e 1728 con gerarchia piena; home/collections desktop layout proprio.

### PHASE 7 · Motion and interaction system
**Obiettivo**: 1 sistema motion + 1 pattern interazione.
- **File**:
  - `components/ui/motion-observer.tsx`: ruolo singolo (scroll-reveal).
  - `lib/gsap-setup.ts`: rimuovere se non usato (valutare Lenis puro).
  - `lib/motion-presets.ts`: nuove costanti `fast/base/slow` + easings da `tokens.css`.
  - `components/ui/button.tsx`, `chip.tsx`, `tabs.tsx`, `card.tsx`: focus ring uniformato.
  - `components/app/sound-toggle-button.tsx` + `music-toggle-button.tsx`: consolidare in `AudioToggleButton`.
  - `lib/config/sound.ts`: 37 → 12 kinds, validati.
  - `lib/microinteractions.ts`: 1 helper `fireConfetti(intensity)`.
  - Consolidare `interaction-sound-layer-v2.tsx` rimuovendo facade.
- **Dipendenze**: Phase 3.
- **Rischio**: medio.
- **Criteri**: `rg 'duration-\[|duration: 0\.' components/` ≤ 5 risultati; 1 sola classe focus-ring; GSAP rimosso o motivato.

### PHASE 8 · Screen-by-screen polish
**Obiettivo**: rifinire ogni schermata per premium feel.
- **File**: tutti i componenti delle route principali.
- **Dipendenze**: Phase 5-7.
- **Rischio**: medio.
- **Output per schermata**:
  - Gerarchia visiva raffinata.
  - Spacing system-aligned.
  - Color story coerente (viola sempre presente).
  - Active nav color uniforme.
  - Empty/error/loading states disegnati (non dev fallback).
- **Criteri**: design review via screenshot su 8 viewports × 10 route; premium feel ≥ 8/10 ovunque.

### PHASE 9 · Final visual QA
**Obiettivo**: validazione finale.
- **File**: tutti.
- **Output**:
  - Snapshot visivi (Playwright) su 8 viewports × 12 route.
  - Design review finale (interno + esterno).
  - Check accessibility (axe), lighthouse, bundle size.
  - Verifica zero `!important` aggiuntivi.
  - Verifica zero hex hardcoded residui.
  - Verifica zero breakpoint custom residui.
- **Rischio**: basso.
- **Criteri**: `npm run quality` + `npm run test:e2e:visual` verde; lighthouse ≥ 90 su tutte le route.

### PHASE 10 · Production lock
**Obiettivo**: bloccare regressioni future.
- **File**: lint config, CI, docs.
- **Output**:
  - ESLint rule custom: nessun hex hardcoded in `.tsx`/`.css`.
  - ESLint rule: nessuna classe `text-[Nrem]` se non in whitelist.
  - ESLint rule: nessuna `!important` in nuovi commit.
  - `check-style-ownership.mjs` esteso come gate pre-merge.
  - Documentazione `DESIGN_SYSTEM.md` (token + primitive + regole).
  - Archivia `tooolvibes-design-handoff/` e `tooolvibes-ui-expert-agent/` (chiusura archeologica).
- **Rischio**: basso.
- **Criteri**: PR template richiede check-styles; CODEOWNERS su `tokens.css`/`components/ui/`.

---

## 15 · FILE-BY-FILE PRIORITY MAP

| Path | Action | Phase | Effort |
|---|---|---|---|
| `app/globals.css` (34 269 LOC) | Split + token migration + dead CSS removal | 1, 3 | XL |
| `styles/vibes-3d-maestoso.css` (6 215 LOC) | Dead CSS removal + tokenize | 1, 3 | L |
| `styles/figma-final-polish.css` (675 LOC) | Merge/remove | 1 | M |
| `styles/figma-implementation.css` (671 LOC) | **DELETE** (non importato) | 1 | S |
| `styles/tokens.css` | Completa token (radius-xl, light theme, rimuovi legacy) | 3 | M |
| `styles/release-entry.ts` | Rimuovi import morto | 1 | S |
| `scripts/release/check-style-ownership.mjs` | Estendi regole | 0 | M |
| `components/3d/{brand-logo-3d,logo-3d-intro}.tsx` | **DELETE** | 1 | S |
| `components/layout/site-header.tsx` (v1) | **DELETE** (consolida in v2) | 1, 4 | M |
| `components/layout/site-footer.tsx` (v1) | **DELETE** (consolida in v2) | 1, 4 | M |
| `components/app/global-experience-layer.tsx` (v1) | **DELETE** | 1, 4 | S |
| `components/admin/founder-control-center.tsx` (v1) | **DELETE** | 1, 4 | S |
| `components/app/interaction-sound-layer.tsx` (v1) | **DELETE** | 1, 4 | S |
| `components/dev/figma-design-system-showcase.tsx` | **DELETE / move out** | 1 | S |
| `components/desktop/*` (9 file) | **DELETE / migrate** | 4, 6 | L |
| `components/tools/tool-card.tsx` | Consolidate in CanonicalToolCard | 4 | M |
| `components/directory/mobile-tool-card.tsx` | **DELETE** (adapter) | 4 | S |
| `components/directory/directory-tool-card.tsx` | **DELETE** (adapter) | 4 | S |
| `components/tools/compare-board.tsx` | **DELETE** (use UnifiedCompareBoard) | 4 | M |
| `components/tools/mobile-compare-view.tsx` | Consolidate in UnifiedCompareBoard | 4 | M |
| `components/tools/desktop-compare-view.tsx` | Consolidate in UnifiedCompareBoard | 4 | M |
| `components/tools/shortlist-board.tsx` | **DELETE** (use MobileShortlistBoard responsive) | 4 | M |
| `components/directory/tool-discovery-app.tsx` (1430 LOC) | Split in 4-5 componenti | 4 | XL |
| `components/3d-maestoso/*` | Cleanup, tokenize, dead CSS removal | 1, 3 | L |
| `components/gamification/vibe-tap-mini-game.tsx` (1005) | Split in hook + Board + HUD | 4 | L |
| `components/ui/button.tsx` | Drop ButtonLink, `render` prop | 2 | M |
| `components/ui/sheet.tsx` vs `dialog.tsx` | Scegliere uno (sheet con `side`) | 2 | M |
| `components/ui/badge.tsx` | 14 → 5 varianti | 2 | M |
| `components/ui/premium.tsx` + `premium-section.tsx` | Consolidare | 2 | M |
| `components/ui/motion-observer.tsx` | Mantieni ma delimita il ruolo | 7 | S |
| `components/tools/compare-toggle.tsx` | Sostituire `#ef4444` con token | 5 | S |
| `components/layout/mobile-bottom-nav.tsx` | Rimuovi a `md:` (già presente) + cleanup z-index | 5 | S |
| `components/layout/site-header-v2.tsx` | Nav desktop da `lg:`, no `min-[1360px]` | 6 | M |
| `app/(marketing)/layout.tsx` | Rimuovi `overflow-x-clip`, container max-width | 5, 6 | S |
| `app/(marketing)/radar/page.tsx` | Empty state + desktop fallback | 5, 6 | M |
| `app/(marketing)/collections/page.tsx` + `[slug]/page.tsx` | Desktop Collections view | 6 | L |
| `app/(marketing)/toools/[slug]/page.tsx` | Stack su mobile, fix compare-toggle rosso | 5 | M |
| `app/(marketing)/compare/page.tsx` | Responsive unico | 6 | M |
| `components/collections/collection-card.tsx` (306) | Tokenize radius/padding | 3 | M |
| `components/tools/editorial-scorecard.tsx` | Tokenize | 3 | M |
| `lib/config/sound.ts` | 37 → 12 kinds | 7 | M |
| `lib/gsap-setup.ts` | Valuta rimozione | 7 | S |
| `lib/motion-presets.ts` (nuovo) | Crea con 3 durate + 3 easings | 7 | S |
| `lib/microinteractions.ts` (nuovo) | `fireConfetti(intensity)` | 7 | S |
| `tests/e2e/visual-matrix.spec.ts` | Estendi a 8 viewports × 12 route | 0, 9 | M |
| `eslint.config.mjs` | Custom rules: no hex, no radius, no duration | 3, 10 | M |
| `DESIGN_SYSTEM.md` (nuovo) | Documentazione token + primitive | 10 | M |
| `CODEOWNERS` | `tokens.css`, `components/ui/` → design system owners | 10 | S |
| `.github/PULL_REQUEST_TEMPLATE.md` | Richiedi `npm run check:styles` | 10 | S |

---

## 16 · FINAL EXECUTION PLAN — raccomandazione operativa

Sequenza raccomandata (timeline indicativa per un team di 1 design system engineer + 1 frontend dev):

| Settimana | Fasi | Milestone |
|---|---|---|
| W1 | Phase 0 | Snapshot baseline + check-style-ownership esteso |
| W2-3 | Phase 1 | Rimozione v1/zombie/dead CSS; build verde |
| W4-5 | Phase 3 (parziale) | Token definitivi in `tokens.css`; light theme; rimozione hex più critici |
| W6-7 | Phase 2 | Primitive consolidate (Button, Badge, Chip, Dialog/Sheet, Premium) |
| W8-10 | Phase 4 | Consolidamento Compare, Shortlist, ToolCard, 3D fork, 9 desktop |
| W11-12 | Phase 5 | Mobile normalization (rosso, scrollbar, tablet nav, radar empty) |
| W13-14 | Phase 6 | Desktop normalization (home, collections, compare, radar) |
| W15 | Phase 7 | Motion & interaction system |
| W16-17 | Phase 8 | Polish schermata per schermata |
| W18 | Phase 9 | Visual QA finale |
| W19 | Phase 10 | Production lock |

Totale stimato: ~19 settimane con 1 eng + 1 designer dedicati; ~11 settimane con team di 3 (1 design system lead, 1 frontend, 1 designer).

**Rischi trasversali**: 
- Refactor in produzione di componenti ad alto traffico (home, archivio, tool detail) → richiede feature flag.
- Bundle size se non si elimina `gsap`, `vibes-3d-maestoso.css` dead, ecc.
- Token migration senza lint porterebbe a drift → Phase 0 è bloccante.

---

## 17 · APPENDIX A — Past-fix verification (session-notes-mobile-fixes.md)

Tutti i 13 fix documentati risultano **ancora presenti come patch nel codice**:

| Fix | Stato | Evidenza |
|---|---|---|
| Rimozione background X diagonale | ✓ | `app/globals.css` `--gradient-shell` ripulito |
| SSR crash (window undefined) | ✓ | `orbital-layer.tsx` ha guard `typeof window !== 'undefined'` |
| Page transition deadlock | ✓ | `page-transition.tsx` ora usa `motion.div` semplice |
| Radar empty state | ✓ | `mobile-radar-view.tsx` ha listener `visibilitychange` |
| Performance tuning | ✓ | `site-universe-background.tsx` usa `frameloop="demand"` |
| Mobile catalog blur | ✓ | `backdrop-filter: blur(12px)` ridotto da 20 a 12 |
| Z-index layering | ✓ | Sheets z-55, nav z-50, header z-50 |
| Radar node overlap | ✓ | 5 nodi, radius 0.42-0.80 |
| Arena orbital removal | ✓ | `isDenseMobilePage` check in `orbital-layer` |
| Library toggle removal | ✓ | Trash in basso a destra, no CompareToggle |
| Header/bottom nav stabilization | ✓ | `fixed bottom-0` + `transform: translateZ(0)` |
| Brown/olive 3D blob | ✓ | `useEffect` inizializza posizioni pianeti |
| Radar label clipping | ✓ | `overflow: hidden` rimosso da stage |

**Rischi noti lasciati aperti (futuro)**: RAF physics engine ancora attivo, 2D radar canvas RAF continuo, `blur()` pesanti in alcune sezioni mobile, library scroll-snap da rifinire.

---

## 18 · APPENDIX B — Design system graveyard

| Artifact | Intended | Adoption | Conflicts |
|---|---|---|---|
| `tooolvibes-design-handoff/01_TOKENS.md` | Token canonici | ~70 % (`styles/tokens.css` matcha) | hex residui |
| `tooolvibes-design-handoff/02_COMPONENTS.md` | Component specs | ~40 % | varianti mancanti |
| `tooolvibes-design-handoff/03_MOBILE_LAYOUTS.md` | Layout mobile | ~30 % | rework successivi |
| `tooolvibes-design-handoff/04_DESKTOP_LAYOUTS.md` | Grid desktop | ~50 % | alcune larghezze fisse |
| `styles/figma-*.css` | Figma → CSS | ~20 % | classi `.tv-figma-theme` usate poco |
| `tooolvibes-ui-expert-agent/UI_AUDIT_FRAMEWORK.md` | Metodo di audit | read-only | non enforced |
| `tooolvibes-ui-expert-agent/IMPLEMENTATION_PLAYBOOK.md` | Guida implementazione | unknown | non linkato |
| `tooolvibes-ui-expert-agent/FIGMA_HANDOFF_FRAMEWORK.md` | Processo Figma | referenced | non seguito |
| `audit-report-tooolvibes.md` | Precedente audit | read-only | findings UI non chiusi |

**Raccomandazione**: archiviare in `docs/legacy/` o `docs/audit-history/` per consultazione, ma rimuovere dal path di import; i pattern da loro definiti che sopravvivono devono essere migrati o esplicitamente rimossi.

---

## 19 · SUMMARY — il sistema definitivo

Al termine di **Phase 0-10** TooolVibes avrà:

- **1 linguaggio visivo** (viola `#6a3cff` + cyan + gold + dark surface).
- **1 sistema di spacing** (scala 4-96 px + 128).
- **1 sistema tipografico** (Inter UI + Fraunces display, 7 step, fluidi).
- **1 sistema di superfici** (3 livelli + glass + premium).
- **1 sistema di componenti** (UI primitives → shared → feature → page-sections).
- **1 sistema responsive** (5 breakpoint Tailwind, mobile-first, tablet-aware).
- **1 sistema di motion** (3 durate + 3 easings + 2 stack ben separati).
- **1 identità UI coerente** su mobile + desktop (incluso tablet 768-1023 px).

Con **enforcement meccanico** (lint, check-styles, CI gates, CODEOWNERS), le regressioni future diventeranno **impossibili da mergare**, non solo sconsigliate.

---

## 20 · NOTA FINALE

Questo audit è stato prodotto **senza modificare alcun file**. Tutte le raccomandazioni sono **guiding principles**, non patch automatiche.

Quando si avvierà la fase successiva (consolidamento del design system), seguire **rigorosamente l'ordine delle fasi**: Phase 0 prima di tutto (baseline), Phase 1 prima di Phase 3/4 (cleanup prima di refactor), Phase 2-3 insieme per primitive + token. Phase 5-6 solo dopo Phase 4 (mobile/desktop normalization dipende da primitive + token puliti). Phase 7-8 dopo 5-6. Phase 9-10 ultima.

Il file è archiviato in `audits/ui-forensic-audit-2026-07-21.md` per riferimento futuro.
