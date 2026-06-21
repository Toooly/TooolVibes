# TooolVibes — Audit Tecnico Completo (Read-Only)

**Progetto:** `tooolvibes-app-main`  
**Stack:** Next.js 15.5.15, React 19, TypeScript 5.8, Tailwind CSS 4.1, Supabase, Cloudflare Workers (opennextjs-cloudflare).  
**Modalità:** esclusivamente audit / review / analisi. Nessun file è stato modificato, creato, cancellato, formattato o patchato. Nessun build, lint, install, deploy, commit o query eseguito.  
**Data audit:** 2026-06-20.

---

## A. EXECUTIVE SUMMARY

### Stato generale
Il progetto è un’applicazione Next.js ad alto contenuto visivo/animato con due aree ben distinte: il **fronte marketing** (catalogo tool, raccolte, radar, gamification, affiliate) e il **pannello admin** (gestione contenuti, tool, collection, editorial, affiliate). Il codice mostra segni di un’evoluzione rapida e iterativa: molte feature sono state rifattorizzate lasciando le versioni precedenti nel repo, il CSS globale è cresciuto in modo incontrollato fino a ~30.000 righe, e ci sono **più sistemi di persistenza dati in competizione** (mock locali, directory statica, Supabase, discovery workspace locale/remoto).

### Gravità complessiva
**Media-Alta / Alta.** Ci sono problematiche di **sicurezza critiche** nel layer admin (middleware che non valida il token, password legacy in chiaro, token stateless non invalidabile) e nel layer pubblico (endpoint che scrivono con service role, RPC gamification esposte, API discovery senza autenticazione). A queste si aggiungono problemi di **affidabilità dei dati** (fallback a mock in produzione, doppia sorgente dati, logica demo/hash) e di **performance/accessibilità** (CSS monolitico, layer WebGL/animazioni always-on, touch target piccoli, reduced motion ignorato).

### Aree più rischiose
1. **Autenticazione e autorizzazione admin** — la protezione è a strati, ma il primo strato (middleware) è bypassabile e ci sono fallback insicuri.
2. **Supabase / dati** — uso della service role key per endpoint pubblici, RPC troppo permissive, RLS incompleta su tabelle di transizione/workspace, mock attivi come fallback.
3. **Frontend globale** — componenti montati su ogni pagina che consumano CPU/GPU e possono coprire contenuti (sfondo 3D, orbital layer, cursor custom, grain, sound layer).
4. **Architettura dati** — coexistenza di `lib/data/tooolvibes-directory.ts`, `lib/data/public-tools.ts` (Supabase/mock) e store locali; rischio di inconsistenze.
5. **CSS / bundle** — `app/globals.css` da ~30k righe, import statico di Three.js nel logo, font caricati in massa.

### Cosa sembra rotto davvero
- Il **middleware admin** può essere bypassato con un cookie qualsiasi (anche se le route protette interne hanno un secondo controllo).
- Il **login admin** accetta password in chiaro come fallback e, se non configurato correttamente, usa un `fallback-dev-secret` hardcoded per firmare i cookie.
- Le **API pubbliche** `/api/tool-requests` e `/api/affiliate-requests` inseriscono dati in Supabase usando la **service role key**, bypassando RLS e permettendo campi riservati.
- Le **RPC gamification** (`record_game_interaction`, `award_badges`) sono chiamabili direttamente da utenti autenticati per gonfiare XP/sbloccare badge.
- `/api/discovery-state` (GET/PUT) e `/api/discovery-account/release` operano senza autenticazione, permettendo creazione/scrittura arbitraria di profili guest e workspace.
- Il sito **fallisce silenziosamente su dati mock** se Supabase è vuoto o non configurato, mostrando contenuti fittizi in produzione.
- Il **footer V2** ha link legali (`Privacy`, `Termini`, `Cookie`) renderizzati come `<span>` non cliccabili.
- L’**intro mobile** blocca lo scroll per 8 secondi e impone uno sfondo scuro globale.

### Cosa sembra solo migliorabile
- Pulizia dei componenti legacy v1/v2 e dei file demo/sperimentali.
- Refactor del CSS globale in moduli per feature.
- Completamento metadata SEO per pagine marketing.
- Unificazione della sorgente dati catalogo.
- Miglioramento touch target, contrasti e reduced motion.

---

## B. BUG CRITICI

### B.1 — Middleware admin bypassabile con cookie qualsiasi
- **Gravità:** Critical
- **File:** `middleware.ts` (r. 32-34)
- **Componente/pagina:** tutte le route `/admin/:path*`
- **Descrizione tecnica:** il middleware controlla solo l’esistenza del cookie `tooolvibes_admin` (`request.cookies.has(adminCookieName)`), non ne verifica firma, scadenza o contenuto. Un cookie con valore arbitrario bypassa il primo strato di protezione.
- **Impatto pratico:** accesso non autorizzato alle pagine statiche e agli asset sotto `/admin` che non chiamino `requireAdminSession`. Anche se le route protette hanno un secondo controllo, la difesa in profondità è compromessa.
- **Causa probabile:** scelta di evitare logica asincrona nel middleware.
- **Evidenza:**
  ```ts
  if (!request.cookies.has(adminCookieName)) {
    return NextResponse.redirect(getRedirectUrl(request, "/admin/login"));
  }
  return NextResponse.next();
  ```
- **Come verificarlo:** inviare `GET /admin` con header `Cookie: tooolvibes_admin=1` e osservare l’assenza di redirect.
- **Rischio se non corretto:** bypass parziale della protezione admin, indicizzazione/errori di pagine protette, esposizione di informazioni.
- **Fix consigliato:** rendere il middleware `async` e usare `verifySessionToken` da `lib/admin/session.ts` per validare il token prima di proseguire.

### B.2 — Password admin in chiaro come fallback e derivazione del session secret
- **Gravità:** Critical
- **File:** `lib/admin/session.ts` (r. 41-49, 170-188)
- **Componente/pagina:** login admin
- **Descrizione tecnica:** se `TOOOLVIBES_ADMIN_PASSWORD_HASH` non è presente o non inizia con `$2`, il sistema usa `TOOOLVIBES_ADMIN_PASSWORD` in chiaro. Inoltre, se l’hash bcrypt fallisce, viene comunque tentato il confronto con la password plaintext. Il `getSessionSecret()` usa l’hash o la password come segreto HMAC se `TOOOLVIBES_SESSION_SECRET` non è impostato.
- **Impatto pratico:** chi conosce la password in chiaro (o la legge negli env/log) può autenticarsi e forgiare cookie validi.
- **Causa probabile:** fallback legacy per facilitare setup e migrazione.
- **Evidenza:**
  ```ts
  const hash = getAdminPasswordHash() || getLegacyAdminPassword() || "fallback-dev-secret";
  return hash;
  ```
- **Come verificarlo:** impostare solo `TOOOLVIBES_ADMIN_PASSWORD` e osservare che il login funziona; rimuovere `TOOOLVIBES_SESSION_SECRET` e derivare un cookie.
- **Rischio se non corretto:** accesso admin completo, compromissione totale del pannello.
- **Fix consigliato:** rimuovere il supporto password plaintext; obbligare `TOOOLVIBES_ADMIN_PASSWORD_HASH` (bcrypt) e `TOOOLVIBES_SESSION_SECRET` casuale e indipendente; rifiutare l’avvio se mancano.

