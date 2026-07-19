# TooolVibes — Incident Response Totale

Data audit: 19 luglio 2026

Repository verificata: `C:\Users\Mattia\Desktop\Tooolvibes-app\tooolvibes-app-main`

Responsabile dell'audit: agente principale `/root`

Ambito: filesystem → Git → GitHub → build Next/OpenNext → Cloudflare Worker → domini pubblici

## A. Conclusione immediata

Le modifiche degli ultimi giorni non erano in una sandbox remota: erano state scritte nella repository applicativa Windows e, in gran parte, già committate su `main`, quindi non comparivano più in `git status`. Il comando Git che mostrava soltanto la cartella del progetto veniva inoltre eseguito talvolta nella repository vuota e annidata del parent `C:\Users\Mattia\Desktop\Tooolvibes-app`, non nella repository dell'app. GitHub e Cloudflare erano allineati: il push su `main` attivava Workers Builds e i due domini servivano lo stesso Worker. Il motivo principale per cui il lavoro non appariva sul sito era il gate intenzionale “Coming Soon”, che intercettava le route pubbliche prima dell'app. L'ultimo batch risultava anche realmente incompleto: componenti e test B40 erano stati committati senza le regole CSS corrispondenti, alcuni test non compilavano e Zod generava un probe `eval` incompatibile con la CSP su Firefox.

La prima verifica della versione Cloudflare 251 ha inoltre scoperto un difetto distinto e solo production-specific: i binding Supabase pubblici erano disponibili al Server Component nel runtime Worker ma assenti dal bundle client prodotto in fase di build. `AccountProvider` calcolava quindi due stati iniziali diversi tra SSR e browser, causando React error #418 su tutte le route dietro gate. Il contratto è stato reso hydration-safe passando dal server al provider un valore iniziale serializzato, mantenendo `/api/auth/config` come bootstrap successivo. La versione finale 252 è stata verificata su entrambe le origini, sette route e tre browser senza errori console, runtime o hydration. Tutti i difetti incidentali dimostrati sono stati corretti, testati, committati e pubblicati senza riscrivere la cronologia.

## B. Ambiente dell'agente principale

| Campo | Valore |
|---|---|
| Host | `BALDO-MSI` |
| Sistema | Windows NT `10.0.26200`, x64 |
| Shell | Windows PowerShell 5.1 |
| Utente | `baldo-msi\mattia` |
| Directory | `C:\Users\Mattia\Desktop\Tooolvibes-app\tooolvibes-app-main` |
| Root Git | `C:/Users/Mattia/Desktop/Tooolvibes-app/tooolvibes-app-main` |
| Directory Git | `.git` della root applicativa |
| Repository | `Toooly/TooolVibes` |
| Branch | `main` |
| HEAD applicativo pubblicato | `0af7894d64de368c49e968ccf2c87411eda0d6d8` |
| Remote | `https://github.com/Toooly/TooolVibes.git` |
| Upstream | `origin/main` |
| Tipo ambiente | Locale Windows; non WSL, non container, non cloud sandbox |
| Filesystem persistente | Sì |
| Stesso filesystem dell'utente | Sì: percorso fisico, root Git, remote e SHA sono gli stessi osservabili dal terminale Windows |
| Progetto completo accessibile | Sì: sorgenti, test, migrazioni, configurazione Cloudflare e cronologia Git |

La directory non è una junction né un symlink. L'ambiente vede fisicamente il progetto completo sul Desktop dell'utente. La prova non si basa sul solo percorso: `HEAD`, `origin`, upstream e SHA remoto coincidono.

## C. Mappa agenti

| Agente | Attività | Directory | Branch/worktree | File reali | Commit | Esito |
|---|---|---|---|---|---|---|
| `/root` (incident lead) | Forensica, recupero, quality gate, fix e pubblicazione | Root applicativa verificata | `main`, unico worktree attivo | Sorgenti, test e questo rapporto | `339f6ad`, `491dda3`, `3550447`, `0af7894` | `APPLICATO E VERIFICATO` |
| Codex, sessioni precedenti | Batch di chiusura B22–B40/B53 e documentazione | Root applicativa verificata secondo commit/reflog | `main` | 21 commit applicativi/documentali tra `e909f31` e `9732a01` | Presenti su `main` | `APPLICATO E VERIFICATO` dopo le correzioni incidentali; B40 era prima incompleto |
| Kimi, sessione storica | Redesign mobile | `.worktrees/mobile-ui-redesign` secondo `RESOCONTO-LAVORI.md` storico | Cronologia oggi preservata in `origin/backup-remoto-prima-force` | 29 commit unici mobile UI | `28eb9d7`…`1365db5` | `APPLICATO MA NON INTEGRATO`; non perso |
| Altri agenti citati nei documenti | Attività multi-agent non identificabili individualmente | Nessuna telemetria autonoma disponibile | Nessun worktree attivo oltre `main` | Attribuzione possibile solo tramite diff/commit condivisi | Autore Git condiviso `TooolVibes` | `NON RECUPERABILE CON LE PROVE DISPONIBILI` per identità individuale; i diff condivisi restano verificabili |

