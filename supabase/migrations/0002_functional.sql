alter table public.profiles
  add column if not exists monthly_searches_used integer not null default 0,
  add column if not exists monthly_search_limit integer not null default 20;

create or replace function public.increment_monthly_searches(p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set monthly_searches_used = monthly_searches_used + 1
  where id = p_user_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name, plan, monthly_searches_used, monthly_search_limit)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'free',
    0,
    20
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
