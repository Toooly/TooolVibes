create table if not exists public.collections (
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
  access text not null check (access in ('open', 'premium-preview')),
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

create table if not exists public.collection_tool_slots (
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

create index if not exists collections_editorial_state_idx
  on public.collections (editorial_state, updated_at desc);
create index if not exists collections_featured_slot_idx
  on public.collections (featured_slot)
  where featured_slot is not null;
create index if not exists collections_surface_idx
  on public.collections (surface, editorial_order);
create index if not exists collection_tool_slots_collection_idx
  on public.collection_tool_slots (collection_id, position);

drop trigger if exists collections_set_updated_at on public.collections;

create trigger collections_set_updated_at
before update on public.collections
for each row
execute function public.set_updated_at();

comment on table public.collections is 'Curated collections and editorial surfaces for TooolVibes.';
comment on table public.collection_tool_slots is 'Ordered tool slots that belong to a curated collection.';
