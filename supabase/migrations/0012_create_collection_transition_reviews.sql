create table if not exists public.collection_transition_reviews (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  review_state text not null check (review_state in ('reviewed', 'dismissed')),
  note text,
  reviewed_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists collection_transition_reviews_updated_idx
  on public.collection_transition_reviews (updated_at desc);

alter table public.collection_transition_reviews enable row level security;

drop trigger if exists collection_transition_reviews_set_updated_at
on public.collection_transition_reviews;

create trigger collection_transition_reviews_set_updated_at
before update on public.collection_transition_reviews
for each row
execute function public.set_updated_at();

comment on table public.collection_transition_reviews is
'Lightweight editorial review state for collection source conflicts and migration checks.';
