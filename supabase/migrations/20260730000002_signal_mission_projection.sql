-- Phase 5: server-owned Signal mission projection + profile context + hub read model
-- Additive only. Apply locally. Do not apply to production from this phase.

-- ---------------------------------------------------------------------------
-- Mission completions (once-only, server-owned)
-- ---------------------------------------------------------------------------
create table if not exists public.signal_mission_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id text not null,
  completed_at timestamptz not null default timezone('utc', now()),
  source_event_id uuid null references public.signal_engagement_events(id) on delete set null,
  grant_id uuid null references public.signal_reward_grants(id) on delete set null,
  rules_version text not null,
  constraint signal_mission_completions_id_check
    check (char_length(btrim(mission_id)) between 3 and 64),
  constraint signal_mission_completions_pk primary key (user_id, mission_id)
);

create index if not exists signal_mission_completions_user_idx
  on public.signal_mission_completions (user_id, completed_at desc);

-- ---------------------------------------------------------------------------
-- Minimal useful profile context for recommendations / onboarding
-- ---------------------------------------------------------------------------
create table if not exists public.signal_user_context (
  user_id uuid primary key references auth.users(id) on delete cascade,
  focus_area text not null,
  primary_goal text not null,
  completed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint signal_user_context_focus_check
    check (focus_area in (
      'product', 'design', 'engineering', 'marketing', 'operations', 'research'
    )),
  constraint signal_user_context_goal_check
    check (primary_goal in (
      'discover', 'compare', 'shortlist', 'learn', 'decide'
    ))
);

create or replace function public.signal_user_context_set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := timezone('utc', now());
  if new.focus_area is not null
    and new.primary_goal is not null
    and new.completed_at is null
  then
    new.completed_at := timezone('utc', now());
  end if;
  return new;
end;
$$;

drop trigger if exists signal_user_context_set_updated_at on public.signal_user_context;
create trigger signal_user_context_set_updated_at
before insert or update on public.signal_user_context
for each row execute function public.signal_user_context_set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.signal_mission_completions enable row level security;
alter table public.signal_mission_completions force row level security;
alter table public.signal_user_context enable row level security;
alter table public.signal_user_context force row level security;

drop policy if exists "Users read own signal missions" on public.signal_mission_completions;
create policy "Users read own signal missions"
  on public.signal_mission_completions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users read own signal context" on public.signal_user_context;
create policy "Users read own signal context"
  on public.signal_user_context
  for select
  to authenticated
  using (auth.uid() = user_id);

revoke all on table public.signal_mission_completions from public, anon, authenticated;
revoke all on table public.signal_user_context from public, anon, authenticated;
grant select on table public.signal_mission_completions to authenticated;
grant select on table public.signal_user_context to authenticated;
grant all on table public.signal_mission_completions to service_role;
grant all on table public.signal_user_context to service_role;

-- ---------------------------------------------------------------------------
-- Signal level from cumulative SP (V1 thresholds; independent of legacy calculate_level)
-- ---------------------------------------------------------------------------
create or replace function public.calculate_signal_level(p_sp integer)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case
    when coalesce(p_sp, 0) >= 1800 then 5
    when coalesce(p_sp, 0) >= 900 then 4
    when coalesce(p_sp, 0) >= 400 then 3
    when coalesce(p_sp, 0) >= 150 then 2
    else 1
  end;
$$;

