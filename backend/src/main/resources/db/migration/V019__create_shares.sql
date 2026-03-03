-- Flyway migration V019

CREATE TABLE IF NOT EXISTS external_partners (
  id            BIGSERIAL PRIMARY KEY,
  name          VARCHAR(200) NOT NULL,
  type          VARCHAR(40)  NOT NULL,
  contact_email VARCHAR(254),
  notes         VARCHAR(500),
  created_at    TIMESTAMPTZ NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL,
  CONSTRAINT uk_partner_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS case_share_requests (
  id                              BIGSERIAL PRIMARY KEY,
  partner_id                      BIGINT      NOT NULL,
  falloeffnung_id                 BIGINT      NOT NULL,
  owning_traeger_id               BIGINT      NOT NULL,
  owning_einrichtung_org_unit_id   BIGINT      NOT NULL,
  requested_by_user_id            BIGINT      NOT NULL,

  status                          VARCHAR(30) NOT NULL DEFAULT 'OPEN',
  legal_basis_type                VARCHAR(40) NOT NULL DEFAULT 'UNKLAR',
  purpose                         VARCHAR(1000) NOT NULL,

  notes_from                       TIMESTAMPTZ,
  notes_to                         TIMESTAMPTZ,

  decided_at                      TIMESTAMPTZ,
  decided_by_user_id              BIGINT,
  decision_reason                 VARCHAR(1000),

  created_at                      TIMESTAMPTZ NOT NULL,
  updated_at                      TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_csr_partner FOREIGN KEY (partner_id) REFERENCES external_partners(id),
  CONSTRAINT fk_csr_fall    FOREIGN KEY (falloeffnung_id) REFERENCES falloeffnungen(id),
  CONSTRAINT fk_csr_traeger FOREIGN KEY (owning_traeger_id) REFERENCES traeger(id),
  CONSTRAINT fk_csr_ou      FOREIGN KEY (owning_einrichtung_org_unit_id) REFERENCES org_units(id),
  CONSTRAINT fk_csr_reqby   FOREIGN KEY (requested_by_user_id) REFERENCES users(id),
  CONSTRAINT fk_csr_decby   FOREIGN KEY (decided_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ix_csr_partner ON case_share_requests (partner_id);
CREATE INDEX IF NOT EXISTS ix_csr_fall    ON case_share_requests (falloeffnung_id);

CREATE TABLE IF NOT EXISTS case_transfer_packages (
  id             BIGSERIAL PRIMARY KEY,
  share_request_id BIGINT     NOT NULL UNIQUE,
  expires_at     TIMESTAMPTZ NOT NULL,
  payload_json   TEXT        NOT NULL,
  token_hash     VARCHAR(64) NOT NULL,
  max_downloads  INT         NOT NULL DEFAULT 5,
  download_count INT         NOT NULL DEFAULT 0,

  created_at     TIMESTAMPTZ NOT NULL,
  updated_at     TIMESTAMPTZ NOT NULL,

  CONSTRAINT fk_pkg_req FOREIGN KEY (share_request_id) REFERENCES case_share_requests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_pkg_req       ON case_transfer_packages (share_request_id);
CREATE INDEX IF NOT EXISTS ix_pkg_token_hash ON case_transfer_packages (token_hash);
CREATE INDEX IF NOT EXISTS ix_pkg_expires    ON case_transfer_packages (expires_at);
