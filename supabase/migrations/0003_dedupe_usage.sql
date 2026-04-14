alter table public.leads
  add column if not exists website_normalized text,
  add column if not exists phone_normalized text;

update public.leads
set
  website_normalized = lower(trim(coalesce(website, ''))),
  phone_normalized = regexp_replace(coalesce(phone, ''), '\D', '', 'g');

create unique index if not exists leads_user_name_address_website_unique
  on public.leads (user_id, name, address, website_normalized);
