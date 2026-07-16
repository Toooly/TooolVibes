-- SEC-105: force public submissions through validated service-role RPCs and
-- bind authenticated gamification mutations to the JWT subject.

alter table public.tool_requests enable row level security;
alter table public.tool_requests force row level security;

drop policy if exists "Anyone can submit tool requests"
  on public.tool_requests;
drop policy if exists "Service role can manage tool requests"
  on public.tool_requests;
create policy "Service role can manage tool requests"
  on public.tool_requests
  for all
  to service_role
  using (true)
  with check (true);

revoke all privileges on table public.tool_requests
  from public, anon, authenticated;
revoke insert on table public.tool_requests from service_role;
grant select, update, delete on table public.tool_requests to service_role;

create or replace function public.submit_tool_request(
  p_submitter_type text,
  p_tool_name text,
  p_tool_url text,
  p_category text,
  p_level text,
  p_email text,
  p_message text,
  p_use_case text,
  p_referral_url text,
  p_media_url text,
  p_personal_notes text,
  p_founder_name text,
  p_company_role text,
  p_launch_stage text,
  p_budget_range text,
  p_requested_services text[]
)
returns public.tool_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_request public.tool_requests;
  normalized_email text := lower(nullif(btrim(p_email), ''));
  normalized_services text[] := coalesce(p_requested_services, '{}'::text[]);
begin
  if p_submitter_type is null or p_submitter_type not in ('community', 'founder') then
    raise exception 'Invalid submitter type';
  end if;
  if p_tool_name is null or char_length(btrim(p_tool_name)) not between 2 and 120 then
    raise exception 'Invalid tool name';
  end if;
  if p_tool_url is null
    or char_length(btrim(p_tool_url)) > 2048
    or btrim(p_tool_url) !~* '^https?://'
  then
    raise exception 'Invalid tool URL';
  end if;
  if p_category is null or char_length(btrim(p_category)) not between 2 and 80 then
    raise exception 'Invalid category';
  end if;
  if p_level is null or p_level not in ('featured', 'beginner', 'intermediate', 'expert') then
    raise exception 'Invalid level';
  end if;
  if normalized_email is not null and (
    char_length(normalized_email) > 254
    or normalized_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  ) then
    raise exception 'Invalid email';
  end if;
  if char_length(coalesce(p_message, '')) > 2000
    or char_length(coalesce(p_use_case, '')) > 2000
    or char_length(coalesce(p_personal_notes, '')) > 2000
    or char_length(coalesce(p_founder_name, '')) > 120
    or char_length(coalesce(p_company_role, '')) > 120
    or char_length(coalesce(p_launch_stage, '')) > 80
    or char_length(coalesce(p_budget_range, '')) > 80
  then
    raise exception 'Submission field too long';
  end if;
  if (
    p_referral_url is not null
    and (
      char_length(btrim(p_referral_url)) > 2048
      or btrim(p_referral_url) !~* '^https?://'
    )
  ) or (
    p_media_url is not null
    and (
      char_length(btrim(p_media_url)) > 2048
      or btrim(p_media_url) !~* '^https?://'
    )
  ) then
    raise exception 'Invalid optional URL';
  end if;
  if cardinality(normalized_services) > 12
    or exists (
      select 1
      from unnest(normalized_services) as service(value)
      where char_length(btrim(service.value)) not between 2 and 80
    )
    or (
      select count(*) <> count(distinct btrim(service.value))
      from unnest(normalized_services) as service(value)
    )
  then
    raise exception 'Invalid requested services';
  end if;

  insert into public.tool_requests (
    submitter_type,
    tool_name,
    tool_url,
    category,
    level,
    email,
    message,
    use_case,
    referral_url,
    media_url,
    personal_notes,
    founder_name,
    company_role,
    launch_stage,
    budget_range,
    requested_services
  )
  values (
    p_submitter_type,
    btrim(p_tool_name),
    btrim(p_tool_url),
    btrim(p_category),
    p_level,
    normalized_email,
    nullif(btrim(p_message), ''),
    nullif(btrim(p_use_case), ''),
    nullif(btrim(p_referral_url), ''),
    nullif(btrim(p_media_url), ''),
    nullif(btrim(p_personal_notes), ''),
    nullif(btrim(p_founder_name), ''),
    nullif(btrim(p_company_role), ''),
    nullif(btrim(p_launch_stage), ''),
    nullif(btrim(p_budget_range), ''),
    normalized_services
  )
  returning * into inserted_request;

  return inserted_request;
end;
$$;

revoke all on function public.submit_tool_request(
  text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, text, text[]
) from public, anon, authenticated;
grant execute on function public.submit_tool_request(
  text, text, text, text, text, text, text, text,
  text, text, text, text, text, text, text, text[]
) to service_role;

alter table public.affiliate_requests enable row level security;
alter table public.affiliate_requests force row level security;

drop policy if exists "Anyone can submit affiliate requests"
  on public.affiliate_requests;
drop policy if exists "Service role can manage affiliate requests"
  on public.affiliate_requests;
create policy "Service role can manage affiliate requests"
  on public.affiliate_requests
  for all
  to service_role
  using (true)
  with check (true);

revoke all privileges on table public.affiliate_requests
  from public, anon, authenticated;
revoke insert on table public.affiliate_requests from service_role;
grant select, update, delete on table public.affiliate_requests to service_role;

create or replace function public.submit_affiliate_request(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_brand_name text,
  p_website_url text,
  p_audience text,
  p_channels text,
  p_message text
)
returns public.affiliate_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  inserted_request public.affiliate_requests;
  normalized_email text := lower(btrim(p_email));
