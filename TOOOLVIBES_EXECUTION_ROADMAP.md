## TooolVibes — Execution Roadmap

**Batch pre-lancio:** 77  
**Coda post-lancio:** POST-01 e successivi, esclusi dal percorso di release  
**Regola:** un batch = uno scope verificabile, un commit, un rollback semplice.  
**Fonte:** `TOOOLVIBES_PRODUCTION_CLOSURE_PLAN.md`.

## Regole operative

- Ogni batch parte da `main` verde e produce un solo commit tematico.
- Migration, redesign, cleanup e dipendenze non vengono mescolati nello stesso batch.
- I test rendono visibile la regressione prima di rimuovere il comportamento precedente.
- Per i dati si usa forward-fix con backup verificato; per il codice il revert del singolo commit.
- “File previsti” è un perimetro, non un’autorizzazione ad allargare lo scope.
- “Non toccare” è un vincolo esplicito: se diventa necessario, si apre un nuovo batch.
- Ogni batch chiude soltanto quando acceptance criteria e test indicati sono verdi.

## Dependency map

| Wave | Batch | Dipendenza di ingresso | Parallelizzazione sicura |
|---|---|---|---|
| A — Safety baseline | B01–B05 | — | B02–B05 dopo B01, con merge coordinato |
| B — Schema e security | B06–B12 | B02, B03, B05 | B07/B08/B09/B12; B10 dopo B09; B11 indipendente dai dati |
| C — Dati e identità | B13–B19 | B02, B03 | Tool B13–B15 e workspace B16–B19 possono procedere come due stream |
| D — Design system e IA | B20–B31 | B03, contratti dati | Fondazioni B20–B24 seriali; B25–B31 per component family |
| E — Core decision loop | B32–B36 | B15, B18, B24 | Decision Memory e Compare iniziano in parallelo, convergono in B35 |
| F — Mobile e desktop | B37–B44 | B25, B32–B36 | Mobile e desktop per route possono procedere in parallelo |
| G — Integrity e inclusion | B45–B63 | B04, B09–B12, core flow | Gamification B45–B52; states B53–B60; a11y B61–B63 |
| H — Performance e polish | B64–B69 | Responsive e design system | B64–B66 separano capability, leak e asset; B68/B69 dopo le fondazioni |
| I — Release systems | B70–B74 | Dati/security stabili | SEO, legal, analytics ed error tracking in stream separati |
| J — Certification | B75–B77 | Tutti i P0/P1 implementativi | Seriale: E2E → device → rehearsal |

**Critical path:** B01 → B02/B03/B05 → B06/B07/B09/B10 → B13/B14/B15 → B16/B17/B18/B19 → B20–B25 → B32–B36 → B37–B44 → B45–B67 → B70–B75 → B76 → B77.

---

## BATCH 01 — Runtime baseline

- **Scope:** allineare Node 22 e npm 10, clean install e version check.
- **Closure task:** SAF-001.
- **File previsti:** `package.json`, `.nvmrc`, `.node-version`, `.npmrc`, README.
- **Rischio / priorità:** basso / P0.
- **Acceptance:** install e quality commands riproducibili sul runtime dichiarato.
- **Test:** version check, `npm ci`, lockfile diff, build smoke.
- **Reversibilità:** revert completo del commit.
- **Non toccare:** dipendenze applicative, CSS, feature.
- **Dipendenze:** nessuna.

## BATCH 02 — CI quality gate

- **Scope:** CI per lint zero-warning, typecheck, unit, Next build e OpenNext build.
- **Closure task:** SAF-002.
- **File previsti:** workflow CI, script `package.json`.
- **Rischio / priorità:** basso / P0.
- **Acceptance:** ogni gate rosso blocca il merge e conserva log/artifact.
- **Test:** run verde e prova controllata di fallimento.
- **Reversibilità:** rimozione del solo workflow.
- **Non toccare:** runtime UI, migration.
- **Dipendenze:** B01.

## BATCH 03 — E2E e visual harness

- **Scope:** Playwright, fixture gate, route smoke, collector console/hydration e screenshot matrix.
- **Closure task:** SAF-003.
- **File previsti:** Playwright config, `tests/e2e`, script test.
- **Rischio / priorità:** basso / P0.
- **Acceptance:** route core a 390 e 1440; errori console/hydration falliscono.
- **Test:** Chromium, Firefox e WebKit smoke; screenshot deterministici.
- **Reversibilità:** test-only revert.
- **Non toccare:** UI per aggiornare artificialmente baseline.
- **Dipendenze:** B01.

## BATCH 04 — Feature flag e kill switch

- **Scope:** config tipizzata con `surfaceEnabled` separato da `persistentRewardsEnabled` per ogni feature game, oltre a gate/3D/audio.
- **Closure task:** SAF-004.
- **File previsti:** `lib/config`, middleware, layout, `RootProviders`.
- **Rischio / priorità:** medio / P0.
- **Acceptance:** ogni surface dichiara modalità ammesse; local non invia mutation; rewarded implica surface+persistence+B45 ON; leaderboard local è invalida.
- **Test:** unit config, SSR env, matrix OFF/LOCAL_NO_REWARD/REWARDED, combinazioni invalide e direct call.
- **Reversibilità:** ripristino default pre-batch.
- **Non toccare:** logica interna delle feature.
- **Dipendenze:** B01.

## BATCH 05 — Backup, rollback e dataset staging

- **Scope:** snapshot schema/dati, restore drill e dataset seed non sensibile.
- **Closure task:** SAF-005.
- **File previsti:** runbook, script/fixture staging, checklist restore.
- **Rischio / priorità:** basso / P0.
- **Acceptance:** restore provato con checksum e tempo registrato.
- **Test:** backup/restore in staging e confronto record/schema.
- **Reversibilità:** solo documenti/fixture; nessuna mutazione produzione.
- **Non toccare:** dati reali di produzione.
- **Dipendenze:** B01.

## BATCH 06 — Migration history repair

- **Scope:** risolvere il doppio `0023` e definire una sequenza forward-safe.
- **Closure task:** SEC-102.
- **File previsti:** migration `0023*`, manifest e runbook DB.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** una storia univoca produce lo schema atteso da zero e da snapshot.
- **Test:** fresh DB, upgrade staging, schema diff.
- **Reversibilità:** forward-fix documentato; backup B05 obbligatorio.
- **Non toccare:** contenuto delle feature non coinvolte.
- **Dipendenze:** B02, B05.

## BATCH 07 — Waitlist schema e contract

- **Scope:** migration waitlist, RLS, normalizzazione, idempotenza e API contract.
- **Closure task:** SEC-103.
- **File previsti:** nuova migration, `/api/waitlist`, repository/test waitlist.
- **Rischio / priorità:** medio / P0.
- **Acceptance:** insert idempotente e autorizzazioni minime su fresh/upgrade DB.
- **Test:** contract API, duplicate email, invalid input, RLS.
- **Reversibilità:** migration forward-safe e route dietro flag.
- **Non toccare:** UI coming soon oltre gli stati API.
- **Dipendenze:** B05, B06.

## BATCH 08 — Patch dipendenze vulnerabili

- **Scope:** patch isolata Next 15.5.20 e toolchain necessaria, senza upgrade broad.
- **Closure task:** SEC-101.
- **File previsti:** `package.json`, lockfile, eventuali compatibilità puntuali.
- **Rischio / priorità:** medio / P0.
- **Acceptance:** advisory diretti applicabili chiusi e build identiche.
- **Test:** audit triage, unit, E2E smoke, Next/OpenNext build, deploy dry-run.
- **Reversibilità:** revert package/lockfile.
- **Non toccare:** refactor feature, CSS.
- **Dipendenze:** B01–B03.

## BATCH 09 — Rate limit e revoca distribuiti

- **Scope:** sostituire `Map` in-memory per magic link, gate e admin auth.
- **Closure task:** SEC-104.
- **File previsti:** auth/gate API, durable store adapter, config Cloudflare.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** limiti e revoca coerenti tra isolate e riavvii.
- **Test:** multi-instance, burst, expiry, revoke, failure store.
- **Reversibilità:** adapter selezionabile con flag in staging.
- **Non toccare:** UX login.
- **Dipendenze:** B02, B04.

## BATCH 10 — Endpoint pubblici e RLS

- **Scope:** chiudere insert anon diretti, validare API e vincolare RPC gamification a `auth.uid()`.
- **Closure task:** SEC-105.
- **File previsti:** RLS/RPC migration, tool/affiliate request API, server actions.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** bypass diretto e XP arbitrario falliscono; flussi legittimi passano.
- **Test:** anon/auth/admin matrix, forged user id, replay e invalid payload.
- **Reversibilità:** migration forward-fix con policy precedente documentata.
- **Non toccare:** valori reward e copy.
- **Dipendenze:** B05, B06, B09.

## BATCH 11 — Gate hydration e accessibilità

- **Scope:** ID stabili, label, Dialog semantics, focus trap/restore e live feedback per gate/waitlist.
- **Closure task:** SEC-107, A11Y-1101.
- **File previsti:** `GateModal`, `WaitlistForm`, `components/ui/input.tsx`.
- **Rischio / priorità:** medio / P0.
- **Acceptance:** zero hydration mismatch; form e dialog annunciati correttamente.
- **Test:** SSR/hydration, axe, keyboard, NVDA/VoiceOver smoke, autofill.
- **Reversibilità:** component-level revert con screenshot baseline.
- **Non toccare:** identità visuale e copy hero.
- **Dipendenze:** B03, B07.

