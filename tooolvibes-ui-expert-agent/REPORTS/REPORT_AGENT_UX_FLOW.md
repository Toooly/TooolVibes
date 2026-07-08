# REPORT_AGENT_UX_FLOW

Focus: percorsi utente principali e frizioni decisionali.

## Flow primario osservato

1. Home o Archivio.
2. Ricerca/filtro categoria.
3. Tool card con save/compare/open.
4. Tool detail.
5. Shortlist o Compare.
6. CTA esterno / fonte / articolo.
7. Account sync opzionale.

## [P1] Save/compare sono centrali ma distribuiti tra piu superfici e store

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


**Sezione:** Decision workflow
**Route:** Archivio, Tool detail, Compare, Shortlist
**Viewport:** Mobile e desktop
**Evidenza:** `components/tools/tool-card.tsx:229-230` espone azioni card; `app/(marketing)/toools/[slug]/page.tsx:232-233` espone compare/shortlist nel detail; `lib/stores/tool-workspace-store.ts:34-35` e `lib/discovery/local-storage.ts:23-30` persistono stati simili.
**Impatto:** Il flow e potente, ma richiede una semantica chiara: salvato, in review, top, confrontato, sincronizzato.
**Fix consigliato:** Mappa stati visiva unica e copy coerente su card/detail/shortlist.
**Classificazione Figma:** Figma-SoT per stati; Code-Only per sync.
**Effort:** M/L


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Save/compare sono centrali ma distribuiti tra piu superfici e store" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P1] Compare dovrebbe guidare, non solo contenere dati

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
**Route:** `/compare`
**Viewport:** Mobile e desktop
**Evidenza:** `components/tools/unified-compare-board.tsx:27-36` confronta 6 righe; `components/tools/compare-board.tsx:368` mostra contatore su `MAX_COMPARE_TOOLS`; il limite e 5.
**Impatto:** Oltre 3/4 tool, l'utente rischia di leggere righe invece di decidere.
**Fix consigliato:** Evidenziare raccomandato, differenze decisive, "meglio per" e motivi di esclusione.
**Classificazione Figma:** Figma-SoT
**Effort:** M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Compare dovrebbe guidare, non solo contenere dati" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P2] Ricerca header e ricerca catalogo vanno distinte per intenzione

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
**Severita:** P2
**Priorita consigliata:** media
**Effort stimato:** Usare Effort originale; se assente stimare S/M/L prima di aprire PR.
**Rischio regressione:** basso

---


**Sezione:** Search
**Route:** Globale + `/archivio`
**Viewport:** Mobile e desktop
**Evidenza:** Header ha overlay search `components/layout/site-header-v2.tsx:243-260`; catalogo ha search/filter propri in `components/directory/mobile-catalog-view.tsx`.
**Impatto:** Search globale puo sembrare uguale a filtro catalogo, ma l'intento e diverso.
**Fix consigliato:** Header search = jump/search globale; Catalog search = refine current list. Copy e placeholder distinti.
**Classificazione Figma:** Figma-SoT per search patterns.
**Effort:** S/M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Ricerca header e ricerca catalogo vanno distinte per intenzione" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P2] Gate di lancio interrompe il percorso naturale di audit/utente

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


**Sezione:** Entry flow
**Route:** `/` e marketing routes
**Viewport:** Mobile e desktop
**Evidenza:** `app/(marketing)/layout.tsx:23` blocca layout marketing senza gate; `app/(marketing)/page.tsx:37` ritorna `ComingSoonPage`.
**Impatto:** Utenti e QA vedono due prodotti diversi in base allo stato gate.
**Fix consigliato:** Policy chiara di pre-launch, preview, production e analytics.
**Classificazione:** Code-Only
**Effort:** M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Gate di lancio interrompe il percorso naturale di audit/utente" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## Flow positives

- Bottom nav mobile e header persistente rendono discovery raggiungibile.
- Tool detail contiene quick actions, fonte e CTA ripetuti in modo utile.
- Esiste supporto locale per shortlist anonima, in linea con le open questions del product context.