revoke all on function public.calculate_signal_level(integer) from public, anon, authenticated;
grant execute on function public.calculate_signal_level(integer) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Complete mission once (service_role / definer). Returns grant envelope JSON or null.
-- ---------------------------------------------------------------------------
create or replace function public.complete_signal_mission(
  p_user_id uuid,
  p_mission_id text,
  p_source_event_id uuid,
  p_sp_delta integer,
  p_reward_tier text,
  p_reason_code text,
  p_title text,
  p_description text,
  p_announcement text,
  p_priority integer,
  p_rules_version text,
  p_daily_sp_cap integer default 120,
  p_badge_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_user uuid := auth.uid();
  existing public.signal_mission_completions;
  profile public.game_profiles;
  awarded integer := 0;
  day_total integer := 0;
  remaining integer := 0;
  new_balance integer := 0;
  inserted_grant public.signal_reward_grants;
  has_grant boolean := false;
  day_start timestamptz := date_trunc('day', timezone('utc', now()));
  synthetic_event public.signal_engagement_events;
  dedupe text;
begin
  if jwt_user is not null and jwt_user is distinct from p_user_id then
    raise exception 'Forbidden user id';
  end if;
  if p_user_id is null then
    raise exception 'Unauthorized';
  end if;
  if p_mission_id is null or char_length(btrim(p_mission_id)) < 3 then
    raise exception 'Invalid mission id';
  end if;
  if p_sp_delta is null or p_sp_delta < 0 or p_sp_delta > 10000 then
    raise exception 'Invalid sp delta';
  end if;
  if p_reward_tier is null
    or p_reward_tier not in ('interaction', 'micro', 'achievement', 'milestone')
  then
    raise exception 'Invalid reward tier';
  end if;

  select * into existing
  from public.signal_mission_completions
  where user_id = p_user_id and mission_id = btrim(p_mission_id);

  if found then
    if existing.grant_id is not null then
      select row_to_json(g.*) into synthetic_event from public.signal_reward_grants g where g.id = existing.grant_id;
      return jsonb_build_object(
        'status', 'duplicate',
        'missionId', existing.mission_id,
        'granted', existing.grant_id is not null,
        'envelope', null
      );
    end if;
    return jsonb_build_object(
      'status', 'duplicate',
      'missionId', existing.mission_id,
      'granted', false,
      'envelope', null
    );
  end if;

  dedupe := 'mission_complete:' || p_user_id::text || ':' || btrim(p_mission_id);

  insert into public.game_profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;

  select * into profile
  from public.game_profiles
  where user_id = p_user_id
  for update;

  if not found then
    raise exception 'Profile unavailable';
  end if;

  -- Synthetic engagement for mission completion (ledger integrity)
  insert into public.signal_engagement_events (
    user_id, event_type, dedupe_key, context, rules_version, source, occurred_at
  ) values (
    p_user_id,
    'mission_completed',
    dedupe,
    jsonb_build_object('missionId', btrim(p_mission_id)),
    btrim(p_rules_version),
    'system',
    timezone('utc', now())
  )
  on conflict (user_id, dedupe_key) do nothing
  returning * into synthetic_event;

  if not found then
    select * into synthetic_event
    from public.signal_engagement_events
    where user_id = p_user_id and dedupe_key = dedupe;
  end if;

  select coalesce(sum(g.sp_delta), 0) into day_total
  from public.signal_reward_grants g
  where g.user_id = p_user_id and g.created_at >= day_start;

  remaining := greatest(p_daily_sp_cap - day_total, 0);
  awarded := least(p_sp_delta, remaining);

  if awarded > 0 and p_reward_tier <> 'interaction' then
    new_balance := profile.xp + awarded;
    update public.game_profiles
    set
      xp = new_balance,
      level = public.calculate_level(new_balance),
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
    ) values (
      p_user_id,
      synthetic_event.id,
      btrim(p_reason_code),
      awarded,
      new_balance,
      p_reward_tier,
      left(btrim(p_title), 120),
      left(btrim(p_description), 280),
      left(btrim(p_announcement), 280),
      greatest(coalesce(p_priority, 0), 0),
      btrim(p_rules_version)
    )
    returning * into inserted_grant;
    has_grant := true;

    insert into public.signal_reward_deliveries (grant_id, user_id, status)
    values (inserted_grant.id, p_user_id, 'pending')
    on conflict (grant_id) do nothing;
  else
    new_balance := profile.xp;
  end if;

  insert into public.signal_mission_completions (
    user_id, mission_id, source_event_id, grant_id, rules_version
  ) values (
    p_user_id,
    btrim(p_mission_id),
    coalesce(p_source_event_id, synthetic_event.id),
    inserted_grant.id,
    btrim(p_rules_version)
  )
  on conflict (user_id, mission_id) do nothing;

  if inserted_grant.id is null then
    return jsonb_build_object(
      'status', 'accepted',
      'missionId', btrim(p_mission_id),
      'granted', false,
      'envelope', null,
      'spAwarded', 0
    );
  end if;

  return jsonb_build_object(
    'status', 'accepted',
    'missionId', btrim(p_mission_id),
    'granted', true,
    'spAwarded', awarded,
    'envelope', jsonb_build_object(
      'grantId', inserted_grant.id::text,
      'eventId', synthetic_event.id::text,
      'tier', inserted_grant.reward_tier,
      'code', inserted_grant.reason_code,
      'title', inserted_grant.title,
      'description', inserted_grant.description,
      'badgeId', nullif(p_badge_id, ''),
      'displayDelta', inserted_grant.sp_delta,
      'resultingBalance', inserted_grant.resulting_balance,
      'levelLabel', case public.calculate_signal_level(inserted_grant.resulting_balance)
        when 5 then 'Cartografo'
        when 4 then 'Stratega'
        when 3 then 'Curatore'
        when 2 then 'Selezionatore'
        else 'Esploratore'
      end,
      'createdAt', inserted_grant.created_at,
      'priority', inserted_grant.priority,
      'accessibilityAnnouncement', inserted_grant.accessibility_announcement,
      'rulesVersion', inserted_grant.rules_version
    )
  );
