alter table public.tool_requests
  add column if not exists admin_notes text,
  add column if not exists updated_at timestamptz;

update public.tool_requests set updated_at = created_at where updated_at is null;

alter table public.tool_requests
  alter column updated_at set default timezone('utc', now());

drop trigger if exists tool_requests_set_updated_at on public.tool_requests;

create trigger tool_requests_set_updated_at
before update on public.tool_requests
for each row
execute function public.set_updated_at();
