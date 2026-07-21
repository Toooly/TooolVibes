# TooolVibes — UI Phase 2 + 3 Foundation Report

**Date**: 2026-07-21
**Phases**: 2 (Architecture Foundation) + 3 (Primitive Foundation)
**Mode**: design system constitution — DOCUMENTATION ONLY, zero modifications to existing components
**Status**: ✅ COMPLETE — fermo qui, in attesa di approvazione utente per Phase 4+

---

## 1. EXECUTIVE SUMMARY

Le fasi 2 e 3 della bonifica architetturale frontend di TooolVibes hanno prodotto **4 documenti di fondazione** che definiscono come sarà il design system definitivo, senza toccare alcun componente esistente.

**Deliverable prodotti:**

| # | File | Righe | Bytes | Scope |
|---|------|-------|-------|-------|
| 1 | `audits/tooolvibes-design-system-constitution.md` | 621 | ~20KB | 20 sezioni: brand, principi, filosofia di ogni layer, governance |
| 2 | `audits/ui-phase-2-3-token-map.md` | 753 | ~27KB | Token forensics + architettura 4-layer + nuovi token proposti |
| 3 | `audits/ui-phase-2-3-primitive-map.md` | 565 | ~22KB | 26 primitives → 24 canonical + 2 deprecated, overlay taxonomy |
| 4 | `audits/ui-phase-2-3-report-2026-07-21.md` (questo file) | questo | questo | Sintesi operativa |

**Vincoli rispettati rigorosamente:**
- ✅ Nessuna modifica a componenti esistenti
- ✅ Nessun redesign
- ✅ Nessun light theme (dark-first confermato come decisione di prodotto)
- ✅ Nessuna modifica a business logic / API / DB
- ✅ Tutta la documentazione è leggibile come "faro" per i contributor futuri

---

## 2. PHASE 2 CONSTITUTION SUMMARY

`audits/tooolvibes-design-system-constitution.md` è il documento di identità del prodotto. Stabilisce:

### 2.1 Brand Identity
- **Nome**: TooolVibes (tre O per estetica)
- **Posizionamento**: directory editoriale indipendente di tool AI, "curatela vs rumore"
- **Tono**: editorial-vibrant, mai corporate, mai hype

### 2.2 Principi visivi (6 binding)
1. **Editoriale sopra decorativo** — la tipografia racconta
2. **Curatela sopra quantità** — meglio 5 elementi perfetti che 20 mediocri
3. **Viola come ancora** — `#6a3cff` è l'unico brand color riconoscibile
4. **Ciano come segnale** — `#39d2f6` solo per call-to-action primari e stati attivi
5. **Oro come rarità** — `#f3bf4c` solo per badge "Speciale", premi, achievement
6. **Dark-first sempre** — il tema scuro non è una variante, è il default

### 2.3 Decisioni vincolanti
- **5 viola quasi-duplicati → 1 solo**: `#6a3cff` vince, gli altri diventano forbidden
- **20+ alpha bianco → 5 livelli**: 0.06, 0.10, 0.16, 0.24, 0.72
- **Fraunces (display) + Inter (UI)** sono le uniche famiglie font ammesse
- **Tablet 768-1024px è cittadino di prima classe**, non un afterthought
- **Skip-link è sacro** — il `z-index: 9999` su `.skip-link` non è un bug, è a11y intenzionale

### 2.4 5 protected signals (ciò che rende TooolVibes riconoscibile)
1. Il viola #6a3cff nel logo, nella CTA primaria, nel focus ring
2. Il pattern "curatela editoriale" nella tipografia ibrida Fraunces/Inter
3. La metafora "radar/sonar" nelle visualizzazioni radar
4. Il "Speciale" badge dorato per le raccolte premium
5. La densità stratificata (compact / standard / feature) per gestire gerarchia

