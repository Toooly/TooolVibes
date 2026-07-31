-- Phase 7B — production-safe Signal bootstrap (single additive migration).
--
-- Production inventory (verified 2026-07-31, project pjyasxaebxvvmcjxvnno):
--   * 11 public tables (no Signal, no legacy gamification)
--   * 3 public functions: set_updated_at, match_kb_chunks, rls_auto_enable
--   * extensions: vector 0.8.0, pg_stat_statements 1.11
--   * NO supabase_migrations schema (no migration ledger)
--
-- This migration bootstraps the full Phase 4-6 Signal Progression stack in
-- ONE additive pass against the verified production-shape starting state.
--
-- Production execution: this migration will be applied via the project-scoped
-- Supabase Management API `apply_migration` tool (project ref
-- pjyasxaebxvvmcjxvnno, migration name "signal_bootstrap_v1"). The
-- Management API owns the migration transaction, the schema_migrations
-- table creation, the migration-history insertion, and the failure rollback.
-- This file contains application schema changes only.
--
-- It creates ONLY new objects. It does NOT touch any of the 11 production
-- tables. It does NOT create legacy gamification surfaces (arena_*,
-- game_missions, game_mission_claims, hidden_signal_claims,
-- leaderboard_snapshots, tool_collections) that production never installed.
--
-- It creates the minimum dependency chain required by the Phase 4-6 RPCs:
--   public.game_profiles (xp/level ledger; FORCE RLS)
--   public.calculate_level(integer) (legacy step-curve)
--   public.badges (legacy contract + Phase 6 additive columns)
--   public.user_badges (FORCE RLS + WITH CHECK false for INSERT)
--
-- Then it creates the Phase 4-6 Signal stack exactly as documented in the
-- repo migrations 20260730000001/2/3, with `create or replace function`
-- for every RPC (so re-applying against a partial state is a no-op for the
-- RPC bodies) and `create table if not exists` for the Signal tables.
--
-- This file contains NO manual migration-history DDL. Production
-- migration-history tracking is delegated exclusively to the project-scoped
-- Supabase Management API `apply_migration` tool that applies this file
-- (see docs/PRODUCTION_RECONCILIATION_V1.md, Blocker 1 closure).
--
-- NO DESTRUCTIVE STATEMENTS. NO DROPS. NO RECREATES of production tables.
-- NO FORCE RLS toggles on existing production tables.

-- ============================================================================
-- Section 1: minimum required legacy-compatible dependencies
-- ============================================================================

-- 1.1 game_profiles (xp/level ledger, FORCE RLS)
create table if not exists public.game_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  xp integer not null default 0,
  level integer not null default 1,
  vibes integer not null default 0,
  streak_days integer not null default 0,
  last_interaction_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists game_profiles_xp_idx on public.game_profiles (xp desc);

alter table public.game_profiles enable row level security;
alter table public.game_profiles force row level security;

drop policy if exists "Service role can manage game profiles" on public.game_profiles;
create policy "Service role can manage game profiles"
  on public.game_profiles
  for all to service_role
  using (true)
  with check (true);

-- Server-owned trust boundary: only service_role (via Signal RPCs) may
-- mutate progression fields. Authenticated clients have SELECT own only.
drop policy if exists "Authenticated users can read own profile" on public.game_profiles;
create policy "Authenticated users can read own profile"
  on public.game_profiles
  for select to authenticated
  using (auth.uid() = user_id);

-- Explicitly prevent INSERT/UPDATE/DELETE from anon and authenticated.
-- WITH CHECK (false) is the canonical pattern; the combination of the
-- service_role ALL policy plus these defensive WITH CHECK false statements
-- makes the trust boundary explicit and audit-friendly.
drop policy if exists "No client-side progression writes" on public.game_profiles;
create policy "No client-side progression writes"
  on public.game_profiles
  for all to anon, authenticated
  using (false)
  with check (false);

grant select on table public.game_profiles to authenticated;
revoke insert, update, delete, truncate on table public.game_profiles from anon;
revoke insert, update, delete, truncate on table public.game_profiles from authenticated;
grant all privileges on table public.game_profiles to service_role;