### B.3 — Fallback a dati mock in produzione
- **Gravità:** Critical
- **File:** `lib/data/public-tools.ts` (r. 68-109), `lib/data/collection-repository.ts` (r. 32-87)
- **Componente/pagina:** archivio, raccolte, sitemap, dettaglio tool
- **Descrizione tecnica:** se Supabase non è abilitato (env mancanti), la query restituisce 0 righe o la query fallisce, il codice restituisce `mockTools`/`mockCollections` come sorgente valida. Inoltre `withEditorialOverlay` sovrascrive i dati Supabase con i campi dei mock locali.
- **Impatto pratico:** in produzione, con env errati o tabelle vuote, il sito mostra dati fittizi, immagini Unsplash e slug inesistenti.
- **Causa probabile:** strategia di “graceful degradation” portata troppo oltre.
- **Evidenza:**
  ```ts
  if (!isSupabasePublicEnabled()) {
    return { tools: onlyPublished(mockTools), source: "mock", requestedSource: "mock", warnings: [] };
  }
  ```
- **Come verificarlo:** rimuovere le env Supabase o svuotare le tabelle e visitare `/archivio`; controllare la sorgente in log/profiling.
- **Rischio se non corretto:** informazioni errate, danno di brand, SEO penalizzata, comportamento diverso tra ambienti.
- **Fix consigliato:** disabilitare il fallback mock in produzione (errore/build fallito o pagina vuota con avviso); usare i mock solo in dev con flag esplicita.

### B.4 — Endpoint pubblici scrivono con service role key
- **Gravità:** Critical
- **File:** `lib/supabase/suggestion-repository.ts` (r. 33-48), `lib/supabase/affiliate-request-repository.ts` (r. 109-124), `app/api/tool-requests/route.ts` (r. 64), `app/api/affiliate-requests/route.ts` (r. 115)
- **Componente/pagina:** form suggerimento tool, form candidatura affiliato
- **Descrizione tecnica:** le API pubbliche usano `createAdminSupabaseClient()` (service role) per fare `insert`, bypassando RLS. La validazione dei campi è solo JavaScript lato route handler.
- **Impatto pratico:** un attaccante che bypassi la validazione può scrivere campi riservati (`status`, `admin_notes`, `referral_code`) o creare record arbitrari.
- **Causa probabile:** uso unificato del client admin per tutte le scritture.
- **Evidenza:** repository importano `createAdminSupabaseClient` ed eseguono `.insert(input).select().single()`.
- **Come verificarlo:** inviare un payload con `status: "approved"` o `admin_notes: "x"` a `/api/tool-requests` e `/api/affiliate-requests`.
- **Rischio se non corretto:** manipolazione dati pubblici, bypass workflow approvazione, inquinamento DB.
- **Fix consigliato:** usare il client anon/server con sessione per gli insert pubblici, oppure spostare la logica in RPC `SECURITY DEFINER` che filtri i campi.

### B.5 — RPC gamification esposte permettono di gonfiare XP e sbloccare badge
- **Gravità:** High (trattato come critico per impatto business)
- **File:** `lib/gamification/actions.ts` (r. 121, 397), migrations `20260608000006_gamification_rpc.sql`, `20260608000009_award_badges_rpc.sql`
- **Componente/pagina:** gamification, missioni, arena, leaderboard
- **Descrizione tecnica:** `record_game_interaction` è `SECURITY INVOKER` e accetta `p_xp_delta` 0-10000; `award_badges` è `SECURITY DEFINER` con `GRANT EXECUTE TO authenticated` e inserisce semplicemente i `badge_id` richiesti. Entrambe sono chiamabili direttamente via PostgREST con un JWT autenticato.
- **Impatto pratico:** un utente autenticato può aumentare XP e sbloccare badge arbitrariamente, compromettendo leaderboard e fiducia.
- **Causa probabile:** logica di eleggibilità in TypeScript, RPC DB troppo permissive.
- **Evidenza:** entrambe chiamate da Server Action ma esposte direttamente.
- **Come verificarlo:** chiamare i RPC con JWT autenticato fuori dall’app e verificare accredito XP/badge.
- **Rischio se non corretto:** frode gamification, distorsione classifiche, perdita credibilità.
- **Fix consigliato:** revocare `EXECUTE` a `authenticated` su questi RPC; eseguirli solo da `service_role` oppure spostare la logica di eleggibilità dentro i RPC.

### B.6 — API discovery-state scrive senza autenticazione
- **Gravità:** High
- **File:** `app/api/discovery-state/route.ts` (r. 27-78), `lib/discovery/remote-workspace.ts` (r. 88-137, 357-384)
- **Componente/pagina:** workspace salvataggi, confronto, shortlist
- **Descrizione tecnica:** `GET /api/discovery-state` crea un profilo guest se manca il cookie; `PUT /api/discovery-state` permette di sovrascrivere `viewer_workspaces` e `viewer_tool_states` possedendo solo il cookie `tooolvibes-viewer`.
- **Impatto pratico:** bot possono creare infiniti profili guest; chiunque rubi il cookie viewer può leggere/modificare lo stato salvato.
- **Causa probabile:** design guest-first senza binding auth.
- **Evidenza:** `loadRemoteDiscoveryWorkspace()` chiama `getOrCreateViewerProfile()` che inserisce in `viewer_profiles`.
- **Come verificarlo:** inviare richieste ripetute senza cookie e contare le righe create; copiare cookie tra browser.
- **Rischio se non corretto:** polluzione DB, IDOR, esposizione dati personali.
- **Fix consigliato:** richiedere autenticazione per scritture; limitare creazione profili guest; aggiungere policy RLS che leghi `viewer_*` a `auth.uid()`.

### B.7 — API discovery-account/release non richiede autenticazione
- **Gravità:** High
- **File:** `app/api/discovery-account/release/route.ts` (r. 25-50)
- **Componente/pagina:** associazione account / workspace
- **Descrizione tecnica:** l’endpoint scollega un viewer autenticato trasformandolo in guest, creando un nuovo profilo. Non richiede bearer token né valida identità.
- **Impatto pratico:** disassociazione arbitraria e potenziale furto/duplicazione dello stato workspace.
- **Causa probabile:** simmetria logica con `attach` senza autenticazione.
- **Evidenza:** nessun controllo `authorization` a differenza di `attach`.
- **Come verificarlo:** chiamare `POST /api/discovery-account/release` senza header Authorization con un cookie viewer valido.
- **Rischio se non corretto:** perdita dati utente, race condition.
- **Fix consigliato:** richiedere bearer access token e verificare che il viewer appartenga all’utente autenticato.

### B.8 — Session token admin stateless senza invalidazione server-side
- **Gravità:** High
- **File:** `lib/admin/session.ts` (r. 202-222)
- **Componente/pagina:** sessione admin
- **Descrizione tecnica:** il token è un HMAC di `issuedAt:nonce`. Non esiste un registry server-side (DB/KV) per invalidare singole sessioni. Il logout cancella solo il cookie client.
- **Impatto pratico:** un token rubato rimane valido fino alla scadenza (8 ore) anche dopo logout.
- **Causa probabile:** semplicità su Workers.
- **Evidenza:** `verifySessionToken` verifica solo firma e scadenza.
- **Come verificarlo:** copiare il cookie admin, fare logout, riutilizzare il cookie in una nuova richiesta.
- **Rischio se non corretto:** session hijacking, accesso persistente non revocabile.
- **Fix consigliato:** memorizzare sessioni in KV/Redis/Supabase con `sessionId` e blacklist; oppure ruotare `SESSION_SECRET` al logout (accettabile per admin single-user).

### B.9 — Magic link senza rate limiting
- **Gravità:** High
- **File:** `app/api/auth/magic-link/route.ts` (r. 101-178)
- **Componente/pagina:** autenticazione utente / magic link
- **Descrizione tecnica:** l’endpoint genera e invia magic link a qualsiasi email valida senza limiti per IP o destinatario. I `metadata` dal body vengono passati direttamente a `supabase.auth.admin.generateLink`.
- **Impatto pratico:** spam email, consumo quota Resend, invio massivo di OTP, potenziale abuso metadata.
- **Causa probabile:** mancanza rate limiting.
- **Evidenza:** nessun controllo rate limiting prima di `generateLink`.
- **Come verificarlo:** inviare decine di richieste consecutive con la stessa email.
- **Rischio se non corretto:** abuso API/email, costi, reputazione dominio.
- **Fix consigliato:** rate limiting per IP e per email (es. max 1/60s per email, max 5/ora per IP); validare/sanificare metadata.

