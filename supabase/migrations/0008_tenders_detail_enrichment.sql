alter table public.tenders
  add column if not exists source_material text,
  add column if not exists contact_person text,
  add column if not exists contact_email text,
  add column if not exists contact_phone text;
