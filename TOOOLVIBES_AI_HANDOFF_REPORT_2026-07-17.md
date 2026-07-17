# TooolVibes — Report tecnico di handoff per continuità su altra AI

**Data snapshot:** 17 luglio 2026

**Repository:** `C:\Users\Mattia\Desktop\Tooolvibes-app\tooolvibes-app-main`

**Branch obbligatorio:** `main`

**Baseline pre-esecuzione:** `4899728` (`Polish dark theme styles across header and forms`)

**Ultimo commit pubblicato analizzato:** `8355a225a69e987676a1985691853affbf8daf81`

**Stato remoto al momento del report:** `main` e `origin/main` coincidono su `8355a22`

**Scopo:** permettere a un’altra AI di continuare il lavoro senza ricostruire la chat, senza confondere codice committato con lavoro locale incompleto e senza dichiarare prematuramente la release pronta.

Se questo report viene committato e pubblicato, `main` risulterà naturalmente un commit documentale più avanti. Il riferimento `8355a22` resta comunque l’endpoint dell’implementazione applicativa descritta; il commit successivo contiene soltanto questo handoff.

> Questo documento è un handoff tecnico, non una certificazione di produzione. Non sostituisce i tre documenti master e non autorizza a cancellarli finché il piano non è realmente completato.

## 1. Sintesi tecnica

Il lavoro è avanzato in modo sostanziale, ma **non è finito**. Dal primo commit release-oriented (`ee1ac86`) a `8355a22` sono stati pubblicati su `main` **26 commit**, con **357 file unici toccati**, **33.221 inserimenti** e **4.505 rimozioni**. Sono state consolidate soprattutto le fondamenta di runtime, CI, test E2E, sicurezza, schema dati, repository Tool, workspace guest/account, migrazione localStorage, feature flag fail-closed e primi contratti del design system.

La roadmap comprende 77 batch. Sullo snapshot attuale:

- **16 batch risultano completati**;
- **26 batch risultano parziali**;
- **35 batch risultano mancanti**.

Il lavoro locale attuale è il **BATCH 22 — Overlay e z-index contract**. Non è committato: ci sono 15 file tracked modificati e 2 file nuovi. La direzione implementata centralizza portal host e z-layer, delegando focus trap, `Escape`, inert e scroll lock a Base UI/Vaul. Questa scelta evita di duplicare motori già presenti, ma richiede ancora una decisione esplicita rispetto all’acceptance originale di B22 e una validazione completa.

La valutazione iniziale dell’audit era **38/100**. Non viene assegnato qui un nuovo punteggio: mancano un nuovo audit end-to-end, prove reali su staging, device/browser certification, restore/migration drill, release rehearsal e diverse feature/UX fondamentali. Qualsiasi nuovo score oggi sarebbe poco affidabile.

## 2. Stato esatto da cui ripartire

### 2.1 Codice già committato e pubblicato

```text
HEAD        8355a225a69e987676a1985691853affbf8daf81
origin/main 8355a225a69e987676a1985691853affbf8daf81
branch      main
```

La vecchia branch `codex/production-closure` è ferma a `1a93b17`, già antenato di `main`. Non contiene lavoro separato da integrare e non deve essere usata come prosecuzione.

### 2.2 Lavoro locale non committato

```text
 M app/globals.css
 M components/app/root-providers.tsx
 M components/directory/tool-discovery-app.tsx
 M components/layout/mobile-bottom-nav.tsx
 M components/layout/site-header-v2.tsx
 M components/ui/dialog.tsx
 M components/ui/drawer.tsx
 M components/ui/dropdown-menu.tsx
 M components/ui/popover.tsx
 M components/ui/select.tsx
 M components/ui/sheet.tsx
 M components/ui/sonner.tsx
 M components/ui/tooltip.tsx
 M styles/tokens.css
 M tests/design-system/token-contract.test.ts
?? __tests__/components/ui/overlay-primitives.test.tsx
?? components/ui/overlay-provider.tsx
```

Delta tracked corrente: **15 file, 140 inserimenti, 81 rimozioni**, oltre ai due file nuovi. Queste modifiche non fanno parte di `origin/main` e non devono essere presentate come completate.

### 2.3 Comandi di orientamento obbligatori per la prossima AI

Eseguire prima di qualunque modifica:

```powershell
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git diff --check
git diff -- app/globals.css components styles/tokens.css tests/design-system/token-contract.test.ts
```

Non usare `git reset --hard`, `git checkout --` o comandi equivalenti sul worktree B22 senza una decisione esplicita dell’utente.

## 3. Artefatti di audit originari

I tre documenti master sono nel root del repository:

1. `TOOOLVIBES_PRODUCTION_READINESS_AUDIT.md` — audit iniziale di prodotto, UI, UX, GUI, frontend, responsive, accessibilità, performance, sicurezza, dati, gamification e release. Snapshot iniziale: 15 luglio 2026; readiness indicata: 38/100.
2. `TOOOLVIBES_PRODUCTION_CLOSURE_PLAN.md` — traduce l’audit in fasi operative, priorità, root cause, acceptance criteria e test.
3. `TOOOLVIBES_EXECUTION_ROADMAP.md` — traduce il closure plan in 77 batch atomici pre-lancio, con dipendenze e vincoli di scope.

I file sono stati inizialmente prodotti fuori dal repository e aggiunti a Git nel commit `1a93b17`. Il roadmap ha poi ricevuto solo una modifica tipografica del titolo in `b6a0536`; non è stato mantenuto come registro automatico di avanzamento. La fonte attendibile per il lavoro svolto è quindi la combinazione di:

- cronologia Git;
- diff e test presenti nel repository;
- log di validazione registrati durante la chat;
- matrice B01–B77 ricostruita in questo documento.

**Non cancellare i tre file master.** L’istruzione precedente di cancellarli valeva solo dopo il completamento dell’intero piano; tale condizione non è stata raggiunta.

## 4. Metodo di lavoro e contributo degli agenti

### 4.1 Audit iniziale

L’audit iniziale è stato scomposto in stream specialistici indipendenti, come richiesto:

- Senior UI/UX Product Design: gerarchia, IA, navigation, flow, stati, CTA, onboarding, mobile/desktop;
- GUI/Visual System: tipografia, colori, spacing, radius, shadow, card, button, modali, percezione premium e stratigrafia visuale;
- Principal Frontend Architecture: route, component tree, stato, CSS, dipendenze, rendering, responsive, accessibilità tecnica e debito;
- Gamification & Engagement: score, shortlist, compare, Decision Memory, reward, progression e retention;
- stream complementari per mobile, accessibilità/interazione, performance e release QA.

Gli identificativi tecnici dei primi agenti non sono più disponibili nel contesto corrente; non vengono inventati. I loro risultati sono stati sintetizzati nei tre documenti master.

### 4.2 Implementazione e revisioni successive

Il coordinatore principale (`/root`) ha eseguito l’integrazione, le modifiche, i test disponibili, i commit e i push su `main`.

Revisioni indipendenti rilevanti:

- revisione workspace/state: ha trovato un P1 nel ramo “claim assente”, dove una release poteva cancellare una claim appena creata; il coordinatore ha corretto la race e la revisione finale ha approvato;
- revisione security: ha trovato un P1 nel logout fail-closed, che toccava storage guest fuori dal Web Lock; il coordinatore ha introdotto attivazione volatile senza storage e la revisione finale ha approvato;
- revisione release/readiness: ha ricostruito cronologia, mapping commit/batch e caveat Cloudflare;
- revisione B22: ha raccomandato di non creare un secondo motore globale per focus/Escape/scroll lock perché Base UI e Vaul già li gestiscono; il coordinatore ha quindi implementato un provider minimo per portal host e layer;
- un agente ha implementato la parte token/z-layer di B22 e i relativi test statici; il coordinatore ha completato il provider e il primo test comportamentale;
- un tentativo separato di progettare un registry overlay completo è stato interrotto prima di produrre file, per evitare sovrapposizioni e una soluzione eccessiva.

Le tre ricognizioni finali usate per questo handoff sono state read-only:

- `/root/b18_release_rereview`: commit, baseline, file, Cloudflare e caveat;
- `/root/b18_state_rereview`: matrice B01–B77;
- `/root/b18_security_rereview`: B22 locale, sicurezza, dati, workspace e limiti di validazione.

Tutti gli agenti condividevano lo stesso filesystem. Git registra l’autore del commit, non l’agente che ha modificato ogni singola riga; l’attribuzione sopra è quindi per responsabilità verificabile, non per line ownership.