### B.10 — Callback origin determinato da `request.url` con fallback hardcoded
- **Gravità:** Medium-High
- **File:** `app/api/auth/magic-link/route.ts` (r. 34-41)
- **Componente/pagina:** magic link / auth callback
- **Descrizione tecnica:** `getCallbackOrigin` può ricadere su `normalizeOrigin(request.url)` se le env non sono impostate; il fallback finale è l’URL hardcoded `https://tooolvibes.staff-ffa.workers.dev`.
- **Impatto pratico:** se `request.url` è influenzato da header `Host` o proxy malconfigurato, il magic link può puntare a un dominio attacker. Il fallback hardcoded è errato per altri ambienti.
- **Causa probabile:** flessibilità dev/test.
- **Evidenza:** catena di fallback che finisce con URL hardcoded.
- **Come verificarlo:** inviare richiesta con header `Host: evil.example.com` e verificare l’URL nel link email.
- **Rischio se non corretto:** phishing, furto token.
- **Fix consigliato:** usare solo `NEXT_PUBLIC_SITE_URL`; validare dominio contro allowlist; rimuovere fallback hardcoded in produzione.

---

## C. ERRORI FUNZIONALI

### C.1 — Link legali nel footer non cliccabili
- **Gravità:** High (funzionale + compliance)
- **File:** `components/layout/site-footer-v2.tsx` (r. 181-190)
- **Descrizione:** i link `Privacy`, `Termini`, `Cookie` sono renderizzati come `<span aria-disabled="true">`.
- **Impatto:** non navigabili, non indicizzabili, violazione accessibilità.
- **Causa:** pagine legali non ancora create.
- **Verifica:** click sui link legali nel footer.
- **Fix:** creare `/privacy`, `/termini`, `/cookie` e sostituire gli `span` con `Link`.

### C.2 — Pagine orfane e duplicati
- **Gravità:** Medium
- **File:** `app/(marketing)/metodo/page.tsx`, `app/(marketing)/product-hunt/page.tsx`, `app/(marketing)/wishlist/page.tsx`
- **Descrizione:** `/metodo` non è linkata da nessuna parte; `/product-hunt` duplica `/radar`; `/wishlist` è solo un redirect a `/shortlist#wishlist`.
- **Impatto:** SEO diluita, navigazione incoerente, contenuti dimenticati.
- **Verifica:** `grep` di `href="/metodo"`, `href="/product-hunt"`, `href="/wishlist"`.
- **Fix:** redirect 301 `/product-hunt` → `/radar`; aggiungere `/metodo` al footer o rimuoverla; valutare se mantenere `/wishlist`.

### C.3 — Doppia sorgente dati per il catalogo
- **Gravità:** High
- **File:** `lib/data/tooolvibes-directory.ts`, `lib/data/public-tools.ts`, `app/(marketing)/page.tsx`, `app/(marketing)/compare/page.tsx`
- **Descrizione:** alcune pagine usano la directory statica, altre usano Supabase/mock, e `/compare` passa entrambe come `directoryTools` e `legacyTools`.
- **Impatto:** inconsistenze tra pagine (tool, slug, immagini, categorie possono differire).
- **Verifica:** confrontare slug in `directoryTools` vs `getPublishedTools()`.
- **Fix:** scegliere una sorgente unica; migrare tutto a `tooolvibes-directory` e deprecare `public-tools` per il frontend.

### C.4 — Admin dashboard limitata a gestione blog
- **Gravità:** Medium
- **File:** `app/(admin)/admin/(protected)/page.tsx`
- **Descrizione:** la dashboard mostra solo articoli, non riassume tool, collection, richieste affiliate/tool in attesa.
- **Impatto:** operatività lenta per l’admin.
- **Verifica:** aprire `/admin` e confrontare con `/admin/tools`, `/admin/collections`, `/admin/affiliates`.
- **Fix:** aggiungere widget cross-area (tool in bozza, collection pending, richieste da approvare).

### C.5 — Affiliate link tracking mancante
- **Gravità:** Medium
- **File:** `lib/supabase/affiliate-repository.ts`, `lib/affiliates/referral.ts`, `app/(admin)/admin/(protected)/affiliate-links/page.tsx`
- **Descrizione:** esiste tabella e gestione link, ma non c’è route `/go/:id` o `/r/:code` che registri il click prima del redirect.
- **Impatto:** impossibile attribuire conversioni/contare click.
- **Verifica:** cercare route `/go`, `/ref`, `/r` o RPC `track_affiliate_click`.
- **Fix:** creare API route di redirect con cookie/referral e RPC per contare click.

### C.6 — Product Hunt / Radar mostra dati fittizi se API fallisce
- **Gravità:** Medium
- **File:** `components/desktop/desktop-radar-nodes.tsx` (r. 20-61), `components/radar/mobile-radar-view.tsx`
- **Descrizione:** se `/api/product-hunt` fallisce o manca token, vengono renderizzati item fallback inventati (`Blink`, `VibeCode`, ecc.).
- **Impatto:** claim “live” ingannevole.
- **Verifica:** visitare `/radar` senza `PRODUCTHUNT_TOKEN`.
- **Fix:** mostrare stato vuoto/error con messaggio “Classifica non configurata” invece di dati demo.

### C.7 — Doppio stato shortlist/compare (locale vs discovery)
- **Gravità:** High
- **File:** `lib/stores/tool-workspace-store.ts`, `lib/discovery/local-storage.ts`, `components/discovery/discovery-persistence-provider.tsx`, `components/app/global-command-palette.tsx`
- **Descrizione:** `tool-workspace-store` persiste in `localStorage`; `DiscoveryPersistenceProvider` sincronizza su Supabase. Componenti diversi usano store diversi.
- **Impatto:** stato incoerente cross-device, perdita dati.
- **Verifica:** salvare un tool e confrontare `localStorage` con `/api/discovery-state`.
- **Fix:** unificare la sorgente di verità; far usare a tutti la discovery API/local-storage.

### C.8 — Hidden signal calcolato client-side
- **Gravità:** Medium
- **File:** `lib/gamification/actions.ts` (r. 200-212)
- **Descrizione:** lo slug vincente è calcolato da hash della data e lista candidati passata dal client; l’utente può replicare il calcolo o passare solo lo slug desiderato.
- **Impatto:** manipolazione reward.
- **Verifica:** chiamare `claim_hidden_signal` con `candidateSlugs: ["slug-desiderato"]`.
- **Fix:** calcolare lo slug atteso in RPC `SECURITY DEFINER` lato DB senza accettarlo come parametro.

### C.9 — Form admin con validazione client debole
- **Gravità:** Medium
- **File:** `components/admin/tool-form.tsx`, `components/admin/collection-form.tsx`, `components/admin/article-form.tsx`
- **Descrizione:** si affida alle Server Action; manca validazione client preventiva e feedback immediato.
- **Impatto:** round-trip server per errori banali, UX lenta.
- **Verifica:** inviare form con campi vuoti.
- **Fix:** aggiungere `react-hook-form` + Zod con messaggi inline.

### C.10 — CollectionForm invia slot vuoti
- **Gravità:** Low
- **File:** `components/admin/collection-form.tsx` (r. 128-146)
- **Descrizione:** `normalizeRenderableSlots` riempie sempre fino a `safeSlots.length + 2`, anche con slot vuoti.
- **Impatto:** payload più grande; server deve filtrare.
- **Fix:** filtrare slot vuoti prima della serializzazione o nella Server Action.