Al momento dell'audit non risultavano sub-agent attivi. `git worktree list --porcelain` mostrava un solo worktree: la root applicativa su `main`. La cartella `.worktrees/feat` era vuota/stale. Le identità Git non permettono di distinguere con certezza ogni agente perché i commit usano lo stesso autore; il rapporto distingue quindi prova materiale da dichiarazione.

## D. Modifiche trovate

### D.1 Catena recente effettivamente presente su `main`

| Modifica | File/area | Diff/commit | Branch | Inclusa nella build | Pubblicata |
|---|---|---|---|---|---|
| Overlay e layering | UI overlay | `e909f31` B22 | `main` | Sì | Sì |
| Primitivi UI canonici | componenti UI | `f36caed` B23 | `main` | Sì | Sì |
| Tool card canonica | catalogo/card | `e8f77a2` B24 | `main` | Sì | Sì |
| Catalogo | route e componenti catalogo | `14dfd1d` B25 | `main` | Sì | Sì |
| Sound policy | interazioni audio | `c208dd9` B26 | `main` | Sì | Sì |
| Account state matrix | account/auth UI | `c2552cb` B27 | `main` | Sì | Sì |
| Navigation | navigazione responsive | `ddbdb72` B29 | `main` | Sì | Sì |
| Header | header responsive | `2969e36` B30 | `main` | Sì | Sì |
| Search | ricerca | `b9d2d29` B31 | `main` | Sì | Sì |
| Decision memory | workspace/decision | `06ab666` B32 | `main` | Sì | Sì |
| Scoring | score tool | `0925923` B33 | `main` | Sì | Sì |
| Objective flow | discovery | `b2f4f8d` B34 | `main` | Sì | Sì |
| Decision flow | shortlist/compare | `d0397a8` B35 | `main` | Sì | Sì |
| Radar integrity | radar | `e3ecde7` B36 | `main` | Sì | Sì |
| Decision dock | dock | `74d71d8` B37 | `main` | Sì | Sì |
| Catalog density | CSS/catalogo | `e3301c4` B38 | `main` | Sì | Sì |
| Keyboard policy | mobile/keyboard | `fef18b2` B39 | `main` | Sì | Sì |
| Radar responsive | radar | `3ff9657` B44 | `main` | Sì | Sì |
| Error boundary | app routing/errors | `e6fdc7c` B53 | `main` | Sì | Sì |
| Home mobile/account/tests | 25 file | `9732a01` | `main` | Sì, ma B40 mancava di CSS | Sì, dietro gate |
| Completamento B40 e retry account | `app/globals.css`, account matrix e contract test | `339f6ad` | `main` | Sì | Sì, Worker 252 |
| CSP senza eval | wrapper Zod, 6 import e fixture E2E | `491dda3` | `main` | Sì | Sì, Worker 252 |
| Stabilità quality gate | Vitest e timeout mirati | `3550447` | `main` | Sì | Sì, Worker 252 |
| Hydration-safe auth Worker | marketing layout, account provider e test regressione | `0af7894` | `main` | Sì | Sì, Worker 252 |

Tra i commit sopra sono presenti anche commit documentali (`4540fb2`) e modifiche di report. Nessun commit è stato giudicato “applicativo” solo dal messaggio: sono stati controllati diff, import, route e bundle.

### D.2 Correzioni prodotte da questo incident response

