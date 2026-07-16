-- Synthetic, non-sensitive fixture for the local Supabase stack only.
-- Never execute this file against production or a linked remote project.

begin;

set local statement_timeout = '15s';
set local lock_timeout = '5s';

insert into public.tools (
  id,
  name,
  slug,
  category,
  tags,
  short_description_it,
  description_it,
  website_url,
  tooolvibes_post_url,
  cover_image_url,
  source,
  date_discovered,
  is_featured,
  is_published,
  affiliate_url,
  created_at,
  updated_at
)
values (
  '10000000-0000-4000-8000-000000000001',
  'Fixture Tool',
  'fixture-tool',
  'Developer',
  array['fixture', 'local', 'qa']::text[],
  'Tool sintetico usato esclusivamente per verificare backup e restore locali.',
  'Questo record non rappresenta un prodotto reale e serve soltanto a verificare relazioni, checksum e ripristino del dataset TooolVibes.',
  'https://tool.example.invalid',
  'https://app.example.invalid/toools/fixture-tool',
  'https://images.example.invalid/fixture-tool.png',
  'fixture-local',
  '2026-01-15',
  false,
  true,
  'https://partner.example.invalid/fixture-tool',
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z'
)
on conflict (slug) do nothing;

insert into public.collections (
  id,
  title,
  slug,
  description,
  cover_image_url,
  cover_kicker,
  rationale,
  highlights,
  premium_teaser,
  theme,
  audience,
  difficulty,
  tone,
  access,
  editorial_state,
  surface,
  featured_slot,
  editorial_order,
  scheduled_for,
  first_published_at,
  published_at,
  archived_at,
  created_at,
  updated_at
)
values (
  '20000000-0000-4000-8000-000000000001',
  'Fixture Collection',
  'fixture-collection',
  'Raccolta sintetica usata per verificare relazioni e ripristino locale.',
  'https://images.example.invalid/fixture-collection.png',
  'Fixture locale',
  'Questa raccolta contiene esclusivamente dati fittizi e permette di verificare il restore delle relazioni editoriali senza usare dati reali.',
  array['Relazione tool', 'Ordine stabile']::text[],
  null,
  'founder-stack',
  'Solo founders',
  'starter',
  'starter-stack',
  'open',
  'published',
  'collection',
  null,
  900,
  null,
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z',
  null,
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z'
)
on conflict (slug) do nothing;

insert into public.collection_tool_slots (
  id,
  collection_id,
  tool_slug,
  role,
  note,
  featured,
  position,
  created_at
)
values (
  '21000000-0000-4000-8000-000000000001',
  '20000000-0000-4000-8000-000000000001',
  'fixture-tool',
  'Verifica',
  'Slot sintetico per il restore locale.',
  true,
  0,
  '2026-01-15T12:00:00Z'
)
on conflict (collection_id, tool_slug) do nothing;

insert into public.collection_transition_reviews (
  id,
  slug,
  review_state,
  note,
  reviewed_at,
  updated_at
)
values (
  '22000000-0000-4000-8000-000000000001',
  'fixture-collection',
  'reviewed',
  'Review sintetica per il restore locale.',
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z'
)
on conflict (slug) do nothing;

insert into public.collection_safe_align_events (
  id,
  slug,
  collection_id,
  source_from,
  source_to,
  aligned_fields,
  applied_at
)
values (
  '23000000-0000-4000-8000-000000000001',
  'fixture-collection',
  '20000000-0000-4000-8000-000000000001',
  'mock',
  'supabase',
  array['title', 'description']::text[],
  '2026-01-15T12:00:00Z'
)
on conflict (id) do nothing;

insert into public.viewer_profiles (
  id,
  access_token,
  kind,
  auth_user_id,
  last_seen_at,
  created_at,
  updated_at
)
values (
  '30000000-0000-4000-8000-000000000001',
  'fixture-local-viewer-token',
  'guest',
  null,
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z'
)
on conflict (id) do nothing;

insert into public.viewer_workspaces (
  viewer_id,
  compare_slugs,
  compare_updated_at,
  created_at,
  updated_at
)
values (
  '30000000-0000-4000-8000-000000000001',
  array['fixture-tool']::text[],
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z'
)
on conflict (viewer_id) do nothing;

