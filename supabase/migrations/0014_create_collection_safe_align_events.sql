create table if not exists public.collection_safe_align_events (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  collection_id uuid not null references public.collections(id) on delete cascade,
  source_from text not null check (source_from in ('mock')),
  source_to text not null check (source_to in ('supabase')),
  aligned_fields text[] not null check (coalesce(array_length(aligned_fields, 1), 0) > 0),
  applied_at timestamptz not null default timezone('utc', now())
);

create index if not exists collection_safe_align_events_slug_idx
  on public.collection_safe_align_events (slug, applied_at desc);

alter table public.collection_safe_align_events enable row level security;

comment on table public.collection_safe_align_events is
'Minimal audit trail for selective safe align actions applied from legacy mock to Supabase collections.';
