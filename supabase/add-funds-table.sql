-- Fino: adds the Funds table (replaces the old Goals feature).
-- Run this once in your Supabase project's SQL editor.
-- Safe to run even if you've already run the earlier migrations.
-- This does NOT touch your existing goals/goal_members/goal_invites
-- tables — they're left in place, just unused by the app for now.

create table if not exists public.funds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  saved_amount numeric not null default 0 check (saved_amount >= 0),
  contribution_mode text not null default 'fixed' check (contribution_mode in ('fixed', 'percent')),
  contribution_value numeric not null default 0 check (contribution_value >= 0),
  is_rainy_day boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.funds enable row level security;

drop policy if exists "Users manage their own funds" on public.funds;
create policy "Users manage their own funds"
  on public.funds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
