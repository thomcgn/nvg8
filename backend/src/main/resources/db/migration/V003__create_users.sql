-- Flyway migration V003

CREATE TABLE IF NOT EXISTS users (
  id                         BIGSERIAL PRIMARY KEY,

  email                      VARCHAR(254) NOT NULL,
  password_hash              VARCHAR(255) NOT NULL,
  enabled                    BOOLEAN      NOT NULL DEFAULT TRUE,
  last_login                 TIMESTAMPTZ,

  default_traeger_id         BIGINT,
  default_org_unit_id        BIGINT,

  -- Person (MappedSuperclass)
  vorname                    VARCHAR(255),
  nachname                   VARCHAR(255),

  staatsangehoerigkeit_iso2       VARCHAR(2),
  staatsangehoerigkeit_sonderfall VARCHAR(50) NOT NULL DEFAULT 'KEINER',
  staatsangehoerigkeit_gruppe     VARCHAR(50) NOT NULL DEFAULT 'UNBEKANNT',

  aufenthaltstitel_typ       VARCHAR(50),
  aufenthaltstitel_details   VARCHAR(200),

  -- KommunikationsProfil (Embedded, AttributeOverrides)
  kp_muttersprache_code            VARCHAR(15),
  kp_bevorzugte_sprache_code       VARCHAR(15),
  kp_dolmetsch_bedarf              VARCHAR(50) NOT NULL DEFAULT 'UNGEKLAERT',
  kp_dolmetsch_sprache_code        VARCHAR(15),
  kp_hoer_status                   VARCHAR(50) NOT NULL DEFAULT 'UNBEKANNT',
  kp_coda_status                   VARCHAR(50) NOT NULL DEFAULT 'UNBEKANNT',
  kp_gebaerdensprache_code         VARCHAR(20),
  kp_kommunikations_hinweise       VARCHAR(500),

  -- Adresse / Kontakt
  strasse                   VARCHAR(255),
  hausnummer                VARCHAR(255),
  plz                       VARCHAR(255),
  ort                       VARCHAR(255),
  telefon                   VARCHAR(255),
  kontakt_email             VARCHAR(255),

  created_at                TIMESTAMPTZ NOT NULL,
  updated_at                TIMESTAMPTZ NOT NULL,

  CONSTRAINT uk_users_email UNIQUE (email),
  CONSTRAINT fk_users_default_traeger FOREIGN KEY (default_traeger_id)  REFERENCES traeger(id),
  CONSTRAINT fk_users_default_orgunit FOREIGN KEY (default_org_unit_id) REFERENCES org_units(id)
);