### 2.5 10 anti-pattern (ciò che non deve MAI più succedere)
1. ❌ Nuovi hex hardcoded nei componenti
2. ❌ Nuove durate motion arbitrarie (`transition: 0.3s` → vietato)
3. ❌ Nuovi !important senza giustificazione
4. ❌ Nuovi breakpoint custom oltre i 6 canonici
5. ❌ Nuove famiglie font
6. ❌ Sheet e Dialog usati come sinonimi (hanno tassonomia precisa)
7. ❌ z-index arbitrari oltre lo scale (-10/0/1/10/50/80/90/100/110/120/9999)
8. ❌ Inline styles nei componenti (admin forms hanno eccezione documentata)
9. ❌ Density "feature" per contenuti non-hero
10. ❌ Light theme "perché tanto è facile"

---

## 3. PHASE 2 TOKEN MAP SUMMARY

`audits/ui-phase-2-3-token-map.md` è il forensic dei token esistenti + l'architettura 4-layer proposta.

### 3.1 Stato attuale dei token

| Layer | Token trovati | Stato |
|-------|---------------|-------|
| `--tv-*` semantic | 91 in `tokens.css` | ~25 con traffico reale, 3 PHANTOM, 3 UNUSED |
| `--primary/--secondary/--accent` shadcn | inline in globals.css | parallelo a `--tv-*`, da consolidare |
| `--surface-*` scattered | 100+ custom property in vari file | frammentato, da consolidare |
| `.dark` oklch block | `globals.css` ~riga 14000 | dead code (mai selezionato attivamente) |
| Tailwind v4 `@theme` | `globals.css:13260` inline | ridefinisce `--radius-*` (xl=32px), shadow |

### 3.2 Bug latenti scoperti

| Token | Problema | Impatto |
|-------|----------|---------|
| `--tv-radius-xl` | **36 usi, 0 definizioni** | Classico phantom: i componenti usano `var(--tv-radius-xl)` che non esiste, fallback al default browser |
| `--tv-pointer-tilt-y` / `--tv-pointer-tilt-x` | 14 usi ciascuno | Runtime-set (impostati da JS), funzionano ma sono dynamic-only |
| `--font-manrope` / `--font-rubik` | definiti ma unused | Alias morti che puntano a `--font-inter` |
| `--tv-space-32: 8rem` | duplica `--tv-space-16 × 2` | Legacy alias da rimuovere |

### 3.3 Hex debt
2369 occorrenze esadecimali nei sorgenti:
- `#6a3cff` ×525 (brand viola)
- `#ffffff` ×684 / `#fff` ×526 (bianco)
- `#39d2f6` ×270 (ciano)
- `#f3bf4c` ×188 (oro)
- altri ~176 occorrenze sparse

### 3.4 Architettura 4-layer proposta

```
FOUNDATION (atomico, no business logic)
  └── --tv-color-purple-500, --tv-color-white, --tv-color-cyan-500, etc.
       └── SEMANTIC (ruolo, non valore)
            └── --tv-bg-base, --tv-accent-primary, --tv-ink-primary
                 └── COMPONENT (uso specifico)
                      └── --tv-button-bg-primary, --tv-card-radius
                           └── FEATURE (contesto applicativo)
                                └── --tv-radar-node-active, --tv-arena-bg
```

Questo permette: foundation rimane stabile per anni, semantic cambia solo a rebrand, component evolve con il prodotto, feature è locale.

### 3.5 Nuovi token proposti

| Token | Valore | Rationale |
|-------|--------|-----------|
| `--tv-radius-modal` | 1.75rem (28px) | Radius specifico per modal/dialog |
| `--tv-elevation-floating` | `0 24px 60px rgba(0,0,0,0.42)` | 4° livello elevation per FAB/orbital |
| `--tv-color-*` foundation | 12 token colore raw | Sostituiscono i 5 viola quasi-duplicati con UN solo valore canonico + 11 sfumature |
| `--tv-z-backplane` | -10 | Documenta l'eccezione backplane (marketing gradient) |
| `--tv-z-skip` | 9999 | Documenta l'eccezione a11y skip-link |
| `--tv-density-*` | compact/standard/feature | Token per i 3 livelli di densità (padding, font-size, line-height) |
| `--tv-motion-instant` | 80ms | Per hover state immediati |
| `--tv-motion-cinematic` | 720ms | Per intro/loader/3D reveal |
| `--tv-container-*` | mobile/tablet/app/wide/uw | Container max-width per viewport tier |

### 3.6 Scale motion proposta

