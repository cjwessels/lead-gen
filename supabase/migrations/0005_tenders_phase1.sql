alter table public.tenders
  add column if not exists province text,
  add column if not exists location_text text,
  add column if not exists is_national boolean not null default false;
