\set ON_ERROR_STOP on

-- Read-only checksum for synthetic local/staging datasets.
-- Execute with psql -X -tA so the output file contains only the JSON value.
with
schema_signature as (
  select encode(
    digest(
      coalesce(
        string_agg(
          concat_ws(
            '|',
            table_name,
            ordinal_position::text,
            column_name,
            data_type,
            udt_name,
            is_nullable,
            coalesce(column_default, '')
          ),
          E'\n'
          order by table_name, ordinal_position
        ),
        ''
      ),
      'sha256'
    ),
    'hex'
  ) as value
  from information_schema.columns
  where table_schema = 'public'
),
constraint_signature as (
  select encode(
    digest(
      coalesce(
        string_agg(
          concat_ws(
            '|',
            relation.relname,
            constraint_row.conname,
            constraint_row.contype::text,
            pg_get_constraintdef(constraint_row.oid, true)
          ),
          E'\n'
          order by relation.relname, constraint_row.conname
        ),
        ''
      ),
      'sha256'
    ),
    'hex'
  ) as value
  from pg_constraint constraint_row
  join pg_class relation on relation.oid = constraint_row.conrelid
  join pg_namespace namespace_row on namespace_row.oid = relation.relnamespace
  where namespace_row.nspname = 'public'
),
index_signature as (
  select encode(
    digest(
      coalesce(
        string_agg(
          concat_ws('|', tablename, indexname, indexdef),
          E'\n'
          order by tablename, indexname
        ),
        ''
      ),
      'sha256'
    ),
    'hex'
  ) as value
  from pg_indexes
  where schemaname = 'public'
),
policy_signature as (
  select encode(
    digest(
      coalesce(
        string_agg(
          concat_ws(
            '|',
            tablename,
            policyname,
            permissive,
            array_to_string(roles, ','),
            cmd,
            coalesce(qual, ''),
            coalesce(with_check, '')
          ),
          E'\n'
          order by tablename, policyname
        ),
        ''
      ),
      'sha256'
    ),
    'hex'
  ) as value
  from pg_policies
  where schemaname = 'public'
),
function_signature as (
  select encode(
    digest(
      coalesce(
        string_agg(
          pg_get_functiondef(procedure_row.oid),
          E'\n'
          order by procedure_row.proname, pg_get_function_identity_arguments(procedure_row.oid)
        ),
        ''
      ),
      'sha256'
    ),
    'hex'
  ) as value
  from pg_proc procedure_row
  join pg_namespace namespace_row on namespace_row.oid = procedure_row.pronamespace
  where namespace_row.nspname = 'public'
),
trigger_signature as (
  select encode(
    digest(
      coalesce(
        string_agg(
          concat_ws(
            '|',
            event_object_table,
            trigger_name,
            event_manipulation,
            action_timing,
            action_orientation,
            action_statement
          ),
          E'\n'
          order by event_object_table, trigger_name, event_manipulation
        ),
        ''
      ),
      'sha256'
    ),
    'hex'
  ) as value
  from information_schema.triggers
  where trigger_schema = 'public'
),
rls_signature as (
  select encode(
    digest(
      coalesce(
        string_agg(
          concat_ws(
            '|',
            relation.relname,
            relation.relrowsecurity::text,
            relation.relforcerowsecurity::text
          ),
          E'\n'
          order by relation.relname
        ),
        ''
      ),
      'sha256'
    ),
    'hex'
  ) as value
  from pg_class relation
  join pg_namespace namespace_row on namespace_row.oid = relation.relnamespace
  where namespace_row.nspname = 'public'
    and relation.relkind = 'r'
),
storage_signature as (
  select encode(
    digest(
      coalesce(
        string_agg(
          concat_ws(
            '|',
            bucket_row.id,
            bucket_row.name,
            bucket_row.public::text,
            coalesce(bucket_row.file_size_limit::text, ''),
            coalesce(array_to_string(bucket_row.allowed_mime_types, ','), '')
          ),
          E'\n'
          order by bucket_row.id
        ),
        ''
      ),
      'sha256'
    ),
    'hex'
  ) as value
  from storage.buckets bucket_row
  where bucket_row.id = 'editorial-media'
),
table_rows (table_name, row_count, row_sha256) as (
  select 'affiliate_links', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.affiliate_links row_value
  union all
  select 'affiliate_requests', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.affiliate_requests row_value
  union all
  select 'arena_battles', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.arena_battles row_value
  union all
  select 'badges', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.badges row_value
  union all
  select 'collection_safe_align_events', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.collection_safe_align_events row_value
  union all
  select 'collection_tool_slots', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.collection_tool_slots row_value
  union all
  select 'collection_transition_reviews', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.collection_transition_reviews row_value
  union all
  select 'collections', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.collections row_value
  union all
  select 'editorial_articles', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.editorial_articles row_value
  union all
  select 'game_mission_claims', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.game_mission_claims row_value
  union all
  select 'game_missions', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.game_missions row_value
  union all
  select 'game_profiles', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.user_id::text), ''), 'sha256'), 'hex') from public.game_profiles row_value
  union all
  select 'hidden_signal_claims', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.hidden_signal_claims row_value
  union all
  select 'leaderboard_snapshots', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.leaderboard_snapshots row_value
  union all
  select 'radar_predictions', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.radar_predictions row_value
  union all
  select 'tool_collections', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.tool_collections row_value
  union all
  select 'tool_requests', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.tool_requests row_value
  union all
  select 'tools', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.tools row_value
  union all
  select 'user_badges', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.user_badges row_value
  union all
  select 'waitlist', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.waitlist row_value
  union all
  select 'viewer_profiles', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.viewer_profiles row_value
  union all
  select 'viewer_tool_states', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.id::text), ''), 'sha256'), 'hex') from public.viewer_tool_states row_value
  union all
  select 'viewer_workspaces', count(*)::bigint, encode(digest(coalesce(string_agg(to_jsonb(row_value)::text, E'\n' order by row_value.viewer_id::text), ''), 'sha256'), 'hex') from public.viewer_workspaces row_value
)
select jsonb_build_object(
  'format_version', 1,
  'schema_sha256', (select value from schema_signature),
  'constraints_sha256', (select value from constraint_signature),
  'indexes_sha256', (select value from index_signature),
  'policies_sha256', (select value from policy_signature),
  'functions_sha256', (select value from function_signature),
  'triggers_sha256', (select value from trigger_signature),
  'rls_sha256', (select value from rls_signature),
  'storage_sha256', (select value from storage_signature),
  'tables',
  (
    select jsonb_agg(
      jsonb_build_object(
        'table', table_name,
        'row_count', row_count,
        'row_sha256', row_sha256
      )
      order by table_name
    )
    from table_rows
  )
)::text;
