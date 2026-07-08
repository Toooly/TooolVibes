# REPORT_AGENT_EXECUTABLE_BACKLOG

Backlog operativo pronto per agenti di modifica. Ogni task deve essere letto insieme a `REPORT_AGENT_DO_NOT_TOUCH_ZONES.md`.

# TASK ID: FIX-001

**Titolo:** Disclosure affiliate accanto ai CTA commerciali
**Sezione:** Trust / conversion
**Priorita:** P0
**Effort:** M
**Rischio:** medio
**Tipo modifica:** component-level / copy / trust UI
**File probabili:** `app/(marketing)/posts/[slug]/page.tsx`, `app/(marketing)/toools/[slug]/page.tsx`, `lib/types/tool.ts`
**File da non toccare:** Supabase, auth, API routes, middleware, schema database
**Descrizione problema:** I CTA esterni possono usare URL affiliati senza disclosure visibile nello stesso contesto del click.
**Obiettivo modifica:** Mostrare una micro-disclosure chiara vicino ai CTA che usano link affiliati, mantenendo il copy compatto su mobile.
**Istruzioni operative:** Individuare dove viene risolto `tool.affiliate_url ?? tool.website_url`. Aggiungere una disclosure solo quando il link effettivo e affiliato o quando il dato disponibile lo rende verificabile. Riutilizzare componenti testuali/badge esistenti; evitare nuovi package. Non cambiare la logica di fetch dei tool o degli articoli.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Verificare post detail e tool detail a 320/375/414/1280. Verificare che il CTA resti cliccabile. Eseguire `npm run lint` e `npm run build`.
**Dipendenze:** Richiede conferma copy legale se si vuole testo definitivo; puo partire con microcopy provvisorio.
**Puo essere eseguito da solo:** si

# TASK ID: FIX-002

**Titolo:** Trust block con last reviewed e reviewer
**Sezione:** Trust / editorial
**Priorita:** P1
**Effort:** L
**Rischio:** medio
**Tipo modifica:** component-level / data-aware UI
**File probabili:** `app/(marketing)/toools/[slug]/page.tsx`, `app/(marketing)/posts/[slug]/page.tsx`, `lib/types/tool.ts`, `lib/types/article.ts`
**File da non toccare:** schema database, Supabase, server actions, API routes
**Descrizione problema:** Le pagine mostrano autore/data ma non un modello editoriale completo di revisione.
**Obiettivo modifica:** Separare pubblicazione, aggiornamento e revisione editoriale senza inventare dati non presenti.
**Istruzioni operative:** Prima verificare quali campi sono realmente disponibili nei record tool/article. Se manca `last_reviewed_at`, aggiungere solo UI fallback esplicito, ad esempio 'Dati editoriali in aggiornamento'. Separare il componente trust block dalla logica dati se gia esistono pattern simili. Non modificare database o API senza task separato.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Tool detail e post detail a mobile/desktop. Verificare stati con campi mancanti. Lint/build.
**Dipendenze:** Dipende da decisione prodotto sui campi editoriali definitivi.
**Puo essere eseguito da solo:** no

# TASK ID: FIX-003

**Titolo:** Primitive input/select/button con target touch minimo
**Sezione:** Mobile / component primitives
**Priorita:** P1
**Effort:** M
**Rischio:** medio
**Tipo modifica:** CSS/component primitive
**File probabili:** `components/ui/input.tsx`, `components/ui/input-group.tsx`, `components/ui/select.tsx`, `components/ui/button.tsx`
**File da non toccare:** admin dense UI senza verifica, API, auth, routing
**Descrizione problema:** Alcune primitive usano altezze 28/32/36px, sotto il target ergonomico mobile.
**Obiettivo modifica:** Garantire almeno 44px nei contesti touch senza rompere UI dense desktop/admin.
**Istruzioni operative:** Mappare dove xs/sm sono usati prima di cambiare le primitive globali. Preferire media query mobile o prop/variant touch-safe se xs/sm servono ancora in admin. Non fare refactor generale delle form. Verificare focus ring e allineamento iconico dopo il cambio altezza.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Viewport 320/375/414/768. Search header, filtri catalogo, form account/admin se accessibili. Lint/build.
**Dipendenze:** Richiede audit dei call site xs/sm.
**Puo essere eseguito da solo:** si

