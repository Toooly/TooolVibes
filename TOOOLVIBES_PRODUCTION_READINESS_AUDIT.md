# TooolVibes — Production Readiness Audit

**Data audit:** 15 luglio 2026  
**Stato repository:** branch main; worktree pulito prima delle verifiche; al termine risultano non tracciati soltanto i tre documenti di audit richiesti  
**Perimetro:** prodotto, UI, UX, GUI, frontend, responsive, accessibilità, performance, auth, dati, gamification, sicurezza applicativa, release e QA  
**Regola operativa rispettata:** nessuna modifica al codice applicativo; sono stati creati solo i documenti di audit e screenshot temporanei.

## Metodo ed evidenza

L’audit ha combinato cinque lenti specialistiche, analizzate separatamente prima della sintesi:

1. Senior UI/UX Product Design;
2. GUI / Visual System;
3. Principal Frontend Architecture, performance e quality;
4. Gamification & Engagement UX;
5. Release QA.

Le conclusioni derivano da:

- README, file di contesto 00–05, report e piani storici;
- inventario completo di app, components, lib, styles, Supabase e configurazione Cloudflare;
- lettura delle route, dei layout, dei provider, degli store, delle API e delle migration;
- navigazione reale mobile a 390 × 844 px del gate, home e catalogo;
- smoke HTTP delle route pubbliche dietro gate e senza gate;
- build Next di produzione;
- build OpenNext Cloudflare;
- dry-run Wrangler;
- lint, typecheck e test;
- audit dipendenze e controllo versioni;
- analisi quantitativa di CSS, componenti, breakpoint e import.

### Limiti dell’evidenza

- Il flusso authenticated non è stato completato end-to-end perché richiede un magic link esterno e uno stato Supabase controllato.
- Dopo il riavvio del server locale, il browser di audit è entrato in uno stato di sicurezza non recuperabile; non sono state forzate scorciatoie. Le route interne sono quindi state osservate realmente su iPhone-size, mentre tablet, laptop e desktop interni sono stati verificati staticamente, tramite build e smoke route. Il gate pubblico è stato osservato anche a 1440 × 900.
- Non sono stati misurati Core Web Vitals sul campo né su device fisici. Le conclusioni performance distinguono sempre rischio strutturale da metrica realmente misurata.
- Non è stata eseguita una revisione legale professionale: Privacy, Cookie e Termini sono valutati solo per completezza di release e devono essere approvati dal responsabile competente.

### Evidenza visuale accettata

- C:/Users/Mattia/.codex/visualizations/2026/07/15/019f6701-354d-7692-8ef6-5b1c4e043ed4/tooolvibes-audit/01b-public-coming-soon-390x844-stable.png
- C:/Users/Mattia/.codex/visualizations/2026/07/15/019f6701-354d-7692-8ef6-5b1c4e043ed4/tooolvibes-audit/02-gate-modal-390x844.png
- C:/Users/Mattia/.codex/visualizations/2026/07/15/019f6701-354d-7692-8ef6-5b1c4e043ed4/tooolvibes-audit/03-home-mobile-390x844.png
- C:/Users/Mattia/.codex/visualizations/2026/07/15/019f6701-354d-7692-8ef6-5b1c4e043ed4/tooolvibes-audit/04-archive-mobile-390x844.png
- C:/Users/Mattia/.codex/visualizations/2026/07/15/019f6701-354d-7692-8ef6-5b1c4e043ed4/tooolvibes-audit/05-archive-list-mobile-390x844.png

La cattura full-page mobile non è stata usata come evidenza perché il meccanismo tiled ha duplicato elementi fixed e interagito con animazioni on-scroll.

---

## 1. EXECUTIVE SUMMARY

### Verdetto

**Production readiness complessiva: 38/100 — non pubblicabile nello stato corrente.**

TooolVibes non è un prototipo debole. Possiede una direzione di prodotto distintiva, un’identità visiva riconoscibile, un catalogo editoriale ricco, percorsi guest-first, un back office ampio, build Next e Cloudflare funzionanti e diversi dettagli di qualità già buoni.

Il problema è che gli strati più importanti non condividono ancora una fonte di verità:

- le CTA reali di salvataggio e confronto scrivono in uno store diverso da quello sincronizzato con l’account;
- il catalogo pubblico e il CMS usano repository tool differenti;
- Compare comunica un vincitore preciso con una formula non difendibile e dipendente anche dall’ordine;
- Decision Memory è modellata ma quasi irraggiungibile nell’interfaccia reale;
- XP, missioni, badge, Radar e Arena non formano un sistema affidabile e alcune superfici sono abusabili o non completabili;
- il design system esiste come più strati di repaint, non come componenti canonici;
- il gate protegge la pre-release ma blocca anche crawler, robots e sitemap;
- schema, anti-abuse, privacy, osservabilità e QA non sono ancora riproducibili a livello release.

Quindi il gap non è “manca l’ultimo polish”. Il gap è tra una collezione di feature convincenti e un prodotto unico, verificabile e governabile.

### Segnali positivi

- Next build: PASS.
- OpenNext Cloudflare build: PASS.
- Typecheck: PASS, zero errori.
- Test: PASS, 19/19; copertura però limitata a tre file gamification.
- Lint: exit 0; 16 warning da chiudere.
- Empty state dei flussi core presenti.
- Skip link, numerosi focus state e alcune protezioni reduced-motion presenti.
- Cookie gate e admin firmati; sanitizzazione Markdown; RLS presente sulle tabelle sensibili.
- Product Hunt ha timeout, cache e fallback espliciti.
- Identità cosmic dark, linguaggio Radar/orbita e curatela italiana sono memorabili.

### Blocker pre-lancio

1. unificare workspace/persistenza guest-account;
2. unificare fonte e modello Tool;
3. mettere in sicurezza o spegnere la gamification persistente;
4. sostituire il verdetto Compare con un metodo spiegabile;
5. rendere Decision Memory realmente utilizzabile;
6. riparare migration e schema waitlist;
7. eliminare hydration mismatch e warning runtime/deploy;
8. proteggere endpoint pubblici, sessioni e dipendenze vulnerabili;
9. rendere il gate disattivabile e verificare SEO/crawler;
10. introdurre CI, E2E, osservabilità e certificazione multi-device.

---

## 2. CURRENT PRODUCT STATE

### Cos’è oggi TooolVibes

TooolVibes è una web app editoriale italiana, attualmente dietro gate pre-release, che aiuta creator, founder e piccoli team a scoprire, valutare e confrontare tool AI, SaaS, no-code, automazioni e vibe coding.

Il codice contiene cinque domini di prodotto:

1. **Discovery editoriale:** home, catalogo, categorie, tag, schede tool, collezioni e post.
2. **Decision workspace:** salvati, compare, shortlist stage, note, pin e Decision Memory.
3. **Freshness loop:** Radar/Product Hunt e segnali giornalieri.
4. **Engagement ludico:** XP, livelli, missioni, badge, Arena, leaderboard e Vibe Rush.
5. **Business/editorial operations:** CMS tool/articoli/collection, submission, affiliate e monetizzazione.

### Problema risolto

La promessa corretta è: ridurre rumore e incertezza nella scelta di tool, non mostrare il catalogo più grande.

### Utenti

- **Primari:** creator, founder, freelance, maker e piccoli team che devono scegliere strumenti rapidamente.
- **Secondari:** utenti che tornano a monitorare tool emergenti o una decisione aperta.
- **Supply-side:** founder e operatori che suggeriscono tool o chiedono visibilità/affiliazione.
- **Interni:** editor e amministratori che gestiscono catalogo, raccolte, articoli e monetizzazione.

### Core loop target

Scopri → capisci la scheda → salva → restringi → confronta per obiettivo → registra la decisione → torna per verificare o aggiornare.

### Core loop reale

Scopri → salva/confronta nello store locale → visualizza shortlist o Battle → fine.

Il loop reale non chiude in modo affidabile la decisione e non garantisce il passaggio all’account.

### Feature primarie

- Catalogo, ricerca, filtri e schede tool.
- Salvataggio e confronto guest-first.
- Radar.
- Collections editoriali.
- Account magic-link e workspace remoto.
- Admin tool/collection/article.

### Feature secondarie

- Post/editorial.
- Community, suggerimenti e submission founder.
- Affiliati e monetizzazione.
- Shop esterno.
- Gamification, Vibe Rush, missioni, badge e leaderboard.

### Vantaggio distintivo potenziale

**Curatela italiana + Radar vivo + confronto spiegabile per obiettivo + memoria del perché.**

Se questo sistema ricorda la motivazione, riapre le decisioni e mostra cosa è cambiato, TooolVibes diventa un decision companion. Senza questo collegamento resta un catalogo visualmente ricco con minigiochi laterali.

### Cosa non deve essere assunto

- Non tutte le feature esistenti devono essere pubbliche al day one.
- Vibe Rush può restare un Easter egg opzionale; XP e missioni non devono essere esposti finché non sono affidabili.
- Community e Shop non devono occupare IA primaria se restano principalmente pagine promessa.
- I fallback locali non vanno rimossi finché il bootstrap contenuti e lo staging non sono definiti.

---

## 3. PRODUCT MAP

### 3.1 Route pubbliche e di sistema