| Token | Valore | Uso |
|-------|--------|-----|
| `--tv-motion-instant` | 80ms | Hover/focus state changes |
| `--tv-motion-fast` | 160ms (esistente) | Click feedback, toggle |
| `--tv-motion-base` | 240ms (NUOVO, era 180ms) | Transitions standard, sheet open |
| `--tv-motion-slow` | 360ms (NUOVO, era 280ms) | Modal, page transition |
| `--tv-motion-cinematic` | 720ms (NUOVO) | Intro/loader/3D reveal |

Rationale: 180ms è borderline tra "fast" e "base". Portarlo a 240ms rende il "fast" veramente percepibile e il "base" abbastanza lento da non sembrare istantaneo.

### 3.7 Easing canoniche

```
--tv-ease-standard: cubic-bezier(0.2, 0, 0, 1)      (default)
--tv-ease-emphasis: cubic-bezier(0.4, 0, 0.2, 1)    (emphasis)
+ 4 spring categories (gentle, smooth, snappy, bouncy) per motion/react
```

### 3.8 Container system proposto

```
--tv-container-mobile:  20rem  (320px)
--tv-container-tablet:  44rem  (704px)
--tv-container-app:     56rem  (896px)   = --tv-content-reading esistente
--tv-container-wide:    64rem  (1024px)
--tv-container-uw:      84rem  (1344px)  = --tv-content-wide esistente
```

---

## 4. PHASE 3 PRIMITIVE MAP SUMMARY

`audits/ui-phase-2-3-primitive-map.md` è l'inventario dei 26 primitives esistenti + la roadmap per arrivare a 24 canonical + 2 deprecated.

### 4.1 Stato attuale

26 primitives in `components/ui/`, 2931 LOC totali.

| Tecnologia | Count | File |
|------------|-------|------|
| CVA variants | 8 | button, badge, chip, input-group, avatar, tabs, accordion, select |
| base-ui/react | 12 | dialog, sheet, drawer, popover, dropdown-menu, tooltip, accordion, tabs, select, input, textarea, separator |
| vaul | 1 | drawer (wraps vaul) |
| cmdk | 1 | command |
| embla-carousel | 1 | carousel |
| sonner | 1 | sonner (toast) |
| Custom only | 9 | skeleton, premium, premium-section, motion-observer, overlay-provider, chip (anche se ha CVA), carousel wrapper |

### 4.2 Top consumers (chi usa cosa)

| Primitive | Consumer count |
|-----------|----------------|
| Button | 60+ |
| Badge | 50+ |
| Input | 40+ |
| Card | 35+ |
| Chip | 30+ |
| Dialog | 15+ |
| Sheet | 8 |
| Drawer | 5 |
| Tabs | 12 |
| Tooltip | 10 |

### 4.3 Stato canonico proposto (dopo Phase 4)

**24 CANONICAL** (raggruppati per ruolo):

```
ACTION (4)
  - Button         (8 variants, 4 sizes, 6 states)
  - IconButton     (NEW - estrazione Button icon-only)
  - LinkButton     (NEW - consolidamento ButtonLink)
  - ButtonGroup    (NEW - per segmented controls)

CONTAINER (4)
  - Surface        (NEW - base wash, sostituisce premium.tsx)
  - CardShell      (NEW - riunisce ui/card + canonical-tool-card come composizione)
  - InteractiveSurface (NEW - per tile cliccabili)
  - SectionShell   (NEW - sostituisce premium-section.tsx)

INPUT (5)
  - Input          (esistente, 1 variant)
  - Textarea       (esistente)
  - InputGroup     (esistente con CVA)
  - Select         (esistente)
  - SearchInput    (NEW - search bar canonica per catalog/header)

LABEL (2)
  - Badge          (14 → 6 variants: default/brand/success/warning/danger/info)
  - Chip           (3 variants: default/accent/outline)

OVERLAY (7)
  - Dialog         (modal centered)
  - Sheet          (side sheet desktop, espandibile)
  - Drawer         (bottom sheet mobile vaul)
  - Popover        (lightweight anchored)
  - Tooltip        (hover-only)
  - Command        (cmdk + Dialog)
  - Toast          (sonner wrapper)

DISCLOSURE (2)
  - Accordion      (esistente)
  - Tabs           (esistente con 2 variants)

FEEDBACK (3)
  - Skeleton       (esistente)
  - EmptyState     (NEW - canonical empty state)
  - Avatar         (esistente con CVA)

SYSTEM (3)
  - Separator      (esistente)
  - Carousel       (esistente embla)
  - MotionObserver (esistente, custom IntersectionObserver)
```

