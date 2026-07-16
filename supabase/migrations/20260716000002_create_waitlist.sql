-- SEC-103: canonical waitlist schema and write contract.
--
-- The public API is the only supported collection path. The table itself is
-- not writable by anon/authenticated roles; the server calls the
-- service-role-only register_waitlist_entry RPC.
--
-- Retention contract: an entry expires 24 months after collection. Operations
-- must schedule purge_expired_waitlist_entries and may delete earlier when a
-- data subject withdraws consent.

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text not null default 'coming-soon',
  consent_version text not null default 'waitlist-v1',
  consent_at timestamptz not null default timezone('utc', now()),
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  retention_expires_at timestamptz not null
    default (timezone('utc', now()) + interval '24 months')
);

-- Reconcile installations where the pre-launch table was created manually.
alter table public.waitlist
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists email text,
  add column if not exists source text default 'coming-soon',
  add column if not exists consent_version text default 'waitlist-v1',
  add column if not exists consent_at timestamptz default timezone('utc', now()),
  add column if not exists status text default 'pending',
  add column if not exists created_at timestamptz default timezone('utc', now()),
  add column if not exists retention_expires_at timestamptz;

update public.waitlist
set
  id = coalesce(id, gen_random_uuid()),
  email = lower(btrim(email)),
  source = coalesce(nullif(lower(btrim(source)), ''), 'coming-soon'),
  consent_version = coalesce(nullif(btrim(consent_version), ''), 'waitlist-v1'),
  consent_at = coalesce(consent_at, created_at, timezone('utc', now())),
  status = coalesce(nullif(lower(btrim(status)), ''), 'pending'),
  created_at = coalesce(created_at, consent_at, timezone('utc', now())),
  retention_expires_at = coalesce(
    retention_expires_at,
    coalesce(created_at, consent_at, timezone('utc', now())) + interval '24 months'
  );

do $$
begin
  if exists (
    select 1
    from public.waitlist
    where email is null
      or char_length(email) > 254
      or email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ) then
    raise exception
      'SEC-103 cannot canonicalize waitlist: invalid legacy email rows require review';
  end if;
end
$$;

-- Case variants represent the same subscriber. Preserve the earliest consent
-- record and remove only later duplicates before enforcing uniqueness.
with ranked_waitlist as (
  select
    ctid,
    row_number() over (
      partition by email
      order by consent_at asc, created_at asc, id::text asc
    ) as duplicate_rank
  from public.waitlist
)
delete from public.waitlist target
using ranked_waitlist ranked
where target.ctid = ranked.ctid
  and ranked.duplicate_rank > 1;

alter table public.waitlist
  alter column id set default gen_random_uuid(),
  alter column id set not null,
  alter column email set not null,
  alter column source set default 'coming-soon',
  alter column source set not null,
  alter column consent_version set default 'waitlist-v1',
  alter column consent_version set not null,
  alter column consent_at set default timezone('utc', now()),
  alter column consent_at set not null,
  alter column status set default 'pending',
  alter column status set not null,
  alter column created_at set default timezone('utc', now()),
  alter column created_at set not null,
  alter column retention_expires_at
    set default (timezone('utc', now()) + interval '24 months'),
  alter column retention_expires_at set not null;

-- A manually-created legacy table may not have the canonical primary key.
-- Add the safe missing case, but stop rather than rewriting an unexpected key.
do $$
declare
  id_attribute_number smallint;
  primary_key_columns smallint[];
begin
  select attribute_row.attnum
  into id_attribute_number
  from pg_attribute attribute_row
  where attribute_row.attrelid = 'public.waitlist'::regclass
    and attribute_row.attname = 'id'
    and not attribute_row.attisdropped;

  select constraint_row.conkey
  into primary_key_columns
  from pg_constraint constraint_row
  where constraint_row.conrelid = 'public.waitlist'::regclass
    and constraint_row.contype = 'p';

  if primary_key_columns is null then
    alter table public.waitlist
      add constraint waitlist_pkey primary key (id);
  elsif primary_key_columns <> array[id_attribute_number]::smallint[] then
    raise exception
      'SEC-103 cannot canonicalize waitlist: legacy primary key requires review';
  end if;
end
$$;


alter table public.waitlist
  drop constraint if exists waitlist_email_canonical_check,
  drop constraint if exists waitlist_source_check,
  drop constraint if exists waitlist_consent_version_check,
  drop constraint if exists waitlist_status_check,
  drop constraint if exists waitlist_retention_check;