# TASK ID: FIX-004

**Titolo:** Token radius/color/shadow canonici
**Sezione:** Design system
**Priorita:** P1
**Effort:** L
**Rischio:** alto
**Tipo modifica:** token/design system
**File probabili:** `app/globals.css`, `styles/vibes-3d-maestoso.css`, `tailwind.config.ts`
**File da non toccare:** route logic, stores, API, auth, database
**Descrizione problema:** Token e valori arbitrari sono duplicati in piu zone CSS, con palette/radius non canonici.
**Obiettivo modifica:** Definire una fonte token stabile e migrare solo i valori piu ripetuti in modo incrementale.
**Istruzioni operative:** Fare prima inventory grep di radius, colori e shadow ricorrenti. Creare/mappare token esistenti invece di sostituire tutto in un unico commit. Applicare una sola famiglia token per volta. Non cambiare layout o componenti durante la migrazione token.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Screenshot Home/Catalogo/Detail/Compare/Radar prima-dopo. Grep valori arbitrari prima-dopo. Lint/build.
**Dipendenze:** Meglio dopo FIX-003 e dopo una decisione Figma SoT.
**Puo essere eseguito da solo:** no

# TASK ID: FIX-005

**Titolo:** Compare 5 tool guidato o limitato
**Sezione:** Compare UX
**Priorita:** P1
**Effort:** M
**Rischio:** medio
**Tipo modifica:** UX flow / state handling
**File probabili:** `lib/stores/tool-workspace-store.ts`, `lib/discovery/local-storage.ts`, `components/tools/unified-compare-board.tsx`, `components/tools/compare-board.tsx`
**File da non toccare:** Supabase, auth, API routes, middleware
**Descrizione problema:** Il confronto puo accettare 5 tool e diventare una matrice difficile da usare, soprattutto mobile/tablet.
**Obiettivo modifica:** Guidare l'utente verso 2-4 tool attivi e trattare il quinto come warning o parking lot.
**Istruzioni operative:** Prima decidere se cambiare limite o solo introdurre UX warning. Se si cambia limite, aggiornare tutte le costanti duplicate insieme. Preferire warning UI iniziale per ridurre rischio regressione. Non modificare algoritmo di scoring nello stesso intervento.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Aggiunta/rimozione tool da catalogo. Compare con 2/3/4/5 tool. Persistenza reload. Lint/build.
**Dipendenze:** Dipende da FIX-006 se si tocca stato.
**Puo essere eseguito da solo:** no

# TASK ID: FIX-006

**Titolo:** Unificare contratto save/compare
**Sezione:** Frontend state
**Priorita:** P1
**Effort:** L
**Rischio:** alto
**Tipo modifica:** state handling / refactor leggero
**File probabili:** `lib/stores/tool-workspace-store.ts`, `lib/discovery/local-storage.ts`, `components/tools/*`
**File da non toccare:** database schema, auth, API routes, RLS
**Descrizione problema:** Save/compare hanno piu chiavi e owner potenzialmente divergenti tra workspace store e local storage discovery.
**Obiettivo modifica:** Definire un solo contratto di stato o un adapter chiaro tra i due sistemi.
**Istruzioni operative:** Scrivere prima una mappa delle chiavi esistenti e dei componenti consumer. Non cancellare dati localStorage senza migrazione. Introdurre adapter o export condivisi prima di cambiare UI. Testare reload e transizione anonimo/account se presente.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Save/compare da catalogo, detail, shortlist e compare. Reload browser. Storage keys prima/dopo. Lint/build.
**Dipendenze:** Da eseguire prima di modifiche UX profonde su save/compare.
**Puo essere eseguito da solo:** no

# TASK ID: FIX-007

