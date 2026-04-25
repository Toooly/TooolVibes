create table if not exists public.viewer_profiles (
  id uuid primary key default gen_random_uuid(),
  access_token text not null unique,
  kind text not null default 'guest' check (kind in ('guest', 'account')),
  auth_user_id uuid null,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.viewer_workspaces (
  viewer_id uuid primary key references public.viewer_profiles(id) on delete cascade,
  compare_slugs text[] not null default '{}' check (coalesce(array_length(compare_slugs, 1), 0) <= 3),
  compare_updated_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.viewer_tool_states (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null references public.viewer_profiles(id) on delete cascade,
  tool_slug text not null references public.tools(slug) on update cascade on delete cascade,
  is_saved boolean not null default true,
  shortlist_stage text not null default 'saved' check (shortlist_stage in ('saved', 'review', 'top')),
  note text null check (note is null or char_length(trim(note)) <= 400),
  save_reason text null check (save_reason in ('test', 'compare', 'design-fit', 'marketing-fit', 'client-project', 'observe')),
  is_pinned boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (viewer_id, tool_slug)
);

create index if not exists viewer_profiles_kind_idx on public.viewer_profiles (kind);
create index if not exists viewer_tool_states_viewer_idx on public.viewer_tool_states (viewer_id, updated_at desc);
create index if not exists viewer_tool_states_slug_idx on public.viewer_tool_states (tool_slug);

drop trigger if exists viewer_profiles_set_updated_at on public.viewer_profiles;
create trigger viewer_profiles_set_updated_at
before update on public.viewer_profiles
for each row
execute function public.set_updated_at();

drop trigger if exists viewer_workspaces_set_updated_at on public.viewer_workspaces;
create trigger viewer_workspaces_set_updated_at
before update on public.viewer_workspaces
for each row
execute function public.set_updated_at();

drop trigger if exists viewer_tool_states_set_updated_at on public.viewer_tool_states;
create trigger viewer_tool_states_set_updated_at
before update on public.viewer_tool_states
for each row
execute function public.set_updated_at();

comment on table public.viewer_profiles is 'Guest-safe or account-ready viewer identities used for workspace persistence.';
comment on table public.viewer_workspaces is 'Per-viewer workspace state that is not tied to a single tool row, such as compare selections.';
comment on table public.viewer_tool_states is 'Per-viewer persisted shortlist and decision memory state keyed by tool slug.';