### C.11 — LoginForm `isSubmitting` non resettato su successo
- **Gravità:** Low
- **File:** `components/admin/login-form.tsx` (r. 47-54)
- **Descrizione:** `setIsSubmitting(true)` senza reset immediato; dipende dall’arrivo di errore o redirect.
- **Impatto:** bottone rimane disabilitato in caso di risposta inattesa.
- **Fix:** resettare nelle chiamate di errore e gestire timeout.

### C.12 — API `/api/tools` non sembra usata dal frontend
- **Gravità:** Low
- **File:** `app/api/tools/route.ts`
- **Descrizione:** route esposta ma nessun `fetch("/api/tools")` lato client.
- **Impatto:** codice morto da mantenere/testare.
- **Verifica:** grep `/api/tools` nel codice client.
- **Fix:** rimuovere o documentare come API diagnostica.

---

## D. PROBLEMI UI/UX

### D.1 — Intro mobile blocca lo scroll per 8 secondi
- **Gravità:** High
- **File:** `app/layout.tsx` (r. 68-135), `components/app/home-brand-intro.tsx`, `app/globals.css` (r. ~2723), `styles/intro.css`
- **Problema visivo/UX:** su mobile l’utente non può interagire con la pagina per 8 secondi; lo script inline e il componente React duplicano la logica.
- **Impatto:** mobile primo accesso; bounce rate elevato, frustrazione, accessibilità.
- **Causa:** voler forzare la visione dell’animazione di brand.
- **Fix:** non bloccare mai lo scroll del body; rendere l’overlay dismissabile con tap ovunque; ridurre durata o renderlo opt-in.

### D.2 — CSS globale monolitico e fuori controllo
- **Gravità:** High
- **File:** `app/globals.css` (~30.000 righe, ~787 KB, >1000 `!important`)
- **Problema visivo/UX:** specificità fuori controllo, regole duplicate, override pericolosi, manutenibilità zero.
- **Impatto:** tutti i device; regressioni ad ogni modifica.
- **Causa:** accumulo iterativo senza modularizzazione.
- **Fix:** spezzare in moduli per feature; rimuovere duplicati e `!important`; usare variabili CSS e utility Tailwind.

### D.3 — Layer globali che coprono contenuti
- **Gravità:** High
- **File:** `components/app/custom-cursor.tsx` (z-[9999]), `components/app/cinematic-grain.tsx` (z-[9998]), `components/app/site-universe-background.tsx`, `components/app/orbital-system/orbital-layer.tsx` (z-[15]), `components/app/global-experience-layer.tsx`
- **Problema visivo/UX:** elementi fissi con z-index alti intercettano tocchi/clic anche su contenuti sottostanti.
- **Impatto:** desktop/tablet/mobile; usabilità ridotta, possibili conflitti con modali/toast.
- **Causa:** scelta estetica senza design token layer.
- **Fix:** definire scala z-index centralizzata; rendere i layer disattivabili; spostare orbital layer in container locale.

### D.4 — Touch target troppo piccoli
- **Gravità:** High
- **File:** `components/app/orbital-system/orbital-core-node.tsx` (20×20px), `components/tools/mobile-shortlist-board.tsx` (icona 12px), `components/radar/mobile-radar-view.tsx` (12px), `components/directory/mobile-catalog-view.tsx` (14px), `components/directory/tool-discovery-app.tsx` (min-h-9 = 36px)
- **Problema visivo/UX:** icone/bottoni sotto i 44×44px raccomandati.
- **Impatto:** mobile/tablet/touch desktop.
- **Fix:** aumentare hit area trasparente; usare minimo 44×44px per target tappabili.

### D.5 — Testo microscopico
- **Gravità:** High
- **File:** `components/app/orbital-system/orbiting-badge.tsx` (`text-[8px]`), `components/app/orbital-system/orbital-core-node.tsx` (`text-[10px]`), `components/home/hero-section.tsx` (`text-[11px]`), `components/directory/directory-hero.tsx` (`text-[0.62rem]`)
- **Problema visivo/UX:** testi sotto i 12px, illeggibili su mobile/HiDPI.
- **Impatto:** tutti i device, utenti con vista ridotta.
- **Fix:** evitare testi < 12px; usare `clamp()`/`rem`; verificare zoom 200%.

### D.6 — Contrasto insufficiente su elementi glass
- **Gravità:** Medium-High
- **File:** `components/home/hero-section.tsx`, `components/layout/site-header-v2.tsx`, `components/home/floating-section-anchor.tsx`
- **Problema visivo/UX:** testo `#4f4970` su sfondo bianco/viola semi-trasparente con blur potrebbe non raggiungere 4.5:1.
- **Impatto:** desktop/tablet/mobile.
- **Fix:** aumentare opacità sfondo o scurire testo; testare contrast checker.

### D.7 — Footer V2 con link legali non cliccabili
- **Gravità:** Medium
- **File:** `components/layout/site-footer-v2.tsx` (r. 181-190)
- **Problema visivo/UX:** già dettagliato in C.1.
- **Fix:** sostituire `span` con `Link` verso pagine legali.

### D.8 — Coerenza footer/header v1 vs v2
- **Gravità:** Medium
- **File:** `components/layout/site-footer.tsx`, `components/layout/site-header.tsx`, `components/layout/site-footer-v2.tsx`, `components/layout/site-header-v2.tsx`
- **Problema visivo/UX:** esistono due versioni con stili diversi; v1 non usata ma presente.
- **Impatto:** confusione, manutenzione doppia.
- **Fix:** rimuovere v1; consolidare V2 togliendo suffisso.

### D.9 — Drawer tool detail con overflow/height problematici
- **Gravità:** Medium
- **File:** `components/directory/tool-discovery-app.tsx` (r. 442)
- **Problema visivo/UX:** `h-[92dvh] !max-h-[92dvh] overflow-hidden`, nessun padding safe-area-bottom.
- **Impatto:** mobile, specialmente iOS.
- **Fix:** usare `max-h-[85dvh]` o `calc(100dvh - safe-area - 2rem)`; non usare `overflow-hidden` se il contenuto interno scrolla; aggiungere `pb-[env(safe-area-inset-bottom)]`.

### D.10 — Animazioni always-on e reduced motion ignorato
- **Gravità:** High
- **File:** `components/app/custom-cursor.tsx`, `components/app/site-universe-background.tsx`, `components/app/interaction-sound-layer-v2.tsx`, `components/gamification/radar-scanner-overlay.tsx`, `styles/radar.css`, `app/globals.css`
- **Problema visivo/UX:** animazioni infinite, suoni su hover/tap, canvas WebGL attivi anche con `prefers-reduced-motion: reduce`.
- **Impatto:** accessibilità grave, nausea, batteria.
- **Fix:** wrappare animazioni in `@media (prefers-reduced-motion: no-preference)`; disabilitare suoni automatici; fornire fallback statico.

### D.11 — Confetti/suoni non disabilitati su reduced motion
- **Gravità:** Medium
- **File:** `components/gamification/level-up-modal.tsx`, `components/gamification/badge-unlock-modal.tsx`, `components/gamification/arena-battle-stage.tsx`
- **Problema visivo/UX:** confetti rispettano reduced motion, ma i suoni (`Howl`) partono comunque.
- **Impatto:** accessibilità sonora.
- **Fix:** disabilitare suoni e confetti quando `prefers-reduced-motion: reduce` o utente ha mutato.

### D.12 — Brand intro impone sfondo scuro anche in light mode
- **Gravità:** Medium
- **File:** `app/layout.tsx` (r. 68-73)
- **Problema visivo/UX:** `html.brand-intro-preflight body { background: #07070a; }` causa flash colore scuro.
- **Impatto:** mobile primo caricamento.
- **Fix:** usare background coerente con tema corrente; non forzare colore scuro in light mode.

