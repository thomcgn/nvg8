-- V054: Alte Membership-Tabellen entfernen.
-- Voraussetzung: V052 (neue Tabelle) + V053 (Datenmigration) + Phase 4 (Reads umgestellt).

ALTER TABLE user_org_roles    DROP CONSTRAINT IF EXISTS fk_user_org_roles_user;
ALTER TABLE user_org_roles    DROP CONSTRAINT IF EXISTS fk_user_org_roles_org_unit;
ALTER TABLE user_team_memberships DROP CONSTRAINT IF EXISTS fk_user_team_memberships_user;
ALTER TABLE user_team_memberships DROP CONSTRAINT IF EXISTS fk_user_team_memberships_team_org_unit;

DROP TABLE IF EXISTS user_org_roles;
DROP TABLE IF EXISTS user_team_memberships;
