# Mobile Polish Generale — TooolVibes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendere l'esperienza mobile di TooolVibes più premium, leggera, leggibile, coerente e stabile, riducendo glass/blur/glow ridondanti e correggendo sovrapposizioni, mantenendo l'identità spaziale/game/editoriale e isolando ogni modifica al mobile.

**Architecture:** Interventi chirurgici via breakpoint Tailwind (`max-md:`, `md:`) e blocchi `@media (max-width: 767px)` in CSS globali. Nessuna modifica a desktop, backend, login, Supabase, API o routing. I componenti condivisi ricevono solo varianti/override mobile. Ogni task è indipendente e produce un cambiamento verificabile.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v4, TypeScript, Motion, Three.js/R3F (solo per fallback), CSS custom in `app/globals.css` e `styles/*.css`.

**Baseline verificata:**
- `npm run lint` → 0 errori, 15 warnings pre-esistenti (non toccare se non direttamente correlati).
- `npm test` → 3 file, 19 test pass.

---

## File Structure che verranno toccati

- `app/globals.css` — glass/blur/glow globali, z-index, animazioni, dead code, prefers-reduced-motion.
- `app/(marketing)/layout.tsx` — padding bottom nav mobile, wrapper `main`.
- `components/layout/mobile-bottom-nav.tsx` — riduzione glass/ombra, active state.
- `components/layout/site-header-v2.tsx` — stacking FAB vs overlay, titolo centrale su small screens.
- `components/app/orbital-system/orbital-layer.tsx` — disabilitare su mobile per pagine testuali.
- `components/3d-maestoso/particle-field.tsx` — ridurre conteggio/DPR su mobile.
- `components/3d-maestoso/home-3d-hero.tsx` — opacità reactor e glow CTA su mobile.
- `components/home/mobile-hero-solar.tsx` — semplificare orbita nodi su viewport piccoli.
- `components/home/mobile-spotlight.tsx` — attenuare animazioni podio.
- `components/home/mobile-method-steps.tsx` — ridurre particelle e rimuovere tilt 3D touch.
- `app/(marketing)/chi-siamo/page.tsx` / `components/about/about-page.tsx` — semplificare pannelli glass su mobile.
- `app/(marketing)/community/page.tsx`, `app/(marketing)/shop/page.tsx`, `app/(marketing)/metodo/page.tsx` — hero shell contrasto e rimozione pseudo-animati.
- `app/(marketing)/archivio/page.tsx`, `components/3d-maestoso/archive-3d-hero.tsx`, `components/directory/mobile-catalog-view.tsx` — hero statico su mobile, rimuovere ambient/signals.
- `components/radar/mobile-radar-view.tsx` — throttle/pausa canvas, rimuovere sweep nascosto, dimensioni nodi.
- `components/collections/mobile-collections-view.tsx`, `components/collections/collection-card.tsx`, `components/collections/collection-slot-card.tsx` — rimuovere stelle/glow per-item, variant compact mobile.
- `components/tools/mobile-shortlist-board.tsx` — rimuovere `LibraryAmbient`, pulsante remove visibile, semplificare note sheet.
- `components/tools/tool-card.tsx`, `components/collections/collection-card.tsx`, `components/3d-maestoso/tilt-card-3d.tsx` — variant mobile senza glow/float, disabilitare tilt su touch.

---

### Task 1: Shell mobile globale — nav, header, safe-area, loader

**Files:**
- Modify: `components/layout/mobile-bottom-nav.tsx`
- Modify: `components/layout/site-header-v2.tsx`
- Modify: `app/(marketing)/layout.tsx`
- Modify: `app/globals.css` (classi `.mobile-bottom-motion`, `.mobile-bottom-link`, `.site-header-v2`, `.route-transition-loader`)
- Modify: `components/app/route-transition-loader.tsx` se necessario timeout

- [ ] **Step 1: Ridurre glass/ombra bottom nav su mobile**

In `components/layout/mobile-bottom-nav.tsx` cambiare il wrapper da:
```tsx
className="... rounded-[1.75rem] border border-white/35 bg-white/78 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.18)] ..."
```
a:
```tsx
className="... rounded-[1.5rem] border border-white/25 bg-white/85 backdrop-blur-lg shadow-[0_8px_24px_rgba(47,33,126,0.12)] ..."
```
Mantenere `md:hidden`. Verificare che icone e badge restino leggibili.