| Route | Scopo / target | Entry point | Azione primaria | Secondarie / uscita | Criticità | Percepita | Reale |
|---|---|---|---|---|---|---:|---:|
| / | Coming soon senza cookie; home con gate | URL diretto, brand | Waitlist oppure Esplora catalogo | Gate, Radar | Hydration, chrome mobile, gate | 78 | 45 |
| /archivio | Catalogo per utenti in discovery | Home, nav, ricerca | Cerca/filtra/apri tool | Salva, compare, sponsor | Source statica, densità, sponsor-first | 66 | 42 |
| /toools/[slug] | Comprendere e valutare un tool | Catalogo, Radar, related | Visita tool / salva / compare | Fonte, tag, correlati | Source divergente, markup legacy | 72 | 46 |
| /tags | Mappa categorie e casi d’uso | Footer, detail | Scegli tag/categoria | Archivio | Tassonomia/source non canoniche | 64 | 50 |
| /collections | Raccolte editoriali | Header/footer/home | Apri collection | Salva tool | Layout mobile universale, fallback | 70 | 52 |
| /collections/[slug] | Percorso editoriale guidato | Collections, related | Leggi/sblocca/valuta | Salva, compare | Stato unlock e dati da validare | 76 | 50 |
| /radar | Freshness e ranking Product Hunt | Home, nav | Esplora ranking/intervallo | Salva, prediction/missioni | Fetch/render duplicati, reward non affidabile | 74 | 24 |
| /product-hunt | Alias legacy | Link storico | Redirect a /radar | — | Alias da mantenere testato | 90 | 80 |
| /shortlist | Biblioteca e Decision Memory | CTA, bottom nav | Riprendere tool salvati | Compare, note/stage | Note/stage non azionabili, doppio store | 68 | 34 |
| /wishlist | Alias storico | Link legacy/detail | Redirect a /shortlist#wishlist | Form richiesta | Semantica legacy | 88 | 72 |
| /compare | Confronto e scelta | CTA, nav, shortlist | Confronta candidati | Rimuovi, visita, reset | Score non spiegabile/order-sensitive | 82 | 28 |
| /account | Login, profilo, workspace, submission | Header, conversion CTA | Magic link / gestisci account | Logout, workspace | Sincronizza store errato, monolite | 72 | 25 |
| /auth/callback | Completa autenticazione | Email magic link | Verifica sessione e attach | Account / recovery | Gate può intercettare callback cross-device | 65 | 38 |
| /posts | Hub editoriale | Footer, related | Apri articolo | Tool/collection correlati | CMS e seed legacy | 65 | 46 |
| /posts/[slug] | Guida o approfondimento | Posts, search | Leggi e prosegui | Tool, collection | Source/fallback e metadata da QA | 68 | 48 |
| /community | Contribuzione e posizionamento | Footer/nav secondaria | Suggerisci un tool | Metodo, form | Anti-abuse e RLS | 60 | 38 |
| /chi-siamo | Fiducia e identità | Footer | Comprendere il brand | Metodo, contatto | Bassa criticità; copy da preservare | 66 | 52 |
| /metodo | Spiegare processo di scelta | Home/footer | Comprendere il metodo | Catalogo, Radar | Metodo non allineato allo score Compare | 70 | 55 |
| /shop | Risorse premium esterne | Footer/nav secondaria | Vai allo shop | Contenuti premium | Value proposition incompleta | 58 | 32 |
| /affiliati | Candidatura affiliati | Footer/business | Invia candidatura | FAQ/processo | Anti-abuse, stati submit | 66 | 35 |
| /privacy | Informativa privacy | Footer/auth | Comprendere trattamento | Contatto | Contenuto legale insufficiente | 55 | 18 |
| /cookie | Informativa cookie/storage | Footer | Comprendere storage | Browser settings | Inventario/retention/consenso assenti | 55 | 18 |
| /termini | Condizioni d’uso | Footer/auth | Comprendere condizioni | — | Contenuto legale insufficiente | 55 | 18 |
| /dev/design-system | Showcase interno | Dev only | Ispezionare target UI | — | Non rappresenta l’adozione reale | 88 | Non release |
| /robots.txt | Istruzioni crawler | Bot | Leggere direttive | Sitemap | Intercettato dal gate | 90 | 30 con gate |
| /sitemap.xml | Inventario indicizzabile | Bot/search engine | Scoprire URL | — | Gate + source diversa dal catalogo | 88 | 28 con gate |

**Nota:** percepita indica la maturità comunicata dalla UI; reale include dati, persistenza, sicurezza, accessibilità, test e deployment.

### 3.2 Route admin

| Route | Scopo / target | Entry | Primaria | Secondarie / uscita | Criticità | Percepita | Reale |
|---|---|---|---|---|---|---:|---:|
| /admin/login | Accesso founder/editor | URL/admin redirect | Autenticarsi | Torna al sito | Rate limit/revoca in-memory | 72 | 40 |
| /admin | Control center founder | Login riuscito | Scegli workflow | Logout/sito | IA e copertura QA | 70 | 42 |
| /admin/tools | Governare catalogo | Dashboard | Cerca/apri tool | Nuovo tool | Source diversa dal pubblico | 74 | 38 |
| /admin/tools/new | Creare tool | Tools | Pubblica/salva | Annulla/elenco | Contract pubblico non unico | 72 | 40 |
| /admin/tools/[id]/edit | Aggiornare tool | Tools | Salva modifiche | Preview/elenco | Modifica non garantita nel catalogo statico | 76 | 36 |
| /admin/articles | Governare editoriale | Dashboard | Cerca/apri articolo | Nuovo/import | CMS + seed legacy | 70 | 42 |
| /admin/articles/new | Creare/importare articolo | Articles | Salva/pubblica | Preview/elenco | Pipeline media e fallback | 72 | 40 |
| /admin/articles/[id]/edit | Aggiornare articolo | Articles | Salva modifiche | Preview/elenco | Source mista | 76 | 42 |
| /admin/[id]/edit | Alias articolo legacy | Link storico | Redirect/edit | Articles | Route duplicata | 64 | 30 |
| /admin/new | Alias nuovo articolo legacy | Link storico | Redirect/create | Articles | Route duplicata | 64 | 30 |
| /admin/collections | Governare collection/sync | Dashboard | Cerca/sincronizza | Nuova/review | Pagina monolitica ~1.149 righe | 76 | 34 |
| /admin/collections/new | Creare collection | Collections | Salva collection | Annulla/elenco | Contract e preview da E2E | 72 | 40 |
| /admin/collections/[id] | Dettaglio/review collection | Elenco/review | Modifica/approva | Elenco | Stato workflow complesso | 76 | 40 |
| /admin/collections/review | Coda review | Collections | Approva/rifiuta | Dettaglio/elenco | Concorrenza e recovery | 70 | 36 |
| /admin/suggestions | Valutare richieste tool | Dashboard | Approva/gestisci | Tool/lista | Insert anon aggirabile/anti-abuse | 70 | 30 |
| /admin/affiliates | Valutare candidature | Dashboard | Gestisci candidatura | Lista | Anti-abuse e privacy | 68 | 32 |
| /admin/affiliate-links | Governare link affiliati | Dashboard | Cerca/modifica link | Nuovo | Integrità/disclosure | 72 | 40 |
| /admin/affiliate-links/new | Creare link affiliato | Link list | Salva link | Annulla/elenco | Validazione destinazione | 70 | 38 |
| /admin/affiliate-links/[id]/edit | Modificare link affiliato | Link list | Salva modifiche | Elenco | Audit trail assente | 72 | 38 |
| /admin/monetization | Governare placement | Dashboard | Configura placement | Preview/sito | Effetto pubblico non E2E | 74 | 34 |

Per le route admin l’utente target è il founder/editor autorizzato; “percepita” misura la completezza dell’interfaccia, “reale” include source dati, autorizzazione, concorrenza, rollback e test.

### 3.3 Route API

| Route | Responsabilità | Rischio principale |
|---|---|---|
| /api/tools | Tool pubblicati + metadata source | Diverge dal catalogo statico |
| /api/product-hunt | Ranking live/fallback | Cache in-memory per isolate |
| /api/waitlist | Iscrizione prelaunch | Tabella non versionata, no anti-abuse durevole |
| /api/tool-requests | Submission tool/founder | Insert anon aggirabile, rate limit assente |
| /api/affiliate-requests | Candidatura | Insert anon aggirabile, rate limit assente |
| /api/auth/config | Config auth pubblica | Verificare disclosure minima |
| /api/auth/magic-link | Invio magic link | Rate limit in-memory |
| /api/discovery-state | GET/PUT workspace | Sincronizza store diverso dalle CTA |
| /api/discovery-account/attach | Merge guest-account | Snapshot incompleto rispetto alla UI |
| /api/discovery-account/release | Logout e nuovo guest | Concorrenza/device non testati |
| /api/account/submissions | Submission collegate | Stati rete/permessi non E2E |
| /api/gate | Apertura gate | Nessun limiter durevole |
| /api/gate/logout | Chiusura gate | Adeguata al prelaunch |
| /api/admin/login | Login admin | Rate limit/revoca in-memory |
| /api/admin/logout | Logout admin | Revoca non distribuita |
| /api/admin/article-media | Upload media | Serve QA limiti/type/storage |

### 3.4 Layout e shell

| Layer | Componenti | Diagnosi |
|---|---|---|
| Root | app/layout.tsx, RootProviders | Quattro font e molti layer client globali |
| Marketing | marketing/layout.tsx | 3D, Orbital, account, persistence, header, footer, bottom nav |
| Admin | admin protected layout | Separazione corretta, QA incompleta |
| Navigation | SiteHeaderV2, MobileBottomNav, SiteFooterV2 | IA duplicata e account state non coerente |
| Global feedback | Toaster, RouteTransitionLoader, sound/music, GameEffects | Nessun feedback budget comune |
| Global engagement | GamificationShell, GameMissionDrawer, Vibe Rush FAB, intro | Compete con il task primario |

### 3.5 Componenti e overlay principali

