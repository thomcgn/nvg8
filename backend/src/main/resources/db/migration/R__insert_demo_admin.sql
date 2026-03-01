-- =====================================================
-- 1. Demo Träger anlegen
-- =====================================================

INSERT INTO traeger (id, name, slug, akten_prefix, enabled, kurzcode, created_at, updated_at)
VALUES (1, 'KIDOC', 'demo-traeger', 'KID', true, 'DEMO', now(), now());


-- =====================================================
-- 2. OrgUnits anlegen: Träger + EINRICHTUNG darunter
-- =====================================================

-- Träger-OrgUnit
INSERT INTO org_units (id, traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES (1, 1, 'TRAEGER', 'KIDOC', NULL, true, now(), now());

-- Einrichtung-OrgUnit (wichtig: type = EINRICHTUNG)
INSERT INTO org_units (id, traeger_id, type, name, parent_id, enabled, created_at, updated_at)
VALUES (2, 1, 'EINRICHTUNG', 'Gesamtschule MS Mitte', 1, true, now(), now());


-- =====================================================
-- 3. User anlegen (Passwort: demo)
-- =====================================================

INSERT INTO users (
    id,
    email,
    password_hash,
    enabled,
    default_traeger_id,
    default_org_unit_id,
    created_at,
    updated_at,
    vorname,
    nachname
)
VALUES (
           1,
           'demo@kidoc.local',
           '$2b$10$ttZ/gNAS8sSgJ3NRk8rnv.WfTxcbyyRPER0.XGeSNv1wSSWDUG3Gq',
           true,
           1,
           2,  -- ✅ Default OrgUnit auf EINRICHTUNG setzen
           now(),
           now(),
           'D.',
           'Emo'
       );


-- =====================================================
-- 4. Nur Admin-Rolle vergeben (auf EINRICHTUNG!)
-- =====================================================

INSERT INTO user_org_roles (user_id, org_unit_id, role, enabled, created_at, updated_at)
VALUES
    (1, 2, 'TRAEGER_ADMIN', true, now(), now());