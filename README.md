# ფინო (Fino)

Georgian-language personal finance assistant — mobile-first web app.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- React Router
- Supabase (auth + Postgres)

## Getting started

```bash
npm install
npm run dev
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local` and fill in your project URL and anon key:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run `supabase/schema.sql` in the Supabase SQL editor to create the `goals` and
   `calendar_payments` tables with row-level security.
4. Enable **Email** auth under Authentication → Providers (on by default).
5. To enable **Google OAuth**: Authentication → Providers → Google, add your
   Google OAuth client ID/secret, and set the redirect URL Supabase gives you
   in your Google Cloud Console credentials.

Without these env vars the app still runs — auth and Supabase-backed features
(მიზნები, კალენდარი) show a "sign in required" state instead of erroring.

## Currency rates

The ვალუტა tab calls the free, keyless [open.er-api.com](https://open.er-api.com)
endpoint client-side. If it's unreachable, the UI falls back to static
approximate rates and shows a notice.

## Chatbot

The floating ფინო assistant bubble is UI-only for now — it is not wired to a
backend yet. Wiring it to Claude requires a server-side proxy (Supabase Edge
Function or similar) so the Anthropic API key never ships to the client.