### D.13 — CTA multiple in pagina confronto mobile
- **Gravità:** Medium
- **File:** `components/tools/mobile-compare-view.tsx`, `styles/compare.css`
- **Problema visivo/UX:** footer fisso della compare arena + `MobileBottomNav` globale creano due barre in basso.
- **Impatto:** mobile.
- **Fix:** consolidare azioni in una sola barra bottom; rimuovere footer fisso dedicato.

---

## E. PROBLEMI RESPONSIVE MOBILE / TABLET / DESKTOP

### Mobile (< 768 px)

| Problema | File | Note |
|---|---|---|
| Intro blocca scroll 8s | `app/layout.tsx`, `home-brand-intro.tsx` | overflow:hidden globale |
| `overflow-x: clip` su html/body | `app/globals.css` (r. ~7566) | taglia modali/drawer |
| Bottom nav copre contenuto | `components/layout/mobile-bottom-nav.tsx`, `app/globals.css` | padding-bottom mancante sul main |
| FAB game in conflitto con bottom nav | `components/layout/site-header-v2.tsx` (r. 355) | z-80 vs z-50 |
| Hero solar con nodi orbitanti tagliati | `components/home/mobile-hero-solar.tsx` | orbit radius 130px su viewport 320px |
| Radar canvas 3D/2D sempre attivo | `components/radar/mobile-radar-view.tsx` | consumo batteria, nodi fuori area |
| Drawer detail no safe area | `components/directory/tool-discovery-app.tsx` | h-[92dvh] overflow-hidden |
| Touch target e testo microscopici | vari (vedi D.4/D.5) | sotto 44px / 12px |
| Font/immagini non ottimizzate | `app/layout.tsx`, componenti `<img>` | LCP/CLS peggiorati |
| Viewport height inconsistente | `mobile-radar-view.tsx`, `mobile-catalog-view.tsx` (`min-h-screen`) | problemi iOS Safari |

### Tablet (768–1024 px)

| Problema | File | Note |
|---|---|---|
| Layer orbitali e 3D attivi | `components/app/orbital-system/orbital-layer.tsx` | possono coprire CTA/testo |
| Spaziature ristrette | `components/home/hero-section.tsx` | padding laterale ridotto |
| Custom cursor nascosto ma altri overlay attivi | `custom-cursor.tsx`, `cinematic-grain.tsx` | CPU/GPU |
| Z-index conflitti | vari | menu/header/drawer |

### Desktop (> 1024 px)

| Problema | File | Note |
|---|---|---|
| Custom cursor globale z-[9999] | `components/app/custom-cursor.tsx` | accessibilità, CPU |
| SiteUniverseBackground WebGL always-on | `components/app/site-universe-background.tsx` | batteria anche a tab in background |
| GlobalExperienceLayer scroll/RAF | `components/app/global-experience-layer.tsx` | micro-lag scroll |
| InteractionSoundLayerV2 attivo globalmente | `components/app/interaction-sound-layer-v2.tsx` | suoni su ogni interazione |
| Three.js importato staticamente nel logo | `components/layout/brand-logo.tsx` | bundle iniziale ingrossato |

### Schermi grandi / 4K

| Problema | File | Note |
|---|---|---|
| Sfondo radiale fisso | `app/(marketing)/layout.tsx` | può apparire sgranato/bianco su schermi larghi |
| Testo piccolo non scala | vari `text-[8px]`-`text-[11px]` | diventa insignificante |
| Canvas 3D a piena risoluzione | `site-universe-background.tsx` | DPR non limitato abbastanza |

---

## F. PROBLEMI DI CODICE / ARCHITETTURA

### F.1 — Componenti v1/v2 duplicati
- **Gravità:** High
- **File:** `components/admin/founder-control-center.tsx` vs `founder-control-center-v2.tsx`; `components/layout/site-footer.tsx` vs `site-footer-v2.tsx`; `components/layout/site-header.tsx` vs `site-header-v2.tsx`; `components/app/global-experience-layer.tsx` vs `global-experience-layer-v2.tsx`
- **Descrizione:** esistono coppie di componenti; solo la versione V2 (o v1) è montata. I file obsoleti aumentano bundle e confusione.
- **Fix:** rimuovere i non usati; rinominare i restanti togliendo suffisso.

### F.2 — Componenti desktop legacy non rimossi
- **Gravità:** High
- **File:** `components/desktop/desktop-vibe-archive.tsx`, `desktop-vibe-compare.tsx`, `desktop-vibe-wishlist.tsx`, `desktop-depth-scene.tsx`, `desktop-compare-canvas.tsx`
- **Descrizione:** sostituiti da `FloatingCatalogView` o non importati; alcuni marcati `// DEPRECATED`.
- **Fix:** rimuovere; se serve riferimento, spostare in branch separato.

### F.3 — Componenti sperimentali non collegati
- **Gravità:** Medium
- **File:** `components/app/cinematic-grain.tsx`, `components/app/custom-cursor.tsx`, `components/app/lenis-provider.tsx`
- **Descrizione:** esportati ma mai importati/montati.
- **Fix:** rimuovere o montare dietro feature flag.

### F.4 — Logica duplicata tra layer pubblico e admin
- **Gravità:** Medium
- **File:** `lib/data/public-tools.ts` vs `lib/supabase/tool-repository.ts` (sort per `date_discovered`); `lib/admin/collection-mutations.ts` vs `lib/admin/collection-form.ts` (mapping collection); `lib/admin/collection-queries.ts` vs `lib/data/collection-repository.ts`
- **Descrizione:** stessa logica reimplementata in più file.
- **Fix:** centralizzare helper in `lib/tools/` e `lib/collections/`.

### F.5 — Dipendenze probabilmente inutili
- **Gravità:** Medium
- **Dipendenze:** `recharts`, `maath`, `@use-gesture/react`, `lenis`, `xstate`/`@xstate/react` (uso marginale), `howler` (valutare)
- **Descrizione:** nessun import per `recharts`, `maath`, `@use-gesture/react`; `lenis` solo in componente non montato; `xstate` usato per macchina a 2 stati.
- **Fix:** rimuovere le inutili; valutare sostituzione di `howler` con Web Audio API.

### F.6 — `next-themes` non montato
- **Gravità:** Low
- **File:** `package.json`, `components/ui/sonner.tsx`
- **Descrizione:** la dipendenza è usata solo in sonner, ma `ThemeProvider` non è montato.
- **Fix:** rimuovere o aggiungere provider.

### F.7 — `shadcn` CLI in dependencies
- **Gravità:** Low
- **File:** `package.json`
- **Descrizione:** `shadcn` dovrebbe essere `devDependency`.
- **Fix:** spostare.

### F.8 — Memory leak / cleanup mancante
- **Gravità:** Medium
- **File:** `components/wishlist/request-tool-form.tsx` (setTimeout); `components/gamification/arena-battle-stage.tsx` (requestAnimationFrame); `components/ui/motion-observer.tsx` (setTimeout); `components/app/interaction-sound-layer-v2.tsx` (setTimeout audio)
- **Descrizione:** timer/raf non cancellati su unmount.
- **Fix:** usare `useRef` e cleanup degli effect.

### F.9 — Manca `app/error.tsx`
- **Gravità:** Medium
- **File:** `app/`
- **Descrizione:** nessun error boundary globale; errori runtime mostrano schermata Next.js default.
- **Fix:** creare `app/error.tsx` e opzionalmente `app/(marketing)/error.tsx`.

### F.10 — `loading.tsx` parziali
- **Gravità:** Low
- **File:** `app/(marketing)/`
- **Descrizione:** solo 6 pagine hanno `loading.tsx`.
- **Fix:** aggiungere `app/(marketing)/loading.tsx` condiviso o per pagina.

### F.11 — Codice commentato / TODO aperti
- **Gravità:** Medium
- **File:** `components/desktop/desktop-vibe-wishlist.tsx`; `app/(marketing)/archivio/page.tsx`; `supabase/functions/resolve-radar-predictions/index.ts` (TODO placeholder); vari altri
- **Descrizione:** codice provvisorio/prototype in produzione.
- **Fix:** risolvere TODO; rimuovere commenti obsoleti.