### 4.4 2 DEPRECATED

| File esistente | Sostituto | Strategia |
|----------------|-----------|-----------|
| `components/ui/premium.tsx` (152 LOC) | Surface + Button variants + Badge brand variant | I 4 component (PremiumLink, PremiumBadge, PremiumPanel, PremiumButton) vengono migrati a: Button variant="brand" / Badge variant="brand" / Surface variant="panel" |
| `components/ui/premium-section.tsx` (142 LOC) | SectionShell + SectionHeader + DecorativeGlow | I 4 component (SectionShell, SectionHeader, DecorativeGlow, EmptyState) diventano primitive canoniche condivise |

### 4.5 Overlay taxonomy (6 patterns + 1 system)

| Pattern | Componente | Quando usarlo |
|---------|-----------|---------------|
| Modal Dialog | Dialog | Decisione critica, focus completo, dismissable con Esc/overlay click |
| Side Sheet | Sheet | Pannello contestuale desktop, spinge il contenuto |
| Bottom Sheet | Drawer (vaul) | Pannello contestuale mobile, drag-to-dismiss |
| Drawer (legacy) | Drawer | Side panel persistente (admin/sidebar) |
| Popover | Popover | Menu leggero ancorato, no backdrop |
| Tooltip | Tooltip | Info on hover, no interazione |
| Fullscreen mobile | custom | Schermata intera mobile (NON un overlay in senso tecnico) |
| Toast | Toast (sonner) | Notifica non-bloccante, auto-dismiss |

Decision tree: **serve bloccare il flusso? → Dialog. Si/no decisione? → Modal Dialog. Pannello laterale desktop? → Sheet. Pannello dal basso mobile? → Drawer. Menu leggero? → Popover. Solo info? → Tooltip.**

### 4.6 Bug esistenti da fixare in Phase 4

1. **3 inline motion.div modali** in `components/gamification/` (`badge-unlock-modal.tsx`, `level-up-modal.tsx`, `arena-battle-stage.tsx`) — vanno migrati a `<Dialog>` per accessibilità + Escape handling + focus trap
2. **CommandDialog** in `ui/command.tsx` non ha close button visibile — solo Escape/keyboard
3. **Skeleton patterns duplicati**: `ui/skeleton.tsx` vs `tools/tool-card-skeleton.tsx` skeleton-block class

---

## 5. MIGRATION ROADMAP

### 5.1 Phase 4 — Token Enforcement (3 settimane, scope ristretto)

| Settimana | Lane | Deliverable |
|-----------|------|-------------|
| 1 | Aggiungere `--tv-radius-xl`, alias colori, 5 alpha bianco in `tokens.css` | tokens.css +30 righe |
| 1 | check-style-ownership.mjs: nuovi counter per token enforcement | governance |
| 2 | Migrare top 10 file per hex hardcoded a `--tv-*` | -200 hex |
| 2 | Migrare top 5 file per `rounded-[Npx]` a `--tv-radius-*` | -50 radius |
| 3 | Rimuovere 3 PHANTOM token, 3 UNUSED token, ridefinire `--tv-radius-xl` | -0 token, +1 fix |
| 3 | Migrare 49 `@keyframes` motion a 5 canonici (instant/fast/base/slow/cinematic) | -30 keyframes |

### 5.2 Phase 5 — Component Consolidation (4 settimane)

