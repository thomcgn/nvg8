-- Flyway migration V010

CREATE TABLE IF NOT EXISTS invites (
  id                  BIGSERIAL PRIMARY KEY,
  version             BIGINT      NOT NULL DEFAULT 0,

  email               VARCHAR(254) NOT NULL,
  token_hash          VARCHAR(64)  NOT NULL,
  traeger_id          BIGINT       NOT NULL,
  org_unit_id         BIGINT       NOT NULL,

  expires_at          TIMESTAMPTZ  NOT NULL,
  used_at             TIMESTAMPTZ,
  created_by_user_id  BIGINT,
  accepted_by_user_id BIGINT,

  revoked             BOOLEAN      NOT NULL DEFAULT FALSE,

  created_at          TIMESTAMPTZ  NOT NULL,
  updated_at          TIMESTAMPTZ  NOT NULL,

  CONSTRAINT uk_invites_token_hash UNIQUE (token_hash),
  CONSTRAINT fk_invite_traeger FOREIGN KEY (traeger_id) REFERENCES traeger(id),
  CONSTRAINT fk_invite_orgunit FOREIGN KEY (org_unit_id) REFERENCES org_units(id),
  CONSTRAINT fk_invite_created_by  FOREIGN KEY (created_by_user_id)  REFERENCES users(id),
  CONSTRAINT fk_invite_accepted_by FOREIGN KEY (accepted_by_user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS ix_invite_token_hash   ON invites (token_hash);
CREATE INDEX IF NOT EXISTS ix_invite_email        ON invites (email);
CREATE INDEX IF NOT EXISTS ix_invite_expires      ON invites (expires_at);
CREATE INDEX IF NOT EXISTS ix_invite_token_active ON invites (token_hash, revoked, used_at);

-- ElementCollection invite_roles
CREATE TABLE IF NOT EXISTS invite_roles (
  invite_id BIGINT      NOT NULL,
  role      VARCHAR(40) NOT NULL,
  CONSTRAINT fk_invite_roles_invite FOREIGN KEY (invite_id) REFERENCES invites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_invite_roles_invite ON invite_roles (invite_id);
