-- Flyway migration V004

CREATE TABLE IF NOT EXISTS user_org_roles (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT      NOT NULL,
  org_unit_id BIGINT      NOT NULL,
  role        VARCHAR(40) NOT NULL,
  enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL,

  CONSTRAINT uk_user_org_role UNIQUE (user_id, org_unit_id, role),
  CONSTRAINT fk_uor_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_uor_org  FOREIGN KEY (org_unit_id) REFERENCES org_units(id)
);

CREATE INDEX IF NOT EXISTS ix_uor_user ON user_org_roles (user_id);
CREATE INDEX IF NOT EXISTS ix_uor_org  ON user_org_roles (org_unit_id);