| Settimana | Lane | Deliverable |
|-----------|------|-------------|
| 1 | Creare `Surface`, `CardShell`, `SectionShell` (i 3 NEW container) | +3 file, +400 LOC |
| 1 | Migrare `premium.tsx` consumer a Surface+Button+Badge variants | -1 file rimosso |
| 2 | Migrare `premium-section.tsx` consumer a SectionShell+SectionHeader | -1 file rimosso |
| 2 | Tool card: scegliere `CanonicalToolCard` come base, estendere con slot props | -2 file rimossi |
| 3 | Compare: unificare `compare-board`, `mobile-compare-view`, `desktop-compare-view`, `unified-compare-board` | -3 file rimossi |
| 3 | Shortlist: unificare `shortlist-board` + `mobile-shortlist-board` | -1 file rimosso |
| 4 | Migrare 3 inline motion.div modali a Dialog | -3 hack rimosi |

### 5.3 Phase 6 — CSS Monolith Split (3 settimane)

| Settimana | Lane | Deliverable |
|-----------|------|-------------|
| 1 | Strategia: estrarre `reset.css`, `components.css`, `pages.css` da `globals.css` | -15000 LOC da globals |
| 2 | Migrare 873 !important in `vibes-3d-maestoso.css` a cascade corretto | -200 !important |
| 2 | ESLint custom rules: enforce token usage (no hex, no arbitrary radius, no custom breakpoints) | +regole |
| 3 | Rimuovere figma-implementation.css + figma-final-polish.css (migrato a tokens + Tailwind) | -1346 LOC |

### 5.4 Phase 7 — Responsive Architecture (3 settimane)

| Settimana | Lane | Deliverable |
|-----------|------|-------------|
| 1 | Definire 6 viewport tier canonici (320/430/768/1024/1280/1728) + container queries | tokens |
| 1 | Audit `components/desktop/` 9 file → capire se servono ancora | design decision |
| 2 | Rimuovere `overflow-x-clip` band-aid risolvendo vero root cause | fix reale |
| 2 | Fix `SiteHeaderV2` per mostrare nav desktop da lg: (1024) non min-[1360px] | fix reale |
| 3 | MobileCollectionsView responsive per desktop (sidebar layout a xl:) | redesign mirato |
| 3 | VibeHomeV2 desktop layout (sidebar + content + rail, no mobile-stretching) | redesign mirato |

### 5.5 Phase 8 — Continuous Visual Regression (1 settimana)

| Lane | Deliverable |
|------|-------------|
| Integrare `scripts/release/capture-visual-baseline.mjs` in CI | CI step |
| Diff PNG automatico vs baseline approved | tooling |
| Bloccare PR con diff visivi non approvati | policy |
| Rimuovere workaround Playwright `networkidle` (sostituire con timeout deterministico) | infra |

**Totale stimato Phase 4-8: ~14 settimane**

---

## 6. TIMELINE & EFFORT

| Phase | Settimane | Effort (person-days) | Rischio |
|-------|-----------|---------------------|---------|
| Phase 4 — Token Enforcement | 3 | 8-12 | Basso (mechanical) |
| Phase 5 — Component Consolidation | 4 | 16-20 | Medio (decisioni architetturali) |
| Phase 6 — CSS Monolith Split | 3 | 10-14 | Medio-Alto (873 !important migration) |
| Phase 7 — Responsive Architecture | 3 | 10-14 | Alto (ridisegno mirato) |
| Phase 8 — Visual Regression CI | 1 | 2-3 | Basso (infra) |
| **TOTALE** | **14** | **46-63** | — |

Nota: Phase 6 include la rimozione del figma-implementation.css che è 671 LOC attivi — la migrazione a tokens + Tailwind richiede decisione su quali regole sono canoniche e quali sono specifiche Figma.

---

## 7. RISK MATRIX