| Correzione | File principali | Perché era necessaria | Prova |
|---|---|---|---|
| CSS B40 home time-to-value | `app/globals.css` | Le classi `v-hero-mobile--compact`, `v-discovery-stage--flow` e il tool chip erano usate dai componenti ma senza implementazione CSS | Marker presenti in `.next` e `.open-next` |
| Classificazione retry account | `components/account/panel/account-state-matrix.ts` | Il messaggio reale “non è disponibile” non veniva riconosciuto dal matcher senza accento | Suite account completa |
| Compatibilità CSP Zod | `lib/validation/zod.ts` e 6 import | Zod 4.3.6 eseguiva un probe `Function("")`, segnalato da Firefox sotto CSP senza `unsafe-eval` | Firefox E2E pulito dopo `z.config({ jitless: true })` |
| Filtro console WebKit ristretto | `tests/e2e/fixtures/release-fixture.ts` | WebKit non supporta `interactive-widget`; il warning è specifico del motore | Solo quel messaggio è ignorato e solo su WebKit |
| Test TypeScript e timeout | test account/radar/axe, `vitest.config.ts` | Errori di tipo e timeout da contesa CPU rendevano non riproducibile la suite completa | 956 test unitari passati; E2E 3 browser passati |
| Confini dei contract CSS | test B38/B39 | I test assumevano erroneamente che la propria sezione fosse sempre l'ultima del file | Slice limitato al marker del batch successivo |
| Stato auth iniziale coerente SSR/client | `app/(marketing)/layout.tsx`, `components/account/account-provider.tsx` | Workers Builds non incorpora automaticamente nei chunk client i binding disponibili solo al runtime Worker | Prop `initialAuthEnabled` serializzato dal server; live 44/44 core check su due origini |
| Test di regressione hydration account | `__tests__/components/account/account-provider-hydration.test.tsx` | Impedire il ritorno a una lettura browser-only durante il primo render | Il mock fallisce se `isSupabaseBrowserEnabled` viene letto in render; test verde |

## E. Modifiche dichiarate ma inesistenti

1. Non esiste un file esatto `HANDOFF.md` nella cronologia corrente. L'equivalente è `TOOOLVIBES_AI_HANDOFF_REPORT_2026-07-17.md`; esiste materialmente e ha un solo commit, ma non può essere usato come prova autonoma di implementazione.
2. B40 risultava dichiarato/contrattualizzato nei componenti e nei test del commit `9732a01`, ma le regole CSS necessarie non esistevano né nel commit né negli oggetti irraggiungibili ispezionati. Questa parte non era recuperabile come codice già scritto ed è stata ricostruita in `339f6ad`.
3. Non è stata trovata prova che gli agenti avessero accesso soltanto al documento di handoff: al contrario, 21 commit recenti contengono file applicativi reali.
4. Le attività individuali attribuite genericamente ad “altri agenti” non sono certificabili per identità: Git registra un autore condiviso e non conserva l'ID dell'agente. Il lavoro è verificabile per commit, non per persona.
5. Non sono state considerate completate le righe di roadmap prive di un diff corrispondente. I blocchi di stato aggiunti in punti non canonici della roadmap sono coordinamento, non prova applicativa.

## F. Forensica Git

### F.1 Repository, branch, worktree e stash

- Repository applicativa: `C:\Users\Mattia\Desktop\Tooolvibes-app\tooolvibes-app-main`.
- Repository parent accidentale: `C:\Users\Mattia\Desktop\Tooolvibes-app`, branch `master`, nessun commit, nessun remote, child mostrato come untracked.
- Branch di default remoto: `main`, provato da `git ls-remote --symref origin HEAD`.
- Branch remoti: `main`, `backup-remoto-prima-force`, `codex/production-closure`.
- Worktree attivi: uno solo, root applicativa su `main`.
- Submodule: nessuno.
- Detached HEAD: no.
- Stash: vuoto.
- Divergenza dopo il push applicativo: `0 0` tra `HEAD` e `origin/main`.

La repository parent spiega il caso in cui `git status` mostrava soltanto `tooolvibes-app-main/`: non era lo stato della repository applicativa, ma quello di un contenitore Git vuoto.

### F.2 Cronologia Codex

La catena recente è lineare. I 21 commit tra `e909f31` e `9732a01` sono su `main`; i reflog mostrano commit e push successivi. Il commit `9732a015fa58d74e7b7fdf86d6e8356052ed4f58` (`Finale ? 5`) ha assorbito durante l'audit i 14 file tracked e gli 11 untracked inizialmente osservati: 25 file, 2.951 inserimenti e 36 cancellazioni. Per questo il working tree è diventato pulito senza che i file fossero “spariti”.

### F.3 Cronologia Kimi

`origin/backup-remoto-prima-force` termina a `1365db57edf453e884b5ad31711991d2c0b3f587` e contiene 29 commit mobile UI unici rispetto al `main` corrente. Il documento storico `RESOCONTO-LAVORI.md` dichiara lavoro nel worktree `.worktrees/mobile-ui-redesign`, merge locale e successivo uso di operazioni distruttive prima del push. La cronologia è comunque preservata sul branch remoto di backup. Non è stata integrata automaticamente: `main` contiene 139 commit non presenti in quel branch e un merge cieco avrebbe alto rischio di regressione.

### F.4 Commit irraggiungibili e preservazione

