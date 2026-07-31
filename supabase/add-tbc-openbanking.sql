-- Fino: TBC Open Banking (AIS) per-user account connection.
-- Replaces the old client_credentials-based sync model in add-tbc-sync.sql with
-- a real per-user consent flow (Berlin-Group NextGenPSD2 style).
-- Run this once in your Supabase project's SQL editor.
-- Safe to run even if you've already run the earlier migrations.

create table if not exists public.tbc_connections (
  user_id uuid primary key references auth.users(id) on delete cascade,
  consent_id text,
  consent_state text,
  pkce_verifier text,
  status text not null default 'pending', -- pending | active | revoked | expired
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  consent_valid_until date,
  updated_at timestamptz not null default now()
);

alter table public.tbc_connections enable row level security;

-- Deliberately no policies for the `authenticated` role: this table holds live
-- access/refresh tokens and must never be readable from the browser. RLS with
-- zero policies denies all access to anon/authenticated roles by default; only
-- the service-role key (used exclusively by edge functions) can read/write it.
-- The client learns its connection status only via the `tbc-status` edge function.
