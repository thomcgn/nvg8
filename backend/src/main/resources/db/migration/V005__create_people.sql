-- Flyway migration V005

CREATE TABLE IF NOT EXISTS kinder (
  id                         BIGSERIAL PRIMARY KEY,

  traeger_id                 BIGINT      NOT NULL,
  owner_einrichtung_org_unit_id BIGINT   NOT NULL,

  vorname                    VARCHAR(100),
  nachname                   VARCHAR(100),
  geburtsdatum               DATE,
  gender                     VARCHAR(20),
  telefon                    VARCHAR(50),
  kontakt_email              VARCHAR(254),
  strasse                    VARCHAR(200),
  hausnummer                 VARCHAR(30),
  plz                        VARCHAR(10),
  ort                        VARCHAR(120),

  foerderbedarf              BOOLEAN     NOT NULL DEFAULT FALSE,
  foerderbedarf_details      VARCHAR(1000),
  gesundheits_hinweise       VARCHAR(1000),

  created_at                 TIMESTAMPTZ NOT NULL,
  updated_at                 TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_kinder_traeger   FOREIGN KEY (traeger_id) REFERENCES traeger(id),
  CONSTRAINT fk_kinder_owner_ou  FOREIGN KEY (owner_einrichtung_org_unit_id) REFERENCES org_units(id)
);

CREATE INDEX IF NOT EXISTS ix_kinder_traeger ON kinder (traeger_id);
CREATE INDEX IF NOT EXISTS ix_kinder_owner_ou ON kinder (owner_einrichtung_org_unit_id);

CREATE TABLE IF NOT EXISTS bezugspersonen (
  id                         BIGSERIAL PRIMARY KEY,

  traeger_id                 BIGINT      NOT NULL,
  owner_einrichtung_org_unit_id BIGINT   NOT NULL,

  vorname                    VARCHAR(100),
  nachname                   VARCHAR(100),
  geburtsdatum               DATE,
  gender                     VARCHAR(20),
  telefon                    VARCHAR(50),
  kontakt_email              VARCHAR(254),
  strasse                    VARCHAR(200),
  hausnummer                 VARCHAR(30),
  plz                        VARCHAR(10),
  ort                        VARCHAR(120),

  created_at                 TIMESTAMPTZ NOT NULL,
  updated_at                 TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_bezug_traeger   FOREIGN KEY (traeger_id) REFERENCES traeger(id),
  CONSTRAINT fk_bezug_owner_ou  FOREIGN KEY (owner_einrichtung_org_unit_id) REFERENCES org_units(id)
);

CREATE INDEX IF NOT EXISTS ix_bezug_traeger ON bezugspersonen (traeger_id);
CREATE INDEX IF NOT EXISTS ix_bezug_owner_ou ON bezugspersonen (owner_einrichtung_org_unit_id);

CREATE TABLE IF NOT EXISTS kind_bezugspersonen (
  id              BIGSERIAL PRIMARY KEY,
  kind_id         BIGINT      NOT NULL,
  bezugsperson_id BIGINT      NOT NULL,

  beziehung       VARCHAR(50) NOT NULL,
  sorgerecht      VARCHAR(50) NOT NULL DEFAULT 'UNGEKLAERT',
  valid_from      DATE        NOT NULL,
  valid_to        DATE,
  hauptkontakt    BOOLEAN     NOT NULL DEFAULT FALSE,
  lebt_im_haushalt BOOLEAN    NOT NULL DEFAULT FALSE,
  enabled         BOOLEAN     NOT NULL DEFAULT TRUE,

  created_at      TIMESTAMPTZ NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_kbp_kind   FOREIGN KEY (kind_id) REFERENCES kinder(id),
  CONSTRAINT fk_kbp_bezug  FOREIGN KEY (bezugsperson_id) REFERENCES bezugspersonen(id)
);

CREATE INDEX IF NOT EXISTS ix_kbp_kind   ON kind_bezugspersonen (kind_id);
CREATE INDEX IF NOT EXISTS ix_kbp_bezug  ON kind_bezugspersonen (bezugsperson_id);
CREATE INDEX IF NOT EXISTS ix_kbp_active ON kind_bezugspersonen (kind_id, valid_to);