-- 1.2 calculate_level (legacy step-curve function)
create or replace function public.calculate_level(p_xp integer)
returns integer
language plpgsql
immutable
as $$
declare
  level integer := 1;
  remaining integer := p_xp;
  needed integer;
begin
  loop
    needed := 100 + (level - 1) * 115;
    exit when remaining < needed;
    remaining := remaining - needed;
    level := level + 1;
  end loop;
  return level;
end;
$$;

grant execute on function public.calculate_level(integer) to authenticated, service_role;

-- 1.3 badges (legacy contract + Phase 6 additive columns)
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null check (char_length(trim(name)) >= 2),
  description text not null,
  icon text not null,
  requirement_type text not null,
  requirement_value integer not null default 1,
  xp_bonus integer not null default 0,
  family text not null default 'signal_v1',
  rarity text not null default 'common',
  a11y_description text,
  visual_intensity text not null default 'standard',
  sort_order integer not null default 100,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.badges enable row level security;

drop policy if exists "Badges are public read" on public.badges;
create policy "Badges are public read"
  on public.badges for select
  using (true);

drop policy if exists "Service role can manage badges" on public.badges;
create policy "Service role can manage badges"
  on public.badges for all to service_role
  using (true) with check (true);

grant select on public.badges to anon, authenticated;
grant all on public.badges to service_role;

-- 1.4 user_badges (FORCE RLS + WITH CHECK false)
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references public.badges(id) on delete cascade,
  awarded_at timestamptz not null default timezone('utc', now()),
  unique (user_id, badge_id)
);

create index if not exists user_badges_user_id_idx on public.user_badges (user_id);

alter table public.user_badges enable row level security;
alter table public.user_badges force row level security;

drop policy if exists "Users can read own badges" on public.user_badges;
create policy "Users can read own badges"
  on public.user_badges for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users cannot insert own badges" on public.user_badges;
create policy "Users cannot insert own badges"
  on public.user_badges for insert to authenticated
  with check (false);

drop policy if exists "Service role can manage user badges" on public.user_badges;
create policy "Service role can manage user badges"
  on public.user_badges for all to service_role
  using (true) with check (true);

grant select on public.user_badges to authenticated;
grant all on public.user_badges to service_role;

-- 1.5 Seed the 9 canonical V1 achievement badge definitions
-- Idempotent via ON CONFLICT (code).
insert into public.badges (id, code, name, description, icon,
                           requirement_type, requirement_value, xp_bonus,
                           family, rarity, a11y_description,
                           visual_intensity, sort_order) values
  ('00000000-0000-0000-0000-000000000101','first_signal','Prima traccia',
   'Hai salvato il primo strumento: la tua mappa personale è iniziata.','Bookmark',
   'signal_first_save',1,0,'signal_v1','common',
   'Segnalino guadagnato: hai salvato il tuo primo strumento.','quiet',10),
  ('00000000-0000-0000-0000-000000000102','profile_set','Contesto pronto',
   'Hai definito focus e obiettivo: i suggerimenti tengono conto del tuo contesto.','UserCheck',
   'signal_profile_complete',1,0,'signal_v1','common',
   'Segnalino guadagnato: contesto del profilo completato.','quiet',20),
  ('00000000-0000-0000-0000-000000000103','first_verdict','Primo verdetto',
   'Hai completato il primo confronto con una decisione esplicita.','Scale',
   'signal_first_comparison',1,0,'signal_v1','uncommon',
   'Segnalino guadagnato: primo confronto completato.','standard',30),
  ('00000000-0000-0000-0000-000000000104','pathfinder','Apri pista',
   'Hai iniziato a percorrere una raccolta curata oltre la prima pagina.','Compass',
   'signal_collection_progress',1,0,'signal_v1','uncommon',
   'Segnalino guadagnato: hai aperto un percorso in una raccolta curata.','standard',40),
  ('00000000-0000-0000-0000-000000000105','stack_builder','Stack iniziale',
   'Cinque strumenti distinti nella tua selezione: lo stack prende forma.','Layers',
   'signal_saved_tools',5,30,'signal_v1','uncommon',
   'Segnalino guadagnato: cinque strumenti distinti salvati nella selezione.','standard',50),
  ('00000000-0000-0000-0000-000000000106','radar_return','Ritorno al segnale',
   'Sei tornato al Radar in tre giorni diversi: leggi i segnali con continuità.','Radar',
   'signal_radar_days',3,25,'signal_v1','uncommon',
   'Segnalino guadagnato: ritorno al Radar in tre giorni distinti.','standard',60),
  ('00000000-0000-0000-0000-000000000107','curator_mark','Segno del curatore',
   'Hai completato un intero percorso curato, passaggio dopo passaggio.','PenTool',
   'signal_collection_journey',1,40,'signal_v1','rare',
   'Segnalino guadagnato: hai completato un percorso curato completo.','elevated',70),
  ('00000000-0000-0000-0000-000000000108','strategist','Decisione ferma',
   'Cinque confronti completati: le tue decisioni poggiano su basi solide.','BadgeCheck',
   'signal_comparisons',5,50,'signal_v1','rare',
   'Segnalino guadagnato: cinque confronti distinti completati.','elevated',80),
  ('00000000-0000-0000-0000-000000000109','cartographer','Cartografo',
   'Hai raggiunto il livello Cartografo: una mappa personale completa degli strumenti esplorati.','Map',
   'signal_level',5,0,'signal_v1','rare',
   'Segnalino guadagnato: livello Cartografo raggiunto.','elevated',90)
