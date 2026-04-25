alter table public.tools enable row level security;

drop policy if exists "Public can read published tools" on public.tools;
create policy "Public can read published tools"
on public.tools
for select
to anon, authenticated
using (is_published = true);

drop policy if exists "Service role can manage tools" on public.tools;
create policy "Service role can manage tools"
on public.tools
for all
to service_role
using (true)
with check (true);
