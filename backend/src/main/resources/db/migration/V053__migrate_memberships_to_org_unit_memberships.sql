-- V053: Bestehende Einträge aus user_org_roles + user_team_memberships in org_unit_memberships kopieren.
-- ON CONFLICT DO NOTHING – safe bei Wiederholung und bei bereits per Dual-Write eingefügten Zeilen.

-- 1. Rollenzuweisungen aus user_org_roles
INSERT INTO org_unit_memberships
    (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
SELECT
    uor.user_id,
    uor.org_unit_id,
    uor.role,
    NULL,
    FALSE,
    uor.enabled,
    uor.created_at,
    uor.updated_at
FROM user_org_roles uor
ON CONFLICT DO NOTHING;

-- 2. Team-Mitgliedschaften aus user_team_memberships
INSERT INTO org_unit_memberships
    (user_id, org_unit_id, role, membership_type, is_primary, enabled, created_at, updated_at)
SELECT
    utm.user_id,
    utm.team_org_unit_id,
    NULL,
    utm.membership_type,
    utm.is_primary,
    utm.enabled,
    utm.created_at,
    utm.updated_at
FROM user_team_memberships utm
ON CONFLICT DO NOTHING;