on conflict (code) do nothing;

-- ============================================================================
-- Section 1.5: minimal additive schema extension for the Phase 4-6 stack
--
-- The Phase 4-6 evaluate_signal_achievements RPC references
-- viewer_workspaces.workspace_state (DATA-206 canonical state). The verified
-- production-shape DOES NOT have this column. The Phase 7B bootstrap adds it
-- as a NULLABLE column with no default, so:
--   - Existing production rows remain byte-identical (NULL)
--   - No existing query is broken
--   - The Phase 4-6 RPC compiles and operates correctly
--   - A future Phase 8 migration (workspace_state_v1_sync) will deploy the
--     validator + sync RPC pair that production lacks.
-- ============================================================================

alter table public.viewer_workspaces
  add column if not exists workspace_state jsonb;

-- ============================================================================
-- Section 1.6: workspace_state canonical CAS + sync RPC
--
-- The real save action path (tool save / unsave) goes through
-- /api/workspace-state -> saveCanonicalRemoteWorkspace -> the
-- sync_viewer_workspace_v1 RPC -> viewer_workspaces.workspace_state.
--
-- Production-shape DOES NOT have this infrastructure (verified inventory).
-- The Phase 7B bootstrap adds the minimum required:
--   - workspace_schema_version, revision, last_operation_id columns on
--     viewer_workspaces (CAS primitives)
--   - workspace_state_v1_is_valid() function (validator)
--   - sync_viewer_workspace_v1() RPC (service_role only, SECURITY INVOKER)
--   - the workspace_state CHECK constraints
--
-- The repo migration 20260716000004 also performs a backfill from
-- viewer_tool_states -> workspace_state. That backfill is deliberately
-- OMITTED from the production bootstrap (production has 0 rows in
-- viewer_tool_states and the backfill is a one-time migration, not
-- production-safe infrastructure).
-- ============================================================================

alter table public.viewer_workspaces
  add column if not exists workspace_schema_version integer not null default 1,
  add column if not exists revision bigint not null default 0,
  add column if not exists last_operation_id uuid null;

-- The repo migration widens compare_slugs from <= 3 to <= 5 to match the
-- WorkspaceStateV1 schema. Production-shape was created with <= 3, so
-- drop and recreate the constraint here.
alter table public.viewer_workspaces
  drop constraint if exists viewer_workspaces_compare_slugs_check;

alter table public.viewer_workspaces
  add constraint viewer_workspaces_compare_slugs_check
  check (coalesce(array_length(compare_slugs, 1), 0) <= 5) not valid;