## 5. Cronologia completa dei commit pubblicati

| # | Commit | Batch / area | Modifica e motivazione | Evidenza e limite |
|---:|---|---|---|---|
| 1 | `ee1ac86` | B01 Runtime | Pin Node 22.23.1 e npm 10.9.2 iniziale, `engine-strict`, preinstall checker. Serve a rendere riproducibile la toolchain. | 7 file; checker presente. Il pin npm esatto ha poi causato il problema Cloudflare. |
| 2 | `29f6f29` | B04, B45–B51 OFF | Registry fail-closed per 3D, audio e gamification; context e guard server/client. Serve a poter lanciare con feature incomplete realmente disattivate. | 31 file; test release e mutation guard. Non rende la gamification rewarded pronta. |
| 3 | `2261874` | B04 Audio | Kill switch audio globale propagato a provider, sound engine e superfici gamification. | 8 file; test runtime audio. |
| 4 | `7b09d5e` | B02 CI | Workflow quality con runtime, install, lint zero-warning, typecheck, unit, Next build, E2E e OpenNext. | 12 file; workflow e runbook. |
| 5 | `bb736ca` | B03 E2E | Playwright cross-browser deterministico, fixture, smoke core, visual matrix 320–1920 e 42 snapshot. | 51 file; harness presente. Gli snapshot non equivalgono a una certificazione device reale. |
| 6 | `871aa64` | B11 Gate | ID/SSR/hydration del gate, accessibilità del dialog, label e live feedback waitlist. | 4 file; test SSR dedicato. |
| 7 | `9d84f27` | B05/B06/B07 DB | Baseline migration, seed staging, manifest/checksum, backup/restore e repair runbook. | 20 file; prove statiche. Drills reali mancanti. |
| 8 | `b957ef6` | B07 Waitlist | Contract, normalizzazione, idempotenza e repository waitlist canonici; route API aggiornata. | 6 file; test route/repository. |
| 9 | `83630ed` | B12 Browser security | CSP report endpoint, HSTS/frame/referrer/permissions/origin policy in middleware e Next. | 7 file; test header/CSP. CSP completa ancora Report-Only. |
| 10 | `21b0f87` | B08 Dependencies | Next 15.5.20 e toolchain browser/Cloudflare patchata; E2E security e dependency audit. | 9 file; evidenza storica completa, staging pending. |
| 11 | `58418c8` | B13 Tool domain | `ToolPublic`, adapter, fixture e ADR canonici per separare contratto pubblico e tipo legacy. | 6 file; contract test adapter. |
| 12 | `cfbfabb` | B09 Distributed security | Durable Object per rate limit e revoche, binding Cloudflare, policy e fail-closed. | 19 file; suite unit/worker. Richiede deployment esterno corretto. |
| 13 | `3bf24f2` | B20 Design system | Token canonici, entry CSS unica, ownership checker e documentazione cascade. | 9 file; test token e `check:styles`. |
| 14 | `3d9338b` | B09 Hotfix | Logout admin fallisce chiuso se la revoca distribuita non riesce. | 1 file; usa suite logout esistente. |
| 15 | `8068d10` | B10 Public submissions | Contract/guard, honeypot, timestamp/origin/size/rate policy, RLS/RPC e form/repository/API aggiornati. | 30 file; unit, migration contract e integration test predisposti. |
| 16 | `711292d` | B16 Workspace contract | Workspace V1 canonico, reducer/adapter/constants e ADR. | 10 file; contract test. |
| 17 | `db72a3b` | B14 Public Tool repository | Repository/facade/context/source policy unici usati da catalogo, detail, API, sitemap, compare e shortlist. | 44 file; test repository/facade/API/sitemap. Adapter editoriale legacy ancora transitorio. |
| 18 | `2b7c64b` | B17 Local storage | Migrazione localStorage versionata, non distruttiva, idempotente, con backup/quarantena. | 6 file; migration test. |
| 19 | `1a93b17` | B15/B18/B19/B21 misti | Aggiunge i tre MD; cutover Tool/CMS; route e provider workspace; sync; migration SQL; Inter/Fraunces; ampio wiring UI/CSS. | 117 file. Commit storico non atomico: va letto per workstream, non come singolo batch chiuso. |
| 20 | `a895cb4` | Cloudflare runtime | Rilassa npm da esatto 10.9.2 a `>=10.9.2 <11`, mantenendo Node 22.23.1 e baseline package manager. | Corregge `EBADENGINE` con npm 10.9.8; test runtime dedicato. |
| 21 | `d44a6ae` | Cleanup | Rimuove helper workspace/storage morti, import stale e rende alcuni test deterministici. | 4 file, 99 righe rimosse. |
| 22 | `9b42403` | Cloudflare retry | Commit vuoto usato per ritentare il deploy dopo bootstrap esterno del security worker. | Nessuna modifica file e nessuna prova Git del deploy finale. |
| 23 | `b6a0536` | Docs | Modifica soltanto il livello del titolo del roadmap. | Nessun avanzamento funzionale. |
| 24 | `7bd0dc8` | B18 Legacy retirement | Endpoint `/api/discovery-*` ritirati con `410 Gone`; env/README puntano alle route canoniche. | Test route legacy. |
| 25 | `7f09ffb` | B18/B19 hardening | Guard API, owner storage, sync events, migration CAS, isolamento e test; elimina provider/remote workspace legacy. | 34 file; 2 eliminazioni; suite workspace estesa. |
| 26 | `8355a22` | B18/B19 races | Claim ledger generazionale, Web Locks fail-closed, quarantena/restore, attach/logout concorrenti, retry CAS, capacity e SQL hardening. | 20 file; reviewer finali senza P0/P1. Restano prove staging/DB reali. |

Totale dell’intervallo `ee1ac86^..8355a22`: **357 file, 33.221 inserimenti, 4.505 rimozioni**.

## 6. Cosa è stato costruito, per sistema

### 6.1 Runtime, CI e deploy

- Node fissato a `22.23.1` tramite `.node-version`, `.nvmrc`, package engines e checker preinstall.
- npm accettato nell’intervallo `>=10.9.2 <11`; `packageManager` resta `npm@10.9.2` come baseline riproducibile.
- `scripts/check-runtime.mjs` impedisce installazioni con runtime incompatibile.
- Workflow CI in `.github/workflows/quality.yml` e runbook `docs/runbooks/ci-quality-gates.md`.
- Script npm per style ownership, lint, typecheck, unit, build Next/OpenNext, E2E, DB baseline e cutover Tool.
- Config Cloudflare/OpenNext aggiornata; worker Durable Object separato in `workers/security-state`.

**Perché:** eliminare divergenze locale/CI/Cloudflare e rendere fail-fast la release.

**Cosa manca:** prova aggiornata dell’intera pipeline sull’esatto snapshot finale, deploy Cloudflare verificabile, secret/binding audit e rehearsal completo.

### 6.2 Release control e gamification fail-closed

- Registry centralizzato di feature release per gate, 3D, audio e gamification.
- Context client/server e guard sulle azioni reward.
- Default di lancio prudente: gamification rewarded OFF, audio/3D controllabili.
- Kill switch audio propagato alle superfici che prima potevano aggirarlo.

**Perché:** le feature incomplete non devono risultare visibili o mutare dati per errore.

**Cosa manca:** la modalità OFF non basta ancora a livello DB/RPC per tutte le reward; i batch B45–B52 non sono un sistema rewarded production-ready.

### 6.3 Test e osservabilità di qualità

- Unit/contract test estesi su runtime, security, waitlist, submissions, Tool domain, workspace e storage.
- Playwright su Chromium, Firefox e WebKit con fixture deterministiche.
- Visual matrix per Home, Archivio, Tool detail, Shortlist, Compare, Radar e Account a 320, 390, 768, 1024, 1440 e 1920 px.
- Security-boundary E2E e typography runtime test.

**Perché:** trasformare i problemi di regressione in contratti ripetibili.

**Cosa manca:** device reali, certificazione finale cross-browser, Lighthouse/bundle budget, error tracking e staging rehearsal.

### 6.4 Sicurezza frontend/backend di confine

- Security header, CSP reporting, origin policy e frame protection.
- Durable Object per rate limit e session revocation distribuiti, fail-closed in produzione.
- Logout admin fail-closed.
- Honeypot, timestamp, origin, size guard e rate policy per submission pubbliche.
- RLS/RPC e repository rafforzati per waitlist, richieste tool e affiliate requests.

