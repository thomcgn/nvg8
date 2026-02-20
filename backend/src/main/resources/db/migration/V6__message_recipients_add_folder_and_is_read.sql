ALTER TABLE public.message_recipients
    ADD COLUMN IF NOT EXISTS folder TEXT NOT NULL DEFAULT 'INBOX';

ALTER TABLE public.message_recipients
    ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

-- Optional: if you don't use "delivered" anymore, you can drop it.
-- Only do this if the backend truly doesn't reference it anywhere.
-- ALTER TABLE public.message_recipients DROP COLUMN IF EXISTS delivered;