end;
$$;

revoke all on function public.complete_signal_mission(
  uuid, text, uuid, integer, text, text, text, text, text, integer, text, integer, text
) from public, anon, authenticated;
grant execute on function public.complete_signal_mission(
  uuid, text, uuid, integer, text, text, text, text, text, integer, text, integer, text
) to service_role;

-- ---------------------------------------------------------------------------
-- Upsert profile context (service_role). Marks completed when both fields set.
-- ---------------------------------------------------------------------------
create or replace function public.upsert_signal_user_context(
  p_user_id uuid,
  p_focus_area text,
  p_primary_goal text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_user uuid := auth.uid();
  row public.signal_user_context;
begin
  if jwt_user is not null and jwt_user is distinct from p_user_id then
    raise exception 'Forbidden user id';
  end if;
  if p_user_id is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.signal_user_context (user_id, focus_area, primary_goal)
  values (p_user_id, btrim(p_focus_area), btrim(p_primary_goal))
  on conflict (user_id) do update
    set focus_area = excluded.focus_area,
        primary_goal = excluded.primary_goal
  returning * into row;

  return jsonb_build_object(
    'focusArea', row.focus_area,
    'primaryGoal', row.primary_goal,
    'completed', row.completed_at is not null,
    'completedAt', row.completed_at
  );
end;
$$;

revoke all on function public.upsert_signal_user_context(uuid, text, text) from public, anon, authenticated;
grant execute on function public.upsert_signal_user_context(uuid, text, text) to service_role;

-- ---------------------------------------------------------------------------
-- Hub read model (service_role builds presentation-safe JSON)
-- ---------------------------------------------------------------------------
create or replace function public.get_signal_progress_hub(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_user uuid := auth.uid();
  profile public.game_profiles;
  bal integer := 0;
  lvl integer := 1;
  prefs public.signal_reward_preferences;
  ctx public.signal_user_context;
  recent jsonb := '[]'::jsonb;
  missions jsonb := '[]'::jsonb;
  badges jsonb := '[]'::jsonb;
begin
  if jwt_user is not null and jwt_user is distinct from p_user_id then
    raise exception 'Forbidden user id';
  end if;
  if p_user_id is null then
    raise exception 'Unauthorized';
  end if;

  select * into profile from public.game_profiles where user_id = p_user_id;
  bal := coalesce(profile.xp, 0);
  lvl := public.calculate_signal_level(bal);

  select * into prefs from public.signal_reward_preferences where user_id = p_user_id;
  select * into ctx from public.signal_user_context where user_id = p_user_id;

  select coalesce(jsonb_agg(item order by ord), '[]'::jsonb)
  into recent
  from (
    select
      jsonb_build_object(
        'grantId', g.id::text,
        'code', g.reason_code,
        'title', g.title,
        'description', g.description,
        'tier', g.reward_tier,
        'displayDelta', g.sp_delta,
        'createdAt', g.created_at
      ) as item,
      g.created_at as ord
    from public.signal_reward_grants g
    where g.user_id = p_user_id
    order by g.created_at desc
    limit 12
  ) s;

  select coalesce(jsonb_agg(jsonb_build_object(
    'missionId', m.mission_id,
    'completedAt', m.completed_at
  ) order by m.completed_at), '[]'::jsonb)
  into missions
  from public.signal_mission_completions m
  where m.user_id = p_user_id;

  select coalesce(jsonb_agg(distinct g.reason_code), '[]'::jsonb)
  into badges
  from public.signal_reward_grants g
  where g.user_id = p_user_id
    and g.reward_tier in ('achievement', 'milestone');

  return jsonb_build_object(
    'balance', bal,
    'level', lvl,
    'levelTitle', case lvl
      when 5 then 'Cartografo'
      when 4 then 'Stratega'
      when 3 then 'Curatore'
      when 2 then 'Selezionatore'
      else 'Esploratore'
    end,
    'nextLevel', case
      when lvl >= 5 then null
      when lvl = 4 then 5
      when lvl = 3 then 4
      when lvl = 2 then 3
      else 2
    end,
    'nextThreshold', case
      when bal >= 1800 then null
      when bal >= 900 then 1800
      when bal >= 400 then 900
      when bal >= 150 then 400
      else 150
    end,
    'progressInLevel', case
      when bal >= 1800 then 1
      when bal >= 900 then (bal - 900)::float / (1800 - 900)
      when bal >= 400 then (bal - 400)::float / (900 - 400)
      when bal >= 150 then (bal - 150)::float / (400 - 150)
      else bal::float / 150
    end,
    'completedMissions', missions,
    'recentGrants', recent,
    'earnedBadgeCodes', badges,
    'profileContextComplete', ctx.completed_at is not null,
    'profileContext', case when ctx.user_id is null then null else jsonb_build_object(
      'focusArea', ctx.focus_area,
      'primaryGoal', ctx.primary_goal,
      'completedAt', ctx.completed_at
    ) end,
    'preferences', case when prefs.user_id is null then null else jsonb_build_object(
      'reduceRewardAnimations', prefs.reduce_reward_animations,
      'muteRewardSounds', prefs.mute_reward_sounds,
      'quietMode', prefs.quiet_mode,
      'suppressAutomaticAchievements', prefs.suppress_automatic_achievements
    ) end
  );
end;
$$;

revoke all on function public.get_signal_progress_hub(uuid) from public, anon, authenticated;
grant execute on function public.get_signal_progress_hub(uuid) to service_role;

-- Preferences upsert (authenticated may update own via definer check)
create or replace function public.upsert_signal_reward_preferences(
  p_reduce_reward_animations boolean,
  p_mute_reward_sounds boolean,
  p_quiet_mode boolean,
  p_suppress_automatic_achievements boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  row public.signal_reward_preferences;
begin
  if uid is null then
    raise exception 'Unauthorized';
  end if;

  insert into public.signal_reward_preferences (
    user_id,
    reduce_reward_animations,
    mute_reward_sounds,
    quiet_mode,
    suppress_automatic_achievements
  ) values (
    uid,
    coalesce(p_reduce_reward_animations, false),
    coalesce(p_mute_reward_sounds, false),
    coalesce(p_quiet_mode, false),
    coalesce(p_suppress_automatic_achievements, false)
  )
  on conflict (user_id) do update set
    reduce_reward_animations = excluded.reduce_reward_animations,
    mute_reward_sounds = excluded.mute_reward_sounds,
    quiet_mode = excluded.quiet_mode,
    suppress_automatic_achievements = excluded.suppress_automatic_achievements,
    updated_at = timezone('utc', now())
  returning * into row;

  return jsonb_build_object(
    'reduceRewardAnimations', row.reduce_reward_animations,
    'muteRewardSounds', row.mute_reward_sounds,
    'quietMode', row.quiet_mode,
    'suppressAutomaticAchievements', row.suppress_automatic_achievements
  );
end;
$$;

revoke all on function public.upsert_signal_reward_preferences(boolean, boolean, boolean, boolean)
  from public, anon;
grant execute on function public.upsert_signal_reward_preferences(boolean, boolean, boolean, boolean)
  to authenticated, service_role;