**Perché:** i rate limit in memoria e i controlli soltanto client non sono affidabili su runtime distribuiti.

**Cosa manca:** deploy e drill multi-isolate del worker security, CSP enforcement completo, Turnstile/secrets audit, validazione DB reale e chiusura RPC gamification.

### 6.5 Database e dati pubblici Tool

- Migration history riconciliata, manifest/checksum e fixture staging.
- Runbook backup/restore e repair history.
- Contract pubblico `ToolPublic`, adapter di provenienza e ADR.
- Repository/facade/context unico per catalogo, detail, API, sitemap, compare e shortlist.
- Cutover inventory/verifier e contract CMS/revalidation.

**Perché:** prima esistevano più fonti e mapping indipendenti, con rischio di divergenza tra pagine e API.

**Cosa manca:** esecuzione vera di fresh DB/snapshot upgrade/schema diff/restore; cutover Supabase reale e rimozione finale dell’adapter editoriale legacy. Oggi la source production intenzionale resta il catalogo directory da 30 tool.

### 6.6 Workspace guest/account

- Workspace V1 canonico per saved/shortlist, compare, tool state, note/stage e decision metadata.
- Migrazione localStorage lossless, backup/quarantena e isolamento per owner.
- Route canoniche `/api/workspace-state`, `/api/workspace-account/attach`, `/api/workspace-account/release`.
- Endpoint legacy ritirati.
- Sync con compare-and-swap, Web Locks, claim ledger generazionale, multi-account coexistence, quarantena e recovery visibile.
- Race attach/logout/multi-tab e capacity schema rafforzati.

**Perché:** impedire perdita dati, contaminazione tra account e resurrezione dello stato guest dopo logout/claim concorrenti.

**Cosa manca:** staging DB reale, UX/copy account completa, screen reader verification, clock skew/device conflict e recovery operativo del backup remoto service-only.

### 6.7 Design system

- Entry CSS di release e ownership della cascade.
- Token foundation per colore, spacing, typography, shape e z-index.
- Inter/Fraunces come font canonici con contract test statici/runtime.
- Checker per impedire ownership CSS impropria.

**Perché:** la UI stratificata aveva più font, layer e regole locali non coordinati.

**Cosa manca:** B22 completo, primitive core B23, ToolCard unica B24, vertical slice B68 e sweep visuale/accessibilità finale.

## 7. Cloudflare: errori incontrati e correzioni

### 7.1 Errore npm `EBADENGINE`

Il builder Cloudflare rilevava Node `22.23.1` ma eseguiva npm `10.9.8`, mentre `package.json` richiedeva esattamente npm `10.9.2`. `npm clean-install` falliva prima del build.

Correzione in `a895cb4`:

- Node resta esatto `22.23.1`;
- npm diventa `>=10.9.2 <11`;
- checker, package/lock, README, runbook e test runtime vengono aggiornati;
- npm `10.9.8` è esplicitamente accettato.

Il log successivo ha confermato install, Next build e OpenNext build riusciti.

### 7.2 Errore Cloudflare `10143`

Il deploy successivo falliva perché il binding `SECURITY_STATE` puntava al Worker `tooolvibes-security-state`, che non esisteva ancora nell’account.

Ordine operativo previsto:

```powershell
npx wrangler deploy --config workers/security-state/wrangler.jsonc
```

Poi devono essere configurati il secret HMAC del security state, la rotazione del session secret e infine il deploy dell’app. I valori dei secret non sono riportati qui.

`9b42403` è soltanto un commit vuoto di retry. La successiva conferma dell’utente (“perfetto”) indica che il blocco operativo è stato probabilmente risolto, ma **nel repository non esiste un log finale firmato di deploy riuscito**. La prossima AI deve verificarlo in Cloudflare, non assumerlo.

### 7.3 Warning non bloccante noto

Il bundle OpenNext ha segnalato una duplicate key Base UI relativa a `popupElement`. Il build è terminato, ma il warning va ricontrollato su dipendenze correnti e non va confuso con il `10143`.

## 8. B22 locale: inventario file per file

| File | Cosa è stato cambiato | Perché | Stato / rischio |
|---|---|---|---|
| `styles/tokens.css` | Aggiunge `--tv-z-floating: 100` fra modal 90 e toast 110. | Definire una gerarchia semantica invece di `z-50` locali. | Static contract aggiornato; visual QA mancante. |
| `app/globals.css` | Alias legacy `--z-*` ai token `--tv-z-*`; header/FAB/nav migrati; header elevato quando overlay aperto. | Ridurre z-index arbitrari e collisioni. | Verificare stacking context e click interception. |
| `components/ui/overlay-provider.tsx` | **Nuovo** host portal condiviso stabile con context/hook. | Dare alle primitive un unico portal target senza duplicare il motore di focus. | Untracked; initial-open/fallback/unmount da testare. |
| `components/app/root-providers.tsx` | Inserisce `OverlayProvider` attorno agli overlay globali e al Toaster. | Rendere disponibile il portal host in tutta l’app. | Verificare SSR/hydration e ordine context. |
| `components/ui/dialog.tsx` | Portal condiviso; backdrop `overlay`, popup `modal`. | Unificare layering. | Test focus/Escape/custom container incompleto. |
| `components/ui/sheet.tsx` | Portal condiviso, layer canonici e safe-area bottom. | Uniformare modal sheet e home indicator. | Controllare tutti i consumer per doppio padding. |
| `components/ui/drawer.tsx` | Portal condiviso, layer canonici e safe-area bottom. | Uniformare Vaul al contratto globale. | Test drag, scroll lock, nesting e iOS mancanti. |
| `components/ui/popover.tsx` | Portal condiviso e layer `floating`. | Coerenza dei floating layer. | Test dentro dialog e overflow mancanti. |
| `components/ui/dropdown-menu.tsx` | Portal condiviso e layer `floating`. | Coerenza menu/modal. | Test menu dentro modal e custom container mancanti. |
| `components/ui/select.tsx` | Portal condiviso e layer `floating`. | Evitare select sotto backdrop/modal. | Test keyboard/positioning mancanti. |
| `components/ui/tooltip.tsx` | Portal condiviso e layer `floating`. | Contratto layer unico. | Verificare tooltip di background durante modal. |
| `components/ui/sonner.tsx` | Toaster portato a `--tv-z-toast`. | Toast sopra modal in modo canonico. | Verificare pointer/focus behavior. |
| `components/layout/mobile-bottom-nav.tsx` | `z-50` sostituito dal token nav. | Rimuovere hardcode. | Test con drawer/dialog/header/FAB. |
| `components/layout/site-header-v2.tsx` | Tokenizza search/menu backdrop e FAB; aggiunge `data-overlay-open`. | Coordinare header e overlay. | Verificare combinazioni simultanee e mobile. |
| `components/directory/tool-discovery-app.tsx` | Rimuove safe-area duplicata dal footer filtri. | La primitive Drawer ora possiede quel padding. | Controllare home indicator e doppio padding. |
| `tests/design-system/token-contract.test.ts` | Aggiorna scala e vieta `z-50` nelle primitive floating. | Rendere il contratto staticamente verificabile. | 8/8 test mirati verdi. |
| `__tests__/components/ui/overlay-primitives.test.tsx` | **Nuovo** test portal host, focus restore, nesting Base UI/Vaul ed Escape. | Verificare comportamento cross-library. | Untracked; secondo test bloccato da polyfill JSDOM mancante. |

### 8.1 Scelta architetturale corrente

Lo snapshot non implementa un `OverlayStackProvider` proprietario con registry globale, arbitraggio `Escape`, ref-count scroll lock e fallback focus. Base UI e Vaul continuano a possedere focus trap, inert, `Escape` e scroll lock; il nuovo provider possiede solo il portal target comune.

Questa è una scelta intenzionale basata sul riesame del codice: duplicare tali meccanismi avrebbe aumentato il rischio di double-lock, double-Escape e focus race. Tuttavia custom overlay, NoteSheet e modali game non sono automaticamente coordinati. B22 può essere chiuso con questo scope minimo solo se:

1. l’acceptance viene aggiornata esplicitamente;
2. i test dimostrano il comportamento nested cross-library;
3. i custom overlay restano assegnati a B61;
4. non emergono collisioni nella visual/device matrix.

### 8.2 Validazione B22 già eseguita