### F.12 — File temporanei e artefatti tracciati
- **Gravità:** Low
- **File:** `build.log`, `next-radar-start.err.log`, `next-radar-start.out.log`, `session-notes-mobile-fixes.md`, `tsconfig.tsbuildinfo`, `.superpowers/brainstorm/...`
- **Descrizione:** log, cache e note personali nel repo.
- **Fix:** rimuovere e aggiornare `.gitignore`.

---

## G. PROBLEMI BACKEND / AUTH / API

(Già parzialmente dettagliati in B; qui si riassumono per area.)

### G.1 — Autenticazione admin
| Problema | Gravità | File |
|---|---|---|
| Middleware non valida token | Critical | `middleware.ts` |
| Password plaintext fallback | Critical | `lib/admin/session.ts` |
| Session secret derivato da password | Critical | `lib/admin/session.ts` |
| Token stateless non invalidabile | High | `lib/admin/session.ts` |
| `fallback-dev-secret` hardcoded | High | `lib/admin/session.ts` |
| Rate limiting login in memoria / IP spoofable | Medium-High | `lib/admin/login-attempts.ts` |
| Confronto email non timing-safe | Low | `lib/admin/session.ts` |
| Login form senza CSRF token | Medium | `components/admin/login-form.tsx`, `app/api/admin/login/route.ts` |
| Logging diagnostico espone metadati sensibili | Medium | `lib/admin/session.ts`, `app/api/admin/login/route.ts` |

### G.2 — API route handler
| Problema | Gravità | File |
|---|---|---|
| Nessuna validazione Zod/schema | High | tutti `app/api/**/route.ts` |
| Logging verboso con oggetti errore | Medium | `app/api/discovery-state/route.ts`, `app/api/discovery-account/*/route.ts` |
| Route `/api/admin/*` non coperte dal matcher middleware | Medium | `middleware.ts` |
| `/api/tools` non usata | Low | `app/api/tools/route.ts` |

### G.3 — Supabase / database
| Problema | Gravità | File |
|---|---|---|
| Service role per endpoint pubblici | Critical | `lib/supabase/suggestion-repository.ts`, `lib/supabase/affiliate-request-repository.ts` |
| RPC gamification esposte | Critical | migrations gamification, `lib/gamification/actions.ts` |
| `editorial-content` bucket non versionato | Medium | `lib/supabase/article-storage-repository.ts` |
| `.single()` su update senza verifica esistenza | Medium | `lib/admin/tool-mutations.ts`, `lib/admin/article-mutations.ts`, ecc. |
| Mutazioni collections non atomiche | Medium | `lib/admin/collection-mutations.ts`, `app/(admin)/admin/actions/collections.ts` |
| Viewer workspace RLS debole / IDOR | Medium | `lib/discovery/remote-workspace.ts`, migrations viewer |
| `collection_transition_reviews` / `collection_safe_align_events` RLS senza policy | Low | migrations 0012, 0014 |
| Categorie tool non normalizzate | Low | migration 0018, `lib/config/tool-taxonomy.ts` |
| Seed non collegati a migrations | Medium | `supabase/seed*.sql` |

### G.4 — Storage / upload
| Problema | Gravità | File |
|---|---|---|
| Upload media trust del Content-Type client | Medium | `app/api/admin/article-media/route.ts` |
| Bucket `editorial-media` pubblico | Low-Medium | migration 0023 |
| Bucket `editorial-content` creato a runtime | Medium | `lib/supabase/article-storage-repository.ts` |

---

## H. PROBLEMI PERFORMANCE

### H.1 — CSS globale da ~30.000 righe / ~787 KB
- **Gravità:** High
- **File:** `app/globals.css`, importato in `app/layout.tsx`
- **Causa:** unico foglio con Tailwind, animazioni, stili custom per tutte le feature.
- **Impatto:** parsing CSS bloccante su ogni pagina, inclusa `/admin`.
- **Priorità:** alta.
- **Fix:** spostare `@import` di stili specifici (gamification, radar, compare, depth-scene, intro) nei layout/route che li usano; rimuovere regole non usate; usare CSS modules.

### H.2 — Font `@fontsource` caricati in massa
- **Gravità:** Medium-High
- **File:** `app/layout.tsx` (r. 3-10)
- **Causa:** 8 file CSS font sincroni, nessun preload/subsetting.
- **Impatto:** richieste multiple, layout shift.
- **Fix:** migrare a `next/font/google` con subsets, display swap, preload.

### H.3 — Three.js nel bundle globale via logo
- **Gravità:** High
- **File:** `components/layout/brand-logo.tsx` (import statico di `BrandLogo3D`)
- **Causa:** import statico anche quando si usa fallback PNG.
- **Impatto:** bundle iniziale ingrossato di centinaia di KB.
- **Fix:** usare `dynamic(() => import(...), { ssr: false })` per `BrandLogo3D`.

### H.4 — Sfondo 3D su tutte le pagine admin
- **Gravità:** Medium
- **File:** `app/(admin)/admin/(protected)/layout.tsx`
- **Causa:** `SiteUniverseBackground` renderizzato incondizionatamente.
- **Impatto:** overhead GPU in area operativa.
- **Fix:** renderizzare solo in dashboard o caricare con dynamic + placeholder.

### H.5 — OrbitalLayer con RAF continuo
- **Gravità:** High
- **File:** `app/(marketing)/layout.tsx`, `components/app/orbital-system/orbital-layer.tsx`
- **Causa:** motore orbitale calcola posizioni/collisioni a 60fps su ogni pagina marketing.
- **Impatto:** re-render continui, batteria, INP basso.
- **Fix:** fermare RAF quando `document.hidden` o nessun active item; memoizzare badge; separare fisica da render.

### H.6 — Componenti globali pesanti sempre attivi
- **Gravità:** Medium
- **File:** `components/app/root-providers.tsx`
- **Causa:** `HomeBrandIntro`, `GlobalExperienceLayer`, `InteractionSoundLayerV2`, `GameEffectsLayer`, `GlobalCommandPalette` montati globalmente.
- **Impatto:** bundle/logica attiva su ogni pagina.
- **Fix:** caricare con `dynamic` i componenti non critici; rendere sound layer opt-in.

### H.7 — VibeTapMiniGame globale
- **Gravità:** Medium
- **File:** `components/layout/site-header-v2.tsx` (r. 355)
- **Causa:** componente ~900 righe incluso in ogni pagina anche se non aperto.
- **Impatto:** bundle comune ingrossato.
- **Fix:** wrappare in `dynamic(() => import(...), { ssr: false })`.

### H.8 — Immagini con tag `<img>`
- **Gravità:** Medium
- **File:** `components/home/mobile-spotlight.tsx`, `components/radar/mobile-radar-view.tsx`, `components/gamification/radar-console.tsx`, `components/tools/mobile-shortlist-board.tsx`, `components/app/orbital-system/*`
- **Causa:** uso di `<img>` invece di `next/image`.
- **Impatto:** immagini non ottimizzate, layout shift, nessun caching Next.js.
- **Fix:** usare `next/image` con dimensioni; aggiungere domini a `next.config.ts`.

### H.9 — `next.config.ts` `images.remotePatterns` troppo ristretto
- **Gravità:** Medium
- **File:** `next.config.ts`
- **Causa:** solo `images.unsplash.com` allowlisted, ma si usano Supabase Storage, Product Hunt CDN, QR server.
- **Impatto:** `next/image` rifiuta immagini non allowlisted; si ricorre a `<img>`.
- **Fix:** aggiungere domini effettivi o usare `unoptimized: true` per sorgenti non controllate.