| Famiglia | Implementazioni attive / concorrenti | Stato |
|---|---|---|
| Button | Button, ButtonLink, PremiumButton, PremiumLink, 138 button raw | Non canonico |
| Card | Card esiste ma 0 consumer; PremiumPanel e molte card locali | Non canonico |
| Tool card | DirectoryToolCard, MobileToolCard e varianti route | Da consolidare |
| Compare | MobileCompareView, DesktopCompareView, CompareBoard, UnifiedCompareBoard, legacy | Stratificato |
| Shortlist | MobileShortlistBoard attivo; ShortlistBoard/WorkspacePanel più completi non montati | Funzione incompleta |
| Radar | MobileRadarView, DesktopRadarTable, DesktopRadarNodes | Entrambi montati; fetch duplicati |
| Dialog | primitive Dialog + modali custom | Layer e focus non uniformi |
| Sheet/Drawer | Sheet, Drawer, Vaul/custom sheet | Z-index e semantica divergenti |
| Menu | header mobile panel, command palette | Overlay e IA separati |
| Tooltip | TooltipProvider e tooltip custom | Non verificato sistematicamente |
| Toast/reward | Sonner, badge toast, level-up modal, confetti, audio | Potenziale sovrapposizione |

#### Inventario overlay, menu e feedback

| Istanza / file | Tipo | Mount / trigger | Stato reale e rischio |
|---|---|---|---|
| components/coming-soon/gate-modal.tsx | Modal custom | ComingSoonPage, CTA gate | Attivo; manca contratto Dialog/focus/label uniforme |
| components/app/global-command-palette.tsx | Command dialog | RootProviders, shortcut globale | Attivo; dataset e search diversi dall’Archivio |
| components/layout/site-header-v2.tsx | Search overlay + menu mobile custom | Marketing layout | Attivo; due overlay nello stesso owner, z-index locale |
| components/gamification/game-mission-drawer.tsx | Drawer | GamificationShell | Attivo; compete con nav/FAB e task primario |
| components/gamification/game-mission-panel.tsx | Pannello missioni | Mission drawer / flow game | Attivo; completion non alimentata end-to-end |
| components/gamification/vibe-tap-mini-game.tsx | Full-screen game overlay | FAB globale | Attivo; circa 1.004 righe, reward e focus da isolare |
| components/gamification/badge-unlock-modal.tsx | Reward modal | GameEffectsLayer | Attivo condizionale; può sovrapporsi a level-up/toast |
| components/gamification/level-up-modal.tsx | Reward modal | GameEffectsLayer | Attivo condizionale; nessuna coda overlay canonica |
| components/gamification/badge-unlock-toast.tsx | Reward toast | Sonner | Attivo condizionale; duplicazione feedback modal/toast/audio |
| components/gamification/radar-scanner-overlay.tsx | Scanner overlay | Radar mission/prediction | Attivo condizionale; effetto più maturo della logica dati |
| components/tools/mobile-shortlist-board.tsx::MobileNoteSheet | Bottom sheet custom | Shortlist, noteSlug | Montato ma trigger setNoteSlug non raggiunto: funzione percepita, non operativa |
| components/app/orbital-system/tool-preview-popover.tsx | Preview popover | Orbital system | Attivo nel layer 3D; focus/hover/touch da validare |
| components/account/account-panel.tsx | Tooltip/section panel | /account | Attivo; componente monolitico e stati auth/workspace accorpati |
| components/wishlist/request-tool-form.tsx | Toast custom locale | Submit richiesta | Attivo; feedback separato da Sonner |
| components/ui/dialog.tsx | Primitive Dialog | Command e consumer selettivi | Disponibile, non adottata dal gate/reward system |
| components/ui/drawer.tsx | Primitive Drawer | Missioni e legacy discovery | Disponibile; convive con sheet custom |
| components/ui/sheet.tsx | Primitive Sheet | Adozione marginale | Disponibile ma non canonica nei flow core |
| components/ui/popover.tsx | Primitive Popover | Orbital/consumer limitati | Disponibile; touch behavior non coperto |
| components/ui/dropdown-menu.tsx | Primitive menu | Nessun consumer core confermato | Possibile infrastruttura inutilizzata |
| components/ui/tooltip.tsx | Primitive Tooltip | Account/consumer limitati | Adozione non sistematica; contenuto essenziale non deve dipenderne |
| components/ui/sonner.tsx | Toaster globale | RootProviders | Attivo; manca tassonomia/coda unica del feedback |
| components/directory/tool-discovery-app.tsx | Drawer/overlay legacy | Nessun entrypoint confermato | Candidato dead code; non riusare prima della verifica import dinamici |

#### Inventario degli stati e dei sistemi di feedback

| Stato | Implementazione osservata | Copertura | Gap |
|---|---|---|---|
| Loading route | app/loading.tsx, loader globale, skeleton locali | Parziale | Loader multipli senza budget comune |
| Skeleton | components/ui/skeleton.tsx, tool-card-skeleton.tsx | Parziale | Non esiste matrice route/state |
| Empty | admin-empty-state e empty state core locali | Buona base | Copy e CTA non sempre canonici |
| Error | app/error.tsx, messaggi form/API locali | Parziale | Boundary strutturalmente errata; retry non sistematico |
| Offline/network failure | Fallback Product Hunt/content e catch locali | Parziale | Nessuna UX offline/retry coerente |
| Success | Sonner, toast locali, reward modal/audio/confetti | Ampia ma frammentata | Feedback budget e priorità assenti |
| Disabled/loading control | Varianti locali di button/input | Incoerente | Non tutti gli elementi raw definiscono gli stessi stati |
| Selected/active | chip, tab, nav, save/compare toggle | Ampia | Più store e styling family divergenti |
| Focus/keyboard | primitive Base UI + CSS locali | Parziale | Overlay custom e raw controls non certificati |
| Reduced motion | media query e controlli sparsi | Parziale | Canvas/audio/microinteraction non governati da un’unica capability |
| Persisted/optimistic | Zustand, localStorage, remote discovery | Fragile | Due workspace impediscono una semantica affidabile |
| Authenticated/guest | AccountProvider, middleware, gate | Fragile | Callback gate e handoff dei salvataggi incompleti |

L’inventario mostra che le primitive esistono, ma non sono il percorso obbligatorio: le feature core creano overlay, toast e sheet propri. La root cause non è l’assenza di componenti, bensì l’assenza di ownership e di un contratto di adozione.

### 3.6 Mappa dati reale

| Dominio | Source A | Source B | Effetto |
|---|---|---|---|
| Tool | directoryTools statico | getPublishedTools Supabase/mock | Catalogo, CMS, API e sitemap possono divergere |
| Workspace | Zustand tooolvibes-tool-workspace | chiavi tooolvibes:shortlist/compare + remote | Account non conserva necessariamente le CTA reali |
| Articoli | CMS Supabase/storage | legacy guide seeds | Amministrazione e pubblico fondono sorgenti |
| Collections | Supabase/content/mock auto | sync preview legacy | Più robusto, ma transizione ancora complessa |
| Gamification | server actions/RPC | UI Battle/Vibe Rush client | Reward e score non condividono eventi canonici |

---

## 4. UI STRATIGRAPHY

### Evidenza quantitativa

| Segnale | Valore |
|---|---:|
| CSS globalmente caricato | 9 file |
| Righe CSS | 45.019 |
| Byte sorgente CSS | 1.266.696 |
| Solo app/globals.css | 34.074 righe / 948.057 byte |
| !important | 3.584 |
| Dichiarazioni z-index | 387 |
| Media query | 221 |
| Radius dichiarati | circa 1.013 |
| Valori radius distinti | 176 |
| Inline style TSX | 712 |
| rounded arbitrari | 513 occorrenze / 31 valori |
| shadow arbitrarie | 64 occorrenze / 58 valori |

### I quattro strati visuali

1. **Legacy light/lilac:** token base in app/globals.css con superfici chiare, viola storico e radius ampi.
2. **Maestoso dark/cosmic:** styles/vibes-3d-maestoso.css con void, violetto, cyan, glass e glow.
3. **Target Figma dark:** styles/figma-implementation.css con token tv e scala più compatta.
4. **Repaint finale e sistemi locali:** styles/figma-final-polish.css più account, compare, gamification, radar e regole route-specific.

La nuova direzione non ha sostituito la vecchia alla fonte. È stata applicata a valle tramite liste di selettori, classi arbitrarie e override. Questo spiega perché una modifica locale ha un raggio di regressione non prevedibile.

### Segni di stratificazione

- app/layout.tsx importa globals, Maestoso e final polish; globals importa altri sei fogli.
- blocks “final”, “hard guard”, “cleanup”, “reboot” e “v2” si accumulano fino alla fine di globals.css.
- figma-final-polish.css seleziona componenti eterogenei e classi utility generate.
- colori semantici possono essere sovrascritti da regole globali su p, li e small.
- Compare è ridefinito decine di volte; mobile-compare-arena compare in oltre dieci zone di globals.css.
- componenti legacy restano renderizzati e vengono solo nascosti via CSS.
- alcuni flussi montano mobile e desktop insieme e delegano al CSS la visibilità.

### Root cause, impatto e azione

