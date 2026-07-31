-- Fino: adds tables for the Cleo-style feature set — daily check-in streaks,
-- and the simulated (demo-only, no real money movement) Cash Advance and
-- Credit Builder Card features.
-- Run this once in your Supabase project's SQL editor.

create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_checkin_date date,
  updated_at timestamptz not null default now()
);

alter table public.user_streaks enable row level security;

drop policy if exists "Users manage their own streak" on public.user_streaks;
create policy "Users manage their own streak"
  on public.user_streaks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.cash_advances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount numeric not null check (amount > 0),
  status text not null default 'active' check (status in ('active', 'repaid')),
  requested_at timestamptz not null default now(),
  due_date date not null,
  repaid_at timestamptz
);

alter table public.cash_advances enable row level security;

drop policy if exists "Users manage their own cash advances" on public.cash_advances;
create policy "Users manage their own cash advances"
  on public.cash_advances for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.credit_builder_cards (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credit_limit numeric not null default 300,
  on_time_payments integer not null default 0,
  score_estimate integer not null default 580,
  activated_at timestamptz not null default now()
);

alter table public.credit_builder_cards enable row level security;

drop policy if exists "Users manage their own credit builder card" on public.credit_builder_cards;
create policy "Users manage their own credit builder card"
  on public.credit_builder_cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
