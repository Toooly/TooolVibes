# REPORT_AGENT_FRONTEND_RISK

Modalita: read-only. Nessun rischio qui autorizza modifiche immediate: e una mappa per futuri interventi chirurgici.

## [P1] Due sistemi di persistenza per save/compare aumentano rischio drift

**Categoria analisi:** UX Flow / Mobile / Desktop
**Sezione progetto:** Da leggere nel campo Sezione/Area del finding originale.
**Route:** Da confermare tramite Evidenza e ricerca nel progetto.
**Componente coinvolto:** File esatto da confermare tramite ricerca nel progetto.
**Viewport:** mobile / tablet / desktop / wide, secondo Evidenza.
**File probabili da analizzare:** Usare i file citati in Evidenza; non inventare percorsi non verificati.
**File da NON toccare:** Supabase; auth; RLS; API routes; middleware; route handlers; server actions; database schema; env variables; package manager config; build/deployment config; Cloudflare config; routing globale; shared state stores, salvo task esplicitamente dedicato allo stato.
**Agenti/checklist che hanno rilevato il problema:** Report agent corrente + checklist correlate in tooolvibes-ui-expert-agent/CHECKLISTS/.
**Evidenza:** Vedere righe Evidenza gia presenti nel finding; se assenti, eseguire ricerca con rg prima di modificare.
**Problema rilevato:** Vedere descrizione originale del finding.
**Perche e un problema:** Vedere Impatto originale; completare con verifica runtime se necessario.
**Impatto utente:** Vedere Impatto originale; se manca, stimare prima di modificare.
**Severita:** P1
**Priorita consigliata:** alta
**Effort stimato:** Usare Effort originale; se assente stimare S/M/L prima di aprire PR.
**Rischio regressione:** medio

---


**Sezione:** State management
**Route:** Discovery, Shortlist, Compare, Tool detail
**Viewport:** Mobile e desktop
**Evidenza:** `lib/stores/tool-workspace-store.ts:4` usa `zustand/middleware`; `lib/stores/tool-workspace-store.ts:81-84` persiste `tooolvibes-tool-workspace` con `savedSlugs` e `compareSlugs`. In parallelo, `lib/discovery/local-storage.ts:23-30` definisce diverse chiavi `tooolvibes:*` per shortlist, compare, meta e sync.
**Impatto:** Una fix UI su save/compare puo rompere sincronizzazione o creare stati divergenti tra card, detail, shortlist e account.
**Fix consigliato:** Prima di modificare UI, decidere owner di stato e casi sync local/account.
**Classificazione:** Code-Only
**Effort:** M/L


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Due sistemi di persistenza per save/compare aumentano rischio drift" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

### Approccio consigliato

- partire dai file citati in Evidenza e confermare i percorsi con `rg`;
- riutilizzare componenti, token e pattern esistenti;
- preferire fix locali CSS/component-level prima di refactor globali;
- separare UI, stato, dati e configurazione in task diversi;
- mantenere invariati auth, API, Supabase, middleware e deployment salvo richiesta esplicita.

### File/componenti da controllare

File esatto da confermare tramite ricerca nel progetto. Usare i file indicati in Evidenza come punto di partenza.

### Tipo di modifica richiesta

Da classificare prima dell'intervento tra CSS only, JSX/TSX component-level, layout responsive, token/design system, copy/microcopy, accessibility, state handling, animation/motion o refactor leggero.

### Soluzione consigliata

Applicare prima la soluzione piu locale e reversibile: correggere il componente o la route indicata, evitare dipendenze nuove, non allargare la modifica a tutto il design system se il problema e circoscritto.

### Soluzioni alternative

Alternativa A: fix locale sul componente o sulla route indicata. Pro: rischio basso/medio e QA mirato. Contro: non elimina eventuali duplicazioni sistemiche.

Alternativa B: refactor o tokenizzazione condivisa. Pro: maggiore coerenza futura. Contro: rischio regressione alto, richiede screenshot e QA piu ampi.

### Soluzione piu sicura

Applicare prima Alternativa A. Passare ad Alternativa B solo se il problema e confermato in piu componenti o se il report lo classifica esplicitamente come design-system work.

### Cose da NON fare

