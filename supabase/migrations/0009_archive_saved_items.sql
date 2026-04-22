alter table public.leads
  add column if not exists archived_at timestamptz;

alter table public.tenders
  add column if not exists archived_at timestamptz;

create index if not exists leads_user_archived_idx
  on public.leads (user_id, archived_at, created_at desc);

create index if not exists tenders_user_archived_idx
  on public.tenders (user_id, archived_at, created_at desc);
