-- DATA-206 forward fix: preserve compare-only legacy workspaces, make the
-- WorkspaceStateV1 validator fail closed, and reassert the service-only RPC
-- boundary. Historical migrations intentionally remain unchanged.

-- A strict remote capacity is intentionally smaller than the lossless local
-- model. Preserve every pre-existing oversized snapshot before deterministically
-- reducing the live copy, so the constraint upgrade can never make the whole
-- migration fail or silently destroy the overflow.
create table if not exists public.viewer_workspace_state_quarantine (
  id uuid primary key default gen_random_uuid(),
  viewer_id uuid not null,
  source_revision bigint not null,
  reason text not null,
  workspace_state jsonb not null,
  quarantined_at timestamptz not null default timezone('utc', now()),
  unique (viewer_id, source_revision, reason)
);

alter table public.viewer_workspace_state_quarantine enable row level security;
drop policy if exists "Service role can manage workspace state quarantine"
  on public.viewer_workspace_state_quarantine;
create policy "Service role can manage workspace state quarantine"
on public.viewer_workspace_state_quarantine
for all
to service_role
using (true)
with check (true);
revoke all privileges on table public.viewer_workspace_state_quarantine
  from public, anon, authenticated;
grant all privileges on table public.viewer_workspace_state_quarantine
  to service_role;

insert into public.viewer_workspace_state_quarantine (
  viewer_id,
  source_revision,
  reason,
  workspace_state
)
select
  workspace.viewer_id,
  workspace.revision,
  'workspace-state-v1-capacity-overflow',
  workspace.workspace_state
from public.viewer_workspaces as workspace
where
  case
    when jsonb_typeof(workspace.workspace_state->'saved'->'slugs') = 'array'
    then jsonb_array_length(workspace.workspace_state->'saved'->'slugs')
    else 0
  end > 500
  or case
    when jsonb_typeof(workspace.workspace_state->'stack'->'slugs') = 'array'
    then jsonb_array_length(workspace.workspace_state->'stack'->'slugs')
    else 0
  end > 500
  or case
    when jsonb_typeof(workspace.workspace_state->'toolStates') = 'object'
    then (
      select count(*)
      from jsonb_object_keys(workspace.workspace_state->'toolStates')
    )
    else 0
  end > 500
on conflict (viewer_id, source_revision, reason) do nothing;

with capacity_repair as (
  select
    workspace.viewer_id,
    case
      when jsonb_typeof(workspace.workspace_state->'saved'->'slugs') = 'array'
        and jsonb_array_length(workspace.workspace_state->'saved'->'slugs') > 500
      then coalesce(
        (
          select jsonb_agg(retained.value order by retained.ordinality)
          from (
            select item.value, item.ordinality
            from jsonb_array_elements(
              workspace.workspace_state->'saved'->'slugs'
            ) with ordinality as item(value, ordinality)
            order by item.ordinality
            limit 500
          ) as retained
        ),
        '[]'::jsonb
      )
      else workspace.workspace_state->'saved'->'slugs'
    end as saved_slugs,
    case
      when jsonb_typeof(workspace.workspace_state->'stack'->'slugs') = 'array'
        and jsonb_array_length(workspace.workspace_state->'stack'->'slugs') > 500
      then coalesce(
        (
          select jsonb_agg(retained.value order by retained.ordinality)
          from (
            select item.value, item.ordinality
            from jsonb_array_elements(
              workspace.workspace_state->'stack'->'slugs'
            ) with ordinality as item(value, ordinality)
            order by item.ordinality
            limit 500
          ) as retained
        ),
        '[]'::jsonb
      )
      else workspace.workspace_state->'stack'->'slugs'
    end as stack_slugs,
    case
      when jsonb_typeof(workspace.workspace_state->'toolStates') = 'object'
        and (
          select count(*)
          from jsonb_object_keys(workspace.workspace_state->'toolStates')
        ) > 500
      then coalesce(
        (
          select jsonb_object_agg(retained.key, retained.value)
          from (
            select item.key, item.value
            from jsonb_each(
              workspace.workspace_state->'toolStates'
            ) as item(key, value)
            order by
              greatest(
                coalesce(item.value->>'updatedAt', ''),
                coalesce(item.value->'decision'->>'updatedAt', '')
              ) desc,
              item.key
            limit 500
          ) as retained
        ),
        '{}'::jsonb
      )
      else workspace.workspace_state->'toolStates'
    end as tool_states
  from public.viewer_workspaces as workspace
  where exists (
    select 1
    from public.viewer_workspace_state_quarantine as quarantine
    where quarantine.viewer_id = workspace.viewer_id
      and quarantine.source_revision = workspace.revision
      and quarantine.reason = 'workspace-state-v1-capacity-overflow'
  )
)
update public.viewer_workspaces as workspace
set
  workspace_state = jsonb_set(
    jsonb_set(
      jsonb_set(
        workspace.workspace_state,
        '{saved,slugs}',
        capacity_repair.saved_slugs,
        false
      ),
      '{stack,slugs}',
      capacity_repair.stack_slugs,
      false
    ),
    '{toolStates}',
    capacity_repair.tool_states,
    false
  ),
  revision = workspace.revision + 1,
  last_operation_id = null
