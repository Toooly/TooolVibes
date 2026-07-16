alter table public.tool_requests
  add column if not exists submitter_type text not null default 'community'
    check (submitter_type in ('community', 'founder')),
  add column if not exists use_case text,
  add column if not exists referral_url text,
  add column if not exists media_url text,
  add column if not exists personal_notes text,
  add column if not exists founder_name text,
  add column if not exists company_role text,
  add column if not exists launch_stage text,
  add column if not exists budget_range text,
  add column if not exists requested_services text[] not null default '{}';

create index if not exists tool_requests_submitter_type_idx
  on public.tool_requests (submitter_type);

create index if not exists tool_requests_requested_services_idx
  on public.tool_requests using gin (requested_services);
