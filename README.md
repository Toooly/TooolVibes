# TooolVibes

TooolVibes e` una web app editoriale costruita con Next.js App Router, TypeScript, Tailwind CSS e una base Supabase-ready. Questa prima iterazione privilegia la qualita` del frontend pubblico, una struttura dati pulita e un perimetro server-side pronto per il futuro CMS.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase JS
- Server Components, Route Handlers e Server Actions

## Architettura

### Principi veri 1

- Il frontend pubblico legge da un unico data access layer in sola lettura.
- Le scritture admin sono confinate a moduli server-side.
- Supabase e` opzionale nella prima iterazione: se non configurato, l'app usa mock data editoriali.
- Copy, navigazione e costanti di brand sono centralizzate.
- UI e layout sono costruiti come componenti riusabili, non come pagine monolitiche.

### Flusso dati

1. Le pagine pubbliche chiamano `lib/data/public-tools.ts`.
2. Le collection pubbliche chiamano `lib/data/public-collections.ts`, che risolve un repository multi-source.
3. Il layer tools tenta una lettura read-only da Supabase se le env pubbliche sono presenti.
4. Il layer collections usa `TOOOLVIBES_COLLECTIONS_SOURCE` per leggere da `mock`, `content`, `supabase` o da una modalita` `auto` con precedence e dedupe per slug.
5. Se una source non e` disponibile, TooolVibes torna a fallback coerenti senza rompere la UI pubblica.
6. Le scritture admin usano `lib/admin/tool-mutations.ts` con service role lato server.

### Admin

- Route base: `/admin`
- Gate temporaneo: password da env + cookie httpOnly
- Evoluzione prevista: sostituzione del gate con Supabase Auth mantenendo invariato il perimetro delle pagine protette

## Struttura cartelle

```text
app/
  (marketing)/
    page.tsx
    archivio/page.tsx
    tags/page.tsx
    shop/page.tsx
    toools/[slug]/page.tsx
  (admin)/
    admin/
      actions.ts
      login/page.tsx
      (protected)/
        layout.tsx
        page.tsx
  api/tools/route.ts
  globals.css
  layout.tsx
  not-found.tsx
components/
  layout/
  sections/
  tools/
  ui/
lib/
  admin/
  config/
  data/
  supabase/
  types/
supabase/
  migrations/
  seed.sql
```

## Cosa c'e` gia`

- Home editoriale premium in italiano
- Archivio dei Toools con ricerca e filtro categoria
- Sezione "I TOOOLS DELLA SETTIMANA"
- Sezione "scopri TUTTI I TOOOLS CHE ABBIAMO SELEZIONATO PER TE:"
- Pagina tags
- Pagina Digital Shop placeholder
- Pagina dettaglio tool
- Route API pubblica `GET /api/tools`
- Gate admin temporaneo e dashboard CMS
- Lista admin con toggle featured/published e delete server-side
- Pagine admin per creazione e modifica tool
- Schema SQL per tabella `tools` + policy RLS
- Seed SQL con sample tools italiani realistici
- Repository Supabase read-only dedicato alle pagine pubbliche
- Endpoint `GET /api/tools` con `meta.source` e `meta.count` per verificare il datasource attivo
- Workspace persistente local-first per shortlist, compare e decision memory
- Viewer guest via cookie HTTP-only con upgrade ad account reale via magic link
- Merge guest -> account senza perdita di shortlist, compare, note, pin, reason e stage
- Collections curate con source layer, stati editoriali minimi e special issue pubbliche
- Micro surface protetta `/admin/collections` per leggere il workflow editoriale collection-first

## Setup locale

1. Usa il runtime di release esatto:

```bash
node --version # v22.23.1
npm --version  # 10.9.2
npm run check:runtime
```

`.nvmrc`, `.node-version`, `packageManager` ed `engines` sono la fonte canonica. L'installazione fallisce intenzionalmente su versioni diverse.

2. Installa le dipendenze dal lockfile:

```bash
npm ci
```

3. Copia l'ambiente:

```bash
cp .env.example .env.local
```

4. Avvia il progetto:

```bash
npm run dev
```

5. Apri [http://localhost:3000](http://localhost:3000)

La CI e le build di release devono usare Node 22.23.1 e npm 10.9.2; non usare il runtime globale se non coincide.

## GitHub + Cloudflare deploy rapido

Questo repo e` ora cablato per Cloudflare Workers usando l'adapter OpenNext ufficiale per Next.js. I file chiave sono:

