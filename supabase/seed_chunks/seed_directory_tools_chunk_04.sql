-- TooolVibes seed chunk 4: tools 16-20

insert into public.tools (id, name, slug, category, tags, short_description_it, description_it, website_url, tooolvibes_post_url, cover_image_url, source, date_discovered, is_featured, is_published)
values (
  '8240ab3b-7385-4c59-be0c-122cb5eab3d3',
  'NotionApps',
  'notionapps',
  'No-Code / Notion Apps',
  array['notion', 'no-code', 'mobile app', 'database', 'internal tools']::text[],
  'Tool per trasformare database Notion in app web/mobile con permessi e sync.',
  'NotionApps prende database Notion e li trasforma in app utilizzabili, con permessi, interfacce e sincronizzazione pensate per team e clienti.',
  'https://www.notionapps.com?via=toool',
  'https://tooolvibes.com/all-tools/notionapps_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-23',
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
  'ebafa7ee-8ada-4819-962a-3f04b3d1d92b',
  'Blogify',
  'blogify',
  'AI Blogging / Content Repurposing',
  array['blogging', 'content repurposing', 'seo', 'audio', 'video']::text[],
  'Tool AI per trasformare video, audio, URL e contenuti in blog post SEO-ready.',
  'Blogify aiuta a riproporre contenuti gia'' esistenti in articoli ottimizzati, riducendo il tempo tra video, audio o link e pubblicazione sul blog.',
  'https://blogify.ai?fpr=n2ogi',
  'https://tooolvibes.com/all-tools/blogify_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-24',
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
  '3e647dfc-a34c-4204-b740-49f11d8ea313',
  'LiveChat',
  'livechat',
  'Customer Support / Live Chat',
  array['live chat', 'support', 'sales', 'customer service', 'realtime']::text[],
  'Software live chat per supporto clienti, vendite e conversazioni realtime.',
  'LiveChat porta conversazioni realtime su siti e prodotti digitali, con strumenti per supporto, vendita e gestione team.',
  'https://www.livechat.com/',
  'https://tooolvibes.com/all-tools/livechat_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-25',
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
  'ff706fc8-04ae-4e5c-96b1-56df2eacdd08',
  'ChatBot',
  'chatbot',
  'AI Chatbot / Customer Support',
  array['chatbot', 'ai support', 'automation', 'sales', 'faq']::text[],
  'Piattaforma per creare chatbot AI di supporto, vendita e automazione conversazionale.',
  'ChatBot permette di creare assistenti conversazionali per FAQ, vendita, routing e automazioni senza dover costruire ogni flusso da zero.',
  'https://www.chatbot.com/',
  'https://tooolvibes.com/all-tools/chatbot_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-26',
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
  'a7655852-e0f1-4b31-98b2-999742d79c8a',
  'HelpDesk',
  'helpdesk',
  'Customer Support / Ticketing',
  array['helpdesk', 'ticketing', 'support', 'automation', 'team']::text[],
  'Ticketing system per gestire comunicazioni clienti, automazioni e supporto team.',
  'HelpDesk organizza richieste clienti, ticket, priorità e automazioni per dare struttura al supporto quando email e chat non bastano più.',
  'https://www.helpdesk.com/',
  'https://tooolvibes.com/all-tools/helpdesk_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-27',
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
