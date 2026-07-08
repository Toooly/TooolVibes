# REPORT_AGENT_UI_FULL_AUDIT

Metodo: audit statico da repository + agent team mode. Confidence: MEDIUM, perche non sono stati catturati screenshot runtime.

## [P0] CTA verso link commerciali senza disclosure esplicita accanto all'azione

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
**Severita:** P0
**Priorita consigliata:** alta
**Effort stimato:** Usare Effort originale; se assente stimare S/M/L prima di aprire PR.
**Rischio regressione:** medio

---


**Sezione:** Trust / conversion
**Route:** `/posts/[slug]`, `/toools/[slug]`
**Viewport:** Mobile e desktop
**Evidenza:** `app/(marketing)/posts/[slug]/page.tsx:297` usa `tool.affiliate_url ?? tool.website_url`; `app/(marketing)/posts/[slug]/page.tsx:302` mostra CTA "Vai al sito"; `app/(marketing)/toools/[slug]/page.tsx:215` usa CTA esterna; `lib/types/tool.ts:52` contiene `affiliate_url`. Non emerge una disclosure affiliate vicino a questi CTA nelle righe ispezionate.
**Impatto:** Rischio trust, compliance e percezione di neutralita editoriale.
**Fix consigliato:** Aggiungere una micro-disclosure stabile e visibile vicino a ogni CTA con URL affiliato, con variante compatta mobile e testo policy linkabile.
**Classificazione Figma:** Figma-SoT per pattern CTA trust; Code-Only per logica affiliate URL.
**Effort:** M
**QA:** Verificare post, tool detail, shop/offerte a 320/375/1280.


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "CTA verso link commerciali senza disclosure esplicita accanto all'azione" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P1] Trust editoriale non ha un modello UI completo di reviewer e last reviewed

**Categoria analisi:** Trust / UX Flow
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


**Sezione:** Tool detail / Editorial
**Route:** `/toools/[slug]`, `/posts/[slug]`
**Viewport:** Mobile e desktop
**Evidenza:** `app/(marketing)/toools/[slug]/page.tsx:201` mostra una data da `formatItalianDate(tool.publishedAt)`; `lib/types/tool.ts:39` ha `updated_at`, `lib/types/tool.ts:55` ha `date_discovered`, ma non sono emersi campi `last_reviewed_at` o reviewer. `app/(marketing)/posts/[slug]/page.tsx:328` usa `post.author_name ?? "TooolVibes"`; `lib/types/article.ts:15` e `:34` hanno `author_name`, senza ruolo/avatar/certificazione.
**Impatto:** La promessa "curation over catalog" resta meno verificabile nei momenti decisionali.
**Fix consigliato:** Separare "pubblicato", "aggiornato", "ultimo controllo" e "reviewer"; mostrare almeno last reviewed + autore/ruolo sui dettagli principali.
**Classificazione Figma:** Figma-SoT per trust block; Code-Only per schema dati.
**Effort:** L se richiede dati; S/M solo UI placeholder.


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Trust editoriale non ha un modello UI completo di reviewer e last reviewed" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P1] Design system senza una fonte canonica unica

**Categoria analisi:** Design System / Visual Design
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


**Sezione:** Design system
**Route:** Globale
**Viewport:** Mobile e desktop
**Evidenza:** `app/globals.css:89-91` definisce radius 32/24/18px; `app/globals.css:13245-13248` ridefinisce radius 12/18/24/32px; `app/globals.css:114-120` definisce accenti violet/indigo/primary/accent; `styles/vibes-3d-maestoso.css:5-45` introduce un proprio set cromatico. Metriche statiche: 1613 linee con hex, 4850 con `rgba(`, 490 con `rounded-[`, 61 con `shadow-[`.
**Impatto:** Difficile produrre Figma SoT affidabile e mantenere coerenza tra card, hero, nav, modali e stati.
**Fix consigliato:** Stabilire token canonici e migrare gli arbitrary values piu ripetuti.
**Classificazione Figma:** Figma-SoT.
**Effort:** L
**QA:** Grep token prima/dopo e confronto screenshot su Home, Archivio, Detail, Compare.


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Design system senza una fonte canonica unica" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P1] Primitive base sotto target ergonomici mobile

**Categoria analisi:** Mobile / UX Flow / Frontend Risk
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


**Sezione:** Componenti UI
**Route:** Tutte le form/search/filter che riusano primitive
**Viewport:** 320, 375, 414, 768
**Evidenza:** `components/ui/input.tsx:12` usa `h-8`; `components/ui/input-group.tsx:17` usa `h-8`; `components/ui/button.tsx:29-30` prevede `xs min-h-7` e `sm min-h-9`; `components/ui/select.tsx:44` include trigger `h-8` e `h-7` in mobile.
**Impatto:** Rischio tap target sotto 44px e incoerenza tra primitive e componenti custom gia piu grandi.
**Fix consigliato:** Normalizzare size primitive per mobile, o vietare xs/sm in contesti touch.
**Classificazione Figma:** Figma-SoT per primitives.
**Effort:** M
**QA:** 320/375 touch audit su search, filtri, auth/account, admin excluded.


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Primitive base sotto target ergonomici mobile" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P1] Compare supporta 5 tool e puo eccedere il modello decisionale richiesto

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
**Viewport:** 375, 768, 1024, 1280
**Evidenza:** `lib/stores/tool-workspace-store.ts:21` e `lib/discovery/local-storage.ts:8` impostano `MAX_COMPARE_TOOLS = 5`; `components/tools/unified-compare-board.tsx:27-36` definisce 6 righe di confronto; `components/tools/compare-board.tsx:411-415` usa una griglia desktop con `min-w-[48rem]` e colonne `minmax(13.75rem, 1fr)`.
**Impatto:** A 5 tool la tabella puo diventare piu catalogo che decision support, soprattutto a 1024/1280.
**Fix consigliato:** Raccomandare 2-4 tool, mostrare warning al quinto o separare "parking lot" da confronto attivo.
**Classificazione Figma:** Figma-SoT per compare pattern; Code-Only per limite stato.
**Effort:** M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Compare supporta 5 tool e puo eccedere il modello decisionale richiesto" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P2] Audit runtime limitato dal gate di lancio

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
**Evidenza:** `app/(marketing)/layout.tsx:34-39` monta header/main/footer/nav mobile solo quando il gate e aperto; `app/(marketing)/page.tsx:34-37` ritorna `ComingSoonPage` se il gate non e aperto; `app/layout.tsx:84-99` governa gate, gamification shell e intro.
**Impatto:** QA e utenti senza cookie possono non vedere le superfici auditate.
**Fix consigliato:** Definire modalita audit/staging per aprire gate senza cambiare flussi produttivi.
**Classificazione Figma:** Code-Only.
**Effort:** S/M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Audit runtime limitato dal gate di lancio" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## Ipotesi da verificare con screenshot

- Possibili overlap o scroll trap su overlay search/menu a 320/375.
- Performance e first paint delle superfici 3D/home/radar.
- Contrasto effettivo di chip e badge sulle varianti cromatiche custom.