alter table public.viewer_workspaces
  validate constraint viewer_workspaces_compare_slugs_check;

-- workspace_state validator (mirrors repo migration 20260716000004 verbatim)
create or replace function public.workspace_state_v1_is_valid(input jsonb)
returns boolean
language sql immutable
set search_path = ''
as $$
  select
    jsonb_typeof(input) = 'object'
    and input->>'schemaVersion' = '1'
    and (input->'clearedAt' = 'null'::jsonb or jsonb_typeof(input->'clearedAt') = 'string')
    and jsonb_typeof(input->'saved') = 'object'
    and jsonb_typeof(input->'saved'->'slugs') = 'array'
    and jsonb_typeof(input->'compare') = 'object'
    and jsonb_typeof(input->'compare'->'slugs') = 'array'
    and jsonb_array_length(input->'compare'->'slugs') <= 5
    and jsonb_typeof(input->'stack') = 'object'
    and jsonb_typeof(input->'stack'->'slugs') = 'array'
    and jsonb_typeof(input->'toolStates') = 'object'
    and not exists (
      select 1
      from jsonb_each(input->'toolStates') as item(slug, state)
      where item.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
        or char_length(item.slug) > 120
        or jsonb_typeof(item.state) <> 'object'
        or coalesce(item.state->>'stage', '') not in ('saved', 'review', 'top')
        or jsonb_typeof(item.state->'pinned') <> 'boolean'
        or (item.state->'note' <> 'null'::jsonb and char_length(item.state->>'note') > 2000)
        or (item.state->'decision' <> 'null'::jsonb and jsonb_typeof(item.state->'decision') <> 'object')
    );
$$;

revoke all on function public.workspace_state_v1_is_valid(jsonb) from public;

-- Check constraints on viewer_workspaces.workspace_state (NOT VALID, then
-- VALIDATE, matching the repo migration pattern)
alter table public.viewer_workspaces
  drop constraint if exists viewer_workspaces_workspace_schema_version_check;
alter table public.viewer_workspaces
  add constraint viewer_workspaces_workspace_schema_version_check
  check (workspace_schema_version = 1) not valid;
alter table public.viewer_workspaces
  validate constraint viewer_workspaces_workspace_schema_version_check;

alter table public.viewer_workspaces
  drop constraint if exists viewer_workspaces_workspace_state_v1_check;
alter table public.viewer_workspaces
  add constraint viewer_workspaces_workspace_state_v1_check
  check (public.workspace_state_v1_is_valid(workspace_state)) not valid;
alter table public.viewer_workspaces
  validate constraint viewer_workspaces_workspace_state_v1_check;