| # | Rischio | Probabilità | Impatto | Mitigation |
|---|---------|-------------|---------|------------|
| 1 | Phase 5 consolidation rompe consumer esistenti | Media | Alto | Snapshot test + visual regression + canary release |
| 2 | Phase 6 873 !important migration causa regressioni visive | Alta | Medio | Migrare per file, con diff visivo obbligatorio |
| 3 | Phase 7 responsive redesign cambia troppo | Media | Alto | Approccio incrementale, PR piccole, feature flag se necessario |
| 4 | Token enforcement rallenta contributor velocity | Media | Basso | Baseline + no-new-debt (già in atto), non pretendere fix subito |
| 5 | Rimozione figma-implementation.css rompe componenti custom | Media | Medio | Audit prima, mappa 1:1, fallback a figma-final-polish se serve |
| 6 | Comparsa di light theme request durante Phase 4 | Bassa | Alto | Costituzione dichiara dark-first come decisione vincolante |
| 7 | MobileCollectionsView redesign cambia modello di interazione | Bassa | Alto | Coinvolgere product owner prima |
| 8 | VibeHomeV2 redesign cambia "above the fold" | Bassa | Alto | Prototipo + user testing prima di merge |
| 9 | 49 keyframes consolidation cambia timing percepito | Media | Medio | Diff side-by-side, utenti interni review |
| 10 | ESLint custom rules hanno falsi positivi | Media | Basso | Iterate rules, allowlist, document exceptions |

---

## 8. GOVERNANCE EVOLUTION

### 8.1 Stato attuale (post Phase 0/1)

Guardrails installati:
- `check-style-ownership.mjs`: !important ceilings + token ownership + cascade contract
- 4 no-new-debt counters (HEX, RADIUS, BP, MOTION)

### 8.2 Phase 4 — Token Enforcement

Aggiungere:
- Counter per `--tv-color-*` foundation (se usati correttamente vs hex hardcoded)
- Counter per `--tv-motion-*` (se usati correttamente vs duration hardcoded)
- Counter per `--tv-radius-*` (se usati correttamente vs arbitrary radius)

### 8.3 Phase 5 — Primitive Governance

Aggiungere:
- Regola: nessun nuovo componente in `components/ui/` senza review
- Regola: dipendenze esterne (base-ui, vaul, cmdk, embla, sonner) limitate a quelle già installate
- Regola: premium.tsx + premium-section.tsx consumer devono migrare entro Phase 5

### 8.4 Phase 6 — ESLint Custom Rules

Nuove regole:
- `no-hardcoded-hex-color` (allowlist per admin forms documentati)
- `no-arbitrary-radius` (allowlist per casi eccezionali)
- `no-custom-breakpoint` (allowlist per 380/420 se serve veramente)
- `no-arbitrary-motion-duration` (allowlist per 3D scenes)
- `no-inline-style` (allowlist per admin forms)
- `no-zindex-arbitrary` (allowlist per 9999/-10 documentati)

### 8.5 Phase 8 — CI Integration

- Visual regression baseline come artifact di build
- `check-style-ownership` + ESLint custom come required checks
- PR template che richiede "design system impact" section

---

## 9. SUCCESS METRICS

| Metrica | Baseline (oggi) | Target post Phase 4-8 |
|---------|------------------|-----------------------|
| Hex hardcoded | 2369 | <500 |
| Radius arbitrari | 879 | <200 |
| Breakpoint custom unici | 36 | 6 (solo Tailwind defaults) |
| Motion duration arbitrarie | 13 | 0 |
| !important count | 1186/1190 | <400/1190 |
| `components/ui/` count | 26 | 24 |
| Components con varianti multiple (tool card, compare, shortlist) | 4+ | 1 per concetto |
| `globals.css` LOC | 34269 | <15000 |
| Tablet md: usage (768-1024) | 99 vs 205 lg: | >300 (gap colmato) |
| Visual regression coverage | 0 (Phase 0 baseline) | 100% (CI integration) |
| Build time | 9.4s | <15s (con nuovi check) |
| `next build` lint errors | bypassed | 0 (re-introduced) |

---

## 10. ROLLBACK PLAN

### 10.1 Phase 4 (tokens)

Ogni token nuovo è additivo. Rollback = rimuovere il token, i consumer esistenti che già usavano `--tv-*` non sono impattati. Rischio: basso.

### 10.2 Phase 5 (consolidation)

Ogni componente rimosso è in commit atomico. Rollback = revert del commit. Rischio: medio (test potrebbero essere obsoleti dopo il rollback).

### 10.3 Phase 6 (CSS split)

Ogni file CSS estratto da globals.css è in commit separato. Rollback = revert + re-import. Rischio: medio (cascata CSS potrebbe differire).

### 10.4 Phase 7 (responsive)

