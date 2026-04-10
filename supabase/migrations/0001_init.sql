create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro')),
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text not null default 'Business',
  city text not null default 'South Africa',
  phone text,
  website text,
  rating numeric(2,1),
  review_count integer not null default 0,
  score integer not null default 0,
  status text not null default 'new'
    check (status in ('new', 'qualified', 'contacted', 'follow-up', 'proposal-sent', 'won', 'lost')),
  pain_points text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null check (plan in ('starter', 'pro')),
  status text not null default 'pending' check (status in ('pending', 'active', 'cancelled', 'past_due')),
  payfast_payment_id text,
  amount numeric(10,2),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "leads_select_own" on public.leads
  for select using (auth.uid() = user_id);

create policy "leads_insert_own" on public.leads
  for insert with check (auth.uid() = user_id);

create policy "leads_update_own" on public.leads
  for update using (auth.uid() = user_id);

create policy "leads_delete_own" on public.leads
  for delete using (auth.uid() = user_id);

create policy "subscriptions_select_own" on public.subscriptions
  for select using (auth.uid() = user_id);