- [ ] **Step 2: Semplificare stato attivo bottom nav**

In `app/globals.css`, ridurre l'ombra dell'indicatore attivo (`.mobile-bottom-link::after`) da `0 10px 24px rgba(106,60,255,0.24)` a `0 6px 16px rgba(106,60,255,0.18)` e il badge shadow da `0 8px 18px rgba(47,33,126,0.24)` a `0 4px 12px rgba(47,33,126,0.18)`.

- [ ] **Step 3: Stabilire stacking FAB e overlay**

In `components/layout/site-header-v2.tsx` aggiungere logica condizionale per nascondere il FAB Vibe Rush quando `isOverlayOpen` (o quando Sheet/Dialog/Drawer aperti). Se non esiste `isOverlayOpen`, usare lo stato locale aperto del menu mobile o del search overlay.

- [ ] **Step 4: Ridurre titolo header su schermi piccoli**

In `components/layout/site-header-v2.tsx` aggiungere `hidden min-[430px]:inline` (o equivalente Tailwind) al titolo testuale centrale “TooolVibes”, lasciando il logo sempre visibile. Non modificare il logo.

- [ ] **Step 5: Centralizzare padding bottom nav mobile**

In `app/globals.css` creare utility `.pb-mobile-nav { padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom) + 1.5rem); }`. In `app/(marketing)/layout.tsx` sostituire `pb-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom)+1.5rem)] md:pb-0` con `pb-mobile-nav md:pb-0`.

- [ ] **Step 6: Timeout di sicurezza loader route**

In `components/app/route-transition-loader.tsx` (o dove è implementata la logica) aggiungere un `useEffect` che forza `setIsLoading(false)` dopo 3 secondi massimo, per evitare che il loader resti bloccato.

- [ ] **Step 7: Verificare lint e test dopo Task 1**

Run: `npm run lint`
Run: `npm test`
Expected: 0 nuovi errori, nessun test rotto.

- [ ] **Step 8: Commit parziale**

```bash
git add components/layout/mobile-bottom-nav.tsx components/layout/site-header-v2.tsx app/(marketing)/layout.tsx app/globals.css components/app/route-transition-loader.tsx
git commit -m "refactor(mobile): shell globale — nav più leggera, header pulito, safe-area e loader timeout"
```

---

### Task 2: Sfondi animati globali — OrbitalLayer e ParticleField