Sono stati trovati 11 oggetti commit irraggiungibili: otto snapshot/WIP del 17–18 luglio e tre commit di giugno. Tutti sono stati resi raggiungibili sotto `refs/forensics/incident-20260719/*` e inclusi nel bundle:

`C:\Users\Mattia\.codex\incident-evidence\tooolvibes-20260719-110133\all-refs-with-unreachable.bundle`

SHA-256 bundle: `6417A939C1316D481DE9DFC15FF9540AE330BA2B289A7F11816D694143D36DD5`.

La directory evidenze contiene inoltre bundle iniziale, reflog, manifest, snapshot dei file e patch staged/unstaged. Nessun branch è stato cancellato, nessun reset hard, clean o force-push è stato eseguito.

### F.5 Matrice delle 35 ipotesi

| # | Ipotesi | Esito | Prova | Impatto |
|---:|---|---|---|---|
| 1 | Agente nella directory sbagliata | Parzialmente confermata per il terminale utente, esclusa per `/root` | Repo parent vuota vs root applicativa | Alto: `git status` fuorviante |
| 2 | Accesso soltanto a handoff | Esclusa | Progetto completo e commit applicativi | Nessuno |
| 3 | Sandbox remota non sincronizzata | Esclusa per questo audit | Host Windows, stesso path/SHA/remote | Nessuno |
| 4 | Copia differente del repository | Confermata come fonte di confusione, non come clone alternativo | Repo parent annidata; nessun altro clone TooolVibes | Alto |
| 5 | Repository Git annidata | Confermata | `.git` nel parent e `.git` nella child | Alto |
| 6 | Worktree separato | Storicamente confermata per Kimi; oggi esclusa | Resoconto e branch backup; `worktree list` oggi singolo | Medio |
| 7 | Branch diverso | Storicamente confermata per Kimi; esclusa per Codex recente | Backup remoto vs commit recenti su main | Alto per lavoro Kimi |
| 8 | Detached HEAD | Esclusa | `HEAD -> main` | Nessuno |
| 9 | Modifiche già committate | Confermata | `9732a01` e altri commit recenti | Alto sulla percezione di `git status` |
| 10 | Modifiche non salvate realmente | Confermata solo per porzione CSS B40 | CSS assente da ogni oggetto ispezionato | Medio |
| 11 | Modifiche soltanto dichiarate | Parzialmente confermata | B40 dichiarato ma incompleto; roadmap non probatoria | Medio |
| 12 | File ignorati | Esclusa come causa primaria | Inventario ignored/untracked e commit | Basso |
| 13 | File generati | Esclusa come causa delle 25k | Nessun generated/vendor tracked nel range | Nessuno |
| 14 | Commit locale mai pushato | Esclusa per main attuale; storico incerto prima del backup | SHA locale/remoto uguale | Nessuno attuale |
| 15 | Push su remote sbagliato | Esclusa | `origin` è `Toooly/TooolVibes` | Nessuno |
| 16 | Push su branch non distribuito | Confermata solo per lavoro storico Kimi | 29 commit sul backup, non sul main di produzione | Alto per quel redesign |
| 17 | Commit perso/non raggiungibile | Confermata ma recuperata | 11 commit preservati con refs forensi | Rischio eliminato |
| 18 | Revert successivo | Esclusa come causa primaria | Grafo lineare e diff | Nessuno |
| 19 | Merge che esclude modifiche | Non provata sul main recente | Nessun merge anomalo nella catena recente | Basso |
| 20 | Cloudflare su repository differente | Esclusa con evidenza operativa | Push main e deploy temporalmente correlati; marker live | Nessuno |
| 21 | Cloudflare su branch differente | Esclusa | Ogni push main genera nuova versione; branch default main | Nessuno |
| 22 | Build root errata | Esclusa | Log OpenNext e app directory coincidono con root repo | Nessuno |
| 23 | Output directory errata | Esclusa | Worker `.open-next/worker.js`, asset `.open-next/assets` | Nessuno |
| 24 | Monorepo configurato male | Esclusa | App singola, 83 route generate | Nessuno |
| 25 | Build fallita | Esclusa per versione corretta | Next e OpenNext exit 0 | Nessuno |
| 26 | Deploy manuale mai eseguito | Esclusa come requisito | Workers Builds esegue deploy automatico dopo push | Nessuno |
| 27 | Push non collegato a Cloudflare | Esclusa | Successione push/deploy ripetuta e nuovo deploy verificato | Nessuno |
| 28 | Componenti non importati | Parzialmente confermata come rischio, esclusa per fix correnti | Marker cercati nel bundle e route E2E | Basso dopo fix |
| 29 | Route diversa dalla modificata | Esclusa | Catena file → componenti → route → chunk | Nessuno |
| 30 | Variabile/feature flag nasconde risultato | Confermata | `TOOOLVIBES_PUBLIC_GATE_ENABLED` e gate Coming Soon | Critico sulla visibilità |
| 31 | Preview anziché production | Esclusa | Deployment al 100% sul servizio production | Nessuno |
| 32 | Custom domain su vecchio Worker | Esclusa | Domain API: servizio `tooolvibes`, environment production | Nessuno |
| 33 | Cache Cloudflare | Esclusa | `Cache-Control: private, no-store`, cache busting e asset uguali | Nessuno |
| 34 | Cache browser/service worker | Esclusa | Cache busting, nessun service worker causale, asset hash | Nessuno |
| 35 | Più cause contemporanee, incluso mismatch build/runtime | Confermata | Repo parent + commit già fatti + gate + batch incompleto + binding Supabase solo runtime | Causa sistemica reale; hydration risolta in `0af7894` |