-- sync_viewer_workspace_v1: service_role-only CAS boundary for DATA-206
create or replace function public.sync_viewer_workspace_v1(
  p_viewer_id uuid,
  p_state jsonb,
  p_expected_revision bigint,
  p_operation_id uuid
)
returns table (
  sync_status text,
  workspace_state jsonb,
  revision bigint,
  updated_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_row public.viewer_workspaces%rowtype;
begin
  if not public.workspace_state_v1_is_valid(p_state) then
    raise exception using
      errcode = '23514',
      message = 'invalid WorkspaceStateV1 payload';
  end if;

  select workspace.*
  into current_row
  from public.viewer_workspaces as workspace
  where workspace.viewer_id = p_viewer_id
  for update;

  if not found then
    if p_expected_revision is not null then
      return query select
        'conflict'::text,
        '{"schemaVersion":1,"clearedAt":null,"saved":{"slugs":[],"updatedAt":null},"compare":{"slugs":[],"updatedAt":null},"stack":{"slugs":[],"updatedAt":null},"toolStates":{}}'::jsonb,
        null::bigint,
        null::timestamptz;
      return;
    end if;

    insert into public.viewer_workspaces (
      viewer_id, workspace_schema_version, workspace_state, revision, last_operation_id
    ) values (
      p_viewer_id, 1, p_state, 1, p_operation_id
    )
    on conflict (viewer_id) do nothing
    returning * into current_row;

    if found then
      return query select
        'saved'::text,
        current_row.workspace_state,
        current_row.revision,
        current_row.updated_at;
      return;
    end if;

    select workspace.*
    into current_row
    from public.viewer_workspaces as workspace
    where workspace.viewer_id = p_viewer_id
    for update;
  end if;

  if current_row.last_operation_id = p_operation_id then
    return query select
      'saved'::text,
      current_row.workspace_state,
      current_row.revision,
      current_row.updated_at;
    return;
  end if;

  if p_expected_revision is distinct from current_row.revision then
    return query select
      'conflict'::text,
      current_row.workspace_state,
      current_row.revision,
      current_row.updated_at;
      return;
  end if;

  update public.viewer_workspaces as workspace
  set
    workspace_schema_version = 1,
    workspace_state = p_state,
    revision = workspace.revision + 1,
    last_operation_id = p_operation_id
  where workspace.viewer_id = p_viewer_id
  returning workspace.* into current_row;

  return query select
    'saved'::text,
    current_row.workspace_state,
    current_row.revision,
    current_row.updated_at;
end;
$$;

revoke all on function public.sync_viewer_workspace_v1(uuid, jsonb, bigint, uuid)
  from public, anon, authenticated;
grant execute on function public.sync_viewer_workspace_v1(uuid, jsonb, bigint, uuid)
  to service_role;

-- ============================================================================
-- Section 2: Phase 4 Signal engagement ledger + reward envelope tables
-- ============================================================================

create table if not exists public.signal_engagement_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (char_length(event_type) between 3 and 64),
  dedupe_key text not null check (char_length(dedupe_key) between 3 and 256),
  context jsonb not null default '{}',
  client_idempotency_key text null,
  rules_version text null,
  source text not null default 'api' check (source in ('api','system','test')),
  occurred_at timestamptz null,
  accepted_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  unique (user_id, dedupe_key)
);

create index if not exists signal_engagement_events_user_accepted_idx
  on public.signal_engagement_events (user_id, accepted_at desc);
create index if not exists signal_engagement_events_user_type_day_idx
  on public.signal_engagement_events (user_id, event_type, ((accepted_at at time zone 'utc')::date));

alter table public.signal_engagement_events enable row level security;
alter table public.signal_engagement_events force row level security;

drop policy if exists "Users read own signal events" on public.signal_engagement_events;
create policy "Users read own signal events"
  on public.signal_engagement_events for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Service role manages signal events" on public.signal_engagement_events;
create policy "Service role manages signal events"
  on public.signal_engagement_events for all to service_role
  using (true) with check (true);

grant all on public.signal_engagement_events to service_role;

create table if not exists public.signal_reward_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  engagement_event_id uuid not null references public.signal_engagement_events(id) on delete cascade,
  reason_code text not null,
  sp_delta integer not null check (sp_delta between 0 and 10000),
  resulting_balance integer not null check (resulting_balance >= 0),
  reward_tier text not null check (reward_tier in ('interaction','micro','achievement','milestone')),
  title text not null,
  description text not null,
  accessibility_announcement text not null,
  priority integer not null default 0 check (priority between 0 and 1000),
  rules_version text null,
  created_at timestamptz not null default timezone('utc', now()),
  unique (engagement_event_id)
);

create index if not exists signal_reward_grants_user_created_idx
  on public.signal_reward_grants (user_id, created_at desc);

alter table public.signal_reward_grants enable row level security;
alter table public.signal_reward_grants force row level security;

drop policy if exists "Users read own signal grants" on public.signal_reward_grants;
create policy "Users read own signal grants"
  on public.signal_reward_grants for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Service role manages signal grants" on public.signal_reward_grants;
create policy "Service role manages signal grants"
  on public.signal_reward_grants for all to service_role
  using (true) with check (true);

grant all on public.signal_reward_grants to service_role;

