CREATE TABLE IF NOT EXISTS user_team_memberships (
                                                     id BIGSERIAL PRIMARY KEY,
                                                     user_id BIGINT NOT NULL,
                                                     team_org_unit_id BIGINT NOT NULL,
                                                     membership_type VARCHAR(50) NOT NULL,
                                                     is_primary BOOLEAN NOT NULL DEFAULT FALSE,
                                                     enabled BOOLEAN NOT NULL DEFAULT TRUE,
                                                     created_at TIMESTAMP WITH TIME ZONE,
                                                     updated_at TIMESTAMP WITH TIME ZONE,

                                                     CONSTRAINT fk_user_team_memberships_user
                                                         FOREIGN KEY (user_id) REFERENCES users (id),

                                                     CONSTRAINT fk_user_team_memberships_team_org_unit
                                                         FOREIGN KEY (team_org_unit_id) REFERENCES org_units (id),

                                                     CONSTRAINT uk_user_team_memberships_user_team
                                                         UNIQUE (user_id, team_org_unit_id)
);

CREATE INDEX IF NOT EXISTS idx_user_team_memberships_team
    ON user_team_memberships (team_org_unit_id);

CREATE INDEX IF NOT EXISTS idx_user_team_memberships_user
    ON user_team_memberships (user_id);