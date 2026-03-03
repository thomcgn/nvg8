-- Flyway migration V011

CREATE TABLE IF NOT EXISTS audit_events (
  id          BIGSERIAL PRIMARY KEY,
  traeger_id  BIGINT      NOT NULL,
  org_unit_id BIGINT,
  user_id     BIGINT      NOT NULL,

  action      VARCHAR(60) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id   BIGINT      NOT NULL,

  message     VARCHAR(2000),

  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_audit_traeger FOREIGN KEY (traeger_id) REFERENCES traeger(id),
  CONSTRAINT fk_audit_orgunit FOREIGN KEY (org_unit_id) REFERENCES org_units(id),
  CONSTRAINT fk_audit_user    FOREIGN KEY (user_id)    REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ix_audit_traeger_created ON audit_events (traeger_id, created_at);
CREATE INDEX IF NOT EXISTS ix_audit_entity         ON audit_events (entity_type, entity_id);
