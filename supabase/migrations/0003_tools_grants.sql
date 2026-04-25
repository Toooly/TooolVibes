grant usage on schema public to anon, authenticated, service_role;

grant select on table public.tools to anon, authenticated;
grant all privileges on table public.tools to service_role;