Ridirezno mirato con feature flag (es. `homeLayoutVariant` prop). Rollback = flag OFF. Rischio: alto (cambia UX percepita), ma reversibile istantaneamente.

### 10.5 Phase 8 (CI)

CI step è additivo. Rollback = disabilitare step. Rischio: zero.

---

## 11. DEPENDENCIES & SEQUENCING

```
Phase 4 (tokens) ──┬──> Phase 5 (components) ──┬──> Phase 7 (responsive)
                   │                            │
                   └──> Phase 6 (CSS split) ────┘
                                                    │
                                                    v
                                              Phase 8 (CI integration)
```

- Phase 4 blocca Phase 5 e 6 (servono i token definitivi)
- Phase 5 e 6 possono procedere in parallelo dopo Phase 4
- Phase 7 può partire dopo Phase 4, ma idealmente dopo Phase 5 (per non consolidare componenti già refactorati)
- Phase 8 può partire in qualsiasi momento (è additivo)

---

## 12. TEAM COMPOSITION (raccomandazione)

| Role | FTE | Quando |
|------|-----|--------|
| Design system lead (decisioni architetturali) | 1 | Phase 4-7 |
| Frontend engineer (component work) | 1-2 | Phase 5-7 |
| CSS specialist (monolith split) | 0.5 | Phase 6 |
| DevOps (CI integration) | 0.5 | Phase 8 |
| QA / visual regression | 0.5 | Phase 5-8 |

Per un team minimo (1 ingegnere full-stack con seniority):
- Phase 4: 3 settimane solo
- Phase 5: 6 settimane solo
- Phase 6: 4 settimane solo
- Phase 7: 4 settimane solo
- Phase 8: 1 settimana solo
- **Totale realistic: 18 settimane**

---

## 13. DELIVERABLES INVENTORY

### 13.1 Phase 0+1 (già committati)

| File | Commit |
|------|--------|
| `playwright.config.ts` (modified) | eac77be |
| `tests/e2e/visual-matrix.spec.ts` (modified) | eac77be |
| `tests/e2e/baseline-smoke.spec.ts` (new) | eac77be |
| `scripts/release/capture-visual-baseline.mjs` (new) | eac77be |
| `scripts/release/check-style-ownership.mjs` (modified) | eac77be |
| `next.config.ts` (modified) | eac77be |
| `audits/visual-baseline-2026-07-21/` (new, 81 PNGs + manifest) | eac77be |
| `audits/ui-cleanup-phase-0-baseline.md` (new) | eac77be |
| `audits/ui-cleanup-phase-0-1-report-2026-07-21.md` (new) | eac77be |
| 5 component files (deleted) | 50a7fd5 |
| 2 test files (deleted) | 50a7fd5 |
| 1 test file (renamed/split) | 50a7fd5 |

### 13.2 Phase 2+3 (questo commit, NON ancora committato)

| File | Stato |
|------|-------|
| `audits/tooolvibes-design-system-constitution.md` (new, 621 righe) | da committare |
| `audits/ui-phase-2-3-token-map.md` (new, 753 righe) | da committare |
| `audits/ui-phase-2-3-primitive-map.md` (new, 565 righe) | da committare |
| `audits/ui-phase-2-3-report-2026-07-21.md` (new, questo file) | da committare |

Raccomandazione: commit unico `docs(ui): establish design system foundation (Phase 2+3)`.

### 13.3 Phase 4+ (futuri, non in scope)

Da definire quando Phase 2+3 è approvata.

---

## 14. NEXT IMMEDIATE STEPS

Quando l'utente approva questo report:

1. **Commit dei 4 file** Phase 2+3: `docs(ui): establish design system foundation (Phase 2+3)`
2. **Review della Costituzione** con il product owner (decisioni vincolanti)
3. **Pianificazione Phase 4** in dettaglio (entro 1 settimana)
4. **Setup environment** per Phase 4 (branch dedicato, feature flag)
5. **Kickoff Phase 4** — token enforcement graduale

---

## 15. OPEN QUESTIONS

Alcune decisioni richiedono input umano prima di procedere:

