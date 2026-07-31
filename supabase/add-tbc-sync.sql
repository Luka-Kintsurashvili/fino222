-- Fino: adds bank-sync support (TBC BIS-Accounts integration).
-- Run this once in your Supabase project's SQL editor.
-- Safe to run even if you've already run the earlier migrations.

alter table public.transactions add column if not exists external_id text;

-- Plain (non-partial) unique index: Postgres already treats NULLs as distinct in a
-- unique index, so manual/non-synced rows (external_id null) never collide with each
-- other. A partial index here (`where external_id is not null`) breaks supabase-js's
-- upsert(...).onConflict(...) — it can't target a partial index without repeating its
-- WHERE clause, so every sync upsert fails with "no unique or exclusion constraint
-- matching the ON CONFLICT specification".
create unique index if not exists transactions_user_external_id_idx
  on public.transactions (user_id, external_id);