**Titolo:** Search overlay mobile come sheet ottimizzata touch
**Sezione:** Header / search
**Priorita:** P2
**Effort:** M
**Rischio:** medio
**Tipo modifica:** layout responsive / accessibility
**File probabili:** `components/layout/site-header-v2.tsx`, `app/globals.css`
**File da non toccare:** routing globale, API search, auth, stores
**Descrizione problema:** La search mobile e un overlay centrato generico, non una sheet mobile ottimizzata per tastiera e safe-area.
**Obiettivo modifica:** Rendere la ricerca mobile piu raggiungibile e robusta con focus, safe-area e chiusura corretti.
**Istruzioni operative:** Mantenere la logica di ricerca esistente. Intervenire su markup/stili overlay mobile, evitando refactor header desktop. Garantire focus iniziale, Escape/backdrop e focus return. Verificare tastiera mobile e overflow.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** 320/375/414 con keyboard aperta. Escape/backdrop. No scroll trap. Lint/build.
**Dipendenze:** Nessuna.
**Puo essere eseguito da solo:** si

# TASK ID: FIX-008

**Titolo:** Menu mobile full-width sotto 375px
**Sezione:** Navigation mobile
**Priorita:** P2
**Effort:** S
**Rischio:** basso
**Tipo modifica:** CSS responsive
**File probabili:** `components/layout/site-header-v2.tsx`, `app/globals.css`
**File da non toccare:** routing, auth, API
**Descrizione problema:** Il drawer mobile a 85vw puo comprimere voci lunghe su 320/375px.
**Obiettivo modifica:** Mantenere i target 44px e valutare full-width sheet sotto 375px.
**Istruzioni operative:** Non cambiare link o routing. Applicare solo media query sotto 375px se il problema e confermato. Verificare safe-area e bottone chiusura.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** 320/375/414. Link menu, account state, chiusura. Lint/build.
**Dipendenze:** Puo essere accoppiato a FIX-007 solo se entrambi toccano header.
**Puo essere eseguito da solo:** si

# TASK ID: FIX-009

**Titolo:** Badge semantici per trust e status
**Sezione:** Components / design system
**Priorita:** P2
**Effort:** S/M
**Rischio:** basso
**Tipo modifica:** component primitive / token
**File probabili:** `components/ui/badge.tsx`, `app/globals.css`
**File da non toccare:** data model, API, auth
**Descrizione problema:** La primitive badge non copre chiaramente varianti editoriali/trust/status.
**Obiettivo modifica:** Aggiungere varianti semanticamente nominate senza rompere badge esistenti.
**Istruzioni operative:** Inventariare varianti badge attuali. Aggiungere solo variant additive. Non rinominare classi esistenti senza migrazione.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Badge in catalogo/detail/compare. Contrasto light/dark. Lint/build.
**Dipendenze:** Utile prima di FIX-001/FIX-002 se si usa badge trust.
**Puo essere eseguito da solo:** si

# TASK ID: FIX-010

**Titolo:** Policy dialog/sheet/drawer coerenti
**Sezione:** Overlays
**Priorita:** P2
**Effort:** M
**Rischio:** medio
**Tipo modifica:** component-level / accessibility
**File probabili:** `components/ui/dialog.tsx`, `components/ui/drawer.tsx`, `components/ui/sheet.tsx`
**File da non toccare:** auth modals, API routes, middleware
**Descrizione problema:** Dialog, sheet e drawer possono competere senza regola chiara per policy/trust content.
**Obiettivo modifica:** Definire quale overlay usare per policy/trust su mobile e desktop.
**Istruzioni operative:** Non riscrivere tutte le primitive. Creare una linea guida e applicare a un solo caso pilota. Verificare focus trap e aria.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Keyboard navigation. Screen size mobile/desktop. No body scroll leak. Lint/build.
**Dipendenze:** Meglio dopo decisione copy trust.
**Puo essere eseguito da solo:** si

# TASK ID: FIX-011

**Titolo:** Palette meno monotona e piu editoriale
**Sezione:** Visual design
**Priorita:** P2
**Effort:** L
**Rischio:** alto
**Tipo modifica:** visual design / token
**File probabili:** `app/globals.css`, `styles/vibes-3d-maestoso.css`
**File da non toccare:** logic TS, API, state stores
**Descrizione problema:** Il tono visuale rischia di diventare troppo neon/pill/card e meno editoriale.
**Obiettivo modifica:** Ridurre dipendenza da un solo accento e introdurre gerarchie piu calme dove serve decisione.
**Istruzioni operative:** Non cambiare palette globalmente in un unico commit. Partire da superfici trust/detail o compare, non da tutte le route. Documentare token e screenshot prima/dopo.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Home, detail, catalogo, compare, radar. Contrasto WCAG pratico. Lint/build.
**Dipendenze:** Dopo FIX-004.
**Puo essere eseguito da solo:** no

