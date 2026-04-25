grant usage on schema public to anon, authenticated, service_role;

grant select on public.collections to anon, authenticated;
grant select on public.collection_tool_slots to anon, authenticated;

grant all privileges on public.collections to service_role;
grant all privileges on public.collection_tool_slots to service_role;