**Files:**
- Modify: `components/app/orbital-system/orbital-layer.tsx`
- Modify: `components/3d-maestoso/particle-field.tsx`
- Modify: `components/app/global-experience-layer-v2.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Disabilitare OrbitalLayer su mobile per pagine testuali**

In `components/app/orbital-system/orbital-layer.tsx` leggere `window.innerWidth` (o usare una media query CSS) e non renderizzare il layer quando `window.innerWidth < 768` **e** la route corrente è una pagina testuale/statica (`/chi-siamo`, `/community`, `/shop`, `/privacy`, `/termini`, `/metodo`). Mantenere la whitelist esistente per le pagine “origin mobile”. Se la logica è difficile, introdurre prop `disableOnMobileTextPages` controllata dal marketing layout.

- [ ] **Step 2: Ridurre densità ParticleField su mobile**

In `components/3d-maestoso/particle-field.tsx` abbassare i conteggi mobile da `isMobile ? 150/80/40` a `isMobile ? 80/40/20` e forzare `dpr={1}` su mobile.

- [ ] **Step 3: Limitare GlobalExperienceLayerV2 su mobile**

In `components/app/global-experience-layer-v2.tsx` disabilitare gli eventi pointer/parallax su mobile (`innerWidth < 768`) e limitare l'aggiornamento a `--tv-scroll-progress`.

- [ ] **Step 4: Verificare lint e test**

Run: `npm run lint`
Run: `npm test`

- [ ] **Step 5: Commit parziale**

```bash
git add components/app/orbital-system/orbital-layer.tsx components/3d-maestoso/particle-field.tsx components/app/global-experience-layer-v2.tsx app/globals.css
git commit -m "perf(mobile): riduci sfondi animati globali su viewport < 768"
```

---

### Task 3: Home / Hero mobile

**Files:**
- Modify: `components/3d-maestoso/home-3d-hero.tsx`
- Modify: `components/home/mobile-hero-solar.tsx`
- Modify: `components/home/mobile-spotlight.tsx`
- Modify: `components/home/mobile-method-steps.tsx`
- Modify: `styles/vibes-3d-maestoso.css`

- [ ] **Step 1: Abbassare opacità reactor e glow CTA in home-3d-hero**

In `components/3d-maestoso/home-3d-hero.tsx` aggiungere una classe condizionale che su schermi < 430 px porti l'opacità del reactor a `0.35` (ora ~0.58) e rimuova l'ombra glow sotto il CTA primario. Non rimuovere la scena 3D.

- [ ] **Step 2: Semplificare orbita discovery in mobile-hero-solar**

In `components/home/mobile-hero-solar.tsx` e `styles/vibes-3d-maestoso.css` introdurre un fallback CSS: per viewport < 390 px, nascondere l'anello orbitante animato e mostrare una griglia fissa 2×3 di icone sotto il logo, mantenendo i colori esistenti. Rimuovere l'animazione `v-discovery-node-orbit` su touch.

- [ ] **Step 3: Attenuare animazioni podio in mobile-spotlight**

In `components/home/mobile-spotlight.tsx` e `styles/vibes-3d-maestoso.css` disabilitare le animazioni `v-podium-winner-float`/`glow` su dispositivi touch (`@media (hover: none)`) e ridurre il blur del pavimento riflettente a `blur(6px)`.

- [ ] **Step 4: Ridurre particelle e tilt in mobile-method-steps**

In `components/home/mobile-method-steps.tsx` e `styles/vibes-3d-maestoso.css` abbassare l'opacità delle particelle a `0.5` su mobile e rimuovere il tilt 3D (`rotateX/Y`) su touch.

- [ ] **Step 5: Verificare lint e test**

Run: `npm run lint`
Run: `npm test`

- [ ] **Step 6: Commit parziale**

```bash
git add components/3d-maestoso/home-3d-hero.tsx components/home/mobile-hero-solar.tsx components/home/mobile-spotlight.tsx components/home/mobile-method-steps.tsx styles/vibes-3d-maestoso.css
git commit -m "refactor(mobile): semplifica hero, orbita discovery, spotlight e method steps"
```

---

### Task 4: Pagine marketing statiche

**Files:**
- Modify: `components/about/about-page.tsx` o `app/(marketing)/chi-siamo/page.tsx`
- Modify: `app/(marketing)/community/page.tsx`
- Modify: `app/(marketing)/shop/page.tsx`
- Modify: `app/(marketing)/metodo/page.tsx`
- Modify: `components/method/mobile-method-room.tsx`
- Modify: `app/globals.css` / `styles/vibes-3d-maestoso.css`

- [ ] **Step 1: Semplificare pannello about mobile**

In `components/about/about-page.tsx` (o il file che renderizza la versione mobile) rimuovere `backdrop-filter` dal pannello servizi e aumentare il padding verticale tra sezioni. Mantenere immagini e testo.

- [ ] **Step 2: Fissare hero shell community/shop su mobile**

In `app/globals.css` / `styles/vibes-3d-maestoso.css`, per viewport < 640 px, aggiungere a `.hero-shell-community`, `.hero-shell-shop` un `background` solido scuro sotto il testo e rimuovere/disabilitare il pseudo-elemento `:after` animato (`tv-ambient-sweep`). Verificare che il testo `.text-white` abbia contrasto sufficiente.

- [ ] **Step 3: Migliorare contrasto pagina Metodo**

In `components/method/mobile-method-room.tsx` e `app/globals.css` alzare il colore body dei pannelli a `rgba(255,255,255,0.7)` (da 0.55) e rimuovere il glow radiale animato dietro le icone su mobile.

- [ ] **Step 4: Verificare lint e test**

Run: `npm run lint`
Run: `npm test`

- [ ] **Step 5: Commit parziale**

```bash
git add components/about/about-page.tsx app/(marketing)/community/page.tsx app/(marketing)/shop/page.tsx app/(marketing)/metodo/page.tsx components/method/mobile-method-room.tsx app/globals.css styles/vibes-3d-maestoso.css
git commit -m "refactor(mobile): pagine statiche — contrasto, padding, rimozione glass eccessivo"
```

---

### Task 5: Catalogo e Radar

**Files:**
- Modify: `app/(marketing)/archivio/page.tsx`
- Modify: `components/3d-maestoso/archive-3d-hero.tsx`
- Modify: `components/directory/mobile-catalog-view.tsx`
- Modify: `components/radar/mobile-radar-view.tsx`
- Modify: `app/globals.css` / `styles/radar.css`

- [ ] **Step 1: Rendere eroe catalogo statico su mobile**

In `app/(marketing)/archivio/page.tsx` wrappare `Archive3DHero` in un container che su mobile (`lg:hidden`) mostri una versione statica (es. banner gradiente/testo) e nasconda il canvas. In alternativa, modificare `components/3d-maestoso/archive-3d-hero.tsx` per restituire `null` quando `window.innerWidth < 1024` e mostrare fallback CSS. Non rimuovere il componente desktop.

- [ ] **Step 2: Rimuovere ambient e signals dal catalogo mobile**

In `components/directory/mobile-catalog-view.tsx` rimuovere/commentare `.mobile-catalog-view__ambient` e i micro-testi “signals” sulle categorie. Mantenere la mappa categorie.

- [ ] **Step 3: Throttle/pausa canvas radar**

In `components/radar/mobile-radar-view.tsx` implementare:
- `requestAnimationFrame` limitato a 30 fps su mobile;
- pausa completa quando il canvas esce dall'intersezione con viewport (`IntersectionObserver`);
- rimozione dell'elemento `.mobile-radar-view__sweep` se è `display:none !important` (dead code).

- [ ] **Step 4: Aumentare dimensioni nodi ed etichette radar**

In `styles/radar.css` per `@media (max-width: 767px)` impostare dimensione minima nodo a `44px` e font-size etichette a `0.75rem` minimo.

- [ ] **Step 5: Verificare lint e test**

Run: `npm run lint`
Run: `npm test`

- [ ] **Step 6: Commit parziale**

```bash
git add app/(marketing)/archivio/page.tsx components/3d-maestoso/archive-3d-hero.tsx components/directory/mobile-catalog-view.tsx components/radar/mobile-radar-view.tsx app/globals.css styles/radar.css
git commit -m "perf(mobile): catalogo e radar — hero statico, meno glow, canvas più leggero"
```

---

### Task 6: Collections e Shortlist

**Files:**
- Modify: `components/collections/mobile-collections-view.tsx`
- Modify: `components/collections/collection-card.tsx`
- Modify: `components/collections/collection-slot-card.tsx`
- Modify: `components/tools/mobile-shortlist-board.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Rimuovere stelle/glow per-item da collections mobile**

