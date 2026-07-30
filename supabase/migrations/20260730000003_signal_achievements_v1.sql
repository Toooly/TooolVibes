-- Phase 6: server-owned Signal achievements, V1 badge language, level advancement.
--
-- Additive only:
--   * extends public.badges with family/rarity/accessibility metadata
--   * seeds the canonical V1 achievement catalogue as badge definitions
--   * adds award_signal_badge + evaluate_signal_achievements (service_role only)
--   * extends the progress hub with badge objects + truthful progress counters
--   * adds suppress_major_celebrations preference
--
-- Ownership rules (unchanged trust boundary):
--   * public.user_badges keeps WITH CHECK (false) — no client inserts
--   * all award paths are SECURITY DEFINER and granted to service_role only
--   * eligibility evidence comes only from authoritative server state

-- ---------------------------------------------------------------------------
-- 1) Badge language columns
-- ---------------------------------------------------------------------------

alter table public.badges
  add column if not exists family text not null default 'legacy',
  add column if not exists rarity text not null default 'common',
  add column if not exists a11y_description text,
  add column if not exists visual_intensity text not null default 'standard',
  add column if not exists sort_order integer not null default 100;

alter table public.badges
  drop constraint if exists badges_family_check;
alter table public.badges
  add constraint badges_family_check check (family in ('legacy', 'signal_v1'));

alter table public.badges
  drop constraint if exists badges_rarity_check;
alter table public.badges
  add constraint badges_rarity_check check (rarity in ('common', 'uncommon', 'rare'));

alter table public.badges
  drop constraint if exists badges_visual_intensity_check;
alter table public.badges
  add constraint badges_visual_intensity_check check (visual_intensity in ('quiet', 'standard', 'elevated'));

-- ---------------------------------------------------------------------------
-- 2) Canonical V1 achievement catalogue (badge definitions)
--
-- requirement_type/requirement_value are reused as documentation of the
-- server-evaluated evidence rule; evaluation itself lives in
-- evaluate_signal_achievements below and never in the client.
-- xp_bonus = SP bonus granted on award (rides the global daily cap).
-- Merged achievements carry xp_bonus 0: the underlying action already granted
-- SP through its event + mission envelopes, so no duplicate SP is created.
-- ---------------------------------------------------------------------------

