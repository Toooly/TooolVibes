create table if not exists public.tool_requests (
  id uuid primary key default gen_random_uuid(),
  tool_name text not null,
  tool_url text not null,
  category text not null,
  level text not null check (level in ('featured', 'beginner', 'intermediate', 'expert')),
  email text,
  message text,
  status text not null default 'received' check (status in ('received', 'reviewing', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

alter table public.tool_requests enable row level security;

drop policy if exists "Anyone can submit tool requests" on public.tool_requests;
create policy "Anyone can submit tool requests"
  on public.tool_requests
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Authenticated users can read their own submitted email requests" on public.tool_requests;

grant insert on table public.tool_requests to anon, authenticated;
grant select, update, delete on table public.tool_requests to service_role;
