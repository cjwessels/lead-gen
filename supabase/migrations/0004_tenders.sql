create table if not exists public.tenders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source_id text not null,
  title text not null,
  summary text not null default '',
  publisher text not null default '',
  start_date date,
  end_date date,
  qualification_notes text,
  source_url text,
  score integer not null default 0,
  keywords text[] not null default '{}',
  focus_tags text[] not null default '{}',
  status text not null default 'identified'
    check (status in ('identified', 'reviewing', 'qualifying', 'bid-prep', 'submitted', 'won', 'lost')),
  created_at timestamptz not null default now()
);

alter table public.tenders enable row level security;

create policy "tenders_select_own" on public.tenders
  for select using (auth.uid() = user_id);

create policy "tenders_insert_own" on public.tenders
  for insert with check (auth.uid() = user_id);

create policy "tenders_update_own" on public.tenders
  for update using (auth.uid() = user_id);

create policy "tenders_delete_own" on public.tenders
  for delete using (auth.uid() = user_id);

create unique index if not exists tenders_user_source_unique
  on public.tenders (user_id, source_id);
