create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  note_text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tender_notes (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid not null references public.tenders(id) on delete cascade,
  note_text text not null,
  created_at timestamptz not null default now()
);

alter table public.lead_notes enable row level security;
alter table public.tender_notes enable row level security;

drop policy if exists "lead_notes_select_own" on public.lead_notes;
drop policy if exists "lead_notes_insert_own" on public.lead_notes;
drop policy if exists "tender_notes_select_own" on public.tender_notes;
drop policy if exists "tender_notes_insert_own" on public.tender_notes;

create policy "lead_notes_select_own"
on public.lead_notes
for select
using (
  exists (
    select 1
    from public.leads
    where leads.id = lead_notes.lead_id
      and leads.user_id = auth.uid()
  )
);

create policy "lead_notes_insert_own"
on public.lead_notes
for insert
with check (
  exists (
    select 1
    from public.leads
    where leads.id = lead_notes.lead_id
      and leads.user_id = auth.uid()
  )
);

create policy "tender_notes_select_own"
on public.tender_notes
for select
using (
  exists (
    select 1
    from public.tenders
    where tenders.id = tender_notes.tender_id
      and tenders.user_id = auth.uid()
  )
);

create policy "tender_notes_insert_own"
on public.tender_notes
for insert
with check (
  exists (
    select 1
    from public.tenders
    where tenders.id = tender_notes.tender_id
      and tenders.user_id = auth.uid()
  )
);

create index if not exists lead_notes_lead_id_created_at_idx
  on public.lead_notes (lead_id, created_at desc);

create index if not exists tender_notes_tender_id_created_at_idx
  on public.tender_notes (tender_id, created_at desc);