- `wrangler.jsonc` per runtime, assets e binding Cloudflare
- `open-next.config.ts` per l'adapter OpenNext
- `next.config.ts` con `initOpenNextCloudflareForDev()` per far lavorare bene `next dev`
- `.dev.vars.example` per la preview locale nel runtime Workers
- `.env.example` per le env applicative condivise tra sviluppo, build e deploy

### 1. Push su GitHub

Se il repo remoto esiste gia`, il flusso minimo e`:

```bash
git status
git add .
git commit -m "Prepare repo for Cloudflare deploy"
git push -u origin main
```

Se devi collegare il remoto per la prima volta:

```bash
git remote add origin git@github.com:YOUR-USER/YOUR-REPO.git
git push -u origin main
```

### 2. File env per sviluppo e preview

Per il normale sviluppo Next.js puoi continuare a usare `.env.local`:

```bash
cp .env.example .env.local
```

Per testare davvero il runtime Cloudflare in locale usa invece `.dev.vars`:

```bash
cp .dev.vars.example .dev.vars
```

Cloudflare raccomanda di usare `.dev.vars` o `.env` per i secret locali, ma non entrambi nello stesso flusso di `wrangler dev`.

### 3. Env da impostare su Cloudflare

#### Obbligatorie

```env
NEXT_PUBLIC_SITE_URL=https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev
```

#### Obbligatorie se vuoi usare Supabase come source pubblico

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

#### Opzionali ma raccomandate per workspace persistente, auth handoff e admin reale

Queste vanno trattate come secret in Cloudflare:

```env
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
TOOOLVIBES_ADMIN_EMAIL=admin@example.com
TOOOLVIBES_ADMIN_PASSWORD_HASH=YOUR_BCRYPT_ADMIN_PASSWORD_HASH
TOOOLVIBES_SESSION_SECRET=YOUR_LONG_RANDOM_SESSION_SECRET
```

`TOOOLVIBES_ADMIN_PASSWORD_HASH` si genera con `npx tsx scripts/generate-admin-hash.ts <password>`.
Nei file `.env*` usati da Next.js, escape ogni `$` dell'hash bcrypt come `\$`; nei secret Cloudflare incolla invece l'hash normale.
`TOOOLVIBES_ADMIN_PASSWORD` esiste ancora come fallback legacy server-side, ma in produzione usa l'hash bcrypt.
Per diagnosticare temporaneamente il login senza stampare password puoi impostare `TOOOLVIBES_AUTH_DEBUG=1`.

Esempio con Wrangler:

```bash
npx wrangler secret put TOOOLVIBES_ADMIN_EMAIL
npx wrangler secret put TOOOLVIBES_ADMIN_PASSWORD_HASH
npx wrangler secret put TOOOLVIBES_SESSION_SECRET
```

#### Opzionale per forzare la source collections

```env
TOOOLVIBES_COLLECTIONS_SOURCE=auto
```

#### Opzionale per Product Hunt live ranking

Imposta questi secret solo lato server/runtime. Non usare il prefisso `NEXT_PUBLIC_`.

```env
PRODUCTHUNT_CLIENT_ID=YOUR_PRODUCT_HUNT_API_KEY
PRODUCTHUNT_CLIENT_SECRET=YOUR_PRODUCT_HUNT_API_SECRET
```

In alternativa puoi usare un developer token diretto:

```env
PRODUCTHUNT_TOKEN=YOUR_PRODUCT_HUNT_DEVELOPER_TOKEN
```

La home e la pagina `/product-hunt` mostrano un fallback pulito se le credenziali non sono presenti.

**Se usi Cloudflare Workers Builds con repo Git collegata** (build automatiche), **devi** aggiungere le chiavi critiche (soprattutto quelle admin) anche nella sezione `Build Variables and secrets` del collegamento Git, **non solo** nel runtime del Worker. Altrimenti ogni nuovo push/reset dei deploy le fa sparire e il login admin smette di funzionare. Vedi la sezione "Collega il repo a Cloudflare" più avanti per i dettagli.

### 4. Comandi locali utili

```bash
npm run dev
```

Avvia il dev server Next.js classico.

```bash
npm run preview
```

Costruisce l'app con OpenNext e la esegue localmente nel runtime Cloudflare Workers.

```bash
npm run deploy
```

Deploya su Cloudflare Workers una build OpenNext gia` generata. Questo comando e`
pensato per la fase Deploy di Workers Builds, dove la build e` gia` stata eseguita.