# TASK ID: FIX-012

**Titolo:** QA mode gate-aware
**Sezione:** App shell / QA
**Priorita:** P2
**Effort:** M
**Rischio:** medio
**Tipo modifica:** state/config / QA
**File probabili:** `app/layout.tsx`, `app/(marketing)/layout.tsx`, `app/(marketing)/page.tsx`
**File da non toccare:** auth, Cloudflare config, deployment config, middleware
**Descrizione problema:** Gate e intro possono impedire QA visuale ripetibile delle route reali.
**Obiettivo modifica:** Definire una modalita QA esplicita senza cambiare comportamento produzione.
**Istruzioni operative:** Non bypassare gate produzione senza flag esplicito. Preferire query/cookie QA documentata o env gia esistente se presente. Non toccare Cloudflare o deployment nello stesso task.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Route con gate chiuso/aperto. Intro/gamification off in QA. Build.
**Dipendenze:** Richiede decisione su flag QA.
**Puo essere eseguito da solo:** no

# TASK ID: FIX-013

**Titolo:** Distinguere search globale da catalog refine
**Sezione:** UX flow / search
**Priorita:** P2
**Effort:** S/M
**Rischio:** basso
**Tipo modifica:** copy / UX flow
**File probabili:** `components/layout/site-header-v2.tsx`, `components/directory/*`, `components/tools/*`
**File da non toccare:** API search, routing, stores
**Descrizione problema:** Ricerca globale e raffinamento catalogo possono sembrare la stessa azione.
**Obiettivo modifica:** Chiarire intenzione e microcopy senza cambiare backend search.
**Istruzioni operative:** Aggiornare label/placeholder e helper text nei soli componenti interessati. Non cambiare endpoint o query logic. Verificare empty state differenziati.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Header search. Catalog filters/search. Mobile/desktop. Lint/build.
**Dipendenze:** Puo seguire FIX-007.
**Puo essere eseguito da solo:** si

# TASK ID: FIX-014

**Titolo:** Skip link e keyboard route pass
**Sezione:** Accessibility
**Priorita:** P2
**Effort:** M
**Rischio:** medio
**Tipo modifica:** accessibility
**File probabili:** `app/layout.tsx`, `components/layout/*`, `app/globals.css`
**File da non toccare:** routing, auth, API
**Descrizione problema:** Non e stato trovato un global skip link e la keyboard QA non e chiusa.
**Obiettivo modifica:** Aggiungere/verificare skip link e focus visible coerenti sulle route principali.
**Istruzioni operative:** Prima confermare assenza skip link con ricerca. Aggiungere un link 'Salta al contenuto' collegato a `main` se manca. Non modificare navigazione o routing.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Tab order Home/Catalogo/Detail/Compare. Focus visible. Screen reader label principali. Lint/build.
**Dipendenze:** Nessuna.
**Puo essere eseguito da solo:** si

# TASK ID: FIX-015

**Titolo:** Aggiornare Figma extraction notes dopo screenshot
**Sezione:** Docs / Figma handoff
**Priorita:** P3
**Effort:** S
**Rischio:** basso
**Tipo modifica:** documentation
**File probabili:** `tooolvibes-ui-expert-agent/REPORTS/REPORT_AGENT_FIGMA_HANDOFF.md`, `tooolvibes-ui-expert-agent/REPORTS/REPORT_AGENT_FIGMA_SEED.md`
**File da non toccare:** source app files, build config, API
**Descrizione problema:** Le note Figma sono ancora basate su audit statico e non su screenshot runtime finali.
**Obiettivo modifica:** Aggiornare il handoff Figma con riferimenti screenshot e componenti realmente verificati.
**Istruzioni operative:** Non modificare codice app. Aggiungere solo note e link a screenshot/asset verificati. Separare Figma-SoT da Code-Only.
**Cose da evitare:** Non modificare aree vietate; non introdurre dipendenze; non allargare il task oltre i file indicati senza nuova richiesta.
**QA obbligatorio:** Controllo link file. Coerenza naming. Markdown lint manuale.
**Dipendenze:** Dopo QA runtime.
**Puo essere eseguito da solo:** si
