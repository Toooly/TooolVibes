-- Phase 7B production-shape fixture (minimal Supabase roles for portability)
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin bypassrls;
  end if;
end $$;

create extension if not exists vector;

-- Stub Supabase auth schema (for fixture portability; production has real auth)
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  created_at timestamptz default now()
);

-- Stub Supabase auth helpers (production has real implementations)
create or replace function auth.uid() returns uuid
  language sql stable as $$ select null::uuid $$;
create or replace function auth.role() returns text
  language sql stable as $$ select 'anon'::text $$;




-- Phase 7B production-shape fixture
-- Authoritative schema reproducing the verified production surface exactly:
--   11 public tables, 3 public functions, no Signal, no legacy gamification,
--   no editorial_articles, no affiliate_links, no affiliate_requests.
-- Waitlist preserves its pre-harden state (anon INSERT allowed, no FORCE RLS).


-- set_updated_at (verified, from migration 0001)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- tools (0001 + 0018 + 0021)
create table public.tools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  category text not null check (char_length(trim(category)) >= 2),
  tags text[] not null default '{}' check (coalesce(array_length(tags, 1), 0) <= 12),
  short_description_it text not null check (char_length(trim(short_description_it)) >= 20),
  description_it text not null check (char_length(trim(description_it)) >= 50),
  website_url text not null check (website_url ~ '^https?://'),
  tooolvibes_post_url text not null check (tooolvibes_post_url ~ '^https?://'),
  cover_image_url text not null check (cover_image_url ~ '^https?://'),
  source text not null check (char_length(trim(source)) >= 2),
  date_discovered date not null,
  is_featured boolean not null default false,
  is_published boolean not null default false,
  affiliate_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index tools_published_idx on public.tools (is_published, date_discovered desc);
create index tools_featured_idx on public.tools (is_featured) where is_featured = true;
create index tools_category_idx on public.tools (category);
create index tools_tags_gin_idx on public.tools using gin (tags);
create trigger tools_set_updated_at before update on public.tools
  for each row execute function public.set_updated_at();