| Problema | Dove | Perché probabile | Impatto/rischio | Azione |
|---|---|---|---|---|
| Repaint globale | layout, globals, figma files | Direzioni successive aggiunte senza migrazione | Regressioni lontane, specificity war | Congelare override; migrare vertical slice |
| Compare hard guards | globals.css + compare.css | Fix responsive incrementali | Massimo rischio di rottura | Ricostruire shell CSS da baseline unica |
| Componenti duplicati | header/footer/compare/shortlist/3D | Refactor non ritirati | Dead code e scelte divergenti | Verificare import e rimuovere per famiglia |
| Mobile/desktop paralleli | Radar, Compare | Ottimizzazione visuale separata | Doppio render/fetch/listener | Boundary esclusivo e query condivisa |
| Mobile universale | Archivio, Shortlist, Collections | Priorità mobile divenuta default | Desktop non intenzionale | Creare layout responsive canonico |
| Valori hardcoded | TSX/CSS | Mancanza token owner | Incoerenza e contrasto variabile | Adoption matrix token |
| Z-index locali | header, sheet, modal, FAB | Overlay sviluppati per feature | Collisioni e focus errato | Unico overlay contract |

### Decisione

Non fare un cleanup CSS big-bang. Le regole attuali nascondono dipendenze visuali. Ogni rimozione deve seguire: screenshot baseline → componente canonico → migrazione route → visual regression → cancellazione override relativo.

---

## 5. UX AUDIT

### Flow score unificati

| Flow | UX completeness | UI consistency | Technical robustness | Production readiness |
|---|---:|---:|---:|---:|
| Gate / onboarding | 45 | 68 | 38 | 38 |
| Discovery catalogo | 62 | 56 | 45 | 48 |
| Esplorazione tag/categorie | 58 | 54 | 43 | 45 |
| Collections editoriali | 65 | 62 | 46 | 48 |
| Lettura post → discovery | 62 | 60 | 48 | 50 |
| Ricerca e filtri | 55 | 50 | 42 | 43 |
| Tool detail → save | 68 | 58 | 35 | 42 |
| Save → Shortlist | 48 | 64 | 32 | 34 |
| Shortlist → Compare | 45 | 68 | 40 | 40 |
| Compare → Decision | 32 | 74 | 30 | 28 |
| Decision Memory → ritorno | 15 | 40 | 24 | 16 |
| Radar daily loop | 38 | 70 | 20 | 20 |
| Login con magic link | 58 | 66 | 40 | 38 |
| Signup/account creation + callback | 46 | 64 | 28 | 26 |
| Guest → account | 42 | 65 | 18 | 20 |
| Ritorno utente autenticato | 32 | 52 | 22 | 24 |
| Submission tool/founder | 60 | 62 | 35 | 38 |
| Candidatura affiliato | 58 | 60 | 35 | 36 |

### Osservazioni per flow

**Gate/onboarding.** Il coming soon è chiaro, premium e focalizzato. Mancano label form, rassicurazione privacy, live feedback e dialog semantics. L’intro interna ritarda il time-to-value di circa quattro secondi più uscita a ogni nuova sessione.

**Discovery.** La home spiega bene la promessa, ma su 390 × 844 concentra header, bottom nav, CTA, Vibe Rush e più inviti all’esplorazione. La pagina mobile misura circa 5.322 px, oltre sei viewport.

**Tag, categorie e collections.** Tag e collection offrono percorsi guidati utili e riducono il carico di una ricerca aperta. La tassonomia non è però governata dalla stessa source dei tool e Collections usa un layout mobile anche su desktop. Gli stati di unlock/review e i fallback editoriali richiedono un test E2E con dati reali.

**Editoriale.** Posts e collection possono costruire fiducia e portare a tool rilevanti; oggi fondono CMS, storage e seed legacy. Il percorso lettura → tool → save esiste, ma non è misurato e non ha una continuità di stato esplicita.

**Catalogo.** La ricerca e i filtri sono individuabili, ma un placement sponsor precede categorie e primi tool. L’utente che entra per scegliere viene prima interrotto dalla monetizzazione. La griglia a due colonne riduce leggibilità e porta le azioni vicino a nav/FAB.

**Search.** Fuse usa soglia 0,35 su nome, categoria, tag, short e long description. Cercando “Blink” sono comparsi anche risultati legati a “LinkedIn”. La ricerca archivio non sincronizza sempre lo stato con URL; la command palette usa un dataset differente e limitato.

**Tool detail.** La scheda contiene contesto, use case, disclosure affiliate e related. Usa però markup light repaintato dark, testo operativo molto piccolo e una source dati che può non includere tool del CMS.

**Shortlist.** Empty state e suddivisione visuale sono buoni. Il board attivo legge stage e note ma non permette realmente di aprire/modificare la nota; lo stage toggle completo non è montato.

**Compare.** Gli stati zero/uno tool sono buoni. La reveal animation è memorabile, ma precede la spiegabilità; il metodo può cambiare con l’ordine e la UI usa copy come vincitore o verdetto.

**Guest → account.** Il principio e la funzione di merge conservativa sono validi. Il problema è di integrazione: il merge legge chiavi diverse da quelle usate dai toggle attivi.

In modalità prelaunch, middleware intercetta anche /auth/callback se il browser che apre il magic link non possiede il cookie gate. Un link aperto in altro browser, webview o device può quindi perdere il percorso di callback. La policy del gate deve distinguere chiaramente accesso pubblico, callback auth e area protetta.

**Login e signup.** Il magic link riduce attrito e la callback ha recovery copy, ma login e creazione account condividono una catena la cui riuscita dipende da gate cookie, browser e attach del workspace. Devono essere certificati separatamente: stesso browser, altro browser, webview email, link scaduto, sessione già presente e rete fallita.

**Ritorno.** Il motivo più forte dovrebbe essere riprendere una decisione e vedere nuovi segnali. Oggi sono più visibili mission reset, XP e minigame; Decision Memory non produce una coda di ritorno.

**Ritorno autenticato.** Account e discovery persistence promettono continuità cross-session, ma sincronizzano un modello diverso dalle CTA attive. Finché il workspace non è unico, il returning-user flow può mostrare conteggi, shortlist e compare differenti rispetto alla sessione precedente.

### IA e navigazione

Header, bottom nav, footer e marketingStrings dichiarano insiemi differenti. Collections è primaria in alcuni punti e secondaria in altri; account state non modifica sempre il copy Accedi/Registrati; compare e saved count dipendono da uno store che il profilo non legge.

La IA target deve distinguere:

- **Scopri:** Home, Catalogo, Radar, Collections.
- **Decidi:** Salvati, Confronto, Decisioni.
- **Impara:** Post, Metodo.
- **Contribuisci/Business:** Community, Affiliati, Shop.
- **Account:** stato e sincronizzazione.

---

## 6. GUI / VISUAL SYSTEM AUDIT

### Verdetto

**Readiness GUI: 46/100.**

La firma dark cosmic è distinta e il gate dimostra buon controllo di composizione. Il sistema complessivo non è ancora governabile come un unico prodotto.

### Tipografia reale

- Quattro font globali: Manrope, Rubik, Inter, Fraunces.
- Lo storico usa Rubik; gate e brand usano Manrope/Rubik; target Figma impone Inter; Fraunces compare come display editoriale.
- Esistono almeno 249 occorrenze di testo arbitrario sotto 12 px.
- Le scale operative più comuni tra 0,62 e 0,74 rem sono troppo piccole per label ricorrenti su mobile.

**Target:** Inter per UI/body; Fraunces per heading editoriali selezionati; Rubik solo per brand, score e momenti system/game; eliminare il quarto ruolo sovrapposto.

### Colore reale

I token tv sono il candidato target, ma alcune combinazioni non raggiungono AA:

- muted #6e6e7e su superfici dark: circa 3,0–3,8:1;
- accent #8b5cf6 su elevated: circa 3,6:1;
- bianco su violetto primario: circa 4,23:1.

**Target:** base #0f0f12; raised #1a1a1e; elevated #25252b; ink #f3f3f7; secondary #a0a0b0; muted corretto a ≥4,5:1; focus cyan #06b6d4; status semantici con testo/icona.

### Spacing

Il codice usa utility Tailwind, valori arbitrari e sistemi locali. Non emerge un ritmo unico.

**Target:** 4, 8, 12, 16, 24, 32, 48, 64, 96; eccezioni documentate.

### Shape/elevation

- 176 radius distinti.
- 58 shadow arbitrarie quasi uniche.
- glass, blur e glow sono trattati come default, quindi gli elementi speciali perdono gerarchia.

**Target radius:** 6 micro; 10 control; 16 card/popover/sheet; 24 solo feature/hero; pill per chip/badge/CTA coerenti.  
**Target elevation:** rest; interactive; overlay; glow solo per live, selected o reward.

### Componenti

- **Button:** tre API concorrenti e molti raw button.
- **Card:** la primitive Card non è adottata; ogni route costruisce la propria.
- **Badge/chip:** Badge e PremiumBadge convivono con pill e chip locali.
- **Dialog/sheet/drawer:** primitive e custom modal hanno overlay e z-stack diversi.
- **Icone:** Lucide è una buona base; SVG search inline e logo 3D minuto sono eccezioni.
- **State:** showcase Figma contiene loading/empty/error, ma le route non usano un set canonico.

### Design system target

Fondazioni canoniche:

- token tv unici per color, typography, spacing, radius, elevation, motion e z-index;
- breakpoint 640, 768, 1024, 1280, 1536;
- z-index: base 0, content 1, sticky 10, nav 50, overlay 80, modal 90, toast 110, cursor/effects 120;
- Button, LinkButton, IconButton;
- Card default/interactive/feature;
- Badge e Chip semanticamente separati;
- Input, Select, Search;
- Dialog, Sheet, Drawer con un overlay contract;
- Tabs, Toast, EmptyState, ErrorState, LoadingState;
- Header, bottom nav e desktop navigation;
- ToolCard unica con varianti di presentazione.

---

## 7. DESIGN SYSTEM AUDIT

### Typography

