# REPORT_AGENT_TRUST_CONVERSION

Focus: fiducia, conversione, affiliate, fonti, qualita editoriale.

## [P0] Disclosure affiliate non e agganciata in modo evidente al CTA finale

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
**Severita:** P0
**Priorita consigliata:** alta
**Effort stimato:** Usare Effort originale; se assente stimare S/M/L prima di aprire PR.
**Rischio regressione:** medio

---


**Sezione:** Affiliate / CTA
**Route:** `/posts/[slug]`, `/toools/[slug]`
**Viewport:** Mobile e desktop
**Evidenza:** `app/(marketing)/posts/[slug]/page.tsx:297` punta a `tool.affiliate_url ?? tool.website_url`; `:302` mostra "Vai al sito". `lib/types/tool.ts:52` conferma `affiliate_url`. Nel detail, `app/(marketing)/toools/[slug]/page.tsx:215` e `:358` rendono CTA tool.
**Impatto:** L'utente puo non capire quando TooolVibes monetizza il click.
**Fix consigliato:** Pattern CTA con disclosure: "Link partner/affiliato, potremmo ricevere una commissione senza costi extra".
**Classificazione Figma:** Figma-SoT per CTA disclosure; Code-Only per condizione affiliate.
**Effort:** M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Disclosure affiliate non e agganciata in modo evidente al CTA finale" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P1] Placement sponsor sono dichiarati, ma serve policy comune

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


**Sezione:** Native placement
**Route:** Catalogo, articoli, tool detail, collection
**Viewport:** Mobile e desktop
**Evidenza:** `lib/monetization/placements.ts:25` usa "Spazio partner"; `:40` "Partner editoriale"; `:70` "Sponsor selezionato"; `components/monetization/native-placement.tsx:72-76` mostra label e status.
**Impatto:** Buona base, ma i nomi variano e non dicono sempre cosa significa sponsorizzato/partner.
**Fix consigliato:** Un vocabolario unico: sponsor, partner editoriale, affiliate link, paid placement.
**Classificazione Figma:** Figma-SoT per monetization label system.
**Effort:** S/M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Placement sponsor sono dichiarati, ma serve policy comune" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P1] Fonte e data non bastano per dimostrare revisione editoriale

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


**Sezione:** Trust block
**Route:** `/toools/[slug]`, `/posts/[slug]`
**Viewport:** Mobile e desktop
**Evidenza:** `app/(marketing)/toools/[slug]/page.tsx:201` mostra data pubblicazione; `:229` mostra "Fonte TooolVibes"; `app/(marketing)/posts/[slug]/page.tsx:201-206` mostra fonte e data; `lib/types/article.ts:38-39` ha `source_label` e `source_url`.
**Impatto:** Mancano segnali come ultimo test, autore/reviewer, metodo e criterio di inclusione.
**Fix consigliato:** Trust panel con reviewed date, reviewer, source/citation, affiliate policy.
**Classificazione Figma:** Figma-SoT
**Effort:** L se serve data model


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Fonte e data non bastano per dimostrare revisione editoriale" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P2] CTA e fonte possono competere sul dettaglio tool

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


**Sezione:** Tool detail
**Route:** `/toools/[slug]`
**Viewport:** Mobile e desktop
**Evidenza:** `app/(marketing)/toools/[slug]/page.tsx:215` CTA tool; `:224-229` fonte; `:358-366` CTA/fonte ripetuti in area rapida.
**Impatto:** Senza microcopy trust, fonte e conversione possono sembrare ridondanti o poco gerarchiche.
**Fix consigliato:** Separare "prova/apri tool", "leggi fonte", "perche lo consigliamo".
**Classificazione Figma:** Figma-SoT per detail CTA cluster.
**Effort:** M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "CTA e fonte possono competere sul dettaglio tool" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## Trust positives

- I placement monetization hanno gia label commerciali dichiarate.
- Gli articoli hanno `source_label` e `source_url`.
- Il prodotto ha una base di editorial review (`tool.editorialReview`) da elevare a sistema di trust visibile.
