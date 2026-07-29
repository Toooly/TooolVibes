-- Signal Progression Backbone V1 (Phase 4)
-- Trust boundary: browser reports actions; server/DB decide all rewards.
-- Additive only. Flags OFF stop application writes (API layer).
-- Rollback: disable TOOOLVIBES_REWARD_BACKBONE_ENABLED / SIGNAL_EVENT_WRITES /
-- REWARD_DELIVERY flags. Do not drop tables in rollback.
-- Internal column game_profiles.xp maps to public "Signal Points" (SP).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.signal_engagement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  dedupe_key text not null,
  context jsonb not null default '{}'::jsonb,
  client_idempotency_key text,
  rules_version text not null,
  source text not null default 'api',
  occurred_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  constraint signal_engagement_events_type_check
    check (char_length(event_type) between 3 and 64),
  constraint signal_engagement_events_dedupe_check
    check (char_length(dedupe_key) between 3 and 256),
  constraint signal_engagement_events_source_check
    check (source in ('api', 'system', 'test')),
  constraint signal_engagement_events_context_object
    check (jsonb_typeof(context) = 'object'),
  constraint signal_engagement_events_user_dedupe_unique
    unique (user_id, dedupe_key)
);

create index if not exists signal_engagement_events_user_accepted_idx
  on public.signal_engagement_events (user_id, accepted_at desc);

create index if not exists signal_engagement_events_user_type_day_idx
  on public.signal_engagement_events (
    user_id,
    event_type,
    ((accepted_at at time zone 'utc')::date)
  );

create table if not exists public.signal_reward_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  engagement_event_id uuid not null references public.signal_engagement_events(id) on delete cascade,
  reason_code text not null,
  sp_delta integer not null,
  resulting_balance integer not null,
  reward_tier text not null,
  title text not null,
  description text not null,
  accessibility_announcement text not null,
  priority integer not null default 0,
  rules_version text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint signal_reward_grants_sp_delta_check
    check (sp_delta >= 0 and sp_delta <= 10000),
  constraint signal_reward_grants_balance_check
    check (resulting_balance >= 0),
  constraint signal_reward_grants_tier_check
    check (reward_tier in ('interaction', 'micro', 'achievement', 'milestone')),
  constraint signal_reward_grants_event_unique
    unique (engagement_event_id)
);

create index if not exists signal_reward_grants_user_created_idx
  on public.signal_reward_grants (user_id, created_at desc);

create table if not exists public.signal_reward_deliveries (
  grant_id uuid primary key references public.signal_reward_grants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  delivered_at timestamptz,
  acknowledged_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint signal_reward_deliveries_status_check
    check (status in ('pending', 'delivered', 'acknowledged', 'dismissed'))
);

create index if not exists signal_reward_deliveries_user_pending_idx
  on public.signal_reward_deliveries (user_id, status, created_at)
  where status = 'pending';

create table if not exists public.signal_reward_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reduce_reward_animations boolean not null default false,
  mute_reward_sounds boolean not null default false,
  quiet_mode boolean not null default false,
  suppress_automatic_achievements boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.signal_engagement_events enable row level security;
alter table public.signal_engagement_events force row level security;
alter table public.signal_reward_grants enable row level security;
alter table public.signal_reward_grants force row level security;
alter table public.signal_reward_deliveries enable row level security;
alter table public.signal_reward_deliveries force row level security;
alter table public.signal_reward_preferences enable row level security;
alter table public.signal_reward_preferences force row level security;

drop policy if exists "Users read own signal events" on public.signal_engagement_events;
create policy "Users read own signal events"
  on public.signal_engagement_events
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users read own signal grants" on public.signal_reward_grants;
create policy "Users read own signal grants"
  on public.signal_reward_grants
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users read own signal deliveries" on public.signal_reward_deliveries;
create policy "Users read own signal deliveries"
  on public.signal_reward_deliveries
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users read own signal preferences" on public.signal_reward_preferences;
create policy "Users read own signal preferences"
  on public.signal_reward_preferences
  for select
  to authenticated
  using (auth.uid() = user_id);