| Area | Reale | Target release |
|---|---|---|
| Family | 4 font globali e ruoli sovrapposti | 3 ruoli espliciti |
| Scale | molte size arbitrarie, label <12px | 12, 14, 16, 18, 24, 32, 48+ |
| Weight | route-specific | semantic 400/500/600/700 |
| Line height | locale | body 1,5–1,7; heading 1,0–1,2 |
| Tracking | spesso alto anche su label piccole | solo eyebrow brevi |

### Color

| Ruolo | Target |
|---|---|
| Background | tv-bg-base |
| Surface raised/elevated | due soli livelli ordinari |
| Text | primary, secondary, muted AA |
| Border | subtle, interactive, focus |
| Accent | violetto principale; cyan focus/live |
| Status | success, warning, danger, info con icona/copy |
| Interactive | default, hover, active, selected, disabled |

### Interaction

Ogni componente interattivo deve avere:

- default;
- hover quando applicabile;
- pressed/tactile;
- selected/active;
- focus-visible;
- disabled;
- loading;
- success/error quando l’azione è asincrona;
- reduced-motion;
- touch target minimo 44 × 44 px.

### Stato di adozione

Il design system è **documentato implicitamente ma non applicato**. La route /dev/design-system rappresenta un target dimostrativo; le route reali bypassano le primitive. Il lavoro corretto è una adoption matrix per component family e vertical slice, non un ulteriore foglio globale.

---

## 8. FRONTEND ARCHITECTURE AUDIT

### Verdetto tecnico

**Readiness frontend: 38/100.**

### Architettura positiva

- Next App Router e TypeScript strict.
- Server Components e moduli server-only presenti.
- Repository Supabase separati per read/write in diverse aree.
- QueryClient e provider strutturati.
- Metadata route-level diffusi.
- Middleware admin con token firmato; gate firmato.
- Sanitizzazione Markdown con rehype-sanitize.

### Root defect 1 — doppio workspace

Le CTA ShortlistToggle e CompareToggle usano lib/stores/tool-workspace-store.ts e persistono in tooolvibes-tool-workspace. DiscoveryPersistenceProvider e AccountProvider sincronizzano invece le chiavi definite in lib/discovery/local-storage.ts.

Conseguenze:

- conteggi header/bottom nav e account possono divergere;
- login può non preservare i salvataggi effettivi;
- remote restore può scrivere dati che la UI non legge;
- Decision Memory e compare non condividono un unico schema.

### Root defect 2 — doppia fonte Tool

Home, Archivio, Tags e tool detail usano directoryTools statico. API, sitemap e admin usano getPublishedTools via Supabase/mock. Compare e Shortlist fanno merge/adattamento.

Conseguenze:

- un tool pubblicato dal CMS può non apparire nel catalogo;
- la sitemap può includere uno slug che il dettaglio statico restituisce 404;
- copy, score e campi variano per route;
- README descrive una single source of truth che non esiste più.

### Root defect 3 — global experience layer

RootProviders monta experience, motion, loader, sound, music, effects e palette. Marketing aggiunge Canvas 3D, Orbital, account e persistence. Root aggiunge gamification e intro.

Conseguenze:

- alto baseline JS;
- più listener e animation frame;
- overlay concorrenti;
- difficile isolamento degli errori;
- rischio batteria/INP su mobile.

### Root defect 4 — responsive CSS-only

Radar monta mobile view, desktop table e desktop nodes; Compare monta mobile e desktop view. CSS decide cosa mostrare, ma fetch, render e listener avvengono comunque.

### Root defect 5 — componenti sovradimensionati

Esempi:

- InteractionSoundLayerV2: circa 1.770 righe.
- ToolDiscoveryApp: circa 1.430 righe.
- TooolVibes directory data: circa 1.140 righe.
- Admin collections page: circa 1.149 righe.
- VibeTapMiniGame: circa 1.004 righe.
- AccountPanel: circa 894 righe.
- MobileCatalogView: circa 736 righe.
- MobileRadarView: circa 735 righe.

La dimensione non è di per sé un bug, ma qui segnala responsabilità, stato e interazioni accorpate.

### Dead/legacy code

Un’analisi statica ha individuato circa 67 moduli TS/TSX non raggiungibili dagli entrypoint app, da confermare per import dinamici. Candidati ad alta confidenza:

- vecchi SiteHeader/SiteFooter;
- GlobalExperienceLayerV2 non attivo;
- FounderControlCenter legacy;
- DesktopVibeWishlist marcato deprecated;
- stack compare/shortlist precedenti;
- ToolDiscoveryApp e DirectoryBrowser non attivi;
- componenti 3D e UI legacy.

### Hydration e runtime

Durante il rendering reale del coming soon è comparsa una hydration mismatch collegata a InputPrimitive in components/ui/input.tsx, con ID generati diversi tra server e client. Waitlist e gate non assegnano ID/label espliciti. È un release blocker finché non è riprodotto, corretto e coperto da test.

### Error boundary

app/error.tsx ha copy e reset utili, ma restituisce html/body pur non essendo app/global-error.tsx. La diagnosi unificata è: proteggere la UX di recovery, correggere la collocazione strutturale e testare errori SSR/client/reset.

### Listener leak

components/account/account-vibes-background.tsx aggiunge un callback resize anonimo e rimuove una funzione diversa. Il canvas esegue inoltre connessioni O(n²) a ogni frame.

### Documentazione drift

README afferma:

- un unico data access layer pubblico;
- copy e navigazione centralizzate;
- componenti riusabili anziché pagine monolitiche;
- merge guest-account senza perdita.

Queste promesse sono oggi solo parzialmente vere. Il README deve diventare un contratto verificato, non una descrizione storica.

---

## 9. MOBILE AUDIT

### Evidenza reale 390 × 844

**Coming soon**

- gerarchia chiara e focus singolo;
- CTA visibile;
- dark cosmic coerente;
- manca label form, disclosure privacy e live region;
- il badge dev “1 Issue” non è UI prodotto, ma segnala la hydration mismatch reale.

**Home**

- hero leggibile e brand forte;
- CTA catalogo e Radar chiare;
- header, bottom nav, Vibe Rush e compare badge competono nello stesso viewport;
- il primo viewport contiene più di un sistema di navigazione e una CTA flottante;
- home complessiva circa 5.322 px, quindi oltre sei viewport.

**Archivio**

- search e filtri sono evidenti;
- sponsor card domina prima di categorie e tool;
- la monetizzazione precede il job-to-be-done;
- griglia a due colonne comprime descrizioni e azioni;
- bottom nav e Vibe Rush coprono/avvicinano controlli delle ultime card.

### Thumb reach e safe area

Bottom nav e FAB sono raggiungibili, ma non coordinati. Il codice usa env(safe-area-inset-bottom), tuttavia:

- FAB e mission launcher hanno coordinate sovrapposte;
- FAB copre la zona del quinto item;
- sheet, nav e tastiera non hanno un’unica policy;
- z-index 50/80/90 rende la priorità dipendente dalla feature.

### Densità e leggibilità

- numerose label operative tra 0,62 e 0,74 rem;
- card catalogo troppo dense in due colonne;
- copy troncata prima di fornire differenze utili;
- troppe superfici glow/blur riducono il ritmo;
- placement sponsor sopra il contenuto riduce il valore above-the-fold.

### Input e tastiera

Non è stata verificata la tastiera virtuale su device fisico. Gate, search, auth e form devono essere testati con:

- viewport ridotta dalla tastiera;
- scroll-to-input;
- autofill;
- error message live;
- submit e recovery;
- sheet + keyboard.

### Diagnosi

TooolVibes non è semplicemente una desktop app ristretta: molte aree sono state progettate mobile. Il problema opposto è che i layer mobile sono diventati troppo numerosi e, in alcune route, sono stati promossi anche a desktop senza una seconda composizione.

---

## 10. DESKTOP AUDIT

### Confidenza

Il gate pubblico è stato visto a 1440 × 900. Le route interne non sono state catturate in modo affidabile a laptop/desktop; le conclusioni seguenti sono architetturali e devono essere validate nel Batch QA dedicato.

### Problemi verificati dal codice

- Archivio delega a MobileCatalogView anche desktop.
- Shortlist monta MobileShortlistBoard su tutte le viewport.
- Collections monta MobileCollectionsView su tutte le viewport.
- Compare e Radar montano DOM mobile e desktop contemporaneamente.
- header desktop include search, sound, music, profilo/game e CTA, con rischio chrome affollato.
- il catalogo statico e i layout route-specific hanno max-width e card systems differenti.

### Implicazioni

- spazio orizzontale non sfruttato per confronto, shortlist e filtri persistenti;
- IA desktop ridotta a un adattamento della bottom-navigation logic;
- hover e keyboard non diventano veri acceleratori;
- la matrice Compare è potente ma circondata da CSS hard guard;
- view desktop può pagare il costo della view mobile nascosta e viceversa.

### Target desktop

- Catalogo: filtri persistenti o panel laterale, griglia leggibile e dettagli progressivi.
- Salvati: board/lista con stage, note e compare side panel.
- Compare: matrice ampia, objective selector, evidenze e decision action senza reveal obbligatoria.
- Radar: una sola query, table/visual con densità adeguata.
- Max-width coerenti e line length controllata.
- Keyboard shortcut documentati e focus order logico.

---

## 11. GAMIFICATION AUDIT

### Verdetto

**Production readiness gamification: 24/100.**

Qualità visuale/micro-feedback: 68/100.  
Valore per la decisione: 34/100.  
Continuità guest/account: 18/100.  
Robustezza funzionale: 20/100.  
Integrità reward/ranking: 10/100.

