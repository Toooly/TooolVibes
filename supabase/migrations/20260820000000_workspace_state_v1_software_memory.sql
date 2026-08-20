-- Forward-only loosening of workspace_state_v1_is_valid.
-- Accepts legacy payloads and optional Software Memory extras:
-- toolStates.usage / replacedBy / compareObjective.
-- Existing rows remain valid. No data rewrite.

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
  stack_item jsonb;
  stack_count bigint;
  key_count bigint;
  timestamp_pattern constant text :=
    '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$';
  slug_pattern constant text := '^[a-z0-9]+(-[a-z0-9]+)*$';
begin
  if input is null
    or jsonb_typeof(input) <> 'object'
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

  select count(*) into key_count from jsonb_object_keys(input);
  if key_count < 6
    or key_count > 7
    or (
      key_count = 7
      and not (input ? 'personalStacks')
    )
    or exists (
      select 1
      from jsonb_object_keys(input) as keys(key)
      where keys.key not in (
        'schemaVersion',
        'clearedAt',
        'saved',
        'compare',
        'stack',
        'toolStates',
        'personalStacks'
      )
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

  if input ? 'personalStacks' then
    if jsonb_typeof(input->'personalStacks') <> 'array'
      or jsonb_array_length(input->'personalStacks') > 30
    then
      return false;
    end if;

    for stack_item in
      select item.value
      from jsonb_array_elements(input->'personalStacks') as item(value)
    loop
      if jsonb_typeof(stack_item) <> 'object'
        or not (
          stack_item ?& array[
            'id',
            'name',
            'description',
            'slugs',
            'archivedAt',
            'updatedAt'
          ]
        )
        or exists (
          select 1
          from jsonb_object_keys(stack_item) as keys(key)
          where keys.key not in (
            'id',
            'name',
            'description',
            'slugs',
            'archivedAt',
            'updatedAt'
          )
        )
        or jsonb_typeof(stack_item->'id') <> 'string'
        or (stack_item->>'id') !~ slug_pattern
        or char_length(stack_item->>'id') not between 1 and 120
        or jsonb_typeof(stack_item->'name') <> 'string'
        or char_length(btrim(stack_item->>'name')) not between 1 and 80
        or jsonb_typeof(stack_item->'description') not in ('null', 'string')
        or (
          jsonb_typeof(stack_item->'description') = 'string'
          and char_length(btrim(stack_item->>'description')) not between 1 and 280
        )
        or jsonb_typeof(stack_item->'slugs') <> 'array'
        or jsonb_array_length(stack_item->'slugs') > 500
        or jsonb_typeof(stack_item->'archivedAt') not in ('null', 'string')
        or (
          jsonb_typeof(stack_item->'archivedAt') = 'string'
          and (stack_item->>'archivedAt') !~ timestamp_pattern
        )
        or jsonb_typeof(stack_item->'updatedAt') not in ('null', 'string')
        or (
          jsonb_typeof(stack_item->'updatedAt') = 'string'
          and (stack_item->>'updatedAt') !~ timestamp_pattern
        )
      then
        return false;
      end if;

      if exists (
        select 1
        from jsonb_array_elements(stack_item->'slugs') as item(value)
        where jsonb_typeof(item.value) <> 'string'
          or char_length(item.value #>> '{}') not between 1 and 120
          or (item.value #>> '{}') !~ slug_pattern
      )
      then
        return false;
      end if;

      select count(*), count(distinct item.value #>> '{}')
      into list_count, distinct_list_count
      from jsonb_array_elements(stack_item->'slugs') as item(value);

      if list_count <> distinct_list_count then
        return false;
      end if;
    end loop;

    select count(*), count(distinct item.value->>'id')
    into stack_count, distinct_list_count
    from jsonb_array_elements(input->'personalStacks') as item(value);

    if stack_count <> distinct_list_count then
      return false;
    end if;
  end if;

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
      or exists (
        select 1
        from jsonb_object_keys(tool_state) as keys(key)
        where keys.key not in (
          'stage',
          'note',
          'saveReason',
          'pinned',
          'decision',
          'updatedAt',
          'useCase',
          'alternatives',
          'revisitAt',
          'usage',
          'replacedBy',
          'compareObjective'
        )
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

    if tool_state ? 'useCase'
      and (
        jsonb_typeof(tool_state->'useCase') not in ('null', 'string')
        or (
          jsonb_typeof(tool_state->'useCase') = 'string'
          and char_length(btrim(tool_state->>'useCase')) not between 1 and 200
        )
      )
    then
      return false;
    end if;

    if tool_state ? 'alternatives' then
      if jsonb_typeof(tool_state->'alternatives') <> 'array'
        or jsonb_array_length(tool_state->'alternatives') > 5
        or exists (
          select 1
          from jsonb_array_elements(tool_state->'alternatives') as item(value)
          where jsonb_typeof(item.value) <> 'string'
            or char_length(item.value #>> '{}') not between 1 and 120
            or (item.value #>> '{}') !~ slug_pattern
        )
      then
        return false;
      end if;
    end if;

    if tool_state ? 'revisitAt'
      and (
        jsonb_typeof(tool_state->'revisitAt') not in ('null', 'string')
        or (
          jsonb_typeof(tool_state->'revisitAt') = 'string'
          and (tool_state->>'revisitAt') !~ timestamp_pattern
        )
      )
    then
      return false;
    end if;

    if tool_state ? 'usage'
      and (
        jsonb_typeof(tool_state->'usage') not in ('null', 'string')
        or (
          jsonb_typeof(tool_state->'usage') = 'string'
          and (tool_state->>'usage') not in (
            'using',
            'stopped',
            'replaced'
          )
        )
      )
    then
      return false;
    end if;

    if tool_state ? 'replacedBy'
      and (
        jsonb_typeof(tool_state->'replacedBy') not in ('null', 'string')
        or (
          jsonb_typeof(tool_state->'replacedBy') = 'string'
          and (
            char_length(tool_state->>'replacedBy') not between 1 and 120
            or (tool_state->>'replacedBy') !~ slug_pattern
          )
        )
      )
    then
      return false;
    end if;

    if tool_state ? 'compareObjective'
      and (
        jsonb_typeof(tool_state->'compareObjective') not in ('null', 'string')
        or (
          jsonb_typeof(tool_state->'compareObjective') = 'string'
          and (tool_state->>'compareObjective') not in (
            'save-time',
            'quality',
            'save-money',
            'learn-fast',
            'collaborate',
            'scale',
            'experiment'
          )
        )
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

comment on function public.workspace_state_v1_is_valid(jsonb) is
  'WorkspaceStateV1 validator. Accepts legacy 6-key payloads and optional personalStacks / journal / software-memory extras.';
