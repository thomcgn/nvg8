-- Flyway migration V006

CREATE TABLE IF NOT EXISTS kind_dossiers (
  id         BIGSERIAL PRIMARY KEY,
  traeger_id BIGINT      NOT NULL,
  kind_id    BIGINT      NOT NULL,
  enabled    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,

  CONSTRAINT uk_dossier_traeger_kind UNIQUE (traeger_id, kind_id),
  CONSTRAINT fk_dossier_traeger FOREIGN KEY (traeger_id) REFERENCES traeger(id),
  CONSTRAINT fk_dossier_kind   FOREIGN KEY (kind_id)    REFERENCES kinder(id)
);

CREATE INDEX IF NOT EXISTS ix_dossier_traeger ON kind_dossiers (traeger_id);
CREATE INDEX IF NOT EXISTS ix_dossier_kind   ON kind_dossiers (kind_id);