### Due loop concorrenti

**Loop utile target:** Discovery → Save → Qualifica → Compare per obiettivo → Decision Memory → Ritorno.  
**Loop visibile:** Vibe Rush → tap/combo → score/XP → livello/badge/missione → ripeti.

Il secondo è più rifinito del primo, ma non riduce l’incertezza sulla scelta.

### Risposte alle 11 domande

1. **Perché tornare domani?** Oggi soprattutto per Radar/Product Hunt; mission reset e streak sono visibili ma non affidabili. Motivo di ritorno 25/100.
2. **Loop principale?** Non è unico. Decision workspace e gioco competono.
3. **Progressione percepita?** Visivamente sì; causalmente no. Percezione 65/100, credibilità 20/100.
4. **Salvare genera valore futuro?** Solo sul browser e parzialmente; note/stage/outcome non sono realmente utilizzabili. 35/100.
5. **Shortlist e Compare lavorano insieme?** Condividono Zustand ma non chiudono il task né il ritorno della decisione. 45/100.
6. **Decision Memory chiude il loop?** No; editor non montato e Compare non registra outcome. 15/100.
7. **Feature unificabili?** visited, saved, stage, note, compare, objective, decision, prediction, XP e badge possono diventare un Decision Journey.
8. **Score chiaro?** No; esistono più motori e nessuna definizione canonica.
9. **Score genera fiducia?** No; precisione /100 e copy “verdetto” sovra-comunicano certezza.
10. **Reward elegante?** Sì: confronto pronto, decisione documentata, test completato, recap e reminder; non volume di tap.
11. **Cosa rende memorabile il prodotto?** Curatela italiana, Radar, confronto spiegabile e memoria personale; non un clicker.

### Difetti funzionali e di integrità

- Missioni create con progress 0, senza updater di progresso/completed trovato nel repository.
- recordGameInteraction accetta XP delta dal client fino a 10.000 e usa service role.
- RPC claim_mission e claim_hidden_signal accettano user ID senza verifica auth.uid adeguata.
- hidden signal confronta valori influenzabili dal client.
- game_profiles consente update own profile; grant/revoke effettivi devono essere verificati.
- Arena assegna XP senza idempotenza/cooldown.
- Compare corrente non usa l’Arena backend già esistente.
- Radar prediction resolver usa un fallback hash TODO, non un delta reale.
- leaderboard aggrega solo alcune fonti XP e non rappresenta il totale.
- Vibe Rush promette salvataggio post-signup senza una pending run server-verificata.
- mission FAB e Vibe Rush FAB condividono quasi la stessa area.

### Essenziale pre-lancio

- unificare workspace;
- spegnere o completare missioni/XP/leaderboard;
- rendere ogni reward server-authoritative, idempotente e rate-limited;
- correggere RPC/RLS;
- riattivare Decision Memory reale;
- sostituire winner /100 con dimensioni spiegabili;
- collegare Compare → Decision;
- un solo engagement entry point globale;
- test di tampering, double claim, merge e scheduled jobs.

### Post-lancio

- recap “riprendi da dove eri”;
- reminder dopo 7/14 giorni;
- Radar personalizzato sui tool salvati;
- badge semantici e rari;
- cronologia decisioni;
- digest settimanale personale;
- objective selector dopo revisione metodologica.

### Esperimenti futuri

- decision confidence prima/dopo il confronto;
- shortlist health;
- watchlist con cambiamenti del tool;
- confronti condivisibili con motivazione;
- social proof opt-in con metodologia e sample size;
- collection completion sobria.

Da evitare: battle pass, shop cosmetico, PvP, power card e altri minigame prima che il decision loop sia solido.

---

## 12. ACCESSIBILITY AUDIT

### Elementi positivi da proteggere

- Skip link verso main-content e main focusabile.
- Numerosi aria-label, aria-pressed e focus-visible.
- Intro e confetti considerano prefers-reduced-motion.
- Vibe Rush ha focus trap, Escape, focus restore e live announcement.
- Gli stati zero/uno tool di Compare sono comprensibili.
- Diversi form usano aria-invalid e aria-describedby.

### Problemi critici

| Area | Evidenza | Impatto | Priorità |
|---|---|---|---|
| Gate modal | components/coming-soon/gate-modal.tsx | Nessun role dialog, aria-modal, focus trap, Escape, restore focus o label input | P1 |
| Waitlist | components/coming-soon/waitlist-form.tsx | Placeholder al posto di label; messaggio non live | P1 |
| Note sheet | components/tools/mobile-shortlist-board.tsx | Nessuna semantica dialog/focus management; close senza nome; inoltre irraggiungibile | P1 |
| Bottom nav badge | components/layout/mobile-bottom-nav.tsx | Count dentro parent aria-hidden, non annunciato | P2 |
| Motion globale | ParticleField e layer vari | Nessun capability/reduced-motion uniforme | P1 |
| Raw controls | 138 button, 108 input, 24 select | Stati e label non garantiti da primitive | P2 |
| Contrast | muted/accent su surface | Alcune combinazioni sotto 4,5:1 | P1 |
| Test | nessun axe/keyboard E2E | Copertura sconosciuta | P1 |

### Acceptance minima

- zero violazioni axe critical/serious sulle route core;
- flusso completo solo tastiera;
- focus trap, Escape e restore focus su ogni overlay;
- label programmatiche e live error;
- contrasto AA per testo operativo;
- touch target almeno 44 × 44 px;
- motion e audio opt-out persistente;
- nessun contenuto essenziale solo hover o solo colore.

---

## 13. PERFORMANCE AUDIT

### Build evidence

| Route | First Load JS |
|---|---:|
| / | 421 kB |
| /archivio | 417 kB |
| /radar | 407 kB |
| /account | 300 kB |
| /shortlist | 241 kB |
| /toools/[slug] | 190 kB |
| /compare | 179 kB |
| Shared | 102 kB |

Altri segnali:

- CSS principale generato: circa 982,4 kB non compresso.
- OpenNext dry-run: 14.223,50 KiB upload / 2.737,16 KiB gzip.
- Wrangler dry-run segnala una chiave popupElement duplicata nel bundle generato.
- Quattro famiglie Google font sono caricate globalmente.
- Lint segnala 9 occorrenze `no-img-element` e 7 `no-unused-vars`.

### Rischi strutturali

- sette layer client in RootProviders;
- Canvas 3D e Orbital globali;
- intro e gamification in root;
- mobile e desktop montati insieme in Radar/Compare;
- Radar può eseguire la stessa chiamata in tre consumer;
- ParticleField usa window durante render, anima continuamente e non ha una policy reduced-motion;
- account background ha un listener leak e connessioni O(n²);
- analisi statica: 79 addEventListener e 46 requestAnimationFrame nel repository, inclusi moduli legacy;
- InteractionSoundLayerV2 concentra 1.770 righe e molti listener.

### Cosa non è stato misurato

Non sono disponibili valori reali LCP, INP, CLS, long tasks, memory, battery o throughput su device. Quindi non viene dichiarato che i CWV falliscono: viene dichiarato che la release non possiede ancora una baseline e che il rischio di fallimento è alto.

### Budget target

- LCP p75 mobile ≤ 2,5 s.
- INP p75 ≤ 200 ms.
- CLS p75 ≤ 0,1.
- Nessun long task >50 ms nei flow core senza motivazione.
- Nessuna doppia query identica per route.
- Massimo un Canvas globale; zero con reduced motion.
- Animazioni sospese su visibilitychange/offscreen.
- Budget route-specific misurato in CI.

---

## 14. TECHNICAL DEBT MAP

### P0 — BLOCKER

| ID | Debito | Dove | Esito richiesto |
|---|---|---|---|
| TD-P0-01 | Workspace CTA e sync scollegati | store, discovery, account | Un solo schema/store + migrazione |
| TD-P0-02 | Fonti Tool incompatibili | directory, public-tools, sitemap, pages | Repository canonico |
| TD-P0-03 | XP/RPC abusabili | gamification actions + SQL | Reward server-authoritative |
| TD-P0-04 | Missioni non completabili | reset function/migrations | Pipeline eventi o feature off |
| TD-P0-05 | Compare score/order non affidabile | tool-battle-shared | Metodo spiegabile |
| TD-P0-06 | Fresh DB non riproducibile | migration 0023 duplicate, waitlist assente | Migration lineare e reset test |
| TD-P0-07 | Gate blocca crawler/public release | middleware | Flag/off switch verificato |
| TD-P0-08 | Hydration mismatch public form | UI Input/Waitlist | Zero mismatch |
| TD-P0-09 | Dipendenza Next vulnerabile | package/lock | Patch sicura e regression test |

### P1 — CRITICAL

| ID | Debito | Dove | Esito richiesto |
|---|---|---|---|
| TD-P1-01 | Rate limit/revoca in-memory | auth/admin/gate | Storage distribuito |
| TD-P1-02 | Endpoint pubblici senza anti-abuse durevole | waitlist/tool/affiliate | Limiti + Turnstile/honeypot |
| TD-P1-03 | Insert anon aggira validazione API | RLS requests | Policy/funzione controllata |
| TD-P1-04 | Error boundary strutturalmente errato | app/error.tsx | boundary corretta e test |
| TD-P1-05 | CSS append-only | 45k righe globali | Migrazione vertical slice |
| TD-P1-06 | Responsive doppio mount | Radar/Compare | render esclusivo |
| TD-P1-07 | Desktop su componenti mobile | catalog/shortlist/collections | layout desktop intenzionale |
| TD-P1-08 | Overlay/z-index non canonico | header/dialog/sheet/FAB | overlay contract |
| TD-P1-09 | Decision Memory latente | shortlist/workspace | editor e outcome reali |
| TD-P1-10 | Global experience senza budget | root/layout | capability policy |
| TD-P1-11 | Nessun E2E/CI quality | test/workflow | gate automatici |
| TD-P1-12 | Legal incompleto | privacy/cookie/terms | approvazione competente |
| TD-P1-13 | Analytics/error tracking assenti | app/config | funnel e alert minimi |

