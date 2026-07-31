-- Fino: Supabase schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

-- Goals (მიზნები)
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  target_amount numeric not null check (target_amount > 0),
  saved_amount numeric not null default 0 check (saved_amount >= 0),
  monthly_contribution numeric not null default 0 check (monthly_contribution >= 0),
  created_at timestamptz not null default now()
);

alter table public.goals enable row level security;

create policy "Owners manage their goals"
  on public.goals for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Group goals: friends invited to a goal each track their own contribution
-- separately from the owner's saved_amount; the UI sums them for a combined total.
create table if not exists public.goal_members (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  contributed_amount numeric not null default 0 check (contributed_amount >= 0),
  joined_at timestamptz not null default now(),
  unique (goal_id, user_id)
);

alter table public.goal_members enable row level security;

-- The "goals" and "goal_members" policies below each need to check the other
-- table. Doing that with a plain subquery makes Postgres re-evaluate RLS on
-- both tables in a loop (goals -> goal_members -> goals -> ...), which
-- Postgres rejects with "infinite recursion detected in policy", surfaced by
-- PostgREST as a 500 on every request. SECURITY DEFINER functions run with
-- the function owner's privileges, bypassing RLS for the query *inside* the
-- function, which breaks the cycle.
create or replace function public.is_goal_owner(_goal_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.goals
    where id = _goal_id and user_id = _user_id
  );
$$;

create or replace function public.is_goal_member(_goal_id uuid, _user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.goal_members
    where goal_id = _goal_id and user_id = _user_id
  );
$$;

create policy "Members can view shared goals"
  on public.goals for select
  using (public.is_goal_member(goals.id, auth.uid()));

create policy "Members can view their goal roster"
  on public.goal_members for select
  using (
    auth.uid() = user_id
    or public.is_goal_owner(goal_members.goal_id, auth.uid())
    or public.is_goal_member(goal_members.goal_id, auth.uid())
  );

create policy "Users can join a goal as themselves"
  on public.goal_members for insert
  with check (auth.uid() = user_id);

create policy "Members can update their own contribution"
  on public.goal_members for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Members can leave or be removed by the owner"
  on public.goal_members for delete
  using (auth.uid() = user_id or public.is_goal_owner(goal_members.goal_id, auth.uid()));

-- Shareable invite codes so a friend can join a goal without email infrastructure.
create table if not exists public.goal_invites (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals(id) on delete cascade,
  code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.goal_invites enable row level security;

create policy "Owners manage invites for their goals"
  on public.goal_invites for all
  using (public.is_goal_owner(goal_invites.goal_id, auth.uid()))
  with check (public.is_goal_owner(goal_invites.goal_id, auth.uid()));

create policy "Authenticated users can look up invite codes"
  on public.goal_invites for select
  using (auth.role() = 'authenticated');

-- Calendar payments (კალენდარი)
create table if not exists public.calendar_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  amount numeric not null check (amount > 0),
  day_of_month integer not null check (day_of_month between 1 and 31),
  color text not null default '#3B82F6',
  created_at timestamptz not null default now()
);

alter table public.calendar_payments enable row level security;

create policy "Users manage their own payments"
  on public.calendar_payments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Home tab: bank cards, expense-tracking projects, and transactions
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
  -- Set only for transactions imported from a bank (e.g. TBC's movementId),
  -- so re-syncing never creates duplicates.
  external_id text,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users manage their own transactions"
  on public.transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create unique index if not exists transactions_user_external_id_idx
  on public.transactions (user_id, external_id)
  where external_id is not null;

-- Net worth: things a user owns (beyond their bank cards) and owes
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

create policy "Users manage their own liabilities"
  on public.liabilities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Funds: savings buckets funded from monthly income (replaces the older
-- goals/goal_members/goal_invites group-sharing feature, which stays in
-- place but unused for now in case group sharing comes back later).
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

create policy "Users manage their own funds"
  on public.funds for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
