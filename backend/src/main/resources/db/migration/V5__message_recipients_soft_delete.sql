ALTER TABLE public.message_recipients
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;