| # | Domanda | Default proposto | Impatto se cambia |
|---|---------|------------------|-------------------|
| 1 | Il light theme deve restare escluso? | Sì (dark-first) | Se sì: aggiunge 30% effort a Phase 4 |
| 2 | Le 6 protected signals (Costituzione §19) sono quelle giuste? | Sì | Se cambiano: riscrittura §19 |
| 3 | Il "Speciale" badge dorato deve restare così? | Sì | Se cambia: ridefinizione oro + balance palette |
| 4 | La tassonomia overlay (6 patterns) copre tutti i casi? | Sì | Se manca: aggiunta pattern |
| 5 | Il Container system proposto (5 tier) è giusto? | Sì | Se cambia: ridefinizione tokens |
| 6 | `CompareBoard` deve restare separato da `MobileCompareView`? | No, unificare | Se sì: Phase 5 scope cambia |
| 7 | `MobileShortlistBoard` Kanban→Library è definitivo? | Sì | Se no: Phase 5 cambia |
| 8 | `premium.tsx` + `premium-section.tsx` sono da rimuovere davvero? | Sì | Se no: Phase 5 scope cambia |
| 9 | Il refactor `vibes-3d-maestoso.css` 873 !important è accettabile come effort? | Sì (Phase 6) | Se no: Phase 6 va rifatto con strategia diversa |
| 10 | L'utente vuole gestire Phase 5 con 1 engineer solo o team? | 1 (18 settimane) | Se team: 14 settimane |

---

## 16. WHAT THIS ACHIEVES

Dopo Phase 0+1+2+3 la codebase ha:

✅ Un'identità documentata e non più ambigua (Costituzione)
✅ Una mappa completa dei token esistenti + architettura target (Token Map)
✅ Un inventario primitive + roadmap consolidamento (Primitive Map)
✅ Una baseline visuale che protegge da regressioni (81 PNG)
✅ 4 guardrails che impediscono nuovo debito UI (check-style-ownership)
✅ Meno codice morto (5 componenti v1/zombie rimossi)
✅ Meno file legacy (4 file cancellati)
✅ Un'architettura target definita per le prossime 14 settimane di lavoro

✅ Costituzione blindabile come contratto tra tech e product
✅ Token map utilizzabile come reference per ogni contributor
✅ Primitive map come blueprint per Phase 4-5
✅ Governance rules scalabili (no-new-debt) già funzionanti

---

## 17. WHAT THIS DOES NOT ACHIEVE

Onestamente:

❌ TooolVibes non è ancora bella — Phase 2+3 sono solo documentazione
❌ TooolVibes non è ancora desktop-first — Phase 7 lo farà
❌ TooolVibes non è ancora tablet-optimized — Phase 7 lo farà
❌ TooolVibes non è ancora lint-clean — Phase 6 lo farà
❌ TooolVibes non è ancora CSS-monolith-free — Phase 6 lo farà
❌ Il light theme non è stato costruito (e non deve esserlo, per decisione)
❌ I 2369 hex hardcoded sono ancora lì (Phase 4 li ridurrà gradualmente)
❌ I 873 !important sono ancora lì (Phase 6 li migrerà)
❌ Le 49 keyframes sono ancora lì (Phase 4 le consoliderà)
❌ Le frammentazioni tool card/compare/shortlist sono ancora lì (Phase 5 le risolverà)
❌ I 12 file desktop fork sono ancora lì (Phase 7 li gestirà)

Questo report è una PROMESSA, non un risultato visivo.

---

## 18. FINAL RECOMMENDATION

**STOP come richiesto.** In attesa di:

1. ✅ Verifica dei 4 file Phase 2+3 da parte dell'utente
2. ✅ Approvazione della Costituzione (decisioni vincolanti)
3. ✅ Risposta alle 10 open questions
4. ✅ Decisione su Phase 4 (iniziare subito o rimandare)
5. ✅ Conferma team composition e timeline

Quando tutto è approvato:

→ Procedere con commit `docs(ui): establish design system foundation (Phase 2+3)`
→ Aprire branch dedicato per Phase 4 (`design-system/phase-4-tokens`)
→ Iniziare lavoro di token enforcement graduale

**Nessun Phase 4+ viene avviato senza approvazione esplicita.**

---

*Fine del report.*
