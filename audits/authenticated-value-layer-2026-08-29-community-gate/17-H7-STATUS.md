# H7 STATUS — production landing + release hardening

Status: **IN PROGRESS** (schema landed dark; app not merged).

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

## Remaining H7

- Full suite / lint / styles / flag-off build
- Merge + dark deploy (`READ/WRITE/REPORT` stay 0)
- Controlled activation + real-auth smokes
- Cloudflare 1280 recheck
