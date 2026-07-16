# Migration history repair: legacy version 0023

## Status

SEC-102 is repaired in the repository with a unique, forward-only sequence.
The static history checks and strict manifest are green. Fresh database,
snapshot upgrade, and schema-diff evidence remain mandatory before release and
must run only with the B05 backup baseline in place.

This runbook does not authorize access to or mutation of production.

## What happened

Two migrations were created independently with version `0023`. Supabase records
the numeric version, so a database containing a `0023` history row does not by
itself prove which SQL body ran.

The repository recognizes exactly three legacy states:

| State | Schema effect already present | History row |
| --- | --- | --- |
| `0023-unapplied` | neither candidate | absent |
| `0023-editorial` | editorial table, policies, bucket | `0023` |
| `0023-founder-flow` | founder-flow columns and indexes | `0023` |

The immutable candidate hashes and this mapping live in
`supabase/migrations/migration-history.json`.

## Canonical forward sequence

1. `0023_create_editorial_articles.sql` remains the canonical version `0023`.
2. The founder-flow candidate keeps the identical normalized SQL body at
   `20260705000000_expand_tool_requests_for_founder_flows.sql`.
3. `20260716000001_reconcile_legacy_0023.sql` reapplies both effects with
   idempotent DDL and fails if the required columns or storage bucket are still
   missing.

This converges every recognized state:

| Starting state | What Supabase skips | What runs | Expected result |
| --- | --- | --- | --- |
| Empty database | nothing | canonical, renamed, reconcile | both effects |
| Editorial `0023` | canonical `0023` | renamed, reconcile | both effects |
| Founder-flow `0023` | canonical `0023` | renamed no-op, reconcile | both effects |

Do not delete the reconciliation migration after the first successful deploy.
It is part of the permanent history needed to upgrade an ambiguous legacy DB.

## Repository preflight

Run from the repository root with the pinned Node/npm runtime:

```text
node scripts/release/check-migration-history.mjs
node scripts/release/build-db-manifest.mjs
node scripts/release/check-staging-seed.mjs
node scripts/release/compare-db-checksums.mjs --self-test
```

Expected results:

- 37 unique migration versions at the end of B06;
- manifest status `ok` with no issues;
- `SEC-102-0023` present in `migration_history`;
- no file named `0023_expand_tool_requests_for_founder_flows.sql`;
- fixture and checksum comparator green.

The manifest validates both raw and LF-normalized hashes. The normalized hash
protects the legacy SQL body across Windows and Unix line endings.

## Read-only staging classification

Before an upgrade rehearsal, create a B05 backup and inspect a disposable clone
or approved staging target. Do not infer the state from migration file names.

The following query is read-only and classifies the two known effects:

```sql
with required_columns as (
  select
    count(*) filter (
      where table_name = 'editorial_articles'
        and column_name = any (array[
          'id', 'slug', 'title', 'dek', 'summary', 'kind', 'status',
          'content_markdown', 'cover_image_url', 'cover_image_alt',
          'author_name', 'tags', 'published_at', 'is_featured',
          'created_at', 'updated_at'
        ])
    ) as editorial_count,
    count(*) filter (
      where table_name = 'tool_requests'
        and column_name = any (array[
          'submitter_type', 'use_case', 'referral_url', 'media_url',
          'personal_notes', 'founder_name', 'company_role', 'launch_stage',
          'budget_range', 'requested_services'
        ])
    ) as founder_count
  from information_schema.columns
  where table_schema = 'public'
)
select
  exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '0023'
  ) as version_0023_recorded,
  editorial_count = 16 as editorial_columns_complete,
  editorial_count,
  founder_count = 10 as founder_columns_complete,
  founder_count,
  exists (
    select 1 from storage.buckets where id = 'editorial-media'
  ) as editorial_bucket_present
from required_columns;
```

If `0023` is recorded but neither effect is present, or if objects are only
partially present, stop. That is an unknown fourth state and requires a reviewed
forward-fix; do not force it into one of the accepted states.

## Required database verification

### Scenario A: fresh database

1. Verify Docker, the pinned Supabase CLI, and PostgreSQL client versions.
2. Run the repository preflight.
3. Start the local Supabase stack.
4. Run a local database reset from zero.
5. Apply the synthetic fixture.
6. Capture `scripts/release/db-checksum.sql` output in the ignored artifacts
   directory.
7. Confirm the migration history contains one row per version and no duplicate.

### Scenario B: legacy editorial snapshot

1. Restore a pre-repair synthetic snapshot where the editorial candidate owns
   version `0023` into a disposable target.
2. Record the read-only classification and pre-upgrade checksum.
3. Apply pending migrations normally.
4. Confirm founder-flow columns and indexes exist.
5. Capture the post-upgrade checksum and smoke-test editorial and submissions.

### Scenario C: legacy founder-flow snapshot

1. Restore a pre-repair synthetic snapshot where the founder-flow candidate
   owns version `0023` into a different disposable target.
2. Record the read-only classification and pre-upgrade checksum.
3. Apply pending migrations normally.
4. Confirm the editorial table, RLS policies, trigger, indexes, and
   `editorial-media` bucket exist.
5. Capture the post-upgrade checksum and smoke-test editorial and submissions.

### Schema convergence

After all three scenarios, compare schema signatures from
`scripts/release/db-checksum.sql`. The signatures for tables, columns,
constraints, indexes, policies, functions, triggers, RLS, and storage metadata
must match. Fixture row signatures must also match after the same deterministic
seed is applied.

## Forbidden shortcuts

- Do not run `supabase migration repair --status applied 0023` merely to make a
  list green.
- Do not mark `0023` reverted on an existing database.
- Do not edit either immutable legacy SQL body in place; add a forward migration.
- Do not apply the retired founder-flow filename from an old checkout.
- Do not run a reset, push, restore, or seed against production.
- Do not proceed when backup evidence, target identity, or the legacy state is
  unknown.

## Rollback and failure handling

The schema repair is additive. A code rollback does not roll back these
migrations. If the reconciliation fails, preserve the target and logs, stop
writes, restore the disposable target from the B05 snapshot, and create a
reviewed forward-fix. Production rollback remains provider-managed recovery or
a compensating forward migration approved by the release owner.

## Completion evidence

B06 can be closed only when the release evidence records:

- static preflight output and manifest SHA;
- tool versions;
- backup/snapshot identifiers with no secrets;
- classification of both legacy snapshots;
- fresh, editorial-upgrade, and founder-upgrade results;
- matching post-upgrade schema signatures;
- smoke results for editorial and founder submissions;
- operator, reviewer, timestamp, and target deletion evidence.
