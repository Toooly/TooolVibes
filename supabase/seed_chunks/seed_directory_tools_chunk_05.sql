-- TooolVibes seed chunk 5: tools 21-25

insert into public.tools (id, name, slug, category, tags, short_description_it, description_it, website_url, tooolvibes_post_url, cover_image_url, source, date_discovered, is_featured, is_published)
values (
  'be879950-a6bb-4ade-ae0b-5f8d0e46f8b4',
  'Wegic',
  'wegic',
  'AI Website Builder',
  array['website builder', 'ai site', 'conversation', 'no-code', 'publish']::text[],
  'AI website builder che crea, modifica e pubblica siti tramite conversazione.',
  'Wegic porta la creazione di siti in una logica conversazionale: descrivi cosa vuoi, iteri con l''assistente e pubblichi un risultato pronto.',
  'https://wegic.ai/',
  'https://tooolvibes.com/all-tools/wegic_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-28',
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
  '2dd0f4c1-db23-4698-880a-b00d785a06dd',
  'Vidau',
  'vidau',
  'AI Video Ads',
  array['video ads', 'ai video', 'marketing', 'ecommerce', 'creative']::text[],
  'AI video ad generator per trasformare URL, immagini e testi in video ads pronti.',
  'Vidau aiuta a creare video ads partendo da URL, immagini e testi, con un flusso pensato per campagne, ecommerce e creatività performance.',
  'https://www.vidau.ai/',
  'https://tooolvibes.com/all-tools/vidau_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-29',
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
  '1efec83a-fbf0-446f-a5a1-0c3a857a1da2',
  'Lemon Squeezy',
  'lemon-squeezy',
  'Payments / Merchant of Record',
  array['payments', 'saas', 'merchant of record', 'subscriptions', 'tax']::text[],
  'Piattaforma per pagamenti SaaS, abbonamenti, tax compliance e Merchant of Record.',
  'Lemon Squeezy gestisce pagamenti, abbonamenti, tasse e Merchant of Record, alleggerendo la complessità commerciale per prodotti digitali e SaaS.',
  'https://www.lemonsqueezy.com/',
  'https://tooolvibes.com/all-tools/lemon-squeezy_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-30',
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
  'd03830d0-8612-43d7-9fbd-839cc0f4763f',
  'VibrantSnap',
  'vibrantsnap',
  'AI Video / Product Demo',
  array['product demo', 'screen recording', 'ai video', 'tutorial', 'saas']::text[],
  'Tool AI per trasformare screen recording in video demo/tutorial professionali.',
  'VibrantSnap prende screen recording e li trasforma in demo o tutorial più rifiniti, con un output più adatto a prodotto, onboarding e marketing.',
  'https://www.vibrantsnap.com/',
  'https://tooolvibes.com/all-tools/vibrantsnap_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-01-31',
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
  'ed5146be-68a6-4e2c-b67a-c492b6252755',
  'ReachifyMe',
  'reachifyme',
  'LinkedIn / Personal Branding',
  array['linkedin', 'personal branding', 'ai writing', 'content', 'growth']::text[],
  'Tool AI per creare contenuti LinkedIn, personal branding e crescita professionale.',
  'ReachifyMe supporta la creazione di contenuti LinkedIn e personal branding con idee, testi e ritmo editoriale più sostenibile.',
  'https://reachifyme.com/',
  'https://tooolvibes.com/all-tools/reachifyme_1',
  'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1400&q=80',
  'TooolVibes Weblium source',
  '2026-02-01',
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