## G. Analisi delle “25.000 righe”

Non esiste un singolo commit recente con oltre 25.000 righe applicative. Il numero deriva dal range di 26 commit `ee1ac86^..8355a22`: 357 file, 33.221 inserimenti e 4.505 cancellazioni. La scomposizione reale è:

| Categoria | File | Inserimenti | Cancellazioni | Churn | Uso nella build / impatto |
|---|---:|---:|---:|---:|---|
| Sorgente applicativa | 204 | 12.061 | 3.189 | 15.250 | Sì quando importata dalle route; impatto visibile ma in parte nascosto dal gate |
| Test/E2E | 100 | 9.984 | 0 | 9.984 | No nel bundle production; impatto sul release gate |
| Documentazione | 20 | 5.295 | 52 | 5.347 | No nel bundle; nessun impatto UI diretto |
| Lockfile | 1 | 1.818 | 1.254 | 3.072 | Usato per installazione deterministica; nessuna UI autonoma |
| Database/migrazioni | 9 | 2.179 | 0 | 2.179 | Non nel bundle client; impatto dati/backend dopo migrazione |
| Script/tooling | 12 | 1.667 | 0 | 1.667 | No nel runtime pubblico; supporto build/verifica |
| Config/CI | 5 | 149 | 7 | 156 | Sì per pipeline e policy; impatto indiretto |
| Altro | 6 | 68 | 3 | 71 | Misto; nessun marker UI autonomo |

File generated/vendor tracciati nel range: zero. Il volume non prova una singola feature né una singola sessione: somma codice, test, documentazione, migrazioni e lockfile. Una parte del codice era effettivamente pubblicata ma invisibile dietro il gate; un'altra parte, B40 CSS, era incompleta nonostante il volume del commit finale.

## H. Stato GitHub

| Livello | Branch | SHA | Sincronizzato |
|---|---|---|---|
| Locale (snapshot applicativo) | `main` | `0af7894d64de368c49e968ccf2c87411eda0d6d8` | Sì |
| Upstream (snapshot applicativo) | `origin/main` | `0af7894d64de368c49e968ccf2c87411eda0d6d8` | Sì, 0/0 |
| Origin (snapshot applicativo) | `main` | `0af7894d64de368c49e968ccf2c87411eda0d6d8` | Sì, provato con `git ls-remote` |
| Produzione applicativa verificata | `main` | `0af7894d64de368c49e968ccf2c87411eda0d6d8` | Sì, Worker 252 al 100% |

Il repository GitHub è privato; l'API anonima restituisce 404 e `gh` non è installato. Ciò non impedisce la prova: fetch/push autenticati e `ls-remote` confermano remote, branch e SHA. `.github/workflows/quality.yml` esegue quality/build/E2E ma non distribuisce; il deploy è gestito da Cloudflare Workers Builds.

La tabella fotografa l'ultimo commit applicativo. Il commit esclusivamente documentale che aggiunge questo rapporto viene creato dopo la chiusura delle evidenze e non può auto-includere il proprio SHA senza modificarlo; SHA e deploy documentale finale sono quindi riportati nel messaggio di consegna. Il diff documentale non altera sorgenti, configurazione, lockfile, test o migrazioni.

## I. Stato build

