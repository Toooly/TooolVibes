# TooolVibes — Production Closure Plan

**Obiettivo:** portare TooolVibes da 38/100 a una release pubblica verificabile senza big-bang rewrite.  
**Fonte:** TOOOLVIBES_PRODUCTION_READINESS_AUDIT.md  
**Vincolo:** ogni attività deve essere implementata, testata e committata separatamente secondo TOOOLVIBES_EXECUTION_ROADMAP.md.

## Classificazione

- **P0 — BLOCKER PRE-LAUNCH:** impedisce il go-live o espone perdita dati, integrità, security, schema o pubblicazione.
- **P1 — CRITICAL PRE-LAUNCH:** necessario per un’esperienza affidabile e verificabile.
- **P2 — IMPORTANT PRE-LAUNCH:** importante per la solidità, ma subordinato ai P0/P1.
- **P3 — POLISH PRE-LAUNCH:** rifinitura che non deve ritardare la chiusura di P0/P1/P2.
- **P4 — POST-LAUNCH:** valore reale, non necessario al primo rilascio.

## Principi di esecuzione

1. Nessun redesign generale.
2. Prima contratti dati, sicurezza e test; poi UI e cleanup.
3. Ogni migrazione localStorage/database deve essere non distruttiva.
4. Ogni rimozione legacy richiede prova di non utilizzo e visual regression.
5. Il gate pubblico resta attivo fino al release rehearsal.
6. Ogni superficie gamification entra in un manifest firmato con modalità **OFF**, **LOCAL_NO_REWARD** o **REWARDED**. Solo REWARDED richiede persistence globale, GAM-901 ON ed E2E reward; OFF richiede negative test UI/server.
7. Il CSS viene ridotto per vertical slice, mai con cancellazione massiva.
8. Mobile e desktop vengono validati separatamente.

---

## PHASE 0 — SAFETY BASELINE

### SAF-001 — Congelare ambiente e baseline

- **Problema:** audit eseguito su Node 24/npm 11, mentre package.json richiede Node 22/npm 10.
- **Root cause:** il contratto runtime non è imposto automaticamente.
- **Soluzione:** pin Node 22 e npm 10.9.2 in CI/dev; documentare comando di verifica e fallire su versione non supportata.
- **File/componenti:** package.json, .nvmrc, .node-version, .npmrc, README, workflow CI.
- **Rischio / priorità / dipendenze:** basso; P0; nessuna.
- **Risultato atteso:** build riproducibili nello stesso runtime di release.
- **Acceptance criteria:** npm ci, lint, typecheck, test, Next build e OpenNext build verdi su Node 22/npm 10.
- **Test richiesti:** clean clone CI; controllo negativo con Node non supportato.

### SAF-002 — Creare il quality gate CI

- **Problema:** nessun workflow esegue lint, typecheck, test e build a ogni change.
- **Root cause:** il workflow esistente è un bot, non una pipeline release.
- **Soluzione:** aggiungere workflow quality con npm ci, lint --max-warnings=0, tsc, Vitest, Next build e OpenNext build; cache solo dopo baseline stabile.
- **File/componenti:** .github/workflows, package.json, tsconfig, vitest config.
- **Rischio / priorità / dipendenze:** basso; P0; SAF-001.
- **Risultato atteso:** ogni regressione tecnica blocca merge/release.
- **Acceptance criteria:** pipeline verde su main; una fixture di errore dimostra che ogni step blocca.
- **Test richiesti:** run CI completa; artifact log conservato.

### SAF-003 — Introdurre harness E2E e visual baseline

- **Problema:** nessun Playwright/E2E; audit visuale interno completo non ripetibile.
- **Root cause:** QA manuale non formalizzato.
- **Soluzione:** configurare Playwright con webServer, storage state gate, console collector, screenshot deterministici e progetti Chromium/Firefox/WebKit.
- **File/componenti:** playwright config, tests/e2e, scripts/package, fixture gate.
- **Rischio / priorità / dipendenze:** medio; P0; SAF-001.
- **Risultato atteso:** route e flow core verificabili in locale e CI.
- **Acceptance criteria:** smoke di /, /archivio, detail, shortlist, compare, radar e account; fallimento su console error/hydration.
- **Test richiesti:** viewport 320, 390, 768, 1024, 1440, 1920; screenshot diff approvati.

### SAF-004 — Registro feature flag e kill switch

- **Problema:** gate, 3D, audio e gamification non condividono una policy release.
- **Root cause:** feature sviluppate verticalmente.
- **Soluzione:** creare config tipizzata per public gate, persistence, missioni, Hidden Signal, Arena, prediction, leaderboard, Vibe Rush, 3D e audio; separare `surfaceEnabled` da `persistentRewardsEnabled`.
- **File/componenti:** lib/config, app/layout.tsx, marketing/layout.tsx, GamificationShell, RootProviders, middleware.
- **Rischio / priorità / dipendenze:** medio; P0; SAF-001.
- **Risultato atteso:** superfici incomplete disabilitabili senza patch.
- **Acceptance criteria:** ogni surface dichiara modalità ammesse/owner/default; local non invia reward mutation; rewarded implica surface+persistence+GAM-901 ON; leaderboard local è invalida; nessuna secret env esposta.
- **Test richiesti:** matrix OFF/LOCAL_NO_REWARD/REWARDED, combinazioni invalide, chiamata API/RPC con surface OFF/local, gamification globale off e gate on/off.

### SAF-005 — Backup, rollback e dataset staging

- **Problema:** migrazioni e merge verranno toccati senza una rehearsal baseline.
- **Root cause:** nessun runbook versionato.
- **Soluzione:** definire export/backup Supabase, snapshot tabelle, dataset staging, rollback migration e recovery localStorage.
- **File/componenti:** docs/runbooks, scripts read-only di verifica, Supabase config.
- **Rischio / priorità / dipendenze:** basso; P0; SAF-001.
- **Risultato atteso:** ogni modifica dati reversibile.
- **Acceptance criteria:** restore provato in staging; recovery time e owner registrati.
- **Test richiesti:** restore dry-run; checksum/count pre/post.

---

## PHASE 1 — SECURITY, SCHEMA & RELEASE BLOCKERS

### SEC-101 — Patchare Next e dipendenze vulnerabili

- **Problema:** npm audit riporta 17 vulnerabilità, incluse 9 high; Next 15.5.15 è direttamente coinvolto.
- **Root cause:** range e lock non aggiornati dopo advisory recenti.
- **Soluzione:** aggiornare prima Next dentro 15.5.x alla patch sicura disponibile, React compatibile e Wrangler/OpenNext in batch separati; non migrare a Next 16 in questa chiusura.
- **File/componenti:** package.json, package-lock.json, Next/OpenNext config.
- **Rischio / priorità / dipendenze:** alto; P0; SAF-002/003.
- **Risultato atteso:** nessun high/critical applicabile aperto.
- **Acceptance criteria:** npm audit triaged; build/E2E/SSR/middleware/image/auth verdi; changelog rischi allegato.
- **Test richiesti:** full CI, crawler/gate, auth callback, image optimization, Cloudflare dry-run.

### SEC-102 — Riparare la storia migration

- **Problema:** due file migration hanno prefisso 0023.
- **Root cause:** sviluppo parallelo senza sequenza canonica.
- **Soluzione:** definire strategia compatibile con database già applicati; rinumerare/rebase senza duplicare effetti; creare manifest migration.
- **File/componenti:** supabase/migrations/0023_create_editorial_articles.sql, 0023_expand_tool_requests_for_founder_flows.sql, README.
- **Rischio / priorità / dipendenze:** alto; P0; SAF-005.
- **Risultato atteso:** sequenza unica applicabile a DB vuoto e staging esistente.
- **Acceptance criteria:** supabase db reset verde; diff schema atteso; nessun oggetto duplicato.
- **Test richiesti:** fresh DB, upgrade staging snapshot, rollback/reapply.

