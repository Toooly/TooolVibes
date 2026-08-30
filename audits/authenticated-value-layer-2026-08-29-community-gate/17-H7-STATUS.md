# H7 STATUS — production landing + release hardening

Status: **H7.1 DARK RUNTIME LIVE**. Community flags still OFF. Not fully released.

H7.1 deploy:
- main = origin/main = `/api/release` = `8362442ea3c559ee6bdf5504d517c10750a36bd2`
- Worker `d276a824-2411-4a2a-803d-3bb85a3e4cba`
- builtAt `2026-08-30T13:57:41.326Z`
- gzip **2897.32 KiB** (was 3228.44; limit 3072)
- GET `/api/community/experiences?tool=blink` → 404 `{ error: { code: FEATURE_DISABLED } }`
- Tool Page has no Esperienze section

## H7.2 READ activation (in progress)

Flag mechanic: `wrangler.jsonc` vars are the source of truth. `scripts/run-cloudflare-build.mjs` copies them into the Next/OpenNext build env so force-static Tool Pages and API bundles match.

READ production:

- SHA `/api/release` = `278f57af75bfbb87f5e3adc9ddb7ff7a3a642da4`
- Worker `1645080c-adac-4a3e-9234-28c2c9c1cd4e`
- gzip **2899.72 KiB**
- GET experiences 200 `{experiences:[], nextCursor:null}`
- POST/PATCH/DELETE/REPORT = FEATURE_DISABLED
- Tool Page empty copy live. No write CTA.

WRITE/REPORT remain OFF: no Turnstile secret/site key in Worker; no safe owner/second-account smoke in this pass.

H7 verdict: **DEPLOYED WITH CONTROLLED GATES** (R1 W0 P0).




Do not mark H0–H6 RELEASED until the dark app deploy exists.

## Verdict so far

- Dismissed is first-class: `open | resolved | dismissed`.
- H1 SQL was not edited. Forward-only `20260830180000_community_experience_reports_dismissed.sql`.
- Server release gates return `404 FEATURE_DISABLED`.
- Production project: **Tooolvibes Ecosystem** `pjyasxaebxvvmcjxvnno` (eu-west-1), matches wrangler `NEXT_PUBLIC_SUPABASE_URL`.
- Community tables exist, **0 rows**, FORCE RLS, no anon/authenticated GRANT.
- PostgREST anon: HTTP 401 `42501 permission denied` on both tables.

## Dismissed decision

H6 encoded Ignorate as `status=resolved` + `resolution_note` prefix `Ignorata`.
That is machine state in a human note. Rejected for launch.

Final transitions:

- `open → resolved`
- `open → dismissed`
- no reopen V1

`resolution_note` is only a human note.

## Feature flags (release gates, not authz)

Env:

- `TOOOLVIBES_COMMUNITY_READ_ENABLED`
- `TOOOLVIBES_COMMUNITY_WRITE_ENABLED`
- `TOOOLVIBES_COMMUNITY_REPORT_ENABLED`

Parser: `lib/config/release-features.ts`, default **false**.

wrangler.jsonc vars (this branch): all `"0"`.

| Surface | Gate |
|---|---|
| GET public experiences | read |
| GET /mine | read AND (write OR report) |
| POST/PATCH/DELETE | read AND write |
| POST report | read AND report |
| Admin moderation | **not** gated by public flags |

Flag-off response: `{ error: { code: "FEATURE_DISABLED" } }` HTTP 404.

When flags are ON, Bearer / ownership / RLS / Zod / rate limit / Turnstile still apply.

### Build vs runtime

- Tool Page is `force-static`. `isCommunityReadEnabled()` is evaluated at **build**.
- API routes run in the Worker with wrangler `vars` from **that deploy**.
- Dashboard-only env toggles will **not** reliably change static Tool Page HTML.
- Activation requires a build/deploy whose wrangler vars (or equivalent build env) contain the intended `1`/`0` set.
- `revalidatePath` is not a flag toggle.

Invalid combo `R0 W1 P1`: write and report stay closed.

## Production migration

**Did not** `supabase db push` the full local history.

Remote `schema_migrations` before landing:

- `20260731184002`, `20260731184004`, `20260731184216` (remote-only)
- `20260807000001`, `20260815162729`, `20260820000000`

Local numbered `0001`–`0023` and most 202606/202607 files are **not** in remote history (applied historically outside this ledger). Blind push would replay them.

Applied **only**:

1. `20260829120000_community_experiences.sql` via `supabase db query --linked --file`
2. `20260830180000_community_experience_reports_dismissed.sql`
3. Inserted those versions into `supabase_migrations.schema_migrations`

Did **not** apply `20260828000000` workspace events.

## Production schema proof

- RLS true, FORCE RLS true on both tables
- FKs: `author_id → auth.users ON DELETE CASCADE`, `reporter_id → auth.users ON DELETE CASCADE`, `experience_id → community_experiences ON DELETE CASCADE`
- Unique `(author_id, tool_slug)` and `(reporter_id, experience_id)`
- Report status CHECK includes `dismissed`
- Grants: postgres + service_role only
- anon/authenticated `has_table_privilege` all false
- Row counts: 0 / 0

## Rollback

1. REPORT OFF
2. WRITE OFF
3. READ OFF
4. App commit/deploy rollback if needed

DB stays. **No DROP** after public data exists. Before public data, drop is technically possible; policy is still flags/app rollback.

## Deploy

`git push origin main` → `1d46ac3`.

Workers Builds left `/api/release` as `{ sha: development }`.

Canonical `npm run cloudflare:deploy` from `1d46ac3` **failed**:

- Cloudflare error **10027**
- Worker exceeded **3 MiB** size limit
- Upload `14590.15 KiB` / gzip **`3228.44 KiB`** (over 3072 KiB)
- Largest: `.open-next/server-functions/default/handler.mjs` 14351.85 KiB
- wrangler vars included Community flags all `"0"`
- **No second deploy attempted**

Latest successful Worker version remains **2026-08-29T22:03** (`89623406-…`), pre-Community.

Production still has no `/api/community/*` (HTML 404). Tool Page has no Esperienze.

## Remaining H7

- Unblock Worker size (account limit vs gzip growth) then **one** `cloudflare:deploy`
- Dark production smoke on the new SHA
- Controlled READ then WRITE (Turnstile) then REPORT
- Real-auth smokes if safe sessions exist
- Do **not** start Final Closure until the Worker is live

## H7.3 Turnstile readiness (WRITE still OFF)

- Widget `TooolVibes Community` created for hostname `tooolvibes.eu` (managed).
- Server secret env `TOOOLVIBES_TURNSTILE_SECRET_KEY` stored via wrangler secret (not in git).
- Site key env `NEXT_PUBLIC_TURNSTILE_SITE_KEY` not yet in wrangler.jsonc (deferred until WRITE activation).
- Invalid/empty tokens fail siteverify.
- Valid-token proof not run (no browser challenge).
- Owner/admin/second-account sessions: not available in this pass.
- WRITE and REPORT remain 0.

## H7.3 Stage B — Turnstile site key in production build (WRITE still OFF)

- Public env `NEXT_PUBLIC_TURNSTILE_SITE_KEY` added to wrangler vars and Cloudflare Next build env.
- Secret remains Worker secret only.
- Flags stay R1 W0 P0 until a later activation pass.
