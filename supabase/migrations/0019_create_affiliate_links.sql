create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools(id) on delete cascade,
  label text not null check (char_length(trim(label)) >= 2),
  destination_url text not null check (destination_url ~ '^https?://'),
  tracking_url text,
  campaign text,
  source text,
  medium text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists affiliate_links_tool_id_idx on public.affiliate_links (tool_id);
create index if not exists affiliate_links_active_idx on public.affiliate_links (is_active) where is_active = true;

drop trigger if exists affiliate_links_set_updated_at on public.affiliate_links;

create trigger affiliate_links_set_updated_at
before update on public.affiliate_links
for each row
execute function public.set_updated_at();

alter table public.affiliate_links enable row level security;

drop policy if exists "Service role can manage affiliate links" on public.affiliate_links;
create policy "Service role can manage affiliate links"
  on public.affiliate_links
  for all
  to service_role
  using (true)
  with check (true);

drop policy if exists "Anyone can read active affiliate links" on public.affiliate_links;
create policy "Anyone can read active affiliate links"
  on public.affiliate_links
  for select
  to anon, authenticated
  using (is_active = true);

grant select on table public.affiliate_links to anon, authenticated;
grant all on table public.affiliate_links to service_role;

comment on table public.affiliate_links is 'Affiliate link management for tools.';