-- viewer_profiles + viewer_workspaces + viewer_tool_states (0005 + 0008)
create table public.viewer_profiles (
  id uuid primary key default gen_random_uuid(),
  access_token text not null unique,
  kind text not null default 'guest' check (kind in ('guest', 'account')),
  auth_user_id uuid null,
  last_seen_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create unique index viewer_profiles_auth_user_idx
  on public.viewer_profiles (auth_user_id) where auth_user_id is not null;
create index viewer_profiles_kind_idx on public.viewer_profiles (kind);
create trigger viewer_profiles_set_updated_at before update on public.viewer_profiles
  for each row execute function public.set_updated_at();

create table public.viewer_workspaces (
  viewer_id uuid primary key references public.viewer_profiles(id) on delete cascade,
  compare_slugs text[] not null default '{}' check (coalesce(array_length(compare_slugs, 1), 0) <= 3),
  compare_updated_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create trigger viewer_workspaces_set_updated_at before update on public.viewer_workspaces
  for each row execute function public.set_updated_at();

create table public.viewer_tool_states (
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
create index viewer_tool_states_viewer_idx on public.viewer_tool_states (viewer_id, updated_at desc);
create index viewer_tool_states_slug_idx on public.viewer_tool_states (tool_slug);
create trigger viewer_tool_states_set_updated_at before update on public.viewer_tool_states
  for each row execute function public.set_updated_at();

-- collections + collection_tool_slots (0009)
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) >= 2),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null check (char_length(trim(description)) >= 20),
  cover_image_url text not null check (cover_image_url ~ '^https?://'),
  cover_kicker text not null check (char_length(trim(cover_kicker)) >= 2),
  rationale text not null check (char_length(trim(rationale)) >= 50),
  highlights text[] not null default '{}' check (coalesce(array_length(highlights, 1), 0) <= 8),
  premium_teaser text,
  theme text not null check (theme in ('founder-stack', 'design-sprint', 'creator-video', 'research-synthesis', 'indie-launch')),
  audience text not null check (audience in ('Solo founders', 'Designer-builders', 'Creator teams', 'Research-led teams', 'Indie launchers')),
  difficulty text not null check (difficulty in ('starter', 'growing', 'advanced')),
  tone text not null check (tone in ('starter-stack', 'focused-bundle', 'editorial-picks', 'special-issue')),
  access text not null check (access in ('open', 'premium-preview', 'premium')),
  editorial_state text not null check (editorial_state in ('draft', 'scheduled', 'published', 'featured', 'archived')),
  surface text not null default 'collection' check (surface in ('collection', 'special-issue')),
  featured_slot text check (featured_slot in ('home-hero', 'home-secondary', 'archive-strip', 'special-issue')),
  editorial_order integer not null default 999,
  scheduled_for timestamptz,
  first_published_at timestamptz,
  published_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index collections_editorial_state_idx on public.collections (editorial_state, updated_at desc);
create index collections_featured_slot_idx on public.collections (featured_slot) where featured_slot is not null;
create index collections_surface_idx on public.collections (surface, editorial_order);
create trigger collections_set_updated_at before update on public.collections
  for each row execute function public.set_updated_at();

create table public.collection_tool_slots (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections(id) on delete cascade,
  tool_slug text not null references public.tools(slug) on update cascade on delete cascade,
  role text not null check (char_length(trim(role)) >= 2),
  note text,
  featured boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  unique (collection_id, tool_slug)
);
create index collection_tool_slots_collection_idx on public.collection_tool_slots (collection_id, position);

-- collection_transition_reviews (0012)
create table public.collection_transition_reviews (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  review_state text not null check (review_state in ('reviewed', 'dismissed')),
  note text,
  reviewed_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index collection_transition_reviews_updated_idx
  on public.collection_transition_reviews (updated_at desc);
create trigger collection_transition_reviews_set_updated_at before update
  on public.collection_transition_reviews for each row
  execute function public.set_updated_at();

-- collection_safe_align_events (0014)
create table public.collection_safe_align_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  collection_id uuid not null references public.collections(id) on delete cascade,
  source_from text not null check (source_from in ('mock')),
  source_to text not null check (source_to in ('supabase')),
  aligned_fields text[] not null check (coalesce(array_length(aligned_fields, 1), 0) > 0),
  applied_at timestamptz not null default timezone('utc', now())
);
create index collection_safe_align_events_slug_idx
  on public.collection_safe_align_events (slug, applied_at desc);

-- tool_requests (0017 + 0020 + 20260705000000)
create table public.tool_requests (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null,
  tool_url text not null,
  category text not null,
  level text not null check (level in ('featured', 'beginner', 'intermediate', 'expert')),
  email text,
  message text,
  status text not null default 'received' check (status in ('received', 'reviewing', 'approved', 'rejected')),
  admin_notes text,
  updated_at timestamptz not null default timezone('utc', now()),
  submitter_type text not null default 'community' check (submitter_type in ('community', 'founder')),
  use_case text,
  referral_url text,
  media_url text,
  personal_notes text,
  founder_name text,
  company_role text,
  launch_stage text,
  budget_range text,
  requested_services text[] not null default '{}',
  created_at timestamptz not null default now()
);
create index tool_requests_submitter_type_idx on public.tool_requests (submitter_type);
create index tool_requests_requested_services_idx on public.tool_requests using gin (requested_services);
create trigger tool_requests_set_updated_at before update on public.tool_requests
  for each row execute function public.set_updated_at();

-- waitlist (PRE-HARDEN state - production-shape divergence)
-- Repo 20260716000002 sets FORCE RLS + service_role-only policy; production
-- verified state is anon INSERT allowed, no FORCE RLS.
create table public.waitlist (
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

-- kb_chunks (OUT-OF-BAND Dashboard) - stub structure only, no rows needed
create table public.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  source_type text,
  category text,
  chunk_text text,
  embedding halfvec(1536),
  created_at timestamptz not null default timezone('utc', now())
);

-- Stub kb_chunks match function (production has a real implementation)
create or replace function public.match_kb_chunks(
  query_embedding halfvec,
  match_count integer,
  source_type_filter text,
  category_filter text
) returns table (id uuid, chunk_text text, similarity double precision)
language sql stable
as $$
  select id, chunk_text, 0.0::double precision as similarity
  from public.kb_chunks
  where (source_type_filter is null or source_type = source_type_filter)
    and (category_filter is null or category = category_filter)
  limit greatest(match_count, 1);
$$;

-- Stub event-trigger function (production has Supabase default rls_auto_enable)
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
as $$
begin
  -- production behaviour: enable RLS on new tables created by non-superusers
  -- (stub: no-op for fixture purposes)
  return;
end;
$$;

-- ---------- Grants + RLS policies matching verified production state ----------

grant usage on schema public to anon, authenticated, service_role;

-- tools: public SELECT published, service_role ALL
alter table public.tools enable row level security;
drop policy if exists "Public can read published tools" on public.tools;
create policy "Public can read published tools" on public.tools
  for select to anon, authenticated using (is_published = true);
drop policy if exists "Service role can manage tools" on public.tools;
create policy "Service role can manage tools" on public.tools
  for all to service_role using (true) with check (true);
grant select on public.tools to anon, authenticated;
grant all privileges on public.tools to service_role;

-- viewer_profiles / viewer_workspaces / viewer_tool_states: service_role ALL ONLY
-- (verified production does NOT have the 20260621000002 authenticated policies)
alter table public.viewer_profiles enable row level security;
alter table public.viewer_workspaces enable row level security;
alter table public.viewer_tool_states enable row level security;
drop policy if exists "Service role can manage viewer profiles" on public.viewer_profiles;
create policy "Service role can manage viewer profiles" on public.viewer_profiles
  for all to service_role using (true) with check (true);
drop policy if exists "Service role can manage viewer workspaces" on public.viewer_workspaces;
create policy "Service role can manage viewer workspaces" on public.viewer_workspaces
  for all to service_role using (true) with check (true);
drop policy if exists "Service role can manage viewer tool states" on public.viewer_tool_states;
create policy "Service role can manage viewer tool states" on public.viewer_tool_states
  for all to service_role using (true) with check (true);
grant all privileges on public.viewer_profiles to service_role;
grant all privileges on public.viewer_workspaces to service_role;
grant all privileges on public.viewer_tool_states to service_role;

-- collections + collection_tool_slots: public SELECT published/featured, service_role ALL
alter table public.collections enable row level security;
alter table public.collection_tool_slots enable row level security;
drop policy if exists "Public can read published collections" on public.collections;
create policy "Public can read published collections" on public.collections
  for select to anon, authenticated using (editorial_state in ('published', 'featured'));
drop policy if exists "Public can read published collection slots" on public.collection_tool_slots;
create policy "Public can read published collection slots" on public.collection_tool_slots
  for select to anon, authenticated using (
    exists (
      select 1 from public.collections
      where collections.id = collection_tool_slots.collection_id
        and collections.editorial_state in ('published', 'featured')
    )
  );
grant select on public.collections to anon, authenticated;
grant select on public.collection_tool_slots to anon, authenticated;
grant all privileges on public.collections to service_role;
grant all privileges on public.collection_tool_slots to service_role;

-- collection_transition_reviews: service_role ALL
alter table public.collection_transition_reviews enable row level security;
grant all privileges on public.collection_transition_reviews to service_role;

-- collection_safe_align_events: service_role ALL (no public policies)
alter table public.collection_safe_align_events enable row level security;
grant all privileges on public.collection_safe_align_events to service_role;

-- tool_requests: anon/authenticated INSERT with check true (PRE-HARDEN)
alter table public.tool_requests enable row level security;
drop policy if exists "Anyone can submit tool requests" on public.tool_requests;
create policy "Anyone can submit tool requests" on public.tool_requests
  for insert to anon, authenticated with check (true);
grant insert on public.tool_requests to anon, authenticated;
grant select, update, delete on public.tool_requests to service_role;

-- waitlist: anon INSERT with check true (PRE-HARDEN, NO FORCE RLS)
alter table public.waitlist enable row level security;
drop policy if exists "Anyone can join waitlist" on public.waitlist;
create policy "Anyone can join waitlist" on public.waitlist
  for insert to anon, authenticated with check (true);
grant insert on public.waitlist to anon, authenticated;
grant select, update, delete on public.waitlist to service_role;

-- kb_chunks: no policies verified (production has RLS enabled, 0 policies)
-- Means anon/authenticated have no access path.
alter table public.kb_chunks enable row level security;

-- Stub helpers matching production: list of public functions
-- set_updated_at, match_kb_chunks, rls_auto_enable - all created above.

notify pgrst, 'reload schema';