In `components/collections/mobile-collections-view.tsx` rimuovere lo sfondo stellato fisso e i glow assoluti su ogni item della lista. Mantenere il gradiente di sezione.

- [ ] **Step 2: Semplificare CollectionCard su mobile**

In `components/collections/collection-card.tsx` usare la variante `compact`/`swipeFriendly` già esistente per mobile, rimuovendo `.brand-aura`, `.panel-lift` e `.surface-sheen` quando è attiva la variante mobile. Assicurarsi che le immagini abbiano overlay gradiente scuro per leggibilità testo.

- [ ] **Step 3: Semplificare CollectionSlotCard**

In `components/collections/collection-slot-card.tsx` rimuovere `.surface-sheen` e glow su mobile. Mantenere struttura metadata/stat.

- [ ] **Step 4: Pulire Shortlist mobile**

In `components/tools/mobile-shortlist-board.tsx` rimuovere `LibraryAmbient`. Rendere il pulsante remove sempre visibile (o almeno visibile su focus/hover) invece che solo su `:active`. Semplificare `MobileNoteSheet` rimuovendo ombre eccessive.

- [ ] **Step 5: Verificare lint e test**

Run: `npm run lint`
Run: `npm test`

- [ ] **Step 6: Commit parziale**

```bash
git add components/collections/mobile-collections-view.tsx components/collections/collection-card.tsx components/collections/collection-slot-card.tsx components/tools/mobile-shortlist-board.tsx app/globals.css
git commit -m "refactor(mobile): collections e shortlist — meno glow, card più pulite, remove visibile"
```

---

### Task 7: Card condivise e tilt 3D

**Files:**
- Modify: `components/tools/tool-card.tsx`
- Modify: `components/collections/collection-card.tsx`
- Modify: `components/3d-maestoso/tilt-card-3d.tsx`
- Modify: `app/globals.css` / `styles/vibes-3d-maestoso.css`

- [ ] **Step 1: Creare variant mobile per ToolCard**

