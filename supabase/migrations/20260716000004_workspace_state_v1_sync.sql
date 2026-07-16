-- DATA-206: additive canonical workspace snapshot + optimistic CAS.
-- This migration preserves the legacy projection columns/tables for rollback.

create or replace function public.workspace_state_v1_is_valid(input jsonb)
returns boolean
language sql
immutable
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

alter table public.viewer_workspaces
  add column if not exists workspace_schema_version integer not null default 1,
  add column if not exists workspace_state jsonb not null default
    '{"schemaVersion":1,"clearedAt":null,"saved":{"slugs":[],"updatedAt":null},"compare":{"slugs":[],"updatedAt":null},"stack":{"slugs":[],"updatedAt":null},"toolStates":{}}'::jsonb,
  add column if not exists revision bigint not null default 0,
  add column if not exists last_operation_id uuid null;

alter table public.viewer_workspaces
  drop constraint if exists viewer_workspaces_compare_slugs_check;
alter table public.viewer_workspaces
  add constraint viewer_workspaces_compare_slugs_check
  check (coalesce(array_length(compare_slugs, 1), 0) <= 5) not valid;
alter table public.viewer_workspaces
  validate constraint viewer_workspaces_compare_slugs_check;

insert into public.viewer_workspaces (viewer_id)
select distinct viewer_id
from public.viewer_tool_states
on conflict (viewer_id) do nothing;

with tool_state_aggregate as (
  select
    viewer_id,
    coalesce(
      jsonb_agg(tool_slug order by updated_at, tool_slug) filter (where is_saved),
      '[]'::jsonb
    ) as saved_slugs,
    max(updated_at) filter (where is_saved) as saved_updated_at,
    jsonb_object_agg(
      tool_slug,
      jsonb_build_object(
        'stage', shortlist_stage,
        'note', note,
        'saveReason', save_reason,
        'pinned', is_pinned,
        'decision', null,
        'updatedAt', updated_at
      )
      order by tool_slug
    ) as tool_states
  from public.viewer_tool_states
  group by viewer_id
)
update public.viewer_workspaces as workspace
set
  workspace_schema_version = 1,
  workspace_state = jsonb_build_object(
    'schemaVersion', 1,
    'clearedAt', null,
    'saved', jsonb_build_object(
      'slugs', coalesce(aggregate.saved_slugs, '[]'::jsonb),
      'updatedAt', aggregate.saved_updated_at
    ),
    'compare', jsonb_build_object(
      'slugs', to_jsonb(workspace.compare_slugs),
      'updatedAt', workspace.compare_updated_at
    ),
    'stack', jsonb_build_object('slugs', '[]'::jsonb, 'updatedAt', null),
    'toolStates', coalesce(aggregate.tool_states, '{}'::jsonb)
  ),
  revision = case
    when coalesce(jsonb_array_length(aggregate.saved_slugs), 0) > 0
      or coalesce(array_length(workspace.compare_slugs, 1), 0) > 0
      or aggregate.tool_states <> '{}'::jsonb
    then greatest(workspace.revision, 1)
    else workspace.revision
  end
from tool_state_aggregate as aggregate
where aggregate.viewer_id = workspace.viewer_id;

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

revoke all on function public.workspace_state_v1_is_valid(jsonb) from public;
revoke all on function public.sync_viewer_workspace_v1(uuid, jsonb, bigint, uuid) from public;
revoke all on function public.sync_viewer_workspace_v1(uuid, jsonb, bigint, uuid) from anon, authenticated;
grant execute on function public.workspace_state_v1_is_valid(jsonb) to service_role;
grant execute on function public.sync_viewer_workspace_v1(uuid, jsonb, bigint, uuid) to service_role;

comment on column public.viewer_workspaces.workspace_state is
  'Canonical WorkspaceStateV1 snapshot. Legacy projection columns remain rollback-only.';
comment on column public.viewer_workspaces.revision is
  'Monotonic compare-and-swap revision for canonical workspace synchronization.';
comment on function public.sync_viewer_workspace_v1(uuid, jsonb, bigint, uuid) is
  'Service-only idempotent CAS boundary for DATA-206; browser clients must use application APIs.';
