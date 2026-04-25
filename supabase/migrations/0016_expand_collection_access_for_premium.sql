alter table public.collections
  drop constraint if exists collections_access_check;

alter table public.collections
  add constraint collections_access_check
  check (access in ('open', 'premium-preview', 'premium'));
