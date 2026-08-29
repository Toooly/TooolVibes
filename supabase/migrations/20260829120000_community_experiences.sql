-- Wave H1: Community Experiences persistence (dark schema).
-- Additive only. No WorkspaceStateV1 changes. No RPCs. No seed rows.
-- Client roles have no table grants. Public/owner reads go through H2/H4 server APIs
-- with safe column projection so author_id never reaches browsers.

create table if not exists public.community_experiences (
  id uuid primary key default gen_random_uuid(),
  tool_slug text not null,
  author_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  use_case text not null,
  body text not null,
  pros text[] not null,
  limits text[] not null,
  duration_bucket text not null,
  switched_from_slug text null,
  switched_from_label text null,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  submitted_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz null,
  moderated_at timestamptz null,
  moderated_by text null,
  moderation_reason text null,
  constraint community_experiences_tool_slug_chk
    check (
      char_length(tool_slug) between 1 and 120
      and tool_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    ),
  constraint community_experiences_display_name_chk
    check (char_length(btrim(display_name)) between 2 and 80),
  constraint community_experiences_use_case_chk
    check (char_length(btrim(use_case)) between 4 and 80),
  constraint community_experiences_body_chk
    check (char_length(btrim(body)) between 80 and 2000),
  constraint community_experiences_pros_card_chk
    check (cardinality(pros) between 1 and 5),
  constraint community_experiences_limits_card_chk
    check (cardinality(limits) between 1 and 5),
  constraint community_experiences_duration_chk
    check (
      duration_bucket in (
        'under_1_month',
        'months_1_3',
        'months_3_6',
        'months_6_12',
        'year_plus'
      )
    ),
  constraint community_experiences_switched_from_xor_chk
    check (
      not (
        switched_from_slug is not null
        and switched_from_label is not null
      )
    ),
  constraint community_experiences_switched_from_self_chk
    check (
      switched_from_slug is null
      or switched_from_slug <> tool_slug
    ),
  constraint community_experiences_switched_from_slug_chk
    check (
      switched_from_slug is null
      or (
        char_length(switched_from_slug) between 1 and 120
        and switched_from_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      )
    ),
  constraint community_experiences_switched_from_label_chk
    check (
      switched_from_label is null
      or char_length(btrim(switched_from_label)) between 2 and 80
    ),
  constraint community_experiences_status_chk
    check (status in ('pending', 'published', 'hidden', 'rejected')),
  constraint community_experiences_moderated_by_chk
    check (
      moderated_by is null
      or char_length(btrim(moderated_by)) between 1 and 120
    ),
  constraint community_experiences_moderation_reason_chk
    check (
      moderation_reason is null
      or char_length(btrim(moderation_reason)) between 4 and 500
    ),
  constraint community_experiences_author_tool_key unique (author_id, tool_slug)
);

create table if not exists public.community_experience_reports (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.community_experiences (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  details text null,
  status text not null default 'open',
  created_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz null,
  resolved_by text null,
  resolution_note text null,
  constraint community_experience_reports_reason_chk
    check (
      reason in (
        'spam',
        'abuse',
        'misleading',
        'personal_data',
        'other'
      )
    ),
  constraint community_experience_reports_details_chk
    check (
      details is null
      or char_length(btrim(details)) between 1 and 500
    ),
  constraint community_experience_reports_status_chk
    check (status in ('open', 'resolved')),
  constraint community_experience_reports_resolved_by_chk
    check (
      resolved_by is null
      or char_length(btrim(resolved_by)) between 1 and 120
    ),
  constraint community_experience_reports_resolution_note_chk
    check (
      resolution_note is null
      or char_length(btrim(resolution_note)) between 1 and 500
    ),
  constraint community_experience_reports_reporter_experience_key
    unique (reporter_id, experience_id)
);

create index if not exists community_experiences_published_tool_idx
  on public.community_experiences (tool_slug, published_at desc, id desc)
  where status = 'published';

create index if not exists community_experiences_author_idx
  on public.community_experiences (author_id, updated_at desc);

create index if not exists community_experiences_pending_idx
  on public.community_experiences (submitted_at asc)
  where status = 'pending';

create index if not exists community_experiences_hidden_rejected_idx
  on public.community_experiences (status, moderated_at)
  where status in ('hidden', 'rejected');

create index if not exists community_experience_reports_open_idx
  on public.community_experience_reports (created_at asc)
  where status = 'open';

create index if not exists community_experience_reports_experience_idx
  on public.community_experience_reports (experience_id);

drop trigger if exists community_experiences_set_updated_at
  on public.community_experiences;
create trigger community_experiences_set_updated_at
before update on public.community_experiences
for each row
execute function public.set_updated_at();

alter table public.community_experiences enable row level security;
alter table public.community_experiences force row level security;
alter table public.community_experience_reports enable row level security;
alter table public.community_experience_reports force row level security;

drop policy if exists "Users can read own community experiences"
  on public.community_experiences;
create policy "Users can read own community experiences"
on public.community_experiences
for select
to authenticated
using (author_id = auth.uid());

drop policy if exists "Service role can manage community experiences"
  on public.community_experiences;
create policy "Service role can manage community experiences"
on public.community_experiences
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage community experience reports"
  on public.community_experience_reports;
create policy "Service role can manage community experience reports"
on public.community_experience_reports
for all
to service_role
using (true)
with check (true);

revoke all privileges on table public.community_experiences
  from public, anon, authenticated;
revoke all privileges on table public.community_experience_reports
  from public, anon, authenticated;

grant select, insert, update, delete on table public.community_experiences
  to service_role;
grant select, insert, update, delete on table public.community_experience_reports
  to service_role;