- Non modificare Supabase, auth, RLS, API routes, middleware, route handlers o server actions.
- Non cambiare database schema, env variables, package manager config, build/deployment config o Cloudflare config.
- Non cambiare routing globale o shared state stores salvo finding dedicato.
- Non installare nuove dipendenze.
- Non riscrivere un intero componente se basta una correzione locale.
- Non usare z-index estremi o hardcoded se esistono token/pattern gia presenti.

### Rischi tecnici

- regressione mobile o desktop non coperta;
- overflow orizzontale e safe-area iOS non rispettata;
- overlay che copre CTA o blocca lo scroll;
- incoerenza con design system o Figma SoT;
- perdita di stato save/compare se si toccano store senza migrazione.

### QA obbligatorio dopo modifica

- testare viewport 320px, 375px, 414px, 768px;
- testare desktop 1024px, 1280px, 1440px, 1920px se la modifica non e solo mobile;
- verificare assenza overflow orizzontale;
- verificare tap target minimo 44x44px quando ci sono controlli touch;
- verificare focus visible da tastiera e hover desktop dove applicabile;
- verificare che routing, link, auth/login e API non siano stati toccati;
- verificare console browser senza errori se si esegue QA runtime;
- eseguire gli script disponibili in package.json.

### Comando o verifica consigliata

```bash
npm run lint
npm run build
```

## [P1] Compare max duplicato in due punti

**Categoria analisi:** UX Flow / Mobile / Desktop
**Sezione progetto:** Da leggere nel campo Sezione/Area del finding originale.
**Route:** Da confermare tramite Evidenza e ricerca nel progetto.
**Componente coinvolto:** File esatto da confermare tramite ricerca nel progetto.
**Viewport:** mobile / tablet / desktop / wide, secondo Evidenza.
**File probabili da analizzare:** Usare i file citati in Evidenza; non inventare percorsi non verificati.
**File da NON toccare:** Supabase; auth; RLS; API routes; middleware; route handlers; server actions; database schema; env variables; package manager config; build/deployment config; Cloudflare config; routing globale; shared state stores, salvo task esplicitamente dedicato allo stato.
**Agenti/checklist che hanno rilevato il problema:** Report agent corrente + checklist correlate in tooolvibes-ui-expert-agent/CHECKLISTS/.
**Evidenza:** Vedere righe Evidenza gia presenti nel finding; se assenti, eseguire ricerca con rg prima di modificare.
**Problema rilevato:** Vedere descrizione originale del finding.
**Perche e un problema:** Vedere Impatto originale; completare con verifica runtime se necessario.
**Impatto utente:** Vedere Impatto originale; se manca, stimare prima di modificare.
**Severita:** P1
**Priorita consigliata:** alta
**Effort stimato:** Usare Effort originale; se assente stimare S/M/L prima di aprire PR.
**Rischio regressione:** medio

---


**Sezione:** Compare
**Route:** `/compare`, discovery cards
**Viewport:** Mobile e desktop
**Evidenza:** `lib/stores/tool-workspace-store.ts:23` e `lib/discovery/local-storage.ts:8` definiscono entrambi `MAX_COMPARE_TOOLS = 5`.
**Impatto:** Cambiare il limite in una sola zona produrrebbe comportamento incoerente.
**Fix consigliato:** Unificare costante o introdurre un contract condiviso prima di toccare la UX.
**Classificazione:** Code-Only
**Effort:** S/M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Compare max duplicato in due punti" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

### Approccio consigliato

- partire dai file citati in Evidenza e confermare i percorsi con `rg`;
- riutilizzare componenti, token e pattern esistenti;
- preferire fix locali CSS/component-level prima di refactor globali;
- separare UI, stato, dati e configurazione in task diversi;
- mantenere invariati auth, API, Supabase, middleware e deployment salvo richiesta esplicita.

### File/componenti da controllare

File esatto da confermare tramite ricerca nel progetto. Usare i file indicati in Evidenza come punto di partenza.

### Tipo di modifica richiesta

Da classificare prima dell'intervento tra CSS only, JSX/TSX component-level, layout responsive, token/design system, copy/microcopy, accessibility, state handling, animation/motion o refactor leggero.

### Soluzione consigliata

