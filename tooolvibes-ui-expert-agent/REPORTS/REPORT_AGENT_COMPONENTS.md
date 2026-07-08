# REPORT_AGENT_COMPONENTS

Focus: componenti riusabili e rischi di sistema.

## [P1] Button primitive ha troppe varianti e size sotto target mobile

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


**Sezione:** Buttons
**Route:** Globale
**Viewport:** Mobile e desktop
**Evidenza:** `components/ui/button.tsx:12` definisce molte varianti (`default`, `primary`, `premium`, `glow`, `outline`, `secondary`, `subtle`, `ghost`, `destructive`, `link`); `components/ui/button.tsx:29-30` include `xs min-h-7` e `sm min-h-9`.
**Impatto:** Varianti visive non governate e target mobile piccoli.
**Fix consigliato:** Ridurre a primary, secondary, tertiary/ghost, destructive; riservare premium/glow a reference o hero.
**Classificazione Figma:** Figma-SoT
**Effort:** M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Button primitive ha troppe varianti e size sotto target mobile" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P1] Input/select primitive non garantiscono ergonomia touch

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


**Sezione:** Forms
**Route:** Search, filters, auth/account, admin UI
**Viewport:** 320/375/414
**Evidenza:** `components/ui/input.tsx:12`, `components/ui/input-group.tsx:17`, `components/ui/select.tsx:44` usano altezze base 32px/28px in alcune varianti.
**Impatto:** Gli schermi piu importanti per discovery mobile possono ereditare controlli piccoli.
**Fix consigliato:** Creare size `touch` default nel marketing shell; admin dense separato.
**Classificazione Figma:** Figma-SoT
**Effort:** M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Input/select primitive non garantiscono ergonomia touch" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P2] Badge primitive incompleta rispetto agli stati editoriali

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


**Sezione:** Badges/tags
**Route:** Tool cards, editorial, trust labels
**Viewport:** Mobile e desktop
**Evidenza:** `components/ui/badge.tsx:8-11` usa `h-5` e varianti generiche; non emergono stati semanticamente dedicati a success/warning/info/trust.
**Impatto:** Label come fonte, affiliate, verified, updated, beta rischiano styling custom.
**Fix consigliato:** Aggiungere semantic badge variants con contrasto controllato.
**Classificazione Figma:** Figma-SoT
**Effort:** S/M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Badge primitive incompleta rispetto agli stati editoriali" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## [P2] Dialog, Sheet e Drawer hanno pattern concorrenti

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
**Severita:** P2
**Priorita consigliata:** media
**Effort stimato:** Usare Effort originale; se assente stimare S/M/L prima di aprire PR.
**Rischio regressione:** basso

---


**Sezione:** Overlays
**Route:** Search, filters, menus, modals
**Viewport:** Mobile e desktop
**Evidenza:** `components/ui/dialog.tsx:54-56` centra dialog con max width; `components/ui/sheet.tsx:56` gestisce sheet side/bottom; `components/ui/drawer.tsx:60-65` usa drawer bottom con handle.
**Impatto:** Senza policy, mobile puo alternare modal centrata, side drawer e bottom drawer senza regola chiara.
**Fix consigliato:** Definire overlay matrix: mobile bottom drawer, desktop dialog/popover, nav full sheet.
**Classificazione Figma:** Figma-SoT
**Effort:** M


---

## ISTRUZIONI DI MODIFICA SICURA

### Obiettivo della modifica

Correggere il finding "Dialog, Sheet e Drawer hanno pattern concorrenti" con la modifica minima necessaria, mantenendo invariati dati, routing e contratti non direttamente coinvolti.

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

## Componenti da portare in Figma SoT

- Button, IconButton, CTA with disclosure.
- Input, Select, SearchField, FilterChip.
- Badge/TrustPill.
- ToolCard: default, compact, scan, saved, compared.
- CompareCell/CompareBoard.
- Header nav + mobile bottom nav.
- EmptyState, ErrorState, Loading/Skeleton.