## BATCH 12 — Security header e origin policy

- **Scope:** CSP compatibile, HSTS, frame, referrer, permissions e origin checks.
- **Closure task:** SEC-106.
- **File previsti:** Next/middleware/Cloudflare headers config.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** header presenti senza rompere auth, immagini, font o API.
- **Test:** header integration, CSP report-only, cross-origin negative tests.
- **Reversibilità:** rollout report-only e config revertibile.
- **Non toccare:** componenti UI.
- **Dipendenze:** B02, B03.

## BATCH 13 — Tool domain canonico

- **Scope:** definire schema, identità slug, score provenance e campi editoriali canonici.
- **Closure task:** DATA-201.
- **File previsti:** `types`, adapter directory/Supabase, ADR.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** un solo contract TypeScript copre statico, DB, API e UI.
- **Test:** schema fixtures e compile-time contract tests.
- **Reversibilità:** adapter mantiene entrambe le source senza cambiare output.
- **Non toccare:** UI route e dati DB.
- **Dipendenze:** B02.

## BATCH 14 — Repository Tool unico

- **Scope:** far leggere catalogo, detail, API, sitemap, Compare e Shortlist dallo stesso repository.
- **Closure task:** DATA-202.
- **File previsti:** `lib/data/tools`, route pubbliche/API e adapter.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** stesso slug e stessi campi in ogni consumer.
- **Test:** route/data parity, fallback e missing slug.
- **Reversibilità:** flag source con telemetria di confronto.
- **Non toccare:** layout e stile delle route.
- **Dipendenze:** B13.

## BATCH 15 — Contract test Tool e CMS

- **Scope:** fixture parity tra admin publish, pubblico, API, sitemap e related.
- **Closure task:** DATA-203.
- **File previsti:** test repository/API/admin fixture.
- **Rischio / priorità:** basso / P0.
- **Acceptance:** publish/update/unpublish produce gli stessi risultati ovunque.
- **Test:** integration DB, slug collision e cache invalidation.
- **Reversibilità:** test-only revert.
- **Non toccare:** UI admin.
- **Dipendenze:** B14.

## BATCH 16 — Workspace schema canonico

- **Scope:** definire shortlist, compare, stage, note, decision e versione schema unica.
- **Closure task:** DATA-204.
- **File previsti:** store workspace, discovery types, merge utility, ADR.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** CTA, nav, account e API compilano sullo stesso modello.
- **Test:** reducer/store e invarianti compare/decision.
- **Reversibilità:** compatibility adapter read-only.
- **Non toccare:** migrazione localStorage o UI.
- **Dipendenze:** B02, B03.

## BATCH 17 — Migrazione localStorage non distruttiva

- **Scope:** leggere entrambe le chiavi legacy, deduplicare e scrivere lo schema versionato.
- **Closure task:** DATA-205.
- **File previsti:** store, `lib/discovery/local-storage.ts`, migration test.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** nessun save/note/stage perso; rerun idempotente.
- **Test:** fixture legacy, corrupted JSON, quota e rollback version.
- **Reversibilità:** copia backup della chiave legacy e dual-read temporaneo.
- **Non toccare:** sync remoto.
- **Dipendenze:** B16.

## BATCH 18 — Sync guest/account canonico

- **Scope:** attach, restore, logout e multi-device sul workspace unico.
- **Closure task:** DATA-206.
- **File previsti:** Account/Discovery providers, discovery API, merge utility.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** login non perde dati e logout crea un guest isolato.
- **Test:** guest→account, two tabs/devices, stale remote, concurrent merge.
- **Reversibilità:** flag sync e snapshot locale precedente.
- **Non toccare:** copy conversion e layout Account.
- **Dipendenze:** B16, B17.

## BATCH 19 — Account conversion trasparente

- **Scope:** spiegare cosa viene sincronizzato e mostrare esito/recovery dell’attach.
- **Closure task:** FLOW-605.
- **File previsti:** AccountPanel/auth UI, conversion CTA, copy centralizzata.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** promessa, consenso implicato e stato merge sono comprensibili e veritieri.
- **Test:** guest con/ senza dati, attach success/failure/retry, screen reader.
- **Reversibilità:** copy/UI wrapper revertibile senza cambiare sync.
- **Non toccare:** algoritmo merge B18.
- **Dipendenze:** B18.

## BATCH 20 — Cascade ownership e token foundation

- **Scope:** congelare append-only CSS, mappare owner e promuovere token `tv-*` senza migrare route.
- **Closure task:** DS-301, DS-302.
- **File previsti:** style entrypoint, token file, cascade map/adoption matrix.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** ordine/owner documentati; nuovi valori passano dai token canonici.
- **Test:** CSS build, token contrast snapshot, visual baseline invariata.
- **Reversibilità:** token aliasano i valori esistenti.
- **Non toccare:** rimozione di override o restyling route.
- **Dipendenze:** B03.

## BATCH 21 — Tipografia e font canonici

- **Scope:** ridurre i quattro font globali e definire scala, peso, line-height e fallback.
- **Closure task:** DS-303; quota PERF-1204.
- **File previsti:** root layout, font config, token typography, CSS globale.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** massimo due famiglie necessarie, nessun layout shift aggiuntivo.
- **Test:** visual regression, font request, CLS e fallback offline.
- **Reversibilità:** font variables mantengono alias legacy.
- **Non toccare:** copy o gerarchia delle singole route.
- **Dipendenze:** B20.

## BATCH 22 — Overlay e z-index contract

- **Scope:** livelli canonici, scroll lock, Escape, focus restore e coda overlay.
- **Closure task:** DS-304.
- **File previsti:** Dialog/Drawer/Sheet/Popover, overlay tokens e provider.
- **Rischio / priorità:** alto / P1.
- **Acceptance:** una sola policy per modal, sheet, menu, toast e FAB.
- **Test:** overlay stack, keyboard, scroll, nested trigger, safe area.
- **Reversibilità:** adapter mantiene primitive precedenti.
- **Non toccare:** contenuto dei singoli flow.
- **Dipendenze:** B20.
- **Stato (17 luglio 2026):** completato con scope minimo nel commit `e909f31` ("feat(ui): canonical overlay portal host and z-layer tokens (B22)"). Architettura effettiva: portal host condiviso (`components/ui/overlay-provider.tsx`) + scala token z canonica (base 0 / content 1 / sticky 10 / nav 50 / overlay 80 / modal 90 / floating 100 / toast 110 / effects 120) definita in `styles/tokens.css`.
- **Deviazione dall'acceptance originale (17 luglio 2026):** nessun registry/coda overlay proprietario implementato; focus trap, Escape, inert e scroll lock restano delegati a Base UI/Vaul per evitare double-lock, double-Escape e focus race. Reversibilità affidata a git revert (nessun adapter).
- **Rinviato a B61:** custom overlay (NoteSheet, modali game, gate-modal, intro-cinematic, cinematic-grain, skip-link, brand-intro, route-transition-loader, radar sheet, request-tool-form toast).
- **Follow-up P2 tracciati:** (a) `z-10` hardcoded interno in `components/ui/select.tsx` (righe ~162, ~181); (b) `z-20` hardcoded interno in `components/layout/site-header-v2.tsx` (~riga 294); (c) sonner fuori dall'host condiviso per limite API (z tokenizzato su `--tv-z-toast`); (d) `.game-mission-drawer--mobile` in `app/globals.css` (~19265) ha padding non-layered che neutralizza l'`env()` safe-area della primitiva drawer; (e) residui z off-scale preesistenti in `globals.css` e componenti vari, da censire in piano di tokenizzazione o exemption list.
- **Copertura test (17 luglio 2026):** token-contract statico (8 test), overlay-primitives jsdom (12 test: portal host, defaultOpen, fallback body, container custom, unmount, nesting Dialog/Drawer/Sheet, floating Popover/DropdownMenu/Select/Tooltip, toast z). Gap residui: scroll lock e safe-area senza test dedicati; arbitrato Escape cross-framework reale verificabile solo via E2E browser.

## BATCH 23 — Primitive core canoniche

- **Scope:** contract e varianti minime per Button, Card, Badge e Chip; nessuna migrazione route.
- **Closure task:** DS-305.
- **File previsti:** `components/ui`, showcase design system e test primitive.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** size/state/focus/loading/disabled documentati e testati.
- **Test:** Story/showcase matrix, axe, keyboard, snapshot visuale.
- **Reversibilità:** export legacy restano alias temporanei.
- **Non toccare:** raw control nei consumer.
- **Dipendenze:** B20–B22.
- **Stato (17 luglio 2026):** completato. Architettura effettiva: nuova primitiva Chip canonica su Base UI Toggle (`components/ui/chip.tsx`, varianti default/accent/outline, size sm/default/lg, selected controllato o non controllato, disabled, focus-visible), contract documentato in `docs/design-system/core-primitives.md`, state matrix statica aggiunta alla sezione 02 dello showcase (`components/dev/figma-design-system-showcase.tsx`). Badge allineato al data contract (`data-slot`/`data-variant` espliciti). Nessuna migrazione route, nessuna modifica ai consumer; export legacy invariati (ButtonLink incluso) e reversibilità affidata a git revert.
- **Deviazione dall'acceptance originale (17 luglio 2026):** snapshot visuale Playwright non aggiornato per decisione utente (rebaseline visuale in sospeso); keyboard interaction coperta a livello di contract nativo in jsdom (activation behavior Enter/Space reale delegata al layer E2E browser).
- **Copertura test (17 luglio 2026):** `__tests__/components/ui/core-primitives.test.tsx` — 22 test jsdom: data contract Button/Card/Badge/Chip, varianti e size, disabled, loading con `aria-busy` e soppressione attivazione, toggle Chip controllato/non controllato, keyboard contract nativo, axe-core su ogni matrix di primitiva e sull'intero showcase con zero violazioni (regole `color-contrast` e `region` disabilitate perché jsdom non calcola contrasto reale e i frammenti non sono documenti interi; il contrasto resta garantito dal contract statico sui token).

