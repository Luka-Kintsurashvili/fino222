-- Persisted chat history so the conversation survives page reloads and route navigation
-- (previously lived only in component state and reset on every remount).
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  text text not null,
  created_at timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

drop policy if exists "Users manage their own chat messages" on public.chat_messages;
create policy "Users manage their own chat messages"
  on public.chat_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages (user_id, created_at);
