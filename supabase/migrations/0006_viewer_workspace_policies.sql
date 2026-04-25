alter table public.viewer_profiles enable row level security;
alter table public.viewer_workspaces enable row level security;
alter table public.viewer_tool_states enable row level security;

drop policy if exists "Service role can manage viewer profiles" on public.viewer_profiles;
create policy "Service role can manage viewer profiles"
on public.viewer_profiles
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage viewer workspaces" on public.viewer_workspaces;
create policy "Service role can manage viewer workspaces"
on public.viewer_workspaces
for all
to service_role
using (true)
with check (true);

drop policy if exists "Service role can manage viewer tool states" on public.viewer_tool_states;
create policy "Service role can manage viewer tool states"
on public.viewer_tool_states
for all
to service_role
using (true)
with check (true);
