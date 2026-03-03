-- Flyway migration V008

CREATE TABLE IF NOT EXISTS falloeffnung_notizen (
  id                 BIGSERIAL PRIMARY KEY,
  falloeffnung_id    BIGINT       NOT NULL,
  created_by_user_id BIGINT       NOT NULL,
  typ                VARCHAR(100),
  text               VARCHAR(8000) NOT NULL,
  visibility         VARCHAR(20)  NOT NULL DEFAULT 'INTERN',
  created_at         TIMESTAMPTZ  NOT NULL,
  updated_at         TIMESTAMPTZ  NOT NULL,

  CONSTRAINT fk_fon_fall      FOREIGN KEY (falloeffnung_id)    REFERENCES falloeffnungen(id),
  CONSTRAINT fk_fon_createdby FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ix_falloeffnung_notiz_fall ON falloeffnung_notizen (falloeffnung_id);