### H.10 — Cache in-memory inefficace su Cloudflare Workers
- **Gravità:** Low-Medium
- **File:** `app/api/product-hunt/route.ts`, `lib/utils/timeout-fetch.ts`
- **Causa:** Map globali non persistono tra istanze Workers.
- **Impatto:** token OAuth richiesto ogni volta, maggiore latenza.
- **Fix:** usare Cloudflare Cache API o KV.

---

## I. PROBLEMI SICUREZZA

(I problemi critici sono già in B. Qui si riassumono e aggiungono quelli specifici.)

### I.1 — Middleware admin bypassabile
- **Rischio:** bypass primo strato protezione admin.
- **Dove:** `middleware.ts`.
- **Mitigazione:** validare firma/scadenza cookie.

### I.2 — Password plaintext e secret derivato
- **Rischio:** accesso admin, forgiatura cookie.
- **Dove:** `lib/admin/session.ts`.
- **Mitigazione:** rimuovere plaintext, obbligare bcrypt hash e session secret casuale.

### I.3 — Token stateless non invalidabile
- **Rischio:** session hijacking persistente.
- **Dove:** `lib/admin/session.ts`.
- **Mitigazione:** registry sessioni in KV/DB.

### I.4 — Service role per insert pubblici
- **Rischio:** scrittura arbitraria dati.
- **Dove:** API tool-requests, affiliate-requests.
- **Mitigazione:** usare client anon/RPC `SECURITY DEFINER`.

### I.5 — RPC gamification permissive
- **Rischio:** frode XP/badge.
- **Dove:** migrations gamification, `lib/gamification/actions.ts`.
- **Mitigazione:** revocare EXECUTE a authenticated; spostare logica eleggibilità in RPC.

### I.6 — Discovery API senza autenticazione
- **Rischio:** polluzione DB, IDOR.
- **Dove:** `app/api/discovery-state/route.ts`, `app/api/discovery-account/release/route.ts`.
- **Mitigazione:** richiedere auth per scritture; policy RLS per utenti autenticati.

### I.7 — Magic link senza rate limit / callback origin non validato
- **Rischio:** spam, phishing.
- **Dove:** `app/api/auth/magic-link/route.ts`.
- **Mitigazione:** rate limit IP/email; allowlist dominio callback.

### I.8 — MarkdownContent troppo permissivo
- **Rischio:** XSS/clickjacking tramite iframe.
- **Dove:** `components/editorial/markdown-content.tsx`.
- **Mitigazione:** restringere tag/attributi; whitelist domini iframe; forzare `rel="noopener noreferrer"`.

### I.9 — Upload media trust Content-Type
- **Rischio:** caricamento file con MIME spoofato.
- **Dove:** `app/api/admin/article-media/route.ts`.
- **Mitigazione:** verificare magic bytes; bucket privato con signed URL.

### I.10 — Logging di dati sensibili
- **Rischio:** information disclosure nei log.
- **Dove:** `lib/admin/session.ts`, `app/api/admin/login/route.ts`, `app/api/discovery-state/route.ts`.
- **Mitigazione:** loggare solo eventi anonimizzati; abilitare dettagli solo con debug flag.

### I.11 — Hardcoded URL / email
- **Rischio:** link/email errati in ambienti non configurati.
- **Dove:** `app/api/auth/magic-link/route.ts`, `lib/email/resend.ts`, `lib/config/site.ts`, `lib/affiliates/referral.ts`.
- **Mitigazione:** rimuovere fallback in produzione o far fallire l’operazione.

---

## J. PRIORITÀ DI INTERVENTO

| # | Priorità | Problema | Gravità | File coinvolti | Rischio | Difficoltà stimata | Fix consigliato | Cosa NON toccare |
|---|---|---|---|---|---|---|---|---|
| 1 | Bloccante | Middleware admin non valida token | Critical | `middleware.ts`, `lib/admin/session.ts` | Accesso non autorizzato admin | Media | Rendere middleware async, usare `verifySessionToken` | Non rimuovere `requireAdminSession` dalle route protette |
| 2 | Bloccante | Password plaintext / secret derivato | Critical | `lib/admin/session.ts`, `.env.example` | Compromissione totale admin | Media | Rimuovere plaintext, obbligare bcrypt + secret casuale | Non cambiare la firma HMAC senza invalidare sessioni esistenti |
| 3 | Bloccante | Fallback dati mock in produzione | Critical | `lib/data/public-tools.ts`, `lib/data/collection-repository.ts` | Contenuti fittizi visibili | Media | Disabilitare mock in produzione; flag dev-only | Non rimuovere i file mock prima di avere processo seed sicuro |
| 4 | Bloccante | Service role per insert pubblici | Critical | `lib/supabase/suggestion-repository.ts`, `lib/supabase/affiliate-request-repository.ts`, API route | Scrittura arbitraria | Media | Usare client anon o RPC `SECURITY DEFINER` | Non esporre la service role key nel client |
| 5 | Alta | RPC gamification esposte | High | migrations gamification, `lib/gamification/actions.ts` | Frode XP/badge | Media | Revocare EXECUTE a authenticated; spostare eleggibilità in RPC | Non rompere le Server Action esistenti |
| 6 | Alta | Discovery API senza autenticazione | High | `app/api/discovery-state/route.ts`, `app/api/discovery-account/release/route.ts` | IDOR, polluzione DB | Media | Richiedere auth; aggiungere policy RLS | Non perdere dati guest esistenti durante migrazione |
| 7 | Alta | Token admin non invalidabile | High | `lib/admin/session.ts` | Session hijacking | Media | Registry sessioni in KV/Supabase | Non invalidare tutte le sessioni senza avvisare admin |
| 8 | Alta | Doppio stato shortlist/compare | High | `lib/stores/tool-workspace-store.ts`, `lib/discovery/*` | Perdita dati utente | Alta | Unificare sorgente di verità discovery | Non cancellare store locale senza migrazione dati |
| 9 | Alta | CSS globale 787K / 30k righe | High | `app/globals.css`, `app/layout.tsx` | Performance, manutenibilità | Alta | Split moduli per feature, rimuovere dead code | Non rompere stili critici durante refactor |
| 10 | Alta | Three.js in bundle globale | High | `components/layout/brand-logo.tsx` | Bundle pesante | Bassa | Dynamic import per BrandLogo3D | Non cambiare il default fallback PNG attuale |
| 11 | Alta | Intro mobile blocca scroll | High | `app/layout.tsx`, `components/app/home-brand-intro.tsx` | UX mobile, bounce | Bassa | Non bloccare body scroll; skip istantaneo | Non rimuovere l’overlay senza alternativa branding |
| 12 | Media | Magic link no rate limit | High | `app/api/auth/magic-link/route.ts` | Spam/phishing | Bassa | Rate limit IP/email | Non bloccare flusso utenti legittimi |
| 13 | Media | Footer legali non cliccabili | Medium | `components/layout/site-footer-v2.tsx` | Compliance, UX | Bassa | Creare pagine legali + Link | Non lasciare span disabilitati |
| 14 | Media | Doppia sorgente dati catalogo | High | `lib/data/tooolvibes-directory.ts`, `lib/data/public-tools.ts` | Inconsistenze | Alta | Scegliere sorgente unica | Non cambiare URL pubblici senza redirect |
| 15 | Media | Upload media trust MIME | Medium | `app/api/admin/article-media/route.ts` | XSS/storage abuse | Media | Verificare magic bytes; bucket privato | Non rendere bucket privato senza signed URL nel frontend |
| 16 | Media | Animazioni always-on / reduced motion | High | vari componenti e CSS | Accessibilità | Bassa | Wrappare in media query | Non rimuovere effetti visivi, solo rispettare preferenze |
| 17 | Media | MarkdownContent troppo permissivo | Medium | `components/editorial/markdown-content.tsx` | XSS | Bassa | Restringere tag/domini iframe | Non rimuovere supporto media richiesto |
| 18 | Bassa | Dipendenze inutili | Low | `package.json` | Bundle, debito | Bassa | Rimuovere `recharts`, `maath`, `@use-gesture/react`, `lenis` | Non rimuovere dipendenze usate da altri pacchetti |
| 19 | Bassa | File temporanei/log | Low | root, `.superpowers/`, `*.log` | Rumore repo | Bassa | `git rm --cached` + aggiornare `.gitignore` | Non cancellare file necessari al plugin superpowers |
| 20 | Bassa | Componenti legacy v1/v2 | Medium | vari `components/*` | Debito tecnico | Media | Rimuovere non usati; consolidare | Non eliminare componenti ancora importati |

