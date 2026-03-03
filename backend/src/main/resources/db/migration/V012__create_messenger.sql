-- Flyway migration V012

CREATE TABLE IF NOT EXISTS messages (
  id         BIGSERIAL PRIMARY KEY,
  sender_id  BIGINT       NOT NULL,
  subject    VARCHAR(255) NOT NULL,
  body       TEXT         NOT NULL,
  thread_id  BIGINT,
  created_at TIMESTAMPTZ  NOT NULL,

  CONSTRAINT fk_msg_sender FOREIGN KEY (sender_id) REFERENCES users(id),
  CONSTRAINT fk_msg_thread FOREIGN KEY (thread_id) REFERENCES messages(id)
);

CREATE INDEX IF NOT EXISTS ix_messages_sender ON messages (sender_id);
CREATE INDEX IF NOT EXISTS ix_messages_thread ON messages (thread_id);

CREATE TABLE IF NOT EXISTS message_recipients (
  id         BIGSERIAL PRIMARY KEY,
  message_id BIGINT       NOT NULL,
  user_id    BIGINT       NOT NULL,

  folder     VARCHAR(255) NOT NULL DEFAULT 'INBOX',
  is_read    BOOLEAN      NOT NULL DEFAULT FALSE,
  read_at    TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ  NOT NULL,

  CONSTRAINT uk_msg_recipient UNIQUE (message_id, user_id),
  CONSTRAINT fk_mr_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
  CONSTRAINT fk_mr_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_mr_message ON message_recipients (message_id);
CREATE INDEX IF NOT EXISTS ix_mr_user    ON message_recipients (user_id);
