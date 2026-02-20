-- V8__messages_sender_id.sql
-- Align DB schema with Message entity (sender_id, thread_id, NOT NULLs)

-- 1) Rename sender_user_id -> sender_id (data-safe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'messages'
      AND column_name  = 'sender_user_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'messages'
      AND column_name  = 'sender_id'
  ) THEN
    ALTER TABLE public.messages RENAME COLUMN sender_user_id TO sender_id;
  END IF;
END$$;

-- 2) Fix FK if it still references the old column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema='public'
      AND table_name='messages'
      AND constraint_name='fk_messages_sender'
  ) THEN
    ALTER TABLE public.messages DROP CONSTRAINT fk_messages_sender;
  END IF;

  -- Recreate FK on sender_id (only if sender_id exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='sender_id'
  ) THEN
    ALTER TABLE public.messages
      ADD CONSTRAINT fk_messages_sender
      FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END$$;

-- 3) thread_id exists in entity
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS thread_id BIGINT;

-- 4) Entity says subject/body NOT NULL. Make existing NULLs safe then enforce.
UPDATE public.messages SET subject = '' WHERE subject IS NULL;
UPDATE public.messages SET body    = '' WHERE body    IS NULL;

ALTER TABLE public.messages
  ALTER COLUMN subject SET NOT NULL,
  ALTER COLUMN body    SET NOT NULL;

-- 5) Index
DROP INDEX IF EXISTS public.idx_messages_sender;
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);