insert into public.badges (
  id, code, name, description, icon,
  requirement_type, requirement_value, xp_bonus,
  family, rarity, a11y_description, visual_intensity, sort_order
) values
  (
    '00000000-0000-0000-0000-000000000101',
    'first_signal',
    'Prima traccia',
    'Hai salvato il primo strumento: la tua mappa personale è iniziata.',
    'Bookmark',
    'signal_first_save', 1, 0,
    'signal_v1', 'common',
    'Segnalino guadagnato: hai salvato il tuo primo strumento.',
    'quiet', 10
  ),
  (
    '00000000-0000-0000-0000-000000000102',
    'profile_set',
    'Contesto pronto',
    'Hai definito focus e obiettivo: i suggerimenti tengono conto del tuo contesto.',
    'UserCheck',
    'signal_profile_complete', 1, 0,
    'signal_v1', 'common',
    'Segnalino guadagnato: contesto del profilo completato.',
    'quiet', 20
  ),
  (
    '00000000-0000-0000-0000-000000000103',
    'first_verdict',
    'Primo verdetto',
    'Hai completato il primo confronto con una decisione esplicita.',
    'Scale',
    'signal_first_comparison', 1, 0,
    'signal_v1', 'uncommon',
    'Segnalino guadagnato: primo confronto completato.',
    'standard', 30
  ),
  (
    '00000000-0000-0000-0000-000000000104',
    'pathfinder',
    'Apri pista',
    'Hai iniziato a percorrere una raccolta curata oltre la prima pagina.',
    'Compass',
    'signal_collection_progress', 1, 0,
    'signal_v1', 'uncommon',
    'Segnalino guadagnato: hai aperto un percorso in una raccolta curata.',
    'standard', 40
  ),
  (
    '00000000-0000-0000-0000-000000000105',
    'stack_builder',
    'Stack iniziale',
    'Cinque strumenti distinti nella tua selezione: lo stack prende forma.',
    'Layers',
    'signal_saved_tools', 5, 30,
    'signal_v1', 'uncommon',
    'Segnalino guadagnato: cinque strumenti distinti salvati nella selezione.',
    'standard', 50
  ),
  (
    '00000000-0000-0000-0000-000000000106',
    'radar_return',
    'Ritorno al segnale',
    'Sei tornato al Radar in tre giorni diversi: leggi i segnali con continuità.',
    'Radar',
    'signal_radar_days', 3, 25,
    'signal_v1', 'uncommon',
    'Segnalino guadagnato: ritorno al Radar in tre giorni distinti.',
    'standard', 60
  ),
  (
    '00000000-0000-0000-0000-000000000107',
    'curator_mark',
    'Segno del curatore',
    'Hai completato un intero percorso curato, passaggio dopo passaggio.',
    'PenTool',
    'signal_collection_journey', 1, 40,
    'signal_v1', 'rare',
    'Segnalino guadagnato: hai completato un percorso curato completo.',
    'elevated', 70
  ),
  (
    '00000000-0000-0000-0000-000000000108',
    'strategist',
    'Decisione ferma',
    'Cinque confronti completati: le tue decisioni poggiano su basi solide.',
    'BadgeCheck',
    'signal_comparisons', 5, 50,
    'signal_v1', 'rare',
    'Segnalino guadagnato: cinque confronti distinti completati.',
    'elevated', 80
  ),
  (
    '00000000-0000-0000-0000-000000000109',
    'cartographer',
    'Cartografo',
    'Hai raggiunto il livello Cartografo: una mappa personale completa degli strumenti esplorati.',
    'Map',
    'signal_level', 5, 0,
    'signal_v1', 'rare',
    'Segnalino guadagnato: livello Cartografo raggiunto.',
    'elevated', 90
  )
on conflict (code) do nothing;

-- ---------------------------------------------------------------------------
-- 3) award_signal_badge: once-only ownership + optional grant envelope
--
-- Returns jsonb { badgeCode, awarded, envelope } — envelope is null when the
-- badge was already owned, when no grant is requested (merged presentation)
-- or when the grant already exists (concurrent replay).
-- ---------------------------------------------------------------------------

