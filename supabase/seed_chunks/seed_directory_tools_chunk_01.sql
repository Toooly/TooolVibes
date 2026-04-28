-- TooolVibes seed chunk 1: tools 1-5

insert into public.tools (id, name, slug, category, tags, short_description_it, description_it, website_url, tooolvibes_post_url, cover_image_url, source, date_discovered, is_featured, is_published)
values (
  '996a6bdc-8b88-42b8-898d-2f84c4cd5263',
  'Blink',
  'blink',
  'Vibe Coding / AI App Builder',
  array['vibe coding', 'ai app builder', 'prompt-to-app', 'web app', 'prototype']::text[],
  'AI app builder che trasforma un''idea in un''app funzionante in pochi minuti.',
  'Blink è pensato per passare da prompt a interfaccia, logica e prima esperienza prodotto senza aprire subito un ciclo di sviluppo pesante. Accorcia il tempo tra intuizione, prototipo e primo test reale.',
  'https://blink.new/?aff=toool',
  'https://www.tooolvibes.com/p/blink-new',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes editorial source',
  '2026-02-05',
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
  '9ab174b3-b872-48b6-b162-4c7387b8bfff',
  'VibeCode',
  'vibecode',
  'Vibe Coding / AI App Builder',
  array['vibe coding', 'ai app builder', 'mobile app', 'iteration', 'deploy']::text[],
  'Builder AI per creare app da prompt, iterare rapidamente e pubblicare progetti mobile/web.',
  'VibeCode spinge sulla velocità di iterazione: generi una base applicativa, la rifinisci rapidamente e capisci se il prodotto merita il passaggio successivo.',
  'https://www.vibecodeapp.com/sign-up?code=ref-39fsyj6mgbtp',
  'https://www.tooolvibes.com/p/vibecode',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes editorial source',
  '2026-02-06',
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
  '12f611fc-e3ee-4bff-b8c2-e68368291471',
  'WeWeb',
  'weweb',
  'No-Code / Web App Builder',
  array['no-code', 'web app builder', 'frontend', 'backend', 'production']::text[],
  'Piattaforma visuale no-code/AI per creare web app production-grade.',
  'WeWeb è una scelta matura quando vuoi restare veloce senza perdere controllo sul front-end, sulle integrazioni e sulla tenuta del progetto nel tempo.',
  'https://dashboard.weweb.io/sign-up/e97a27ca-e319-49f0-a2b7-ea042d3c6b36',
  'https://www.tooolvibes.com/p/blink-61f26b689a7da189',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes editorial source',
  '2026-02-07',
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
  '4edfc1cc-afce-474e-8bd4-bb7f6a40a89b',
  'CosmicJS',
  'cosmicjs',
  'Headless CMS / AI Workflow',
  array['headless cms', 'api', 'content workflow', 'directory', 'ai workflow']::text[],
  'Headless CMS con AI, API, workflow e strumenti per accelerare progetti content-driven.',
  'CosmicJS aiuta a organizzare contenuti, modelli, API e workflow editoriali in modo pulito. È un buon centro operativo per directory, siti editoriali e web app content-driven.',
  'https://app.cosmicjs.com/signup?ref=TOOOLVIBES',
  'https://www.tooolvibes.com/p/cosmicjs',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes editorial source',
  '2026-02-08',
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
  '3622710f-4080-4edd-a286-0079b9fc6f01',
  'Mocha',
  'mocha',
  'AI App Builder / No-Code',
  array['ai app builder', 'no-code', 'full-stack', 'database', 'deploy']::text[],
  'AI no-code app builder full-stack con backend, database, autenticazione, hosting e deploy integrati.',
  'Mocha si posiziona bene quando vuoi un builder che non si fermi alla UI: backend, database, auth e deploy fanno parte della promessa.',
  'https://getmocha.com/?via=toool',
  'https://www.tooolvibes.com/p/mocha',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes editorial source',
  '2026-02-09',
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

notify pgrst, 'reload schema';