### SEC-103 — Versionare waitlist

- **Problema:** /api/waitlist inserisce in una tabella non creata dalle migration.
- **Root cause:** feature prelaunch aggiunta fuori schema versionato.
- **Soluzione:** migration waitlist con email normalizzata, unique, created_at, source/consent fields minimi, RLS e indice; definire retention.
- **File/componenti:** app/api/waitlist/route.ts, Supabase migrations, types/env docs.
- **Rischio / priorità / dipendenze:** medio; P0; SEC-102, revisione legal.
- **Risultato atteso:** fresh deploy del coming soon funzionante.
- **Acceptance criteria:** duplicate email idempotente; invalid payload rifiutato; policy non aggirabile.
- **Test richiesti:** DB contract, API 200/400/409/429/500, retention job se previsto.

### SEC-104 — Rate limiting e revoca distribuiti

- **Problema:** admin login, magic link e revoca usano Map in-memory; gate non ha limiter.
- **Root cause:** assunzione single-process incompatibile con Cloudflare isolates.
- **Soluzione:** usare storage distribuito/durable con chiave privacy-safe, finestre e backoff; definire session revocation o durata/rotazione coerente.
- **File/componenti:** lib/admin/login-attempts.ts, lib/admin/session-token.ts, api/admin, api/auth/magic-link, api/gate.
- **Rischio / priorità / dipendenze:** alto; P0; SAF-004.
- **Risultato atteso:** protezione coerente tra isolate e cold start.
- **Acceptance criteria:** limite condiviso; 429 con Retry-After; logout invalida secondo contesto secondo contratto.
- **Test richiesti:** multi-worker simulation, burst, clock boundary, revoca cross-session.

### SEC-105 — Hardening endpoint pubblici e RLS

- **Problema:** waitlist, tool request e affiliate request non hanno anti-abuse durevole; policy anon insert possono aggirare la validazione API.
- **Root cause:** trust e validazione divisi tra client/API/database.
- **Soluzione:** limiti body/campi, schema Zod, Turnstile o equivalente, honeypot, rate limit e funzione/database policy che obblighi il percorso controllato.
- **File/componenti:** api/waitlist, api/tool-requests, api/affiliate-requests, form client, migration RLS/grant.
- **Rischio / priorità / dipendenze:** alto; P0; SEC-103/104.
- **Risultato atteso:** nessun insert anon non validato.
- **Acceptance criteria:** chiamata diretta Supabase anon fallisce; API valida riesce; payload oversize e bot vengono respinti.
- **Test richiesti:** bypass RLS, fuzz payload, replay, 429, CAPTCHA failure.

### SEC-106 — Security header e origin policy

- **Problema:** nessuna CSP, HSTS, frame, referrer o permissions policy applicativa verificata.
- **Root cause:** affidamento implicito al provider edge.
- **Soluzione:** definire header compatibili con Next, Supabase, immagini, font e script; evitare unsafe policy non necessarie; verificare edge response reale.
- **File/componenti:** next.config.ts o middleware/Cloudflare config, auth/gate.
- **Rischio / priorità / dipendenze:** alto; P0; SEC-101.
- **Risultato atteso:** superficie browser ridotta senza rompere app.
- **Acceptance criteria:** header presenti su public/admin/auth; CSP report-only prima di enforce; frame embedding bloccato.
- **Test richiesti:** security header scanner, auth/image/3D regression, CSP violation log.

### SEC-107 — Correggere hydration mismatch del gate

- **Problema:** InputPrimitive genera markup/ID non stabile tra SSR e client.
- **Root cause:** input wrapper senza ID/label espliciti e possibile bug versione Base UI.
- **Soluzione:** riprodurre con test; fornire ID/label stabili o usare input nativo canonico; valutare patch Base UI solo in batch isolato.
- **File/componenti:** components/ui/input.tsx, waitlist-form.tsx, gate-modal.tsx.
- **Rischio / priorità / dipendenze:** medio; P0; SAF-003, SEC-101.
- **Risultato atteso:** zero hydration error sul primo ingresso.
- **Acceptance criteria:** nessuna differenza SSR/client, console pulita su reload e slow hydration.
- **Test richiesti:** Playwright console, SSR snapshot, gate open/close, autofill.

---

## PHASE 2 — CANONICAL DATA & PERSISTENCE

### DATA-201 — Definire Tool domain canonico

- **Problema:** DirectoryTool e ToolRecord hanno campi, fallback e significati diversi.
- **Root cause:** catalogo statico e CMS evoluti in parallelo.
- **Soluzione:** definire un ToolPublic canonico, stato published, URL, editorial evidence, score inputs e adapter espliciti per legacy.
- **File/componenti:** lib/types/tool.ts, lib/data/public-tools.ts, lib/data/tooolvibes-directory.ts, compare shared.
- **Rischio / priorità / dipendenze:** alto; P0; SAF-002.
- **Risultato atteso:** un record rappresenta lo stesso tool ovunque.
- **Acceptance criteria:** schema runtime validato; nessun campo silenziosamente inventato; legacy adapter testato.
- **Test richiesti:** fixture complete/parziali, invalid record, published/unpublished.

### DATA-202 — Repository Tool unico

- **Problema:** home/catalog/detail usano directoryTools; API/sitemap/admin Supabase/mock.
- **Root cause:** migrazione contenuti incompleta.
- **Soluzione:** creare repository pubblico unico con policy Supabase/mock esplicita; migrare home, archivio, tags, detail, related, API, sitemap, shortlist e compare.
- **File/componenti:** app marketing pages, lib/data/public-tools.ts, directory data, API, sitemap.
- **Rischio / priorità / dipendenze:** alto; P0; DATA-201.
- **Risultato atteso:** CMS publish visibile coerentemente.
- **Acceptance criteria:** ogni slug pubblicato compare e apre; non pubblicato assente da tutte le surface.
- **Test richiesti:** contract catalog/detail/API/sitemap/search; source fallback.

### DATA-203 — Contract test Tool e CMS

- **Problema:** oggi una sitemap valida può puntare a detail 404.
- **Root cause:** nessun test cross-surface.
- **Soluzione:** test generato che confronti ID/slug/status tra repository, route static params, sitemap e admin publish.
- **File/componenti:** tests/integration, sitemap route, tool page generateStaticParams.
- **Rischio / priorità / dipendenze:** basso; P0; DATA-202.
- **Risultato atteso:** divergenza dati bloccata in CI.
- **Acceptance criteria:** nessun published slug senza 200; nessun draft indicizzato.
- **Test richiesti:** Supabase fixture, mock fallback, duplicate slug.

### DATA-204 — Workspace schema canonico

- **Problema:** Zustand e discovery workspace sono due modelli indipendenti.
- **Root cause:** refactor visuale non riallacciato alla persistenza account.
- **Soluzione:** definire schema versionato unico per saved, compare, stack, stage, note, reason, pin, decision outcome e timestamp; scegliere un solo store consumer.
- **File/componenti:** lib/stores/tool-workspace-store.ts, lib/discovery/types.ts, workspace-state.ts, local-storage.ts.
- **Rischio / priorità / dipendenze:** molto alto; P0; SAF-003/005.
- **Risultato atteso:** tutti i componenti leggono e scrivono lo stesso stato.
- **Acceptance criteria:** header, nav, shortlist, compare e account mostrano gli stessi conteggi/dati.
- **Test richiesti:** store unit, serialization, corrupt payload, max compare, multi-tab.

### DATA-205 — Migrazione localStorage non distruttiva

- **Problema:** utenti pre-release possono avere dati in entrambe le famiglie di chiavi.
- **Root cause:** nessun version/migration layer.
- **Soluzione:** migratore idempotente con dual-read temporaneo, dedupe e conflict policy per timestamp; backup della payload legacy fino a una release di sicurezza.
- **File/componenti:** local-storage, Zustand persist config, app bootstrap.
- **Rischio / priorità / dipendenze:** molto alto; P0; DATA-204.
- **Risultato atteso:** zero perdita e zero duplicati.
- **Acceptance criteria:** ogni combinazione old/new converge allo stesso snapshot; seconda esecuzione non modifica.
- **Test richiesti:** fixture legacy A/B/miste/corrotte/storage full; rollback.