Applicare prima la soluzione piu locale e reversibile: correggere il componente o la route indicata, evitare dipendenze nuove, non allargare la modifica a tutto il design system se il problema e circoscritto.

### Soluzioni alternative

Alternativa A: fix locale sul componente o sulla route indicata. Pro: rischio basso/medio e QA mirato. Contro: non elimina eventuali duplicazioni sistemiche.

Alternativa B: refactor o tokenizzazione condivisa. Pro: maggiore coerenza futura. Contro: rischio regressione alto, richiede screenshot e QA piu ampi.

### Soluzione piu sicura

Applicare prima Alternativa A. Passare ad Alternativa B solo se il problema e confermato in piu componenti o se il report lo classifica esplicitamente come design-system work.

### Cose da NON fare

- Non modificare Supabase, auth, RLS, API routes, middleware, route handlers o server actions.
- Non cambiare database schema, env variables, package manager config, build/deployment config o Cloudflare config.
- Non cambiare routing globale o shared state stores salvo finding dedicato.
- Non installare nuove dipendenze.
- Non riscrivere un intero componente se basta una correzione locale.
- Non usare z-index estremi o hardcoded se esistono token/pattern gia presenti.

### Rischi tecnici

- regressione mobile o desktop non coperta;
- overflow orizzontale e safe-area iOS non rispettata;
- overlay che copre CTA o blocca lo scroll;
- incoerenza con design system o Figma SoT;
- perdita di stato save/compare se si toccano store senza migrazione.

### QA obbligatorio dopo modifica

- testare viewport 320px, 375px, 414px, 768px;
- testare desktop 1024px, 1280px, 1440px, 1920px se la modifica non e solo mobile;
- verificare assenza overflow orizzontale;
- verificare tap target minimo 44x44px quando ci sono controlli touch;
- verificare focus visible da tastiera e hover desktop dove applicabile;
- verificare che routing, link, auth/login e API non siano stati toccati;
- verificare console browser senza errori se si esegue QA runtime;
- eseguire gli script disponibili in package.json.

### Comando o verifica consigliata

```bash
npm run lint
npm run build
```

## [P1] CSS globale molto ampio rende rischiose fix visuali estese

**Categoria analisi:** UI / Frontend Risk
**Sezione progetto:** Da leggere nel campo Sezione/Area del finding originale.
**Route:** Da confermare tramite Evidenza e ricerca nel progetto.
**Componente coinvolto:** File esatto da confermare tramite ricerca nel progetto.
**Viewport:** mobile / tablet / desktop / wide, secondo Evidenza.
**File probabili da analizzare:** Usare i file citati in Evidenza; non inventare percorsi non verificati.
**File da NON toccare:** Supabase; auth; RLS; API routes; middleware; route handlers; server actions; database schema; env variables; package manager config; build/deployment config; Cloudflare config; routing globale; shared state stores, salvo task esplicitamente dedicato allo stato.
**Agenti/checklist che hanno rilevato il problema:** Report agent corrente + checklist correlate in tooolvibes-ui-expert-agent/CHECKLISTS/.
**Evidenza:** Vedere righe Evidenza gia presenti nel finding; se assenti, eseguire ricerca con rg prima di modificare.
**Problema rilevato:** Vedere descrizione originale del finding.
**Perche e un problema:** Vedere Impatto originale; completare con verifica runtime se necessario.
**Impatto utente:** Vedere Impatto originale; se manca, stimare prima di modificare.
**Severita:** P1
**Priorita consigliata:** alta
**Effort stimato:** Usare Effort originale; se assente stimare S/M/L prima di aprire PR.
**Rischio regressione:** medio

---


**Sezione:** CSS architecture
**Route:** Globale
**Viewport:** Mobile e desktop
**Evidenza:** `app/globals.css` contiene token iniziali e ridefinizioni successive; metriche statiche indicano migliaia di valori cromatici locali e centinaia di arbitrary radius.
**Impatto:** Un cambiamento apparentemente piccolo puo propagarsi su Home, catalogo, radar, admin o mobile nav.
**Fix consigliato:** Ogni futuro edit deve avere scope per route/componenti e screenshot prima/dopo.
**Classificazione:** Code-Only + Figma migration plan
**Effort:** L


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "CSS globale molto ampio rende rischiose fix visuali estese" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

