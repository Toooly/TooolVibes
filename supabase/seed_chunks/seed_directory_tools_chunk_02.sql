-- TooolVibes seed chunk 2: tools 6-10

insert into public.tools (id, name, slug, category, tags, short_description_it, description_it, website_url, tooolvibes_post_url, cover_image_url, source, date_discovered, is_featured, is_published)
values (
  '205674bc-2b17-4c6a-afab-2b4df6ff1a97',
  'v0',
  'v0',
  'AI Coding / UI Builder',
  array['ui builder', 'ai coding', 'components', 'frontend', 'vercel']::text[],
  'AI builder di Vercel per creare interfacce, app, componenti e progetti pronti al deploy.',
  'v0 è forte quando la partita si gioca su UI, componenti e velocità di esecuzione front-end. Aiuta a esplorare direzioni visuali e portare il codice in un flusso moderno.',
  'https://v0.app/',
  'https://www.tooolvibes.com/p/v0',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes editorial source',
  '2026-02-10',
  true,
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
  '7b7e0c1a-00f2-401b-9874-b42a45fbf9d4',
  'Meku',
  'meku',
  'AI Site Builder / Vibe Coding',
  array['vibe coding', 'react', 'tailwind', 'site builder', 'export']::text[],
  'AI web app & site builder per generare progetti React/Tailwind, iterare, esportare e pubblicare.',
  'Meku interessa chi vuole restare nel mondo React/Tailwind ma partire da una spinta AI concreta: genera una base moderna, la iteri e poi puoi riprendere controllo del progetto.',
  'https://meku.dev/?aff=YFlSqMxPUaEb',
  'https://www.tooolvibes.com/p/meku',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes editorial source',
  '2026-02-11',
  true,
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
  'f39b2216-9a67-4946-8eb1-d2b5b88009dd',
  'Jenni AI',
  'jenni-ai',
  'AI Writing / Research',
  array['writing', 'research', 'citations', 'academic', 'documents']::text[],
  'Assistente AI per scrittura, ricerca, citazioni e documenti accademici.',
  'Jenni AI aiuta a trasformare appunti e ricerche in documenti più ordinati, con supporto a citazioni, outline e scrittura assistita.',
  'https://jenni.ai/',
  'https://tooolvibes.com/all-tools/jenny-ai_2',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-15',
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
  '41d956cd-4749-4723-9931-db3c9d77812a',
  'BetterPic',
  'betterpic',
  'AI Image / Headshots',
  array['headshots', 'profile', 'linkedin', 'ai image', 'team']::text[],
  'Generatore AI di headshot professionali per profili, CV, LinkedIn e team.',
  'BetterPic genera ritratti professionali a partire da foto personali, utile per profili, team page, CV e asset LinkedIn coerenti.',
  'https://www.betterpic.io/',
  'https://tooolvibes.com/all-tools/betterpic_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-16',
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
  'f3340c52-f110-4f6d-ac16-6ebf654af10e',
  'Imagine Art',
  'imagine-art',
  'AI Image / Creative Suite',
  array['ai image', 'creative suite', 'video', 'shorts', 'prompt']::text[],
  'Suite AI per generare immagini, video, shorts e contenuti creativi da prompt.',
  'Imagine Art unisce generazione visuale e strumenti creativi per passare da prompt a immagini, video e asset social più rapidamente.',
  'https://www.imagine.art/',
  'https://tooolvibes.com/all-tools/imagine-art-ai_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-17',
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
