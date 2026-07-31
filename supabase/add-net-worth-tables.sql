-- Fino: adds the Net Worth tables (assets, liabilities).
-- Run this once in your Supabase project's SQL editor.
-- Safe to run even if you've already run schema.sql or add-home-tables.sql.

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  liquidity text not null check (liquidity in ('liquid', 'nonliquid')),
  value numeric not null check (value >= 0),
  created_at timestamptz not null default now()
);

alter table public.assets enable row level security;

drop policy if exists "Users manage their own assets" on public.assets;
create policy "Users manage their own assets"
  on public.assets for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.liabilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null,
  amount numeric not null check (amount >= 0),
  created_at timestamptz not null default now()
);

alter table public.liabilities enable row level security;

drop policy if exists "Users manage their own liabilities" on public.liabilities;
create policy "Users manage their own liabilities"
  on public.liabilities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