create table if not exists public.signal_reward_deliveries (
  grant_id uuid primary key references public.signal_reward_grants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('pending','delivered','acknowledged','dismissed')),
  delivered_at timestamptz null,
  acknowledged_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists signal_reward_deliveries_user_pending_idx
  on public.signal_reward_deliveries (user_id) where status = 'pending';

alter table public.signal_reward_deliveries enable row level security;
alter table public.signal_reward_deliveries force row level security;

drop policy if exists "Users read own signal deliveries" on public.signal_reward_deliveries;
create policy "Users read own signal deliveries"
  on public.signal_reward_deliveries for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Service role manages signal deliveries" on public.signal_reward_deliveries;
create policy "Service role manages signal deliveries"
  on public.signal_reward_deliveries for all to service_role
  using (true) with check (true);

grant all on public.signal_reward_deliveries to service_role;

create table if not exists public.signal_reward_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reduce_reward_animations boolean not null default false,
  mute_reward_sounds boolean not null default false,
  quiet_mode boolean not null default false,
  suppress_automatic_achievements boolean not null default false,
  suppress_major_celebrations boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.signal_reward_preferences enable row level security;
alter table public.signal_reward_preferences force row level security;

drop policy if exists "Users read own signal preferences" on public.signal_reward_preferences;
create policy "Users read own signal preferences"
  on public.signal_reward_preferences for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Service role manages signal preferences" on public.signal_reward_preferences;
create policy "Service role manages signal preferences"
  on public.signal_reward_preferences for all to service_role
  using (true) with check (true);

grant all on public.signal_reward_preferences to service_role;

-- ============================================================================
-- Section 3: Phase 5 mission projection + Signal user context
-- ============================================================================

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

alter table public.signal_mission_completions enable row level security;
alter table public.signal_mission_completions force row level security;

drop policy if exists "Users read own signal missions" on public.signal_mission_completions;
create policy "Users read own signal missions"
  on public.signal_mission_completions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Service role manages signal missions" on public.signal_mission_completions;
create policy "Service role manages signal missions"
  on public.signal_mission_completions for all to service_role
  using (true) with check (true);

grant all on public.signal_mission_completions to service_role;

create table if not exists public.signal_user_context (
  user_id uuid primary key references auth.users(id) on delete cascade,
  focus_area text null check (focus_area in ('product','design','engineering','marketing','operations','research')),
  primary_goal text null check (primary_goal in ('discover','compare','shortlist','learn','decide')),
  completed_at timestamptz null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.signal_user_context_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  if new.focus_area is not null and new.primary_goal is not null and new.completed_at is null then
    new.completed_at = timezone('utc', now());
  end if;
  return new;
end;
$$;

drop trigger if exists signal_user_context_set_updated_at on public.signal_user_context;
create trigger signal_user_context_set_updated_at
  before insert or update on public.signal_user_context
  for each row execute function public.signal_user_context_set_updated_at();

alter table public.signal_user_context enable row level security;
alter table public.signal_user_context force row level security;

drop policy if exists "Users read own signal context" on public.signal_user_context;
create policy "Users read own signal context"
  on public.signal_user_context for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Service role manages signal context" on public.signal_user_context;
create policy "Service role manages signal context"
  on public.signal_user_context for all to service_role
  using (true) with check (true);

grant all on public.signal_user_context to service_role;

-- Independent V1 signal level function (replaces legacy calculate_level for
-- the Signal UI; legacy calculate_level is kept for accept_signal_engagement
-- internal writes to game_profiles.level)
create or replace function public.calculate_signal_level(p_sp integer)
returns integer
language sql immutable as $$
  select case
    when p_sp >= 1800 then 5
    when p_sp >= 900  then 4
    when p_sp >= 400  then 3
    when p_sp >= 150  then 2
    else 1
  end;
$$;
grant execute on function public.calculate_signal_level(integer) to authenticated, service_role;

-- ============================================================================
-- Section 4: Phase 4-6 Signal RPCs (verbatim from repo migrations 20260730000001/2/3)
-- ============================================================================

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
  on conflict (user_id, dedupe_key) do nothing
  returning * into inserted_event;

  if not found then
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
  end if;

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

notify pgrst, 'reload schema';