| Controllo | Comando | Esito |
|---|---|---|
| Runtime | Node `22.23.1`, npm `10.9.2` | Conforme a `package.json` |
| Installazione locked | `npm clean-install --progress=false` | Exit 0, 1.161 package |
| Quality completa | `npm run quality` | Exit 0; lint/typecheck puliti; 107 file passati, 1 file skipped; 956 test passati, 10 skipped |
| Build Next | `npm run build` | Exit 0; 83 route/pagine generate |
| E2E artefatto locale | `npx playwright test --project=chromium --project=firefox --project=webkit` | 34/34 passati in 3,7 minuti |
| E2E live custom domain | core route su Chromium, Firefox e WebKit | 22/22 passati; nessun errore console/runtime/hydration |
| E2E live workers.dev | core route su Chromium, Firefox e WebKit | 22/22 passati; nessun errore console/runtime/hydration |
| Build Cloudflare | `npm run build:cloudflare` | Exit 0; `.open-next/worker.js` e `.open-next/assets` |
| Baseline DB statica | `npm run db:baseline:check` | Exit 0; 41 migrazioni, fixture e checksum validi |
| Cutover tool | `npm run tools:cutover:verify` senza argomento | Non eseguito: richiede `evidence.json`; exit 2 di usage, non regressione applicativa |

Root build: root della repository applicativa.

Output Next: `.next`.

Output OpenNext: `.open-next/worker.js` e `.open-next/assets`.
SHA-256 del worker locale di audit: `D05223BF4D44C84108A102AB62AA3BC9C5568F0C3AC2064C37BE5CC65C64BC45`.

Prova di inclusione:

- `v-hero-mobile__tool-chip` è presente nel chunk home e nel CSS di `.next` e `.open-next`;
- `Salvataggio online in pausa` è presente nel chunk account di `.next` e `.open-next`;
- il test `account-provider-hydration.test.tsx` impedisce letture dell'env browser durante il primo render e verifica entrambi i valori iniziali;
- le route `/`, `/archivio`, `/toools/blink`, `/shortlist`, `/compare`, `/radar` e `/account` sono state renderizzate dai tre browser senza errori console/runtime/hydration.

Warning non bloccanti osservati:

- OpenNext avverte che Windows è meno prevedibile di WSL; la build Linux Cloudflare costituisce la conferma finale;
- il repository editoriale legacy read-only resta attivo fino a DATA-203;
- alcuni test emettono warning semantici Base UI/Dialog da trattare come debito accessibilità, non come errore di questa correzione;
- dipendenze transitive deprecate: `whatwg-encoding`, `node-domexception`, `glob@9`.

## J. Stato Cloudflare

| Campo | Valore |
|---|---|
| Account | `staff@elevianutrition.eu` |
| Account ID | `ffacd11bfafdca87d540a6c5fbe89120` |
| Progetto/servizio | Worker `tooolvibes` |
| Workers o Pages | Workers; nessun progetto Pages |
| Repository collegato | `Toooly/TooolVibes` dimostrato operativamente dalla correlazione push/build; il dettaglio API Builds richiede scope OAuth non disponibile |
| Branch | `main` |
| Root build | Root repository |
| Comando build | `npm run build:cloudflare` / OpenNext 1.20.1 |
| Output | `.open-next/worker.js`, asset `.open-next/assets` |
| Commit applicativo distribuito | `0af7894d64de368c49e968ccf2c87411eda0d6d8` |
| Versione Worker | 252 |
| Version ID | `96c0dfe0-65d3-4bd9-8c0b-9ef096290e73` |
| Deployment ID | `20bbd024-b87b-44bd-a2d0-addea7d08da2` |
| Data deployment | `2026-07-19T11:42:22.775557Z` |
| Traffico | 100% |
| workers.dev | `https://tooolvibes.staff-ffa.workers.dev/` |
| Custom domain | `https://tooolvibes.eu/` |
| Mapping custom domain | servizio `tooolvibes`, environment `production`, zona `tooolvibes.eu` |
| Ultimo esito | Deploy riuscito; versione 252 al 100%; live check finale verde su entrambe le origini |

La versione precedente all'intervento era la 250, version ID `a96b2360-baab-4dca-9211-66dc51aacc94`, deployment ID `3e7ed5c2-b252-4513-9569-cf3b96dfd22d`, creata il 19 luglio 2026 alle 09:04:44Z. Il suo bundle conteneva il marker introdotto unicamente da `9732a01`, prova che Cloudflare stava già distribuendo l'ultimo commit precedente e che la cache non era la causa.

La versione intermedia 251, version ID `820a49ec-b496-4aaa-a734-9b1881357139`, deployment ID `da3ad528-6517-4be3-bbc9-00f0efb2b248`, ha pubblicato i primi tre commit correttivi. L'ispezione live dietro gate ha però rilevato React error #418 su tutte le route marketing. La verifica comparata dei chunk client, dell'HTML SSR e dei binding runtime ha isolato il mismatch Supabase build/runtime; la versione 252 include la correzione `0af7894` e non riproduce più l'errore.

## K. Causa radice dimostrata

La causa non era unica:

