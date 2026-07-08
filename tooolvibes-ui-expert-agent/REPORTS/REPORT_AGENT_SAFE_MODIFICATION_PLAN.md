# REPORT_AGENT_SAFE_MODIFICATION_PLAN

Scopo: elenco ordinato dei fix applicabili in sicurezza. Questo report non autorizza modifiche automatiche: ogni fix deve essere eseguito rispettando `REPORT_AGENT_DO_NOT_TOUCH_ZONES.md`.

## Regola operativa generale

- Applicare un fix per commit/PR quando il rischio e medio o alto.
- Confermare i file con `rg` prima di modificare.
- Preferire CSS/component-level e riuso di componenti esistenti.
- Non toccare backend, auth, Supabase, Cloudflare o deployment salvo task esplicito.
- Dopo ogni fix eseguire almeno `npm run lint` e `npm run build` se disponibili.

## Priorita P0

### FIX-001 - Disclosure affiliate accanto ai CTA commerciali

- **Sezione:** Trust / conversion
- **File/componenti da modificare:** `app/(marketing)/posts/[slug]/page.tsx`, `app/(marketing)/toools/[slug]/page.tsx`, `lib/types/tool.ts`
- **File/componenti da non toccare:** Supabase, auth, API routes, middleware, schema database
- **Soluzione consigliata:** Mostrare una micro-disclosure chiara vicino ai CTA che usano link affiliati, mantenendo il copy compatto su mobile. Individuare dove viene risolto `tool.affiliate_url ?? tool.website_url`.
- **Rischio regressione:** medio
- **QA dopo il fix:** Verificare post detail e tool detail a 320/375/414/1280. Verificare che il CTA resti cliccabile. Eseguire `npm run lint` e `npm run build`.

## Priorita P1

### FIX-002 - Trust block con last reviewed e reviewer

- **Sezione:** Trust / editorial
- **File/componenti da modificare:** `app/(marketing)/toools/[slug]/page.tsx`, `app/(marketing)/posts/[slug]/page.tsx`, `lib/types/tool.ts`, `lib/types/article.ts`
- **File/componenti da non toccare:** schema database, Supabase, server actions, API routes
- **Soluzione consigliata:** Separare pubblicazione, aggiornamento e revisione editoriale senza inventare dati non presenti. Prima verificare quali campi sono realmente disponibili nei record tool/article.
- **Rischio regressione:** medio
- **QA dopo il fix:** Tool detail e post detail a mobile/desktop. Verificare stati con campi mancanti. Lint/build.

### FIX-003 - Primitive input/select/button con target touch minimo

- **Sezione:** Mobile / component primitives
- **File/componenti da modificare:** `components/ui/input.tsx`, `components/ui/input-group.tsx`, `components/ui/select.tsx`, `components/ui/button.tsx`
- **File/componenti da non toccare:** admin dense UI senza verifica, API, auth, routing
- **Soluzione consigliata:** Garantire almeno 44px nei contesti touch senza rompere UI dense desktop/admin. Mappare dove xs/sm sono usati prima di cambiare le primitive globali.
- **Rischio regressione:** medio
- **QA dopo il fix:** Viewport 320/375/414/768. Search header, filtri catalogo, form account/admin se accessibili. Lint/build.

### FIX-004 - Token radius/color/shadow canonici

- **Sezione:** Design system
- **File/componenti da modificare:** `app/globals.css`, `styles/vibes-3d-maestoso.css`, `tailwind.config.ts`
- **File/componenti da non toccare:** route logic, stores, API, auth, database
- **Soluzione consigliata:** Definire una fonte token stabile e migrare solo i valori piu ripetuti in modo incrementale. Fare prima inventory grep di radius, colori e shadow ricorrenti.
- **Rischio regressione:** alto
- **QA dopo il fix:** Screenshot Home/Catalogo/Detail/Compare/Radar prima-dopo. Grep valori arbitrari prima-dopo. Lint/build.

### FIX-005 - Compare 5 tool guidato o limitato

- **Sezione:** Compare UX
- **File/componenti da modificare:** `lib/stores/tool-workspace-store.ts`, `lib/discovery/local-storage.ts`, `components/tools/unified-compare-board.tsx`, `components/tools/compare-board.tsx`
- **File/componenti da non toccare:** Supabase, auth, API routes, middleware
- **Soluzione consigliata:** Guidare l'utente verso 2-4 tool attivi e trattare il quinto come warning o parking lot. Prima decidere se cambiare limite o solo introdurre UX warning.
- **Rischio regressione:** medio
- **QA dopo il fix:** Aggiunta/rimozione tool da catalogo. Compare con 2/3/4/5 tool. Persistenza reload. Lint/build.

### FIX-006 - Unificare contratto save/compare

- **Sezione:** Frontend state
- **File/componenti da modificare:** `lib/stores/tool-workspace-store.ts`, `lib/discovery/local-storage.ts`, `components/tools/*`
- **File/componenti da non toccare:** database schema, auth, API routes, RLS
- **Soluzione consigliata:** Definire un solo contratto di stato o un adapter chiaro tra i due sistemi. Scrivere prima una mappa delle chiavi esistenti e dei componenti consumer.
- **Rischio regressione:** alto
- **QA dopo il fix:** Save/compare da catalogo, detail, shortlist e compare. Reload browser. Storage keys prima/dopo. Lint/build.

## Priorita P2

