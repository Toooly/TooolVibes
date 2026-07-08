# REPORT_AGENT_DO_NOT_TOUCH_ZONES

Aree vietate o ad alto rischio. Un agente di modifica non deve toccarle salvo richiesta esplicita, task dedicato e QA mirato.

## Supabase

- **Perche e rischiosa:** Contiene integrazione dati e accesso persistente.
- **Problemi possibili:** Rottura fetch, permessi, dati mancanti.
- **Quando puo essere modificata:** Solo con task backend/data esplicito.
- **Verifiche prima e dopo:** Backup contesto, test query, build e smoke test route dati.

## auth

- **Perche e rischiosa:** Gestisce login/sessioni.
- **Problemi possibili:** Logout forzati, accessi bloccati, sicurezza indebolita.
- **Quando puo essere modificata:** Solo con richiesta auth esplicita.
- **Verifiche prima e dopo:** Test login/logout, session restore, route protette.

## RLS

- **Perche e rischiosa:** Protegge dati lato database.
- **Problemi possibili:** Esposizione o blocco dati.
- **Quando puo essere modificata:** Solo con piano sicurezza.
- **Verifiche prima e dopo:** Review policy, test utenti diversi, rollback plan.

## API routes

- **Perche e rischiosa:** Sono contratti consumati dal frontend.
- **Problemi possibili:** Breaking change dati o errori runtime.
- **Quando puo essere modificata:** Solo se il task richiede contratto API.
- **Verifiche prima e dopo:** Test endpoint, error state, build.

## middleware

- **Perche e rischiosa:** Influenza routing e gate.
- **Problemi possibili:** Loop redirect, pagine non accessibili.
- **Quando puo essere modificata:** Solo con task routing/gate esplicito.
- **Verifiche prima e dopo:** Test route pubbliche/protette, cache, redirect.

## route handlers

- **Perche e rischiosa:** Gestiscono request server-side.
- **Problemi possibili:** Errori server e payload incompatibili.
- **Quando puo essere modificata:** Solo con task server esplicito.
- **Verifiche prima e dopo:** Test handler e pagine consumer.

## server actions

- **Perche e rischiosa:** Possono modificare dati.
- **Problemi possibili:** Mutazioni errate o permessi rotti.
- **Quando puo essere modificata:** Solo con task data/action.
- **Verifiche prima e dopo:** Test optimistic state, error handling, rollback.

## database schema

- **Perche e rischiosa:** Cambiare schema impatta tutte le query.
- **Problemi possibili:** Migrazioni fallite, dati incompatibili.
- **Quando puo essere modificata:** Solo con migrazione pianificata.
- **Verifiche prima e dopo:** Migrazione staging, seed, rollback.

## env variables

- **Perche e rischiosa:** Configurano servizi e gate.
- **Problemi possibili:** Build/deploy falliti o secret leak.
- **Quando puo essere modificata:** Solo con richiesta config.
- **Verifiche prima e dopo:** Verifica `.env*`, build locale, deploy checklist.

## package manager config

- **Perche e rischiosa:** Influenza install e lockfile.
- **Problemi possibili:** Dipendenze rotte o build non riproducibile.
- **Quando puo essere modificata:** Solo con richiesta dipendenze.
- **Verifiche prima e dopo:** Install pulito, lock diff, build.

## build config

- **Perche e rischiosa:** Influenza compilazione e bundle.
- **Problemi possibili:** Deploy rotto o performance regressiva.
- **Quando puo essere modificata:** Solo con task build.
- **Verifiche prima e dopo:** Build locale, analisi errori, smoke test.

## deployment config

- **Perche e rischiosa:** Influenza ambiente pubblico.
- **Problemi possibili:** Deploy non disponibile.
- **Quando puo essere modificata:** Solo con task deploy.
- **Verifiche prima e dopo:** Preview deploy, env check, rollback.

## Cloudflare config

- **Perche e rischiosa:** Influenza DNS/cache/security/gate.
- **Problemi possibili:** Sito irraggiungibile, cache errata.
- **Quando puo essere modificata:** Solo con richiesta Cloudflare esplicita.
- **Verifiche prima e dopo:** Verifica DNS/cache, purge controllata, rollback.

## routing globale

- **Perche e rischiosa:** Influenza navigazione e SEO.
- **Problemi possibili:** 404, redirect errati, link rotti.
- **Quando puo essere modificata:** Solo con task routing.
- **Verifiche prima e dopo:** Test nav, sitemap/robots se coinvolti, build.

## shared state stores

- **Perche e rischiosa:** Persistono scelte save/compare.
- **Problemi possibili:** Perdita stato utente o drift UI.
- **Quando puo essere modificata:** Solo per task dedicati come FIX-006.
- **Verifiche prima e dopo:** Test storage, reload, multi-route, migrazione.
