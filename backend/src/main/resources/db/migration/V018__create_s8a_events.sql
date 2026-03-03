-- Flyway migration V018

CREATE TABLE IF NOT EXISTS s8a_events (
  id                 BIGSERIAL PRIMARY KEY,
  s8a_case_id         BIGINT      NOT NULL,
  type               VARCHAR(40) NOT NULL,
  payload_json       TEXT,
  text               VARCHAR(2000),
  created_by_user_id BIGINT      NOT NULL,

  created_at         TIMESTAMPTZ NOT NULL,
  updated_at         TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_s8a_event_case FOREIGN KEY (s8a_case_id) REFERENCES s8a_cases(id) ON DELETE CASCADE,
  CONSTRAINT fk_s8a_event_createdby FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ix_s8a_event_case ON s8a_events (s8a_case_id);
CREATE INDEX IF NOT EXISTS ix_s8a_event_type ON s8a_events (type);