- `tests/design-system/token-contract.test.ts`: **8/8 pass**;
- primo test overlay (portal condiviso + focus restore): **pass**;
- secondo test nested Base UI Dialog + Vaul Drawer: non arriva all’assert comportamentale perché JSDOM non espone `window.matchMedia`;
- totale mirato: **9 pass, 1 fail di ambiente test**;
- `git diff --check`: nessun errore, solo warning LF→CRLF sui 15 file tracked;
- nessun lint/typecheck/build completo dopo il delta B22;
- nessuna QA visuale/device B22.

### 8.3 Prossimi passi obbligatori per B22

1. Aggiungere un polyfill `matchMedia` confinato al test/setup, non al codice prodotto.
2. Validare initial-open, provider assente, custom container e cleanup su unmount.
3. Validare nesting Dialog/Drawer/Sheet/Menu/Popover/Select/Tooltip/Toast.
4. Verificare `Escape` topmost, focus restore, inert e scroll lock su Chromium/Firefox/WebKit.
5. Verificare iPhone safe-area, drag drawer, tastiera, header/FAB/modal collision.
6. Eseguire lint, typecheck, unit completa, Next build e OpenNext build.
7. Solo dopo decidere commit atomico B22 oppure rollback selettivo.

## 9. Evidenze di test e limiti

### 9.1 Evidenza più completa registrata

Prima degli ultimi piccoli fix workspace è stato eseguito `npm run quality` con:

- 51 file test passati, 1 skipped;
- 348 test passati;
- 10 integration test skipped;
- style ownership, lint e typecheck verdi.

`npm run db:baseline:check` è risultato verde con 41 migration, fixture, checksum e manifest.

Dopo gli ultimi due fix race P1:

- test workspace mirati: **36/36 pass**;
- lint sui file toccati: pass;
- typecheck completo: pass.

OpenNext ha completato un build con 82/82 pagine, ma il processo era stato avviato prima dell’ultimissimo fix race. È quindi raccomandato un nuovo OpenNext build isolato sull’esatto `8355a22` prima di considerare B18 certificato.

### 9.2 Cosa non è stato verificato realmente

- migration applicate sul database production/staging reale;
- fresh reset, upgrade da due snapshot legacy, schema diff e restore drill firmato;
- i 10 test RLS integration, che restano skipped senza ambiente DB;
- deploy Cloudflare finale con Durable Object e secret/binding corretti;
- workspace sync canonico in staging; deve restare local-only finché i test DB non passano;
- Safari/iOS/Android device reali;
- screen reader, high contrast, zoom e matrice accessibilità completa;
- Lighthouse/Core Web Vitals e bundle budgets;
- legal/privacy/consent approval;
- analytics, error tracking, SLI e alert;
- release rehearsal/rollback/go-no-go.

## 10. Matrice completa B01–B77

Legenda:

- **Completato:** implementazione e contratti repository presenti;
- **Parziale:** implementazione presente, ma acceptance o evidenza ancora aperta;
- **Mancante:** target del batch non realizzato.

| Batch | Stato | Evidenza o gap principale |
|---|---|---|
| B01 | Completato | Runtime Node/npm, engine check, lockfile e Cloudflare install allineati. |
| B02 | Completato | Workflow quality con lint zero-warning, typecheck, unit, Next/OpenNext, E2E e artifact. |
| B03 | Completato | Harness Playwright, smoke cross-browser, console collector e visual matrix 320–1920. |
| B04 | Completato | Registry tipizzato, modalità OFF/LOCAL/REWARDED, kill switch 3D/audio e config fail-closed. |
| B05 | Parziale | Runbook, fixture e checksum esistono; restore drill reale non eseguito e template evidenze vuoto. |
| B06 | Parziale | Collisione `0023` riparata e preflight statico presente; mancano fresh DB, due upgrade legacy, schema diff e firme. |
| B07 | Completato | Migration/API/repository waitlist, idempotenza, validazione e contract RLS presenti. |
| B08 | Completato | Next 15.5.20/toolchain patchati, audit documentato e build/smoke registrati. |
| B09 | Parziale | Durable Object, binding e fail-closed implementati; manca drill staging multi-isolate, revoca, expiry e failure-store. |
| B10 | Completato | Endpoint pubblici e grant/RPC rafforzati con test anon/auth/forged input. |
| B11 | Completato | Gate/waitlist stabilizzati per SSR, ID, dialog, focus e feedback. |
| B12 | Completato | Header browser, CSP reporting e origin policy con test dedicati. |
| B13 | Completato | `ToolPublic`, adapter, provenance e ADR canonici. |
| B14 | Completato | Catalogo, detail, API, sitemap, compare e shortlist passano dal repository pubblico unico. |
| B15 | Parziale | Contract locali CMS completi; cutover Supabase reale, cache rehearsal, bootstrap editoriale e rimozione adapter legacy aperti. |
| B16 | Completato | Workspace V1 unico con shortlist, compare, metadati e decision contract. |
| B17 | Completato | Migrazione legacy non distruttiva, backup/quarantena, corruption/quota e idempotenza testati. |
| B18 | Completato | Sync canonico, isolamento owner, guest claim, conflitti e race multi-tab coperti dagli ultimi fix e test. |
| B19 | Parziale | Messaggi attach/recovery veritieri presenti; mancano copy centralizzata, matrix UX completa e screen reader. |
| B20 | Completato | Cascade ownership, entrypoint, token canonici ed enforcement automatico presenti. |
| B21 | Completato | Inter/Fraunces, scala minima, alias legacy e contract/runtime test presenti. |
| B22 | Parziale | Delta locale con provider, token, primitive e test iniziali; serve validazione integrata completa. |
| B23 | Parziale | Button/Badge/Card e showcase esistono; manca Chip canonico e matrix automatica states/axe. |
| B24 | Mancante | ToolCard, DirectoryToolCard e card inline mobile restano indipendenti. |
| B25 | Mancante | `mobile-catalog-view.tsx` resta un controller monolitico di circa 734 righe. |
| B26 | Mancante | `interaction-sound-layer-v2.tsx` resta monolitico, circa 1.770 righe, senza lifecycle test dedicati. |
| B27 | Mancante | `account-panel.tsx` resta monolitico, circa 948 righe. |
| B28 | Mancante | Admin Collections resta una pagina di circa 1.149 righe senza decomposition. |
| B29 | Mancante | Header, footer, bottom nav e header legacy mantengono registry separati. |
| B30 | Parziale | Bottom nav usa workspace canonico per Compare; header/account CTA non sono davvero account-aware. |
| B31 | Mancante | Più implementazioni Fuse; command palette, header e URL non condividono indice/query. |
| B32 | Mancante | NoteSheet mobile read-only; stage/note/reopen non sono completabili dalla Shortlist. |
| B33 | Mancante | Score Compare usa livello, featured, offset/hash e ordine input; provenance deterministica assente. |
| B34 | Mancante | API objective presente ma invocata con `null`; selector/persistenza/parity assenti. |
| B35 | Mancante | Decision contract nei dati, ma Compare non offre scegli/annota/undo verso Shortlist. |
| B36 | Mancante | Radar conserva placeholder, hash e fallback non certificati; source/freshness non chiusi. |
| B37 | Parziale | Bottom nav, badge e FAB esistono; mancano geometria safe-area unica e certificazione 320–430. |
| B38 | Mancante | Sponsor ancora prima del catalogo utile; policy densità/priorità mobile assente. |
| B39 | Parziale | `dvh` e safe-area usati localmente; manca policy tastiera/scroll-to-input e QA iOS/Android. |
| B40 | Parziale | Home mobile migliorata; time-to-value non certificato. |
| B41 | Mancante | `/archivio` monta ancora `MobileCatalogView` anche desktop. |
| B42 | Mancante | `/shortlist` monta soltanto `MobileShortlistBoard`; workspace desktop target assente. |
| B43 | Mancante | Compare monta contemporaneamente tree mobile e desktop nascosti via CSS. |
| B44 | Mancante | Radar monta entrambe le view e produce query separate. |
| B45 | Parziale | Default OFF e guard server-action presenti; RPC claim dirette restano eseguibili da authenticated. |
| B46 | Mancante | Nessun lifecycle missioni completo per OFF/LOCAL/REWARDED, reset e claim idempotente. |
| B47 | Mancante | Hidden Signal si fida ancora di candidate/expected slug derivati dal client. |
| B48 | Mancante | Arena usa segnali hash; evento verificabile, quota, idempotenza e cooldown assenti. |
| B49 | Mancante | Prediction non usa snapshot rank reale/versionato; resolver hash presente. |
| B50 | Parziale | Config vieta LOCAL e default OFF; mancano ledger projection, privacy/tie/refresh e certificazione. |
| B51 | Mancante | Copy promette salvataggio Vibe Rush senza pending run firmata, expiry o attach idempotente. |
| B52 | Mancante | FAB Vibe Rush resta globale quando rewarded; placement dedicato/opt-in assente. |
| B53 | Mancante | Error boundary target/global-error e test SSR/client/reset non implementati. |
| B54 | Parziale | Catalogo ha loading/empty/success; mancano error/offline/partial e visual state matrix. |
| B55 | Parziale | Tool detail ha loading/404/success; mancano source error/offline/partial/retry. |
| B56 | Parziale | Shortlist ha empty/success e alcuni messaggi sync; mancano router loading/offline/conflict. |
| B57 | Parziale | Compare gestisce precondizioni basilari; mancano invalid set/missing tool/engine error/offline. |
| B58 | Parziale | Radar mobile distingue alcuni stati; stale/fallback honesty e parity desktop aperti. |
| B59 | Parziale | Account espone auth/attach outcome; manca architettura pending/expired/401/429/500/offline. |
| B60 | Parziale | Corruption/quota/multi-tab molto coperti; clock skew/device conflict e comunicazione irrisolvibile mancanti. |
| B61 | Mancante | NoteSheet e modali game custom; manca coordinamento unico toast/confetti/audio/live region. |
| B62 | Parziale | Gate, type floor e vari fix semantici presenti; manca sweep AA/44px/axe/zoom/high-contrast. |
| B63 | Parziale | Reduced-motion e flag audio presenti; mancano preferenza canonica, offscreen pause e Canvas policy. |
| B64 | Parziale | Flag 3D nasconde scene; global layer, capability route e bundle isolation non chiusi. |
| B65 | Mancante | Nessun intervento/test dedicato su resize cleanup e costo per frame Account background. |
| B66 | Mancante | Restano nove suppressioni `TODO(B66)` per immagini raw; pipeline core non migrata. |
| B67 | Mancante | Nessun Lighthouse/bundle budget CI o baseline LCP/CLS/INP. |
| B68 | Mancante | Catalogo non è ancora vertical slice canonica di token, primitive, ToolCard e state matrix. |
| B69 | Mancante | Copy “winner/verdetto/vince” non supportata ancora presente in Compare. |
| B70 | Parziale | Gate flag, robots e sitemap esistono; manca certificazione public/prelaunch/callback/crawler. |
| B71 | Parziale | Metadata/canonical parziali; asset OG/Twitter reali e copertura Tool/Collection/Post incompleti. |
| B72 | Parziale | Privacy/Cookie/Termini esistono; data inventory, consent/withdrawal/versioning e approvazione legale mancanti. |
| B73 | Mancante | Nessun adapter analytics, event schema o funnel discovery→decision. |
| B74 | Mancante | Mancano error tracking, source map, release tag, redaction, SLI e alert. |
| B75 | Mancante | Smoke/security E2E presenti, ma certificazione finale e manifest gamification assenti. |
| B76 | Mancante | Screenshot automatizzati presenti; report device reali e matrice firmata assenti. |
| B77 | Mancante | Nessun rehearsal staging completo, rollback provato o firma GO/NO-GO. |