insert into public.viewer_tool_states (
  id,
  viewer_id,
  tool_slug,
  is_saved,
  shortlist_stage,
  note,
  save_reason,
  is_pinned,
  created_at,
  updated_at
)
values (
  '31000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000001',
  'fixture-tool',
  true,
  'review',
  'Nota sintetica per il restore locale.',
  'test',
  true,
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z'
)
on conflict (viewer_id, tool_slug) do nothing;

insert into public.tool_requests (
  id,
  tool_name,
  tool_url,
  category,
  level,
  email,
  message,
  status,
  created_at,
  admin_notes,
  updated_at,
  submitter_type,
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
  '40000000-0000-4000-8000-000000000001',
  'Fixture Submission',
  'https://submission.example.invalid',
  'Developer',
  'beginner',
  'fixture-submission@example.invalid',
  'Messaggio sintetico usato esclusivamente nel restore locale.',
  'received',
  '2026-01-15T12:00:00Z',
  null,
  '2026-01-15T12:00:00Z',
  'founder',
  'Verifica del restore',
  'https://referral.example.invalid/fixture',
  'https://media.example.invalid/fixture.png',
  'Nota sintetica.',
  'Fixture Founder',
  'Tester',
  'prototype',
  'fixture',
  array['editorial-review']::text[]
)
on conflict (id) do nothing;

insert into public.affiliate_links (
  id,
  tool_id,
  label,
  destination_url,
  tracking_url,
  campaign,
  source,
  medium,
  is_active,
  created_at,
  updated_at
)
values (
  '50000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Fixture link',
  'https://partner.example.invalid/fixture-tool',
  'https://tracking.example.invalid/fixture-tool',
  'fixture-campaign',
  'fixture-local',
  'test',
  true,
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z'
)
on conflict (id) do nothing;

insert into public.affiliate_requests (
  id,
  first_name,
  last_name,
  email,
  brand_name,
  website_url,
  audience,
  channels,
  message,
  status,
  admin_notes,
  referral_code,
  referral_url,
  approved_at,
  rejected_at,
  created_at,
  updated_at
)
values (
  '51000000-0000-4000-8000-000000000001',
  'Fixture',
  'User',
  'fixture-affiliate@example.invalid',
  'Fixture Brand',
  'https://brand.example.invalid',
  'Synthetic audience',
  'Synthetic channel',
  'Richiesta sintetica per il restore locale.',
  'received',
  null,
  'fixture-local-code',
  'https://referral.example.invalid/fixture-local-code',
  null,
  null,
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z'
)
on conflict (id) do nothing;

insert into public.waitlist (
  id,
  email,
  source,
  consent_version,
  consent_at,
  status,
  created_at,
  retention_expires_at
)
values (
  '52000000-0000-4000-8000-000000000001',
  'fixture-waitlist@example.invalid',
  'coming-soon',
  'waitlist-v1',
  '2026-01-15T12:00:00Z',
  'pending',
  '2026-01-15T12:00:00Z',
  '2028-01-15T12:00:00Z'
)
on conflict (email) do nothing;


insert into public.editorial_articles (
  id,
  slug,
  title,
  dek,
  summary,
  kind,
  status,
  content_markdown,
  cover_image_url,
  cover_image_alt,
  author_name,
  tags,
  published_at,
  is_featured,
  created_at,
  updated_at
)
values (
  '60000000-0000-4000-8000-000000000001',
  'fixture-article',
  'Fixture Article',
  'Articolo sintetico per verificare il ripristino editoriale locale.',
  'Questo contenuto fittizio verifica checksum, vincoli e restore senza dati reali.',
  'editorial',
  'published',
  '# Fixture Article' || E'\n\n' || 'Contenuto sintetico.',
  'https://images.example.invalid/fixture-article.png',
  'Immagine sintetica',
  'TooolVibes Fixture',
  array['fixture', 'restore']::text[],
  '2026-01-15',
  false,
  '2026-01-15T12:00:00Z',
  '2026-01-15T12:00:00Z'
)
on conflict (slug) do nothing;

commit;