1. **Contesto Git ambiguo:** una repository vuota nel parent del progetto rendeva possibile eseguire `git status` nel posto sbagliato e vedere soltanto la cartella child come untracked.
2. **Modifiche già committate:** gli agenti lavoravano nella repository reale; i commit frequenti rendevano il working tree pulito, interpretato erroneamente come “nessuna modifica”.
3. **Gate pubblico intenzionale:** `TOOOLVIBES_PUBLIC_GATE_ENABLED` mostrava “Coming Soon” e nascondeva tutte le UI applicative, benché i chunk aggiornati fossero già distribuiti.
4. **Lavoro storico non integrato:** i 29 commit Kimi erano su una cronologia/branch di backup differente, non sul `main` pubblicato.
5. **Ultimo batch tecnicamente incompleto:** B40 aveva classi e test ma non CSS; la suite aveva errori/type timeout e Zod violava la CSP Firefox. Questi difetti rendevano il lavoro non production-ready anche se GitHub/Cloudflare funzionavano.
6. **Contratto env build/runtime non deterministico:** il server Worker vedeva `NEXT_PUBLIC_SUPABASE_URL` e la chiave anonima come binding runtime, mentre il bundle client era stato compilato senza quei valori. Il server renderizzava lo stato auth abilitato (“Account”), ma il primo render client partiva disabilitato; React rilevava una struttura diversa e generava error #418. Non era una cache né un problema locale: Next dev, Next production locale e Worker locale erano puliti perché lì build e runtime condividevano lo stesso env.

La catena reale è:

`sorgenti root applicativa → import/componenti → route App Router → next build → OpenNext → binding runtime Worker → Worker tooolvibes → workers.dev e custom domain → gate Coming Soon → app autenticata al gate`.

## L. Correzioni applicate

### L.1 Codice applicativo

- `app/globals.css`: aggiunte regole B40 mobile, safe-area, layout compact, tool chip e reduced motion. Rischio: override CSS mobile; mitigato con selettori doppi, media query 767px e test contract.
- `components/account/panel/account-state-matrix.ts`: aggiunto matcher della frase provider “non è disponibile”. Rischio basso; coperto da matrice account.
- `lib/validation/zod.ts`: configurazione canonica `jitless` prima di costruire gli schema. Rischio: minore ottimizzazione JIT; beneficio: conformità CSP e comportamento cross-browser deterministico.
- Sei moduli di validazione/API: import reindirizzati al wrapper canonico, senza cambiare gli schema.
- `app/(marketing)/layout.tsx`: lettura server-only dell'env pubblico Supabase e passaggio di `initialAuthEnabled` al provider. Rischio: accoppiamento esplicito layout/auth; mitigato perché il valore è solo un booleano serializzabile e il bootstrap resta nell'API canonica.
- `components/account/account-provider.tsx`: rimosso il calcolo browser-only dal lazy initializer di `useState`; SSR e primo render client ricevono ora lo stesso valore. `/api/auth/config` continua a riconciliare la configurazione dopo l'hydration.

### L.2 Test e release gate

- Corretto `Reflect.deleteProperty` nel test navigator e il tipo del mock Motion.
- Limitati i contract B38/B39 alla propria sezione CSS anziché alla fine del file.
- Timeout radar/axe aumentati solo nei casi costosi e timeout Vitest globale portato a 10 secondi per runner sotto contesa.
- Fixture E2E aggiornata per ignorare solo il warning `interactive-widget` di WebKit; gli errori CSP Firefox restano bloccanti.
- Aggiunto `__tests__/components/account/account-provider-hydration.test.tsx`: il test fallisce se il provider interroga l'env browser durante il render e verifica il markup iniziale per auth abilitata/disabilitata.
- Eseguiti smoke finali su artefatto locale (34/34), custom domain (22/22) e workers.dev (22/22), tutti su Chromium, Firefox e WebKit.

### L.3 Infrastruttura locale

- Installato runtime portabile ufficiale Node 22.23.1 con checksum verificato e npm 10.9.2.
- Nessun DNS, secret, binding, account o dato di produzione è stato modificato.
- Nessun comando Git distruttivo o force-push è stato usato.

## M. Commit, push e deploy

| Commit | SHA completo | Branch | Contenuto |
|---|---|---|---|
| `fix: complete mobile home and account recovery states` | `339f6ad9f332fa29ec22a6e6579bb9efc6accbf3` | `main` | B40 CSS, account retry, test contract |
| `fix: make validation compatible with release CSP` | `491dda399bb7a03f720a3670a34e659a2f5d912d` | `main` | Zod jitless, import canonici, fixture E2E |
| `test: stabilize full release checks on constrained runners` | `3550447b0bb255aa11d96d52c7100093ff462dd8` | `main` | timeout mirati e quality gate |
| `fix: keep account auth state hydration-safe in workers` | `0af7894d64de368c49e968ccf2c87411eda0d6d8` | `main` | contratto SSR/client auth e test regressione |