begin
  if p_first_name is null
    or p_last_name is null
    or char_length(btrim(p_first_name)) not between 2 and 80
    or char_length(btrim(p_last_name)) not between 2 and 80
  then
    raise exception 'Invalid applicant name';
  end if;
  if normalized_email is null
    or char_length(normalized_email) > 254
    or normalized_email !~* '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  then
    raise exception 'Invalid email';
  end if;
  if char_length(coalesce(p_brand_name, '')) > 120
    or char_length(coalesce(p_audience, '')) > 2000
    or char_length(coalesce(p_channels, '')) > 1000
    or p_message is null
    or char_length(btrim(p_message)) not between 12 and 4000
  then
    raise exception 'Invalid affiliate submission field';
  end if;
  if p_website_url is not null and (
    char_length(btrim(p_website_url)) > 2048
    or btrim(p_website_url) !~* '^https?://'
  ) then
    raise exception 'Invalid website URL';
  end if;

  insert into public.affiliate_requests (
    first_name,
    last_name,
    email,
    brand_name,
    website_url,
    audience,
    channels,
    message
  )
  values (
    btrim(p_first_name),
    btrim(p_last_name),
    normalized_email,
    nullif(btrim(p_brand_name), ''),
    nullif(btrim(p_website_url), ''),
    nullif(btrim(p_audience), ''),
    nullif(btrim(p_channels), ''),
    btrim(p_message)
  )
  returning * into inserted_request;

  return inserted_request;
end;
$$;

revoke all on function public.submit_affiliate_request(
  text, text, text, text, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.submit_affiliate_request(
  text, text, text, text, text, text, text, text
) to service_role;

-- A profile can now only be created with server-controlled defaults. Direct
-- authenticated writes would otherwise permit arbitrary XP/level mutation.
drop policy if exists "Users can update own profile" on public.game_profiles;
drop policy if exists "Service role can insert profile" on public.game_profiles;
revoke insert, update, delete on table public.game_profiles
  from public, anon, authenticated;
grant select on table public.game_profiles to authenticated;

create or replace function public.get_or_create_game_profile()
returns public.game_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := auth.uid();
  profile public.game_profiles;
begin
  if authenticated_user_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.game_profiles (user_id)
  values (authenticated_user_id)
  on conflict (user_id) do nothing;

  select *
  into profile
  from public.game_profiles
  where user_id = authenticated_user_id;

  return profile;
end;
$$;

revoke all on function public.get_or_create_game_profile()
  from public, anon, service_role;
grant execute on function public.get_or_create_game_profile()
  to authenticated;

create or replace function public.claim_mission(
  p_mission_id uuid,
  p_user_id uuid
)
returns public.game_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := auth.uid();
  mission public.game_missions;
  profile public.game_profiles;
begin
  if authenticated_user_id is null then
    raise exception 'Unauthorized';
  end if;
  if p_user_id is distinct from authenticated_user_id then
    raise exception 'Forbidden user id';
  end if;

  select *
  into mission
  from public.game_missions
  where id = p_mission_id
    and user_id = authenticated_user_id
  for update;

  if not found then
    raise exception 'Mission not found';
  end if;
  if mission.status != 'completed' then
    raise exception 'Mission not completed';
  end if;

  insert into public.game_mission_claims (
    user_id,
    mission_id,
    xp_awarded
  )
  values (
    authenticated_user_id,
    p_mission_id,
    mission.xp_reward
  );

  update public.game_missions
  set status = 'claimed'
  where id = p_mission_id
    and user_id = authenticated_user_id;

  select *
  into profile
  from public.record_game_interaction(
    authenticated_user_id,
    mission.xp_reward
  );

  return profile;
end;
$$;

revoke all on function public.claim_mission(uuid, uuid)
  from public, anon, service_role;
grant execute on function public.claim_mission(uuid, uuid)
  to authenticated;

create or replace function public.claim_hidden_signal(
  p_user_id uuid,
  p_context_date date,
  p_tool_slug text,
  p_expected_slug text
)
returns public.game_profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := auth.uid();
  profile public.game_profiles;
begin
  if authenticated_user_id is null then
    raise exception 'Unauthorized';
  end if;
  if p_user_id is distinct from authenticated_user_id then
    raise exception 'Forbidden user id';
  end if;
  if p_tool_slug is distinct from p_expected_slug then
    raise exception 'Invalid hidden signal';
  end if;

  if exists (
    select 1
    from public.hidden_signal_claims
    where user_id = authenticated_user_id
      and context_date = p_context_date
  ) then
    raise exception 'Hidden signal already claimed for %', p_context_date;
  end if;

  insert into public.hidden_signal_claims (
    user_id,
    context_date,
    tool_slug
  )
  values (
    authenticated_user_id,
    p_context_date,
    p_tool_slug
  );

  select *
  into profile
  from public.record_game_interaction(authenticated_user_id, 25);

  return profile;
end;
$$;

revoke all on function public.claim_hidden_signal(uuid, date, text, text)
  from public, anon, service_role;
grant execute on function public.claim_hidden_signal(uuid, date, text, text)
  to authenticated;

-- The generic reward RPCs stay service-only. Re-stating the grants here makes
-- the final privilege state independent from older Supabase default grants.
revoke all on function public.record_game_interaction(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.record_game_interaction(uuid, integer)
  to service_role;

revoke all on function public.award_badges(uuid, uuid[])
  from public, anon, authenticated;
grant execute on function public.award_badges(uuid, uuid[])
  to service_role;