---

## K. ROADMAP DI FIX CONSIGLIATA

### Fase 1 — Fix critici che rompono il sito / compromettono sicurezza
1. **Sicurezza admin:**
   - Rimuovere supporto password plaintext e `fallback-dev-secret`.
   - Obbligare `TOOOLVIBES_ADMIN_PASSWORD_HASH` e `TOOOLVIBES_SESSION_SECRET` casuale.
   - Rendere `middleware.ts` async e validare firma/scadenza cookie con `verifySessionToken`.
   - Aggiungere registry sessioni in KV/Supabase per invalidazione logout.
2. **Dati:**
   - Disabilitare fallback mock in produzione (errore o pagina vuota); mantenerli solo dev.
   - Rimuovere overlay editoriale automatico da `public-tools.ts` se i dati reali sono la sorgente.
3. **API pubbliche:**
   - Sostituire service role con client anon o RPC `SECURITY DEFINER` per `tool_requests` e `affiliate_requests`.
4. **Gamification:**
   - Revocare EXECUTE su `record_game_interaction` e `award_badges` a `authenticated`.

### Fase 2 — Auth / backend / routing
5. Aggiungere rate limiting a `/api/auth/magic-link` (IP + email).
6. Validare callback origin contro allowlist; rimuovere fallback hardcoded.
7. Richiedere autenticazione per `PUT /api/discovery-state` e `POST /api/discovery-account/release`.
8. Aggiungere policy RLS su `viewer_workspaces`/`viewer_tool_states` per utenti autenticati.
9. Introduci validazione Zod per tutti i body/query/formData delle API.
10. Creare `app/error.tsx` e proteggere meglio route `/api/admin/*` nel matcher middleware.

### Fase 3 — UI / responsive
11. Rifare l’intro mobile: non bloccare scroll, skip immediato, rispetto reduced motion.
12. Unificare footer/header (rimuovere v1), rendere link legali cliccabili.
13. Standardizzare viewport units (`dvh`/`svh`), safe-area padding, bottom nav.
14. Aumentare touch target a 44×44px e testo minimo a 12px.
15. Definire scala z-index centralizzata e ridurre layer globali.
16. Wrappare animazioni infinite in `prefers-reduced-motion: no-preference`.

### Fase 4 — Performance
17. Spezzare `app/globals.css` in moduli per feature; rimuovere regole duplicate e `!important`.
18. Migrare font a `next/font/google`.
19. Applicare `dynamic` import a `BrandLogo3D`, `VibeTapMiniGame`, `GlobalCommandPalette`, `GameEffectsLayer`.
20. Ottimizzare `SiteUniverseBackground` (pausa su tab hidden, reduced motion statico).
21. Fermare/pausare `OrbitalLayer` RAF quando non necessario.
22. Sostituire `<img>` con `next/image` e aggiornare `next.config.ts` remotePatterns.

### Fase 5 — Cleanup / refactor
23. Rimuovere componenti v1/v2 non usati e file desktop legacy.
24. Rimuovere dipendenze inutili (`recharts`, `maath`, `@use-gesture/react`, `lenis`).
25. Rimuovere file temporanei/log e aggiornare `.gitignore`.
26. Centralizzare helper di sorting/mapping tra admin e pubblico.
27. Risolvere TODO aperti (radar predictions, ecc.).

### Fase 6 — Sicurezza / SEO / accessibilità
28. Rivedere `MarkdownContent`: whitelist tag/domini iframe, forzare `rel="noopener noreferrer"`.
29. Verificare magic bytes upload media; usare bucket privato con signed URL.
30. Sanitizzare logging: niente lunghezze hash/password/secret.
31. Completare metadata per tutte le pagine marketing; aggiungere canonical, OG images, twitter card.
32. Aggiornare `robots.txt` (`Disallow: /admin`, `/api`, `/auth`) e aggiungere cache al sitemap.
33. Ripristinare focus visibili su form admin; correggere `alt` immagini; verificare contrasti.

---

## L. LIVELLO DI AFFIDABILITÀ DELL’AUDIT

**Stima: 80–85%**

L’analisi si è basata su:
- Lettura completa di `package.json`, `next.config.ts`, `tsconfig.json`, `.env.example`, `middleware.ts`, `lib/admin/session.ts`, `app/layout.tsx`, `app/(marketing)/layout.tsx`, `root-providers.tsx`, `lib/data/public-tools.ts` e di un campione rappresentativo di componenti, route handler, repository e migrations.
- Scansione della struttura cartelle, dei pattern di import e dei file potenzialmente inutili.
- Analisi statica dello schema Supabase dalle migrations e del mapping codice ↔ database.

### Cosa non è stato possibile verificare
- Comportamento runtime su browser reali (mobile iOS/Android, tablet, desktop) e con screen reader.
- Risultati di build, bundle analyzer, Lighthouse, Core Web Vitals.
- Configurazione/env effettivi in produzione/preview (Cloudflare Workers, Supabase dashboard, secrets).
- Log runtime, errori reali, performance API, race condition sotto carico.
- Test E2E esistenti (c’è `test-results/` ma non sono stati eseguiti).
- Comportamento delle edge function Supabase in ambiente reale.
- Eventuali problemi specifici di versioni dipendenze (audit dipendenze non eseguito con strumenti automatici).

### Accessi / informazioni utili per una verifica più completa
- Env reali di produzione/preview (senza secret) per verificare cosa è effettivamente configurato.
- Output di `next build` e bundle analyzer (`@next/bundle-analyzer`).
- Log di Cloudflare Workers e Supabase (in particolare login admin, discovery state, gamification RPC).
- Report Lighthouse per mobile/desktop.
- Test E2E aggiornati (Playwright/Vitest) sui flussi critici: login admin, salvataggio form, navigazione mobile, intro brand, gamification.
- Accesso in lettura al DB di produzione per verificare presenza dati mock, policy RLS effettive, sessioni attive.
- Documentazione architetturale attuale (se esiste) per chiarire scelte di `tooolvibes-directory` vs `public-tools`.

---

## M. TOP 10 PROBLEMIDA SISTEMARE IN ORDINE DI URGENZA

1. **Middleware admin bypassabile con cookie qualsiasi** — rischio accesso non autorizzato al pannello.
2. **Password admin plaintext / session secret derivato dalla password** — rischio compromissione totale admin.
3. **Fallback a dati mock in produzione** — rischio contenuti fittizi visibili agli utenti.
4. **Service role key usata per endpoint pubblici** — rischio scrittura arbitraria su Supabase.
5. **RPC gamification esposte a utenti autenticati** — rischio frode XP/badge/leaderboard.
6. **Discovery state/release senza autenticazione** — rischio IDOR e polluzione DB.
7. **Token admin stateless non invalidabile** — rischio session hijacking persistente.
8. **Magic link senza rate limiting** — rischio spam/phishing.
9. **CSS globale 787K / layer globali always-on / Three.js nel bundle** — rischio performance e UX grave.
10. **Doppia sorgente dati catalogo + doppio stato shortlist/compare** — rischio inconsistenze e perdita dati utente.

---

*Fine del report. Nessuna modifica è stata applicata al progetto.*