Push standard complessivo: `9732a01..0af7894 main -> main`.

Remote: `https://github.com/Toooly/TooolVibes.git`.

SHA remoto verificato con `git ls-remote`: `0af7894d64de368c49e968ccf2c87411eda0d6d8`.

Deployment Cloudflare applicativo finale: versione 252, deployment `20bbd024-b87b-44bd-a2d0-addea7d08da2`, 100% del traffico.

## N. Verifica del sito pubblico

La verifica è stata eseguita prima senza cookie, per confermare il gate, e poi dietro gate con una sessione temporanea senza stampare né modificare il segreto. La versione 251 ha rivelato React error #418; dopo la correzione, la versione 252 ha superato 22/22 test core sul dominio personalizzato e 22/22 sull'origine Worker. Ogni matrice include Chromium, Firefox e WebKit e le route `/`, `/archivio`, `/toools/blink`, `/shortlist`, `/compare`, `/radar` e `/account`.

L'ispezione mobile live a 390×844 ha confermato header, CTA, tool della settimana, bottom navigation e stato account `Accedi / Registrati`. Metriche: `innerWidth=390`, `scrollWidth=380`, `overflow-x=clip`; nessun overflow orizzontale. Le sole segnalazioni visuali non bloccanti rimaste sono warning deprecation di `THREE.Clock`, non errori React o runtime.

Confronto HTTP post-deploy:

| URL | Stato | Worker/versione | Cache | Esito |
|---|---:|---|---|---|
| `https://tooolvibes.eu/?audit=incident-252-20260719` | 200 | `tooolvibes` / 252 | `private, no-cache, no-store` | 22/22 live E2E; 48 asset; nessun error #418 |
| `https://tooolvibes.staff-ffa.workers.dev/?audit=incident-252-20260719` | 200 | `tooolvibes` / 252 | `private, no-cache, no-store` | 22/22 live E2E; 48 asset; nessun error #418 |

Le due origini hanno restituito la stessa lista di 48 asset, SHA-256 `A77E4E1A69D029F339964B9E8757CE397135440D9EADD20B7A484538BB3127B0`. Route funzionali verificate sull'artefatto identico: `/`, `/archivio`, `/toools/blink`, `/shortlist`, `/compare`, `/radar`, `/account`; confini admin/gate, callback auth e image allowlist sono stati verificati anche nell'E2E locale. La verifica live non considera “visibile” una modifica solo perché il deploy è verde: richiede marker/asset, rendering dietro gate e assenza di errori nei browser.

## O. Lavoro perso o da rifare

1. **Nessun commit recente su `main` è perso.** I commit Codex sono raggiungibili e sincronizzati.
2. **I 29 commit Kimi non sono persi**, ma restano fuori dal `main` corrente. Vanno valutati per intent e diff, non cherry-pickati in blocco su una base distante 139 commit.
3. **Gli 11 commit irraggiungibili sono preservati** in refs forensi e bundle. Non sono stati integrati automaticamente perché prevalentemente WIP/snapshot e potenzialmente già superseduti.
4. **La porzione CSS B40 originaria non esisteva su disco o in Git**: è stata ricostruita e testata, non “recuperata”.
5. **Attribuzione per singolo agente non recuperabile:** manca telemetria separata e l'autore Git è condiviso.
6. **Verifica cutover su database reale:** lo script richiede un `evidence.json` prodotto dall'ambiente previsto; non è stato inventato né simulato.
7. **DATA-203:** la sorgente editoriale legacy read-only resta un debito dichiarato, non un blocker di questo incident response.
8. **Warning semantici Base UI/Dialog:** da correggere in un batch accessibilità separato; non impediscono build/deploy, ma non vanno dimenticati.

## P. Stato conclusivo

`RISOLTO E VERIFICATO`

Motivazione: la repository applicativa è stata identificata senza ambiguità; gli oggetti non raggiungibili sono preservati; i commit correttivi sono su `main` e sincronizzati con `origin/main`; quality, Next, OpenNext ed E2E sono verdi; Cloudflare serve la versione 252 al 100%; custom domain e workers.dev hanno entrambi superato 22/22 test live su tre browser senza errori React #418, console, runtime o hydration. Restano soltanto attività esplicitamente separate dall'incidente (valutazione selettiva del branch Kimi, DATA-203, evidence DB reale e warning accessibilità/deprecation), nessuna delle quali invalida il recupero o il deploy verificato.