## BATCH 24 — ToolCard responsive canonica

- **Scope:** una ToolCard con density/slot responsive e azioni save/compare condivise.
- **Closure task:** DS-306.
- **File previsti:** DirectoryToolCard, MobileToolCard, card adapter e test.
- **Rischio / priorità:** alto / P1.
- **Acceptance:** un’unica API rende grid/list/mobile senza perdere informazioni.
- **Test:** 320–1440 px, long copy, missing logo, state save/compare.
- **Reversibilità:** consumer restano sulla vecchia card fino a B58.
- **Non toccare:** layout Catalogo o source Tool.
- **Dipendenze:** B14, B20–B23.
- **Stato (17 luglio 2026):** completato. Architettura effettiva: nuova `CanonicalToolCard` (`components/directory/canonical-tool-card.tsx`) con API unica `tool` + `density` (`grid`/`list`/`mobile`), slot azioni (`actions`/`showActions`), stato workspace riflesso via `data-saved`/`data-compared`; compone le primitive B23 (Card/Badge/Button) e i token `--tv-*`, azioni save/compare affidate ai toggle condivisi esistenti (`ShortlistToggle`/`CompareToggle`), missing logo coperto dal fallback iniziali di `DirectoryToolGlyph`. `DirectoryToolCard` e `MobileToolCard` (estratta in `components/directory/mobile-tool-card.tsx`) sono adapter sottili con export e props invariati; il facade B25 `catalog-result-list.tsx` importa la card dal nuovo modulo con diff minimo comportamentalmente invariato. Contratto documentato in `docs/design-system/canonical-tool-card.md`.
- **Deviazione dall'acceptance originale (17 luglio 2026):** i breakpoint 320–1440 sono verificati come contratto statico di classi responsive in jsdom (le media query reali restano al layer E2E visuale, rebaseline sospesa per decisione utente); la density `list` è nuova superficie canonica senza consumer attivi in questo batch.
- **Copertura test (17 luglio 2026):** `__tests__/components/directory/canonical-tool-card.test.tsx` — 18 test jsdom: slot e informazioni complete in grid, parity informativa list, contratto compatto mobile con fallback descrizione, long copy senza troncatura JS, fallback logo su errore immagine, stati save/compare (saved/not saved, in compare/not) via reset canonico `activateToolWorkspaceOwner`, override slot azioni, adapter export/props, axe-core zero violazioni sulle tre densità e su entrambi gli stati workspace (regole `color-contrast`/`region` disabilitate come in B23).

## BATCH 25 — Catalog controller decomposition

- **Scope:** separare query/filter/url state, result list e sponsor slot da MobileCatalogView.
- **Closure task:** CORE-401.
- **File previsti:** MobileCatalogView, nuovi hook/controller e test search/filter.
- **Rischio / priorità:** alto / P1.
- **Acceptance:** comportamento invariato con componenti testabili e responsabilità isolate.
- **Test:** query URL, filter combinations, zero results, rerender count.
- **Reversibilità:** route continua a montare il facade originale.
- **Non toccare:** visual design e sponsor policy.
- **Dipendenze:** B03, B14.

## BATCH 26 — Sound e interaction layer decomposition

- **Scope:** scomporre InteractionSoundLayerV2 e isolare listener/audio lifecycle.
- **Closure task:** CORE-402; quota PERF-1204.
- **File previsti:** interaction sound/music layer, hook capability e test lifecycle.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** listener singoli, cleanup verificato e audio opt-in persistente.
- **Test:** mount/unmount, route change, visibility, audio off/reduced motion.
- **Reversibilità:** facade conserva API preesistente.
- **Non toccare:** suoni, volume o gamification reward.
- **Dipendenze:** B04, B03.

## BATCH 27 — AccountPanel decomposition

- **Scope:** separare auth, profile, workspace, submission e settings dal pannello monolitico.
- **Closure task:** CORE-403.
- **File previsti:** `components/account/account-panel.tsx`, sottocomponenti e hook.
- **Rischio / priorità:** alto / P1.
- **Acceptance:** stesso flow e copy; ogni sezione ha contract e loading/error propri.
- **Test:** guest/auth states, section unit, E2E account smoke.
- **Reversibilità:** AccountPanel resta facade compositivo.
- **Non toccare:** algoritmo sync B18 e redesign visuale.
- **Dipendenze:** B18, B19, B23.

## BATCH 28 — Admin collections decomposition

- **Scope:** separare list, sync, review, form e mutation orchestration dalla pagina monolitica.
- **Closure task:** CORE-404.
- **File previsti:** admin collections page, repository/hook e componenti admin.
- **Rischio / priorità:** alto / P2.
- **Acceptance:** workflow invariato, mutation serializzate e recovery esplicita.
- **Test:** list/new/review/sync, concurrent mutation, permission/error.
- **Reversibilità:** page facade mantiene route contract.
- **Non toccare:** schema collections o UI pubblica.
- **Dipendenze:** B02, B03, B05.

## BATCH 29 — Navigation registry e scope route

- **Scope:** unica configurazione IA e decisione esplicita su Community, Shop e route secondarie.
- **Closure task:** IA-501, IA-503.
- **File previsti:** marketing strings/nav config, header/footer/bottom nav consumers.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** ogni destinazione ha owner, audience, placement e release flag unici.
- **Test:** link inventory, active route, feature flag e broken-link check.
- **Reversibilità:** config può riprodurre IA esistente.
- **Non toccare:** stile navigation o Account state.
- **Dipendenze:** B04, B20.

## BATCH 30 — Header account-aware

- **Scope:** rendere identità, CTA e conteggi header/bottom nav coerenti col workspace canonico.
- **Closure task:** IA-502.
- **File previsti:** SiteHeaderV2, MobileBottomNav, account/workspace selectors.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** guest/auth copy e counts coincidono su ogni route.
- **Test:** login/logout, save/compare, tab sync, mobile/desktop.
- **Reversibilità:** selector adapter precedente disponibile per un release flag.
- **Non toccare:** struttura IA B29 o design del header.
- **Dipendenze:** B18, B29.

## BATCH 31 — Search unica e URL-driven

- **Scope:** unificare Archivio, command palette e header su indice/query/URL canonici.
- **Closure task:** IA-504.
- **File previsti:** search service, Catalog controller, GlobalCommandPalette, SiteHeaderV2.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** stessa query produce stessi tool; back/forward ripristina lo stato.
- **Test:** “Blink” relevance fixture, typo, empty, deep link, keyboard.
- **Reversibilità:** adapter espone il vecchio search dietro flag.
- **Non toccare:** ranking Compare e layout risultati.
- **Dipendenze:** B14, B25, B29.
- **Stato (18 luglio 2026):** completato. Architettura effettiva: search service canonico deterministico `lib/search/tool-search.ts` (normalizzazione NFD+diaeresi, pesi exact/name/tag/category/description, tolleranza typo Damerau ≤1 solo per token ≥4 caratteri, semantica AND multi-token, URL/source URL mai indicizzati così la mention "blink" nella tracked URL di WeWeb non genera falsi positivi), adapter `lib/search/tool-search-adapter.ts` con engine `canonical` | `legacy-fuse` (config Fuse pre-B31 preservata byte-identica) risolto dal flag `unifiedSearch` (`TOOOLVIBES_UNIFIED_SEARCH_ENABLED`, default ON, pattern B04/B32). Controller catalogo URL-driven: `serializeCatalogUrl` unico per Archivio/palette/header (ordine parametri fisso group/q/tag/level, default omessi), digitazione → `router.replace`, selezione categoria/back → `router.push`, sync `useSearchParams` con guardia echo (`lastWrittenUrlKeyRef`) e skip del mount run così back/forward e deep link ripristinano query/gruppo/tag/livello senza race sui tasti. Palette: `shouldFilter={false}` + input controllato, stessi risultati del service per la stessa query, deep link "Cerca … nell'archivio" verso `/archivio?q=…`, gruppi statici invariati a query vuota. Header search (DirectoryHeaderSearch): submit preserva group/tag/level quando già su `/archivio`, altrove URL canonica con sola query.
- **Deviazione dall'acceptance originale (18 luglio 2026):** (a) il flag `unifiedSearch` è finito nel commit B34 (`b2f4f8d`) perché l'agente parallelo ha stageato l'intero `lib/config/release-features.ts` dal working tree condiviso; contenuto identico al previsto, solo attribuzione commit diversa; (b) la palette espone il prop opzionale `unifiedSearchEnabled` (default canonical) senza threading env da `app/layout.tsx` per non toccare file fuori scope: il rollback via env copre catalogo+header, per la palette il rollback è a livello di engine adapter; (c) il livello entra nell'URL (`level=`) come estensione del contratto filtri oltre al minimo richiesto; (d) nessuna modifica a `site-header-v2.tsx`: la parte search è interamente in `DirectoryHeaderSearch`.
- **Copertura test (18 luglio 2026):** 42 test nuovi — `__tests__/lib/search/tool-search.test.ts` (20: fixture relevance "Blink" con trappola WeWeb/source-URL, determinismo e input mescolato, typo trasposizione/delezione/sostituzione, accented text, empty/no-results, AND multi-token, limit, parità engine legacy), `__tests__/lib/config/release-features-unified-search.test.ts` (3, pattern B32), `__tests__/components/directory/catalog-url-state.test.tsx` (11: serializzazione canonica+encoding, deep link query/livello, replace su digitazione preservando filtri, push categoria con query attiva, popstate back/forward che ripristina query/gruppo/livello, keyboard change/clear, flag OFF senza scritture URL), `__tests__/components/directory/directory-header-search.test.tsx` (7: submit canonico on/off archivio, encoding, preservazione filtri, svuotamento query, mirror q da URL, Enter), `__tests__/components/app/global-command-palette.test.tsx` (7: ⌘K, stessa-query→stessi-tool del service con Blink primo e WeWeb escluso, Enter→deep link tool, deep link archivio con query, typo, empty state, reset query alla chiusura). Mock `next/navigation` esistente esteso con `useSearchParams`/`replace`. Gap residui: nessun debounce sul replace per keystroke (RSC round-trip per battitura, da valutare a gate pubblico aperto); `tool-discovery-app.tsx` (consumer Fuse orfano, non montato) fuori scope e ancora sul vecchio motore; test E2E browser di back/forward reale rimandati alla suite Playwright.

