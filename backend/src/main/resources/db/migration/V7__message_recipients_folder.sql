ALTER TABLE public.message_recipients
  ADD COLUMN IF NOT EXISTS folder TEXT NOT NULL DEFAULT 'INBOX';

ALTER TABLE public.message_recipients
  ADD COLUMN IF NOT EXISTS is_read BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.message_recipients
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- if created_at already exists, skip; otherwise add:
-- ALTER TABLE public.message_recipients
--   ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();