### Approccio consigliato

- partire dai file citati in Evidenza e confermare i percorsi con `rg`;
- riutilizzare componenti, token e pattern esistenti;
- preferire fix locali CSS/component-level prima di refactor globali;
- separare UI, stato, dati e configurazione in task diversi;
- mantenere invariati auth, API, Supabase, middleware e deployment salvo richiesta esplicita.

### File/componenti da controllare

File esatto da confermare tramite ricerca nel progetto. Usare i file indicati in Evidenza come punto di partenza.

### Tipo di modifica richiesta

Da classificare prima dell'intervento tra CSS only, JSX/TSX component-level, layout responsive, token/design system, copy/microcopy, accessibility, state handling, animation/motion o refactor leggero.

### Soluzione consigliata

Applicare prima la soluzione piu locale e reversibile: correggere il componente o la route indicata, evitare dipendenze nuove, non allargare la modifica a tutto il design system se il problema e circoscritto.

### Soluzioni alternative

Alternativa A: fix locale sul componente o sulla route indicata. Pro: rischio basso/medio e QA mirato. Contro: non elimina eventuali duplicazioni sistemiche.

Alternativa B: refactor o tokenizzazione condivisa. Pro: maggiore coerenza futura. Contro: rischio regressione alto, richiede screenshot e QA piu ampi.

### Soluzione piu sicura

Applicare prima Alternativa A. Passare ad Alternativa B solo se il problema e confermato in piu componenti o se il report lo classifica esplicitamente come design-system work.

### Cose da NON fare

- Non modificare Supabase, auth, RLS, API routes, middleware, route handlers o server actions.
- Non cambiare database schema, env variables, package manager config, build/deployment config o Cloudflare config.
- Non cambiare routing globale o shared state stores salvo finding dedicato.
- Non installare nuove dipendenze.
- Non riscrivere un intero componente se basta una correzione locale.
- Non usare z-index estremi o hardcoded se esistono token/pattern gia presenti.

### Rischi tecnici

- regressione mobile o desktop non coperta;
- overflow orizzontale e safe-area iOS non rispettata;
- overlay che copre CTA o blocca lo scroll;
- incoerenza con design system o Figma SoT;
- perdita di stato save/compare se si toccano store senza migrazione.

### QA obbligatorio dopo modifica

- testare viewport 320px, 375px, 414px, 768px;
- testare desktop 1024px, 1280px, 1440px, 1920px se la modifica non e solo mobile;
- verificare assenza overflow orizzontale;
- verificare tap target minimo 44x44px quando ci sono controlli touch;
- verificare focus visible da tastiera e hover desktop dove applicabile;
- verificare che routing, link, auth/login e API non siano stati toccati;
- verificare console browser senza errori se si esegue QA runtime;
- eseguire gli script disponibili in package.json.

### Comando o verifica consigliata

```bash
npm run lint
npm run build
```

## [P2] Gate e shell esperienziale complicano QA e automazione

**Categoria analisi:** Frontend Risk / UX Flow
**Sezione progetto:** Da leggere nel campo Sezione/Area del finding originale.
**Route:** Da confermare tramite Evidenza e ricerca nel progetto.
**Componente coinvolto:** File esatto da confermare tramite ricerca nel progetto.
**Viewport:** mobile / tablet / desktop / wide, secondo Evidenza.
**File probabili da analizzare:** Usare i file citati in Evidenza; non inventare percorsi non verificati.
**File da NON toccare:** Supabase; auth; RLS; API routes; middleware; route handlers; server actions; database schema; env variables; package manager config; build/deployment config; Cloudflare config; routing globale; shared state stores, salvo task esplicitamente dedicato allo stato.
**Agenti/checklist che hanno rilevato il problema:** Report agent corrente + checklist correlate in tooolvibes-ui-expert-agent/CHECKLISTS/.
**Evidenza:** Vedere righe Evidenza gia presenti nel finding; se assenti, eseguire ricerca con rg prima di modificare.
**Problema rilevato:** Vedere descrizione originale del finding.
**Perche e un problema:** Vedere Impatto originale; completare con verifica runtime se necessario.
**Impatto utente:** Vedere Impatto originale; se manca, stimare prima di modificare.
**Severita:** P2
**Priorita consigliata:** media
**Effort stimato:** Usare Effort originale; se assente stimare S/M/L prima di aprire PR.
**Rischio regressione:** basso