## 11. Cosa manca, ordinato per release

### 11.1 Blocker pre-lancio

1. **Stabilizzare il worktree B22.** Completare e validare oppure revertire selettivamente; non proseguire accumulando altri batch sopra un delta non certificato.
2. **Provare il database reale.** Fresh DB, due upgrade legacy, schema diff, backup/restore e RLS integration devono avere evidenza firmata.
3. **Verificare Cloudflare security state.** Worker Durable Object, migration `v1`, binding, secret e fail-closed devono essere provati su staging multi-isolate.
4. **Chiudere il confine reward a livello DB/RPC.** La modalità OFF applicativa non impedisce ancora tutte le claim dirette.
5. **Introdurre error boundary corrette.** B53 è assente e un errore client/SSR non ha una recovery production-grade.
6. **Eseguire certificazione finale B75–B77.** E2E, device/browser, staging rehearsal, rollback e GO/NO-GO sono mancanti.
7. **Confermare legal/privacy/consent.** I testi esistono, ma data inventory, consenso/versioning e approvazione legale sono aperti.

### 11.2 Necessario pre-lancio

1. Chiudere B23–B24 e usare primitive/card canoniche almeno nella vertical slice catalogo.
2. Decomporre i controller più rischiosi B25–B28 prima di ulteriori modifiche massive alle rispettive aree.
3. Unificare navigation/search B29–B31.
4. Chiudere il loop Shortlist → Compare → Decision Memory B32–B35 o ridurre esplicitamente lo scope pubblico senza promesse incomplete.
5. Certificare integrità e copy Radar B36.
6. Risolvere i doppi tree mobile/desktop B41–B44 e completare mobile QA B37–B40.
7. Completare state matrix B54–B60.
8. Eseguire accessibilità B61–B64.
9. Introdurre performance baseline/budget B65–B67.
10. Chiudere crawler/metadata/social preview B70–B71.
11. Aggiungere analytics minimo e error tracking B73–B74 prima del traffico pubblico.

### 11.3 Polish pre-lancio

- B68 vertical slice finale del catalogo;
- B69 microcopy e gerarchia visuale;
- normalizzazione delle microinterazioni non bloccanti;
- rifinitura degli empty/loading/error states dopo i contract funzionali;
- visual regression finale dopo la stabilizzazione, non prima.

### 11.4 Può aspettare il post-lancio

- modalità gamification REWARDED completa, se il lancio resta rigorosamente OFF e le RPC sono bloccate;
- leaderboard, Arena, Hidden Signal e prediction reali;
- sperimentazioni reward/retention e social loop;
- ulteriori scene 3D, effetti premium o animazioni non essenziali;
- migrazioni visuali estese delle aree admin non coinvolte nel lancio pubblico;
- ottimizzazioni sofisticate dopo aver introdotto baseline e budget misurabili.

## 12. Rischi principali

| Rischio | Gravità | Perché | Mitigazione |
|---|---|---|---|
| Confondere B22 locale con lavoro pubblicato | Alta | Due file sono untracked e nessun full gate è verde. | Commit atomico solo dopo acceptance e test; altrimenti rollback selettivo. |
| Perdita/corruzione dati in migration reale | Critica | Contratti statici non provano upgrade/restore reale. | Fresh/snapshot/restore drill firmato prima di canonical sync. |
| Fail-closed che blocca utenti legittimi | Alta | Binding/secret security mancanti disabilitano login/gate/magic link. | Staging multi-isolate e runbook operativo. |
| Claim reward dirette | Alta | Guard app non equivale a deny DB/RPC. | Revoke/grant/ledger DB prima del pubblico. |
| UI ancora stratificata | Alta | Primitive/card/navigation/search e mobile/desktop non sono unificate. | Sequenza B22→B31, poi route/flow. |
| Flow decisione incompleto | Alta | Shortlist, Compare e Decision Memory non chiudono il loop. | B32–B35 o scope reduction esplicita. |
| Doppio rendering responsive | Media/Alta | Compare/Radar montano tree multipli; Archivio/Shortlist non hanno desktop target. | B41–B44 con render esclusivo. |
| Assenza error/performance telemetry | Alta | Problemi reali non sarebbero rilevati né diagnosticati. | B67, B73, B74 prima del lancio. |
| Legal/consent incompleti | Alta | Presenza di pagine non equivale a compliance. | Data inventory e approvazione legale. |
| Documenti master scambiati per stato reale | Media | Roadmap non è stata aggiornata batch per batch. | Usare questa matrice + Git come verità operativa. |

## 13. Ordine di esecuzione raccomandato

```text
B22 decisione e chiusura
  → full quality + Next/OpenNext
  → B05/B06/B09 prove staging/DB/security
  → B15 decisione source Tool e cutover
  → B23–B24 primitive/card
  → B25–B31 decomposizione + navigation/search
  → B32–B36 core decision loop e Radar integrity
  → B37–B44 mobile/desktop responsive
  → B45 fail-closed DB; B46–B52 solo se in scope rewarded
  → B53–B60 error/state/edge cases
  → B61–B64 accessibilità/interazioni
  → B65–B67 performance
  → B68–B72 finalizzazione visual/release surface/legal
  → B73–B74 analytics/monitoring
  → B75–B77 certificazione e GO/NO-GO
```

B05/B06/B09 possono essere preparati in parallelo al lavoro UI, ma devono essere eseguiti in ambienti staging controllati. B45 DB/RPC può essere chiuso in parallelo ai batch UX purché non vengano abilitate feature rewarded.