In `components/tools/tool-card.tsx` aggiungere logica che su viewport < 768 (o tramite prop `isMobile`) non applichi `.card-glow`, `.image-float`, e riduca `.hover-reveal`/chip. Mantenere gradient overlay e CTA.

- [ ] **Step 2: Disabilitare TiltCard3D su touch**

In `components/3d-maestoso/tilt-card-3d.tsx` restituire un wrapper semplice senza transform 3D quando `window.matchMedia('(hover: none)').matches` o `navigator.maxTouchPoints > 0`. Mantenere hover su desktop.

- [ ] **Step 3: Ridurre glow DirectoryToolCard su mobile**

Se `components/directory/directory-tool-card.tsx` ha ombre/glow pesanti su mobile, aggiungere media query per ridurle.

- [ ] **Step 4: Verificare lint e test**

Run: `npm run lint`
Run: `npm test`

- [ ] **Step 5: Commit parziale**

```bash
git add components/tools/tool-card.tsx components/collections/collection-card.tsx components/3d-maestoso/tilt-card-3d.tsx components/directory/directory-tool-card.tsx app/globals.css styles/vibes-3d-maestoso.css
git commit -m "refactor(mobile): card condivise — no glow su liste, tilt disabilitato su touch"
```

---

### Task 8: CSS cleanup e prefers-reduced-motion

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Rimuovere codice morto .mobile-tap-burst e .sonic-singularity**

In `app/globals.css` cancellare le regole `.mobile-tap-burst` e `.sonic-singularity` che sono forzate a `display: none !important`.

- [ ] **Step 2: Consolidare prefers-reduced-motion**

In fondo a `app/globals.css` creare un unico blocco `@media (prefers-reduced-motion: reduce)` che disabiliti blur animati, transizioni costose, animazioni infinite non essenziali (orbita, float, pulse, shimmer) e riduca `backdrop-filter` animati. Non rimuovere transizioni di apertura/chiusura modali.

- [ ] **Step 3: Documentare z-stack**

In `app/globals.css` aggiungere un commento in testa con la tabella z-index principali (header, bottom nav, overlay, modali, toast, intro, loader) per prevenire regressioni.

- [ ] **Step 4: Verificare lint e test**

Run: `npm run lint`
Run: `npm test`

- [ ] **Step 5: Commit parziale**

```bash
git add app/globals.css
git commit -m "chore(mobile): cleanup CSS morto, consolidate reduced-motion, documenta z-stack"
```

---

### Task 9: Verifica finale — build, viewport e report

**Files:**
- Nessun file modificato, solo verifica.

- [ ] **Step 1: Build di produzione**

Run: `npm run build`
Expected: build completa senza errori (warnings pre-esistenti accettabili).

- [ ] **Step 2: Lint e test finali**

Run: `npm run lint`
Expected: 0 errori; nessun nuovo warning rispetto alla baseline.
Run: `npm test`
Expected: tutti i test pass.

- [ ] **Step 3: Check viewport con DevTools o Playwright**

Se disponibile, avviare `npm run dev` e ispezionare almeno i viewport:
- 360×640
- 375×667
- 390×844
- 414×896
- 430×932
- 768×1024 (tablet portrait)
Verificare: nessuna sovrapposizione tra testi/card/FAB/header; bottom nav visibile; testi leggibili; nessun elemento fuori schermo.

- [ ] **Step 4: Concludere con report finale**

Redigere un riepilogo in italiano contenente: file modificati, sezioni rifinite, glass rimosso/mantenuto, elementi ridondanti rimossi, sovrapposizioni risolte, miglioramenti transizioni/sfondi, rischi residui, test eseguiti, prossimi step consigliati.

---

## Spec Coverage Checklist

- [x] Shell mobile globale più leggera → Task 1
- [x] Sfondi animati ridotti su mobile → Task 2
- [x] Home/Hero mobile semplificata → Task 3
- [x] Pagine marketing statiche più leggibili → Task 4
- [x] Catalogo/Radar performance e leggibilità → Task 5
- [x] Collections/Shortlist pulizia → Task 6
- [x] Card condivise senza eccessi su mobile → Task 7
- [x] CSS cleanup e reduced-motion → Task 8
- [x] Verifica build/lint/test/viewport → Task 9

## Placeholder Scan

- Nessun "TBD", "TODO", "implement later" nel piano.
- Ogni task indica file esatti o pattern da cercare.
- I comandi e i commit sono specifici.
