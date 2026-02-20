-- V4__messages.sql
-- Minimal Messaging Tabellen (falls dein Backend das erwartet)

CREATE TABLE IF NOT EXISTS public.messages (
                                               id BIGSERIAL PRIMARY KEY,
                                               sender_user_id BIGINT NOT NULL,
                                               subject TEXT,
                                               body TEXT,
                                               created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                               CONSTRAINT fk_messages_sender FOREIGN KEY (sender_user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.message_recipients (
                                                         id BIGSERIAL PRIMARY KEY,
                                                         message_id BIGINT NOT NULL,
                                                         user_id BIGINT NOT NULL,
                                                         delivered BOOLEAN NOT NULL DEFAULT false,
                                                         read_at TIMESTAMPTZ,
                                                         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                                         CONSTRAINT fk_msg_rec_message FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE,
                                                         CONSTRAINT fk_msg_rec_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
                                                         CONSTRAINT uk_msg_rec UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_msg_rec_user ON public.message_recipients(user_id);
CREATE INDEX IF NOT EXISTS idx_msg_rec_message ON public.message_recipients(message_id);