create or replace function public.award_signal_badge(
  p_user_id uuid,
  p_code text,
  p_reward_tier text,
  p_priority integer,
  p_daily_sp_cap integer default 120,
  p_rules_version text default 'signal-achievements-v1',
  p_create_grant boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_user uuid := auth.uid();
  badge public.badges;
  ownership_id uuid;
  profile public.game_profiles;
  day_total integer := 0;
  remaining integer := 0;
  awarded integer := 0;
  new_balance integer := 0;
  synthetic_event public.signal_engagement_events;
  inserted_grant public.signal_reward_grants;
  dedupe text;
  day_start timestamptz := date_trunc('day', timezone('utc', now()));
begin
  if jwt_user is not null and jwt_user is distinct from p_user_id then
    raise exception 'Forbidden user id';
  end if;
  if p_user_id is null then
    raise exception 'Unauthorized';
  end if;
  if p_reward_tier is null
    or p_reward_tier not in ('interaction', 'micro', 'achievement', 'milestone')
  then
    raise exception 'Invalid reward tier';
  end if;

  select * into badge
  from public.badges
  where code = btrim(p_code) and family = 'signal_v1';

  if not found then
    return jsonb_build_object('badgeCode', btrim(p_code), 'awarded', false, 'envelope', null);
  end if;

  -- Once-only ownership (unique(user_id, badge_id) guards concurrency)
  insert into public.user_badges (user_id, badge_id)
  values (p_user_id, badge.id)
  on conflict (user_id, badge_id) do nothing
  returning id into ownership_id;

  if ownership_id is null then
    return jsonb_build_object('badgeCode', badge.code, 'awarded', false, 'envelope', null);
  end if;

  if not p_create_grant then
    -- Merged presentation: ownership persisted, the visible envelope is the
    -- corresponding mission envelope carrying badgeId. No duplicate SP.
    return jsonb_build_object('badgeCode', badge.code, 'awarded', true, 'envelope', null);
  end if;

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

  dedupe := 'achv:' || badge.code;

  insert into public.signal_engagement_events (
    user_id, event_type, dedupe_key, context, rules_version, source, occurred_at
  ) values (
    p_user_id,
    'achievement_unlocked',
    dedupe,
    jsonb_build_object('achievement', badge.code),
    btrim(p_rules_version),
    'system',
    timezone('utc', now())
  )
  on conflict (user_id, dedupe_key) do nothing
  returning * into synthetic_event;

  if not found then
    -- Concurrent replay already created the evidence event; its grant (unique
    -- per engagement_event_id) is the single source of truth. No envelope.
    return jsonb_build_object('badgeCode', badge.code, 'awarded', true, 'envelope', null);
  end if;

  select coalesce(sum(g.sp_delta), 0) into day_total
  from public.signal_reward_grants g
  where g.user_id = p_user_id and g.created_at >= day_start;

  remaining := greatest(p_daily_sp_cap - day_total, 0);
  awarded := least(greatest(badge.xp_bonus, 0), remaining);

  if awarded > 0 then
    new_balance := profile.xp + awarded;
    update public.game_profiles
    set
      xp = new_balance,
      level = public.calculate_level(new_balance),
      last_interaction_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
    where user_id = p_user_id;
  else
    new_balance := profile.xp;
  end if;

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
    badge.code,
    awarded,
    new_balance,
    p_reward_tier,
    left(badge.name, 120),
    left(badge.description, 280),
    left(coalesce(badge.a11y_description, badge.description), 280),
    greatest(coalesce(p_priority, 0), 0),
    btrim(p_rules_version)
  )
  on conflict (engagement_event_id) do nothing
  returning * into inserted_grant;

  if inserted_grant.id is null then
    return jsonb_build_object('badgeCode', badge.code, 'awarded', true, 'envelope', null);
  end if;

  insert into public.signal_reward_deliveries (grant_id, user_id, status)
  values (inserted_grant.id, p_user_id, 'pending')
  on conflict (grant_id) do nothing;

  return jsonb_build_object(
    'badgeCode', badge.code,
    'awarded', true,
    'spAwarded', awarded,
    'envelope', jsonb_build_object(
      'grantId', inserted_grant.id::text,
      'eventId', synthetic_event.id::text,
      'tier', inserted_grant.reward_tier,
      'code', inserted_grant.reason_code,
      'title', inserted_grant.title,
      'description', inserted_grant.description,
      'badgeId', badge.code,
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

revoke all on function public.award_signal_badge(uuid, text, text, integer, integer, text, boolean)
  from public, anon, authenticated;
grant execute on function public.award_signal_badge(uuid, text, text, integer, integer, text, boolean)
  to service_role;

-- ---------------------------------------------------------------------------
-- 4) evaluate_signal_achievements: authoritative eligibility projection
--
-- Evaluates the complete V1 catalogue against authoritative server state and
-- emits level advancement once-only per reached level. Returns only NEWLY
-- earned envelopes. Idempotent: unique constraints on user_badges,
-- signal_engagement_events (user_id, dedupe_key) and
-- signal_reward_grants (engagement_event_id) make replays no-ops.
-- ---------------------------------------------------------------------------

create or replace function public.evaluate_signal_achievements(
  p_user_id uuid,
  p_daily_sp_cap integer default 120,
  p_rules_version text default 'signal-achievements-v1'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  jwt_user uuid := auth.uid();
  profile public.game_profiles;
  comparison_count integer := 0;
  saved_count integer := 0;
  radar_days integer := 0;
  current_balance integer := 0;
  current_level integer := 1;
  lvl integer := 0;
  award jsonb;
  awarded_codes jsonb := '[]'::jsonb;
  envelopes jsonb := '[]'::jsonb;
  synthetic_event public.signal_engagement_events;
  inserted_grant public.signal_reward_grants;
  dedupe text;
  level_title text;
  level_description text;
  level_tier text;
  level_priority integer;
begin
  if jwt_user is not null and jwt_user is distinct from p_user_id then
    raise exception 'Forbidden user id';
  end if;
  if p_user_id is null then
    raise exception 'Unauthorized';
  end if;

  perform 1 from public.game_profiles where user_id = p_user_id for update;

  -- ---- Merged-presentation achievements ------------------------------------
  -- Ownership persisted; the visible envelope is the matching mission
  -- envelope (badgeId). No duplicate SP grant.

  if exists (
    select 1 from public.signal_engagement_events e
    where e.user_id = p_user_id and e.event_type = 'tool_saved_first_time'
  ) then
    award := public.award_signal_badge(p_user_id, 'first_signal', 'achievement', 80, p_daily_sp_cap, p_rules_version, false);
    if coalesce((award->>'awarded')::boolean, false) then
      awarded_codes := awarded_codes || jsonb_build_array('first_signal');
    end if;
  end if;

  select count(*) into comparison_count
  from public.signal_engagement_events e
  where e.user_id = p_user_id and e.event_type = 'comparison_completed';

  if comparison_count >= 1 then
    award := public.award_signal_badge(p_user_id, 'first_verdict', 'achievement', 81, p_daily_sp_cap, p_rules_version, false);
    if coalesce((award->>'awarded')::boolean, false) then
      awarded_codes := awarded_codes || jsonb_build_array('first_verdict');
    end if;
  end if;

  if exists (
    select 1 from public.signal_engagement_events e
    where e.user_id = p_user_id and e.event_type = 'collection_progressed'
  ) then
    award := public.award_signal_badge(p_user_id, 'pathfinder', 'achievement', 82, p_daily_sp_cap, p_rules_version, false);
    if coalesce((award->>'awarded')::boolean, false) then
      awarded_codes := awarded_codes || jsonb_build_array('pathfinder');
    end if;
  end if;

  if exists (
    select 1 from public.signal_user_context ctx
    where ctx.user_id = p_user_id and ctx.completed_at is not null
  ) then
    award := public.award_signal_badge(p_user_id, 'profile_set', 'achievement', 83, p_daily_sp_cap, p_rules_version, false);
    if coalesce((award->>'awarded')::boolean, false) then
      awarded_codes := awarded_codes || jsonb_build_array('profile_set');
    end if;
  end if;

  -- ---- Dedicated-envelope achievements --------------------------------------

  -- stack_builder: five distinct saved tools from the authoritative
  -- workspace state (DATA-206), never a client-provided count.
  select coalesce(sum(cardinality(ws.slugs)), 0)::integer into saved_count
  from (
    select array(select jsonb_array_elements_text(w.workspace_state->'saved'->'slugs')) as slugs
    from public.viewer_workspaces w
    join public.viewer_profiles vp on vp.id = w.viewer_id
    where vp.auth_user_id = p_user_id
      and w.workspace_state is not null
      and jsonb_typeof(w.workspace_state->'saved'->'slugs') = 'array'
  ) ws;

  if saved_count >= 5 then
    award := public.award_signal_badge(p_user_id, 'stack_builder', 'achievement', 84, p_daily_sp_cap, p_rules_version, true);
    if coalesce((award->>'awarded')::boolean, false) then
      awarded_codes := awarded_codes || jsonb_build_array('stack_builder');
      if jsonb_typeof(award->'envelope') = 'object' then
        envelopes := envelopes || jsonb_build_array(award->'envelope');
      end if;
    end if;
  end if;

  -- radar_return: three valid distinct days, no streak requirement.
  select count(distinct e.context->>'date') into radar_days
  from public.signal_engagement_events e
  where e.user_id = p_user_id and e.event_type = 'radar_returned';

  if radar_days >= 3 then
    award := public.award_signal_badge(p_user_id, 'radar_return', 'achievement', 85, p_daily_sp_cap, p_rules_version, true);
    if coalesce((award->>'awarded')::boolean, false) then
      awarded_codes := awarded_codes || jsonb_build_array('radar_return');
      if jsonb_typeof(award->'envelope') = 'object' then
        envelopes := envelopes || jsonb_build_array(award->'envelope');
      end if;
    end if;
  end if;

  -- curator_mark: the user progressed through every authoritative step
  -- (tool slot) of at least one real collection. Required-step count comes
  -- from collection_tool_slots, never from a hardcoded constant.
  if exists (
    select 1
    from (
      select
        e.context->>'slug' as slug,
        count(distinct e.context->>'step') as steps
      from public.signal_engagement_events e
      where e.user_id = p_user_id and e.event_type = 'collection_progressed'
      group by e.context->>'slug'
    ) t
    where (
      select count(*)
      from public.collection_tool_slots s
      join public.collections c on c.id = s.collection_id
      where c.slug = t.slug
    ) > 0
      and t.steps >= (
        select count(*)
        from public.collection_tool_slots s
        join public.collections c on c.id = s.collection_id
        where c.slug = t.slug
      )
  ) then
    award := public.award_signal_badge(p_user_id, 'curator_mark', 'achievement', 86, p_daily_sp_cap, p_rules_version, true);
    if coalesce((award->>'awarded')::boolean, false) then
      awarded_codes := awarded_codes || jsonb_build_array('curator_mark');
      if jsonb_typeof(award->'envelope') = 'object' then
        envelopes := envelopes || jsonb_build_array(award->'envelope');
      end if;
    end if;
  end if;

  -- strategist: five accepted, distinct, server-verified comparisons.
  if comparison_count >= 5 then
    award := public.award_signal_badge(p_user_id, 'strategist', 'achievement', 87, p_daily_sp_cap, p_rules_version, true);
    if coalesce((award->>'awarded')::boolean, false) then
      awarded_codes := awarded_codes || jsonb_build_array('strategist');
      if jsonb_typeof(award->'envelope') = 'object' then
        envelopes := envelopes || jsonb_build_array(award->'envelope');
      end if;
    end if;
  end if;

  -- ---- Level advancement (zero SP, once-only per reached level) ------------

  select xp into current_balance
  from public.game_profiles
  where user_id = p_user_id;

  current_level := public.calculate_signal_level(coalesce(current_balance, 0));

  for lvl in 2..current_level loop
    dedupe := 'level_adv:L' || lvl::text;

    insert into public.signal_engagement_events (
      user_id, event_type, dedupe_key, context, rules_version, source, occurred_at
    ) values (
      p_user_id,
      'level_advanced',
      dedupe,
      jsonb_build_object('level', lvl),
      btrim(p_rules_version),
      'system',
      timezone('utc', now())
    )
    on conflict (user_id, dedupe_key) do nothing
    returning * into synthetic_event;

    if not found then
      continue; -- already emitted for this level
    end if;

    level_title := case lvl
      when 5 then 'Cartografo'
      when 4 then 'Stratega'
      when 3 then 'Curatore'
      else 'Selezionatore'
    end;
    level_description := case lvl
      when 5 then 'Hai mappato il territorio degli strumenti con un percorso completo e continuativo.'
      when 4 then 'Le tue decisioni poggiano su confronti ripetuti e strutturati.'
      when 3 then 'Le tue selezioni diventano una collezione personale ragionata.'
      else 'Hai iniziato a selezionare con criterio: salvataggi e confronti formano la tua prima mappa.'
    end;
    level_tier := case when lvl >= 4 then 'milestone' else 'achievement' end;
    level_priority := case when lvl >= 5 then 100 when lvl >= 4 then 92 else 88 end;

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
      'level_advanced',
      0,
      coalesce(current_balance, 0),
      level_tier,
      left('Nuovo livello: ' || level_title, 120),
      left(level_description, 280),
      left('Hai raggiunto il livello ' || level_title || '. ' || level_description, 280),
      level_priority,
      btrim(p_rules_version)
    )
    on conflict (engagement_event_id) do nothing
    returning * into inserted_grant;

    if inserted_grant.id is not null then
      insert into public.signal_reward_deliveries (grant_id, user_id, status)
      values (inserted_grant.id, p_user_id, 'pending')
      on conflict (grant_id) do nothing;

      envelopes := envelopes || jsonb_build_array(jsonb_build_object(
        'grantId', inserted_grant.id::text,
        'eventId', synthetic_event.id::text,
        'tier', inserted_grant.reward_tier,
        'code', inserted_grant.reason_code,
        'title', inserted_grant.title,
        'description', inserted_grant.description,
        'levelLabel', level_title,
        'displayDelta', 0,
        'resultingBalance', inserted_grant.resulting_balance,
        'createdAt', inserted_grant.created_at,
        'priority', inserted_grant.priority,
        'accessibilityAnnouncement', inserted_grant.accessibility_announcement,
        'rulesVersion', inserted_grant.rules_version
      ));
    end if;
  end loop;

  -- Cartografo badge: requires level 5 (major milestone).
  if current_level >= 5 then
    award := public.award_signal_badge(p_user_id, 'cartographer', 'milestone', 99, p_daily_sp_cap, p_rules_version, true);
    if coalesce((award->>'awarded')::boolean, false) then
      awarded_codes := awarded_codes || jsonb_build_array('cartographer');
      if jsonb_typeof(award->'envelope') = 'object' then
        envelopes := envelopes || jsonb_build_array(award->'envelope');
      end if;
    end if;
  end if;

  return jsonb_build_object(
    'awarded', awarded_codes,
    'envelopes', envelopes
  );
end;
$$;

revoke all on function public.evaluate_signal_achievements(uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.evaluate_signal_achievements(uuid, integer, text)
  to service_role;

-- ---------------------------------------------------------------------------
-- 5) suppress_major_celebrations preference
-- ---------------------------------------------------------------------------

alter table public.signal_reward_preferences
  add column if not exists suppress_major_celebrations boolean not null default false;

drop function if exists public.upsert_signal_reward_preferences(boolean, boolean, boolean, boolean);

create or replace function public.upsert_signal_reward_preferences(
  p_reduce_reward_animations boolean,
  p_mute_reward_sounds boolean,
  p_quiet_mode boolean,
  p_suppress_automatic_achievements boolean,
  p_suppress_major_celebrations boolean default null
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
    suppress_automatic_achievements,
    suppress_major_celebrations
  ) values (
    uid,
    coalesce(p_reduce_reward_animations, false),
    coalesce(p_mute_reward_sounds, false),
    coalesce(p_quiet_mode, false),
    coalesce(p_suppress_automatic_achievements, false),
    coalesce(p_suppress_major_celebrations, false)
  )
  on conflict (user_id) do update set
    reduce_reward_animations = excluded.reduce_reward_animations,
    mute_reward_sounds = excluded.mute_reward_sounds,
    quiet_mode = excluded.quiet_mode,
    suppress_automatic_achievements = excluded.suppress_automatic_achievements,
    suppress_major_celebrations = excluded.suppress_major_celebrations,
    updated_at = timezone('utc', now())
  returning * into row;

  return jsonb_build_object(
    'reduceRewardAnimations', row.reduce_reward_animations,
    'muteRewardSounds', row.mute_reward_sounds,
    'quietMode', row.quiet_mode,
    'suppressAutomaticAchievements', row.suppress_automatic_achievements,
    'suppressMajorCelebrations', row.suppress_major_celebrations
  );
end;
$$;

revoke all on function public.upsert_signal_reward_preferences(boolean, boolean, boolean, boolean, boolean)
  from public, anon;
grant execute on function public.upsert_signal_reward_preferences(boolean, boolean, boolean, boolean, boolean)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6) Progress hub: badge objects + truthful progress counters + new preference
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
  badge_codes jsonb := '[]'::jsonb;
  saved_count integer := 0;
  comparison_count integer := 0;
  radar_days integer := 0;
  journeys_completed integer := 0;
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

  -- Earned V1 badges as full objects (cabinet read model)
  select
    coalesce(jsonb_agg(jsonb_build_object(
      'code', b.code,
      'title', b.name,
      'description', b.description,
      'a11yDescription', coalesce(b.a11y_description, b.description),
      'iconId', b.icon,
      'rarity', b.rarity,
      'visualIntensity', b.visual_intensity,
      'sortOrder', b.sort_order,
      'earnedAt', ub.awarded_at
    ) order by b.sort_order), '[]'::jsonb),
    coalesce(jsonb_agg(b.code order by b.sort_order), '[]'::jsonb)
  into badges, badge_codes
  from public.user_badges ub
  join public.badges b on b.id = ub.badge_id
  where ub.user_id = p_user_id and b.family = 'signal_v1';

  -- Truthful progress counters for the cabinet trajectory section
  select coalesce(sum(cardinality(ws.slugs)), 0)::integer into saved_count
  from (
    select array(select jsonb_array_elements_text(w.workspace_state->'saved'->'slugs')) as slugs
    from public.viewer_workspaces w
    join public.viewer_profiles vp on vp.id = w.viewer_id
    where vp.auth_user_id = p_user_id
      and w.workspace_state is not null
      and jsonb_typeof(w.workspace_state->'saved'->'slugs') = 'array'
  ) ws;

  select count(*) into comparison_count
  from public.signal_engagement_events e
  where e.user_id = p_user_id and e.event_type = 'comparison_completed';

  select count(distinct e.context->>'date') into radar_days
  from public.signal_engagement_events e
  where e.user_id = p_user_id and e.event_type = 'radar_returned';

  select count(*) into journeys_completed
  from (
    select
      e.context->>'slug' as slug,
      count(distinct e.context->>'step') as steps
    from public.signal_engagement_events e
    where e.user_id = p_user_id and e.event_type = 'collection_progressed'
    group by e.context->>'slug'
  ) t
  where (
    select count(*)
    from public.collection_tool_slots s
    join public.collections c on c.id = s.collection_id
    where c.slug = t.slug
  ) > 0
    and t.steps >= (
      select count(*)
      from public.collection_tool_slots s
      join public.collections c on c.id = s.collection_id
      where c.slug = t.slug
    );

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
    'earnedBadgeCodes', badge_codes,
    'badges', badges,
    'achievementProgress', jsonb_build_object(
      'savedCount', saved_count,
      'comparisonCount', comparison_count,
      'radarDays', radar_days,
      'collectionJourneysCompleted', journeys_completed,
      'profileComplete', ctx.completed_at is not null,
      'level', lvl
    ),
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
      'suppressAutomaticAchievements', prefs.suppress_automatic_achievements,
      'suppressMajorCelebrations', prefs.suppress_major_celebrations
    ) end
  );
end;
$$;

revoke all on function public.get_signal_progress_hub(uuid) from public, anon, authenticated;
grant execute on function public.get_signal_progress_hub(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 7) Table-level grants on the reused badge structures
--
-- The legacy badge tables shipped RLS policies without table-level grants,
-- so the policies were unreachable (42501). The cabinet reads through the
-- hub RPC (service_role); own-user direct reads stay constrained by the
-- existing RLS policies (user_badges INSERT keeps WITH CHECK (false)).
-- ---------------------------------------------------------------------------

grant select on public.badges to anon, authenticated;
grant select on public.user_badges to authenticated;
grant select, insert, update, delete on public.badges to service_role;
grant select, insert, update, delete on public.user_badges to service_role;

-- Backend role needs direct ledger access for evaluation evidence and tests;
-- RLS and definer boundaries are unchanged.
grant select, insert, update, delete on public.game_profiles to service_role;
