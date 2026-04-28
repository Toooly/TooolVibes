-- TooolVibes seed chunk 6: tools 26-30

insert into public.tools (id, name, slug, category, tags, short_description_it, description_it, website_url, tooolvibes_post_url, cover_image_url, source, date_discovered, is_featured, is_published)
values (
  '619dbf6f-c950-4e2c-a351-e21039091f0e',
  'Make',
  'make',
  'Automation / Workflow Builder',
  array['automation', 'workflow', 'integrations', 'api', 'no-code']::text[],
  'Piattaforma visuale per creare automazioni, workflow e integrazioni tra app/API.',
  'Make permette di progettare automazioni visuali tra app, API e dati, con una potenza superiore ai flussi semplici quando serve orchestrare processi reali.',
  'https://www.make.com/en/register?pc=imaketoool',
  'https://tooolvibes.com/all-tools/makecom_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-02-02',
  false,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  tags = excluded.tags,
  short_description_it = excluded.short_description_it,
  description_it = excluded.description_it,
  website_url = excluded.website_url,
  tooolvibes_post_url = excluded.tooolvibes_post_url,
  cover_image_url = excluded.cover_image_url,
  source = excluded.source,
  date_discovered = excluded.date_discovered,
  is_featured = excluded.is_featured,
  is_published = true,
  updated_at = timezone('utc', now());

insert into public.tools (id, name, slug, category, tags, short_description_it, description_it, website_url, tooolvibes_post_url, cover_image_url, source, date_discovered, is_featured, is_published)
values (
  '02c8c140-b7a5-48d0-8022-59ffe3108a8e',
  'Omi',
  'omi',
  'AI Wearable / Personal AI',
  array['wearable', 'personal ai', 'transcription', 'memory', 'open-source']::text[],
  'Wearable AI open-source che registra, trascrive, ricorda e trasforma conversazioni in azioni.',
  'Omi porta l''AI personale su un dispositivo wearable, con trascrizione, memoria e azioni generate dalle conversazioni quotidiane.',
  'https://www.omi.me/',
  'https://tooolvibes.com/all-tools/omi-app-ai',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-02-03',
  false,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  tags = excluded.tags,
  short_description_it = excluded.short_description_it,
  description_it = excluded.description_it,
  website_url = excluded.website_url,
  tooolvibes_post_url = excluded.tooolvibes_post_url,
  cover_image_url = excluded.cover_image_url,
  source = excluded.source,
  date_discovered = excluded.date_discovered,
  is_featured = excluded.is_featured,
  is_published = true,
  updated_at = timezone('utc', now());

insert into public.tools (id, name, slug, category, tags, short_description_it, description_it, website_url, tooolvibes_post_url, cover_image_url, source, date_discovered, is_featured, is_published)
values (
  'af233a7b-170b-42dc-8d0d-95403635025e',
  'Flowise',
  'flowise',
  'AI Agents / LangChain / Workflow AI',
  array['ai agents', 'langchain', 'rag', 'open-source', 'workflow ai']::text[],
  'Builder visuale open-source per creare agenti AI, RAG, chatflow e workflow LangChain.',
  'Flowise è un builder visuale per creare flussi AI, agenti, RAG e workflow basati su LangChain con maggiore controllo tecnico.',
  'https://flowiseai.com/',
  'https://tooolvibes.com/all-tools/flowise-ai_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-02-04',
  false,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  tags = excluded.tags,
  short_description_it = excluded.short_description_it,
  description_it = excluded.description_it,
  website_url = excluded.website_url,
  tooolvibes_post_url = excluded.tooolvibes_post_url,
  cover_image_url = excluded.cover_image_url,
  source = excluded.source,
  date_discovered = excluded.date_discovered,
  is_featured = excluded.is_featured,
  is_published = true,
  updated_at = timezone('utc', now());

insert into public.tools (id, name, slug, category, tags, short_description_it, description_it, website_url, tooolvibes_post_url, cover_image_url, source, date_discovered, is_featured, is_published)
values (
  '4472072f-1879-449f-94ca-ebefd1f2001a',
  'Tolt',
  'tolt',
  'Affiliate Marketing / SaaS',
  array['affiliate', 'referral', 'saas', 'stripe', 'paddle']::text[],
  'Software affiliate/referral per startup SaaS, integrabile con Stripe, Paddle e Chargebee.',
  'Tolt aiuta startup SaaS a creare programmi affiliate e referral, collegandosi a sistemi di pagamento e tracciando partner, commissioni e performance.',
  'https://tolt.com/',
  'https://tooolvibes.com/all-tools/tolt_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-02-05',
  false,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  tags = excluded.tags,
  short_description_it = excluded.short_description_it,
  description_it = excluded.description_it,
  website_url = excluded.website_url,
  tooolvibes_post_url = excluded.tooolvibes_post_url,
  cover_image_url = excluded.cover_image_url,
  source = excluded.source,
  date_discovered = excluded.date_discovered,
  is_featured = excluded.is_featured,
  is_published = true,
  updated_at = timezone('utc', now());

insert into public.tools (id, name, slug, category, tags, short_description_it, description_it, website_url, tooolvibes_post_url, cover_image_url, source, date_discovered, is_featured, is_published)
values (
  '36b0e9bd-5604-4b94-bed2-3a20fcaec5eb',
  'AgentX',
  'agentx',
  'AI Agents / No-Code Agent Builder',
  array['ai agents', 'no-code', 'multi-agent', 'business workflow', 'automation']::text[],
  'Piattaforma no-code/multi-agent per creare agenti AI specializzati e workflow business.',
  'AgentX permette di creare agenti AI specializzati e workflow multi-agent senza partire da un framework tecnico complesso.',
  'https://www.agentx.so/',
  'https://tooolvibes.com/all-tools/agentx_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-02-06',
  false,
  true
)
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  tags = excluded.tags,
  short_description_it = excluded.short_description_it,
  description_it = excluded.description_it,
  website_url = excluded.website_url,
  tooolvibes_post_url = excluded.tooolvibes_post_url,
  cover_image_url = excluded.cover_image_url,
  source = excluded.source,
  date_discovered = excluded.date_discovered,
  is_featured = excluded.is_featured,
  is_published = true,
  updated_at = timezone('utc', now());

notify pgrst, 'reload schema';


notify pgrst, 'reload schema';