from capacity_repair
where capacity_repair.viewer_id = workspace.viewer_id;

comment on table public.viewer_workspace_state_quarantine is
  'Service-only lossless backup of canonical workspace snapshots repaired during strict schema upgrades.';

-- Run this repair while the validator from DATA-206 is still active. Replacing
-- the function below also changes the semantics of the existing CHECK, so
-- invalid legacy compare strings must be removed before that replacement.
with normalized_compare as (
  select
    workspace.viewer_id,
    coalesce(
      (
        select jsonb_agg(candidate.slug order by candidate.first_ordinal)
        from (
          select
            btrim(item.value #>> '{}') as slug,
            min(item.ordinality) as first_ordinal
          from jsonb_array_elements(
            workspace.workspace_state->'compare'->'slugs'
          ) with ordinality as item(value, ordinality)
          where jsonb_typeof(item.value) = 'string'
            and char_length(btrim(item.value #>> '{}')) between 1 and 120
            and btrim(item.value #>> '{}') ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
          group by btrim(item.value #>> '{}')
          order by min(item.ordinality)
          limit 5
        ) as candidate
      ),
      '[]'::jsonb
    ) as slugs
  from public.viewer_workspaces as workspace
  where jsonb_typeof(workspace.workspace_state->'compare'->'slugs') = 'array'
)
update public.viewer_workspaces as workspace
set workspace_state = jsonb_set(
  workspace.workspace_state,
  '{compare,slugs}',
  normalized_compare.slugs,
  true
)
from normalized_compare
where normalized_compare.viewer_id = workspace.viewer_id
  and workspace.workspace_state->'compare'->'slugs'
    is distinct from normalized_compare.slugs;

create or replace function public.workspace_state_v1_is_valid(input jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  list_name text;
  list_value jsonb;
  list_count bigint;
  distinct_list_count bigint;
  tool_slug text;
  tool_state jsonb;
  decision_state jsonb;
  timestamp_pattern constant text :=
    '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$';
  slug_pattern constant text := '^[a-z0-9]+(-[a-z0-9]+)*$';
begin
  if input is null
    or jsonb_typeof(input) <> 'object'
    or (select count(*) from jsonb_object_keys(input)) <> 6
    or not (
      input ?& array[
        'schemaVersion',
        'clearedAt',
        'saved',
        'compare',
        'stack',
        'toolStates'
      ]
    )
  then
    return false;
  end if;

  if input->'schemaVersion' <> '1'::jsonb then
    return false;
  end if;

  if jsonb_typeof(input->'clearedAt') not in ('null', 'string')
    or (
      jsonb_typeof(input->'clearedAt') = 'string'
      and (input->>'clearedAt') !~ timestamp_pattern
    )
  then
    return false;
  end if;

  foreach list_name in array array['saved', 'compare', 'stack']
  loop
    list_value := input->list_name;

    if jsonb_typeof(list_value) <> 'object'
      or (select count(*) from jsonb_object_keys(list_value)) <> 2
      or not (list_value ?& array['slugs', 'updatedAt'])
      or jsonb_typeof(list_value->'slugs') <> 'array'
      or jsonb_typeof(list_value->'updatedAt') not in ('null', 'string')
    then
      return false;
    end if;

    if jsonb_typeof(list_value->'updatedAt') = 'string'
      and (list_value->>'updatedAt') !~ timestamp_pattern
    then
      return false;
    end if;

    if list_name = 'compare'
      and jsonb_array_length(list_value->'slugs') > 5
    then
      return false;
    end if;

    if list_name <> 'compare'
      and jsonb_array_length(list_value->'slugs') > 500
    then
      return false;
    end if;

    if exists (
      select 1
      from jsonb_array_elements(list_value->'slugs') as item(value)
      where jsonb_typeof(item.value) <> 'string'
        or char_length(item.value #>> '{}') not between 1 and 120
        or (item.value #>> '{}') !~ slug_pattern
    )
    then
      return false;
    end if;

    select count(*), count(distinct item.value #>> '{}')
    into list_count, distinct_list_count
    from jsonb_array_elements(list_value->'slugs') as item(value);

    if list_count <> distinct_list_count then
      return false;
    end if;
  end loop;

  if jsonb_typeof(input->'toolStates') <> 'object'
    or (select count(*) from jsonb_object_keys(input->'toolStates')) > 500
  then
    return false;
  end if;

  for tool_slug, tool_state in
    select item.key, item.value
    from jsonb_each(input->'toolStates') as item(key, value)
  loop
    if char_length(tool_slug) not between 1 and 120
      or tool_slug !~ slug_pattern
      or jsonb_typeof(tool_state) <> 'object'
      or (select count(*) from jsonb_object_keys(tool_state)) <> 6
      or not (
        tool_state ?& array[
          'stage',
          'note',
          'saveReason',
          'pinned',
          'decision',
          'updatedAt'
        ]
      )
    then
      return false;
    end if;

    if jsonb_typeof(tool_state->'stage') <> 'string'
      or (tool_state->>'stage') not in ('saved', 'review', 'top')
      or jsonb_typeof(tool_state->'note') not in ('null', 'string')
      or (
        jsonb_typeof(tool_state->'note') = 'string'
        and char_length(btrim(tool_state->>'note')) not between 1 and 2000
      )
      or jsonb_typeof(tool_state->'saveReason') not in ('null', 'string')
      or (
        jsonb_typeof(tool_state->'saveReason') = 'string'
        and (tool_state->>'saveReason') not in (
          'test',
          'compare',
          'design-fit',
          'marketing-fit',
          'client-project',
          'observe'
        )
      )
      or jsonb_typeof(tool_state->'pinned') <> 'boolean'
      or jsonb_typeof(tool_state->'updatedAt') not in ('null', 'string')
      or (
        jsonb_typeof(tool_state->'updatedAt') = 'string'
        and (tool_state->>'updatedAt') !~ timestamp_pattern
      )
    then
      return false;
    end if;

    decision_state := tool_state->'decision';
    if jsonb_typeof(decision_state) not in ('null', 'object') then
      return false;
    end if;

    if jsonb_typeof(decision_state) = 'object' then
      if (select count(*) from jsonb_object_keys(decision_state)) <> 2
        or not (decision_state ?& array['outcome', 'updatedAt'])
        or jsonb_typeof(decision_state->'outcome') not in ('null', 'string')
        or (
          jsonb_typeof(decision_state->'outcome') = 'string'
          and (decision_state->>'outcome') not in (
            'selected',
            'rejected',
            'deferred'
          )
        )
        or jsonb_typeof(decision_state->'updatedAt') <> 'string'
        or (decision_state->>'updatedAt') !~ timestamp_pattern
      then
        return false;
      end if;
    end if;
  end loop;

  return true;
exception
  when others then
    return false;
end;
$$;

-- The previous aggregate-driven update skipped viewer_workspaces rows that
-- contained legacy compare data but no viewer_tool_states rows. Limit the
-- repair to the untouched migration signature so later canonical writes are
-- never overwritten.
update public.viewer_workspaces as workspace
set
  workspace_schema_version = 1,
  workspace_state = jsonb_build_object(
    'schemaVersion', 1,
    'clearedAt', null,
    'saved', jsonb_build_object('slugs', '[]'::jsonb, 'updatedAt', null),
    'compare', jsonb_build_object(
      'slugs', coalesce(
        (
          select jsonb_agg(candidate.slug order by candidate.first_ordinal)
          from (
            select
              btrim(item.slug) as slug,
              min(item.ordinality) as first_ordinal
            from unnest(workspace.compare_slugs)
              with ordinality as item(slug, ordinality)
            where char_length(btrim(item.slug)) between 1 and 120
              and btrim(item.slug) ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
            group by btrim(item.slug)
            order by min(item.ordinality)
            limit 5
          ) as candidate
        ),
        '[]'::jsonb
      ),
      'updatedAt', workspace.compare_updated_at
    ),
    'stack', jsonb_build_object('slugs', '[]'::jsonb, 'updatedAt', null),
    'toolStates', '{}'::jsonb
  ),
  revision = greatest(workspace.revision, 1)
where coalesce(array_length(workspace.compare_slugs, 1), 0) > 0
  and workspace.revision = 0
  and workspace.last_operation_id is null
  and workspace.workspace_state =
    '{"schemaVersion":1,"clearedAt":null,"saved":{"slugs":[],"updatedAt":null},"compare":{"slugs":[],"updatedAt":null},"stack":{"slugs":[],"updatedAt":null},"toolStates":{}}'::jsonb
  and not exists (
    select 1
    from public.viewer_tool_states as tool_state
    where tool_state.viewer_id = workspace.viewer_id
  );

-- The stricter validator treats an empty or whitespace-only note exactly as
-- the client normalizer does: null. Normalize historical rows before the
-- constraint is validated so one legacy note cannot block the forward fix.
update public.viewer_workspaces as workspace
set workspace_state = jsonb_set(
  workspace.workspace_state,
  '{toolStates}',
  coalesce(
    (
      select jsonb_object_agg(
        item.key,
        case
          when jsonb_typeof(item.value->'note') = 'string'
            and btrim(item.value->>'note') = ''
          then jsonb_set(item.value, '{note}', 'null'::jsonb, true)
          else item.value
        end
      )
      from jsonb_each(workspace.workspace_state->'toolStates') as item(key, value)
    ),
    '{}'::jsonb
  ),
  true
)
where jsonb_typeof(workspace.workspace_state->'toolStates') = 'object'
  and exists (
    select 1
    from jsonb_each(workspace.workspace_state->'toolStates') as item(key, value)
    where jsonb_typeof(item.value->'note') = 'string'
      and btrim(item.value->>'note') = ''
  );

alter table public.viewer_workspaces
  drop constraint if exists viewer_workspaces_workspace_state_v1_check;
alter table public.viewer_workspaces
  add constraint viewer_workspaces_workspace_state_v1_check
  check (public.workspace_state_v1_is_valid(workspace_state) is true) not valid;
alter table public.viewer_workspaces
  validate constraint viewer_workspaces_workspace_state_v1_check;

-- Canonical workspace mutation is an API/service-role boundary. RLS alone
-- would still let an authenticated browser bypass CAS, validation orchestration
-- and rate limits by writing its own row directly.
drop policy if exists "Authenticated users can manage own viewer workspace"
  on public.viewer_workspaces;
drop policy if exists "Authenticated users can manage own viewer tool states"
  on public.viewer_tool_states;
revoke all privileges on table public.viewer_workspaces
  from anon, authenticated;
revoke all privileges on table public.viewer_tool_states
  from anon, authenticated;
grant all privileges on table public.viewer_workspaces to service_role;
grant all privileges on table public.viewer_tool_states to service_role;

revoke all on function public.workspace_state_v1_is_valid(jsonb)
  from public, anon, authenticated;
grant execute on function public.workspace_state_v1_is_valid(jsonb)
  to service_role;

revoke all on function public.sync_viewer_workspace_v1(uuid, jsonb, bigint, uuid)
  from public, anon, authenticated;
grant execute on function public.sync_viewer_workspace_v1(uuid, jsonb, bigint, uuid)
  to service_role;

comment on function public.workspace_state_v1_is_valid(jsonb) is
  'Fail-closed strict validator for the complete canonical WorkspaceStateV1 contract.';
