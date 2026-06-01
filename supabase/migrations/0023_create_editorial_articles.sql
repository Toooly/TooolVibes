create table if not exists public.editorial_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) >= 3),
  dek text not null check (char_length(trim(dek)) >= 20),
  summary text not null check (char_length(trim(summary)) >= 30),
  kind text not null default 'editorial' check (kind in ('editorial', 'guide', 'tool-writeup')),
  status text not null default 'draft' check (status in ('draft', 'published')),
  content_markdown text not null default '' check (char_length(trim(content_markdown)) >= 1),
  cover_image_url text check (cover_image_url is null or cover_image_url ~ '^https?://'),
  cover_image_alt text not null default '',
  author_name text not null default 'TooolVibes' check (char_length(trim(author_name)) >= 2),
  tags text[] not null default '{}' check (coalesce(array_length(tags, 1), 0) <= 16),
  published_at date not null default current_date,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists editorial_articles_status_idx on public.editorial_articles (status, published_at desc);
create index if not exists editorial_articles_featured_idx on public.editorial_articles (is_featured) where is_featured = true;
create index if not exists editorial_articles_tags_gin_idx on public.editorial_articles using gin (tags);

drop trigger if exists editorial_articles_set_updated_at on public.editorial_articles;

create trigger editorial_articles_set_updated_at
before update on public.editorial_articles
for each row
execute function public.set_updated_at();

alter table public.editorial_articles enable row level security;

drop policy if exists "Public can read published editorial articles" on public.editorial_articles;
create policy "Public can read published editorial articles"
on public.editorial_articles
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Service role can manage editorial articles" on public.editorial_articles;
create policy "Service role can manage editorial articles"
on public.editorial_articles
for all
to service_role
using (true)
with check (true);

grant select on table public.editorial_articles to anon, authenticated;
grant all privileges on table public.editorial_articles to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'editorial-media',
  'editorial-media',
  true,
  52428800,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read editorial media" on storage.objects;
create policy "Public can read editorial media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'editorial-media');

drop policy if exists "Service role can manage editorial media" on storage.objects;
create policy "Service role can manage editorial media"
on storage.objects
for all
to service_role
using (bucket_id = 'editorial-media')
with check (bucket_id = 'editorial-media');

comment on table public.editorial_articles is 'Blog articles authored from the TooolVibes admin.';
comment on column public.editorial_articles.content_markdown is 'Full Markdown/HTML article body rendered on public posts.';
