create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.tools (
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
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists tools_published_idx on public.tools (is_published, date_discovered desc);
create index if not exists tools_featured_idx on public.tools (is_featured) where is_featured = true;
create index if not exists tools_category_idx on public.tools (category);
create index if not exists tools_tags_gin_idx on public.tools using gin (tags);

drop trigger if exists tools_set_updated_at on public.tools;

create trigger tools_set_updated_at
before update on public.tools
for each row
execute function public.set_updated_at();

comment on table public.tools is 'Editorial directory entries for TooolVibes.';
comment on column public.tools.tags is 'Simple editorial tags stored as text array.';
comment on column public.tools.short_description_it is 'Short Italian summary used in cards and previews.';
comment on column public.tools.description_it is 'Long Italian editorial description used on detail pages.';