---


**Sezione:** App shell
**Route:** Marketing routes
**Viewport:** Mobile e desktop
**Evidenza:** `app/(marketing)/layout.tsx:21-23` verifica gate; `app/(marketing)/page.tsx:36-37` ritorna `ComingSoonPage`; `app/layout.tsx:96-97` monta `GamificationShell` e `IntroCinematic3D` quando aperto.
**Impatto:** Test visuali possono catturare Coming Soon o overlay invece della pagina target.
**Fix consigliato:** Definire un modo QA esplicito per aprire gate e disattivare intro solo in test.
**Classificazione:** Code-Only
**Effort:** M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Gate e shell esperienziale complicano QA e automazione" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

### Approccio consigliato

- partire dai file citati in Evidenza e confermare i percorsi con `rg`;
- riutilizzare componenti, token e pattern esistenti;
- preferire fix locali CSS/component-level prima di refactor globali;
- separare UI, stato, dati e configurazione in task diversi;
- mantenere invariati auth, API, Supabase, middleware e deployment salvo richiesta esplicita.

### File/componenti da controllare

File esatto da confermare tramite ricerca nel progetto. Usare i file indicati in Evidenza come punto di partenza.

### Tipo di modifica richiesta

Da classificare prima dell'intervento tra CSS only, JSX/TSX component-level, layout responsive, token/design system, copy/microcopy, accessibility, state handling, animation/motion o refactor leggero.

### Soluzione consigliata

Applicare prima la soluzione piu locale e reversibile: correggere il componente o la route indicata, evitare dipendenze nuove, non allargare la modifica a tutto il design system se il problema e circoscritto.

### Soluzioni alternative

Alternativa A: fix locale sul componente o sulla route indicata. Pro: rischio basso/medio e QA mirato. Contro: non elimina eventuali duplicazioni sistemiche.

Alternativa B: refactor o tokenizzazione condivisa. Pro: maggiore coerenza futura. Contro: rischio regressione alto, richiede screenshot e QA piu ampi.

### Soluzione piu sicura

Applicare prima Alternativa A. Passare ad Alternativa B solo se il problema e confermato in piu componenti o se il report lo classifica esplicitamente come design-system work.

### Cose da NON fare

- Non modificare Supabase, auth, RLS, API routes, middleware, route handlers o server actions.
- Non cambiare database schema, env variables, package manager config, build/deployment config o Cloudflare config.
- Non cambiare routing globale o shared state stores salvo finding dedicato.
- Non installare nuove dipendenze.
- Non riscrivere un intero componente se basta una correzione locale.
- Non usare z-index estremi o hardcoded se esistono token/pattern gia presenti.

### Rischi tecnici

- regressione mobile o desktop non coperta;
- overflow orizzontale e safe-area iOS non rispettata;
- overlay che copre CTA o blocca lo scroll;
- incoerenza con design system o Figma SoT;
- perdita di stato save/compare se si toccano store senza migrazione.

### QA obbligatorio dopo modifica

- testare viewport 320px, 375px, 414px, 768px;
- testare desktop 1024px, 1280px, 1440px, 1920px se la modifica non e solo mobile;
- verificare assenza overflow orizzontale;
- verificare tap target minimo 44x44px quando ci sono controlli touch;
- verificare focus visible da tastiera e hover desktop dove applicabile;
- verificare che routing, link, auth/login e API non siano stati toccati;
- verificare console browser senza errori se si esegue QA runtime;
- eseguire gli script disponibili in package.json.

### Comando o verifica consigliata

```bash
npm run lint
npm run build
```

## Stop-list per `PROMPTS/06_surgical_ui_fix.md`

- Non usarlo per sistemare token globali e trust insieme.
- Non usarlo per cambiare data model, Supabase, auth o sync.
- Non usarlo senza preflight su file toccati e screenshot/grep di verifica.
- Una fix = un componente o una route, non una categoria intera.
