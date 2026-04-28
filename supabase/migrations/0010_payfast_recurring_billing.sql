alter table public.subscriptions
  add column if not exists recurring_amount numeric(10,2),
  add column if not exists billing_frequency integer,
  add column if not exists billing_cycles integer,
  add column if not exists is_recurring boolean not null default false,
  add column if not exists payfast_subscription_token text,
  add column if not exists payfast_pf_payment_id text,
  add column if not exists payfast_status text,
  add column if not exists started_at timestamptz,
  add column if not exists paused_at timestamptz,
  add column if not exists cancelled_at timestamptz,
  add column if not exists last_payment_at timestamptz,
  add column if not exists last_payment_status text,
  add column if not exists failed_payment_count integer not null default 0,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.subscriptions
  drop constraint if exists subscriptions_status_check;

alter table public.subscriptions
  add constraint subscriptions_status_check
  check (status in ('pending', 'active', 'cancelled', 'past_due', 'on_hold'));

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  event_type text not null,
  event_status text,
  payfast_payment_id text,
  payfast_pf_payment_id text,
  payfast_subscription_token text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.billing_events enable row level security;

create policy "billing_events_select_own" on public.billing_events
  for select using (auth.uid() = user_id);
