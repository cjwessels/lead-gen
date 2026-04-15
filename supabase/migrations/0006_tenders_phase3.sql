alter table public.tenders
  add column if not exists source_type text not null default 'government',
  add column if not exists source_label text not null default 'Official source';

update public.tenders
set
  source_type = coalesce(nullif(trim(source_type), ''), 'government'),
  source_label = coalesce(nullif(trim(source_label), ''), 'Official source');
