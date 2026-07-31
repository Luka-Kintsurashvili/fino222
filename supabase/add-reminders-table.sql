-- One-off dated reminders created via chat (distinct from calendar_payments, which is recurring-monthly-only).
create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  amount numeric check (amount is null or amount > 0),
  due_date date not null,
  remind_days_before integer not null default 1 check (remind_days_before >= 0),
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.reminders enable row level security;

drop policy if exists "Users manage their own reminders" on public.reminders;
create policy "Users manage their own reminders"
  on public.reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists reminders_user_due_idx
  on public.reminders (user_id, due_date);
