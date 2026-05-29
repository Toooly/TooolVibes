create table if not exists public.affiliate_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(trim(first_name)) >= 2),
  last_name text not null check (char_length(trim(last_name)) >= 2),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'),
  brand_name text,
  website_url text check (website_url is null or website_url ~ '^https?://'),
  audience text,
  channels text,
  message text,
  status text not null default 'received' check (status in ('received', 'reviewing', 'approved', 'rejected')),
  admin_notes text,
  referral_code text unique,
  referral_url text,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists affiliate_requests_status_idx on public.affiliate_requests (status, created_at desc);
create index if not exists affiliate_requests_email_idx on public.affiliate_requests (lower(email));
create unique index if not exists affiliate_requests_referral_code_idx
  on public.affiliate_requests (lower(referral_code))
  where referral_code is not null;

drop trigger if exists affiliate_requests_set_updated_at on public.affiliate_requests;

create trigger affiliate_requests_set_updated_at
before update on public.affiliate_requests
for each row
execute function public.set_updated_at();

alter table public.affiliate_requests enable row level security;

drop policy if exists "Anyone can submit affiliate requests" on public.affiliate_requests;
create policy "Anyone can submit affiliate requests"
  on public.affiliate_requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Service role can manage affiliate requests" on public.affiliate_requests;
create policy "Service role can manage affiliate requests"
  on public.affiliate_requests
  for all
  to service_role
  using (true)
  with check (true);

grant insert on table public.affiliate_requests to anon, authenticated;
grant select, update, delete on table public.affiliate_requests to service_role;

comment on table public.affiliate_requests is 'Affiliate program applications submitted from the public site.';
