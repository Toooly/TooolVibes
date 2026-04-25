# TooolVibes

TooolVibes e` una web app editoriale costruita con Next.js App Router, TypeScript, Tailwind CSS e una base Supabase-ready. Questa prima iterazione privilegia la qualita` del frontend pubblico, una struttura dati pulita e un perimetro server-side pronto per il futuro CMS.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase JS
- Server Components, Route Handlers e Server Actions

## Architettura

### Principi

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

1. Installa le dipendenze:

```bash
npm install
```

2. Copia l'ambiente:

```bash
cp .env.example .env.local
```

3. Avvia il progetto:

```bash
npm run dev
```

4. Apri [http://localhost:3000](http://localhost:3000)

## GitHub + Netlify deploy rapido

Netlify supporta Next.js App Router con configurazione quasi zero. In questo repo ho lasciato solo il wiring minimo e pulito:

- `netlify.toml` con `npm run build` e publish `.next`
- `.nvmrc` per allineare la major Node locale e di build
- nessun pin del vecchio plugin `@netlify/plugin-nextjs`

### 1. Push su GitHub

Se il repo remoto esiste gia`, il flusso minimo e`:

```bash
git status
git add .
git commit -m "Prepare repo for GitHub and Netlify deploy"
git push -u origin main
```

Se devi collegare il remoto per la prima volta:

```bash
git remote add origin git@github.com:YOUR-USER/YOUR-REPO.git
git push -u origin main
```

### 2. Collega il repo a Netlify

1. Vai su Netlify e scegli `Add new project` -> `Import an existing project`
2. Collega GitHub e seleziona il repo
3. Netlify rilevera` Next.js automaticamente
4. Verifica i build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. Aggiungi le env in `Site configuration -> Environment variables`
6. Avvia il primo deploy

### 3. Env da impostare su Netlify

#### Obbligatorie

```env
NEXT_PUBLIC_SITE_URL=https://YOUR-SITE.netlify.app
```

#### Obbligatorie se vuoi usare Supabase come source pubblico

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

#### Opzionali ma raccomandate per workspace persistente, auth handoff e admin reale

```env
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
TOOOLVIBES_ADMIN_PASSWORD=una-password-temp-solida
```

#### Opzionale per forzare la source collections

```env
TOOOLVIBES_COLLECTIONS_SOURCE=auto
```

### 4. Checklist post-deploy

Dopo il primo deploy controlla subito:

1. home, archivio, collection e tool profile
2. immagini remote (`images.unsplash.com`)
3. `/account` e la route `/auth/callback`
4. `/admin/login` solo se hai impostato `TOOOLVIBES_ADMIN_PASSWORD`
5. se usi Supabase Auth, aggiungi in Supabase:
   - `https://YOUR-SITE.netlify.app/auth/callback`
   - il dominio custom equivalente, se presente

### 5. Nota importante sul runtime Next.js

Secondo i docs ufficiali Netlify recenti, Next.js 13.5+ e App Router sono supportati con adattatore OpenNext gestito da Netlify. Per questo repo non serve aggiungere o pinare il vecchio plugin `@netlify/plugin-nextjs`, a meno che tu non voglia deliberatamente forzare una versione specifica.

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
TOOOLVIBES_ADMIN_PASSWORD=una-password-temporanea
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
- `TOOOLVIBES_ADMIN_PASSWORD`: password temporanea per il gate `/admin`.
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
