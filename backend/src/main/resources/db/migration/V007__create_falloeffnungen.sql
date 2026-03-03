-- Flyway migration V007

CREATE TABLE IF NOT EXISTS falloeffnungen (
  id                      BIGSERIAL PRIMARY KEY,
  dossier_id              BIGINT      NOT NULL,
  traeger_id              BIGINT      NOT NULL,
  einrichtung_org_unit_id BIGINT      NOT NULL,
  team_org_unit_id        BIGINT,
  status                  VARCHAR(30) NOT NULL,
  titel                   VARCHAR(200),
  kurzbeschreibung         VARCHAR(2000),
  created_by_user_id      BIGINT      NOT NULL,
  aktenzeichen            VARCHAR(50) NOT NULL,
  opened_at               TIMESTAMPTZ NOT NULL,
  closed_at               TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL,
  updated_at              TIMESTAMPTZ NOT NULL,

  CONSTRAINT uk_fall_aktenzeichen UNIQUE (aktenzeichen),
  CONSTRAINT fk_fall_dossier   FOREIGN KEY (dossier_id)              REFERENCES kind_dossiers(id),
  CONSTRAINT fk_fall_traeger   FOREIGN KEY (traeger_id)              REFERENCES traeger(id),
  CONSTRAINT fk_fall_einr_ou   FOREIGN KEY (einrichtung_org_unit_id) REFERENCES org_units(id),
  CONSTRAINT fk_fall_team_ou   FOREIGN KEY (team_org_unit_id)        REFERENCES org_units(id),
  CONSTRAINT fk_fall_createdby FOREIGN KEY (created_by_user_id)      REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ix_falloeffnung_traeger_einr ON falloeffnungen (traeger_id, einrichtung_org_unit_id);
CREATE INDEX IF NOT EXISTS ix_falloeffnung_dossier      ON falloeffnungen (dossier_id);
CREATE INDEX IF NOT EXISTS ix_falloeffnung_status       ON falloeffnungen (status);
