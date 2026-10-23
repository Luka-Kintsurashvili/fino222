-- Persists the user's chosen monthly budget plan (income, rule, per-category amounts)
-- so it survives reopening the budget sheet, and so the app can compare real spending
-- against it (remaining-per-category view, the overspend-pace notification).
create table if not exists public.budget_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  monthly_income numeric not null,
  rule_id text not null,
  amounts jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.budget_plans enable row level security;

drop policy if exists "Users manage their own budget plan" on public.budget_plans;
create policy "Users manage their own budget plan"
  on public.budget_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