### FIX-007 - Search overlay mobile come sheet ottimizzata touch

- **Sezione:** Header / search
- **File/componenti da modificare:** `components/layout/site-header-v2.tsx`, `app/globals.css`
- **File/componenti da non toccare:** routing globale, API search, auth, stores
- **Soluzione consigliata:** Rendere la ricerca mobile piu raggiungibile e robusta con focus, safe-area e chiusura corretti. Mantenere la logica di ricerca esistente.
- **Rischio regressione:** medio
- **QA dopo il fix:** 320/375/414 con keyboard aperta. Escape/backdrop. No scroll trap. Lint/build.

### FIX-008 - Menu mobile full-width sotto 375px

- **Sezione:** Navigation mobile
- **File/componenti da modificare:** `components/layout/site-header-v2.tsx`, `app/globals.css`
- **File/componenti da non toccare:** routing, auth, API
- **Soluzione consigliata:** Mantenere i target 44px e valutare full-width sheet sotto 375px. Non cambiare link o routing.
- **Rischio regressione:** basso
- **QA dopo il fix:** 320/375/414. Link menu, account state, chiusura. Lint/build.

### FIX-009 - Badge semantici per trust e status

- **Sezione:** Components / design system
- **File/componenti da modificare:** `components/ui/badge.tsx`, `app/globals.css`
- **File/componenti da non toccare:** data model, API, auth
- **Soluzione consigliata:** Aggiungere varianti semanticamente nominate senza rompere badge esistenti. Inventariare varianti badge attuali.
- **Rischio regressione:** basso
- **QA dopo il fix:** Badge in catalogo/detail/compare. Contrasto light/dark. Lint/build.

### FIX-010 - Policy dialog/sheet/drawer coerenti

- **Sezione:** Overlays
- **File/componenti da modificare:** `components/ui/dialog.tsx`, `components/ui/drawer.tsx`, `components/ui/sheet.tsx`
- **File/componenti da non toccare:** auth modals, API routes, middleware
- **Soluzione consigliata:** Definire quale overlay usare per policy/trust su mobile e desktop. Non riscrivere tutte le primitive.
- **Rischio regressione:** medio
- **QA dopo il fix:** Keyboard navigation. Screen size mobile/desktop. No body scroll leak. Lint/build.

### FIX-011 - Palette meno monotona e piu editoriale

- **Sezione:** Visual design
- **File/componenti da modificare:** `app/globals.css`, `styles/vibes-3d-maestoso.css`
- **File/componenti da non toccare:** logic TS, API, state stores
- **Soluzione consigliata:** Ridurre dipendenza da un solo accento e introdurre gerarchie piu calme dove serve decisione. Non cambiare palette globalmente in un unico commit.
- **Rischio regressione:** alto
- **QA dopo il fix:** Home, detail, catalogo, compare, radar. Contrasto WCAG pratico. Lint/build.

### FIX-012 - QA mode gate-aware

- **Sezione:** App shell / QA
- **File/componenti da modificare:** `app/layout.tsx`, `app/(marketing)/layout.tsx`, `app/(marketing)/page.tsx`
- **File/componenti da non toccare:** auth, Cloudflare config, deployment config, middleware
- **Soluzione consigliata:** Definire una modalita QA esplicita senza cambiare comportamento produzione. Non bypassare gate produzione senza flag esplicito.
- **Rischio regressione:** medio
- **QA dopo il fix:** Route con gate chiuso/aperto. Intro/gamification off in QA. Build.

### FIX-013 - Distinguere search globale da catalog refine

- **Sezione:** UX flow / search
- **File/componenti da modificare:** `components/layout/site-header-v2.tsx`, `components/directory/*`, `components/tools/*`
- **File/componenti da non toccare:** API search, routing, stores
- **Soluzione consigliata:** Chiarire intenzione e microcopy senza cambiare backend search. Aggiornare label/placeholder e helper text nei soli componenti interessati.
- **Rischio regressione:** basso
- **QA dopo il fix:** Header search. Catalog filters/search. Mobile/desktop. Lint/build.

### FIX-014 - Skip link e keyboard route pass

- **Sezione:** Accessibility
- **File/componenti da modificare:** `app/layout.tsx`, `components/layout/*`, `app/globals.css`
- **File/componenti da non toccare:** routing, auth, API
- **Soluzione consigliata:** Aggiungere/verificare skip link e focus visible coerenti sulle route principali. Prima confermare assenza skip link con ricerca.
- **Rischio regressione:** medio
- **QA dopo il fix:** Tab order Home/Catalogo/Detail/Compare. Focus visible. Screen reader label principali. Lint/build.

## Priorita P3

### FIX-015 - Aggiornare Figma extraction notes dopo screenshot

- **Sezione:** Docs / Figma handoff
- **File/componenti da modificare:** `tooolvibes-ui-expert-agent/REPORTS/REPORT_AGENT_FIGMA_HANDOFF.md`, `tooolvibes-ui-expert-agent/REPORTS/REPORT_AGENT_FIGMA_SEED.md`
- **File/componenti da non toccare:** source app files, build config, API
- **Soluzione consigliata:** Aggiornare il handoff Figma con riferimenti screenshot e componenti realmente verificati. Non modificare codice app.
- **Rischio regressione:** basso
- **QA dopo il fix:** Controllo link file. Coerenza naming. Markdown lint manuale.
