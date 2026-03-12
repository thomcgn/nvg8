-- V052: Unified org unit membership table (Phase 1: dual-write alongside existing tables)
--
-- Ersetzt langfristig user_org_roles + user_team_memberships.
-- In dieser Phase wird nur dual-write betrieben, Reads laufen noch über die alten Tabellen.

CREATE TABLE org_unit_memberships (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT NOT NULL REFERENCES users(id),
    org_unit_id     BIGINT NOT NULL REFERENCES org_units(id),
    role            VARCHAR(40),            -- aus user_org_roles (FACHKRAFT, TEAMLEITUNG, ...)
    membership_type VARCHAR(50),            -- aus user_team_memberships (MITGLIED, PRAKTIKANT, ...)
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    enabled         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE,
    updated_at      TIMESTAMP WITH TIME ZONE
);

-- Eindeutigkeit: eine Kombination aus (user, orgUnit, role, membershipType) darf nur einmal existieren
-- COALESCE weil NULL != NULL in unique-Vergleichen
CREATE UNIQUE INDEX uk_oum_user_org_role_type
    ON org_unit_memberships (user_id, org_unit_id, COALESCE(role, ''), COALESCE(membership_type, ''));

CREATE INDEX ix_oum_user       ON org_unit_memberships (user_id);
CREATE INDEX ix_oum_org_unit   ON org_unit_memberships (org_unit_id);