### P2 — IMPORTANT

- 67 moduli potenzialmente non raggiungibili, da confermare.
- Header/footer/global experience e compare stack duplicati.
- 712 inline style.
- 138 button, 108 input e 24 select raw.
- 62 query media distinte; molti breakpoint quasi duplicati.
- quattro font globali.
- ricerca Fuse troppo permissiva e non sempre URL-driven.
- command palette con dataset differente dal catalogo.
- IA/copy duplicati.
- README e contesto non allineati al runtime.
- dipendenze probabilmente inutilizzate: Floating UI, Hookform resolver, React Hook Form, GSAP React; confermare prima di rimuovere.
- @emnapi/runtime extraneous.
- SEO/social image incomplete.
- sitemap usa now per pagine statiche e omette route rilevanti.

### P3 — POLISH

- Chiudere i 16 warning lint e imporre zero warning.
- Uniformare icona search.
- Ridurre hover lift/glow generici.
- Portare label bottom nav ad almeno 12 px reali.
- Rendere gate, error e app coerenti nella stessa identità.
- Correggere microcopy, accenti e terminologia archivio/catalogo/salvati.

### P4 — POST-LAUNCH

- fine-grained bundle splitting oltre i budget minimi;
- motion avanzato route-specific;
- personalization Radar;
- cronologia e condivisione decisioni;
- badge/progress dashboard;
- ulteriori temi e raffinatezze 3D.

---

## 15. PRODUCTION READINESS MATRIX

| Area | Stato | Motivo |
|---|---|---|
| Product | BLOCKER | Core loop non chiuso; pubblico dietro gate |
| UI | NEEDS WORK | Identità forte, sistema non canonico |
| UX | BLOCKER | Save/account e Decision Memory non affidabili |
| Frontend | BLOCKER | Doppio store/source e runtime mismatch |
| Responsive | NEEDS WORK | Mobile/desktop strategy incoerente |
| Accessibility | NEEDS WORK | Overlay, label, contrasto e test |
| Performance | BLOCKER | Baseline pesante e CWV non misurati |
| Auth | BLOCKER | Handoff non copre le CTA reali; callback può essere intercettata dal gate |
| Error handling | NEEDS WORK | Boundary errata, recovery non sistematica |
| Loading states | NEEDS WORK | Presenti solo su alcune route |
| Empty states | READY | Core flow ben coperti staticamente; resta la QA di regressione |
| Network failure | NEEDS WORK | Buoni fallback locali, pochi test/retry |
| Edge case | BLOCKER | Merge, multi-tab/device e storage non testati |
| Data consistency | BLOCKER | Tool e workspace con doppie fonti |
| SEO | BLOCKER | Gate blocca crawler e sitemap |
| Metadata | NEEDS WORK | Buona base, canonical/social incompleti |
| Social preview | NEEDS WORK | Nessuna OG/Twitter image dedicata |
| Analytics | BLOCKER | Nessuna tassonomia/funnel |
| Privacy | BLOCKER | Informativa insufficiente per release |
| Cookie | BLOCKER | Nessun inventario/retention/consent model |
| Legal | BLOCKER | Termini essenziali non completi |
| Security frontend/API | BLOCKER | XP, anti-abuse, RLS, headers, dipendenze |
| Environment | BLOCKER | Runtime locale fuori contratto; schema incompleto |
| Logging | NEEDS WORK | Console/trace non uniformi |
| Monitoring | NEEDS WORK | Observability Cloudflare attiva, SLI/alert assenti |
| Error tracking | BLOCKER | Nessuna integrazione/source map/alert |
| Deployment | NEEDS WORK | Build passa, pipeline/rollback non automatizzati |
| QA | BLOCKER | 19 unit test, nessun E2E |
| Cross-browser | UNKNOWN | Nessuna matrice |
| Mobile device | UNKNOWN | Nessun device fisico |

### Risultati di verifica

| Controllo | Esito |
|---|---|
| git status | Nessun codice app modificato; soltanto i tre deliverable di audit non tracciati |
| Typecheck | PASS |
| Vitest | 19/19 PASS, 3 file |
| ESLint | PASS con 16 warning |
| Next production build | PASS |
| OpenNext Cloudflare build | PASS |
| Wrangler dry-run | PASS con warning popupElement duplicato |
| Route smoke autenticato gate | Route core 200; redirect legacy previsti |
| Route smoke senza gate | Route pubbliche, robots e sitemap redirect a / |
| npm audit omit dev | 17 vulnerabilità: 9 high, 6 moderate, 2 low |
| npm outdated | Patch disponibili, incluso Next 15.5.20 |
| Ambiente locale | Node 24/npm 11; contratto repo Node 22/npm 10 |

L’audit dipendenze richiede triage di applicabilità, ma la versione diretta Next 15.5.15 è esplicitamente compresa in advisory corrette nelle patch 15.5.x successive.

---

## 16. ROOT CAUSES

### RC-01 — Nessuna single source of truth di dominio

Tool, workspace, score e navigazione hanno più rappresentazioni. Questo genera inconsistenza funzionale, non solo duplicazione tecnica.

### RC-02 — Migrazioni UI aggiunte come repaint

Ogni nuova direzione visuale è stata sovrapposta alla precedente tramite global CSS e !important invece di migrare componenti e ritirare lo strato vecchio.

### RC-03 — Feature verticali senza owner del core loop

Radar, Compare, Shortlist, Decision Memory, account e gamification sono state ottimizzate singolarmente. Nessuno strato garantisce il percorso completo Scopri→Decidi→Ricorda.

### RC-04 — Mobile e desktop non hanno un contratto comune

Alcune feature duplicano gli alberi; altre usano componenti mobile ovunque. Breakpoint, z-index, safe area e overlay sono decisi localmente.

### RC-05 — Teatralizzazione prima dell’integrità

Winner, score /100, XP, missioni e streak comunicano certezza e progresso prima che dati, autorità server, eventi e test siano affidabili.

### RC-06 — Nessuna release baseline automatica

Build manuale disponibile, ma niente CI quality, E2E, screenshot regression, fresh DB test, cross-browser matrix, analytics o error tracking.

### RC-07 — Documentazione storica non più contrattuale

README e contesto descrivono architetture target già superate, quindi nuove iterazioni possono basarsi su assunzioni false.

---

## 17. TOP 20 PROBLEMS

| # | Severità | Problema | Cosa / dove / perché / come |
|---:|---|---|---|
| 1 | P0 | Workspace doppio | CTA in Zustand; sync in local-storage diverso. Unificare schema/store e migrare senza perdita. |
| 2 | P0 | Tool source doppia | directoryTools vs Supabase/mock. Creare repository canonico e adapter. |
| 3 | P0 | XP e RPC abusabili | Delta client/service role/RPC user ID. Eventi tipizzati, auth, idempotenza, limiter. |
| 4 | P0 | Missioni non completabili | Reset crea progress 0 senza updater. Implementare pipeline o spegnere. |
| 5 | P0 | Compare non affidabile | Score include hash/order e copy winner. Rubriche spiegabili per obiettivo. |
| 6 | P0 | Decision Memory non usabile | Model presente, editor non montato. Rendere note/stage/outcome first-class. |
| 7 | P0 | Schema non riproducibile | Due migration 0023 e waitlist assente. Riparare history e test DB vuoto. |
| 8 | P0 | Dipendenza Next vulnerabile | Patch disponibile. Upgrade controllato e regression completa. |
| 9 | P1 | Hydration mismatch sul gate | Input Base UI senza ID stabile. Fix e console E2E. |
| 10 | P1 | Gate blocca SEO/auth/release | Middleware intercetta crawler e callback senza cookie. Feature flag, auth allowlist e smoke. |
| 11 | P1 | CSS append-only | 45k righe e 3.584 important. Migrazione vertical slice. |
| 12 | P1 | Responsive doppio mount | Radar/Compare montano entrambi. Boundary esclusivo + query condivisa. |
| 13 | P1 | Mobile component su desktop | Catalogo/shortlist/collections. Layout desktop intenzionale. |
| 14 | P1 | Layer globali sovrapposti | 3D, orbital, sound, missioni, FAB, nav. Capability e feedback budget. |
| 15 | P1 | Endpoint pubblici abusabili | Limiter in-memory/assenza captcha/RLS open insert. Durable anti-abuse. |
| 16 | P1 | Legal insufficiente | Tre pagine minime. Revisione competente prima della raccolta dati. |
| 17 | P1 | Nessun CI/E2E | Solo 19 unit test. Gate di release completo. |
| 18 | P1 | Performance baseline alta | 407–421 kB First Load sulle route core; CSS 982 kB. Budget e lazy loading. |
| 19 | P1 | Overlay/a11y incoerenti | Gate/note sheet/z-index. Primitive canoniche e axe/keyboard. |
| 20 | P1 | Release cieca | Analytics/error tracking/SLI assenti. Telemetria minima privacy-aware. |

---

## 18. WHAT SHOULD NOT BE CHANGED