### DATA-206 — Sync guest/account sullo store canonico

- **Problema:** AccountProvider allega lo snapshot sbagliato.
- **Root cause:** integrazione duplicata.
- **Soluzione:** collegare DiscoveryPersistenceProvider e attach/release al nuovo store; definire merge locale/remoto e second-device restore.
- **File/componenti:** AccountProvider, DiscoveryPersistenceProvider, discovery API, repository viewer workspace.
- **Rischio / priorità / dipendenze:** molto alto; P0; DATA-204/205.
- **Risultato atteso:** handoff guest-account reale.
- **Acceptance criteria:** save/compare/stage/note/decision preservati dopo login, reload, logout e secondo browser.
- **Test richiesti:** E2E guest→account, account esistente, concurrent edit, offline, 409/retry.

---

## PHASE 3 — DESIGN SYSTEM CONSOLIDATION

### DS-301 — Congelare cascade e creare ownership map

- **Problema:** 45.019 righe CSS e tre repaint globali.
- **Root cause:** append-only styling.
- **Soluzione:** documentare ordine, owner e consumer di ogni foglio; vietare nuovi override globali salvo bug blocker; introdurre cascade layer o entrypoint ordinato.
- **File/componenti:** app/globals.css, styles/*.css, app/layout.tsx, lint/style policy.
- **Rischio / priorità / dipendenze:** medio; P1; SAF-003.
- **Risultato atteso:** nessun nuovo debito di specificity.
- **Acceptance criteria:** ogni nuovo stile ha owner/route; diff CI segnala !important aggiunti.
- **Test richiesti:** build, screenshot baseline, CSS order snapshot.

### DS-302 — Promuovere token tv a fondazione canonica

- **Problema:** token background/v/tv e palette locali convivono.
- **Root cause:** design direction migrate via repaint.
- **Soluzione:** definire color, typography, spacing, radius, elevation, motion e z-index target; mappare alias legacy senza rimuoverli subito.
- **File/componenti:** globals token section, figma implementation, account/compare/gamification CSS.
- **Rischio / priorità / dipendenze:** medio; P1; DS-301.
- **Risultato atteso:** una source of truth visuale.
- **Acceptance criteria:** token doc e contrast matrix; nessun nuovo valore arbitrario nei componenti core.
- **Test richiesti:** token snapshot, contrast automated/manual, light legacy fallback.

### DS-303 — Consolidare font e scala

- **Problema:** quattro font e numerose label sotto 12 px.
- **Root cause:** ruoli tipografici non definiti.
- **Soluzione:** Inter UI/body, Fraunces display editoriale, Rubik brand/system; eliminare font/weight non usati; scala minima 12 px.
- **File/componenti:** app/layout.tsx, globals, Maestoso/Figma CSS, components core.
- **Rischio / priorità / dipendenze:** medio; P1; DS-302.
- **Risultato atteso:** gerarchia coerente e payload font ridotto.
- **Acceptance criteria:** nessuna label operativa <12 px; line-height/weight documentati.
- **Test richiesti:** screenshot mobile/desktop, font loading, CLS.

### DS-304 — Overlay e z-index contract

- **Problema:** header, sheet, drawer, dialog, menu e FAB usano 50/80/90/100 senza gerarchia unica.
- **Root cause:** overlay implementati per feature.
- **Soluzione:** una primitive OverlayRoot con scale nav/overlay/modal/toast/effects, scroll lock, inert, focus e portal policy.
- **File/componenti:** ui/dialog.tsx, drawer.tsx, sheet.tsx, header, command palette, gamification modal.
- **Rischio / priorità / dipendenze:** alto; P1; DS-302.
- **Risultato atteso:** nessuna collisione layer/focus.
- **Acceptance criteria:** una sola modal interattiva; nav/FAB non sopra modal; restore focus.
- **Test richiesti:** stacked overlay, Escape, scroll lock iOS, keyboard.

### DS-305 — Primitive Button/Card/Badge/Chip

- **Problema:** API duplicate, raw controls e Card non adottata.
- **Root cause:** component library non usata dalle feature.
- **Soluzione:** scegliere API canoniche, definire varianti/size/stati; creare compatibility wrappers e adoption matrix.
- **File/componenti:** components/ui/button.tsx, premium.tsx, card.tsx, badge.tsx e consumer core.
- **Rischio / priorità / dipendenze:** medio; P1; DS-302.
- **Risultato atteso:** comportamento coerente senza riscrittura simultanea.
- **Acceptance criteria:** tutte le route core usano primitive o eccezione documentata; stati completi.
- **Test richiesti:** component tests, keyboard, visual variants, dark contrast.

### DS-306 — ToolCard responsive canonica

- **Problema:** card tool differenti per catalogo, related, shortlist, compare e mobile.
- **Root cause:** feature ownership separato.
- **Soluzione:** una ToolCard con presentation variant, slot action e densità responsive; evitare logica dominio duplicata.
- **File/componenti:** DirectoryToolCard, mobile cards, shortlist cards, glyph, toggles.
- **Rischio / priorità / dipendenze:** alto; P1; DATA-201/202, DS-305.
- **Risultato atteso:** stessa informazione e CTA ovunque.
- **Acceptance criteria:** nome, categoria, evidenza, save/compare e focus coerenti; no overflow.
- **Test richiesti:** long names/copy, missing image, 320–1920, touch/keyboard.

---

## PHASE 4 — CORE COMPONENT REFACTOR

### CORE-401 — Scomporre MobileCatalogView

- **Problema:** circa 736 righe con ricerca, filtri, view state, rendering e compare.
- **Root cause:** responsabilità accumulate.
- **Soluzione:** estrarre query state, command panel, filter chips, category view, result grid e compare tray senza cambiare UX.
- **File/componenti:** components/directory/mobile-catalog-view.tsx e nuovi moduli directory.
- **Rischio / priorità / dipendenze:** medio; P1; DATA-202, DS-306.
- **Risultato atteso:** componenti testabili e layout adattabile.
- **Acceptance criteria:** parità funzionale; URL state preservato; nessun nuovo fetch.
- **Test richiesti:** search/filter/back, compare limit, screenshot.

### CORE-402 — Scomporre sound/experience layers

- **Problema:** InteractionSoundLayerV2 concentra listener e mapping in 1.770 righe.
- **Root cause:** ogni microinterazione aggiunta al layer globale.
- **Soluzione:** separare preferences, event mapping, playback engine e route adapters; usare eventi tipizzati e listener unici.
- **File/componenti:** interaction-sound-layer-v2.tsx, music, game effects, preferences.
- **Rischio / priorità / dipendenze:** alto; P1; SAF-004.
- **Risultato atteso:** audio governabile e disattivabile.
- **Acceptance criteria:** nessun listener duplicato; opt-out persistente; route unmount pulito.
- **Test richiesti:** listener count, rapid navigation, audio disabled, reduced motion.

### CORE-403 — Scomporre AccountPanel

- **Problema:** account mescola auth, sync, profile, workspace, submission e game profile.
- **Root cause:** area utente cresciuta per accumulo.
- **Soluzione:** separare auth state, sync status, workspace summary, submissions e gamification summary.
- **File/componenti:** account-panel.tsx, account-provider.tsx, account CSS.
- **Rischio / priorità / dipendenze:** medio; P1; DATA-206.
- **Risultato atteso:** stati guest/auth/error testabili.
- **Acceptance criteria:** nessuna duplicazione session state; copy coerente con dati reali.
- **Test richiesti:** guest, sending, expired link, authenticated, local-only, sync error.

### CORE-404 — Scomporre admin collections

- **Problema:** pagina admin collection supera 1.100 righe e combina lista, filtri, sync e review.
- **Root cause:** workflow operativo aggiunto nello stesso route component.
- **Soluzione:** estrarre query model, list/table, sync preview e actions; mantenere server boundaries.
- **File/componenti:** admin/collections/page.tsx, components/admin collection.
- **Rischio / priorità / dipendenze:** medio; P2; DATA-202.
- **Risultato atteso:** back office mantenibile senza cambiare dati.
- **Acceptance criteria:** parity su filtri/actions/status; no client service role.
- **Test richiesti:** admin integration, permissions, empty/error.

---

## PHASE 5 — NAVIGATION & INFORMATION ARCHITECTURE

### IA-501 — Config navigazione unica

- **Problema:** header, bottom nav, footer e strings hanno link differenti.
- **Root cause:** configurazioni locali.
- **Soluzione:** definire nav model unico con surface, priority, auth visibility, badge source e release availability.
- **File/componenti:** lib/config/strings.ts o nuovo navigation.ts, SiteHeaderV2, MobileBottomNav, SiteFooterV2.
- **Rischio / priorità / dipendenze:** medio; P1; DATA-204.
- **Risultato atteso:** IA coerente e controllabile.
- **Acceptance criteria:** nessuna route primaria mancante/duplicata; label univoche Catalogo/Salvati/Confronto.
- **Test richiesti:** guest/auth, mobile/desktop, active route, redirect legacy.

### IA-502 — Header account-aware

- **Problema:** header può mostrare Accedi/Registrati anche con sessione.
- **Root cause:** chrome non collegato a uno stato account canonico.
- **Soluzione:** visualizzare stato guest/sync/auth e azione unica coerente; niente copy promozionale falso.
- **File/componenti:** SiteHeaderV2, AccountProvider, navigation config.
- **Rischio / priorità / dipendenze:** basso; P1; DATA-206, IA-501.
- **Risultato atteso:** stato sessione sempre comprensibile.
- **Acceptance criteria:** una sola CTA account; loading non lampeggia guest.
- **Test richiesti:** hydration, guest/auth/logout, slow session.

### IA-503 — Scope delle route secondarie

- **Problema:** Community e Shop comunicano ampiezza superiore al valore attuale.
- **Root cause:** feature promessa inserita nell’IA prima della maturità.
- **Soluzione:** decidere per ciascuna route keep secondary, label preview, noindex temporaneo o rimozione dalla nav; non cancellare contenuti.
- **File/componenti:** community, shop, nav/footer, sitemap.
- **Rischio / priorità / dipendenze:** basso; P1; IA-501, product owner decision.
- **Risultato atteso:** IA non sovrapromette.
- **Acceptance criteria:** ogni route ha owner, KPI e release status.
- **Test richiesti:** link crawl, metadata/noindex, content QA.

### IA-504 — Search unica e URL-driven

- **Problema:** archivio, header e command palette cercano dataset differenti; query non sempre resta nell’URL.
- **Root cause:** tre consumer indipendenti.
- **Soluzione:** search service sul repository canonico, pesi exact/name/tag, URL query come source, command palette con stessi risultati.
- **File/componenti:** MobileCatalogView, GlobalCommandPalette, archive page, DATA repository.
- **Rischio / priorità / dipendenze:** medio; P1; DATA-202, CORE-401.
- **Risultato atteso:** risultati rilevanti, condivisibili e ripristinabili.
- **Acceptance criteria:** “Blink” ordina Blink per primo e non include falsi positivi non giustificati; back/forward conserva filtri.
- **Test richiesti:** relevance fixture, accented text, URL encode, no results, keyboard.

---

## PHASE 6 — CORE USER FLOW COMPLETION

### FLOW-601 — Rendere Decision Memory editabile

- **Problema:** il modello esiste ma il board attivo non apre/edit note e non monta stage toggle.
- **Root cause:** refactor visuale ha sostituito il consumer completo.
- **Soluzione:** integrare stage, reason, note, pin e outcome nel board canonico; eliminare header legacy.
- **File/componenti:** MobileShortlistBoard, ShortlistStageToggle, ToolWorkspacePanel, workspace store.
- **Rischio / priorità / dipendenze:** alto; P0; DATA-204/206, DS-304.
- **Risultato atteso:** shortlist diventa workspace decisionale.
- **Acceptance criteria:** guest crea/modifica/recupera nota, stage e outcome; account sync li preserva.
- **Test richiesti:** E2E add/edit/delete, reload, merge, a11y sheet.

### FLOW-602 — Contratto Compare spiegabile

- **Problema:** score usa level/featured/highlights, hash e ordine; UI lo presenta come winner.
- **Root cause:** spettacolarità progettata prima della metodologia.
- **Soluzione:** definire dimensioni, fonti, missing data, pesi e confidence; rimuovere offset/order; nessun winner senza objective/evidenza.
- **File/componenti:** tool-battle-shared.ts, compare score types, editorial data.
- **Rischio / priorità / dipendenze:** molto alto; P0; DATA-201/202, product/editorial owner.
- **Risultato atteso:** confronto ripetibile e difendibile.
- **Acceptance criteria:** ordine candidati non cambia output; ogni dimensione è spiegata; dati insufficienti dichiarati.
- **Test richiesti:** permutation/property test, missing data, equal score, snapshot copy.

### FLOW-603 — Compare per obiettivo

- **Problema:** objective engine esiste ma la UI passa null.
- **Root cause:** integrazione incompleta nel redesign.
- **Soluzione:** objective selector, rubriche per fit, evidence panel e risultato immediato; reveal animation opzionale.
- **File/componenti:** MobileCompareView, DesktopCompareView, tool-battle-shared, compare CSS.
- **Rischio / priorità / dipendenze:** alto; P1; FLOW-602.
- **Risultato atteso:** l’utente capisce “miglior fit per X”, non un campione assoluto.
- **Acceptance criteria:** objective persistito; cambio objective aggiorna dimensioni spiegate.
- **Test richiesti:** mobile/desktop, keyboard, no objective, deep link.

### FLOW-604 — Compare → Decision

- **Problema:** il flow termina al verdetto/confetti.
- **Root cause:** nessun owner del loop completo.
- **Soluzione:** CTA “Registra decisione”, scelta/scarto/rimanda, motivo, timestamp e ritorno a Salvati.
- **File/componenti:** compare views, Decision Memory/store, shortlist page.
- **Rischio / priorità / dipendenze:** alto; P0; FLOW-601/603.
- **Risultato atteso:** il confronto produce valore futuro.
- **Acceptance criteria:** decisione visibile in shortlist/account dopo reload e login.
- **Test richiesti:** E2E compare→decision→return; conflict/undo.

### FLOW-605 — Account conversion trasparente

- **Problema:** sync e reward possono essere scoperti solo dopo l’azione.
- **Root cause:** conversion CTA aggiunte per feature.
- **Soluzione:** spiegare cosa resta locale e cosa sincronizza; non promettere XP/run non preservati; mostrare sync status e recovery.
- **File/componenti:** account, auth page, Vibe Rush post-run, header.
- **Rischio / priorità / dipendenze:** medio; P1; DATA-206, GAM scope decision.
- **Risultato atteso:** conversione senza pressione o perdita percepita.
- **Acceptance criteria:** copy corrisponde al comportamento; errore sync recuperabile.
- **Test richiesti:** guest/auth/local-only/service unavailable.

### FLOW-606 — Radar affidabile

- **Problema:** vista triplica fetch e prediction resolver usa placeholder hash.
- **Root cause:** UI e backend prediction sviluppati separatamente.
- **Soluzione:** query condivisa; feature-flag prediction/reward finché baseline storica e schedule non sono reali.
- **File/componenti:** radar page/views, Product Hunt API, Supabase prediction function/schedule.
- **Rischio / priorità / dipendenze:** alto; P0 se reward pubblico, P1 altrimenti; SAF-004.
- **Risultato atteso:** Radar utile anche senza gamification falsa.
- **Acceptance criteria:** una chiamata per range; fallback esplicito; nessun XP da placeholder.
- **Test richiesti:** live/missing token/error/cache/timeout, scheduled resolver staging.

---

## PHASE 7 — MOBILE FINALIZATION

### MOB-701 — Unificare bottom nav, FAB e mission entry point

- **Problema:** Vibe Rush e mission launcher competono con la bottom nav e con il quinto item.
- **Root cause:** entry point globali aggiunti indipendentemente.
- **Soluzione:** un solo slot floating governato dalla shell; Vibe Rush non globale al launch; reserved inset per contenuto.
- **File/componenti:** MobileBottomNav, SiteHeaderV2, GameMissionDrawer, VibeTap launcher, global CSS.
- **Rischio / priorità / dipendenze:** medio; P1; SAF-004, DS-304.
- **Risultato atteso:** nessuna CTA o label coperta.
- **Acceptance criteria:** zero overlap a 320/360/390/412 e con safe area; quinto item leggibile.
- **Test richiesti:** screenshot, touch hit testing, orientation, iOS/Android.

### MOB-702 — Ridurre densità Catalogo e priorità sponsor

- **Problema:** sponsor domina above-the-fold e card a due colonne comprimono differenze/azioni.
- **Root cause:** monetizzazione e grid mobile ottimizzate separatamente dal task.
- **Soluzione:** spostare placement dopo il primo valore utile; definire card list/compact grid con copy minima utile e action rail protetta.
- **File/componenti:** archive page, MobileCatalogView, NativePlacement, ToolCard.
- **Rischio / priorità / dipendenze:** medio; P1; DS-306, CORE-401.
- **Risultato atteso:** l’utente vede categorie o tool prima dell’ad.
- **Acceptance criteria:** primo tool/category above fold su 390 px; action non coperta; sponsor disclosure chiara.
- **Test richiesti:** empty/filter/search/sponsor on-off, 320–430.

### MOB-703 — Viewport, tastiera e sheet

- **Problema:** tastiera virtuale e sheet non sono stati certificati.
- **Root cause:** nessuna device matrix.
- **Soluzione:** standardizzare dvh/svh, safe area, scroll lock, focus-to-input e sheet height; evitare fixed action sotto tastiera.
- **File/componenti:** gate, auth, search panel, note sheet, drawer/sheet primitives.
- **Rischio / priorità / dipendenze:** alto; P1; DS-304, A11Y work.
- **Risultato atteso:** form e sheet utilizzabili con tastiera.
- **Acceptance criteria:** input e submit sempre visibili; close/recovery accessibili.
- **Test richiesti:** Safari iOS, Chrome Android, autofill, portrait/landscape.

### MOB-704 — Home time-to-value

- **Problema:** hero full viewport, intro e pagina oltre sei viewport ritardano discovery.
- **Root cause:** ogni sezione progettata come momento hero.
- **Soluzione:** mantenere identità, ridurre intro automatica, dare priorità a catalog/Radar e progressive disclosure delle sezioni successive.
- **File/componenti:** home page, Home3DHero, VibeHomeV2, IntroCinematic3D.
- **Rischio / priorità / dipendenze:** medio; P2; SAF-004, performance baseline.
- **Risultato atteso:** accesso rapido al primo valore senza perdere brand.
- **Acceptance criteria:** CTA primaria nel primo viewport; intro non blocca; nessuna section obbligatoriamente 100vh senza ragione.
- **Test richiesti:** first visit/return/reduced motion, 320–844 height.

---

## PHASE 8 — DESKTOP FINALIZATION

### DESK-801 — Catalogo desktop intenzionale

- **Problema:** desktop usa MobileCatalogView.
- **Root cause:** mobile refactor promosso a universale.
- **Soluzione:** condividere query/state e creare composizione desktop con filtri persistenti, grid leggibile e compare tray.
- **File/componenti:** FloatingCatalogView, MobileCatalogView estratti, archive page.
- **Rischio / priorità / dipendenze:** alto; P1; CORE-401, DATA-202.
- **Risultato atteso:** uso efficiente dello spazio senza divergenza funzionale.
- **Acceptance criteria:** nessun doppio store/fetch; max-width e line length coerenti.
- **Test richiesti:** 1024/1280/1440/1920, keyboard, resize boundary.

### DESK-802 — Salvati desktop

- **Problema:** desktop usa sempre MobileShortlistBoard.
- **Root cause:** visual redesign non ha mantenuto il workspace desktop.
- **Soluzione:** board/lista desktop sullo stesso store con stage/note/decision side panel.
- **File/componenti:** shortlist page, MobileShortlistBoard/shared view model, workspace panel.
- **Rischio / priorità / dipendenze:** alto; P1; FLOW-601.
- **Risultato atteso:** Decision Memory più leggibile e produttiva.
- **Acceptance criteria:** stessa funzionalità mobile; nessun feature fork.
- **Test richiesti:** saved 0/1/20, long notes, keyboard, 1024–1920.

### DESK-803 — Compare desktop e matrice

- **Problema:** layout potente ma CSS ridefinito molte volte e view mobile montata insieme.
- **Root cause:** fix incrementali e responsive CSS-only.
- **Soluzione:** un albero desktop lazy, grid/matrix baseline unica e objective/evidence sticky dove utile.
- **File/componenti:** ToolBattleView, DesktopCompareView, compare.css, globals compare blocks.
- **Rischio / priorità / dipendenze:** molto alto; P1; FLOW-602/603, DS-301.
- **Risultato atteso:** matrice stabile e spiegabile.
- **Acceptance criteria:** 2–5 tool senza overflow; headers/row align; mobile non montato.
- **Test richiesti:** permutation data, 1024/1440/1920, zoom 200%, screenshot diff.

### DESK-804 — Radar desktop unico

- **Problema:** table e nodes eseguono consumer/fetch separati.
- **Root cause:** due direzioni visuali lasciate attive.
- **Soluzione:** scegliere un primary view con toggle opzionale lazy; query Product Hunt centralizzata.
- **File/componenti:** radar page, DesktopRadarTable, DesktopRadarNodes, query hook.
- **Rischio / priorità / dipendenze:** medio; P1; FLOW-606.
- **Risultato atteso:** densità desktop senza triplo costo.
- **Acceptance criteria:** una richiesta; fallback unico; switch non perde range.
- **Test richiesti:** live/fallback, resize, keyboard/table semantics.

---

## PHASE 9 — GAMIFICATION & ENGAGEMENT CONSOLIDATION

### GAM-901 — Rendere reward server-authoritative

- **Problema:** client invia XP delta, RPC non verificano sempre identità/idempotenza e le policy di game_profiles possono consentire update diretti del profilo/XP.
- **Root cause:** reward API generica e autorità distribuita tra client, RPC e profilo mutabile.
- **Soluzione:** decisione backbone: OFF disabilita lato server ogni mutation/RPC reward e revoca update diretti; ON implementa eventi allowlisted con event ID, reward server-side, auth.uid, RLS, rate limit, quota/cooldown e ledger immutabile.
- **File/componenti:** lib/gamification/actions.ts, RPC/RLS migrations, game_profiles, game interaction schema, edge functions.
- **Rischio / priorità / dipendenze:** molto alto; P0 per decidere e provare OFF/ON; SEC-102/104/105, SAF-004.
- **Risultato atteso:** backbone OFF non espone reward mutation, pur consentendo surface locali senza reward; ON non consente XP manipolabile/replayabile.
- **Acceptance criteria:** OFF: nessuna affordance/copy/mutation reward e chiamate reward dirette negate; la UI LOCAL_NO_REWARD può restare. ON: delta client ignorato, update diretto negato, double submit idempotente, spoof fallisce e quota/cooldown applicati.
- **Test richiesti:** manifest OFF/ON, direct API/RPC, matrice RLS authenticated, tampering, replay, concurrency, cross-user, quota/cooldown e rate limit.

### GAM-902 — Mission lifecycle reale o rimozione

- **Problema:** missioni create con progress 0 senza updater.
- **Root cause:** event backbone mancante.
- **Soluzione:** scegliere: OFF; LOCAL_NO_REWARD con progress/completed senza claim; oppure REWARDED con pipeline tipizzata progress/completed/claim.
- **File/componenti:** reset-daily-missions, claim RPC, GameMissionDrawer/Panel, event emitter.
- **Rischio / priorità / dipendenze:** alto; P0; OFF/local richiedono SAF-004; solo REWARDED richiede GAM-901 ON.
- **Risultato atteso:** nessuna missione impossibile.
- **Acceptance criteria:** OFF: drawer/request assenti. LOCAL_NO_REWARD: progress reale e nessuna mutation XP. REWARDED: missione completabile/claimabile una volta; timezone definito.
- **Test richiesti:** matrix modalità, direct reward denial per off/local; rewarded lifecycle, double claim, missed cron, timezone e offline.

### GAM-903 — Hidden Signal, Arena e prediction integrity

- **Problema:** input client influenza expected slug/date; Arena XP senza quota; prediction placeholder.
- **Root cause:** autorità distribuita e dati non verificati.
- **Soluzione:** calcolare candidati/date/rank sul server, verificare auth, baseline e schedule; disabilitare reward finché non reale.
- **File/componenti:** actions, hidden signal RPC, arena migration/actions, resolve-radar-predictions.
- **Rischio / priorità / dipendenze:** molto alto; P0; OFF/LOCAL_NO_REWARD richiedono SAF-004; REWARDED richiede GAM-901 ON e, per prediction, FLOW-606.
- **Risultato atteso:** reward basato su eventi verificabili.
- **Acceptance criteria:** OFF: superficie assente. LOCAL_NO_REWARD: superficie attiva, zero mutation/copy reward e direct reward denial. REWARDED: input manipolato fallisce e actual rank proviene da snapshot versionato.
- **Test richiesti:** manifest per superficie, OFF UI/network, local reward-network/direct RPC denial; rewarded forged list/date/user, repeated battle e scheduled resolver.

### GAM-904 — Riposizionare Vibe Rush

- **Problema:** clicker globale più visibile del decision workspace e signup promette salvataggio non validato.
- **Root cause:** minigame trattato come loop primario.
- **Soluzione:** Easter egg o area account/Radar; nessun FAB globale; prima del signup dichiarare esattamente cosa viene conservato; se persiste una run, usare pending run firmata e validata server-side, altrimenti non prometterne il recupero.
- **File/componenti:** SiteHeaderV2, VibeTapMiniGame, account conversion, flags.
- **Rischio / priorità / dipendenze:** medio; P1; SAF-004; solo il ramo persistente richiede GAM-901 ON.
- **Risultato atteso:** gamification non invade il core task.
- **Acceptance criteria:** comune: nessun overlap e copy XP accurata. Senza persistenza: nessun payload/attach pending e nessuna promessa. Con persistenza: firma, expiry, anti-replay e attach/retry idempotenti.
- **Test richiesti:** no-persistence UI/network proof; oppure guest/auth attach success/failure/retry e pending run tampering/replay/expiry; focus/a11y e safe area.

### GAM-906 — Leaderboard canonica o disattivata

- **Problema:** la leaderboard può esporre totali incompleti o derivati da profili mutabili, erodendo fiducia e incentivando abuso.
- **Root cause:** nessuna proiezione canonica lega ranking, ledger reward e identità verificata.
- **Soluzione:** decisione binaria: OFF rimuove entry point/query/copy per il lancio; ON deriva la classifica esclusivamente dal ledger/profilo server-authoritative con regole di tie, privacy e refresh documentate.
- **File/componenti:** leaderboard UI/query, game_profiles, reward ledger/RPC, feature flags.
- **Rischio / priorità / dipendenze:** molto alto; P0; OFF richiede SAF-004; ON richiede SEC-105 e GAM-901 ON.
- **Risultato atteso:** nessuna classifica pubblica non affidabile.
- **Acceptance criteria:** con flag OFF nessun entry point o request; con flag ON ranking riproducibile dal ledger, update diretto negato e privacy rule applicata.
- **Test richiesti:** flag on/off, forged profile, tie, pagination, refresh, privacy/anonymous display e multi-user ranking.

### GAM-905 — Progressione orientata alla decisione

- **Problema:** XP/level e stage/Decision Memory sono due progressioni separate.
- **Root cause:** metriche di engagement basate su volume, non outcome.
- **Soluzione:** definire eventi utili: compare pronto, decisione motivata, test completato, revisit; reward discreti e rari.
- **File/componenti:** event taxonomy, workspace, account, badge definitions.
- **Rischio / priorità / dipendenze:** medio; P4; FLOW-604, REL-1404.
- **Risultato atteso:** engagement allineato al valore.
- **Acceptance criteria:** nessun reward per tap/page view banale; KPI primario decision recorded/revisited.
- **Test richiesti:** analytics event validation, badge rules, abuse review.

---

## PHASE 10 — STATES & EDGE CASES

### STATE-1001 — Correggere error boundary

- **Problema:** app/error.tsx restituisce html/body ma non è global-error.
- **Root cause:** recovery UI e document boundary confusi.
- **Soluzione:** separare segment error e global error; mantenere copy/reset e identità coerente.
- **File/componenti:** app/error.tsx, nuovo app/global-error.tsx se necessario, not-found.
- **Rischio / priorità / dipendenze:** medio; P1; DS-305.
- **Risultato atteso:** recovery React/Next corretta.
- **Acceptance criteria:** error SSR/client/root e reset funzionano senza nested html.
- **Test richiesti:** injected server error, client throw, digest, retry.

### STATE-1002 — State matrix dei flow core

- **Problema:** loading route presenti solo su alcune route; offline/retry non sistematici.
- **Root cause:** stati implementati per pagina.
- **Soluzione:** matrice loading/empty/error/partial/offline/unauthorized/rate-limited per catalog, detail, Radar, shortlist, compare, account e submission.
- **File/componenti:** route loading/error, canonical State components, API clients.
- **Rischio / priorità / dipendenze:** medio; P1; DS-305, DATA/FLOW.
- **Risultato atteso:** nessun dead end.
- **Acceptance criteria:** ogni cella della matrice ha UI e recovery espliciti.
- **Test richiesti:** 4xx/5xx/timeout/offline/slow/empty/partial.

### STATE-1003 — Storage e sync edge cases

- **Problema:** storage corrotto/pieno, multi-tab e merge concorrente non testati.
- **Root cause:** local-first senza fault model.
- **Soluzione:** schema validation, quarantine payload, storage error feedback, BroadcastChannel/storage event e conflict policy.
- **File/componenti:** workspace persistence, sync provider, account.
- **Rischio / priorità / dipendenze:** alto; P1; DATA-204/206.
- **Risultato atteso:** degradazione senza perdita silenziosa.
- **Acceptance criteria:** app resta usabile; utente vede stato local-only/retry.
- **Test richiesti:** corrupted JSON, quota exceeded, two tabs, concurrent device, clock skew.

---

## PHASE 11 — ACCESSIBILITY

### A11Y-1101 — Gate e waitlist accessibili

- **Problema:** modal e form mancano semantica, label, focus e live status.
- **Root cause:** custom overlay/placeholder-only input.
- **Soluzione:** usare Dialog canonico o implementare role/aria/focus/escape; label email/password; aria-live e error association.
- **File/componenti:** GateModal, WaitlistForm, Input.
- **Rischio / priorità / dipendenze:** basso; P1; SEC-107, DS-304.
- **Risultato atteso:** primo contatto accessibile.
- **Acceptance criteria:** screen reader annuncia titolo, campo, error e successo; focus restore.
- **Test richiesti:** axe, NVDA/VoiceOver smoke, keyboard, autofill.

### A11Y-1102 — Overlay e feedback

- **Problema:** note sheet e modali custom non condividono focus contract; feedback multipli possono sovrapporsi.
- **Root cause:** feature-local overlays.
- **Soluzione:** migrare overlay core alla primitive; feedback budget massimo una celebrazione primaria.
- **File/componenti:** note sheet, command palette, game modals, toast/confetti/audio.
- **Rischio / priorità / dipendenze:** medio; P1; DS-304, FLOW-601.
- **Risultato atteso:** focus e annunci prevedibili.
- **Acceptance criteria:** Escape/restore/scroll lock; toast non duplica modal/live region.
- **Test richiesti:** keyboard/screen reader, stacked events, reduced motion/audio off.

### A11Y-1103 — Contrast, touch e semantic sweep

- **Problema:** token muted/accent sotto AA, label piccole e raw controls.
- **Root cause:** styling route-local.
- **Soluzione:** correggere token; target 44 px; sostituire/annotare raw controls core; badge count annunciato.
- **File/componenti:** tokens, nav, catalog, compare, shortlist, account.
- **Rischio / priorità / dipendenze:** medio; P1; DS-302/303/305.
- **Risultato atteso:** AA e touch usability.
- **Acceptance criteria:** contrast check verde; nessun target core <44 px; semantic HTML corretto.
- **Test richiesti:** axe, manual touch, zoom 200%, high contrast mode.

### A11Y-1104 — Reduced motion e media preferences

- **Problema:** ParticleField e altri layer non seguono una policy comune.
- **Root cause:** motion aggiunta per componente.
- **Soluzione:** hook/preference canonica, motion/audio off persistente, pause background/offscreen.
- **File/componenti:** 3D, Orbital, intro, route transitions, audio/music, game effects.
- **Rischio / priorità / dipendenze:** medio; P1; SAF-004, PERF work.
- **Risultato atteso:** esperienza stabile per utenti sensibili e device deboli.
- **Acceptance criteria:** reduced motion evita Canvas non essenziale e loop; nessun contenuto perso.
- **Test richiesti:** OS preference, in-app toggle, reload, visibilitychange.

---

## PHASE 12 — PERFORMANCE

### PERF-1201 — Render responsive esclusivo

- **Problema:** Radar e Compare montano mobile/desktop insieme.
- **Root cause:** CSS-only visibility.
- **Soluzione:** server-safe viewport strategy con dynamic import e fallback identico; non leggere window durante render.
- **File/componenti:** ToolBattleView, radar page/views, viewport utility.
- **Rischio / priorità / dipendenze:** alto; P1; SAF-003, desktop/mobile tasks.
- **Risultato atteso:** un solo tree, fetch e listener.
- **Acceptance criteria:** DOM contiene una sola view; nessuna hydration mismatch al resize.
- **Test richiesti:** SSR/mobile/desktop, resize boundary, profiler, network count.

### PERF-1202 — Query Radar condivisa

- **Problema:** tre consumer possono chiamare lo stesso endpoint.
- **Root cause:** fetch in ogni view.
- **Soluzione:** Query Client/hook unico con key range, cache e fallback centralizzato.
- **File/componenti:** radar mobile/table/nodes, Product Hunt client.
- **Rischio / priorità / dipendenze:** basso; P1; FLOW-606, PERF-1201.
- **Risultato atteso:** una richiesta per range.
- **Acceptance criteria:** network assertion 1; switch view usa cache.
- **Test richiesti:** cache expiry, retry, range change, error.

### PERF-1203 — Capability gate 3D e global layers

- **Problema:** Canvas/particles/orbital/audio caricati quasi ovunque.
- **Root cause:** experience layer globale.
- **Soluzione:** route/capability/reduced-motion/visibility policy, static fallback, lazy import e pause.
- **File/componenti:** RootProviders, marketing layout, Global3DLayer, ParticleField, OrbitalLayer.
- **Rischio / priorità / dipendenze:** alto; P1; SAF-004, A11Y-1104.
- **Risultato atteso:** baseline leggera su low-end e route operative.
- **Acceptance criteria:** zero Canvas con reduced motion; massimo uno globale; page hidden ferma RAF.
- **Test richiesti:** Performance panel, visibility, low-end emulation, memory.

### PERF-1204 — Leak, font, immagini e bundle

- **Problema:** resize leak, quattro font, raw img e route core 407–421 kB.
- **Root cause:** asset policy non centralizzata.
- **Soluzione:** correggere cleanup, ridurre font/weights, migrare immagini attive a Image o loader motivato, rimuovere import/dependency non raggiunti.
- **File/componenti:** account background, app/layout, 9 lint image occurrences, package.
- **Rischio / priorità / dipendenze:** medio; P1; DS-303, legacy verification.
- **Risultato atteso:** minor JS/font/image cost e zero leak.
- **Acceptance criteria:** lint zero; listener count stabile; bundle delta registrato.
- **Test richiesti:** heap/listener, image error/LCP, font CLS, bundle analyzer.

### PERF-1205 — Performance budget CI

- **Problema:** nessuna soglia misurata.
- **Root cause:** build pass usata come proxy performance.
- **Soluzione:** Lighthouse/trace lab più RUM post-launch; budget JS/CSS/image e CWV.
- **File/componenti:** CI, analytics/performance config, docs.
- **Rischio / priorità / dipendenze:** basso; P1; PERF-1201–1204.
- **Risultato atteso:** regressioni bloccate.
- **Acceptance criteria:** LCP/INP/CLS target e budget route approvati; report artifact CI.
- **Test richiesti:** mobile throttled lab, repeat variance, real device baseline.

---

## PHASE 13 — FINAL VISUAL POLISH

### POL-1301 — Migrare Catalogo come prima vertical slice

- **Problema:** nuova fondazione non è adottata dalle route.
- **Root cause:** repaint globale.
- **Soluzione:** migrare Catalogo/ToolCard a token e primitive; poi rimuovere solo override relativi.
- **File/componenti:** archive, catalog components, ToolCard, CSS selectors mappati.
- **Rischio / priorità / dipendenze:** alto; P3; DS-301–306, MOB/DESK catalog.
- **Risultato atteso:** prova del metodo di de-stratificazione.
- **Acceptance criteria:** parity funzionale; CSS relativo ridotto; screenshot approvato.
- **Test richiesti:** 8 viewport, long content, focus/hover/touch.

### POL-1302 — Ricostruire shell CSS Compare

- **Problema:** oltre dieci ridefinizioni della stessa arena e hard guard a fine globals.
- **Root cause:** patch responsive cumulative.
- **Soluzione:** nuova baseline scoped/component CSS; migrare mobile e desktop; cancellare blocchi legacy solo dopo parity.
- **File/componenti:** compare.css, globals compare sections, compare views.
- **Rischio / priorità / dipendenze:** molto alto; P3; FLOW-602/603, DESK-803.
- **Risultato atteso:** layout prevedibile.
- **Acceptance criteria:** 2–5 tool, no overflow, no important hard guard attivo.
- **Test richiesti:** visual regression, matrix alignment, reduced motion, 320–1920.

### POL-1303 — Microcopy e visual hierarchy

- **Problema:** Archivio/Catalogo, winner/verdetto, Accedi/Registrati e piccoli label non sono coerenti.
- **Root cause:** copy distribuita.
- **Soluzione:** glossary, CTA hierarchy, status language e feedback budget; preservare tono italiano premium.
- **File/componenti:** config strings, nav, compare, account, form, state components.
- **Rischio / priorità / dipendenze:** basso; P3; IA/FLOW/DS.
- **Risultato atteso:** prodotto comprensibile e non sovrapromettente.
- **Acceptance criteria:** una label per concetto; CTA primaria unica per view.
- **Test richiesti:** content QA, screen reader copy, screenshot.

---

## PHASE 14 — QA & RELEASE READINESS

### REL-1401 — Gate, crawler e sitemap release mode

- **Problema:** gate blocca anche robots/sitemap e tutte le route.
- **Root cause:** gate hardcoded nel middleware.
- **Soluzione:** modalità prelaunch/public esplicita; allowlist crawler corretta; sitemap dal repository canonico e route scope.
- **File/componenti:** middleware, root page/layout, robots, sitemap, config.
- **Rischio / priorità / dipendenze:** alto; P0; SAF-004, DATA-202, SEC hardening.
- **Risultato atteso:** pubblico accessibile senza indebolire admin/auth.
- **Acceptance criteria:** public/robots/sitemap 200 in public mode; admin redirect; callback magic-link completa il flusso anche quando aperta in browser/device senza cookie gate secondo la policy scelta; prelaunch invariato per le altre route.
- **Test richiesti:** unauth route crawl, auth callback same-browser/other-browser, cache, redirect, preview/prod flags.

### REL-1402 — Metadata e social preview

- **Problema:** OG/Twitter image assente; canonical dinamici incompleti; sitemap omissioni.
- **Root cause:** SEO implementata per route in modo parziale.
- **Soluzione:** OG asset, canonical tool/post/collection, updated dates reali, manifest e social validation.
- **File/componenti:** root metadata, dynamic pages, public assets, sitemap.
- **Rischio / priorità / dipendenze:** basso; P1; DATA-202, REL-1401.
- **Risultato atteso:** preview e indexing coerenti.
- **Acceptance criteria:** validator OG/Twitter verde; nessun localhost; draft esclusi.
- **Test richiesti:** metadata unit/snapshot, crawl, social card screenshot.

### REL-1403 — Privacy, Cookie, Termini e consent

- **Problema:** pagine minime non descrivono titolare, basi, retention, processori, diritti, cookie/storage e condizioni.
- **Root cause:** placeholder di release.
- **Soluzione:** contenuti approvati dal responsabile competente; inventory storage/cookie; consent coerente con analytics; affiliate disclosure.
- **File/componenti:** privacy/cookie/termini, auth/waitlist/form, footer.
- **Rischio / priorità / dipendenze:** alto; P0; owner legale, SEC-103/105, analytics design.
- **Risultato atteso:** raccolta dati supportata da policy pubbliche.
- **Acceptance criteria:** documenti datati/versionati; link al punto di raccolta; consent registrato dove necessario.
- **Test richiesti:** content/legal sign-off, link crawl, consent on/off.

### REL-1404 — Analytics essenziale

- **Problema:** lancio cieco sul core loop.
- **Root cause:** nessuna event taxonomy.
- **Soluzione:** eventi privacy-aware per search, tool view, save, compare start/complete, decision, signup, merge success/failure e return; niente vanity events come KPI primario.
- **File/componenti:** analytics adapter, core flow actions, consent.
- **Rischio / priorità / dipendenze:** medio; P1; REL-1403, DATA/FLOW.
- **Risultato atteso:** misurare valore e drop-off.
- **Acceptance criteria:** schema/version/owner; no PII non necessaria; decision recorded KPI.
- **Test richiesti:** event contract, consent suppression, duplicate prevention.

### REL-1405 — Error tracking, SLI e alert

- **Problema:** solo console e Cloudflare observability, nessun source-map error tracking o alert.
- **Root cause:** monitoring non definito come release gate.
- **Soluzione:** integrazione error tracking, release ID/source map, API trace ID uniforme, SLI e alert; synthetic home/catalog/auth/API.
- **File/componenti:** instrumentation, API helpers, Cloudflare config, runbook.
- **Rischio / priorità / dipendenze:** medio; P0; SEC-101, REL-1403.
- **Risultato atteso:** errori rilevati e attribuibili.
- **Acceptance criteria:** errore test arriva con release/route; alert e ownership verificati.
- **Test richiesti:** injected client/server/API error, source map, synthetic failure.

### QA-1406 — Suite E2E core e security

- **Problema:** 19 unit test non coprono flow e integrità.
- **Root cause:** test concentrati su utility gamification.
- **Soluzione:** E2E core e integration security/RLS; certificare il manifest gamification: E2E completo per REWARDED, assenza mutation per LOCAL_NO_REWARD, assenza UI/request e direct-call denial per OFF.
- **File/componenti:** tests/e2e/integration, fixtures Supabase, gamification release manifest.
- **Rischio / priorità / dipendenze:** medio; P0; tutte le phase P0/P1.
- **Risultato atteso:** release behaviour verificato.
- **Acceptance criteria:** suite ripetibile senza dati personali; ogni superficie rispetta una modalità supportata. Leaderboard accetta solo OFF/REWARDED e rifiuta LOCAL_NO_REWARD.
- **Test richiesti:** happy/failure 400/401/403/404/409/429/500/503; matrix modalità per missioni/Hidden/Arena/prediction/Vibe Rush e OFF/REWARDED per leaderboard.

### QA-1407 — Device e cross-browser certification

- **Problema:** mobile/tablet/desktop e browser non certificati.
- **Root cause:** nessuna matrice QA.
- **Soluzione:** smoke automatizzato più device fisici su Safari iOS e Chrome Android; Chrome/Firefox/Edge/Safari desktop.
- **File/componenti:** QA matrix e bug log; nessuna modifica prodotto diretta.
- **Rischio / priorità / dipendenze:** medio; P0; QA-1406, responsive/a11y/perf.
- **Risultato atteso:** rischi reali di viewport/tastiera/browser chiusi.
- **Acceptance criteria:** nessun P0/P1 aperto; overflow/collision matrix verde.
- **Test richiesti:** 320–1920, zoom, keyboard, touch, orientation, embedded browser se rilevante.

### QA-1408 — Staging rehearsal e go/no-go

- **Problema:** build passa ma deploy/schema/rollback non sono stati provati come unico evento.
- **Root cause:** release process manuale.
- **Soluzione:** clone pulito → fresh DB → migration → seed → deploy staging → smoke → rollback → redeploy; compilare DoD, firmare manifest gamification e go/no-go.
- **File/componenti:** runbook, CI/CD, Cloudflare/Supabase staging.
- **Rischio / priorità / dipendenze:** alto; P0; tutte le phase prelaunch.
- **Risultato atteso:** release ripetibile e reversibile.
- **Acceptance criteria:** DoD 100% e manifest OFF/LOCAL_NO_REWARD/REWARDED firmati; zero waiver P0; waiver P1 solo con owner/data/scadenza e nessun impatto core/security.
- **Test richiesti:** rehearsal completo con log, manifest runtime verificato, rollback e incident drill.

---

## Ordine di chiusura raccomandato

1. PHASE 0 — baseline, CI, E2E, flag, backup.
2. PHASE 1 — security, dependency, migration e gate runtime defect.
3. PHASE 2 — Tool e workspace canonici.
4. PHASE 6 — Decision Memory, Compare e Radar affidabili.
5. PHASE 9 — gamification: harden o disable.
6. PHASE 3–5 — design system, componenti e IA.
7. PHASE 7–8 — mobile e desktop finali.
8. PHASE 10–12 — states, a11y e performance.
9. PHASE 13 — polish e rimozione CSS legacy per slice.
10. PHASE 14 — legal, observability, QA, staging e go/no-go.

## Criterio di scope

**Prima del lancio:** tutti i P0 e P1.  
**Important pre-lancio:** P2 solo dopo P0/P1 verdi.  
**Polish pre-lancio:** P3 solo dopo P0/P1/P2 verdi.  
**Post-lancio:** P4, inclusi progress dashboard, badge collection, recap, reminder e personalizzazione Radar.

## Definition of Done di riferimento

La Definition of Done completa è nella sezione 23 del Master Audit. QA-1408 non può essere chiuso con criteri vaghi: ogni riga deve avere prova, link al test o approvazione competente.
