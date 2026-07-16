# TooolVibes database backup and restore runbook

## Status and scope

This runbook defines the local safety baseline for SAF-005. It does not
authorize a production mutation or a remote restore.

B06 repaired the legacy `0023` collision with a unique forward-only sequence.
Static checks are green; database execution evidence is still required. Follow
`docs/runbooks/migration-history-repair.md` before any fresh reset or snapshot
upgrade is treated as a valid release rehearsal.

## Non-negotiable safety rules

1. Never execute `supabase db reset --linked`.
2. Never run `supabase db push`, a seed, `psql`, `pg_restore`, or a restore
   command against production from this runbook.
3. Never pass a database URL, password, service-role key, access token, or
   populated environment file as a command-line argument.
4. Never print `.env.local`, `.dev.vars`, `.env.db-drill`, `PGPASSFILE`, or
   Supabase CLI credentials.
5. Never commit logical dumps, checksum output containing unexpected fields,
   `.temp` project links, or restore evidence with full project references.
6. The source staging project, disposable restore project, and production
   project must be three different project references.
7. A restore requires an operator and a different reviewer. A single person
   cannot both target and approve it.
8. Production rollback is a forward-fix unless the release owner explicitly
   invokes an approved managed backup/PITR procedure.

## Repository-owned local baseline

The following commands read repository files only:

```text
node scripts/release/check-migration-history.mjs
npm run db:fixture:check
npm run db:checksums:self-test
npm run db:manifest:report
```

`db:manifest:strict` is intentionally fail-closed. It rejects duplicate
versions, retired legacy filenames, changed immutable legacy effects, and a
changed reconciliation migration until the reviewed history map is updated.

The manifest includes only file names, sizes, history metadata, and raw plus
LF-normalized SHA-256 values. It never reads environment files or connects to a
database.

## Local Supabase prerequisite

The local stack requires:

- Node 22 and npm 10;
- a pinned Supabase CLI;
- Docker Desktop or a compatible Docker engine;
- PostgreSQL client 17 when checksums are captured with `psql`.

Use `npx --no-install supabase` in verification commands. This prevents an
implicit network install and fails if the pinned tool is absent.

Before any local database command:

```text
npm run db:fixture:check
npm run db:manifest:strict
node scripts/release/check-migration-history.mjs
npx --no-install supabase --version
```

Only with the B06 preflight green and all local prerequisites available:

```text
npx --no-install supabase start
npx --no-install supabase db reset --local
```

`supabase/config.toml` seeds only
`supabase/fixtures/staging_seed.sql`. The fixture is synthetic, deterministic,
idempotent for its fixed identifiers, and contains no real account.

## Checksum contract

`scripts/release/db-checksum.sql` performs SELECT statements only. It returns
one JSON object containing:

- public schema signature;
- constraint, index, policy, function, trigger, and RLS signatures;
- the `editorial-media` bucket metadata signature;
- row count and deterministic SHA-256 for each of the 22 application tables.

Capture output with a PostgreSQL service definition, not a database URL in the
process arguments:

```text
psql -X -v ON_ERROR_STOP=1 -tA -f scripts/release/db-checksum.sql
```

Redirect the output to an ignored path under `artifacts/database-drill/`.
Do not open or paste the result into chat. Compare two files locally:

```text
node scripts/release/compare-db-checksums.mjs source.json restored.json
```

The comparator accepts only the documented keys, validates all SHA-256 values,
and prints mismatch paths without printing counts or digests.

## Synthetic staging dataset

The fixture intentionally exercises these relationships:

- tool to affiliate link;
- collection to ordered tool slot;
- collection to safe-align event;
- guest viewer to workspace and tool state;
- editorial content;
- tool and affiliate submissions using `example.invalid`.

Tables tied directly to `auth.users` remain empty in the minimal fixture.
Their zero counts are still part of the checksum contract. Auth fixture
creation belongs to a later authenticated-flow batch.

The fixture checker rejects:

- inserts outside the approved table allowlist;
- `auth` or `storage` mutations;
- top-level DDL, delete, truncate, or update statements;
- connection strings and credential-shaped values;
- non-`.invalid` emails or URLs;
- generated UUIDs and current-time expressions;
- psql include, copy, connect, or shell commands.

## Staging restore drill — external gate

This section is a release gate, not an executable local action.

Prerequisites:

- approved source staging project containing synthetic data only;
- separate empty and disposable restore project;
- populated `.env.db-drill` outside Git;
- operator and reviewer;
- a documented deletion time for the target and artifacts;
- confirmed provider backup/PITR status for production.

Before a remote action, the operator and reviewer must record:

1. source alias and last four characters of its project reference;
2. target alias and last four characters of its project reference;
3. production alias and last four characters of its project reference;
4. confirmation that all three are different;
5. `TOOOLVIBES_DB_DRILL_CONFIRM=STAGING_ONLY`;
6. data classification `synthetic-only`;
7. tool versions and start time.

The remote procedure is:

1. capture the source checksum;
2. create a logical schema/data snapshot from synthetic staging;
3. hash the snapshot files;
4. restore into the empty disposable target under reviewer supervision;
5. capture the target checksum;
6. compare checksums locally;
7. smoke-test RLS and the application against the target;
8. record RTO, result, and exceptions;
9. delete the target and local artifacts at the recorded time.

No remote step is complete until the evidence template is signed.

## Production backup verification

For production, record only provider-managed backup metadata:

- backup/PITR availability;
- latest recovery point;
- retention window;
- expected RPO;
- owner;
- last verified time.

Do not download production data for B05. Do not test an in-place production
restore. If the provider plan lacks an adequate managed backup, mark release
readiness as blocked and create an approved encrypted off-site backup process.

## Storage, Auth, and Edge Functions

Database backups do not restore Storage object bytes. For the
`editorial-media` bucket, record object count and a private inventory without
logging signed URLs or content.

Also record separately:

- Auth provider and redirect configuration;
- Storage bucket configuration and object-retention procedure;
- Edge Function names and deployment versions;
- scheduled jobs;
- environment variable names, never their values.

Repository files cover Edge Function source, but not platform configuration or
secrets.

## Rollback decision tree

- Code-only regression: revert the atomic code commit.
- Additive schema defect: deploy a reviewed forward-fix migration.
- Data transformation defect: stop writes, preserve evidence, and apply the
  rehearsed compensating migration.
- Destructive or unrecoverable defect: invoke the provider-managed recovery
  procedure with release-owner approval.
- Unknown target or missing backup evidence: stop. No mutation is allowed.

## Completion criteria

The local portion is complete when:

- fixture validation and checksum comparator self-test are green;
- the manifest reports every migration with raw and normalized SHA-256;
- the strict manifest is green and validates the repaired `0023` history map;
- backup artifacts and credentials are ignored;
- local workspace recovery is documented.

SAF-005 as a whole is complete only after the staging restore evidence shows:

- source and target checksums match;
- no production project was touched;
- RTO and owner are recorded;
- target and temporary artifacts were deleted;
- Storage and platform-config gaps are explicitly classified.
