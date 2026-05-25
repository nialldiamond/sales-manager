create table if not exists public.account_managers (
  id                  integer primary key,  -- EvoX account manager ID
  name                text not null,
  email               text not null,
  seller_reference    text,
  enabled             boolean not null default true,
  evox_created_at     timestamptz,
  synced_at           timestamptz default now()
);

alter table public.account_managers enable row level security;

create policy "Authenticated users can view account managers"
  on public.account_managers for select
  using (auth.role() = 'authenticated');