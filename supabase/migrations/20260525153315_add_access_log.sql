create table if not exists public.access_log (
  id          bigint generated always as identity primary key,
  user_id     uuid references auth.users(id) on delete set null,
  event       text not null,          -- e.g. 'login', 'logout', 'page_view'
  path        text,                   -- URL path accessed
  ip_address  text,
  user_agent  text,
  created_at  timestamptz default now()
);

alter table public.access_log enable row level security;

create policy "Users can view own access log"
  on public.access_log for select
  using (auth.uid() = user_id);

create policy "Service role can insert access log"
  on public.access_log for insert
  with check (true);