## BATCH 32 — Decision Memory editabile

- **Scope:** rendere raggiungibili stage, note, reopen e decision state dalla Shortlist.
- **Closure task:** FLOW-601.
- **File previsti:** MobileShortlistBoard, MobileNoteSheet, workspace selectors/actions.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** nota e stage si modificano, persistono e riaprono dopo reload/login.
- **Test:** keyboard/touch, empty/long note, guest/auth, migration fixture.
- **Reversibilità:** nuova UI dietro flag, dati compatibili col contract B16.
- **Non toccare:** score Compare o gamification.
- **Dipendenze:** B18, B22–B24.

## BATCH 33 — Compare scoring contract

- **Scope:** sostituire indice/hash/featured con evidenze deterministiche e provenance.
- **Closure task:** FLOW-602.
- **File previsti:** compare score/engine, Tool domain fields e unit test.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** ordine input non cambia risultato; assenza dati riduce confidence.
- **Test:** permutations, missing fields, fixtures e snapshot explanation.
- **Reversibilità:** vecchio score disponibile solo in confronto interno, non nel copy pubblico.
- **Non toccare:** layout Compare.
- **Dipendenze:** B13–B15.

## BATCH 34 — Compare per obiettivo

- **Scope:** objective selector e pesi spiegati condivisi tra mobile e desktop.
- **Closure task:** FLOW-603.
- **File previsti:** Compare views, objective config, engine adapter.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** obiettivo persistito e impatto visibile prima del risultato.
- **Test:** ogni objective, mobile/desktop parity, reload e a11y.
- **Reversibilità:** objective neutro riproduce il contratto base B33.
- **Non toccare:** Decision Memory.
- **Dipendenze:** B33, B23.
- **Stato (18 luglio 2026):** completato. Architettura effettiva: config canonico obiettivi in `lib/compare/compare-objective.ts` (7 obiettivi, keyword map, pesi fonti highlights ×1,5 / casi d'uso ×1 / tag ×0,75 / categoria ×0,5, delta max +15, spiegazione pesi stabile condivisa); persistenza in `lib/hooks/use-compare-objective.ts` (localStorage versionato `tooolvibes:compare-objective:v1` + deep link `?objective=`, fallback sicuro al neutro); selettore radio condiviso `components/tools/compare-objective-selector.tsx` (fieldset/legend, spiegazione pesi sempre visibile); stato sollevato in `ToolBattleView` così mobile e desktop montati insieme restano allineati; impatto visibile pre-risultato via badge delta nelle card e scoreboard ordinato col comparatore canonico del verdetto; flag `compareObjective` (`TOOOLVIBES_COMPARE_OBJECTIVE_ENABLED`, default on) in `lib/config/release-features.ts` passato dalla page; keyword map e costanti spostate da `tool-battle-shared` al config con re-export di compatibilità (`BATTLE_OBJECTIVES`, `BattleObjective`).
- **Deviazione dall'acceptance originale (18 luglio 2026):** persistenza su localStorage dedicato e non nel workspace store canonico B16: l'obiettivo è una preferenza di presentazione del confronto, non un dato decisionale (Decision Memory B32 non toccata); il parametro `?objective=` copre il deep link richiesto da FLOW-603. Reveal animation non modificata (opzionale in FLOW-603); l'evidence panel resta quello del verdetto B33 con ragioni orientate all'obiettivo (top source), senza nuovo pannello per-keyword.
- **Copertura test (18 luglio 2026):** `__tests__/lib/compare/compare-objective.test.ts` (integrità config, validazione, spiegazione pesi per ogni obiettivo, engine per ogni objective: determinismo su permutazioni, bound 0-100, delta ≤ 15, neutro = contratto B33 su score/rank/explanation/verdetto, verdetto orientato e dichiarazione "nessun dato specifico"); `__tests__/lib/config/release-features-compare-objective.test.ts` (flag, pattern B32); `__tests__/components/tools/compare-objective-selector.test.tsx` jsdom (gruppo radio accessibile 8 opzioni, change, persistenza e ripristino dopo reload, deep link che vince sullo storage, valori invalidi → neutro, parity mobile/desktop su ToolBattleView con stato condiviso, badge delta visibile in stato idle prima del reveal, flag OFF senza selettore e punteggi base, axe zero violazioni con regole `color-contrast`/`region`/`landmark-complementary-is-top-level` disabilitate come da pattern esistente per frammenti). Gap residui: keyboard reale tra radio verificata da contratto nativo (activation behavior delegata a E2E); sync cross-tab del localStorage non implementata.
- **Note di gate (18 luglio 2026):** fix proprio sul typography contract (badge delta 0,6875rem → 0,75rem, floor 12px). Fallimenti `test:unit`/`typecheck` residui non correlati e non toccati: `__tests__/scripts/runtime-contract.test.ts` (noto su Node 24), `__tests__/styles/shell-floating-dock-contract.test.ts` e `lib/search/tool-search-adapter.ts` (WIP di altri batch nel working tree condiviso); nessuna build eseguita (owner B31).

## BATCH 35 — Compare verso Decision

- **Scope:** azione esplicita “scegli/annota decisione” con motivazione e ritorno a Shortlist.
- **Closure task:** FLOW-604.
- **File previsti:** Compare result, workspace decision action, Shortlist decision view.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** confronto si chiude in una decisione riapribile con contesto.
- **Test:** choose/change/undo, guest/auth, reload e deep link.
- **Reversibilità:** decision write è additivo e versionato.
- **Non toccare:** reward/XP.
- **Dipendenze:** B32–B34.

## BATCH 36 — Radar data integrity

- **Scope:** eliminare prediction hash placeholder, definire freshness/source/fallback e stati onesti.
- **Closure task:** FLOW-606.
- **File previsti:** Radar prediction/resolver, Product Hunt adapter e UI state.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** ranking/prediction dichiarano source, timestamp e fallback; nessun dato inventato.
- **Test:** live/fallback/stale/error, deterministic resolver e timezone.
- **Reversibilità:** prediction disattivabile via B04.
- **Non toccare:** layout desktop o mission reward.
- **Dipendenze:** B04, B14.
- **Stato (18 luglio 2026):** completato. Architettura effettiva: contratto condiviso `lib/radar/product-hunt-contract.ts` (`source`: `product-hunt-live`/`product-hunt-stale`/`none`, flag `stale`, `updatedAt` di origine, `resolveRadarDataState`, label orarie UTC deterministiche); adapter `app/api/product-hunt/route.ts` con cache dei soli payload live + negative cache breve e fallback stale dichiarato che non riscrive il timestamp di origine; resolver puro `supabase/functions/_shared/radar-prediction-resolver.ts` (modulo condiviso Next/Deno, hash placeholder eliminato, competition ranking deterministico, evidenza `absent-from-product-hunt-live` con score 0, feed assente/vuoto → nessuna risoluzione e pronostici che restano `pending`); edge function `resolve-radar-predictions` riscritta sul resolver condiviso con skip esplicito (`reason: product-hunt-feed-unavailable|empty`) e XP solo con `TOOOLVIBES_GAME_PREDICTION_MODE=REWARDED` (gate B04); UI mobile con header che dichiara provenienza/timestamp/stato, banner `role="status"` per il fallback stale e fetch singola per range (rimosso il doppio effetto di mount che duplicava la chiamata); hook `use-radar-prediction` gated su flag B04 (query inattiva con superficie OFF, mutation solo in REWARDED) e data contesto UTC condivisa col resolver via `getUtcContextDate`.
- **Deviazione dall'acceptance originale (18 luglio 2026):** la desktop view (`components/desktop/desktop-radar-nodes.tsx`) contiene ancora `desktopFallbackItems` con nomi/voti inventati su errore: file assegnato a B44/DESK-804, non toccato per scope e tracciato come gap residuo. La query condivisa cross-view (PERF-1202, hook unico con key range) resta al batch dedicato; qui risolta la doppia fetch di mount della mobile view e l'onestà degli stati.
- **Copertura test (18 luglio 2026):** 24 test nuovi in 4 file — resolver (11: score solo da contatori reali, assenza dal feed dichiarata, feed null/vuoto → nessuna risoluzione, determinismo sotto permutazione, pareggi con stesso rank, rewards off → XP 0, normalizzazione slug, timezone UTC ai confini di giorno/mese/anno); adapter route (5: live con source/timestamp, una chiamata per range entro TTL, missing-token senza dati inventati, error senza cache, fallback stale con `updatedAt` originale preservato); `MobileRadarView` (5: live, stale con fallback dichiarato, error, missing-token, empty, fetch singola); hook (3: gate OFF/LOCAL_NO_REWARD/REWARDED, data contesto UTC). Gap residui: scheduled resolver staging verificabile solo in ambiente Supabase reale; risoluzione end-to-end su DB coperta solo a livello di logica pura.

## BATCH 37 — Mobile navigation e FAB shell

- **Scope:** una sola geometria safe-area per bottom nav, compare badge, mission entry e Vibe Rush.
- **Closure task:** MOB-701.
- **File previsti:** MobileBottomNav, GamificationShell/FAB e shell tokens.
- **Rischio / priorità:** alto / P1.
- **Acceptance:** nessuna sovrapposizione o azione coperta a 320–430 px.
- **Test:** iPhone/Android viewport, scroll end, orientation e reduced motion.
- **Reversibilità:** feature launcher individuali restano flaggabili.
- **Non toccare:** contenuto Catalogo o reward logic.
- **Dipendenze:** B22, B29, B30.
- **Stato (18 luglio 2026):** completato. Architettura effettiva: un solo slot floating `.shell-floating-dock` governato da `components/gamification/gamification-shell.tsx` (mission entry + Vibe Rush nello stesso contenitore fixed, `role="group"`, `data-overlay-open` sincronizzato con lo store overlay mobile B30); geometria safe-area unica token-driven (`--tv-shell-nav-inset-*`, `--tv-shell-fab-size`, `--tv-shell-fab-gap`, `--tv-shell-dock-inset-*` in `styles/tokens.css`, con `env(safe-area-inset-*, 0px)` e fallback); `.game-mission-fab` ridotto a sola identità visiva (niente più `position: fixed` né bottom letterale senza safe-area: su iPhone con home indicator copriva la nav); FAB Vibe Rush rimosso da `SiteHeaderV2` (eliminata anche la geometria legacy `.site-vibe-rush-fab` e l'override desktop `!important` del launcher); mount in `app/layout.tsx` esteso a `missionsEnabled || vibeRushEnabled` (entrambe gated REWARDED come prima: Vibe Rush non globale al launch, nessuna variazione visiva pubblica attesa dietro gate B70); reserved inset a fine scroll via `body:has(.shell-floating-dock) .pb-mobile-nav` (solo < 768px); `.game-mission-drawer--mobile` con padding safe-area (chiude anche il follow-up (d) di B22); deduplicata la geometria `.mobile-bottom-motion` (regola base token-driven unica, media max-1023 senza left/right/bottom duplicati). `!important` in `globals.css`: 2337 → 2325 (solo rimozioni, ceiling check:styles intatto).
- **Deviazione dall'acceptance originale (18 luglio 2026):** (a) toccato `app/layout.tsx` (call site della shell, fuori dai file previsti ma necessario per il gate indipendente dei due launcher); (b) viewport 320–430 px, iPhone/Android e orientation verificati come contract jsdom (DOM stabile a ogni viewport/orientamento) + contract statico CSS sulla sorgente (jsdom non calcola il layout; screenshot/touch hit testing reali rinviati al layer E2E device); (c) la griglia a 5 item e la leggibilità del quinto item erano già garantite da B29/B30: qui aggiunto il contract test esplicito; (d) `lib/config/release-features.ts` NON toccato: conteneva hunk di altri batch paralleli (compareObjective/unifiedSearch) e nessuna nuova flag era necessaria (riuso delle surface `missions`/`vibeRush` B04). Nota di coordinamento: durante il lavoro un processo parallelo ha temporaneamente sovrascritto `site-header-v2.tsx`; le modifiche B37 sono state riapplicate e riverificate a diff pulito.
- **Copertura test (18 luglio 2026):** 41 test nuovi/estesi in 3 file — `__tests__/components/gamification/gamification-shell.test.tsx` (19: slot unico con entrambi i launcher figli dello stesso dock, flaggabilità individuale missions/vibeRush, entrambe OFF → null, route escluse /admin e /auth, `data-overlay-open` on/off, viewport 320/360/390/412/430, orientation portrait/landscape, axe-core zero violazioni); `__tests__/components/layout/mobile-bottom-nav.test.tsx` (+6 nel describe B37: classi del contract geometrico, quinto item Confronto con label e badge su grid-cols-5, viewport 320–430 con badge nel DOM, orientation, overlay → opacity-0 + pointer-events-none); `__tests__/styles/shell-floating-dock-contract.test.ts` (16 statici: token `--tv-shell-*` definiti, composizione dock inset con safe-area, dock unico fixed senza `!important`, FAB missioni senza auto-positioning, rimozione `.site-vibe-rush-fab`, nav base su token, stato overlay dichiarato, reduced motion con `transition: none`, reserved inset scroll end, drawer safe-area). Gap residui: screenshot e touch hit testing su device reale iOS/Android (E2E); certificazione visuale con flag gamification REWARDED attive rinviata al batch di abilitazione reward.

## BATCH 38 — Catalog density e sponsor policy

- **Scope:** definire una colonna sotto soglia, information priority e sponsor dopo valore organico.
- **Closure task:** MOB-702.
- **File previsti:** Catalog result layout, sponsor slot, ToolCard density config.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** title/use case/CTA leggibili; sponsor non precede il primo valore utile.
- **Test:** 320/360/390/430, long copy, sponsor absent/present e scroll end.
- **Reversibilità:** layout variant dietro flag route.
- **Non toccare:** search controller o source Tool.
- **Dipendenze:** B24, B25, B31, B37.

## BATCH 39 — Mobile keyboard, viewport e sheet

- **Scope:** policy `dvh`, safe area, scroll-to-input e sheet con tastiera.
- **Closure task:** MOB-703.
- **File previsti:** shell/overlay CSS, Gate/Auth/Search/NoteSheet form wrappers.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** input, submit e close restano visibili con tastiera aperta.
- **Test:** iOS Safari/Android Chrome, autofill, orientation e zoom.
- **Reversibilità:** utility CSS isolata.
- **Non toccare:** validation business o copy.
- **Dipendenze:** B11, B22, B32, B37.

## BATCH 40 — Home time-to-value

- **Scope:** ridurre intro/chrome concorrenziale e portare discovery utile nel primo viewport.
- **Closure task:** MOB-704.
- **File previsti:** Home, intro, marketing shell e feature placement.
- **Rischio / priorità:** medio / P2.
- **Acceptance:** CTA primaria e primi segnali tool senza attesa obbligatoria; brand preservato.
- **Test:** first/new session, repeat session, 390 px, reduced motion e visual regression.
- **Reversibilità:** ordine sezioni e intro restano flaggabili.
- **Non toccare:** linguaggio visuale cosmic o dati dei tool.
- **Dipendenze:** B04, B29, B37.

## BATCH 41 — Catalogo desktop intenzionale

- **Scope:** composizione desktop con filtri persistenti, griglia leggibile e density appropriata.
- **Closure task:** DESK-801.
- **File previsti:** Archivio route, Catalog facade e desktop layout.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** 1024–1920 px usa lo spazio senza allungare eccessivamente righe/card.
- **Test:** laptop/wide, keyboard, resize, empty/loading/error e visual regression.
- **Reversibilità:** mobile facade invariato e desktop variant flaggabile.
- **Non toccare:** search logic, sponsor policy o ToolCard API.
- **Dipendenze:** B24, B25, B31, B38.

## BATCH 42 — Salvati desktop

- **Scope:** board/lista desktop con stage, note e compare side action.
- **Closure task:** DESK-802.
- **File previsti:** Shortlist route, Decision Memory components e desktop layout.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** grandi viewport accelerano il confronto senza duplicare il modello mobile.
- **Test:** keyboard, 1024/1440/1920, long note e empty state.
- **Reversibilità:** usa lo stesso controller B32; view desktop flaggabile.
- **Non toccare:** workspace schema o scoring.
- **Dipendenze:** B32, B35.

## BATCH 43 — Compare desktop e render esclusivo

- **Scope:** ricostruire shell/matrice desktop e montare un solo tree responsive per Compare.
- **Closure task:** DESK-803, POL-1302; quota PERF-1201.
- **File previsti:** Compare page/views, compare CSS e viewport boundary.
- **Rischio / priorità:** alto / P1.
- **Acceptance:** matrice leggibile, una sola view nel DOM e nessun hard guard legacy.
- **Test:** SSR, 390/1024/1440/1920, resize boundary, profiler e visual diff.
- **Reversibilità:** view precedenti dietro flag fino alla certificazione.
- **Non toccare:** score/objective/decision contract B33–B35.
- **Dipendenze:** B22–B24, B33–B35.

## BATCH 44 — Radar desktop e query unica

- **Scope:** una composizione desktop e una sola query/cache per tutte le rappresentazioni Radar.
- **Closure task:** DESK-804, PERF-1202; quota PERF-1201.
- **File previsti:** Radar page, MobileRadarView, DesktopRadarTable/Nodes e query hook.
- **Rischio / priorità:** alto / P1.
- **Acceptance:** una view montata, una request per key e timestamp/fallback coerenti.
- **Test:** network count, SSR/resize, live/fallback/error, 390–1920 px.
- **Reversibilità:** visual node/table selezionabili via config senza doppio mount.
- **Non toccare:** prediction integrity B36 o reward missioni.
- **Dipendenze:** B03, B36.

## BATCH 45 — Reward backbone release decision

- **Scope:** prima del commit scegliere un solo branch: OFF disabilita tutte le mutation reward lato server; ON implementa ledger/allowlist, revoca update diretto e quota/cooldown.
- **Closure task:** GAM-901.
- **File previsti:** game actions/RPC/RLS migration, `game_profiles`, reward event contracts.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** OFF: nessuna affordance/copy/mutation reward e direct reward call negata, ma surface LOCAL_NO_REWARD consentite. ON: replay, forged delta/user e update diretto non incrementano XP.
- **Test:** manifest branch; OFF reward-network/direct RPC con surface locale attiva; ON RLS, update, concurrency, idempotency, quota/cooldown, rate limit e ledger.
- **Reversibilità:** OFF è config+deny revertibile; ON usa kill switch e migration forward-fix.
- **Non toccare:** valori/bilanciamento reward.
- **Dipendenze:** B09, B10.

## BATCH 46 — Mission lifecycle release mode

- **Scope:** scegliere OFF, LOCAL_NO_REWARD con progress reale, oppure REWARDED con claim idempotente; definire reset/timezone.
- **Closure task:** GAM-902.
- **File previsti:** mission RPC/actions/UI e scheduler/reset.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** OFF elimina UI/request; local completa senza XP mutation; rewarded completa/claim una volta ed è auditabile.
- **Test:** matrix modalità, direct reward denial off/local; rewarded progress, duplicate claim, reset, offline/retry.
- **Reversibilità:** kill switch missioni.
- **Non toccare:** badge/level visual system.
- **Dipendenze:** B04; solo REWARDED richiede B45 ON.

## BATCH 47 — Hidden Signal integrity

- **Scope:** ownership server-side di candidati/slug e claim idempotente; altrimenti superficie e reward OFF.
- **Closure task:** GAM-903.
- **File previsti:** Hidden Signal action/RPC, candidate resolver e feature flag.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** modalità OFF/LOCAL_NO_REWARD/REWARDED registrata; se rewarded, input client non auto-valida il segnale.
- **Test:** matrix modalità; OFF/local direct reward denial; rewarded forged slug/list/user, replay, multi-tab e stale candidate.
- **Reversibilità:** kill switch Hidden Signal.
- **Non toccare:** Arena, Radar prediction o presentazione Vibe Rush.
- **Dipendenze:** B04; solo REWARDED richiede B45 ON.

## BATCH 48 — Arena integrity

- **Scope:** evento battle server-verificabile con idempotenza e quota/cooldown; altrimenti Arena XP OFF.
- **Closure task:** GAM-903.
- **File previsti:** Arena actions/migration, battle event contract e feature flag.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** modalità OFF/LOCAL_NO_REWARD/REWARDED registrata; local non muta XP; rewarded resiste a run ripetute/concorrenti.
- **Test:** matrix modalità; OFF/local direct reward denial; rewarded replay, concurrency, wrong user, quota e cooldown.
- **Reversibilità:** kill switch Arena reward.
- **Non toccare:** Hidden Signal, prediction o gameplay visuale.
- **Dipendenze:** B04; solo REWARDED richiede B45 ON.

## BATCH 49 — Radar prediction reward integrity

- **Scope:** validare outcome su snapshot rank versionato e disabilitare reward finché il resolver non è reale.
- **Closure task:** GAM-903; quota FLOW-606.
- **File previsti:** prediction resolver/RPC, rank snapshot e schedule.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** modalità OFF/LOCAL_NO_REWARD/REWARDED registrata; se rewarded, actual rank non deriva da hash/input client.
- **Test:** matrix modalità; OFF/local direct reward denial; rewarded stale/missing snapshot, forged date/rank/user e resolver.
- **Reversibilità:** kill switch prediction reward.
- **Non toccare:** layout Radar, Hidden Signal o Arena.
- **Dipendenze:** B04 e B36; solo REWARDED richiede B45 ON.

## BATCH 50 — Leaderboard canonica o OFF

- **Scope:** proiezione server-authoritative con privacy/tie/refresh, oppure rimozione completa dal lancio.
- **Closure task:** GAM-906.
- **File previsti:** leaderboard UI/query, reward ledger, `game_profiles` e flag.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** supporta solo OFF o REWARDED; LOCAL_NO_REWARD è config invalida. OFF produce zero entry/request; rewarded è riproducibile dal ledger.
- **Test:** OFF/REWARDED, invalid local config, forged profile, tie, pagination, refresh, privacy e multi-user ranking.
- **Reversibilità:** kill switch leaderboard.
- **Non toccare:** livelli/badge o bilanciamento XP.
- **Dipendenze:** B04 e B10; solo il branch ON richiede B45 ON.

## BATCH 51 — Vibe Rush guest/account integrity

- **Scope:** copy veritiera e pending run firmata/validata, oppure nessuna promessa di recupero al signup.
- **Closure task:** GAM-904.
- **File previsti:** VibeTapMiniGame, account conversion e pending-run action.
- **Rischio / priorità:** alto / P1.
- **Acceptance:** LOCAL_NO_REWARD: nessun payload/attach pending né promessa. REWARDED: firma/expiry, attach/retry idempotenti e tampering negato.
- **Test:** local UI/network/direct reward denial; oppure rewarded guest/auth attach success/failure/retry, tampering, replay e expiry.
- **Reversibilità:** persistence run disattivabile senza perdere il gioco locale.
- **Non toccare:** placement/FAB, gameplay o reward amounts.
- **Dipendenze:** B18 e B19; solo REWARDED richiede B45 ON.

## BATCH 52 — Vibe Rush placement e opt-in

- **Scope:** Easter egg/area dedicata, nessun FAB globale e rispetto opt-in/kill switch.
- **Closure task:** GAM-904.
- **File previsti:** GamificationShell, launcher, navigation placement e flag.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** discovery/decision restano primarie; il gioco non copre nav/CTA e resta assente quando OFF.
- **Test:** flag, new/repeat user, mobile shell, focus, reduced motion e audio off.
- **Reversibilità:** placement/config revertibile.
- **Non toccare:** pending run B51, gameplay o reward amounts.
- **Dipendenze:** OFF richiede B04 e B37; Vibe Rush ON richiede anche B51.

## BATCH 53 — Error boundary corretta

- **Scope:** spostare `html/body` al global error appropriato e preservare reset/recovery.
- **Closure task:** STATE-1001.
- **File previsti:** `app/error.tsx`, eventuale `app/global-error.tsx`, error test route.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** errori client/SSR mostrano recovery valido senza nesting HTML errato.
- **Test:** throw SSR/client, reset, navigation recovery e console.
- **Reversibilità:** boundary precedente conservabile come componente presentazionale.
- **Non toccare:** monitoring o copy non necessario.
- **Dipendenze:** B03.
- **Stato (18 luglio 2026):** completato. Architettura effettiva: UI di recovery estratta in `components/app/error-recovery-view.tsx` come componente presentazionale (copy, digest, reset e identità visiva della boundary precedente conservate, aggiunto link opzionale "Torna alla home" per navigation recovery); `app/error.tsx` ridotto a segment boundary sottile che NON renderizza più `html`/`body`; nuovo `app/global-error.tsx` document boundary, unico owner del document shell (`<html lang="it"><body>`), che riusa la stessa recovery view. Dev harness `app/dev/error-trigger/` (page server + client) per throw SSR via `?mode=ssr` e throw client via bottone, `robots: noindex`, default render mai lanciante (prerender statico sicuro).
- **Deviazione dall'acceptance originale (18 luglio 2026):** navigation recovery coperta da anchor nativo `href="/"` (non `next/link`: nel global error il router context può essere assente); nessun logging/monitoring aggiunto (B74 futuro); reversibilità affidata a git revert + view presentazionale conservata.
- **Copertura test (18 luglio 2026):** `__tests__/components/app/error-boundaries.test.tsx` — 6 test jsdom: SSR segment senza html/body annidati con recovery/digest/reset markup, render client senza console error/warn con reset invocato al click, link home `href="/"`, SSR global-error con html/body e stessa recovery, omissione digest/link quando assenti, axe-core zero violazioni (regole `color-contrast`/`region` disabilitate come in B23/B24). Gap residui: recovery reale post-reset su router Next e throw in layout verificabili solo via E2E browser; harness manuale disponibile su `/dev/error-trigger`.

## BATCH 54 — State matrix Catalogo

- **Scope:** loading, empty, error, offline e success soltanto per `/archivio`.
- **Closure task:** STATE-1002.
- **File previsti:** Catalog state components e route/facade Archivio.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** ogni stato ha CTA/retry coerente senza dati simulati come reali.
- **Test:** latency, zero results, 500, offline, partial data e visual matrix.
- **Reversibilità:** state slot additivo nel Catalog facade.
- **Non toccare:** Tool detail, Shortlist, Compare, Radar, Account o happy-path layout.
- **Dipendenze:** B14, B25, B31, B53.

## BATCH 55 — State matrix Tool detail

- **Scope:** loading, not-found, error, offline, partial e success soltanto per `/toools/[slug]`.
- **Closure task:** STATE-1002.
- **File previsti:** Tool detail route e relativi state components.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** 404 e source failure sono distinti; retry/fallback non inventano campi.
- **Test:** valid/missing slug, timeout, 404/500/offline e partial related.
- **Reversibilità:** componenti stato additivi.
- **Non toccare:** altre route o layout happy path.
- **Dipendenze:** B14, B15, B53.

## BATCH 56 — State matrix Shortlist

- **Scope:** loading, empty, error, offline, conflict e success soltanto per `/shortlist`.
- **Closure task:** STATE-1002.
- **File previsti:** Shortlist route/board e state components.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** empty e sync failure guidano recovery senza perdere note/stage.
- **Test:** guest empty, auth loading, sync 409/500/offline e partial workspace.
- **Reversibilità:** state slot separato dal controller Decision Memory.
- **Non toccare:** Compare, Radar, Account o schema workspace.
- **Dipendenze:** B18, B32, B42, B53.

## BATCH 57 — State matrix Compare

- **Scope:** zero/uno tool, loading, invalid set, error, offline e success soltanto per `/compare`.
- **Closure task:** STATE-1002.
- **File previsti:** Compare route/views e state components.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** precondizioni e recovery sono chiare senza mostrare verdetti incompleti.
- **Test:** 0/1/2+ tool, missing tool, engine error, offline e reload.
- **Reversibilità:** state router additivo.
- **Non toccare:** scoring/objective/decision contract o altre route.
- **Dipendenze:** B33–B35, B43, B53.

## BATCH 58 — State matrix Radar

- **Scope:** loading, empty, stale, fallback, error e success soltanto per `/radar`.
- **Closure task:** STATE-1002.
- **File previsti:** Radar route/views/query states.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** source e timestamp restano visibili; fallback non appare live.
- **Test:** live, stale, fallback, empty, 429/500/offline e retry.
- **Reversibilità:** state mapping additivo al query contract.
- **Non toccare:** reward, prediction resolver o altre route.
- **Dipendenze:** B36, B44, B49, B53.

## BATCH 59 — State matrix Account

- **Scope:** guest, magic-link pending, authenticated, loading, error, offline e attach outcome per `/account`.
- **Closure task:** STATE-1002.
- **File previsti:** AccountPanel sections, auth/workspace state components.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** auth e attach hanno success/retry distinti e non promettono sync non avvenuta.
- **Test:** guest/auth, link pending/expired, attach success/failure, 401/429/500/offline.
- **Reversibilità:** state components additivi al facade AccountPanel.
- **Non toccare:** sync algorithm o altre route.
- **Dipendenze:** B18, B19, B27, B53.

## BATCH 60 — Storage e sync edge cases

- **Scope:** corrupted JSON, quota, multi-tab/device, clock skew e conflict resolution.
- **Closure task:** STATE-1003.
- **File previsti:** workspace persistence/sync, storage adapter e tests.
- **Rischio / priorità:** alto / P1.
- **Acceptance:** recovery non perde dati silenziosamente e comunica i conflitti non risolvibili.
- **Test:** corruption, quota, storage event, concurrent devices, stale clock.
- **Reversibilità:** snapshot pre-migration e sync flag.
- **Non toccare:** UI Decision/Compare tranne messaggi di recovery.
- **Dipendenze:** B17–B19, B32–B35.

## BATCH 61 — Overlay e feedback accessibili

- **Scope:** migrare overlay core al contract e imporre una sola celebrazione primaria.
- **Closure task:** A11Y-1102.
- **File previsti:** NoteSheet, command palette, game modals, toast/confetti/audio.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** Escape/focus/scroll lock/live region coerenti; eventi non si sovrappongono.
- **Test:** keyboard, screen reader, stacked events, audio/motion off.
- **Reversibilità:** adapter overlay precedente temporaneo.
- **Non toccare:** logica business dei flow.
- **Dipendenze:** B22, B32, B45–B52.

## BATCH 62 — Contrast, touch e semantic sweep

- **Scope:** AA, target 44 px, raw control core e badge/count annunciati.
- **Closure task:** A11Y-1103.
- **File previsti:** tokens, nav, Catalogo, Compare, Shortlist e Account.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** nessun contrasto/target/semantic blocker nei flow core.
- **Test:** axe, contrast tool, touch manuale, zoom 200%, high contrast.
- **Reversibilità:** modifiche per component family, non big-bang.
- **Non toccare:** brand palette primaria salvo token insufficienti.
- **Dipendenze:** B20–B24, B27, B30, B32–B44.

## BATCH 63 — Reduced motion e media preferences

- **Scope:** preference canonica per motion/audio, pause offscreen e Canvas non essenziale off.
- **Closure task:** A11Y-1104.
- **File previsti:** capability hook, 3D/Orbital/intro/transition/audio/game effects.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** preference OS/in-app persiste e non rimuove contenuto necessario.
- **Test:** reduce-motion, audio off, reload, visibilitychange e low-power smoke.
- **Reversibilità:** capability defaults riproducono comportamento precedente.
- **Non toccare:** asset o animazioni quando la preference è standard.
- **Dipendenze:** B04, B26, B52.

## BATCH 64 — Capability gate 3D e global layers

- **Scope:** caricare Canvas, Orbital e layer globali solo dove/capability necessario.
- **Closure task:** PERF-1203.
- **File previsti:** RootProviders, marketing layout, Global3DLayer/Orbital e dynamic imports.
- **Rischio / priorità:** alto / P1.
- **Acceptance:** route non immersive non scaricano/eseguono layer; fallback conserva contenuto.
- **Test:** bundle analyzer, network route, low-end profile, feature/reduced-motion flags.
- **Reversibilità:** capability per layer e import fallback.
- **Non toccare:** resa visuale delle scene abilitate.
- **Dipendenze:** B04, B63.

## BATCH 65 — Account background performance

- **Scope:** correggere soltanto resize cleanup e costo O(n²) di AccountVibesBackground.
- **Closure task:** quota PERF-1204.
- **File previsti:** `components/account/account-vibes-background.tsx` e test profiler.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** nessun listener residuo; il costo per frame rispetta il budget approvato.
- **Test:** mount/unmount, resize loop, memory, CPU profile e visibilitychange.
- **Reversibilità:** revert del singolo componente/commit.
- **Non toccare:** immagini, asset pipeline, altre scene 3D o design Account.
- **Dipendenze:** B03, B27.

## BATCH 66 — Image pipeline core

- **Scope:** sostituire/ottimizzare soltanto le immagini raw critiche per LCP e chiudere i relativi warning lint.
- **Closure task:** quota PERF-1204, esclusi font B21, sound B26 e leak B65.
- **File previsti:** image consumers prioritari e asset/image config.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** dimensioni/crop/priority corretti e nessun warning image nei consumer core migrati.
- **Test:** image lint, network dimensions, LCP, fallback e visual regression.
- **Reversibilità:** revert del solo asset/consumer commit.
- **Non toccare:** AccountVibesBackground, scene 3D o redesign degli asset.
- **Dipendenze:** B03, B21.

## BATCH 67 — Performance budget CI

- **Scope:** budget per CSS/JS route, request, LCP, CLS e INP di laboratorio.
- **Closure task:** PERF-1205.
- **File previsti:** CI, Lighthouse/bundle config e baseline report.
- **Rischio / priorità:** basso / P1.
- **Acceptance:** regressioni oltre soglia bloccano merge con allowlist temporanea motivata.
- **Test:** due run stabili mobile/desktop e prova budget failure.
- **Reversibilità:** quality gate configurabile, non rimuove ottimizzazioni.
- **Non toccare:** codice runtime.
- **Dipendenze:** B02, B03, B43, B44, B64–B66.

## BATCH 68 — Catalogo come vertical slice canonica

- **Scope:** adottare token, primitive, ToolCard e state matrix nel Catalogo; rimuovere solo override resi inutili.
- **Closure task:** POL-1301.
- **File previsti:** Archivio/Catalog components e relativo CSS owner.
- **Rischio / priorità:** alto / P3.
- **Acceptance:** mobile/desktop coerenti, zero regressioni e lista precisa di CSS eliminato.
- **Test:** visual matrix, search/filter, sponsor, state matrix, a11y e performance.
- **Reversibilità:** route flag e commit singolo; nessuna cancellazione cross-route.
- **Non toccare:** CSS di Compare/Radar/Home o source dati.
- **Dipendenze:** B20–B25, B31, B37, B38, B41, B54, B62.

## BATCH 69 — Microcopy e visual hierarchy

- **Scope:** eliminare claim “winner/verdetto” non supportati, chiarire CTA e ridurre rumore gerarchico core.
- **Closure task:** POL-1303.
- **File previsti:** copy centralizzata, Home, Catalogo, Compare, Radar, Shortlist e Account.
- **Rischio / priorità:** basso / P3.
- **Acceptance:** ogni CTA descrive l’esito; confidence/limiti dei dati sono espliciti.
- **Test:** content inventory, UX review, localization/overflow e visual regression.
- **Reversibilità:** solo copy/priority tokens, senza logica.
- **Non toccare:** brand voice, contenuti editoriali o redesign strutturale.
- **Dipendenze:** B19, B29–B36, B40, B54–B59.

## BATCH 70 — Release gate, crawler e sitemap

- **Scope:** separare prelaunch/public mode e consentire callback, robots e sitemap secondo policy.
- **Closure task:** REL-1401.
- **File previsti:** middleware, gate routes/config, robots e sitemap.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** public mode non richiede gate; prelaunch protegge UI senza rompere auth/crawler policy.
- **Test:** no-cookie route matrix, callback cross-device, bot UA, robots/sitemap e redirects.
- **Reversibilità:** environment flag e rollback config.
- **Non toccare:** contenuto/metadata delle pagine.
- **Dipendenze:** B04, B11, B14, B15.

## BATCH 71 — Metadata e social preview

- **Scope:** canonical, metadata route-level e immagini OG/Twitter reali per superfici pubbliche.
- **Closure task:** REL-1402.
- **File previsti:** route metadata, metadata utility e asset social.
- **Rischio / priorità:** basso / P1.
- **Acceptance:** URL canonici e preview corretti per Home, Tool, Collection e Post.
- **Test:** metadata snapshot, social validator e missing asset fallback.
- **Reversibilità:** metadata/asset-only revert.
- **Non toccare:** layout o contenuto delle pagine.
- **Dipendenze:** B14, B15, B70.

## BATCH 72 — Privacy, Cookie, Termini e consent

- **Scope:** inventario trattamenti/storage, retention, basi giuridiche, termini e consent coerente.
- **Closure task:** REL-1403.
- **File previsti:** pagine legal, consent component/config e data inventory.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** testi approvati da consulente competente e comportamento conforme all’inventario reale.
- **Test:** link/footer/auth, consent persistence/withdrawal, analytics on/off e versioning.
- **Reversibilità:** feature non essenziali restano off se il consenso non è pronto.
- **Non toccare:** policy inventate senza approvazione legale.
- **Dipendenze:** B04, B70; B73 resta spento finché questo batch non è approvato.

## BATCH 73 — Analytics essenziale

- **Scope:** tassonomia minima per discovery→save→compare→decision→return con privacy by design.
- **Closure task:** REL-1404.
- **File previsti:** analytics adapter, event schema e instrumentation core.
- **Rischio / priorità:** medio / P1.
- **Acceptance:** eventi deduplicati, senza PII, con properties/version owner documentati.
- **Test:** event contract, consent off/on, duplicate navigation e debug sink.
- **Reversibilità:** adapter no-op e kill switch.
- **Non toccare:** logica dei flow o metriche vanity post-lancio.
- **Dipendenze:** B04, B19, B32–B36; attivazione pubblica dopo B72.

## BATCH 74 — Error tracking, SLI e alert

- **Scope:** error tracking client/server, source map, release tag, SLI e alert essenziali.
- **Closure task:** REL-1405.
- **File previsti:** provider telemetry, build/deploy config e runbook incident.
- **Rischio / priorità:** medio / P0.
- **Acceptance:** errore sintetico crea evento leggibile con release/route, senza dati sensibili.
- **Test:** client/server/API throw, source map, sampling, redaction e alert delivery.
- **Reversibilità:** provider disabilitabile senza spegnere logging base.
- **Non toccare:** analytics prodotto B73.
- **Dipendenze:** B02, B53, B72.

## BATCH 75 — E2E core e security certification

- **Scope:** certificare core flow, security e il manifest OFF/LOCAL_NO_REWARD/REWARDED di ogni superficie gamification.
- **Closure task:** QA-1406.
- **File previsti:** suite E2E/integration, fixture staging e gamification release manifest.
- **Rischio / priorità:** basso / P0.
- **Acceptance:** rewarded ha E2E; local non muta profilo; OFF è assente/nega direct call; leaderboard rifiuta local; zero console/hydration error.
- **Test:** browser/API/RLS/network/data parity; matrix tri-state per mission/Hidden/Arena/prediction/Vibe Rush e OFF/REWARDED per leaderboard.
- **Reversibilità:** test-only; bug scoperti aprono batch separati.
- **Non toccare:** codice prodotto per aggirare i test.
- **Dipendenze:** B06–B74 applicabili.

## BATCH 76 — Device e cross-browser certification

- **Scope:** matrice reale iPhone, Android, tablet, laptop e wide desktop.
- **Closure task:** QA-1407.
- **File previsti:** report QA, screenshot baseline finali e issue log.
- **Rischio / priorità:** basso / P0.
- **Acceptance:** zero overflow/clipping/blocker; keyboard, touch, safe area e viewport verificati.
- **Test:** device/browser matrix, zoom, orientation, keyboard, low network e reduced motion.
- **Reversibilità:** QA-only; correzioni non entrano in questo batch.
- **Non toccare:** baseline per nascondere difetti.
- **Dipendenze:** B75.

## BATCH 77 — Staging rehearsal e go/no-go

- **Scope:** deploy rehearsal, migration/restore, smoke, monitor, rollback e firma readiness matrix.
- **Closure task:** QA-1408.
- **File previsti:** release checklist, runbook, deployment config solo se già validata.
- **Rischio / priorità:** alto / P0.
- **Acceptance:** Definition of Done e manifest OFF/LOCAL_NO_REWARD/REWARDED firmati; owner firma GO oppure documenta NO-GO.
- **Test:** clean deploy, migration, synthetic journeys, alert, rollback e post-rollback smoke.
- **Reversibilità:** rollback provato prima della finestra pubblica.
- **Non toccare:** nuove feature, redesign o upgrade non necessari.
- **Dipendenze:** B70–B76 e tutti i P0/P1/P2 release-scoped chiusi.

---

## Coda post-lancio — non inclusa nei 77 batch

### POST-01 — Progressione orientata alla decisione

- **Scope:** un singolo esperimento iniziale sul “revisit di una decisione motivata”, senza XP cosmetico.
- **Closure task:** GAM-905.
- **File previsti:** event taxonomy, workspace/decision analytics, eventuali badge definition dietro flag.
- **Rischio / priorità:** medio / P4.
- **Entry criteria:** release stabile e almeno un ciclo dati reale.
- **Dipendenze:** B35 e B73.
- **Acceptance:** una sola ipotesi, metrica primaria, guardrail e kill criteria definiti prima dell’esposizione.
- **Test:** cohort analysis del singolo esperimento, abuse review e usability.
- **Reversibilità:** un solo commit, feature flag e rollback senza migrare il core workspace.
- **Non toccare:** core loop validato senza evidenza quantitativa.

## Tracciabilità Closure Plan → Roadmap

| Famiglia task | Batch |
|---|---|
| SAF-001…005 | B01…B05 |
| SEC-101 | B08 |
| SEC-102…107 | B06, B07, B09, B10, B12, B11 |
| DATA-201…206 | B13…B18 |
| DS-301…306 | B20, B20, B21, B22, B23, B24 |
| CORE-401…404 | B25…B28 |
| IA-501…504 | B29, B30, B29, B31 |
| FLOW-601, 602, 603, 604 | B32, B33, B34, B35 |
| FLOW-605, 606 | B19, B36 |
| MOB-701…704 | B37…B40 |
| DESK-801…804 | B41…B44 |
| GAM-901 | B45 |
| GAM-902 | B46 |
| GAM-903 | B47, B48, B49 |
| GAM-904 | B51, B52 |
| GAM-905 | POST-01 |
| GAM-906 | B50 |
| STATE-1001 | B53 |
| STATE-1002 | B54…B59 |
| STATE-1003 | B60 |
| A11Y-1101…1104 | B11, B61, B62, B63 |
| PERF-1201 | B43 e B44 |
| PERF-1202 | B44 |
| PERF-1203 | B64 |
| PERF-1204 | B21, B26, B65 e B66 |
| PERF-1205 | B67 |
| POL-1301…1303 | B68, B43, B69 |
| REL-1401…1405 | B70…B74 |
| QA-1406…1408 | B75…B77 |

## Commit e rollback policy

Ogni batch produce un solo commit. Se durante il lavoro emerge una seconda famiglia di file o una modifica non richiesta per soddisfare l’acceptance, il batch si ferma e viene aperto uno scope separato. Le migration non vengono “revertite” distruttivamente: usano backup B05 e forward-fix verificato. Ogni flag temporaneo deve avere owner e batch di rimozione; nessun dual-read o adapter può restare indefinitamente senza una decisione esplicita nel Batch 77.
