-- Lets assistant chat messages carry a clickable action chip (e.g. "View fund")
-- that deep-links to the relevant tile/sheet on the Wallet page.
alter table public.chat_messages add column if not exists action jsonb;
