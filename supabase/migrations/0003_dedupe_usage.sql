alter table public.leads
  add column if not exists city text not null default 'South Africa',
  add column if not exists website_normalized text,
  add column if not exists phone_normalized text;

update public.leads
set
  city = coalesce(nullif(trim(city), ''), 'South Africa'),
  website_normalized = lower(trim(coalesce(website, ''))),
  phone_normalized = regexp_replace(coalesce(phone, ''), '\D', '', 'g');

drop index if exists leads_user_name_address_website_unique;

create unique index if not exists leads_user_name_city_website_unique
  on public.leads (user_id, name, city, website_normalized);