-- No direct client inserts/updates on ledger tables
revoke all on table public.signal_engagement_events from public, anon, authenticated;
revoke all on table public.signal_reward_grants from public, anon, authenticated;
revoke all on table public.signal_reward_deliveries from public, anon, authenticated;
revoke all on table public.signal_reward_preferences from public, anon, authenticated;

grant select on table public.signal_engagement_events to authenticated;
grant select on table public.signal_reward_grants to authenticated;
grant select on table public.signal_reward_deliveries to authenticated;
grant select on table public.signal_reward_preferences to authenticated;

grant all on table public.signal_engagement_events to service_role;
grant all on table public.signal_reward_grants to service_role;
grant all on table public.signal_reward_deliveries to service_role;
grant all on table public.signal_reward_preferences to service_role;

-- ---------------------------------------------------------------------------
-- Atomic grant RPC (service_role only)
-- ---------------------------------------------------------------------------

create or replace function public.accept_signal_engagement(
  p_user_id uuid,
  p_event_type text,
  p_dedupe_key text,
  p_context jsonb,
  p_sp_delta integer,
  p_reward_tier text,
  p_reason_code text,
  p_title text,
  p_description text,
  p_announcement text,
  p_priority integer,
  p_rules_version text,
  p_client_idempotency_key text default null,
  p_occurred_at timestamptz default null,
  p_daily_sp_cap integer default 120
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_user uuid := auth.uid();
  existing_event public.signal_engagement_events;
  existing_grant public.signal_reward_grants;
  existing_delivery public.signal_reward_deliveries;
  inserted_event public.signal_engagement_events;
  inserted_grant public.signal_reward_grants;
  profile public.game_profiles;
  awarded integer := 0;
  day_total integer := 0;
  remaining integer := 0;
  new_balance integer := 0;
  new_level integer := 1;
  occurred timestamptz := coalesce(p_occurred_at, timezone('utc', now()));
  day_start timestamptz := date_trunc('day', timezone('utc', now()));
begin
  -- Service-role path: auth.uid() is null. Authenticated path must match JWT.
  if jwt_user is not null and jwt_user is distinct from p_user_id then
    raise exception 'Forbidden user id';
  end if;
  if p_user_id is null then
    raise exception 'Unauthorized';
  end if;

  if p_event_type is null or char_length(btrim(p_event_type)) < 3 then
    raise exception 'Invalid event type';
  end if;
  if p_dedupe_key is null or char_length(btrim(p_dedupe_key)) < 3 then
    raise exception 'Invalid dedupe key';
  end if;
  if p_context is null or jsonb_typeof(p_context) <> 'object' then
    raise exception 'Invalid context';
  end if;
  if p_sp_delta is null or p_sp_delta < 0 or p_sp_delta > 10000 then
    raise exception 'Invalid sp delta';
  end if;
  if p_reward_tier is null
    or p_reward_tier not in ('interaction', 'micro', 'achievement', 'milestone')
  then
    raise exception 'Invalid reward tier';
  end if;
  if p_rules_version is null or char_length(btrim(p_rules_version)) < 1 then
    raise exception 'Invalid rules version';
  end if;
  if p_daily_sp_cap is null or p_daily_sp_cap < 0 or p_daily_sp_cap > 100000 then
    raise exception 'Invalid daily cap';
  end if;

  -- Idempotent replay by dedupe key
  select *
  into existing_event
  from public.signal_engagement_events
  where user_id = p_user_id
    and dedupe_key = btrim(p_dedupe_key);

  if found then
    select *
    into existing_grant
    from public.signal_reward_grants
    where engagement_event_id = existing_event.id;

    if found then
      select *
      into existing_delivery
      from public.signal_reward_deliveries
      where grant_id = existing_grant.id;

      return jsonb_build_object(
        'status', 'duplicate',
        'eventId', existing_event.id,
        'granted', true,
        'envelope', jsonb_build_object(
          'grantId', existing_grant.id::text,
          'eventId', existing_event.id::text,
          'tier', existing_grant.reward_tier,
          'code', existing_grant.reason_code,
          'title', existing_grant.title,
          'description', existing_grant.description,
          'displayDelta', existing_grant.sp_delta,
          'resultingBalance', existing_grant.resulting_balance,
          'createdAt', existing_grant.created_at,
          'priority', existing_grant.priority,
          'accessibilityAnnouncement', existing_grant.accessibility_announcement,
          'rulesVersion', existing_grant.rules_version
        ),
        'deliveryStatus', coalesce(existing_delivery.status, 'pending')
      );
    end if;

    return jsonb_build_object(
      'status', 'duplicate',
      'eventId', existing_event.id,
      'granted', false,
      'envelope', null
    );
  end if;

  -- Ensure profile exists (SP stored in game_profiles.xp)
  insert into public.game_profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select *
  into profile
  from public.game_profiles
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Profile unavailable';
  end if;

  select coalesce(sum(g.sp_delta), 0)
  into day_total
  from public.signal_reward_grants g
  where g.user_id = p_user_id
    and g.created_at >= day_start;

  remaining := greatest(p_daily_sp_cap - day_total, 0);
  awarded := least(p_sp_delta, remaining);

  insert into public.signal_engagement_events (
    user_id,
    event_type,
    dedupe_key,
    context,
    client_idempotency_key,
    rules_version,
    source,
    occurred_at
  )
  values (
    p_user_id,
    btrim(p_event_type),
    btrim(p_dedupe_key),
    p_context,
    nullif(btrim(coalesce(p_client_idempotency_key, '')), ''),
    btrim(p_rules_version),
    'api',
    occurred
  )
  returning * into inserted_event;

  if awarded <= 0 or p_reward_tier = 'interaction' then
    return jsonb_build_object(
      'status', 'accepted',
      'eventId', inserted_event.id,
      'granted', false,
      'envelope', null,
      'spAwarded', 0,
      'dailyRemaining', remaining
    );
  end if;

  new_balance := profile.xp + awarded;
  new_level := public.calculate_level(new_balance);

  update public.game_profiles
  set
    xp = new_balance,
    level = new_level,
    last_interaction_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where user_id = p_user_id;

  insert into public.signal_reward_grants (
    user_id,
    engagement_event_id,
    reason_code,
    sp_delta,
    resulting_balance,
    reward_tier,
    title,
    description,
    accessibility_announcement,
    priority,
    rules_version
  )
  values (
    p_user_id,
    inserted_event.id,
    btrim(p_reason_code),
    awarded,
    new_balance,
    p_reward_tier,
    left(btrim(p_title), 120),
    left(btrim(p_description), 280),
    left(btrim(p_announcement), 280),
    coalesce(p_priority, 0),
    btrim(p_rules_version)
  )
  returning * into inserted_grant;

  insert into public.signal_reward_deliveries (
    grant_id,
    user_id,
    status
  )
  values (
    inserted_grant.id,
    p_user_id,
    'pending'
  );

  return jsonb_build_object(
    'status', 'accepted',
    'eventId', inserted_event.id,
    'granted', true,
    'spAwarded', awarded,
    'dailyRemaining', greatest(remaining - awarded, 0),
    'envelope', jsonb_build_object(
      'grantId', inserted_grant.id::text,
      'eventId', inserted_event.id::text,
      'tier', inserted_grant.reward_tier,
      'code', inserted_grant.reason_code,
      'title', inserted_grant.title,
      'description', inserted_grant.description,
      'displayDelta', inserted_grant.sp_delta,
      'resultingBalance', inserted_grant.resulting_balance,
      'createdAt', inserted_grant.created_at,
      'priority', inserted_grant.priority,
      'accessibilityAnnouncement', inserted_grant.accessibility_announcement,
      'rulesVersion', inserted_grant.rules_version
    ),
    'deliveryStatus', 'pending'
  );
end;
$$;

revoke all on function public.accept_signal_engagement(
  uuid, text, text, jsonb, integer, text, text, text, text, text, integer, text, text, timestamptz, integer
) from public, anon, authenticated;
grant execute on function public.accept_signal_engagement(
  uuid, text, text, jsonb, integer, text, text, text, text, text, integer, text, text, timestamptz, integer
) to service_role;

-- Acknowledge / dismiss delivery (own user only via auth.uid OR service with match)
create or replace function public.acknowledge_signal_reward(
  p_grant_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := auth.uid();
  delivery public.signal_reward_deliveries;
begin
  if authenticated_user_id is null then
    raise exception 'Unauthorized';
  end if;
  if p_status is null or p_status not in ('acknowledged', 'dismissed') then
    raise exception 'Invalid status';
  end if;

  select *
  into delivery
  from public.signal_reward_deliveries
  where grant_id = p_grant_id
    and user_id = authenticated_user_id
  for update;

  if not found then
    raise exception 'Delivery not found';
  end if;

  update public.signal_reward_deliveries
  set
    status = p_status,
    acknowledged_at = timezone('utc', now()),
    updated_at = timezone('utc', now())
  where grant_id = p_grant_id
    and user_id = authenticated_user_id
  returning * into delivery;

  return jsonb_build_object(
    'grantId', delivery.grant_id,
    'status', delivery.status,
    'acknowledgedAt', delivery.acknowledged_at
  );
end;
$$;

revoke all on function public.acknowledge_signal_reward(uuid, text)
  from public, anon, service_role;
grant execute on function public.acknowledge_signal_reward(uuid, text)
  to authenticated;

-- Service-role helper for pending envelopes (API uses service after JWT check)
create or replace function public.list_pending_signal_rewards(
  p_user_id uuid,
  p_limit integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_user uuid := auth.uid();
  result jsonb;
begin
  if jwt_user is not null and jwt_user is distinct from p_user_id then
    raise exception 'Forbidden user id';
  end if;
  if p_user_id is null then
    raise exception 'Unauthorized';
  end if;
  if p_limit is null or p_limit < 1 or p_limit > 50 then
    p_limit := 10;
  end if;

  select coalesce(jsonb_agg(item order by item->>'createdAt'), '[]'::jsonb)
  into result
  from (
    select jsonb_build_object(
      'grantId', g.id::text,
      'eventId', g.engagement_event_id::text,
      'tier', g.reward_tier,
      'code', g.reason_code,
      'title', g.title,
      'description', g.description,
      'displayDelta', g.sp_delta,
      'resultingBalance', g.resulting_balance,
      'createdAt', g.created_at,
      'priority', g.priority,
      'accessibilityAnnouncement', g.accessibility_announcement,
      'rulesVersion', g.rules_version
    ) as item
    from public.signal_reward_deliveries d
    join public.signal_reward_grants g on g.id = d.grant_id
    where d.user_id = p_user_id
      and d.status = 'pending'
    order by g.priority desc, g.created_at asc
    limit p_limit
  ) pending;

  return result;
end;
$$;

revoke all on function public.list_pending_signal_rewards(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.list_pending_signal_rewards(uuid, integer)
  to service_role;

comment on table public.signal_engagement_events is
  'Append-only authenticated engagement events. SP amounts never stored here from clients.';
comment on table public.signal_reward_grants is
  'Immutable Signal Points ledger. game_profiles.xp is the running SP balance.';
comment on table public.signal_reward_deliveries is
  'Presentation receipt state separate from the immutable grant ledger.';
comment on function public.accept_signal_engagement is
  'Atomic event accept + optional SP grant. service_role only after JWT resolution.';
