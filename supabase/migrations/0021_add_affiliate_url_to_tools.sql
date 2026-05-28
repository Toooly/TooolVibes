alter table public.tools
  add column if not exists affiliate_url text;

comment on column public.tools.affiliate_url is 'Optional affiliate override URL used instead of website_url when present.';