```bash
npm run deploy:local
```

Costruisce l'app e poi la deploya da locale.

```bash
npm run cf-typegen
```

Rigenera i tipi delle binding Cloudflare se cambi `wrangler.jsonc`.

### 5. Collega il repo a Cloudflare

1. Vai in `Cloudflare Dashboard -> Workers & Pages`
2. Crea un nuovo progetto Workers collegato al repo GitHub
3. Usa come build command `npm run cloudflare:build`
4. Usa come deploy command `npm run cloudflare:deploy`
5. Per branch non production usa `npm run cloudflare:upload`
6. Non usare `npm run build` come build command Cloudflare: serve solo a Next.js ed e` richiamato internamente da OpenNext
7. Non usare `npm run deploy:local` come deploy command Cloudflare: rilancerebbe build + deploy nello stesso step
8. In `Build Variables and secrets` inserisci le env applicative richieste dal progetto
9. Se usi un dominio custom, collega il dominio al Worker dopo il primo deploy

**⚠️ IMPORTANTE - Segreti Admin e Build Git (causa principale di problemi ricorrenti)**

**Il tuo problema attuale ("ho messo tutto, funziona, poi faccio una nuova build e i secret spariscono") è il classico comportamento di Cloudflare Workers Builds collegato a Git.**

Quando fai un deploy da Git (o `npm run deploy`), Cloudflare **ricrea da zero** un nuovo Worker usando la definizione della Build Configuration. I secret che aggiungi manualmente dopo il deploy (nella pagina normale del Worker) **non vengono salvati** nella definizione della build e quindi spariscono al deploy successivo.

### Soluzione stabile: dove mettere i secret in modo che NON spariscano mai più

Devi aggiungere i secret **dentro la Build Configuration** collegata al repository (non solo come secret runtime).

#### Passi precisi (2026 UI)

1. Vai su Cloudflare Dashboard → **Workers & Pages**
2. Clicca sul progetto **tooolvibes**
3. Nel menu laterale (o in alto) clicca su **Builds**
4. Nella lista delle build/configurazioni, trova quella collegata al tuo repository Git e clicca su di essa (o su "Build configuration" / "Edit build settings").
5. **Importante**: Non andare su "Variables and Secrets" del Worker normale. Devi stare dentro la configurazione della build Git.
6. Cerca e clicca su **Build variables and secrets** (o "Environment variables" all'interno della build config).
7. Aggiungi qui tutti i secret critici **come tipo Secret**:

   - `TOOOLVIBES_ADMIN_EMAIL`
   - `TOOOLVIBES_ADMIN_PASSWORD_HASH`
   - `TOOOLVIBES_ADMIN_PASSWORD`
   - `TOOOLVIBES_SESSION_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`

8. Salva la Build configuration.

9. Fai un nuovo deploy (`git push` o `npm run deploy`).

Da questo momento, **ogni build futura** (anche quelle automatiche da Git) dovrebbe vedere questi secret.

### Verifica che hai modificato il posto giusto

- Se dopo un nuovo deploy i secret spariscono di nuovo → hai modificato il posto sbagliato (probabilmente solo i secret runtime del Worker).
- Il posto corretto è dentro la **Build configuration** associata al Git repo, non nella pagina "Settings → Variables and Secrets" del Worker.

Se nella UI non trovi più "Builds" o la sezione è diversa, cerca nel Worker:
- **Deployments** tab → **Builds** → seleziona la build configuration → modifica da lì.

**Helper locale**

Nel repository esiste lo script:

```powershell
.\scripts\cloudflare-admin-secrets-reminder.ps1
```

Lancialo prima di ogni deploy importante. Ti ricorda esattamente dove mettere i secret in modo che non spariscano.

---

**Soluzione ancora più robusta (consigliata per il futuro)**

Molti team che usano questo stack finiscono per gestire i secret tramite CI invece che manualmente nella dashboard:

- Usare GitHub Actions + `wrangler secret put` (o Cloudflare API) durante il deploy.
- I secret veri vengono salvati come **GitHub Secrets** (o simili) e iniettati solo al momento del deploy.

Se vuoi, posso prepararti un esempio di GitHub Action minimal per fare questo in modo automatico.

Per ora la cosa più importante è assicurarti di aver aggiunto i secret **dentro la Build configuration** (non solo nel Worker runtime).

### 6. Checklist post-deploy

Dopo il primo deploy controlla subito:

1. home, archivio, collection e tool profile
2. immagini remote (`images.unsplash.com`)
3. `/account` e la route `/auth/callback`
4. `/admin/login` solo se hai impostato `TOOOLVIBES_ADMIN_EMAIL` e `TOOOLVIBES_ADMIN_PASSWORD_HASH`
5. se usi Supabase Auth, aggiungi in Supabase:
   - `https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev/auth/callback`
   - il dominio custom equivalente, se presente

### 7. Nota importante sul runtime Next.js

Secondo i docs ufficiali Cloudflare aggiornati, Next.js su Workers va configurato con `@opennextjs/cloudflare`, un file `wrangler.jsonc`, `nodejs_compat` attivo e una `compatibility_date` recente. Per questo repo la build Cloudflare non passa piu` da Netlify e non usa piu` `netlify.toml`.

## Setup Supabase

### Opzione A: SQL Editor Supabase

1. Crea un nuovo progetto su Supabase.
2. Apri `SQL Editor` nel progetto.
3. Esegui i file SQL nell'ordine esatto seguente:
   - `supabase/migrations/0001_create_tools.sql`
   - `supabase/migrations/0002_tools_policies.sql`
   - `supabase/migrations/0003_tools_grants.sql`
   - `supabase/migrations/0004_tools_category_constraint.sql`
   - `supabase/migrations/0005_create_viewer_workspace.sql`
   - `supabase/migrations/0006_viewer_workspace_policies.sql`
   - `supabase/migrations/0007_viewer_workspace_grants.sql`
   - `supabase/migrations/0008_viewer_profile_auth_identity.sql`
   - `supabase/migrations/0009_create_collections.sql`
   - `supabase/migrations/0010_collections_policies.sql`
   - `supabase/migrations/0011_collections_grants.sql`
   - `supabase/migrations/0012_create_collection_transition_reviews.sql`
   - `supabase/migrations/0013_collection_transition_reviews_grants.sql`
   - `supabase/migrations/0014_create_collection_safe_align_events.sql`
   - `supabase/migrations/0015_collection_safe_align_events_grants.sql`
   - `supabase/migrations/0016_expand_collection_access_for_premium.sql`
   - `supabase/migrations/0017_create_tool_requests.sql`
   - `supabase/seed.sql`
4. Vai in `Table Editor` e verifica che la tabella `public.tools` esista e contenga i record seed.
5. Vai in `Project Settings > API` e copia:
   - `Project URL`
   - `anon public key`
   - `service_role key`
6. Inserisci in `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
TOOOLVIBES_ADMIN_EMAIL=admin@example.com
TOOOLVIBES_ADMIN_PASSWORD_HASH=YOUR_BCRYPT_ADMIN_PASSWORD_HASH
TOOOLVIBES_SESSION_SECRET=YOUR_LONG_RANDOM_SESSION_SECRET
TOOOLVIBES_COLLECTIONS_SOURCE=auto
```

7. Riavvia il dev server dopo avere salvato `.env.local`:

```bash
npm run dev
```

8. Apri `http://localhost:3000` e controlla il comportamento:
   - se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` sono presenti, il layer tools pubblico legge da Supabase
   - se una delle due env pubbliche manca, l'app torna ai mock data locali
   - se e` presente anche `SUPABASE_SERVICE_ROLE_KEY`, shortlist, compare, note e workspace possono sincronizzarsi davvero con il layer remoto
   - se auth e` configurata ma manca `SUPABASE_SERVICE_ROLE_KEY`, il login resta disponibile ma la workspace continua a vivere in fallback locale
   - per le collection, `TOOOLVIBES_COLLECTIONS_SOURCE=auto` compone le source con precedence `supabase > content > mock`, evitando doppioni per slug durante la transizione
   - puoi forzare `mock`, `content` o `supabase` per testare la source architecture senza cambiare la UI pubblica
9. Verifica il datasource attivo con:

```bash
curl http://localhost:3000/api/tools
```

Controlla il blocco `meta`:
- `meta.source = "supabase"` quando il frontend pubblico sta leggendo davvero dal database
- `meta.source = "mock"` quando mancano le env pubbliche e l'app sta usando i mock locali
- `meta.count` ti aiuta a confrontare rapidamente il numero di record con il seed caricato

### Opzione B: Supabase CLI

Se hai gia` la CLI installata e un progetto linkato:

