create table if not exists public.account_manager_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  evox_account_manager_id integer not null,
  name            text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.account_manager_profiles enable row level security;

create policy "Users can view own profile"
  on public.account_manager_profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.account_manager_profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.account_manager_profiles for update
  using (auth.uid() = id);