## 14. Comandi di verifica consigliati

### 14.1 Dopo la chiusura B22

```powershell
npx vitest run tests/design-system/token-contract.test.ts __tests__/components/ui/overlay-primitives.test.tsx
npm run check:styles
npm run lint:ci
npm run typecheck
npm run test:unit
npm run build
npm run build:cloudflare
```

### 14.2 Baseline database statica

```powershell
npm run db:baseline:check
npm run tools:cutover:verify
```

Questi comandi non sostituiscono fresh DB, snapshot upgrade, schema diff, restore e RLS integration su staging.

### 14.3 E2E

```powershell
npm run test:e2e:smoke
npm run test:e2e:visual
```

Non aggiornare gli snapshot automaticamente per “far passare” una regressione. Prima va compreso il delta visuale.

## 15. Manifest delle modifiche e fonte autoritativa

Il manifest esatto di tutti i 357 path committati è riproducibile senza ambiguità con:

```powershell
git diff --name-status ee1ac86^..8355a22
git log --reverse --name-status ee1ac86^..8355a22
```

Questi comandi sono la fonte autoritativa per ogni file e commit. La sintesi seguente raggruppa il manifest senza nascondere categorie.

### 15.1 File aggiunti principali

- Root/config: `.env.production`, `.github/workflows/quality.yml`, i tre MD master, `playwright.config.ts`.
- Release/runtime: `scripts/check-runtime.mjs`, relativa declaration e tutti gli script `scripts/release/*` per manifest DB, migration history, seed, style ownership, checksum e Tool cutover.
- Documentazione: ADR `0001`–`0004`, design system typography/cascade, runbook CI/DB/security/workspace/cutover e dependency audit.
- Security: CSP report route, `lib/security/*`, public submission guard/contract, protection fields, worker `workers/security-state/*`.
- Data Tool: `lib/types/tool-public.ts`, adapter/repository/view/runtime/context, fixture e test.
- Waitlist: contract e repository canonici con test.
- Workspace: route account/state, provider canonicale, contract/constants/events/adapters/owner/storage/sync/client/API guard e test.
- Supabase: config, staging fixture, migration riconciliazione/waitlist/submission/workspace/hardening e manifest history.
- Design system: `styles/release-entry.ts`, `styles/tokens.css`, token/typography contract test.
- E2E: core routes, security boundaries, typography runtime, visual matrix, fixture/setup e 42 snapshot PNG.
- Test: nuove suite sotto `__tests__/app`, `__tests__/components`, `__tests__/integration`, `__tests__/lib`, `__tests__/scripts` e `__tests__/workers` per tutti i contratti sopra.

### 15.2 File eliminati o rinominati

- Eliminato `components/discovery/discovery-persistence-provider.tsx`: sostituito dal provider canonicale.
- Eliminato `lib/discovery/remote-workspace.ts`: sostituito dal trasporto/repository canonicale.
- Rinominato `supabase/migrations/0023_expand_tool_requests_for_founder_flows.sql` in `supabase/migrations/20260705000000_expand_tool_requests_for_founder_flows.sql`: elimina l’identificatore migration ambiguo e allinea la history timestamped.

### 15.3 Aree modificate

- Root/toolchain: `.env.example`, `.gitignore`, `.node-version`, `.npmrc`, `.nvmrc`, `README.md`, `package.json`, `package-lock.json`, `eslint.config.mjs`, `vitest.config.ts`, `next.config.ts`, `middleware.ts`, `wrangler.jsonc`.
- Route admin: dashboard, login, affiliate link, articles, collections, monetization, suggestions, tools e action helpers.
- Route marketing: Home, Archivio, Collections, Community, Compare, Posts, Radar, Shop, Shortlist, Tags, Tool detail, Affiliati e layout.
- API: admin login/logout, affiliate/tool requests, auth magic-link, gate, tools, waitlist, discovery legacy e workspace canonicale.
- Componenti: 3D, About, Account, Admin, Affiliates, App shell/orbital/command palette, Collections, Coming Soon, Desktop, Directory, Editorial, Gamification, Home, Layout, Product Hunt, Radar, Tools, UI e Wishlist.
- Library: admin session/rate, config release/audio/sound, data Tool/articles/collections, discovery/workspace, gamification actions/hooks/sound, security, stores, Supabase repositories, types, waitlist e wishlist.
- CSS: `app/globals.css`, account, compare, depth scene, Figma layers, gamification, radar, tokens, 3D Maestoso.

### 15.4 Nota sul grande commit `1a93b17`

Questo commit miscela 117 file e più batch. Contiene contemporaneamente:

- aggiunta dei tre MD;
- cutover Tool/CMS;
- workspace remote sync;
- migration SQL;
- typography;
- modifiche diffuse UI/CSS.

La prossima AI non deve usarlo come modello di atomicità. I batch successivi devono mantenere scope ristretto, testabile e reversibile.

### 15.5 Manifest cumulativo completo dei path committati

Legenda: `A` aggiunto, `M` modificato, `D` eliminato, `R100` rinominato senza variazione di contenuto. Questo blocco è l'output di `git diff --name-status ee1ac86^..8355a22`.

