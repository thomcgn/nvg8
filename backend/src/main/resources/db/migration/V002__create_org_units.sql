-- Flyway migration V002

CREATE TABLE IF NOT EXISTS org_units (
  id          BIGSERIAL PRIMARY KEY,
  traeger_id  BIGINT       NOT NULL,
  type        VARCHAR(30)  NOT NULL,
  name        VARCHAR(120) NOT NULL,
  parent_id   BIGINT,
  enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ  NOT NULL,
  updated_at  TIMESTAMPTZ  NOT NULL,

  CONSTRAINT uk_orgunit_traeger_parent_name UNIQUE (traeger_id, parent_id, name),
  CONSTRAINT fk_orgunit_traeger FOREIGN KEY (traeger_id) REFERENCES traeger(id),
  CONSTRAINT fk_orgunit_parent  FOREIGN KEY (parent_id)  REFERENCES org_units(id)
);

CREATE INDEX IF NOT EXISTS ix_orgunit_traeger_type ON org_units (traeger_id, type);
CREATE INDEX IF NOT EXISTS ix_orgunit_parent       ON org_units (parent_id);