1. **Posizionamento editoriale italiano e selettivo.**
2. **Identità cosmic dark, violetto/cyan e linguaggio Radar/orbita.**
3. **Principio guest-first:** l’utente deve poter salvare e confrontare senza onboarding obbligatorio.
4. **Merge conservativo:** la logica di merge è valida; va collegata allo store corretto.
5. **App Router, TypeScript strict e separazione server/client.**
6. **RLS e server-only per mutazioni sensibili**, correggendo le eccezioni.
7. **Cookie firmati gate/admin e bcrypt admin.**
8. **Sanitizzazione Markdown.**
9. **Skip link, focus-visible e reduced-motion già presenti.**
10. **Empty state Compare e Shortlist.**
11. **Fallback Product Hunt con timeout/cache.**
12. **Disclosure affiliate sulle schede.**
13. **Bottom nav core:** Home, Catalogo, Radar, Salvati, Confronto.
14. **Metafora Battle**, se resa spiegabile e non assoluta.
15. **Configurazione OpenNext/Cloudflare**, che costruisce correttamente.

---

## 19. WHAT SHOULD BE REMOVED

Solo dopo verifica import, build e visual regression:

- vecchi SiteHeader e SiteFooter;
- GlobalExperienceLayerV2 o V1 non scelto, mantenendone uno solo;
- FounderControlCenter legacy;
- DesktopVibeWishlist deprecated;
- vecchi CompareBoard/UnifiedCompareBoard/desktop compare non attivi;
- DirectoryBrowser e ToolDiscoveryApp se confermati non raggiungibili;
- header legacy ancora renderizzato in MobileShortlistBoard;
- alias admin /admin/new e /admin/[id]/edit dopo redirect/migrazione;
- CSS hard guard relativo a ogni componente già migrato;
- dipendenze senza consumer confermate;
- @emnapi/runtime extraneous;
- missioni/leaderboard/XP pubblici dal launch scope se non completati;
- Vibe Rush FAB globale se resta un Easter egg.

Non rimuovere mock e fallback prima di definire content bootstrap, staging e failure policy.

---

## 20. WHAT SHOULD BE CONSOLIDATED

- Tool type, repository e adapter.
- Workspace save/compare/stage/note/pin/decision.
- Account sync e local storage migration.
- Compare engine e terminology.
- Event model gamification.
- Navigation/IA e stato account.
- Token background/surface/text/border/accent/status.
- Font e typography roles.
- Spacing, radius, shadow e motion.
- Button, LinkButton, IconButton.
- Card e ToolCard.
- Badge, chip, pill e status.
- Dialog, Sheet, Drawer, modal e overlay stack.
- Breakpoint, safe area e z-index.
- Empty/loading/error states.
- Search catalogo e command palette.
- Feedback toast/audio/confetti/reward.

---

## 21. WHAT SHOULD BE REBUILT

Con scope controllato, non come redesign generale:

1. **Persistenza workspace:** un solo schema con migrazione versionata.
2. **Tool repository:** un data layer canonico per CMS, catalogo, detail, API e sitemap.
3. **Compare contract:** objective, dimensioni, evidenze, confidence e decision action.
4. **Decision Memory surface:** stage, reason, note, outcome, data e revisit.
5. **Reward backend:** eventi server-authoritative o rimozione dal launch scope.
6. **Compare visual shell/CSS:** baseline unica, conservando la metafora.
7. **ToolCard responsive:** una shell con varianti esplicite.
8. **Overlay system:** un solo stack e focus contract.
9. **Responsive boundary:** render esclusivo, query condivise.
10. **Release pipeline:** CI, E2E, fresh DB, preview, smoke, rollback.

---

## 22. RISKS

| Rischio | Probabilità | Impatto | Mitigazione |
|---|---|---|---|
| Perdita salvataggi al login | Alta | Molto alto | Migrazione dual-read/dual-write temporanea + E2E |
| CMS pubblica URL 404 | Alta | Alto | Contract test Tool repository |
| XP/leaderboard manipolati | Alta se pubblici | Alto | Feature off o server authority |
| Cleanup CSS rompe route lontane | Alta | Alto | Vertical slice + screenshots |
| Gate rimosso prima di hardening | Media | Molto alto | Go-live checklist e flag |
| Legal non approvato | Alta | Alto | Owner competente prima raccolta |
| Performance bassa su mobile reale | Media-alta | Alto | Budget, device test, capability gates |
| Fix responsive causa hydration | Media | Alto | Fallback SSR stabile e E2E |
| Upgrade dipendenze regressivo | Media | Medio-alto | Patch isolate e regression |
| Scope creep verso redesign | Alta | Medio | Batch atomici e do-not-touch |
| Gamification distrae dal value | Alta | Alto | Priorità al decision loop |
| Dati/cron non riproducibili | Alta | Alto | Fresh staging reset e runbook |
| Osservabilità insufficiente al lancio | Alta | Alto | Error tracking + synthetic |

---

## 23. FINAL ASSESSMENT

### Stato generale

TooolVibes è **feature-rich, distintivo e compilabile**, ma **non ancora governato come un unico prodotto production-ready**.

La UI non deve essere ricominciata. Il brand non deve essere semplificato in un template. Il lavoro ad alto valore è rendere canonici i domini che oggi divergono e far seguire alla UI la stessa struttura.

### Decisione go/no-go

**NO-GO pubblico oggi.**

Il passaggio a GO richiede almeno:

- P0 chiusi;
- P1 security/data/auth/QA chiusi;
- Build Next/OpenNext pulite;
- E2E guest/account/core loop verdi;
- migration fresh DB verde;
- zero errori console/hydration;
- gate disattivato tramite config controllata;
- legal approvato;
- error tracking e analytics minimi attivi;
- QA reale mobile, desktop e cross-browser.

### Synthesis specialistica

I problemi citati da più agenti convergono su tre sistemi:

1. **Integrità del dominio:** tool, workspace, reward e score.
2. **Governance della UI:** design system, responsive, overlay e component ownership.
3. **Governance della release:** schema, security, CI, osservabilità e legal.

Le apparenti contraddizioni sono state risolte così:

- il merge account è da proteggere, ma oggi riceve lo snapshot sbagliato;
- l’error recovery è utile, ma il boundary è collocato/strutturato male;
- intro e motion rispettano in parte reduced-motion, ma il time-to-value resta eccessivo;
- la gamification è visivamente forte, ma non affidabile come progressione;
- il gate è una buona esperienza prelaunch, ma deve essere separato dal comportamento release.

### Definition of Done pubblicabile

TooolVibes può essere dichiarato pubblicabile solo quando tutti i criteri seguenti sono verificati:

#### Build e ambiente

- npm ci da clone pulito nell’ambiente Node 22/npm 10 dichiarato.
- lint con zero warning.
- typecheck pulito.
- unit/integration test verdi.
- Next build verde.
- OpenNext Cloudflare build e Wrangler dry-run senza warning non accettati.
- nessuna vulnerabilità high/critical applicabile non mitigata.

#### Dati e core loop

- un solo Tool repository canonico.
- ogni slug pubblicato apre catalogo/detail/API/sitemap coerenti.
- un solo workspace per save, compare, stage, note, pin e decision.
- migrazione delle vecchie chiavi non distruttiva.
- guest salva due tool, confronta, annota, crea account e ritrova lo stato su un secondo browser.
- logout, account esistente, multi-tab e network failure non causano perdita/duplicazione.
- Compare non cambia con l’ordine e non mostra certezza senza evidenza.
- Decision Memory è creabile, modificabile, recuperabile e chiude Compare.

#### UI, responsive e accessibilità

- nessun horizontal overflow a 320, 360, 390, 412, 768, 1024, 1440 e 1920 px.
- nessuna collisione tra header, bottom nav, FAB, sheet, modal e tastiera.
- un solo albero responsive attivo per Radar e Compare.
- componenti core canonici adottati nelle route core.
- nessun duplicato critico o legacy renderizzato e nascosto.
- tutti gli interactive element hanno default, hover, active, focus, disabled e loading dove applicabile.
- axe senza critical/serious.
- keyboard, focus trap/restore, Escape e live errors verificati.
- target touch ≥44 × 44 px.
- contrasto AA e reduced-motion/audio opt-out.

#### Stati e affidabilità

- loading, empty, error e network failure per ogni flow core.
- timeout/offline/401/403/404/409/429/500/503 testati.
- zero errori console, hydration mismatch e warning React rilevanti.
- global/segment error boundary testati.

#### Performance

- LCP p75 ≤2,5 s, INP p75 ≤200 ms, CLS p75 ≤0,1 su mobile reale.
- nessuna doppia query identica per route.
- Canvas/motion sospesi offscreen e con reduced motion.
- bundle e CSS rispettano budget approvati.

#### Security, schema e release

- tutte le migration partono su DB vuoto e sono applicabili a staging esistente.
- waitlist, edge function e schedule sono versionati.
- reward server-authoritative, idempotenti e rate-limited oppure feature disattivate.
- endpoint pubblici con limiti payload, anti-abuse e RLS non aggirabile.
- sessioni/revoche/rate limit distribuiti.
- security header verificati.
- nessun secret nel client/repository.
- gate off per public, robots e sitemap 200; admin/auth protetti.

#### Legal e operazioni

- Privacy, Cookie e Termini approvati e datati.
- inventory cookie/localStorage e consent policy coerenti con analytics.
- event taxonomy minima: search, tool view, save, compare, decision, signup, return.
- error tracking con source map, release ID e alert.
- synthetic checks home/catalogo/auth/API.
- smoke Chrome, Firefox, Edge, Safari desktop; Safari iOS e Chrome Android su device reali.
- runbook deploy, migration, rollback e incident response provato in staging.

### Prossimo passo

Eseguire il Batch 01 della roadmap: congelare baseline, pin dell’ambiente, inventario di flag e matrice screenshot/console. Non iniziare dal CSS o dal redesign.