```text
M	.env.example
A	.env.production
A	.github/workflows/quality.yml
M	.gitignore
M	.node-version
M	.npmrc
M	.nvmrc
M	README.md
A	TOOOLVIBES_EXECUTION_ROADMAP.md
A	TOOOLVIBES_PRODUCTION_CLOSURE_PLAN.md
A	TOOOLVIBES_PRODUCTION_READINESS_AUDIT.md
A	__tests__/app/admin-tool-revalidation.test.ts
A	__tests__/app/api/admin/login/route.test.ts
A	__tests__/app/api/admin/logout/route.test.ts
A	__tests__/app/api/affiliate-requests/route.test.ts
A	__tests__/app/api/legacy-workspace-routes.test.ts
A	__tests__/app/api/security-rate-limits.test.ts
A	__tests__/app/api/security/csp-report.test.ts
A	__tests__/app/api/tool-requests/route.test.ts
A	__tests__/app/api/tools/route.test.ts
A	__tests__/app/api/waitlist/route.test.ts
A	__tests__/app/api/workspace-sync-routes.test.ts
A	__tests__/app/sitemap-route.test.ts
A	__tests__/components/account/account-provider.integration.test.tsx
A	__tests__/components/coming-soon-ssr.test.tsx
A	__tests__/fixtures/public-tool-cutover-certified.json
A	__tests__/fixtures/tool-public.ts
A	__tests__/integration/public-submission-rls.test.ts
A	__tests__/integration/tool-cms-publication-contract.test.ts
A	__tests__/lib/admin/session-token.test.ts
A	__tests__/lib/config/audio-runtime.test.ts
A	__tests__/lib/config/release-features.test.ts
A	__tests__/lib/data/legacy-editorial-tool-repository.test.ts
A	__tests__/lib/data/public-tools-facade.test.ts
A	__tests__/lib/data/tool-public-adapters.test.ts
A	__tests__/lib/data/tool-public-repository.test.ts
A	__tests__/lib/discovery/canonical-remote-workspace-contract.test.ts
A	__tests__/lib/discovery/workspace-account-isolation.test.ts
A	__tests__/lib/discovery/workspace-api-guard.test.ts
A	__tests__/lib/discovery/workspace-contract.test.ts
A	__tests__/lib/discovery/workspace-owner-storage.test.ts
A	__tests__/lib/discovery/workspace-storage-migration.test.ts
A	__tests__/lib/discovery/workspace-sync-client.test.ts
A	__tests__/lib/discovery/workspace-sync-storage.test.ts
A	__tests__/lib/discovery/workspace-sync.test.ts
A	__tests__/lib/gamification/actions-release-guard.test.ts
A	__tests__/lib/public-submissions/contracts.test.ts
A	__tests__/lib/public-submissions/guard.test.ts
A	__tests__/lib/security/browser-headers.test.ts
A	__tests__/lib/security/distributed-state.test.ts
A	__tests__/lib/security/public-submission.test.ts
A	__tests__/lib/stores/tool-workspace-sync-events.test.ts
A	__tests__/lib/supabase/public-submission-migration-contract.test.ts
A	__tests__/lib/supabase/public-submission-repositories.test.ts
A	__tests__/lib/supabase/waitlist-migration-contract.test.ts
A	__tests__/lib/supabase/waitlist-repository.test.ts
A	__tests__/lib/supabase/workspace-sync-migration-contract.test.ts
A	__tests__/scripts/public-tool-cutover-evidence.test.ts
A	__tests__/scripts/runtime-contract.test.ts
A	__tests__/workers/security-state.test.ts
M	app/(admin)/admin/(protected)/affiliate-links/[id]/edit/page.tsx
M	app/(admin)/admin/(protected)/affiliate-links/new/page.tsx
M	app/(admin)/admin/(protected)/articles/page.tsx
M	app/(admin)/admin/(protected)/collections/[id]/page.tsx
M	app/(admin)/admin/(protected)/collections/new/page.tsx
M	app/(admin)/admin/(protected)/collections/page.tsx
M	app/(admin)/admin/(protected)/collections/review/page.tsx
M	app/(admin)/admin/(protected)/monetization/page.tsx
M	app/(admin)/admin/(protected)/page.tsx
M	app/(admin)/admin/(protected)/suggestions/page.tsx
M	app/(admin)/admin/(protected)/tools/page.tsx
M	app/(admin)/admin/actions/_helpers.ts
M	app/(admin)/admin/login/page.tsx
M	app/(marketing)/affiliati/page.tsx
M	app/(marketing)/archivio/page.tsx
M	app/(marketing)/collections/[slug]/page.tsx
M	app/(marketing)/community/page.tsx
M	app/(marketing)/compare/page.tsx
M	app/(marketing)/layout.tsx
M	app/(marketing)/page.tsx
M	app/(marketing)/posts/[slug]/page.tsx
M	app/(marketing)/posts/page.tsx
M	app/(marketing)/radar/page.tsx
M	app/(marketing)/shop/page.tsx
M	app/(marketing)/shortlist/page.tsx
M	app/(marketing)/tags/page.tsx
M	app/(marketing)/toools/[slug]/page.tsx
M	app/api/admin/login/route.ts
M	app/api/admin/logout/route.ts
M	app/api/affiliate-requests/route.ts
M	app/api/auth/magic-link/route.ts
M	app/api/discovery-account/attach/route.ts
M	app/api/discovery-account/release/route.ts
M	app/api/discovery-state/route.ts
M	app/api/gate/route.ts
A	app/api/security/csp-report/route.ts
M	app/api/tool-requests/route.ts
M	app/api/tools/route.ts
M	app/api/waitlist/route.ts
A	app/api/workspace-account/attach/route.ts
A	app/api/workspace-account/release/route.ts
A	app/api/workspace-state/route.ts
M	app/globals.css
M	app/layout.tsx
M	app/sitemap.xml/route.ts
M	components/3d-maestoso/arena-fighter.tsx
M	components/3d-maestoso/home-3d-hero.tsx
M	components/3d-maestoso/radar-scene-3d.tsx
M	components/about/about-page.tsx
M	components/account/account-panel.tsx
M	components/account/account-provider.tsx
M	components/account/auth-page.tsx
M	components/admin/article-form.tsx
M	components/admin/article-markdown-editor.tsx
M	components/admin/collection-form.tsx
M	components/admin/collection-sync-preview-panel.tsx
M	components/admin/collection-transition-card.tsx
M	components/admin/founder-control-center-v2.tsx
M	components/admin/founder-control-center.tsx
M	components/admin/tool-form.tsx
M	components/affiliates/affiliate-application-form.tsx
M	components/app/global-command-palette.tsx
M	components/app/orbital-system/orbital-core-node.tsx
M	components/app/orbital-system/orbital-shapes.tsx
M	components/app/orbital-system/orbiting-badge.tsx
M	components/app/orbital-system/tool-preview-popover.tsx
M	components/app/root-providers.tsx
M	components/collections/advanced-special-issue.tsx
M	components/collections/collection-card.tsx
M	components/collections/collection-slot-card.tsx
M	components/coming-soon/gate-modal.tsx
M	components/coming-soon/waitlist-form.tsx
M	components/desktop/desktop-vibe-radar.tsx
M	components/desktop/desktop-vibe-wishlist.tsx
M	components/directory/archive-flow-panel.tsx
M	components/directory/directory-hero.tsx
M	components/directory/directory-tool-card.tsx
M	components/directory/directory-tool-glyph.tsx
M	components/directory/directory-weekly-spotlight.tsx
M	components/directory/floating-catalog-view.tsx
M	components/directory/home-catalog-preview.tsx
M	components/directory/home-experience-sections.tsx
M	components/directory/home-live-layer.tsx
M	components/directory/mobile-catalog-view.tsx
M	components/directory/tool-discovery-app.tsx
A	components/discovery/canonical-discovery-persistence-provider.tsx
D	components/discovery/discovery-persistence-provider.tsx
M	components/editorial/editorial-post-card.tsx
M	components/gamification/arena-battle-stage.tsx
M	components/gamification/arena-game-missions.tsx
M	components/gamification/badge-unlock-modal.tsx
M	components/gamification/game-mission-panel.tsx
M	components/gamification/gamification-shell.tsx
M	components/gamification/leaderboard-strip.tsx
M	components/gamification/radar-console.tsx
M	components/gamification/radar-game-missions.tsx
M	components/gamification/vibe-tap-mini-game.tsx
M	components/home/floating-section-anchor.tsx
M	components/home/hero-section.tsx
M	components/home/mobile-spotlight.tsx
M	components/home/vibe-home-v2.tsx
M	components/layout/brand-logo.tsx
M	components/layout/mobile-bottom-nav.tsx
M	components/layout/site-footer.tsx
M	components/layout/site-header-v2.tsx
M	components/layout/site-header.tsx
M	components/product-hunt/product-hunt-rankings.tsx
M	components/radar/mobile-radar-canvas.tsx
M	components/radar/mobile-radar-view.tsx
A	components/security/submission-protection-fields.tsx
M	components/tools/compare-board.tsx
M	components/tools/compare-toggle.tsx
M	components/tools/compare-trend-list.tsx
M	components/tools/desktop-compare-view.tsx
M	components/tools/editorial-scorecard.tsx
M	components/tools/mobile-compare-view.tsx
M	components/tools/mobile-shortlist-board.tsx
M	components/tools/shortlist-board.tsx
M	components/tools/shortlist-link.tsx
M	components/tools/shortlist-stage-toggle.tsx
M	components/tools/shortlist-toggle.tsx
M	components/tools/tag-pill.tsx
M	components/tools/tool-battle-shared.ts
M	components/tools/tool-battle-view.tsx
M	components/tools/tool-card.tsx
M	components/tools/tool-workspace-panel.tsx
M	components/tools/unified-compare-board.tsx
M	components/ui/avatar.tsx
M	components/ui/command.tsx
M	components/ui/input.tsx
M	components/ui/premium-section.tsx
M	components/wishlist/request-tool-form.tsx
A	docs/adr/0001-tool-public-domain-contract.md
A	docs/adr/0002-workspace-state-v1.md
A	docs/adr/0003-public-tool-repository-source-policy.md
A	docs/adr/0004-workspace-local-storage-migration.md
A	docs/design-system/cascade-and-token-foundation.md
A	docs/design-system/typography.md
A	docs/runbooks/ci-quality-gates.md
A	docs/runbooks/database-backup-restore.md
A	docs/runbooks/database-drill.env.example
A	docs/runbooks/database-restore-evidence-template.md
A	docs/runbooks/distributed-security-state.md
A	docs/runbooks/local-workspace-recovery.md
A	docs/runbooks/migration-history-repair.md
A	docs/runbooks/public-tool-cutover-evidence.template.json
A	docs/runbooks/public-tool-source-cutover.md
A	docs/security/dependency-audit.md
M	eslint.config.mjs
M	lib/admin/login-attempts.ts
M	lib/admin/session-token.ts
A	lib/config/audio-runtime.ts
A	lib/config/release-context.tsx
A	lib/config/release-features.ts
M	lib/config/sound.ts
A	lib/data/legacy-editorial-tool-repository.ts
M	lib/data/public-articles.ts
M	lib/data/public-collections.ts
A	lib/data/public-tool-catalog-context.tsx
A	lib/data/public-tools-runtime.ts
M	lib/data/public-tools.ts
A	lib/data/tool-public-adapters.ts
A	lib/data/tool-public-repository.ts
A	lib/data/tool-public-view.ts
A	lib/discovery/canonical-remote-workspace.ts
M	lib/discovery/client-store.ts
M	lib/discovery/local-storage.ts
D	lib/discovery/remote-workspace.ts
M	lib/discovery/schema.ts
M	lib/discovery/types.ts
A	lib/discovery/workspace-api-guard.ts
A	lib/discovery/workspace-constants.ts
A	lib/discovery/workspace-contract.ts
A	lib/discovery/workspace-events.ts
A	lib/discovery/workspace-legacy-adapters.ts
A	lib/discovery/workspace-owner-storage.ts
M	lib/discovery/workspace-state.ts
A	lib/discovery/workspace-storage-keys.ts
A	lib/discovery/workspace-storage.ts
A	lib/discovery/workspace-sync-client.ts
A	lib/discovery/workspace-sync-storage.ts
A	lib/discovery/workspace-sync.ts
M	lib/gamification/actions.ts
M	lib/gamification/hooks/use-arena-battle.ts
M	lib/gamification/hooks/use-badges.ts
M	lib/gamification/hooks/use-claim-mission.ts
M	lib/gamification/hooks/use-game-profile.ts
M	lib/gamification/hooks/use-radar-prediction.ts
A	lib/gamification/release-context.tsx
M	lib/gamification/sound-engine.ts
A	lib/public-submissions/contracts.ts
A	lib/public-submissions/guard.ts
A	lib/security/browser-headers.ts
A	lib/security/distributed-state.ts
A	lib/security/public-submission.ts
A	lib/security/rate-limit-policies.ts
M	lib/stores/tool-workspace-store.ts
M	lib/supabase/admin-client.ts
M	lib/supabase/affiliate-request-repository.ts
M	lib/supabase/suggestion-repository.ts
M	lib/supabase/tool-repository.ts
A	lib/supabase/waitlist-repository.ts
A	lib/types/tool-public.ts
M	lib/types/tool.ts
A	lib/waitlist/contract.ts
M	lib/wishlist/request-tool-store.ts
M	middleware.ts
M	next.config.ts
M	package-lock.json
M	package.json
A	playwright.config.ts
A	scripts/check-runtime.d.mts
A	scripts/check-runtime.mjs
A	scripts/release/build-db-manifest.mjs
A	scripts/release/build-public-tool-cutover-inventory.d.mts
A	scripts/release/build-public-tool-cutover-inventory.mjs
A	scripts/release/check-migration-history.mjs
A	scripts/release/check-staging-seed.mjs
A	scripts/release/check-style-ownership.mjs
A	scripts/release/compare-db-checksums.mjs
A	scripts/release/db-checksum.sql
A	scripts/release/verify-public-tool-cutover.d.mts
A	scripts/release/verify-public-tool-cutover.mjs
M	styles/account.css
M	styles/compare.css
M	styles/depth-scene.css
M	styles/figma-final-polish.css
M	styles/figma-implementation.css
M	styles/gamification.css
M	styles/radar.css
A	styles/release-entry.ts
A	styles/tokens.css
M	styles/vibes-3d-maestoso.css
A	supabase/config.toml
A	supabase/fixtures/staging_seed.sql
R100	supabase/migrations/0023_expand_tool_requests_for_founder_flows.sql	supabase/migrations/20260705000000_expand_tool_requests_for_founder_flows.sql
A	supabase/migrations/20260716000001_reconcile_legacy_0023.sql
A	supabase/migrations/20260716000002_create_waitlist.sql
A	supabase/migrations/20260716000003_harden_public_submissions_and_game_rpc.sql
A	supabase/migrations/20260716000004_workspace_state_v1_sync.sql
A	supabase/migrations/20260717000000_harden_workspace_state_v1_sync.sql
A	supabase/migrations/migration-history.json
A	tests/design-system/token-contract.test.ts
A	tests/design-system/typography-contract.test.ts
A	tests/e2e/core-routes.spec.ts
A	tests/e2e/fixtures/product-hunt.ts
A	tests/e2e/fixtures/release-fixture.ts
A	tests/e2e/security-boundaries.spec.ts
A	tests/e2e/setup/gate.setup.ts
A	tests/e2e/typography-runtime.spec.ts
A	tests/e2e/visual-matrix.spec.ts
A	tests/e2e/visual-matrix.spec.ts-snapshots/account-visual-1024-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/account-visual-1440-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/account-visual-1920-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/account-visual-320-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/account-visual-390-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/account-visual-768-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/archivio-visual-1024-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/archivio-visual-1440-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/archivio-visual-1920-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/archivio-visual-320-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/archivio-visual-390-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/archivio-visual-768-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/compare-visual-1024-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/compare-visual-1440-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/compare-visual-1920-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/compare-visual-320-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/compare-visual-390-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/compare-visual-768-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/home-visual-1024-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/home-visual-1440-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/home-visual-1920-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/home-visual-320-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/home-visual-390-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/home-visual-768-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/radar-visual-1024-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/radar-visual-1440-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/radar-visual-1920-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/radar-visual-320-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/radar-visual-390-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/radar-visual-768-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/shortlist-visual-1024-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/shortlist-visual-1440-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/shortlist-visual-1920-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/shortlist-visual-320-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/shortlist-visual-390-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/shortlist-visual-768-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/tool-detail-blink-visual-1024-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/tool-detail-blink-visual-1440-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/tool-detail-blink-visual-1920-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/tool-detail-blink-visual-320-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/tool-detail-blink-visual-390-win32.png
A	tests/e2e/visual-matrix.spec.ts-snapshots/tool-detail-blink-visual-768-win32.png
M	vitest.config.ts
A	workers/security-state/index.ts
A	workers/security-state/wrangler.jsonc
M	wrangler.jsonc
```

