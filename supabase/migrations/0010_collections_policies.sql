alter table public.collections enable row level security;
alter table public.collection_tool_slots enable row level security;

drop policy if exists "Public can read published collections" on public.collections;
create policy "Public can read published collections"
on public.collections
for select
to anon, authenticated
using (editorial_state in ('published', 'featured'));

drop policy if exists "Public can read published collection slots" on public.collection_tool_slots;
create policy "Public can read published collection slots"
on public.collection_tool_slots
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = collection_tool_slots.collection_id
      and collections.editorial_state in ('published', 'featured')
  )
);
