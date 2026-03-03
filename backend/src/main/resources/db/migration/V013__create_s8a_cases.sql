-- Flyway migration V013

CREATE TABLE IF NOT EXISTS s8a_cases (
  id                      BIGSERIAL PRIMARY KEY,
  falloeffnung_id         BIGINT      NOT NULL,
  traeger_id              BIGINT      NOT NULL,
  einrichtung_org_unit_id BIGINT      NOT NULL,

  status                  VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  risk_level              VARCHAR(20) NOT NULL DEFAULT 'UNGEKLAERT',
  title                   VARCHAR(200),

  created_by_user_id      BIGINT      NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL,
  updated_at              TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_s8a_fall FOREIGN KEY (falloeffnung_id) REFERENCES falloeffnungen(id),
  CONSTRAINT fk_s8a_traeger FOREIGN KEY (traeger_id) REFERENCES traeger(id),
  CONSTRAINT fk_s8a_einr_ou FOREIGN KEY (einrichtung_org_unit_id) REFERENCES org_units(id),
  CONSTRAINT fk_s8a_createdby FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ix_s8a_falloeffnung ON s8a_cases (falloeffnung_id);
CREATE INDEX IF NOT EXISTS ix_s8a_status       ON s8a_cases (status);