## 16. File da proteggere e comportamenti da non cambiare senza prova

- I tre documenti master e questo handoff.
- Feature flags fail-closed e default gamification OFF.
- Runtime Node 22.23.1 e range npm compatibile Cloudflare.
- Repository Tool pubblico unico e source policy intenzionale.
- Migrazione localStorage non distruttiva e backup/quarantena.
- Web Locks/claim ledger/isolamento account introdotti in B18.
- Rate limit/revoca distribuiti fail-closed.
- Retirement degli endpoint discovery legacy.
- Test visuali esistenti: non rigenerarli in massa senza review.
- CSP/reporting e security header: non allentarli per risolvere errori di sviluppo.

## 17. Decisioni che la prossima AI non deve assumere

1. Non assumere che Cloudflare sia verde solo perché l’utente ha detto “perfetto”: verificare il deployment.
2. Non assumere che Supabase sia migrato: il repository contiene solo evidenza statica.
3. Non abilitare `TOOOLVIBES_WORKSPACE_SYNC_MODE=canonical` senza staging DB completo.
4. Non abilitare gamification rewarded finché DB/RPC e ledger non sono chiusi.
5. Non cancellare adapter legacy Tool prima del cutover certificato.
6. Non sostituire Base UI/Vaul focus/scroll engine con un registry custom senza una failing case reale.
7. Non accumulare B23+ sopra B22 non validato.
8. Non dichiarare production-ready sulla base di lint/typecheck/build soltanto.

## 18. Prima azione raccomandata

La prossima AI deve partire da B22 e fare una delle due cose, esplicitamente:

- **Opzione raccomandata:** mantenere il provider portal minimale, completare polyfill/test/matrix, verificare safe-area e z-stack, eseguire quality/build e committare un singolo B22 su `main`;
- **Opzione alternativa:** se l’acceptance richiede davvero un overlay registry proprietario, fermarsi, documentare il mismatch e ridisegnare B22 prima di toccare B23. Non sovrapporre le due architetture.

Dopo B22, la priorità non è il polish visuale: sono le prove staging B05/B06/B09 e la decisione B15 sulla source Tool.

## 19. Criterio di handoff riuscito

L’altra AI ha compreso correttamente lo stato se può rispondere a tutte queste domande senza deduzioni:

- qual è il commit remoto corrente;
- quali file locali non sono committati;
- quali batch sono completi, parziali o mancanti;
- quali test sono realmente passati e quali no;
- quali prove dipendono da Cloudflare/Supabase/staging;
- perché B22 usa un portal provider minimo;
- perché i tre MD non devono ancora essere cancellati;
- quale batch eseguire subito dopo e quali aree non toccare.

---

**Conclusione:** TooolVibes ha ora fondamenta di release molto più solide rispetto al baseline dell’audit, soprattutto su runtime, CI, security boundaries, dati e workspace. Non è però arrivata al “dunque” della pubblicazione: l’architettura UI/UX core, i flow decisionali, la responsive finalization, gli state/error contract, performance, telemetry e la certificazione esterna restano ampiamente incompleti. La prosecuzione deve essere atomica, verificabile e sempre su `main`.