alter table public.waitlist
  add constraint waitlist_email_canonical_check check (
    email = lower(btrim(email))
    and char_length(email) <= 254
    and email ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ),
  add constraint waitlist_source_check check (
    char_length(source) between 1 and 64
    and source ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  add constraint waitlist_consent_version_check check (
    char_length(consent_version) between 1 and 64
    and consent_version ~ '^[A-Za-z0-9]+([._-][A-Za-z0-9]+)*$'
  ),
  add constraint waitlist_status_check check (
    status in ('pending', 'notified', 'unsubscribed')
  ),
  add constraint waitlist_retention_check check (
    retention_expires_at >= created_at
    and retention_expires_at <= created_at + interval '24 months'
  );

create unique index if not exists waitlist_email_unique_idx
  on public.waitlist (email);


-- CREATE INDEX IF NOT EXISTS only checks the object name. Verify that a
-- pre-existing object actually provides the canonical one-column uniqueness.
do $$
declare
  email_attribute_number smallint;
begin
  select attribute_row.attnum
  into email_attribute_number
  from pg_attribute attribute_row
  where attribute_row.attrelid = 'public.waitlist'::regclass
    and attribute_row.attname = 'email'
    and not attribute_row.attisdropped;

  if not exists (
    select 1
    from pg_index index_row
    where index_row.indrelid = 'public.waitlist'::regclass
      and index_row.indisvalid
      and index_row.indisunique
      and index_row.indnkeyatts = 1
      and email_attribute_number =
        any(index_row.indkey::smallint[])
  ) then
    raise exception
      'SEC-103 cannot canonicalize waitlist: unique email index requires review';
  end if;
end
$$;

create index if not exists waitlist_retention_expires_at_idx
  on public.waitlist (retention_expires_at);

create or replace function public.normalize_waitlist_entry()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.email := lower(btrim(new.email));
  new.source := lower(btrim(new.source));
  new.consent_version := btrim(new.consent_version);
  new.status := lower(btrim(new.status));
  return new;
end;
$$;

drop trigger if exists waitlist_normalize_entry on public.waitlist;
create trigger waitlist_normalize_entry
before insert or update of email, source, consent_version, status
on public.waitlist
for each row
execute function public.normalize_waitlist_entry();

alter table public.waitlist enable row level security;
alter table public.waitlist force row level security;

-- Remove any policy left by an unversioned pre-launch table, then recreate the
-- least-privilege canonical policy.
do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'waitlist'
  loop
    execute format(
      'drop policy %I on public.waitlist',
      policy_record.policyname
    );
  end loop;
end
$$;

create policy "Service role can manage waitlist"
on public.waitlist
for all
to service_role
using (true)
with check (true);

revoke all privileges on table public.waitlist from public, anon, authenticated;
grant select, insert, update, delete on table public.waitlist to service_role;

create or replace function public.register_waitlist_entry(
  p_email text,
  p_source text default 'coming-soon',
  p_consent_version text default 'waitlist-v1'
)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  normalized_email text := lower(btrim(p_email));
  normalized_source text := lower(btrim(p_source));
  normalized_consent_version text := btrim(p_consent_version);
  affected_rows bigint;
begin
  if normalized_email is null
    or char_length(normalized_email) > 254
    or normalized_email !~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  then
    raise exception 'Invalid waitlist email' using errcode = '22023';
  end if;

  if normalized_source is null
    or char_length(normalized_source) not between 1 and 64
    or normalized_source !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  then
    raise exception 'Invalid waitlist source' using errcode = '22023';
  end if;

  if normalized_consent_version is null
    or char_length(normalized_consent_version) not between 1 and 64
    or normalized_consent_version !~ '^[A-Za-z0-9]+([._-][A-Za-z0-9]+)*$'
  then
    raise exception 'Invalid waitlist consent version' using errcode = '22023';
  end if;

  insert into public.waitlist (
    email,
    source,
    consent_version
  )
  values (
    normalized_email,
    normalized_source,
    normalized_consent_version
  )
  on conflict (email) do nothing;

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

revoke all on function public.register_waitlist_entry(text, text, text)
  from public, anon, authenticated;
grant execute on function public.register_waitlist_entry(text, text, text)
  to service_role;

create or replace function public.purge_expired_waitlist_entries()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  affected_rows bigint;
begin
  delete from public.waitlist
  where retention_expires_at <= timezone('utc', now());

  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

revoke all on function public.purge_expired_waitlist_entries()
  from public, anon, authenticated;
grant execute on function public.purge_expired_waitlist_entries()
  to service_role;

comment on table public.waitlist is
  'Pre-launch notification requests. Delete on withdrawal or after retention_expires_at (maximum 24 months).';
comment on column public.waitlist.email is
  'Lowercase, trimmed canonical email used as the idempotency key.';
comment on column public.waitlist.source is
  'Server-controlled collection surface; clients cannot choose this value.';
comment on column public.waitlist.consent_version is
  'Version of the waitlist disclosure accepted at collection time.';
comment on column public.waitlist.consent_at is
  'UTC timestamp recorded by the database when consent is collected.';
comment on column public.waitlist.retention_expires_at is
  'Hard deletion deadline; defaults to 24 months after collection.';
comment on function public.purge_expired_waitlist_entries() is
  'Deletes waitlist rows after their retention deadline; schedule and monitor this operation.';
