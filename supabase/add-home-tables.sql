-- Fino: adds the Home tab tables (bank cards, projects, transactions).
-- Run this once in your Supabase project's SQL editor.
-- Safe to run even if you've already run the full schema.sql, since
-- everything here uses "if not exists" / "create or replace".

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank_id text not null,
  nickname text not null,
  balance numeric not null default 0,
  last4 text not null default '0000',
  created_at timestamptz not null default now()
);

alter table public.bank_accounts enable row level security;

drop policy if exists "Users manage their own bank accounts" on public.bank_accounts;
create policy "Users manage their own bank accounts"
  on public.bank_accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  budget numeric,
  created_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Users manage their own projects" on public.projects;
create policy "Users manage their own projects"
  on public.projects for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null check (amount > 0),
  category text,
  project_id uuid references public.projects(id) on delete set null,
  note text not null default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

drop policy if exists "Users manage their own transactions" on public.transactions;
create policy "Users manage their own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
