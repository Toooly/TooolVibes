-- TooolVibes seed chunk 3: tools 11-15

insert into public.tools (id, name, slug, category, tags, short_description_it, description_it, website_url, tooolvibes_post_url, cover_image_url, source, date_discovered, is_featured, is_published)
values (
  '575b4ea3-138b-4465-936e-0a7dce4fd600',
  'Muse AI',
  'muse-ai',
  'AI Video / Video Hosting',
  array['video hosting', 'ai search', 'embed', 'sharing', 'archive']::text[],
  'Piattaforma video con hosting, ricerca AI nei video, embed e condivisione.',
  'Muse AI combina hosting video, ricerca semantica nei contenuti e condivisione tramite embed, rendendo più gestibile un archivio video.',
  'https://muse.ai/',
  'https://tooolvibes.com/all-tools/muse_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-18',
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
  'c94e784e-43cf-4344-93f6-35ee56b9d435',
  'Socleads',
  'socleads',
  'Lead Generation / Sales',
  array['lead generation', 'sales', 'google maps', 'linkedin', 'outreach']::text[],
  'Tool per estrarre lead verificati da Google Maps, Instagram, LinkedIn e altre fonti pubbliche.',
  'Socleads aiuta team sales e founder a raccogliere lead da fonti pubbliche, con un flusso pensato per velocizzare prospecting e outreach.',
  'https://socleads.com/?ref=_lcMNGtlQjjQ',
  'https://tooolvibes.com/all-tools/socleads_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-19',
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
  '5fb748a6-412b-46f2-bca6-2053df3d3000',
  'Windsor AI',
  'windsor-ai',
  'Marketing Data / Attribution',
  array['marketing data', 'attribution', 'bi', 'connectors', 'warehouse']::text[],
  'Piattaforma per unificare dati marketing, attribution e connettori verso BI/warehouse.',
  'Windsor AI centralizza dati marketing da canali diversi, li porta verso strumenti BI o warehouse e aiuta a leggere attribution e performance.',
  'https://www.windsor.ai/',
  'https://tooolvibes.com/all-tools/windsor-ai_2',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-20',
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
  'c8f80c6d-6332-44e1-9f2c-a12a7afa1d0b',
  'Frase AI',
  'frase-ai',
  'SEO / AI Writing',
  array['seo', 'ai writing', 'content brief', 'serp', 'optimization']::text[],
  'Piattaforma AI per brief SEO, scrittura, ottimizzazione contenuti e analisi SERP.',
  'Frase AI lavora su ricerca SERP, brief, outline e ottimizzazione dei contenuti per rendere il processo SEO più rapido e controllabile.',
  'https://www.frase.io/?via=tool57',
  'https://tooolvibes.com/all-tools/frase-ai_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-21',
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
  '1449b2c2-f794-41e0-9ae0-937c401f50df',
  'Synthesia AI',
  'synthesia-ai',
  'AI Video / Avatars',
  array['ai video', 'avatars', 'voiceover', 'training', 'corporate']::text[],
  'Piattaforma AI video per creare contenuti con avatar, voiceover e script testuali.',
  'Synthesia trasforma script in video con avatar e voiceover, ideale per formazione, onboarding, contenuti corporate e comunicazione scalabile.',
  'https://www.synthesia.io/',
  'https://tooolvibes.com/all-tools/synthesia-ai_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-22',
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