```bash
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
```

Assicurati che le migration applicate includano anche `0004_tools_category_constraint.sql`, poi configura `.env.local` come sopra.

### Setup Auth minimale

Per abilitare il pass guest -> account con magic link:

1. Vai in `Authentication > Providers > Email` e abilita `Email` o `Magic Link`.
2. In `Authentication > URL Configuration`, aggiungi almeno:
   - `http://localhost:3000/auth/callback`
   - l'URL di produzione equivalente quando esiste
3. Verifica che `.env.local` contenga:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

4. Avvia l'app e usa `/account` per inviare il magic link.

### Workspace persistence e handoff guest -> account

- Da guest, shortlist, compare, note, pin, reason e stage continuano a funzionare subito in local-first.
- Se il layer remoto e` disponibile, il viewer guest viene persistito anche su Supabase tramite cookie HTTP-only.
- Quando l'utente apre il magic link, TooolVibes collega il viewer guest a un account reale e mergea lo stato locale/remoto in modo conservativo.
- In logout, l'utente torna a un nuovo viewer guest senza perdere il workspace corrente.

### Variabili richieste

- `NEXT_PUBLIC_SUPABASE_URL`: URL del progetto Supabase, usato dal layer pubblico read-only.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: chiave anon pubblica, usata solo per leggere i tool pubblicati.
- `SUPABASE_SERVICE_ROLE_KEY`: chiave server-side per mutazioni admin e persistenza remota della workspace.
- `TOOOLVIBES_ADMIN_EMAIL`: email amministratore accettata dal gate `/admin`.
- `TOOOLVIBES_ADMIN_PASSWORD_HASH`: hash bcrypt della password admin, server-side.
- `TOOOLVIBES_ADMIN_PASSWORD`: fallback legacy server-side, ignorato se l'hash bcrypt e` presente.
- `TOOOLVIBES_SESSION_SECRET`: segreto opzionale per firmare il cookie HTTP-only `tooolvibes_admin`.
- `TOOOLVIBES_AUTH_DEBUG`: opzionale, usa `1` solo temporaneamente per log server-side sicuri del login.
- `NEXT_PUBLIC_SITE_URL`: URL locale dell'app, utile per metadata e ambiente locale coerente.
- `TOOOLVIBES_COLLECTIONS_SOURCE`: controlla la source delle collection (`auto`, `mock`, `content`, `supabase`). In `auto`, Supabase prevale sugli slug gia` migrati e le source locali restano fallback per il resto.

### Configurazione minima per avviare il frontend pubblico con Supabase

- Obbligatorie: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Opzionale per il solo frontend pubblico: `SUPABASE_SERVICE_ROLE_KEY`
- Necessaria per l'admin write-enabled: `SUPABASE_SERVICE_ROLE_KEY`

### Cosa succede in runtime

- Le pagine pubbliche chiamano solo `lib/data/public-tools.ts`.
- Se le env pubbliche esistono, il layer pubblico usa solo il client anon Supabase e legge `public.tools`.
- Se le env pubbliche mancano, il frontend usa soltanto `lib/data/mock-tools.ts`.
- Non esiste fallback automatico ai mock in caso di errore Supabase: con env presenti, la fonte dati pubblica resta Supabase.
- La persistenza workspace usa route handler server-side:
  - `GET /api/discovery-state`
  - `PUT /api/discovery-state`
  - `POST /api/discovery-account/attach`
  - `POST /api/discovery-account/release`
- Se `SUPABASE_SERVICE_ROLE_KEY` manca, shortlist/compare/note restano operative ma in modalita` locale.

## Note implementative

- Il layer pubblico non usa chiavi sensibili.
- Il repository pubblico legge solo con client anon e solo dati pubblicati.
- Il service role e` richiesto solo per le mutazioni admin server-side.
- I moduli di accesso dati e mutazione sensibili sono marcati `server-only`.
- La UI e` pensata per essere collegata a un CMS senza riscrivere i componenti del frontend.
- La copy italiana e` centralizzata in `lib/config/strings.ts`.
- Se Supabase admin non e` configurato, il CMS resta navigabile in sola lettura usando i mock data.
- Il fallback mock esiste solo quando le env pubbliche Supabase non sono presenti.
- L'upgrade guest -> account usa Supabase Auth via magic link, ma mantiene una UX discreta: nessun onboarding pesante, nessun blocco iniziale all'uso guest.

## Prossimo step consigliato

1. Collegare Supabase Auth all'area admin mantenendo invariato il perimetro delle mutazioni server-side.
2. Sostituire gli URL immagine manuali con Supabase Storage o un media layer dedicato.
3. Aggiungere filtri editoriali avanzati e ordinamenti lato query.
